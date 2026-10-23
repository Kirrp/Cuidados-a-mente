import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

// Exercita o cliente real com transporte e armazenamento controlados, sem dados do aplicativo.
const source = await readFile(new URL('../src/core/api/cliente-api.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
function createClient() {
  const state = { queued: [], cached: [], cleared: 0, pending: [], calls: [] };
  const storage = {
    configurarOffline: async () => {},
    limparOffline: async () => {
      state.cleared++;
    },
    listarPendentes: async () => state.pending,
    guardarCache: async (...args) => {
      state.cached.push(args);
    },
    lerCache: async () => (state.readCache ? state.readCache() : [{ id: 'cache' }]),
    enfileirar: async (...args) => {
      state.queued.push(args);
      return { sincronizacaoPendente: true };
    },
    marcarErroPendente: async () => {},
    removerPendente: async () => {},
  };
  const context = vm.createContext({
    exports: {},
    process: { env: {} },
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (...args) => {
      state.calls.push(args);
      return state.fetch(...args);
    },
    require: (name) => {
      if (name === '@/core/offline/armazenamento') {
        return storage;
      }
      if (name === 'react-native') {
        return { Platform: { OS: 'web' } };
      }
      if (name === 'expo-secure-store') {
        return {};
      }
      if (name === 'expo-crypto') {
        return { randomUUID };
      }
      throw new Error('Dependência não simulada: ' + name);
    },
  });
  vm.runInContext(code, context);
  return { api: context.exports, state };
}
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
const tests = [];
function test(name, run) {
  tests.push({ name, run });
}
test('HTTP sem JSON preserva status e não usa cache nem fila offline', async () => {
  for (const status of [401, 403, 502]) {
    for (const method of ['GET', 'POST']) {
      const { api, state } = createClient();
      await api.salvarTokenSessao('conta-a');
      state.fetch = async () => new Response('<html>Erro</html>', { status });
      await assert.rejects(
        api.requisitarApi('/idosos', method, method === 'POST' ? {} : undefined),
        (erroCapturado) => erroCapturado instanceof api.ErroApi && erroCapturado.status === status,
      );
      assert.equal(state.queued.length, 0);
      assert.equal(state.cleared, status === 401 || status === 403 ? 1 : 0);
    }
  }
});
test('JSON inválido em resposta de sucesso não confirma uma alteração offline', async () => {
  const { api, state } = createClient();
  state.fetch = async () => new Response('inválido', { status: 201 });
  await assert.rejects(
    api.requisitarApi('/registros', 'POST', { titulo: 'Teste' }),
    (erroCapturado) => !(erroCapturado instanceof api.ErroRede),
  );
  assert.equal(state.queued.length, 0);
});
test('resposta atrasada de outra sessão é descartada', async () => {
  for (const status of [200, 401]) {
    const { api, state } = createClient();
    const response = deferred();
    await api.salvarTokenSessao('conta-a');
    state.fetch = () => response.promise;
    const request = api.requisitarApi('/idosos');
    await api.salvarTokenSessao('conta-b');
    response.resolve(
      Response.json(status === 200 ? [{ id: 'pessoa-a' }] : { message: 'Expirada' }, { status }),
    );
    await assert.rejects(
      request,
      (erroCapturado) => erroCapturado instanceof api.ErroSessaoAlterada,
    );
    assert.equal(state.cached.length, 0);
    assert.equal(state.cleared, 0, 'erro da conta anterior não apaga dados da conta atual');
  }
});
test('leitura offline atrasada não devolve dados após trocar de conta', async () => {
  const { api, state } = createClient();
  const cache = deferred();
  const started = deferred();
  await api.salvarTokenSessao('conta-a');
  state.fetch = async () => {
    throw new TypeError('Offline');
  };
  state.readCache = () => {
    started.resolve();
    return cache.promise;
  };
  const request = api.requisitarApi('/idosos');
  await started.promise;
  await api.salvarTokenSessao('conta-b');
  cache.resolve([{ id: 'pessoa-a' }]);
  await assert.rejects(request, (erroCapturado) => erroCapturado instanceof api.ErroSessaoAlterada);
});
test('resposta anterior a uma recusa de acesso não repovoa cache apagado', async () => {
  const { api, state } = createClient();
  const response = deferred();
  await api.salvarTokenSessao('conta-a');
  state.fetch = (url) =>
    url.endsWith('/idosos')
      ? response.promise
      : Promise.resolve(Response.json({ message: 'Acesso recusado' }, { status: 401 }));
  const read = api.requisitarApi('/idosos');
  await assert.rejects(
    api.requisitarApi('/auth/me'),
    (erroCapturado) => erroCapturado instanceof api.ErroApi && erroCapturado.status === 401,
  );
  response.resolve(Response.json([{ id: 'pessoa-a' }]));
  await assert.rejects(read, (erroCapturado) => erroCapturado instanceof api.ErroSessaoAlterada);
  assert.equal(state.cached.length, 0);
});
test('sincronização não envia fila da sessão anterior com token de outra conta', async () => {
  const { api, state } = createClient();
  const response = deferred();
  await api.salvarTokenSessao('conta-a');
  state.pending = [{ id: '1', caminho: '/registros', metodo: 'POST', corpo: '{}', erro: '' }];
  state.fetch = () => response.promise;
  const request = api.sincronizarPendentes();
  await Promise.resolve();
  await api.salvarTokenSessao('conta-b');
  response.resolve(Response.json({ id: 'a' }));
  await assert.rejects(request, (erroCapturado) => erroCapturado instanceof api.ErroSessaoAlterada);
  assert.ok(state.calls.every(([, init]) => init.headers.Authorization === 'Bearer conta-a'));
  assert.equal(state.calls.filter(([, init]) => init.method === 'POST').length, 0);
});
test('POST mantém identificador ao cair da rede para a fila, evitando criação duplicada', async () => {
  const { api, state } = createClient();
  await api.salvarTokenSessao('conta-a');
  state.fetch = async () => {
    throw new TypeError('Conexão interrompida após envio');
  };
  await api.requisitarApi('/registros', 'POST', { titulo: 'Teste' });
  const sent = JSON.parse(state.calls[0][1].body);
  assert.match(sent.mutationId, /^[a-f0-9-]{36}$/);
  assert.equal(state.queued[0][2].mutationId, sent.mutationId);
});
test('conta nova não aguarda sincronização interrompida da conta anterior', async () => {
  const { api, state } = createClient();
  const response = deferred();
  const started = deferred();
  await api.salvarTokenSessao('conta-a');
  state.pending = [{ id: '1', caminho: '/registros', metodo: 'POST', corpo: '{}', erro: '' }];
  state.fetch = (url, init) => {
    if (init.headers.Authorization === 'Bearer conta-a') {
      started.resolve();
      return response.promise;
    }
    return Promise.resolve(Response.json([{ id: 'pessoa-b' }]));
  };
  const previous = api.sincronizarPendentes();
  const rejected = assert.rejects(
    previous,
    (erroCapturado) => erroCapturado instanceof api.ErroSessaoAlterada,
  );
  await started.promise;
  await api.salvarTokenSessao('conta-b');
  state.pending = [];
  const current = api.requisitarApi('/registros?tipo=rotinas&idosoId=b');
  let timer;
  try {
    const data = await Promise.race([
      current,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('A conta nova ficou aguardando a anterior.')),
          1000,
        );
      }),
    ]);
    assert.equal(data[0].id, 'pessoa-b');
  } finally {
    clearTimeout(timer);
    response.resolve(Response.json({ id: 'a' }));
    await rejected;
  }
});
let failed = 0;
for (const { name, run } of tests) {
  try {
    await run();
    console.log('OK:', name);
  } catch (error) {
    failed++;
    console.error('FALHOU:', name, error.message);
  }
}
if (failed) {
  process.exitCode = 1;
}
