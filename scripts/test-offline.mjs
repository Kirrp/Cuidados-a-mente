import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import ts from 'typescript';

// SQLite em memória: verifica isolamento/fila. A cifra nativa exige teste em aparelho.
const source = await readFile(
  new URL('../src/core/offline/armazenamento.native.ts', import.meta.url),
  'utf8',
);
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function createOffline() {
  const db = new DatabaseSync(':memory:');
  const state = { beforeRun: null, afterRead: null };
  const secure = new Map([['cuidados.offline.enabled', '1']]);
  const sqlite = {
    closeAsync: async () => {},
    execAsync: async (sql) => db.exec(sql),
    runAsync: async (sql, ...args) => {
      if (state.beforeRun) {
        await state.beforeRun(sql);
      }
      return db.prepare(sql).run(...args);
    },
    getFirstAsync: async (sql, ...args) => {
      if (sql === 'PRAGMA cipher_version') {
        return { cipher_version: 'simulado' };
      }
      const result = db.prepare(sql).get(...args);
      if (state.afterRead) {
        await state.afterRead(sql);
      }
      return result;
    },
    getAllAsync: async (sql, ...args) => {
      const result = db.prepare(sql).all(...args);
      if (state.afterRead) {
        await state.afterRead(sql);
      }
      return result;
    },
  };
  const context = vm.createContext({
    exports: {},
    Date,
    URLSearchParams,
    require: (name) => {
      if (name === 'expo-secure-store') {
        return {
          getItemAsync: async (key) => secure.get(key),
          setItemAsync: async (key, value) => {
            secure.set(key, value);
          },
        };
      }
      if (name === 'expo-crypto') {
        return {
          randomUUID,
          getRandomBytesAsync: async (n) => randomBytes(n),
          CryptoDigestAlgorithm: { SHA256: 'sha256' },
          digestStringAsync: async (algorithm, text) =>
            createHash(algorithm).update(text).digest('hex'),
        };
      }
      if (name === 'expo-sqlite') {
        return { openDatabaseAsync: async () => sqlite };
      }
      throw new Error('Dependência não simulada: ' + name);
    },
  });
  vm.runInContext(code, context);
  return { offline: context.exports, state, db };
}
const tests = [
  [
    'fila preserva identificador enviado antes de cair a conexão',
    async ({ offline }) => {
      await offline.configurarOffline('a');
      await offline.guardarCache('/idosos', [{ id: 'p' }]);
      const mutationId = randomUUID();
      await offline.enfileirar('/registros', 'POST', { idosoId: 'p', tipo: 'rotinas', mutationId });
      assert.equal(JSON.parse((await offline.listarPendentes())[0].corpo).mutationId, mutationId);
    },
  ],
  [
    'gravação de cache iniciada na conta anterior não entra na conta nova',
    async ({ offline, state }) => {
      await offline.configurarOffline('a');
      const pause = deferred();
      const reached = deferred();
      state.beforeRun = (sql) => {
        if (sql === 'DELETE FROM cache WHERE expires<?') {
          reached.resolve();
          return pause.promise;
        }
      };
      const write = offline.guardarCache('/idosos', [{ id: 'pessoa-a' }]);
      await reached.promise;
      await offline.configurarOffline('b');
      pause.resolve();
      await write.catch(() => {});
      assert.equal(await offline.lerCache('/idosos'), undefined);
    },
  ],
  [
    'leitura de cache da conta anterior é invalidada durante troca',
    async ({ offline, state }) => {
      await offline.configurarOffline('a');
      await offline.guardarCache('/idosos', [{ id: 'pessoa-a' }]);
      const pause = deferred();
      const reached = deferred();
      state.afterRead = (sql) => {
        if (sql.startsWith('SELECT dados')) {
          reached.resolve();
          return pause.promise;
        }
      };
      const read = offline.lerCache('/idosos');
      await reached.promise;
      await offline.configurarOffline('b');
      pause.resolve();
      await assert.rejects(read);
    },
  ],
  [
    'ação da conta anterior não entra na fila da conta nova',
    async ({ offline, state }) => {
      await offline.configurarOffline('a');
      await offline.guardarCache('/idosos', [{ id: 'p' }]);
      const pause = deferred();
      const reached = deferred();
      state.afterRead = (sql) => {
        if (sql.startsWith('SELECT id,caminho')) {
          reached.resolve();
          return pause.promise;
        }
      };
      const write = offline
        .enfileirar('/registros', 'POST', { idosoId: 'p', tipo: 'rotinas' })
        .then(
          () => true,
          () => false,
        );
      await reached.promise;
      const change = offline.configurarOffline('b');
      await new Promise(setImmediate);
      pause.resolve();
      await change;
      assert.equal(await write, false);
      assert.equal((await offline.listarPendentes()).length, 0);
    },
  ],
  [
    'INSERT atrasado da conta anterior preserva cache já atualizado para a nova conta',
    async ({ offline, state }) => {
      await offline.configurarOffline('a');
      const pause = deferred();
      const reached = deferred();
      state.beforeRun = (sql) => {
        if (sql.startsWith('INSERT INTO cache')) {
          reached.resolve();
          return pause.promise;
        }
      };
      const write = offline.guardarCache('/idosos', [{ id: 'pessoa-a' }]).then(
        () => true,
        () => false,
      );
      await reached.promise;
      state.beforeRun = null;
      const change = offline
        .configurarOffline('b')
        .then(() => offline.guardarCache('/idosos', [{ id: 'pessoa-b' }]));
      await new Promise(setImmediate);
      pause.resolve();
      await change;
      assert.equal(await write, false, 'gravação da sessão antiga precisa ser invalidada');
      assert.equal((await offline.lerCache('/idosos'))[0].id, 'pessoa-b');
    },
  ],
  ...['cache', 'pending'].map((table) => [
    'limpeza impede INSERT em andamento de repopular ' + table,
    async ({ offline, state, db }) => {
      await offline.configurarOffline('a');
      await offline.guardarCache('/idosos', [{ id: 'p' }]);
      const pause = deferred();
      const reached = deferred();
      state.beforeRun = (sql) => {
        if (sql.startsWith('INSERT INTO ' + table)) {
          reached.resolve();
          return pause.promise;
        }
      };
      const operation =
        table === 'cache'
          ? offline.guardarCache('/auth/me', { id: 'a' })
          : offline.enfileirar('/registros', 'POST', { idosoId: 'p', tipo: 'rotinas' });
      const write = operation.then(
        () => true,
        () => false,
      );
      await reached.promise;
      const clear = offline.limparOffline();
      await new Promise(setImmediate);
      pause.resolve();
      await clear;
      assert.equal(await write, false, 'limpeza precisa invalidar operações iniciadas antes dela');
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM cache').get().total, 0);
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM pending').get().total, 0);
    },
  ]),
  [
    'duas edições offline simultâneas do mesmo registro geram uma única pendência',
    async ({ offline }) => {
      await offline.configurarOffline('a');
      await offline.guardarCache('/idosos', [{ id: 'p' }]);
      const path = '/registros/' + randomUUID();
      const results = await Promise.allSettled([
        offline.enfileirar(path, 'PUT', { idosoId: 'p', tipo: 'rotinas', versao: 1 }),
        offline.enfileirar(path, 'PUT', { idosoId: 'p', tipo: 'rotinas', versao: 1 }),
      ]);
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
      assert.equal((await offline.listarPendentes()).length, 1);
    },
  ],
  [
    'ações offline simultâneas respeitam o limite de 100 pendências',
    async ({ offline }) => {
      await offline.configurarOffline('a');
      await offline.guardarCache('/idosos', [{ id: 'p' }]);
      for (let i = 0; i < 99; i++) {
        await offline.enfileirar('/registros', 'POST', {
          idosoId: 'p',
          tipo: 'rotinas',
          titulo: 'Teste ' + i,
        });
      }
      const results = await Promise.allSettled([
        offline.enfileirar('/registros', 'POST', {
          idosoId: 'p',
          tipo: 'rotinas',
          titulo: 'Limite A',
        }),
        offline.enfileirar('/registros', 'POST', {
          idosoId: 'p',
          tipo: 'rotinas',
          titulo: 'Limite B',
        }),
      ]);
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
      assert.equal((await offline.listarPendentes()).length, 100);
    },
  ],
];
let failed = 0;
for (const [name, run] of tests) {
  const client = createOffline();
  try {
    await run(client);
    console.log('OK:', name);
  } catch (erroCapturado) {
    failed++;
    console.error('FALHOU:', name, erroCapturado.message);
  } finally {
    client.db.close();
  }
}
if (failed) {
  process.exitCode = 1;
}
