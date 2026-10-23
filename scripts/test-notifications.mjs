import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/core/notificacoes/lembretes.native.ts', import.meta.url),
  'utf8',
);
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const observerSource = await readFile(
  new URL('../src/core/notificacoes/observador.tsx', import.meta.url),
  'utf8',
);
const observerCode = ts.transpileModule(observerSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const user = (id) => ({
  id,
  legalAccepted: true,
  preferencias: { notifications: 1, notification_details: 0, consultation_minutes: 30 },
  sessaoExpira: Math.floor(Date.now() / 1000) + 7200,
});
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function createReminders() {
  const state = {
    scheduled: [],
    last: null,
    listener: null,
    calls: [],
    account: user('a'),
    fireAt: Date.now() + 3600000,
  };
  const notifications = {
    setNotificationHandler: () => {},
    getPermissionsAsync: async () => ({ granted: true }),
    getAllScheduledNotificationsAsync: async () => [...state.scheduled],
    cancelScheduledNotificationAsync: async (id) => {
      state.scheduled = state.scheduled.filter((n) => n.identifier !== id);
    },
    dismissAllNotificationsAsync: async () => {},
    getLastNotificationResponse: () => state.last,
    clearLastNotificationResponse: () => {
      state.last = null;
    },
    addNotificationResponseReceivedListener: (listener) => {
      state.listener = listener;
      return {
        remove() {
          state.listener = null;
        },
      };
    },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    scheduleNotificationAsync: async (item) => {
      state.calls.push(item);
      if (state.beforeSchedule) {
        await state.beforeSchedule();
      }
      state.scheduled.push(item);
      return item.identifier;
    },
  };
  const context = vm.createContext({
    exports: {},
    Date,
    require: (name) => {
      if (name === './horario') {
        return { instanteDoRegistro: () => new Date(state.fireAt) };
      }
      if (name === 'expo-notifications') {
        return notifications;
      }
      if (name === 'react-native') {
        return { Platform: { OS: 'ios' } };
      }
      if (name === '@/core/api/cliente-api') {
        return {
          requisitarApi: async (path) => {
            if (path === '/auth/me') {
              if (state.beforeProfile) {
                await state.beforeProfile();
              }
              return state.account;
            }
            if (path === '/idosos') {
              return [{ id: 'p', permissoes: ['ver_medicamentos'] }];
            }
            return [
              {
                id: 'r',
                idosoId: 'p',
                versao: 1,
                status: 'pendente',
                horario: '12:00',
                tipo: 'medicamentos',
                titulo: 'Registro de teste',
              },
            ];
          },
        };
      }
      throw new Error('Dependência não simulada: ' + name);
    },
  });
  vm.runInContext(code, context);
  return { reminders: context.exports, state };
}
function mountObserver(reminders, account) {
  const routes = [];
  let cleanup;
  const context = vm.createContext({
    exports: {},
    setInterval: () => 1,
    clearInterval: () => {},
    require: (name) => {
      if (name === 'react') {
        return {
          useEffect: (effect) => {
            cleanup = effect();
          },
        };
      }
      if (name === 'react-native') {
        return { AppState: { addEventListener: () => ({ remove() {} }) } };
      }
      if (name === 'expo-router') {
        return {
          router: {
            push: (route) => {
              routes.push(route);
            },
          },
        };
      }
      if (name === '@/core/autenticacao/contexto-autenticacao') {
        return { useAutenticacao: () => ({ usuario: account }) };
      }
      if (name === './lembretes') {
        return reminders;
      }
      throw new Error('Dependência não simulada: ' + name);
    },
  });
  vm.runInContext(observerCode, context);
  context.exports.ObservadorLembretes();
  return { routes, unmount: () => cleanup?.() };
}
const tests = [
  [
    'agendamento identifica a pessoa acompanhada do registro',
    async () => {
      const { reminders, state } = createReminders();
      await reminders.atualizarLembretes(user('a'));
      assert.equal(state.scheduled[0].content.data.idosoId, 'p');
    },
  ],
  [
    'agenda substitui aviso antigo sem identificação da pessoa',
    async () => {
      const { reminders, state } = createReminders();
      await reminders.atualizarLembretes(user('a'));
      state.scheduled[0].identifier = state.scheduled[0].identifier.replace(
        'cuidados-v2-',
        'cuidados-',
      );
      delete state.scheduled[0].content.data.idosoId;
      await reminders.atualizarLembretes(user('a'));
      assert.equal(state.scheduled.length, 1);
      assert.equal(state.scheduled[0].content.data.idosoId, 'p');
      assert.equal(state.calls.length, 2);
    },
  ],
  [
    'toque no lembrete abre a pessoa indicada em vez da seleção anterior',
    async () => {
      const { reminders, state } = createReminders();
      state.last = {
        notification: {
          request: { content: { data: { conta: 'a', tipo: 'medicamentos', idosoId: 'p' } } },
        },
      };
      const observer = mountObserver(reminders, user('a'));
      assert.equal(observer.routes.length, 1);
      assert.equal(observer.routes[0].pathname, '/registros');
      assert.equal(observer.routes[0].params.idosoId, 'p');
      assert.equal(observer.routes[0].params.tipo, 'medicamentos');
      observer.unmount();
    },
  ],
  [
    'toque já atendido não navega novamente quando o usuário é recarregado',
    async () => {
      const { reminders, state } = createReminders();
      state.last = {
        notification: { request: { content: { data: { conta: 'a', tipo: 'medicamentos' } } } },
      };
      let navigations = 0;
      const stop = reminders.observarResposta(user('a'), () => {
        navigations++;
      });
      stop();
      reminders.observarResposta(user('a'), () => {
        navigations++;
      });
      assert.equal(navigations, 1);
    },
  ],
  [
    'troca de conta aguarda atualização anterior e agenda lembretes da conta atual',
    async () => {
      const { reminders, state } = createReminders();
      const profile = deferred();
      state.beforeProfile = () => profile.promise;
      const first = reminders.atualizarLembretes(user('a'));
      await new Promise(setImmediate);
      await reminders.limparLembretes();
      state.account = user('b');
      const second = reminders.atualizarLembretes(state.account);
      profile.resolve();
      await Promise.all([first, second]);
      assert.equal(state.scheduled.length, 1);
      assert.equal(state.scheduled[0].content.data.conta, 'b');
    },
  ],
  [
    'agendamento que termina após logout é cancelado',
    async () => {
      const { reminders, state } = createReminders();
      const schedule = deferred();
      const reached = deferred();
      state.beforeSchedule = () => {
        reached.resolve();
        return schedule.promise;
      };
      const update = reminders.atualizarLembretes(user('a'));
      await reached.promise;
      await reminders.limparLembretes();
      schedule.resolve();
      await update;
      assert.equal(state.scheduled.length, 0);
    },
  ],
];
let failed = 0;
for (const [name, run] of tests) {
  try {
    await run();
    console.log('OK:', name);
  } catch (erroCapturado) {
    failed++;
    console.error('FALHOU:', name, erroCapturado.message);
  }
}
if (failed) {
  process.exitCode = 1;
}
