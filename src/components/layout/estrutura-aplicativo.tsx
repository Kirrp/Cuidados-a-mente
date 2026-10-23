import { ElementRef, ReactNode, useCallback, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, usePathname } from 'expo-router';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { useEstilosTematicos } from '@/core/tema/contexto-tema';
import { Guard } from '@/components/ui/interface-base';
import { art, colors, d as dBase, Icon, IconButton, IconName } from '@/components/ui/design-system';

export type SecaoAplicativo =
  | 'inicio'
  | 'rotinas'
  | 'memorias'
  | 'idosos'
  | 'consultas'
  | 'medicamentos'
  | 'relatorios'
  | 'perfil'
  | 'emergencia';
const itensNavegacao: { key: SecaoAplicativo; title: string; icon: IconName; route: string }[] = [
  { key: 'inicio', title: 'Início', icon: 'home-outline', route: '/painel' },
  { key: 'rotinas', title: 'Rotina', icon: 'calendar-outline', route: '/registros?tipo=rotinas' },
  { key: 'memorias', title: 'Memórias', icon: 'images-outline', route: '/registros?tipo=memorias' },
  { key: 'idosos', title: 'Pessoas', icon: 'people-outline', route: '/pessoas' },
  { key: 'consultas', title: 'Consultas', icon: 'calendar-number-outline', route: '/consultas' },
  { key: 'medicamentos', title: 'Remédios', icon: 'medkit-outline', route: '/medicamentos' },
  {
    key: 'relatorios',
    title: 'Relatórios',
    icon: 'stats-chart-outline',
    route: '/responsavel/relatorio_responsavel',
  },
  { key: 'perfil', title: 'Perfil', icon: 'person-circle-outline', route: '/meu-perfil' },
  { key: 'emergencia', title: 'Emergência', icon: 'call-outline', route: '/idoso/emergencia' },
];

// A mesma lista abastece o menu móvel e a navegação lateral, sempre com permissões.
export function EstruturaAplicativo({
  title,
  section,
  children,
  right,
  back = false,
}: {
  title: string;
  section: SecaoAplicativo;
  children: ReactNode;
  right?: ReactNode;
  back?: boolean;
}) {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);
  const { width, fontScale } = useWindowDimensions();
  const desktop = width >= 1024;
  const caminho = usePathname();
  const {
    usuario,
    recarregarUsuario,
    permissoesNavegacao: permissoes,
    recarregarPermissoesNavegacao,
  } = useAutenticacao();
  const [menu, setMenu] = useState(false);
  const fecharMenu = useRef<ElementRef<typeof Pressable>>(null);
  const elder = usuario?.tipo === 'idoso';
  const usuarioId = usuario?.id;
  const tipoUsuario = usuario?.tipo;
  useFocusEffect(
    useCallback(() => {
      if (!usuarioId) {
        return;
      }
      // Compartilhadas entre telas: atualizar não desmonta os atalhos durante a consulta.
      void recarregarPermissoesNavegacao().catch(() => {});
      if (tipoUsuario === 'idoso') {
        void recarregarUsuario().catch(() => {});
      }
    }, [usuarioId, tipoUsuario, recarregarUsuario, recarregarPermissoesNavegacao]),
  );
  const pode = (chave: string) => permissoes.includes(chave);
  const tabs = itensNavegacao.filter((entry) => {
    if (entry.key === 'inicio' || entry.key === 'perfil') {
      return true;
    }
    if (entry.key === 'idosos') {
      return !elder && pode('ver_perfil_idoso');
    }
    if (entry.key === 'emergencia') {
      return pode('ver_contato_emergencia');
    }
    if (entry.key === 'relatorios') {
      return !elder && pode('ver_relatorios');
    }
    return pode('ver_' + entry.key);
  });
  const extra =
    caminho === '/acompanhamento'
      ? 'acompanhamento'
      : ['/configuracoes', '/privacidade', '/localizacao'].includes(caminho)
        ? 'configuracoes'
        : null;
  // Com letras ampliadas, uma opção passa ao menu para preservar os rótulos.
  const leituraAmpliada = (usuario?.preferencias?.font_scale || 1) * fontScale >= 1.4;
  const prioridade: SecaoAplicativo[] = elder
    ? leituraAmpliada
      ? ['inicio', 'emergencia', 'perfil']
      : ['inicio', 'rotinas', 'emergencia', 'perfil']
    : leituraAmpliada
      ? ['inicio', 'rotinas', 'perfil']
      : ['inicio', 'rotinas', 'memorias', 'perfil'];
  const principais = prioridade
    .map((key) => tabs.find((tab) => tab.key === key))
    .filter((tab): tab is (typeof itensNavegacao)[number] => !!tab);
  const selecionado = (key: SecaoAplicativo) => !extra && section === key;
  const navegar = (route: string, empilhar = false) => {
    setMenu(false);
    if (empilhar) {
      router.push(route as never);
    } else {
      router.replace(route as never);
    }
  };
  function destinos(lateral = false) {
    const texto = lateral ? s.sideText : estilosDaTela.body;
    return (
      <>
        {tabs.map((entry) => (
          <Pressable
            key={entry.key}
            accessibilityRole="button"
            accessibilityLabel={entry.title}
            aria-selected={selecionado(entry.key)}
            accessibilityState={{ selected: selecionado(entry.key) }}
            onPress={() => navegar(entry.route)}
            style={({ pressed }) => [
              s.menuItem,
              lateral && s.sideItem,
              selecionado(entry.key) && (lateral ? s.sideActive : s.menuActive),
              pressed && { opacity: 0.8 },
            ]}
          >
            <Icon
              name={entry.icon}
              color={lateral || selecionado(entry.key) ? 'white' : colors.purple}
              size={22}
            />
            <Text
              style={[
                texto,
                selecionado(entry.key) && { color: 'white', fontWeight: '700' },
                { flex: 1, minWidth: 0 },
              ]}
            >
              {entry.title}
            </Text>
          </Pressable>
        ))}
        <View style={[s.divider, lateral && { backgroundColor: '#65497D' }]} />
        {!elder && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Diário, histórico e contatos"
            onPress={() => navegar('/acompanhamento', true)}
            style={[
              s.menuItem,
              lateral && s.sideItem,
              extra === 'acompanhamento' && (lateral ? s.sideActive : s.menuActive),
            ]}
          >
            <Icon
              name="journal-outline"
              color={lateral || extra === 'acompanhamento' ? 'white' : colors.purple}
              size={22}
            />
            <Text
              style={[
                texto,
                { flex: 1, minWidth: 0 },
                extra === 'acompanhamento' && { color: 'white' },
              ]}
            >
              Acompanhamento
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Configurações e privacidade"
          onPress={() => navegar('/configuracoes', true)}
          style={[
            s.menuItem,
            lateral && s.sideItem,
            extra === 'configuracoes' && (lateral ? s.sideActive : s.menuActive),
          ]}
        >
          <Icon
            name="settings-outline"
            color={lateral || extra === 'configuracoes' ? 'white' : colors.purple}
            size={22}
          />
          <Text
            style={[
              texto,
              { flex: 1, minWidth: 0 },
              extra === 'configuracoes' && { color: 'white' },
            ]}
          >
            Configurações
          </Text>
        </Pressable>
      </>
    );
  }
  return (
    <Guard>
      <SafeAreaView style={s.safe}>
        <View style={[s.workspace, desktop && s.desktopWorkspace]}>
          {desktop && (
            <View role="navigation" accessibilityLabel="Navegação principal" style={s.sidebar}>
              <View style={s.sideBrand}>
                <View style={s.sideLogo}>
                  <Image source={art.logo} style={{ width: 38, height: 38 }} resizeMode="contain" />
                </View>
                <Text style={s.sideBrandText}>Cuidados{'\n'}à Mente</Text>
              </View>
              <Text style={s.sideCaption}>SEU ESPAÇO DE CUIDADO</Text>
              <ScrollView
                contentContainerStyle={{ gap: 5, paddingBottom: 20 }}
                showsVerticalScrollIndicator
              >
                {destinos(true)}
              </ScrollView>
              <View style={s.sideAccount}>
                <Icon name="person-circle-outline" color="white" size={28} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.sideText}>{usuario?.nome}</Text>
                  <Text style={s.sideAccountRole}>
                    {elder
                      ? 'Pessoa acompanhada'
                      : tipoUsuario === 'cuidador'
                        ? 'Cuidador'
                        : 'Responsável'}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <View style={s.frame}>
            <View style={s.header}>
              {back ? (
                <IconButton
                  name="arrow-back"
                  label="Voltar"
                  onPress={() => (router.canGoBack() ? router.back() : router.replace('/painel'))}
                />
              ) : !desktop ? (
                <IconButton name="menu-outline" label="Abrir menu" onPress={() => setMenu(true)} />
              ) : (
                <View style={{ width: 44 }} />
              )}
              <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
                <Text style={s.headerEyebrow}>CUIDADOS À MENTE</Text>
                <Text accessibilityRole="header" style={s.headerTitle}>
                  {title || 'Visão geral'}
                </Text>
              </View>
              {right || (
                <IconButton
                  name="notifications-outline"
                  label="Ver lembretes"
                  onPress={() => router.push('/registros?tipo=rotinas&filtro=Pendentes')}
                />
              )}
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[s.content, desktop && { padding: 32 }]}
            >
              {children}
            </ScrollView>
            {!desktop && (
              <View role="navigation" accessibilityLabel="Navegação principal" style={s.tabs}>
                {principais.map((entry) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={entry.title}
                    aria-selected={selecionado(entry.key)}
                    accessibilityState={{ selected: selecionado(entry.key) }}
                    key={entry.key}
                    onPress={() => navegar(entry.route)}
                    style={({ pressed }) => [
                      s.tab,
                      selecionado(entry.key) && s.activeTab,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Icon
                      name={entry.icon}
                      size={23}
                      color={selecionado(entry.key) ? 'white' : colors.muted}
                    />
                    <Text style={[s.tabText, selecionado(entry.key) && { color: 'white' }]}>
                      {entry.title}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mais opções"
                  onPress={() => setMenu(true)}
                  style={[
                    s.tab,
                    (!!extra || !principais.some((entry) => entry.key === section)) && s.activeTab,
                  ]}
                >
                  <Icon
                    name="grid-outline"
                    size={23}
                    color={
                      extra || !principais.some((entry) => entry.key === section)
                        ? 'white'
                        : colors.muted
                    }
                  />
                  <Text
                    style={[
                      s.tabText,
                      (!!extra || !principais.some((entry) => entry.key === section)) && {
                        color: 'white',
                      },
                    ]}
                  >
                    Mais
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
          <Modal
            visible={menu}
            transparent
            animationType="fade"
            onShow={() => fecharMenu.current?.focus()}
            onRequestClose={() => setMenu(false)}
          >
            <Pressable style={s.overlay} onPress={() => setMenu(false)} accessible={false}>
              <View
                accessibilityViewIsModal
                aria-modal
                role="dialog"
                accessibilityLabel="Menu do aplicativo"
                style={s.menu}
              >
                <View style={s.menuHeader}>
                  <Text style={[estilosDaTela.subheading, { flex: 1, minWidth: 0 }]}>
                    Seu espaço de cuidado
                  </Text>
                  <Pressable
                    ref={fecharMenu}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar menu"
                    onPress={() => setMenu(false)}
                    style={s.close}
                  >
                    <Icon name="close-outline" />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={{ gap: 6 }} keyboardShouldPersistTaps="handled">
                  {destinos()}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>
        </View>
      </SafeAreaView>
    </Guard>
  );
}
const sBase = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  workspace: { flex: 1, flexDirection: 'row', width: '100%', maxWidth: 1240, alignSelf: 'center' },
  desktopWorkspace: {
    marginVertical: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    boxShadow: '0 16px 45px rgba(40,19,63,.08)',
  },
  frame: { flex: 1, minWidth: 0, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 80,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerEyebrow: {
    color: colors.purple,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  content: {
    padding: 18,
    gap: 20,
    flexGrow: 1,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    padding: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    gap: 5,
    borderRadius: 15,
  },
  activeTab: { backgroundColor: colors.purple },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  sidebar: { width: 248, padding: 18, backgroundColor: colors.sidebar, gap: 16 },
  sideBrand: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 },
  sideLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBrandText: { flexShrink: 1, color: 'white', fontSize: 22, lineHeight: 27, fontWeight: '800' },
  sideCaption: { color: '#DDD0EB', fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  sideItem: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 0 },
  sideText: { color: 'white', fontSize: 15, lineHeight: 22, fontWeight: '600', flexShrink: 1 },
  sideActive: { backgroundColor: colors.purple },
  sideAccount: {
    borderTopWidth: 1,
    borderTopColor: '#65497D',
    paddingTop: 20,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sideAccountRole: { color: '#DDD0EB', fontSize: 12, lineHeight: 18 },
  overlay: {
    flex: 1,
    backgroundColor: '#1B0D2D99',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menu: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  close: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pale,
    borderRadius: 14,
  },
  menuItem: {
    minHeight: 52,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  menuActive: { backgroundColor: colors.purple },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
});
