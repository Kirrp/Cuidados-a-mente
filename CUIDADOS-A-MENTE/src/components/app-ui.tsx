import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
export function Button({ children, onPress, disabled = false, secondary = false }: { children: ReactNode; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondary, (disabled || pressed) && { opacity: .55 }]}>
    <Text style={[ui.buttonText, secondary && { color: '#702692' }]}>{children}</Text>
  </Pressable>;
}
export function Field({ label, value, onChangeText, secret = false, multiline = false, placeholder = '', email = false }: {
  label: string; value: string; onChangeText: (v: string) => void; secret?: boolean; multiline?: boolean; placeholder?: string; email?: boolean;
}) {
  return <View style={{ gap: 6 }}><Text style={ui.label}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} secureTextEntry={secret}
      multiline={multiline} autoCapitalize={email || secret ? 'none' : 'sentences'} keyboardType={email ? 'email-address' : 'default'}
      autoCorrect={!email && !secret} placeholder={placeholder} placeholderTextColor="#8b8093" style={[ui.input, multiline && { minHeight: 95, textAlignVertical: 'top' }]} />
  </View>;
}
export function Page({ title, children, back = true }: { title: string; children: ReactNode; back?: boolean }) {
  return <SafeAreaView style={ui.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
    <View style={ui.row}>{back && <Button secondary onPress={() => router.canGoBack() ? router.back() : router.replace('/painel')}>Voltar</Button>}
    <Text style={ui.brand}>CUIDADOS À MENTE</Text></View><Text style={ui.title}>{title}</Text>{children}
  </ScrollView></SafeAreaView>;
}
export function Guard({ children }: { children: ReactNode }) {
  const { usuario, iniciando, erro } = useAuth();
  if (iniciando) return <Page title="Carregando"><ActivityIndicator /></Page>;
  if (!usuario) return <Page title="Acesse sua conta"><Text style={ui.text}>{erro || 'Entre para consultar e salvar seus dados.'}</Text><Button onPress={() => router.replace('/')}>Entrar</Button></Page>;
  return <>{children}</>;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#faf7fd' },
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22, gap: 18, paddingBottom: 55 },
  brand: { color: '#702692', fontWeight: '800', letterSpacing: 1, fontSize: 13, flexShrink: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#38134c' },
  subtitle: { fontSize: 19, fontWeight: '700', color: '#702692' },
  text: { color: '#675772', fontSize: 16, lineHeight: 24 },
  label: { color: '#4b325b', fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: 'white', borderColor: '#dbcbe5', borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 16, color: '#301541' },
  button: { backgroundColor: '#702692', paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondary: { backgroundColor: '#eee1f5' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  card: { borderWidth: 1, borderColor: '#e6d9ed', backgroundColor: 'white', borderRadius: 18, padding: 20, gap: 13 },
  error: { color: '#a02038', backgroundColor: '#fff0f2', padding: 12, borderRadius: 10, fontSize: 15 },
  success: { color: '#176a4c', backgroundColor: '#eaf8f0', padding: 12, borderRadius: 10 },
});
