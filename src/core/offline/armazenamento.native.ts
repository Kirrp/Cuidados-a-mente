import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import type { Pendente } from './armazenamento';
import type { Registro } from '@/core/api/cliente-api';

let banco: SQLite.SQLiteDatabase | null = null;
let escopo = '';
let habilitado = false;
let abertura: Promise<SQLite.SQLiteDatabase> | null = null;
let geracao = 0;
let mutacoes: Promise<void> = Promise.resolve();
const VALIDADE_CACHE_MS = 15 * 60 * 1000;
const MAXIMO_CARACTERES_POR_ITEM = 500_000;
const MAXIMO_CARACTERES_CACHE = 5_000_000;
const MAXIMO_ALTERACOES_PENDENTES = 100;
// A troca de sessão espera uma escrita nativa terminar e limpar seu resultado
// antigo antes de permitir gravações da conta nova nas mesmas chaves.
function alterarBanco<T>(operacao: () => Promise<T>): Promise<T> {
  const atual = mutacoes.then(operacao);
  mutacoes = atual.then(
    () => {},
    () => {},
  );
  return atual;
}
function estadoAtual() {
  return { escopo, geracao };
}
function conferirEstado(estado: ReturnType<typeof estadoAtual>) {
  if (estado.geracao !== geracao) {
    throw new Error('A sessão offline mudou durante a operação. Abra a tela novamente.');
  }
}
async function abrir() {
  if (banco) {
    return banco;
  }
  if (abertura) {
    return abertura;
  }
  abertura = abrirBanco().finally(() => {
    abertura = null;
  });
  return abertura;
}
async function abrirBanco() {
  let chave = await SecureStore.getItemAsync('cuidados.offline.key');
  if (!chave) {
    chave = Array.from(await Crypto.getRandomBytesAsync(32))
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
    await SecureStore.setItemAsync('cuidados.offline.key', chave);
  }
  const db = await SQLite.openDatabaseAsync('cuidados-offline.db');
  try {
    const suporte = await db.getFirstAsync<Record<string, string>>('PRAGMA cipher_version');
    if (!suporte || !Object.values(suporte)[0]) {
      throw new Error(
        'Este aplicativo não tem SQLCipher. Instale uma build com armazenamento protegido para usar offline.',
      );
    }
    // A chave é hexadecimal gerada localmente; nenhum texto de usuário entra no PRAGMA.
    await db.execAsync('PRAGMA key = "x\'' + chave + '\'";');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS cache (chave TEXT PRIMARY KEY, escopo TEXT NOT ' +
        'NULL, dados TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT ' +
        'EXISTS pending (id TEXT PRIMARY KEY, escopo TEXT NOT NULL, caminho TEXT NOT ' +
        'NULL, metodo TEXT NOT NULL, corpo TEXT NOT NULL, erro TEXT NOT NULL DEFAULT ' +
        "'', instante INTEGER NOT NULL);",
    );
    banco = db;
    return db;
  } catch (erro) {
    await db.closeAsync().catch(() => {});
    throw erro;
  }
}
export async function configurarOffline(token: string | null) {
  const estado = { escopo, geracao: ++geracao };
  habilitado = false;
  const novo = token
    ? await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token)
    : '';
  conferirEstado(estado);
  if (escopo && novo !== escopo) {
    await limparDados(estado.escopo);
  }
  conferirEstado(estado);
  const ativar = !!token && (await SecureStore.getItemAsync('cuidados.offline.enabled')) === '1';
  conferirEstado(estado);
  escopo = novo;
  if (ativar) {
    const db = await abrir();
    conferirEstado(estado);
    await alterarBanco(async () => {
      conferirEstado(estado);
      await db.runAsync('DELETE FROM cache WHERE escopo<>? OR expires<?', novo, Date.now());
      conferirEstado(estado);
      await db.runAsync('DELETE FROM pending WHERE escopo<>?', novo);
      conferirEstado(estado);
    });
  }
  habilitado = ativar;
}
export async function habilitarOffline(valor: boolean) {
  const estado = { escopo, geracao: ++geracao };
  habilitado = false;
  if (valor) {
    await abrir();
  } else {
    await limparDados(estado.escopo);
  }
  conferirEstado(estado);
  await SecureStore.setItemAsync('cuidados.offline.enabled', valor ? '1' : '0');
  conferirEstado(estado);
  habilitado = valor;
}
export async function offlineHabilitado() {
  return habilitado;
}
export async function guardarCache(chave: string, dados: unknown) {
  if (
    !habilitado ||
    !escopo ||
    !(chave === '/idosos' || chave === '/auth/me' || chave.startsWith('/registros?'))
  ) {
    return;
  }
  const estado = estadoAtual();
  const seguro =
    chave.startsWith('/registros?') && Array.isArray(dados)
      ? dados.map((r) => ({ ...r, midia: '' }))
      : dados;
  const texto = JSON.stringify(seguro);
  if (texto.length > MAXIMO_CARACTERES_POR_ITEM) {
    return;
  }
  const db = await abrir();
  conferirEstado(estado);
  await db.runAsync('DELETE FROM cache WHERE expires<?', Date.now());
  conferirEstado(estado);
  const tamanho = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(length(dados)),0) AS total FROM cache WHERE chave<>?',
    chave,
  );
  conferirEstado(estado);
  if ((tamanho?.total || 0) + texto.length > MAXIMO_CARACTERES_CACHE) {
    return;
  }
  const expira =
    chave === '/auth/me' && typeof (dados as { sessaoExpira?: number })?.sessaoExpira === 'number'
      ? Math.min(
          Date.now() + VALIDADE_CACHE_MS,
          (dados as { sessaoExpira: number }).sessaoExpira * 1000,
        )
      : Date.now() + VALIDADE_CACHE_MS;
  await alterarBanco(async () => {
    conferirEstado(estado);
    await db.runAsync(
      'INSERT INTO cache(chave,escopo,dados,expires) VALUES(?,?,?,?) ON ' +
        'CONFLICT(chave) DO UPDATE SET ' +
        'dados=excluded.dados,expires=excluded.expires,escopo=excluded.escopo',
      chave,
      estado.escopo,
      texto,
      expira,
    );
    if (estado.geracao !== geracao) {
      await db.runAsync('DELETE FROM cache WHERE chave=? AND escopo=?', chave, estado.escopo);
    }
    conferirEstado(estado);
  });
}
export async function lerCache<T>(chave: string): Promise<T | undefined> {
  if (!habilitado || !escopo) {
    return undefined;
  }
  const estado = estadoAtual();
  const db = await abrir();
  conferirEstado(estado);
  const row = await db.getFirstAsync<{ dados: string }>(
    'SELECT dados FROM cache WHERE chave=? AND escopo=? AND expires>?',
    chave,
    estado.escopo,
    Date.now(),
  );
  conferirEstado(estado);
  if (!row) {
    return undefined;
  }
  let dados = JSON.parse(row.dados);
  if (chave.startsWith('/registros?') && Array.isArray(dados)) {
    for (const p of await listarPendentes()) {
      conferirEstado(estado);
      const corpo = JSON.parse(p.corpo);
      if (
        p.metodo === 'POST' &&
        corpo.idosoId === new URLSearchParams(chave.split('?')[1]).get('idosoId') &&
        corpo.tipo === new URLSearchParams(chave.split('?')[1]).get('tipo')
      ) {
        dados.push({ ...corpo, id: 'local-' + p.id, versao: 1, sincronizacaoPendente: true });
      }
      if (p.metodo === 'PUT') {
        dados = dados.map((r: Registro) =>
          p.caminho.endsWith('/' + r.id) ? { ...corpo, sincronizacaoPendente: true } : r,
        );
      }
      if (p.metodo === 'DELETE') {
        dados = dados.filter((r: Registro) => !p.caminho.endsWith('/' + r.id));
      }
    }
  }
  conferirEstado(estado);
  return dados as T;
}
export async function limparOffline() {
  const anterior = escopo;
  geracao++;
  await limparDados(anterior);
}
async function limparDados(escopoAnterior: string) {
  const db = banco;
  if (!db) {
    return;
  }
  await alterarBanco(async () => {
    await db.runAsync('DELETE FROM cache WHERE escopo=?', escopoAnterior);
    await db.runAsync('DELETE FROM pending WHERE escopo=?', escopoAnterior);
  });
}
export async function listarPendentes(): Promise<Pendente[]> {
  if (!habilitado || !escopo) {
    return [];
  }
  const estado = estadoAtual();
  const db = await abrir();
  conferirEstado(estado);
  const itens = await db.getAllAsync<Pendente>(
    'SELECT id,caminho,metodo,corpo,erro FROM pending WHERE escopo=? ORDER BY instante,id',
    estado.escopo,
  );
  conferirEstado(estado);
  return itens;
}
export async function removerPendente(id: string) {
  if (banco) {
    await banco.runAsync('DELETE FROM pending WHERE id=? AND escopo=?', id, escopo);
  }
}
export async function marcarErroPendente(id: string, erro: string) {
  if (banco) {
    await banco.runAsync('UPDATE pending SET erro=? WHERE id=? AND escopo=?', erro, id, escopo);
  }
}
export async function enfileirar<T>(caminho: string, metodo: string, corpo: unknown): Promise<T> {
  if (
    !habilitado ||
    !escopo ||
    !/^\/registros(?:\/[a-f0-9-]{36})?$/.test(caminho) ||
    !['POST', 'PUT', 'DELETE'].includes(metodo)
  ) {
    throw new Error('Esta ação precisa de conexão com o servidor.');
  }
  const estado = estadoAtual();
  const db = await abrir();
  conferirEstado(estado);
  const id = Crypto.randomUUID();
  const dados: Record<string, unknown> = {
    ...(corpo as Record<string, unknown>),
    ...(metodo === 'POST'
      ? { mutationId: (corpo as { mutationId?: string })?.mutationId || id }
      : {}),
  };
  await alterarBanco(async () => {
    conferirEstado(estado);
    // Limites e conflitos são conferidos na mesma fila do INSERT. Duas ações
    // simultâneas não podem ambas validar uma lista ainda vazia ou com 99 itens.
    const lease = await db.getFirstAsync(
      "SELECT 1 FROM cache WHERE chave='/idosos' AND escopo=? AND expires>?",
      estado.escopo,
      Date.now(),
    );
    conferirEstado(estado);
    if (!lease) {
      throw new Error('A autorização offline expirou. Conecte-se para atualizar os acessos.');
    }
    const pendentes = await listarPendentes();
    conferirEstado(estado);
    if (pendentes.length >= MAXIMO_ALTERACOES_PENDENTES) {
      throw new Error('Sincronize as alterações pendentes antes de criar outras.');
    }
    if (metodo !== 'POST' && pendentes.some((p) => p.caminho === caminho)) {
      throw new Error(
        'Este registro já aguarda sincronização. Resolva a alteração pendente antes de editá-lo novamente.',
      );
    }
    await db.runAsync(
      'INSERT INTO pending(id,escopo,caminho,metodo,corpo,instante) VALUES(?,?,?,?,?,?)',
      id,
      estado.escopo,
      caminho,
      metodo,
      JSON.stringify(dados),
      Date.now(),
    );
    if (estado.geracao !== geracao) {
      await db.runAsync('DELETE FROM pending WHERE id=? AND escopo=?', id, estado.escopo);
    }
    conferirEstado(estado);
  });
  return (
    metodo === 'DELETE'
      ? undefined
      : {
          ...dados,
          id: caminho.split('/')[2] || 'local-' + id,
          versao: dados.versao || 1,
          status: dados.status || 'pendente',
          sincronizacaoPendente: true,
        }
  ) as T;
}
