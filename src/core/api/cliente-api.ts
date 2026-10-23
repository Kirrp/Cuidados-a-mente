import {
  configurarOffline,
  enfileirar,
  guardarCache,
  lerCache,
  limparOffline,
  listarPendentes,
  marcarErroPendente,
  removerPendente,
} from '@/core/offline/armazenamento';
import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';

// Tipos centrais usados no frontend para representar usuários, sessões e registros.
export type TipoUsuario = 'responsavel' | 'cuidador' | 'idoso';
export type Usuario = {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  perfil: string;
  legalAccepted: boolean;
  tema: 'claro' | 'escuro';
  sessaoExpira?: number;
  emailVerificado?: boolean;
  preferencias?: Preferencias;
};
export type Preferencias = {
  font_scale: number;
  notifications: number;
  notification_details: number;
  consultation_minutes: number;
};
export type Sessao = { token: string; usuario: Usuario };
export type Idoso = {
  id: string;
  nome: string;
  nascimento: string;
  observacoes: string;
  perfil: string;
  permissoes?: string[];
  dono?: boolean;
  podeVerLocalizacao?: boolean;
  contatoEmergencia?: {
    nome: string;
    telefone: string;
    nomeAlternativo?: string;
    telefoneAlternativo?: string;
  };
};
export type TipoRegistro = 'consultas' | 'medicamentos' | 'rotinas' | 'memorias';
export type Registro = {
  id: string;
  idosoId: string;
  tipo: TipoRegistro;
  titulo: string;
  data: string;
  horario: string;
  detalhes: string;
  status: 'pendente' | 'concluido';
  categoria?: string;
  midia?: string;
  versao: number;
  planoId?: string;
  fuso?: string;
  sincronizacaoPendente?: boolean;
};

// URL base da API. EXPO_PUBLIC_API_URL permite trocar o servidor sem editar o
// código. No emulador Android, 10.0.2.2 aponta para a máquina do desenvolvedor.
export const enderecoBaseApi = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api')
).replace(/\/$/, '');

// Cópia do token em memória, usada para montar o header das próximas chamadas.
// A persistência abaixo serve apenas para restaurar essa cópia ao reabrir o app.
let tokenSessao: string | null = null;
let versaoAcesso = 0;

// Salva o token de autenticação no armazenamento seguro do dispositivo ou no sessionStorage do web.
export async function salvarTokenSessao(novoToken: string | null) {
  if (novoToken !== tokenSessao) {
    versaoAcesso++;
  }
  tokenSessao = novoToken;
  await configurarOffline(novoToken);
  if (Platform.OS !== 'web') {
    if (novoToken) {
      await SecureStore.setItemAsync('cuidados.session', novoToken);
    } else {
      await SecureStore.deleteItemAsync('cuidados.session');
    }
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      if (novoToken) {
        window.sessionStorage.setItem('cuidados.session', novoToken);
      } else {
        window.sessionStorage.removeItem('cuidados.session');
      }
    } catch {}
  }
}
// Recupera o token salvo ao abrir o app, para manter a sessão ativa.
export async function lerTokenSessao() {
  if (Platform.OS !== 'web') {
    return SecureStore.getItemAsync('cuidados.session');
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      return window.sessionStorage.getItem('cuidados.session');
    } catch {}
  }
  return null;
}
// Erro customizado para representar falhas da API, incluindo status HTTP.
export class ErroRede extends Error {}
export class ErroSessaoAlterada extends Error {
  constructor() {
    super('O acesso mudou durante a operação. Abra a tela novamente.');
  }
}
export function obterTokenAtual() {
  return tokenSessao;
}
export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
// Função central para chamar a API.
// Ela adiciona o Authorization, converte o body em JSON, trata timeout e padroniza erros.
function conferirSessao(token: string | null, versao?: number) {
  if (token !== tokenSessao || (versao !== undefined && versao !== versaoAcesso)) {
    throw new ErroSessaoAlterada();
  }
}
async function limparAcessoRecusado(token: string | null, versao: number) {
  conferirSessao(token);
  if (versao === versaoAcesso) {
    versaoAcesso++;
    await limparOffline();
  }
}
async function requisitarOnline<T>(
  caminho: string,
  metodo = 'GET',
  corpo?: unknown,
  token = tokenSessao,
  versao = versaoAcesso,
): Promise<T> {
  // AbortController encerra chamadas que ficariam penduradas por mais de 12 s.
  const controlador = new AbortController();
  const limiteTempo = setTimeout(() => controlador.abort(), 12000);
  try {
    conferirSessao(token, versao);
    const resposta = await fetch(enderecoBaseApi + caminho, {
      method: metodo,
      signal: controlador.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
    });
    conferirSessao(token, versao);
    // Respostas 204 não possuem JSON; tentar lê-las causaria uma exceção.
    if (resposta.status === 204) {
      return undefined as T;
    }
    let dados;
    try {
      dados = await resposta.json();
    } catch {
      conferirSessao(token, versao);
      // Proxies podem devolver HTML. Uma resposta HTTP não comprova falta de rede
      // e não pode habilitar cache/fila depois de uma recusa de autorização.
      throw new ErroApi(
        resposta.ok
          ? 'O servidor enviou uma resposta inválida. Atualize a tela para conferir a operação.'
          : 'Não foi possível concluir a operação (HTTP ' + resposta.status + ').',
        resposta.status,
      );
    }
    conferirSessao(token, versao);
    if (!resposta.ok) {
      throw new ErroApi(
        typeof dados?.message === 'string'
          ? dados.message
          : 'Não foi possível concluir a operação.',
        resposta.status,
      );
    }
    return dados as T;
  } catch (erro) {
    // Só falhas de transporte podem ativar o modo offline.
    conferirSessao(token, versao);
    if (erro instanceof ErroApi || erro instanceof ErroSessaoAlterada) {
      throw erro;
    }
    throw new ErroRede(
      'Não foi possível acessar o servidor. Verifique se o backend está aberto e tente novamente.',
    );
  } finally {
    clearTimeout(limiteTempo);
  }
}

let sincronizando: { token: string | null; versao: number; promessa: Promise<void> } | null = null;
export function sincronizarPendentes() {
  const tokenInicial = tokenSessao;
  const versaoInicial = versaoAcesso;
  if (sincronizando?.token === tokenInicial && sincronizando.versao === versaoInicial) {
    return sincronizando.promessa;
  }
  const promessa = (async () => {
    const itens = await listarPendentes();
    conferirSessao(tokenInicial, versaoInicial);
    if (!itens.length) {
      return;
    }
    try {
      await requisitarOnline('/auth/me', 'GET', undefined, tokenInicial, versaoInicial);
      await requisitarOnline('/idosos', 'GET', undefined, tokenInicial, versaoInicial);
    } catch (erroCapturado) {
      conferirSessao(tokenInicial);
      if (erroCapturado instanceof ErroApi && [401, 403].includes(erroCapturado.status)) {
        await limparAcessoRecusado(tokenInicial, versaoInicial);
      }
      throw erroCapturado;
    }
    for (const item of itens) {
      conferirSessao(tokenInicial, versaoInicial);
      if (item.erro) {
        break;
      } // Conflitos exigem decisão humana; não sobrescrevemos o servidor.
      try {
        await requisitarOnline(
          item.caminho,
          item.metodo,
          JSON.parse(item.corpo),
          tokenInicial,
          versaoInicial,
        );
        await removerPendente(item.id);
      } catch (erroCapturado) {
        conferirSessao(tokenInicial);
        if (erroCapturado instanceof ErroApi && [401, 403, 404].includes(erroCapturado.status)) {
          await removerPendente(item.id);
          await limparAcessoRecusado(tokenInicial, versaoInicial);
          throw erroCapturado;
        }
        if (erroCapturado instanceof ErroApi) {
          await marcarErroPendente(item.id, erroCapturado.message);
          break;
        }
        throw erroCapturado;
      }
    }
  })().finally(() => {
    if (sincronizando?.promessa === promessa) {
      sincronizando = null;
    }
  });
  sincronizando = { token: tokenInicial, versao: versaoInicial, promessa };
  return promessa;
}
export async function requisitarApi<T>(
  caminho: string,
  metodo = 'GET',
  corpo?: unknown,
): Promise<T> {
  const tokenInicial = tokenSessao;
  const versaoInicial = versaoAcesso;
  // O mesmo recibo acompanha o primeiro envio e uma eventual repetição offline.
  // Se o servidor gravou antes de a conexão cair, ele devolve o registro existente.
  const dadosEnviados =
    caminho === '/registros' && metodo === 'POST'
      ? {
          ...(corpo as Record<string, unknown>),
          mutationId: (corpo as { mutationId?: string })?.mutationId || randomUUID(),
        }
      : corpo;
  try {
    if (caminho.startsWith('/registros') && metodo === 'GET') {
      await sincronizarPendentes();
    }
    const dados = await requisitarOnline<T>(
      caminho,
      metodo,
      dadosEnviados,
      tokenInicial,
      versaoInicial,
    );
    if (tokenInicial === tokenSessao && metodo === 'GET') {
      await guardarCache(caminho, dados).catch(() => {});
    }
    conferirSessao(tokenInicial, versaoInicial);
    return dados;
  } catch (erroCapturado) {
    conferirSessao(tokenInicial);
    if (erroCapturado instanceof ErroApi && [401, 403].includes(erroCapturado.status)) {
      await limparAcessoRecusado(tokenInicial, versaoInicial);
      throw erroCapturado;
    }
    conferirSessao(tokenInicial, versaoInicial);
    if (!(erroCapturado instanceof ErroRede) || tokenInicial !== tokenSessao) {
      throw erroCapturado;
    }
    if (metodo === 'GET') {
      const cache = await lerCache<T>(caminho);
      conferirSessao(tokenInicial, versaoInicial);
      if (cache !== undefined) {
        return cache;
      }
    }
    if (metodo !== 'GET') {
      const pendente = await enfileirar<T>(caminho, metodo, dadosEnviados);
      conferirSessao(tokenInicial, versaoInicial);
      return pendente;
    }
    throw erroCapturado;
  }
}
