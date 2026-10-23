import { instanteDoRegistro } from './horario';
import * as Notifications from 'expo-notifications';
import { Idoso, Registro, requisitarApi, Usuario } from '@/core/api/cliente-api';
import { Platform } from 'react-native';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
const CANAL = 'cuidados-lembretes';
// A versão força substituir avisos antigos cujo payload não identifica a pessoa.
const PREFIXO_AGENDAMENTO = 'cuidados-v2-';
const JANELA_AGENDAMENTO_MS = 12 * 60 * 60 * 1000;
const MAXIMO_LEMBRETES = 50;
let tarefa: Promise<number> | null = null;
let geracao = 0;
let limpeza: Promise<void> | null = null;

function identificadorDoLembrete(
  contaId: string,
  registro: Registro,
  data: Date,
  mostrarDetalhes: number,
): string {
  return (
    PREFIXO_AGENDAMENTO +
    contaId +
    '-' +
    registro.id +
    '-' +
    registro.versao +
    '-' +
    data.getTime() +
    '-' +
    mostrarDetalhes
  );
}
export async function pedirPermissaoLembretes() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Lembretes do cuidado',
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) {
    return;
  }
  const acesso = await Notifications.requestPermissionsAsync();
  if (!acesso.granted) {
    throw new Error(
      'Permissão de notificações negada. Habilite-a nas configurações do aparelho para receber lembretes.',
    );
  }
}
export function limparLembretes() {
  geracao++;
  const anterior = limpeza;
  const atual = (async () => {
    if (anterior) {
      await anterior.catch(() => {});
    }
    for (const item of await Notifications.getAllScheduledNotificationsAsync())
      if (item.identifier.startsWith('cuidados-')) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    await Notifications.dismissAllNotificationsAsync();
  })();
  limpeza = atual;
  return atual.finally(() => {
    if (limpeza === atual) {
      limpeza = null;
    }
  });
}
export function observarResposta(
  usuario: Usuario,
  navegar: (tipo: string, idosoId?: string) => void,
) {
  function abrir(resposta: Notifications.NotificationResponse | null) {
    const dados = resposta?.notification.request.content.data;
    if (
      dados?.conta === usuario.id &&
      ['medicamentos', 'consultas'].includes(String(dados?.tipo))
    ) {
      Notifications.clearLastNotificationResponse();
      navegar(String(dados?.tipo), typeof dados.idosoId === 'string' ? dados.idosoId : undefined);
    }
  }
  abrir(Notifications.getLastNotificationResponse());
  const sub = Notifications.addNotificationResponseReceivedListener(abrir);
  return () => sub.remove();
}
export function atualizarLembretes(usuario: Usuario): Promise<number> {
  const versao = geracao;
  // Após troca de conta/preferências, a atualização nova precisa executar quando
  // a antiga terminar. Retornar a tarefa antiga perdia o novo agendamento.
  if (tarefa) {
    return tarefa.catch(() => 0).then(() => (versao === geracao ? atualizarLembretes(usuario) : 0));
  }
  tarefa = (async () => {
    if (limpeza) {
      await limpeza;
    }
    if (versao !== geracao) {
      return 0;
    }
    if (!usuario.legalAccepted || !usuario.preferencias?.notifications) {
      await limparLembretes();
      return 0;
    }
    if (!(await Notifications.getPermissionsAsync()).granted) {
      await limparLembretes();
      return 0;
    }
    const perfil = await requisitarApi<Usuario>('/auth/me');
    if (versao !== geracao || perfil.id !== usuario.id) {
      return 0;
    }
    const preferencias = perfil.preferencias;
    if (!perfil.legalAccepted || !preferencias?.notifications) {
      await limparLembretes();
      return 0;
    }
    const pessoas = await requisitarApi<Idoso[]>('/idosos');
    const registros: Registro[] = [];
    for (const pessoa of pessoas) {
      for (const tipo of ['medicamentos', 'consultas'] as const)
        if (pessoa.permissoes?.includes('ver_' + tipo)) {
          registros.push(
            ...(await requisitarApi<Registro[]>(
              '/registros?tipo=' + tipo + '&idosoId=' + encodeURIComponent(pessoa.id),
            )),
          );
        }
    }
    const agora = Date.now();
    const desejados = registros
      .filter((r) => r.status === 'pendente' && !r.sincronizacaoPendente && r.horario)
      .map((r) => {
        const data = instanteDoRegistro(r.data, r.horario, r.fuso);
        if (!data) {
          return null;
        }
        if (r.tipo === 'consultas') {
          data.setMinutes(data.getMinutes() - preferencias.consultation_minutes);
        }
        return { r, data };
      })
      .filter((i): i is { r: Registro; data: Date } => i !== null)
      .filter(
        (i) =>
          i.data.getTime() > agora &&
          i.data.getTime() <
            Math.min(agora + JANELA_AGENDAMENTO_MS, (perfil.sessaoExpira || 0) * 1000),
      )
      .sort((a, b) => a.data.getTime() - b.data.getTime())
      .slice(0, MAXIMO_LEMBRETES);
    if (versao !== geracao) {
      return 0;
    }
    const ids = new Set(
      desejados.map((i) =>
        identificadorDoLembrete(usuario.id, i.r, i.data, preferencias.notification_details),
      ),
    );
    const atuais = await Notifications.getAllScheduledNotificationsAsync();
    if (versao !== geracao) {
      return 0;
    }
    for (const item of atuais)
      if (item.identifier.startsWith('cuidados-') && !ids.has(item.identifier)) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    const existentes = new Set(atuais.map((n) => n.identifier));
    for (const { r, data } of desejados) {
      if (versao !== geracao) {
        return 0;
      }
      const identifier = identificadorDoLembrete(
        usuario.id,
        r,
        data,
        preferencias.notification_details,
      );
      if (!existentes.has(identifier)) {
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: 'Cuidados à Mente',
            body: preferencias.notification_details
              ? r.titulo + ' - abra o aplicativo para conferir e registrar.'
              : 'Há um cuidado programado. Abra o aplicativo para conferir.',
            data: { conta: usuario.id, tipo: r.tipo, idosoId: r.idosoId },
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: data,
            channelId: CANAL,
          },
        });
        // O logout pode ocorrer enquanto a chamada nativa ainda está agendando.
        if (versao !== geracao) {
          await Notifications.cancelScheduledNotificationAsync(identifier);
          return 0;
        }
      }
    }
    return desejados.length;
  })().finally(() => {
    tarefa = null;
  });
  return tarefa;
}
