import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Platform, Switch, Text, View } from 'react-native';
import * as Location from 'expo-location';
import {
  Idoso,
  Preferencias,
  Registro,
  requisitarApi,
  sincronizarPendentes,
  Usuario,
} from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { useEstilosTematicos } from '@/core/tema/contexto-tema';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import {
  Action,
  Choice,
  colors,
  d as estilos,
  Input,
  Message,
} from '@/components/ui/design-system';
import {
  pedirPermissaoLembretes,
  atualizarLembretes,
  limparLembretes,
} from '@/core/notificacoes/lembretes';
import {
  habilitarOffline,
  listarPendentes,
  offlineHabilitado,
  Pendente,
  removerPendente,
} from '@/core/offline/armazenamento';

type Sessao = { id: string; criadaEm: string; expires: number; atual: boolean };
type Convite = { id: string; convidadoPor?: string; enviadoPor?: string; expires: number };
const padrao: Preferencias = {
  font_scale: 1,
  notifications: 0,
  notification_details: 0,
  consultation_minutes: 60,
};
export default function Configuracoes() {
  const { usuario, alterarTema, recarregarUsuario } = useAutenticacao();
  const estilosDaTela = useEstilosTematicos(estilos);
  const [pessoas, setPessoas] = useState<Idoso[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [transferencias, setTransferencias] = useState<Convite[]>([]);
  const [prefsEditadas, setPrefsEditadas] = useState<Preferencias>();
  const [offline, setOffline] = useState(false);
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [autorizarGps, setAutorizarGps] = useState(false);
  const usuarioId = usuario?.id;
  const preferencias = prefsEditadas || usuario?.preferencias || padrao;
  const setPrefs = (alterar: (anterior: Preferencias) => Preferencias) =>
    setPrefsEditadas(alterar(preferencias));
  const carregar = useCallback(async () => {
    if (!usuarioId) {
      return;
    }
    setErro('');
    try {
      const [p, s, c, t] = await Promise.all([
        requisitarApi<Idoso[]>('/idosos'),
        requisitarApi<Sessao[]>('/auth/sessoes'),
        requisitarApi<Convite[]>('/convites'),
        requisitarApi<Convite[]>('/transferencias'),
      ]);
      setPessoas(p);
      setSessoes(s);
      setConvites(c);
      setTransferencias(t);
      setOffline(await offlineHabilitado());
      setPendentes(await listarPendentes());
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    }
  }, [usuarioId]);
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );
  async function executar(acao: () => Promise<unknown>, mensagem: string) {
    if (ocupado) {
      return;
    }
    setOcupado(true);
    setErro('');
    setAviso('');
    try {
      const resultado = await acao();
      setAviso(typeof resultado === 'string' ? resultado : mensagem);
      setSenha('');
      await carregar();
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function salvarPreferencias() {
    if (preferencias.notifications) {
      await pedirPermissaoLembretes();
    }
    const atualizado = await requisitarApi<Usuario>('/auth/me/preferencias', 'PUT', {
      ...preferencias,
      notifications: !!preferencias.notifications,
      notification_details: !!preferencias.notification_details,
    });
    await recarregarUsuario();
    setPrefsEditadas(undefined);
    if (preferencias.notifications) {
      const n = await atualizarLembretes(atualizado);
      return (
        n + ' lembretes nas próximas 12 horas. Abra o aplicativo diariamente para renovar a agenda.'
      );
    } else {
      await limparLembretes();
    }
  }
  async function capturar() {
    if (!autorizarGps || !pessoas[0]) {
      throw new Error('Confirme que deseja compartilhar sua posição.');
    }
    const acesso = await Location.requestForegroundPermissionsAsync();
    if (!acesso.granted) {
      throw new Error('Localização não autorizada no aparelho.');
    }
    const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    await requisitarApi('/idosos/' + pessoas[0].id + '/localizacao/ponto', 'POST', {
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
      precisaoMetros: posicao.coords.accuracy ?? 10000,
      capturadaEm: new Date(posicao.timestamp).toISOString(),
      autorizacaoTitularConfirmada: true,
    });
    setAutorizarGps(false);
  }
  return (
    <EstruturaAplicativo title="Configurações" section="perfil" back>
      <Message>{erro}</Message>
      <Message success>{aviso}</Message>
      <View style={estilosDaTela.card}>
        <Text style={estilosDaTela.heading}>Aparência e leitura</Text>
        <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
          {(['claro', 'escuro'] as const).map((tema) => (
            <Choice
              key={tema}
              selected={usuario?.tema === tema}
              disabled={ocupado}
              onPress={() => void executar(() => alterarTema(tema), 'Tema atualizado.')}
            >
              {tema === 'claro' ? 'Modo claro' : 'Modo escuro'}
            </Choice>
          ))}
        </View>
        <Text style={estilosDaTela.body}>
          As fontes respeitam o tamanho configurado no sistema. Você também pode ampliá-las aqui.
        </Text>
        <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
          {[1, 1.2, 1.4, 1.6].map((escala) => (
            <Choice
              key={escala}
              selected={preferencias.font_scale === escala}
              disabled={ocupado}
              onPress={() => setPrefs((p) => ({ ...p, font_scale: escala }))}
            >
              {Math.round(escala * 100)}%
            </Choice>
          ))}
        </View>
      </View>
      <View style={estilosDaTela.card}>
        <Text style={estilosDaTela.heading}>Lembretes do cuidado</Text>
        <Text style={estilosDaTela.body}>
          No Android/iOS, o aparelho pode avisar com o aplicativo fechado. Bateria, modo silencioso
          e permissões podem impedir a entrega. Toque no aviso para conferir o registro; ele
          continua pendente até uma confirmação no aplicativo.
        </Text>
        <Toggle
          titulo="Ativar lembretes neste aparelho"
          valor={!!preferencias.notifications}
          mudar={(v) => setPrefs((p) => ({ ...p, notifications: v ? 1 : 0 }))}
        />
        <Toggle
          titulo="Mostrar título do registro no aviso (pode expor dados de saúde na tela bloqueada)"
          valor={!!preferencias.notification_details}
          mudar={(v) => setPrefs((p) => ({ ...p, notification_details: v ? 1 : 0 }))}
        />
        <Input
          label="Avisar consultas com quantos minutos de antecedência (5 a 1440)"
          keyboardType="number-pad"
          value={String(preferencias.consultation_minutes)}
          onChangeText={(v) => setPrefs((p) => ({ ...p, consultation_minutes: Number(v) }))}
        />
        <Action
          disabled={ocupado}
          onPress={() => void executar(salvarPreferencias, 'Preferências salvas.')}
        >
          Salvar leitura e lembretes
        </Action>
      </View>
      <View style={estilosDaTela.card}>
        <Text style={estilosDaTela.heading}>Sincronização offline</Text>
        <Text style={estilosDaTela.body}>
          Disponível em build nativa com SQLCipher. O cache protegido permite consultar e alterar
          registros por até 15 minutos após atualizar os acessos. A revogação só pode ser conhecida
          ao reconectar; os conflitos exigem sua revisão. Fotos e arquivos não ficam no cache.
        </Text>
        <Toggle
          titulo="Habilitar cache protegido neste aparelho"
          valor={offline}
          mudar={(v) => void executar(() => habilitarOffline(v), 'Preferência offline atualizada.')}
        />
        <Action
          soft
          disabled={ocupado}
          onPress={() => void executar(sincronizarPendentes, 'Sincronização verificada.')}
        >
          Sincronizar agora
        </Action>
        <Text style={estilosDaTela.body}>{pendentes.length} alterações aguardando envio.</Text>
        {pendentes.map((p) => (
          <View key={p.id} style={estilosDaTela.soft}>
            <Text style={estilosDaTela.body}>
              Alteração aguardando envio{p.erro ? ': ' + p.erro : ''}
            </Text>
            {!!p.erro && (
              <>
                <Text style={estilosDaTela.muted}>
                  Copie o conteúdo e confira o registro atual antes de descartar esta alteração.
                </Text>
                <ConferenciaConflito pendente={p} />
                <Action
                  soft
                  onPress={() =>
                    void executar(
                      () => removerPendente(p.id),
                      'Alteração local descartada; o servidor foi preservado.',
                    )
                  }
                >
                  Descartar esta alteração local
                </Action>
              </>
            )}
          </View>
        ))}
      </View>
      {usuario?.tipo === 'idoso' ? (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.heading}>Compartilhar minha posição</Text>
          <Text style={estilosDaTela.body}>
            Somente quando você tocar no botão. O responsável precisa habilitar o compartilhamento
            primeiro. Não há rastreamento contínuo.
          </Text>
          <Toggle
            titulo="Quero capturar e compartilhar a posição deste aparelho agora"
            valor={autorizarGps}
            mudar={setAutorizarGps}
          />
          <Action
            disabled={ocupado || !autorizarGps}
            onPress={() =>
              void executar(capturar, 'Última posição enviada com horário e precisão.')
            }
          >
            Enviar minha posição agora
          </Action>
          <Action
            soft
            disabled={ocupado || !pessoas[0]}
            onPress={() =>
              void executar(
                () => requisitarApi('/idosos/' + pessoas[0].id + '/localizacao/ponto', 'DELETE'),
                'Compartilhamento desligado e posição removida.',
              )
            }
          >
            Interromper e apagar minha posição
          </Action>
        </View>
      ) : (
        pessoas.some((p) => p.podeVerLocalizacao) && (
          <Action soft onPress={() => router.push('/localizacao')}>
            Localização da pessoa acompanhada
          </Action>
        )
      )}
      <Action soft onPress={() => router.push('/privacidade' as never)}>
        Privacidade, consentimentos e meus direitos
      </Action>
      {usuario?.tipo !== 'idoso' && (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.heading}>Confirmação de e-mail</Text>
          <Text style={estilosDaTela.body}>
            {usuario?.emailVerificado ? 'E-mail confirmado.' : 'Ainda não confirmado.'}
          </Text>
          <Action
            soft
            disabled={ocupado || usuario?.emailVerificado}
            onPress={() =>
              void executar(
                () => requisitarApi('/auth/verificacao/enviar', 'POST'),
                'Código enviado. Confira seu e-mail.',
              )
            }
          >
            Enviar código
          </Action>
          <Input
            label="Código recebido por e-mail"
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="none"
          />
          <Action
            disabled={ocupado || !codigo}
            onPress={() =>
              void executar(async () => {
                await requisitarApi('/auth/verificacao/confirmar', 'POST', { codigo });
                setCodigo('');
                await recarregarUsuario();
              }, 'E-mail confirmado.')
            }
          >
            Confirmar e-mail
          </Action>
        </View>
      )}
      {convites.map((c) => (
        <View key={c.id} style={estilosDaTela.card}>
          <Text style={estilosDaTela.heading}>Convite de {c.convidadoPor}</Text>
          <Text style={estilosDaTela.body}>
            Você terá acesso às áreas de cuidado autorizadas. O vínculo inicial vale 90 dias.
          </Text>
          <Action
            disabled={ocupado}
            onPress={() =>
              void executar(
                () => requisitarApi('/convites/' + c.id + '/responder', 'POST', { aceitar: true }),
                'Convite aceito.',
              )
            }
          >
            Aceitar vínculo
          </Action>
          <Action
            soft
            disabled={ocupado}
            onPress={() =>
              void executar(
                () => requisitarApi('/convites/' + c.id + '/responder', 'POST', { aceitar: false }),
                'Convite recusado.',
              )
            }
          >
            Recusar convite
          </Action>
        </View>
      ))}
      {transferencias.map((t) => (
        <View key={t.id} style={estilosDaTela.card}>
          <Text style={estilosDaTela.heading}>Transferência de {t.enviadoPor}</Text>
          <Text style={estilosDaTela.body}>
            Ao aceitar, você administrará o cadastro e deverá revisar os acessos.
          </Text>
          <Input
            label="Sua senha para confirmar"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
          <Action
            disabled={ocupado || !senha}
            onPress={() =>
              void executar(
                () =>
                  requisitarApi('/transferencias/' + t.id + '/responder', 'POST', {
                    aceitar: true,
                    senha,
                  }),
                'Administração recebida.',
              )
            }
          >
            Aceitar administração
          </Action>
          <Action
            soft
            disabled={ocupado}
            onPress={() =>
              void executar(
                () =>
                  requisitarApi('/transferencias/' + t.id + '/responder', 'POST', {
                    aceitar: false,
                  }),
                'Transferência recusada.',
              )
            }
          >
            Recusar transferência
          </Action>
        </View>
      ))}
      <View style={estilosDaTela.card}>
        <Text style={estilosDaTela.heading}>Sessões abertas</Text>
        <Text style={estilosDaTela.body}>
          Cada entrada cria uma sessão. Encerre acessos que você não reconhece.
        </Text>
        {sessoes.map((s) => (
          <View key={s.id}>
            <Text style={estilosDaTela.body}>
              {s.atual ? 'Esta sessão' : 'Outra sessão'} -{' '}
              {s.criadaEm ? new Date(s.criadaEm).toLocaleString('pt-BR') : 'Sessão antiga'}
            </Text>
            <Text style={estilosDaTela.muted}>
              Expira em {new Date(s.expires * 1000).toLocaleString('pt-BR')}
            </Text>
            {!s.atual && (
              <Action
                soft
                disabled={ocupado}
                onPress={() =>
                  void executar(
                    () => requisitarApi('/auth/sessoes/' + s.id, 'DELETE'),
                    'Sessão encerrada.',
                  )
                }
              >
                Encerrar esta sessão
              </Action>
            )}
          </View>
        ))}
        <Action
          soft
          disabled={ocupado}
          onPress={() =>
            void executar(
              () => requisitarApi('/auth/sessoes/revogar-outras', 'POST'),
              'Outras sessões encerradas.',
            )
          }
        >
          Encerrar todas as outras sessões
        </Action>
      </View>
      {Platform.OS === 'web' && (
        <Text style={estilosDaTela.muted}>
          Os recursos que dependem do aparelho precisam de teste no Android/iOS.
        </Text>
      )}
    </EstruturaAplicativo>
  );
}
function Toggle({
  titulo,
  valor,
  mudar,
}: {
  titulo: string;
  valor: boolean;
  mudar: (v: boolean) => void;
}) {
  const estilosDaTela = useEstilosTematicos(estilos);
  return (
    <View style={[estilosDaTela.row, { minHeight: 48 }]}>
      <Text style={[estilosDaTela.body, { flex: 1 }]}>{titulo}</Text>
      <Switch
        trackColor={{ false: colors.line, true: colors.purple }}
        accessibilityLabel={titulo}
        value={valor}
        onValueChange={mudar}
      />
    </View>
  );
}

function ConferenciaConflito({ pendente }: { pendente: Pendente }) {
  const estilosDaTela = useEstilosTematicos(estilos);
  const [atual, setAtual] = useState<Registro>();
  const [erro, setErro] = useState('');
  const local = JSON.parse(pendente.corpo) as Partial<Registro>;
  async function conferir() {
    try {
      if (!local.idosoId || !local.tipo) {
        throw new Error(
          'Abra a lista de registros para conferir o estado atual antes de repetir a exclusão.',
        );
      }
      const itens = await requisitarApi<Registro[]>(
        '/registros?tipo=' + local.tipo + '&idosoId=' + encodeURIComponent(local.idosoId),
      );
      const item = itens.find((r) => pendente.caminho.endsWith('/' + r.id));
      if (!item) {
        throw new Error('O registro não está mais disponível no servidor.');
      }
      setAtual(item);
      setErro('');
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    }
  }
  const descrever = (r: Partial<Registro>) =>
    [r.titulo, r.data, r.horario, r.status, r.detalhes].filter(Boolean).join(' · ');
  return (
    <View>
      <Text style={estilosDaTela.subheading}>Sua alteração local</Text>
      <Text selectable style={estilosDaTela.body}>
        {descrever(local) || 'Exclusão solicitada'}
      </Text>
      <Action soft onPress={() => void conferir()}>
        Conferir a versão do servidor
      </Action>
      <Message>{erro}</Message>
      {atual && (
        <>
          <Text style={estilosDaTela.subheading}>Versão atual do servidor</Text>
          <Text selectable style={estilosDaTela.body}>
            {descrever(atual)}
          </Text>
          <Text style={estilosDaTela.muted}>
            Copie o que deseja preservar, descarte a alteração local e edite o registro atualizado.
            Não há sobrescrita automática.
          </Text>
        </>
      )}
    </View>
  );
}
