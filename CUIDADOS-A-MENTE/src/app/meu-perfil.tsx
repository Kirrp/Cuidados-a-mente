import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { AppShell } from '../components/app-shell';
import { Action, art, colors, d, Icon, IconName, Input, Message } from '../components/design';

type MenuItem = { title: string; text: string; icon: IconName; onPress: () => void };
function MenuRow({ item }: { item: MenuItem }) {
  return <Pressable accessibilityRole="button" onPress={item.onPress} style={({ pressed }) => [s.menuRow, pressed && { backgroundColor: colors.pale }]}>
    <View style={s.menuIcon}><Icon name={item.icon} size={26} /></View>
    <View style={{ flex: 1 }}><Text style={s.menuTitle}>{item.title}</Text><Text style={d.muted}>{item.text}</Text></View>
    <Icon name="chevron-forward" size={21} />
  </Pressable>;
}

export default function Perfil() {
  const { usuario, atualizar, sair } = useAuth();
  const profile = usuario ? JSON.parse(usuario.perfil) as Record<string, string> : {};
  const [edit, setEdit] = useState(false), [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const role = usuario?.tipo === 'responsavel' ? 'Responsável' : usuario?.tipo === 'cuidador' ? 'Cuidador' : 'Idoso';

  function begin() { setDraft({ ...profile, nome: usuario?.nome || '' }); setEdit(true); setNotice(''); }
  async function save() { if (busy) return; setBusy(true); setError(''); try { await atualizar(draft); setEdit(false); setNotice('Perfil atualizado.'); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function logout() { if (busy) return; setBusy(true); setError(''); try { await sair(); router.replace('/'); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } }

  const menu: MenuItem[] = [
    { title: 'Informações pessoais', text: 'Confira ou edite seus dados', icon: 'person-outline', onPress: begin },
    ...(usuario?.tipo === 'idoso' ? [] : [
      { title: 'Pessoas acompanhadas', text: 'Dados e cadastros dos idosos', icon: 'people-outline' as IconName, onPress: () => router.push('/pessoas') },
      { title: 'Acesso por QR Code', text: 'Prepare a conta do idoso', icon: 'qr-code-outline' as IconName, onPress: () => router.push('/contas-idosos') },
    ]),
    { title: 'Lembretes', text: 'Atividades que precisam de atenção', icon: 'notifications-outline', onPress: () => router.push('/registros?tipo=rotinas&filtro=Pendentes') },
    { title: 'Contato de emergência', text: profile.nomeEmergencia || 'Cadastre uma pessoa de confiança', icon: 'call-outline', onPress: begin },
  ];

  return <AppShell title="Meu perfil" section="perfil">
    <View style={s.hero}><View style={s.avatar}><Image source={usuario?.tipo === 'idoso' ? art.elder : usuario?.tipo === 'cuidador' ? art.carer : art.family} style={s.avatarImage} resizeMode="contain" /></View><View style={{ flex: 1, gap: 5 }}><Text style={s.name} numberOfLines={2}>{usuario?.nome}</Text><Text style={d.body}>Meu espaço de cuidado</Text><View style={s.role}><Text style={s.roleText}>{role}</Text></View></View></View>
    <Message>{error}</Message><Message success>{notice}</Message>
    <View style={s.contactCard}>
      <View style={s.contactRow}><Icon name={usuario?.tipo === 'idoso' ? 'qr-code-outline' : 'mail-outline'} /><Text style={[d.body, { flex: 1 }]}>{usuario?.tipo === 'idoso' ? 'Acesso por QR Code' : usuario?.email}</Text></View>
      {!!profile.celular && <View style={s.contactRow}><Icon name="call-outline" /><Text style={d.body}>{profile.celular}</Text></View>}
      {!!profile.cidade && <View style={s.contactRow}><Icon name="location-outline" /><Text style={d.body}>{profile.cidade}{profile.estado ? ', ' + profile.estado : ''}</Text></View>}
    </View>
    {edit ? <View style={d.card}><Text style={d.subheading}>Informações pessoais</Text>{([['nome', 'Nome completo'], ['celular', 'Celular'], ['telefone', 'Telefone'], ['cep', 'CEP'], ['rua', 'Rua'], ['bairro', 'Bairro'], ['cidade', 'Cidade'], ['estado', 'Estado (UF)'], ['numero', 'Número'], ['complemento', 'Complemento'], ['nomeEmergencia', 'Nome do contato de emergência'], ['telefoneEmergencia', 'Telefone de emergência']] as const).map(([key, label]) => <Input key={key} label={label} value={draft[key] || ''} onChangeText={value => setDraft(previous => ({ ...previous, [key]: value }))} />)}<Action disabled={busy} onPress={save}>{busy ? 'Salvando...' : 'Salvar alterações'}</Action><Action soft disabled={busy} onPress={() => setEdit(false)}>Cancelar</Action></View> : <View style={s.menuCard}>{menu.map(item => <MenuRow key={item.title} item={item} />)}</View>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={logout} style={({ pressed }) => [s.logout, pressed && { opacity: .7 }]}><Icon name="log-out-outline" color="#C84255" /><Text style={s.logoutText}>Sair da conta</Text></Pressable>
  </AppShell>;
}

const s = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EEDBFF', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 116, height: 116 },
  name: { color: colors.ink, fontFamily: 'Jua', fontSize: 29, lineHeight: 32 },
  role: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9, backgroundColor: '#EBD2FF' },
  roleText: { color: colors.purple, fontSize: 13, fontWeight: '700' },
  contactCard: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 17, gap: 17 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuCard: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, paddingHorizontal: 13, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
  menuIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: colors.ink, fontFamily: 'Jua', fontSize: 18 },
  logout: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minWidth: 240, minHeight: 46, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#FFE7E9' },
  logoutText: { color: '#B52C47', fontFamily: 'Jua', fontSize: 17 },
});
