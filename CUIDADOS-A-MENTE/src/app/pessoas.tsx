import { useCallback, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Redirect, useFocusEffect, router } from 'expo-router';
import { api, Idoso } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppShell } from '../components/app-shell';
import { Action, IconButton, art, colors, d, Empty, Icon, Input, Loading, Message } from '../components/design';

export default function Pessoas() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Idoso[]>([]), [error, setError] = useState(''), [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!usuario || usuario.tipo === 'idoso') return;
    setLoading(true); setError('');
    try { setItems(await api<Idoso[]>('/idosos')); } catch(e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [usuario]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (usuario?.tipo === 'idoso') return <Redirect href="/painel" />;
  return <AppShell title="Meus idosos" section="idosos" right={<IconButton name="qr-code-outline" label="Configurar acesso dos idosos" onPress={() => router.push('/contas-idosos')} />}>
    <View style={[d.card, d.row, { backgroundColor: colors.pale }]}><View style={{ flex: 1 }}><Text style={d.subheading}>Gerencie os idosos que você cuida</Text><Text style={d.muted}>Acompanhe a rotina, medicações e memórias de cada um.</Text></View><Image source={art.mascot} style={{ width: 90, height: 90 }} resizeMode="contain" /></View>
    <Message>{error}</Message>{!!error && <Action soft onPress={load}>Tentar novamente</Action>}
    <Input label="Buscar idoso..." value={query} onChangeText={setQuery} />
    <Text style={d.subheading}>Meus idosos ({items.length})</Text>
    {loading ? <Loading /> : items.length === 0 && !error ? <Empty image={art.elder} title="Ainda não há nenhum idoso cadastrado" text="Cadastre a primeira pessoa para começar o acompanhamento." /> : items.filter(p => p.nome.toLowerCase().includes(query.toLowerCase())).map(item => <View key={item.id} style={d.card}>
      <Pressable accessibilityRole="button" style={d.row} onPress={() => router.push({ pathname: '/responsavel/perfil_idoso_responsavel', params: { idosoId: item.id } })}>
        <Image source={art.elder} style={{ width: 75, height: 80 }} resizeMode="contain" />
        <View style={{ flex: 1 }}><Text style={d.subheading}>{item.nome}</Text><Text style={d.muted}>{item.nascimento ? item.nascimento.split('-').reverse().join('/') : 'Cadastro pendente'}</Text>{!!item.observacoes && <Text style={d.muted}>{item.observacoes}</Text>}</View><Icon name="chevron-forward" />
      </Pressable>
      <View style={[d.row, { justifyContent: 'space-between' }]}>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/contas-idosos', params: { editar: item.id } })} style={{ padding: 8 }}><Text style={d.body}>Editar cadastro</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/registros', params: { tipo: 'medicamentos', idosoId: item.id } })} style={{ padding: 8 }}><Text style={d.body}>Medicamentos</Text></Pressable>
      </View>
    </View>)}
    <Action icon="person-add-outline" onPress={() => router.push('/contas-idosos?novo=1')}>Cadastrar novo idoso</Action>
  </AppShell>;
}
