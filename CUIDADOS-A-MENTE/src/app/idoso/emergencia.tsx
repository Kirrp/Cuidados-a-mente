import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/app-shell';
import { Action, colors, d, Empty, Icon, Message } from '../../components/design';
export default function Emergencia() {
  const { usuario } = useAuth(); const profile = usuario ? JSON.parse(usuario.perfil) as Record<string, string> : {};
  const [error, setError] = useState('');
  async function call() { const phone = (profile.telefoneEmergencia || '').replace(/[^\d+]/g, ''); if (!phone) return; try { await Linking.openURL('tel:' + phone); } catch { setError('Não foi possível abrir o telefone neste dispositivo. Ligue para ' + profile.telefoneEmergencia + '.'); } }
  return <AppShell title="Emergência" section="emergencia" back><Message>{error}</Message>{!!profile.nomeEmergencia && profile.telefoneEmergencia ? <View style={[d.card, { backgroundColor: colors.pale, padding: 26, gap: 24, alignItems: 'center' }]}><Icon name="call-outline" size={76} /><Text style={d.heading}>{profile.nomeEmergencia}</Text><Text style={[d.body, { fontSize: 24 }]}>{profile.telefoneEmergencia}</Text><Action onPress={call} icon="call">Ligar para o contato</Action><Action soft onPress={() => router.push('/meu-perfil')}>Editar contato</Action></View> : <Empty icon="call-outline" title="Ainda não há nenhum contato cadastrado!" text="Adicione uma pessoa de confiança para entrar em contato quando precisar."><Action onPress={() => router.push('/meu-perfil')}>+ Adicionar contato</Action></Empty>}</AppShell>;
}
