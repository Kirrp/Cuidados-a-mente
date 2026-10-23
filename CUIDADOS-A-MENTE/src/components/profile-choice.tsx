import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { art, AuthPage, colors, d, Icon, IconButton } from './design';

export default function ProfileChoice({ cadastro = false }: { cadastro?: boolean }) {
  const profiles = [
    { tipo: 'responsavel', label: 'Responsável', description: 'Acompanhar quem você ama', image: art.family },
    { tipo: 'cuidador', label: 'Cuidador', description: 'Organizar os cuidados do dia', image: art.carer },
  ] as const;

  return <AuthPage brandOutside>
    <View style={s.qrCorner}><IconButton name="qr-code-outline" label="Acesso do idoso por QR Code" onPress={() => router.push('/acesso-idoso')} /></View>
    <View style={{ gap: 5, paddingRight: 32 }}>
      <Text style={d.heading}>{cadastro ? 'Crie sua conta' : 'Boas-vindas!'}</Text>
      <Text style={d.body}>{cadastro ? 'Escolha como você vai cuidar.' : 'Escolha como deseja continuar.'}</Text>
    </View>
    <View style={s.choices}>{profiles.map(profile => <Pressable key={profile.tipo} accessibilityRole="button" onPress={() => router.push(cadastro ? `/cadastro/cadastro_${profile.tipo}` as never : { pathname: '/login', params: { tipo: profile.tipo } })} style={({ pressed }) => [s.choice, pressed && { opacity: .8, transform: [{ scale: .985 }] }]}>
      <View style={s.avatar}><Image source={profile.image} style={s.avatarImage} resizeMode="contain" /></View>
      <View style={{ flex: 1 }}><Text style={s.choiceTitle}>{profile.label}</Text><Text style={d.muted}>{profile.description}</Text></View>
      <Icon name="chevron-forward" size={21} />
    </Pressable>)}</View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/acesso-idoso')} style={s.elderChoice}>
      <View style={s.qrIcon}><Icon name="qr-code-outline" size={27} /></View>
      <View style={{ flex: 1 }}><Text style={s.choiceTitle}>Acesso do idoso</Text><Text style={d.muted}>Entre lendo o QR Code preparado por quem cuida de você.</Text></View>
      <Icon name="arrow-forward" size={20} />
    </Pressable>
    <Pressable accessibilityRole="link" onPress={() => router.push(cadastro ? '/login' : '/cadastro')}><Text style={d.link}>{cadastro ? 'Já tenho uma conta' : 'Ainda não tem conta? Inscreva-se'}</Text></Pressable>
  </AuthPage>;
}

const s = StyleSheet.create({
  qrCorner: { position: 'absolute', top: 15, right: 15, zIndex: 1 },
  choices: { gap: 12, marginTop: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 94, borderRadius: 17, backgroundColor: '#FAF6FF', borderWidth: 1, borderColor: colors.line },
  avatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 61, height: 61 },
  choiceTitle: { color: colors.ink, fontFamily: 'Jua', fontSize: 20, lineHeight: 25 },
  elderChoice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 17, backgroundColor: '#F0E1FF', borderWidth: 1, borderColor: '#E2C9F6' },
  qrIcon: { width: 54, height: 54, borderRadius: 15, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
});
