import { ReactNode, useState } from 'react';
import { Image, ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Guard } from './app-ui';
import { colors, d, Icon, IconButton, IconName } from './design';

export type Section = 'inicio' | 'rotinas' | 'memorias' | 'idosos' | 'consultas' | 'medicamentos' | 'relatorios' | 'perfil' | 'emergencia';
const entries: { key: Section; title: string; icon: IconName; route: string }[] = [
  { key: 'inicio', title: 'Início', icon: 'home-outline', route: '/painel' },
  { key: 'rotinas', title: 'Rotina', icon: 'calendar-outline', route: '/registros?tipo=rotinas' },
  { key: 'memorias', title: 'Memórias', icon: 'images-outline', route: '/registros?tipo=memorias' },
  { key: 'idosos', title: 'Idosos', icon: 'people-outline', route: '/pessoas' },
  { key: 'consultas', title: 'Consultas', icon: 'location-outline', route: '/consultas' },
  { key: 'medicamentos', title: 'Remédios', icon: 'medkit-outline', route: '/medicamentos' },
  { key: 'relatorios', title: 'Relatórios', icon: 'stats-chart-outline', route: '/responsavel/relatorio_responsavel' },
  { key: 'perfil', title: 'Perfil', icon: 'person-circle-outline', route: '/meu-perfil' },
  { key: 'emergencia', title: 'Emergência', icon: 'call-outline', route: '/idoso/emergencia' },
];
const tabArt: Record<Section, [ImageSourcePropType, ImageSourcePropType]> = {
  inicio: [require('../../assets/images/imagens/icones/inicial.png'), require('../../assets/images/imagens/icones/inicialSelecionado.png')],
  rotinas: [require('../../assets/images/imagens/icones/rotina.png'), require('../../assets/images/imagens/icones/rotinaSelecionado.png')],
  memorias: [require('../../assets/images/imagens/icones/memorias.png'), require('../../assets/images/imagens/icones/memoriasSelecionado.png')],
  idosos: [require('../../assets/images/imagens/icones/idosoArea.png'), require('../../assets/images/imagens/icones/idosoSelecionado.png')],
  consultas: [require('../../assets/images/imagens/icones/consulta.png'), require('../../assets/images/imagens/icones/consultaSelecionado.png')],
  medicamentos: [require('../../assets/images/imagens/icones/remedio.png'), require('../../assets/images/imagens/icones/remedio.png')],
  relatorios: [require('../../assets/images/imagens/icones/relatorios.png'), require('../../assets/images/imagens/icones/relatoriosSelecionado.png')],
  perfil: [require('../../assets/images/imagens/icones/perfil.png'), require('../../assets/images/imagens/icones/perfilSelecionado.png')],
  emergencia: [require('../../assets/images/imagens/icones/emergencia.png'), require('../../assets/images/imagens/icones/emergenciaSelecionado.png')],
};

export function AppShell({ title, section, children, right, back = false }: { title: string; section: Section; children: ReactNode; right?: ReactNode; back?: boolean }) {
  const { usuario } = useAuth();
  const [menu, setMenu] = useState(false);
  const elder = usuario?.tipo === 'idoso';
  const tabs = entries.filter(entry => elder
    ? ['inicio', 'rotinas', 'memorias', 'emergencia'].includes(entry.key)
    : entry.key !== 'emergencia' && (usuario?.tipo === 'responsavel' ? entry.key !== 'medicamentos' : entry.key !== 'relatorios'));
  const menuEntries = elder ? [...tabs, entries.find(entry => entry.key === 'perfil')!] : tabs;

  return <Guard><SafeAreaView style={s.safe}><View style={s.frame}>
    <View style={[s.header, elder && section === 'inicio' && s.elderHeader]}>
      <IconButton name={back ? 'arrow-back' : 'menu-outline'} label={back ? 'Voltar' : 'Abrir menu'} onPress={() => back ? router.canGoBack() ? router.back() : router.replace('/painel') : setMenu(true)} />
      <Text accessibilityRole="header" numberOfLines={1} style={s.headerTitle}>{title}</Text>
      {right || <IconButton name="notifications-outline" label="Ver lembretes" onPress={() => router.push('/registros?tipo=rotinas&filtro=Pendentes')} />}
    </View>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView>
    <View style={s.tabs}>{tabs.map(entry => {
      const active = section === entry.key;
      return <Pressable accessibilityRole="button" accessibilityLabel={entry.title} accessibilityState={{ selected: active }} key={entry.key} onPress={() => router.replace(entry.route as never)} style={({ pressed }) => [s.tab, active && s.activeTab, pressed && { opacity: .7 }]}>
        <Image source={tabArt[entry.key][active ? 1 : 0]} style={[s.tabIcon, elder && s.elderTabIcon]} resizeMode="contain" />
        <Text numberOfLines={1} style={[s.tabText, elder && s.elderTabText]}>{entry.title}</Text>
      </Pressable>;
    })}</View>
    <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}><Pressable style={s.overlay} onPress={() => setMenu(false)} accessibilityLabel="Fechar menu"><Pressable style={s.menu} onPress={() => {}}>
      <Text style={d.heading}>Cuidados à Mente</Text><Text style={d.muted}>Para onde vamos?</Text>
      {menuEntries.map(entry => <Pressable key={entry.key} accessibilityRole="button" style={s.menuItem} onPress={() => { setMenu(false); router.push(entry.route as never); }}><View style={s.menuIcon}><Icon name={entry.icon} /></View><Text style={[d.body, { flex: 1 }]}>{entry.title}</Text><Icon name="chevron-forward" size={18} /></Pressable>)}
    </Pressable></Pressable></Modal>
  </View></SafeAreaView></Guard>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0FA' },
  frame: { flex: 1, backgroundColor: colors.surface, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, minHeight: 66, backgroundColor: 'white' },
  elderHeader: { backgroundColor: colors.nav },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.ink, fontFamily: 'Jua', fontSize: 22 },
  content: { padding: 18, gap: 18, flexGrow: 1, paddingBottom: 32 },
  tabs: { backgroundColor: colors.nav, flexDirection: 'row', paddingTop: 5, paddingBottom: 5, minHeight: 69, borderTopWidth: 1, borderTopColor: '#E9D5F7' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 3, borderRadius: 11 },
  activeTab: { backgroundColor: '#E4CBF8' },
  tabIcon: { width: 26, height: 26 },
  elderTabIcon: { width: 30, height: 30 },
  tabText: { fontFamily: 'Jua', fontSize: 10, color: colors.ink, textAlign: 'center' },
  elderTabText: { fontSize: 12 },
  overlay: { flex: 1, backgroundColor: '#2D173F77', justifyContent: 'center', alignItems: 'center', padding: 26 },
  menu: { width: '100%', maxWidth: 360, backgroundColor: 'white', borderRadius: 24, padding: 22, gap: 8 },
  menuItem: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  menuIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
});
