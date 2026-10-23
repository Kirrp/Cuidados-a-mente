import { useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { api, Registro, TipoRegistro } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { dateLabel, isLate, today, useCare } from '../hooks/use-care';
import { AppShell } from './app-shell';
import { Action, art, colors, d, Empty, Icon, Input, Loading, Message } from './design';
import { PersonPicker } from './person-picker';
const labels = { consultas: 'Consultas', medicamentos: 'Medicamentos', rotinas: 'Rotina', memorias: 'Banco de Memórias' };
const singular = { consultas: 'consulta', medicamentos: 'medicamento', rotinas: 'atividade', memorias: 'memória' };
const icon = { consultas: 'location-outline', medicamentos: 'medkit-outline', rotinas: 'calendar-outline', memorias: 'images-outline' } as const;
const fresh = () => ({ titulo: '', data: dateLabel(today()), horario: '', detalhes: '', categoria: 'Histórias', midia: '' });
export function RegistrosScreen({ tipo }: { tipo: TipoRegistro }) {
  const params = useLocalSearchParams<{ idosoId?: string; filtro?: string }>();
  const care = useCare(tipo, params.idosoId);
  return <RegistrosContent key={`${tipo}:${params.filtro || ''}:${care.personId}`} tipo={tipo} initialFilter={params.filtro} care={care} />;
}

function RegistrosContent({ tipo, initialFilter, care }: { tipo: TipoRegistro; initialFilter?: string; care: ReturnType<typeof useCare> }) {
  const { usuario } = useAuth();
  const [filter, setFilter] = useState(initialFilter || (tipo === 'memorias' ? 'Todos' : 'Hoje'));
  const [category, setCategory] = useState('Todos'), [folder, setFolder] = useState('');
  const [day, setDay] = useState(today()), [search, setSearch] = useState('');
  const [form, setForm] = useState(false), [editing, setEditing] = useState<Registro | null>(null);
  const [draft, setDraft] = useState(fresh), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const elder = usuario?.tipo === 'idoso';
  function start(record?: Registro) { setEditing(record || null); setDraft(record ? { titulo: record.titulo, data: dateLabel(record.data), horario: record.horario, detalhes: record.detalhes, categoria: record.categoria || 'Histórias', midia: record.midia || '' } : { ...fresh(), data: dateLabel(day) }); care.setError(''); setNotice(''); setForm(true); }
  async function pickPhoto() {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: .65 });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (!asset.base64 || asset.base64.length > 3900000) { care.setError('Escolha uma foto menor que 3 MB.'); return; }
      setDraft(p => ({ ...p, categoria: 'Fotos', midia: 'data:' + (['image/png', 'image/webp'].includes(asset.mimeType || '') ? asset.mimeType : 'image/jpeg') + ';base64,' + asset.base64 }));
    } catch { care.setError('Não foi possível abrir a foto. Tente novamente.'); }
  }
  async function openMedia(uri: string) {
    if (!/^https?:\/\//i.test(uri)) return;
    try { await Linking.openURL(uri); } catch { care.setError('Não foi possível abrir este link.'); }
  }
  async function save() {
    if (busy) return; setBusy(true); care.setError('');
    try {
      await api(editing ? '/registros/' + editing.id : '/registros', editing ? 'PUT' : 'POST', { ...draft, idosoId: care.personId, tipo, data: draft.data.trim().split('/').reverse().join('-'), status: editing?.status || 'pendente' });
      setForm(false); setNotice('Registro salvo.'); await care.load();
    } catch(e) { care.setError((e as Error).message); } finally { setBusy(false); }
  }
  async function toggle(item: Registro) {
    if (busy) return; setBusy(true); care.setError('');
    try { const result = await api<Registro>('/registros/' + item.id, 'PUT', { ...item, status: item.status === 'concluido' ? 'pendente' : 'concluido' }); care.setItems(items => items.map(i => i.id === item.id ? result : i)); }
    catch(e) { care.setError((e as Error).message); } finally { setBusy(false); }
  }
  async function remove(item: Registro) {
    setBusy(true); care.setError('');
    try { await api('/registros/' + item.id, 'DELETE'); care.setItems(items => items.filter(i => i.id !== item.id)); setNotice('Registro excluído.'); }
    catch(e) { care.setError((e as Error).message); } finally { setBusy(false); }
  }
  function confirm(item: Registro) {
    if (busy) return;
    if (Platform.OS === 'web') { if (window.confirm('Excluir "' + item.titulo + '"?')) void remove(item); }
    else Alert.alert('Excluir registro?', item.titulo, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => void remove(item) }]);
  }
  const visible = care.items.filter(i => (tipo !== 'memorias' || ((category === 'Todos' || (i.categoria || 'Histórias') === category) && (!folder || i.data.startsWith(folder)))) && (filter === 'Hoje' ? i.data === day : filter === 'Próximos' ? i.data > today() : filter === 'Pendentes' ? i.status !== 'concluido' : true) && (i.titulo + i.detalhes).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const done = care.items.filter(i => i.data === day && i.status === 'concluido').length, total = care.items.filter(i => i.data === day).length;
  const week = Array.from({ length: 7 }, (_, i) => { const date = new Date(day + 'T12:00:00'); date.setDate(date.getDate() - date.getDay() + i); return { iso: date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'), num: date.getDate(), label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3) }; });
  return <AppShell section={tipo} title={tipo === 'rotinas' ? elder ? 'Hoje' : 'Rotina' + (care.person ? ' de ' + care.person.nome.split(' ')[0] : '') : labels[tipo]}>
    <Message>{!form && care.error}</Message><Message success>{notice}</Message>{!!care.error && !form && <Action soft onPress={care.load}>Tentar novamente</Action>}
    {care.loading ? <Loading /> : !care.people.length && !care.error ? <Empty icon={icon[tipo]} title="Vamos começar?" text="Adicione a pessoa que será acompanhada para organizar seus cuidados."><Action onPress={() => router.push('/pessoas')}>+ Adicionar pessoa</Action></Empty> : care.person && <>
      {!elder && tipo !== 'rotinas' && <PersonPicker people={care.people} selected={care.personId} onSelect={care.select} />}
      {tipo === 'rotinas' && <><View style={d.row}><View style={[d.card, { flex: 1, backgroundColor: colors.pale }]}><Text style={d.subheading}>Hoje</Text><Text style={d.muted}>{total ? Math.round(done / total * 100) : 0}% concluído</Text></View><View style={[d.card, { flex: 1, backgroundColor: colors.pale }]}><Text style={d.subheading}>Atividades</Text><Text style={d.muted}>{done} de {total} concluídas</Text></View></View><View style={[d.row, { justifyContent: 'space-between', gap: 2 }]}>{week.map(date => <Pressable accessibilityRole="button" accessibilityLabel={dateLabel(date.iso)} accessibilityState={{ selected: date.iso === day }} key={date.iso} onPress={() => { setDay(date.iso); setFilter('Hoje'); }} style={{ padding: 8, borderRadius: 8, backgroundColor: date.iso === day ? colors.pale : 'white' }}><Text style={[d.muted, { textAlign: 'center' }]}>{date.label}</Text><Text style={[d.body, { textAlign: 'center' }]}>{date.num}</Text></Pressable>)}</View></>}
      {tipo === 'memorias' && <><View style={[d.row, { justifyContent: 'space-around' }]}>{(['Fotos', 'Vídeos', 'Áudios', 'Histórias'] as const).map((cat, i) => <Pressable key={cat} accessibilityRole="button" onPress={() => { setCategory(cat); setFilter('Todos'); setFolder(''); }} style={{ alignItems: 'center', gap: 4, padding: 9, backgroundColor: category === (['Fotos', 'Vídeos', 'Áudios', 'Histórias'] as const)[i] ? '#E6CEF8' : colors.pale, borderRadius: 10 }}><Icon name={(['image-outline', 'videocam-outline', 'mic-outline', 'bookmark-outline'] as const)[i]} /><Text style={d.muted}>{cat}</Text></Pressable>)}</View><Input label="Buscar memórias" value={search} onChangeText={setSearch} /><Pressable accessibilityRole="button" onPress={() => { setCategory('Todos'); setFolder(''); setSearch(''); }}><Text style={d.link}>Ver todas as memórias</Text></Pressable>{care.items.length > 0 && <><Text style={d.subheading}>Pastas de momentos</Text><ScrollView horizontal contentContainerStyle={{ gap: 12 }}>{[...new Set(care.items.map(i => i.data.slice(0, 7)))].sort().reverse().map(month => <Pressable key={month} accessibilityRole="button" onPress={() => { setFolder(month === folder ? '' : month); setFilter('Todos'); }} style={{ minWidth: 95, backgroundColor: folder === month ? '#E6CEF8' : colors.pale, padding: 18, borderRadius: 10, gap: 12 }}><Icon name="folder" size={38} color={colors.lavender} /><Text style={d.body}>{new Date(month + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text></Pressable>)}</ScrollView><Text style={d.subheading}>Memórias recentes</Text></>}</>}
      <View style={{ flexDirection: 'row', borderBottomColor: colors.line, borderBottomWidth: 1 }}>{(tipo === 'memorias' ? ['Todos', 'Hoje'] : ['Hoje', 'Próximos', 'Todos', 'Pendentes']).map(f => <Pressable accessibilityRole="button" accessibilityState={{ selected: filter === f }} key={f} onPress={() => setFilter(f)} style={{ flex: 1, paddingVertical: 12, borderBottomColor: colors.purple, borderBottomWidth: filter === f ? 2 : 0 }}><Text style={[d.body, { textAlign: 'center', fontSize: 13, fontWeight: filter === f ? '700' : '400' }]}>{f}</Text></Pressable>)}</View>
      {!visible.length ? <Empty icon={icon[tipo]} title={care.items.length ? 'Nenhum registro neste filtro' : tipo === 'memorias' ? 'Suas lembranças começam aqui!' : 'Ainda não há registros'} text={care.items.length ? 'Escolha outro dia ou veja todos os registros.' : 'Adicione o primeiro registro para começar.'} /> : visible.map(item => {
        const finished = item.status === 'concluido', late = isLate(item), bg = finished ? colors.green : late ? colors.red : colors.pale;
        return <View key={item.id} style={[d.row, { alignItems: 'stretch', gap: 9 }]}>{tipo === 'rotinas' && <View style={{ width: 49, borderRightWidth: 2, borderRightColor: '#D7CADF', justifyContent: 'center' }}><Text style={[d.body, { fontSize: 12 }]}>{item.horario || '—'}</Text></View>}<View style={[d.card, { flex: 1, backgroundColor: tipo === 'rotinas' ? bg : 'white', padding: elder ? 20 : 14 }]}>{tipo === 'memorias' && item.midia && (item.categoria === 'Fotos' ? <Image source={{ uri: item.midia }} accessibilityLabel={item.titulo} style={{ width: '100%', height: 230, borderRadius: 10 }} resizeMode="contain" /> : <Action soft onPress={() => openMedia(item.midia!)} icon="play-circle-outline">Abrir {item.categoria === 'Áudios' ? 'áudio' : 'vídeo'}</Action>)}<View style={[d.row, { alignItems: 'flex-start' }]}>{tipo === 'consultas' ? <View style={{ backgroundColor: colors.pale, padding: 12, borderRadius: 8 }}><Text style={d.heading}>{item.data.slice(8)}</Text><Text style={d.body}>{new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</Text></View> : <View style={{ backgroundColor: bg, padding: 9, borderRadius: 10 }}><Icon name={icon[tipo]} size={26} /></View>}<View style={{ flex: 1, gap: 4 }}><Text style={[d.subheading, { fontSize: elder ? 23 : 19 }]}>{item.titulo}</Text>{tipo !== 'rotinas' && <Text style={d.muted}>{dateLabel(item.data)} {item.horario}</Text>}{!!item.detalhes && <Text style={d.body}>{item.detalhes}</Text>}</View></View>{tipo !== 'memorias' && <Text style={[d.muted, { textAlign: 'right', color: finished ? '#297647' : late ? '#B1374B' : colors.purple }]}>{finished ? 'Concluído' : late ? 'Em atraso' : 'Pendente'}</Text>}<View style={[d.row, { flexWrap: 'wrap', gap: 12 }]}>{tipo !== 'memorias' && <Pressable disabled={busy} accessibilityRole="button" onPress={() => toggle(item)} style={{ minHeight: 40, justifyContent: 'center' }}><Text style={d.body}>{finished ? '↶ Reabrir' : '✓ Concluir'}</Text></Pressable>}<Pressable disabled={busy} accessibilityRole="button" onPress={() => start(item)} style={{ minHeight: 40, justifyContent: 'center' }}><Text style={d.body}>Editar</Text></Pressable><Pressable disabled={busy} accessibilityRole="button" onPress={() => confirm(item)} style={{ minHeight: 40, justifyContent: 'center', marginLeft: 'auto' }}><Text style={[d.muted, { color: '#A94359' }]}>Excluir</Text></Pressable></View></View></View>;
      })}
      <Action disabled={busy} icon="add" onPress={() => start()}>Adicionar {singular[tipo]}</Action>
      {tipo === 'medicamentos' && <View style={[d.card, d.row, { backgroundColor: colors.pale }]}><Image source={art.mascot} style={{ width: 67, height: 72 }} resizeMode="contain" /><View style={{ flex: 1 }}><Text style={d.subheading}>Dica do Eugênio</Text><Text style={d.muted}>Mantenha os medicamentos organizados e os horários em dia. Registre cada dose conforme a orientação recebida.</Text></View></View>}
    </>}
    <Modal visible={form} animationType="slide" transparent onRequestClose={() => !busy && setForm(false)}><View style={{ flex: 1, backgroundColor: '#24103277', justifyContent: 'center', alignItems: 'center', padding: 20 }}><ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: '90%', width: '100%', maxWidth: 460 }} contentContainerStyle={[d.card, { padding: 24, gap: 16 }]}><Text style={d.heading}>{editing ? 'Editar ' : 'Adicionar '}{singular[tipo]}</Text><Text style={d.muted}>{care.person?.nome}</Text><Input label={tipo === 'medicamentos' ? 'Medicamento e dose' : tipo === 'consultas' ? 'Especialidade / consulta' : 'Título'} value={draft.titulo} onChangeText={v => setDraft(p => ({ ...p, titulo: v }))} /><Input label="Data (DD/MM/AAAA)" value={draft.data} onChangeText={v => setDraft(p => ({ ...p, data: v }))} keyboardType="numbers-and-punctuation" /><Input label="Horário (HH:MM, opcional)" value={draft.horario} onChangeText={v => setDraft(p => ({ ...p, horario: v }))} /><Input label={tipo === 'memorias' ? 'Sua história' : tipo === 'consultas' ? 'Profissional, local e observações' : 'Detalhes e observações'} multiline value={draft.detalhes} onChangeText={v => setDraft(p => ({ ...p, detalhes: v }))} />{tipo === 'memorias' && <><Text style={d.body}>Tipo de memória</Text><View style={[d.row, { flexWrap: 'wrap' }]}>{['Fotos', 'Vídeos', 'Áudios', 'Histórias'].map(cat => <Pressable accessibilityRole="button" key={cat} onPress={() => setDraft(p => ({ ...p, categoria: cat, midia: '' }))} style={{ padding: 10, borderRadius: 8, backgroundColor: draft.categoria === cat ? '#E6CEF8' : colors.pale }}><Text style={d.body}>{cat}</Text></Pressable>)}</View>{draft.categoria === 'Fotos' && <><Action soft onPress={pickPhoto} icon="image-outline">Escolher foto</Action>{!!draft.midia && <Image source={{ uri: draft.midia }} style={{ height: 160, width: '100%' }} resizeMode="contain" />}</>}{['Vídeos', 'Áudios'].includes(draft.categoria) && <><Text style={d.muted}>Cole o link do vídeo ou áudio que deseja guardar.</Text><Input label="Link (https://...)" value={draft.midia} autoCapitalize="none" onChangeText={v => setDraft(p => ({ ...p, midia: v }))} /></>}</>}<Message>{care.error}</Message><Action disabled={busy} onPress={save}>{busy ? 'Salvando...' : 'Salvar'}</Action><Action disabled={busy} soft onPress={() => { setForm(false); care.setError(''); }}>Cancelar</Action></ScrollView></View></Modal>
  </AppShell>;
}
