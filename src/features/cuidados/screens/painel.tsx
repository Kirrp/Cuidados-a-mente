import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import {
  Action,
  art,
  colors,
  d as dBase,
  Empty,
  Icon,
  IconName,
  Loading,
  Message,
} from '@/components/ui/design-system';
import { estaAtrasado, obterDataAtual, useCuidados } from '@/features/cuidados/hooks/use-cuidados';
import { SeletorPessoa } from '@/features/cuidados/components/seletor-pessoa';

// Atalhos grandes e simplificados exibidos apenas para o perfil de idoso.
const elderLinks: {
  title: string;
  image: ImageSourcePropType;
  background: string;
  border: string;
  route: string;
}[] = [
  {
    title: 'Minha Rotina',
    image: require('../../../../assets/images/imagens/icones/casinha.png'),
    background: '#FFF0DF',
    border: '#FFDAB2',
    route: 'rotinas',
  },
  {
    title: 'Minhas Memórias',
    image: require('../../../../assets/images/imagens/icones/foto.png'),
    background: '#E4FFE4',
    border: '#B7F4C6',
    route: 'memorias',
  },
  {
    title: 'Emergência',
    image: require('../../../../assets/images/imagens/icones/telefone.png'),
    background: '#FFE4E6',
    border: '#FFB9C1',
    route: 'emergencia',
  },
  {
    title: 'Atividade do Dia',
    image: require('../../../../assets/images/imagens/icones/musica.png'),
    background: '#F4E3FF',
    border: '#DFC0FD',
    route: 'atividade',
  },
];

function Stat({
  value,
  label,
  icon,
  accent,
  background,
  onPress,
}: {
  value: string;
  label: string;
  icon: IconName;
  accent: string;
  background: string;
  onPress: () => void;
}) {
  const s = useEstilosTematicos(sBase);
  const { cor } = useTema();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.stat,
        { borderTopColor: cor(accent, 'texto') },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={[s.statIcon, { backgroundColor: cor(background, 'fundo') }]}>
        <Icon name={icon} color={accent} size={22} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Pressable>
  );
}

export default function Painel() {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const { usuario } = useAutenticacao();
  const cuidados = useCuidados();
  const elder = usuario?.tipo === 'idoso';
  const { width, fontScale } = useWindowDimensions();
  const leituraCompacta =
    width < 600 && (usuario?.preferencias?.font_scale || 1) * fontScale >= 1.4;

  // O resumo é calculado a partir da mesma lista retornada por useCuidados;
  // nenhuma chamada extra é necessária para os cartões do painel.
  const daily = cuidados.registros.filter((item) => item.data === obterDataAtual());
  const done = daily.filter((item) => item.status === 'concluido').length;
  const pending = daily.filter((item) => item.status !== 'concluido' && !estaAtrasado(item)).length;
  const late = cuidados.registros.filter(estaAtrasado).length;
  // Datas estão em AAAA-MM-DD e horários em HH:MM, então concatenar e ordenar
  // como texto mantém a ordem cronológica.
  const next = cuidados.registros
    .filter((item) => item.status !== 'concluido' && item.data >= obterDataAtual())
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))[0];
  const go = (tipo: string) =>
    router.push({ pathname: '/registros', params: { tipo, idosoId: cuidados.pessoaId } });
  const firstName = usuario?.nome.split(' ')[0] || '';

  // O idoso recebe uma apresentação própria, com menos opções e alvos maiores.
  if (elder) {
    return (
      <EstruturaAplicativo title="" section="inicio">
        <View
          style={[
            s.elderHero,
            leituraCompacta && { flexDirection: 'column', alignItems: 'stretch' },
          ]}
        >
          <View style={s.elderAvatar}>
            <Image source={art.elderHome} style={s.elderImage} resizeMode="contain" />
            <Image source={art.mascot} style={s.elderMascot} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.elderGreeting}>
              Olá,{'\n'}
              {firstName}!
            </Text>
            <Text style={s.elderDate}>
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </Text>
          </View>
        </View>
        <View style={s.elderLinks}>
          {elderLinks.map((link) => (
            <Pressable
              key={link.route}
              accessibilityRole="button"
              onPress={() =>
                link.route === 'emergencia'
                  ? router.push('/idoso/emergencia')
                  : link.route === 'atividade'
                    ? router.push('/idoso/atividade')
                    : go(link.route)
              }
              style={({ pressed }) => [
                s.elderLink,
                {
                  backgroundColor: cor(link.background, 'fundo'),
                  borderColor: cor(link.border, 'borda'),
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
              ]}
            >
              <Image source={link.image} style={s.elderLinkImage} resizeMode="contain" />
              <Text style={s.elderLinkTitle}>{link.title}</Text>
              <Icon name="chevron-forward" size={22} />
            </Pressable>
          ))}
        </View>
      </EstruturaAplicativo>
    );
  }

  // Responsável e cuidador compartilham o painel operacional abaixo.
  return (
    <EstruturaAplicativo title="" section="inicio">
      <View style={s.welcome}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={s.heroLabel}>SEU ESPAÇO DE CUIDADO</Text>
          <Text style={s.greeting}>Olá, {firstName}!</Text>
          <Text style={s.heroDescription}>
            {usuario?.tipo === 'cuidador'
              ? 'Seu cuidado faz a diferença.'
              : 'Acompanhe quem você ama.'}
          </Text>
        </View>
        {!leituraCompacta && <Image source={art.mascot} style={s.mascot} resizeMode="contain" />}
      </View>
      <Message>{cuidados.erro}</Message>
      {!!cuidados.erro && (
        <Action soft onPress={cuidados.carregar}>
          Tentar novamente
        </Action>
      )}
      {cuidados.carregando ? (
        <Loading />
      ) : !cuidados.pessoas.length && !cuidados.erro ? (
        <Empty
          image={art.mascot}
          title="Vamos começar?"
          text="Cadastre uma pessoa para organizar a rotina de cuidados."
        >
          <Action onPress={() => router.push('/pessoas')}>Cadastrar pessoa</Action>
        </Empty>
      ) : (
        cuidados.pessoa && (
          <>
            <SeletorPessoa
              people={cuidados.pessoas}
              selected={cuidados.pessoaId}
              onSelect={cuidados.selecionarPessoa}
            />
            <View style={s.sectionTitle}>
              <Text style={estilosDaTela.subheading}>Resumo do dia</Text>
              <Text style={estilosDaTela.muted}>
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </Text>
            </View>
            <View style={s.stats}>
              <Stat
                value={`${done}/${daily.length}`}
                label="Concluídas"
                icon="checkmark-circle-outline"
                accent={colors.teal}
                background={colors.green}
                onPress={() => go('rotinas')}
              />
              <Stat
                value={String(pending)}
                label="Pendentes"
                icon="time-outline"
                accent={colors.amber}
                background={colors.yellow}
                onPress={() => go('rotinas')}
              />
              <Stat
                value={String(late)}
                label="Em atraso"
                icon="alert-circle-outline"
                accent={colors.danger}
                background={colors.red}
                onPress={() => go('rotinas')}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => go(next?.tipo || 'rotinas')}
              style={({ pressed }) => [s.reminder, pressed && { opacity: 0.8 }]}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.reminderEyebrow}>PRÓXIMO LEMBRETE</Text>
                <Text style={estilosDaTela.subheading}>
                  {next?.titulo || 'Tudo em dia por aqui'}
                </Text>
                <Text style={s.reminderTime}>
                  {next
                    ? next.data.split('-').reverse().join('/') +
                      (next.horario ? ' · ' + next.horario : '')
                    : 'Adicione uma atividade à rotina'}
                </Text>
              </View>
              <Image
                source={
                  next?.tipo === 'medicamentos'
                    ? require('../../../../assets/images/imagens/icones/comprimido.png')
                    : require('../../../../assets/images/imagens/icones/calendario.png')
                }
                style={s.reminderImage}
                resizeMode="contain"
              />
            </Pressable>
            <Text style={estilosDaTela.subheading}>
              Acompanhar {cuidados.pessoa.nome.split(' ')[0]}
            </Text>
            <View style={s.quickGrid}>
              {(
                [
                  ['Rotina', 'calendar-outline', 'rotinas', '#F0E2FF'],
                  ['Consultas', 'calendar-number-outline', 'consultas', '#E9F6FF'],
                  ['Medicamentos', 'medkit-outline', 'medicamentos', '#FFF2E0'],
                  ['Memórias', 'images-outline', 'memorias', '#E8F9EB'],
                ] as [string, IconName, string, string][]
              ).map(([label, icon, type, background]) => (
                <Pressable
                  key={type}
                  accessibilityRole="button"
                  onPress={() => go(type)}
                  style={({ pressed }) => [s.quickCard, pressed && { opacity: 0.75 }]}
                >
                  <View style={[s.quickIcon, { backgroundColor: cor(background, 'fundo') }]}>
                    <Icon name={icon} size={27} />
                  </View>
                  <Text style={s.quickLabel}>{label}</Text>
                  <Icon name="arrow-forward" size={18} />
                </Pressable>
              ))}
            </View>
          </>
        )
      )}
    </EstruturaAplicativo>
  );
}

const sBase = StyleSheet.create({
  welcome: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 158,
    gap: 16,
    padding: 24,
    borderRadius: 22,
    backgroundColor: colors.purple,
  },
  heroLabel: { color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  heroDescription: { color: 'white', fontSize: 16, lineHeight: 24 },
  greeting: { color: 'white', fontWeight: '800', fontSize: 30, lineHeight: 37 },
  mascot: { width: 82, height: 94 },
  sectionTitle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  stats: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    minWidth: 0,
    minHeight: 150,
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderTopWidth: 4,
    borderColor: colors.line,
    backgroundColor: 'white',
  },
  statValue: { color: colors.ink, fontWeight: '800', fontSize: 28, lineHeight: 34 },
  statLabel: {
    color: colors.body,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    minHeight: 120,
    backgroundColor: colors.pale,
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: colors.line,
    borderLeftColor: colors.purple,
  },
  reminderEyebrow: {
    color: colors.purple,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  reminderTime: { color: colors.purple, fontWeight: '600', fontSize: 15, lineHeight: 22 },
  reminderImage: { width: 54, height: 54 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 16,
    minHeight: 122,
    gap: 10,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { color: colors.ink, fontWeight: '700', fontSize: 16, lineHeight: 23 },
  elderHero: {
    backgroundColor: colors.purple,
    minHeight: 170,
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  elderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.pale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elderImage: { width: 98, height: 98 },
  elderMascot: { position: 'absolute', top: -14, right: -12, width: 48, height: 45 },
  elderGreeting: { color: 'white', fontWeight: '800', fontSize: 30, lineHeight: 38 },
  elderDate: { color: 'white', fontSize: 16, lineHeight: 24, marginTop: 8 },
  elderLinks: { gap: 15, paddingTop: 5 },
  elderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    minHeight: 111,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  elderLinkImage: { width: 68, height: 68 },
  elderLinkTitle: { flex: 1, color: colors.ink, fontWeight: '700', fontSize: 24, lineHeight: 32 },
});
