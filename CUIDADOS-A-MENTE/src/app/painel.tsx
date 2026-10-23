import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { AppShell } from '../components/app-shell';
import { Action, art, colors, d, Empty, Icon, IconName, Loading, Message } from '../components/design';
import { useCare, today, isLate } from '../hooks/use-care';
import { PersonPicker } from '../components/person-picker';

const elderLinks: { title: string; image: ImageSourcePropType; background: string; border: string; route: string }[] = [
  { title: 'Minha Rotina', image: require('../../assets/images/imagens/icones/casinha.png'), background: '#FFF0DF', border: '#FFDAB2', route: 'rotinas' },
  { title: 'Minhas Memórias', image: require('../../assets/images/imagens/icones/foto.png'), background: '#E4FFE4', border: '#B7F4C6', route: 'memorias' },
  { title: 'Emergência', image: require('../../assets/images/imagens/icones/telefone.png'), background: '#FFE4E6', border: '#FFB9C1', route: 'emergencia' },
  { title: 'Atividade do Dia', image: require('../../assets/images/imagens/icones/musica.png'), background: '#F4E3FF', border: '#DFC0FD', route: 'atividade' },
];

function Stat({ value, label, image, background, onPress }: { value: string; label: string; image: ImageSourcePropType; background: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.stat, { backgroundColor: background }, pressed && { opacity: .8 }]}>
    <Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text><Image source={image} style={s.statIcon} resizeMode="contain" />
  </Pressable>;
}

export default function Painel() {
  const { usuario } = useAuth();
  const care = useCare();
  const elder = usuario?.tipo === 'idoso';
  const daily = care.items.filter(item => item.data === today());
  const done = daily.filter(item => item.status === 'concluido').length;
  const pending = daily.filter(item => item.status !== 'concluido' && !isLate(item)).length;
  const late = care.items.filter(isLate).length;
  const next = care.items.filter(item => item.status !== 'concluido' && item.data >= today()).sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))[0];
  const go = (tipo: string) => router.push({ pathname: '/registros', params: { tipo, idosoId: care.personId } });
  const firstName = usuario?.nome.split(' ')[0] || '';

  if (elder) return <AppShell title="" section="inicio">
    <View style={s.elderHero}>
      <View style={s.elderAvatar}><Image source={art.elderHome} style={s.elderImage} resizeMode="contain" /><Image source={art.mascot} style={s.elderMascot} resizeMode="contain" /></View>
      <View style={{ flex: 1 }}><Text style={s.elderGreeting}>Olá,{ '\n' }{firstName}!</Text><Text style={s.elderDate}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</Text></View>
    </View>
    <View style={s.elderLinks}>{elderLinks.map(link => <Pressable key={link.route} accessibilityRole="button" onPress={() => link.route === 'emergencia' ? router.push('/idoso/emergencia') : link.route === 'atividade' ? router.push('/idoso/atividade') : go(link.route)} style={({ pressed }) => [s.elderLink, { backgroundColor: link.background, borderColor: link.border }, pressed && { opacity: .8, transform: [{ scale: .99 }] }]}><Image source={link.image} style={s.elderLinkImage} resizeMode="contain" /><Text style={s.elderLinkTitle}>{link.title}</Text><Icon name="chevron-forward" size={22} /></Pressable>)}</View>
  </AppShell>;

  return <AppShell title="" section="inicio">
    <View style={s.welcome}>
      <View style={{ flex: 1 }}><Text style={s.greeting}>Olá, {firstName}!</Text><Text style={d.muted}>{usuario?.tipo === 'cuidador' ? 'Seu cuidado faz a diferença.' : 'Acompanhe quem você ama.'}</Text></View>
      <Image source={art.mascot} style={s.mascot} resizeMode="contain" />
    </View>
    <Message>{care.error}</Message>{!!care.error && <Action soft onPress={care.load}>Tentar novamente</Action>}
    {care.loading ? <Loading /> : !care.people.length && !care.error ? <Empty image={art.mascot} title="Vamos começar?" text="Cadastre uma pessoa para organizar a rotina de cuidados."><Action onPress={() => router.push('/pessoas')}>Cadastrar pessoa</Action></Empty> : care.person && <>
      <PersonPicker people={care.people} selected={care.personId} onSelect={care.select} />
      <View style={s.sectionTitle}><Text style={d.subheading}>Resumo do dia</Text><Text style={d.muted}>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</Text></View>
      <View style={s.stats}>
        <Stat value={`${done}/${daily.length}`} label="Concluídas" image={require('../../assets/images/imagens/icones/concluido.png')} background={colors.green} onPress={() => go('rotinas')} />
        <Stat value={String(pending)} label="Pendentes" image={require('../../assets/images/imagens/icones/pendente.png')} background={colors.yellow} onPress={() => go('rotinas')} />
        <Stat value={String(late)} label="Em atraso" image={require('../../assets/images/imagens/icones/atraso.png')} background={colors.red} onPress={() => go('rotinas')} />
      </View>
      <Pressable accessibilityRole="button" onPress={() => go(next?.tipo || 'rotinas')} style={({ pressed }) => [s.reminder, pressed && { opacity: .8 }]}>
        <View style={{ flex: 1, gap: 3 }}><Text style={s.reminderEyebrow}>◷ PRÓXIMO LEMBRETE</Text><Text style={d.subheading}>{next?.titulo || 'Tudo em dia por aqui'}</Text><Text style={s.reminderTime}>{next ? next.data.split('-').reverse().join('/') + (next.horario ? ' · ' + next.horario : '') : 'Adicione uma atividade à rotina'}</Text></View>
        <Image source={next?.tipo === 'medicamentos' ? require('../../assets/images/imagens/icones/comprimido.png') : require('../../assets/images/imagens/icones/calendario.png')} style={s.reminderImage} resizeMode="contain" />
      </Pressable>
      <Text style={d.subheading}>Acompanhar {care.person.nome.split(' ')[0]}</Text>
      <View style={s.quickGrid}>{([
        ['Rotina', 'calendar-outline', 'rotinas', '#F0E2FF'],
        ['Consultas', 'location-outline', 'consultas', '#E9F6FF'],
        ['Medicamentos', 'medkit-outline', 'medicamentos', '#FFF2E0'],
        ['Memórias', 'images-outline', 'memorias', '#E8F9EB'],
      ] as [string, IconName, string, string][]).map(([label, icon, type, background]) => <Pressable key={type} accessibilityRole="button" onPress={() => go(type)} style={({ pressed }) => [s.quickCard, pressed && { opacity: .75 }]}><View style={[s.quickIcon, { backgroundColor: background }]}><Icon name={icon} size={27} /></View><Text style={s.quickLabel}>{label}</Text><Icon name="arrow-forward" size={18} /></Pressable>)}</View>
    </>}
  </AppShell>;
}

const s = StyleSheet.create({
  welcome: { flexDirection: 'row', alignItems: 'center', minHeight: 91, gap: 10 },
  greeting: { color: colors.ink, fontFamily: 'Jua', fontSize: 29 },
  mascot: { width: 104, height: 94 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, minHeight: 132, padding: 12, borderRadius: 17, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#FFFFFF', boxShadow: '0 4px 8px rgba(55, 24, 68, 0.10)' },
  statValue: { color: colors.ink, fontFamily: 'Jua', fontSize: 28 },
  statLabel: { color: '#493651', fontFamily: 'Jua', fontSize: 15, textAlign: 'center' },
  statIcon: { width: 30, height: 30 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, minHeight: 112, backgroundColor: '#F8F0FF', borderRadius: 19, borderWidth: 1, borderColor: '#EAD8F7' },
  reminderEyebrow: { color: colors.purple, fontSize: 10, fontWeight: '700', letterSpacing: .8 },
  reminderTime: { color: '#A03DDD', fontFamily: 'Jua', fontSize: 16 },
  reminderImage: { width: 61, height: 61 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { flexBasis: '47%', flexGrow: 1, backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 13, minHeight: 90, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickIcon: { width: 41, height: 41, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.ink, fontFamily: 'Jua', fontSize: 16, flex: 1 },
  elderHero: { backgroundColor: colors.nav, minHeight: 170, marginHorizontal: -18, marginTop: -18, paddingHorizontal: 20, paddingBottom: 17, flexDirection: 'row', alignItems: 'center', gap: 16 },
  elderAvatar: { width: 145, height: 145, borderRadius: 75, backgroundColor: '#E4FFFF', justifyContent: 'center', alignItems: 'center' },
  elderImage: { width: 141, height: 141 },
  elderMascot: { position: 'absolute', top: -14, right: -17, width: 68, height: 55 },
  elderGreeting: { color: colors.ink, fontFamily: 'Jua', fontSize: 33, lineHeight: 38 },
  elderDate: { color: colors.ink, fontSize: 16, lineHeight: 23, marginTop: 7 },
  elderLinks: { gap: 15, paddingTop: 5 },
  elderLink: { flexDirection: 'row', alignItems: 'center', gap: 15, minHeight: 111, padding: 13, borderRadius: 16, borderWidth: 1 },
  elderLinkImage: { width: 82, height: 82 },
  elderLinkTitle: { flex: 1, color: colors.ink, fontFamily: 'Jua', fontSize: 26, lineHeight: 31 },
});
