import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { colors } from '@/core/tema/paleta';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';

// Componentes básicos mantidos para algumas telas antigas. As telas novas
// usam o design-system.tsx, mas estes componentes preservam o mesmo papel:
// botão, campo, página rolável e proteção por autenticação.
export function Button({
  children,
  onPress,
  disabled = false,
  secondary = false,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const ui = useEstilosTematicos(uiBase);
  const { cor } = useTema();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondary,
        (disabled || pressed) && { opacity: 0.55 },
      ]}
    >
      <Text style={[ui.buttonText, secondary && { color: cor(colors.purple, 'texto') }]}>
        {children}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  secret = false,
  multiline = false,
  placeholder = '',
  email = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secret?: boolean;
  multiline?: boolean;
  placeholder?: string;
  email?: boolean;
}) {
  const ui = useEstilosTematicos(uiBase);
  const { cor } = useTema();

  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secret}
        multiline={multiline}
        autoCapitalize={email || secret ? 'none' : 'sentences'}
        keyboardType={email ? 'email-address' : 'default'}
        autoCorrect={!email && !secret}
        placeholder={placeholder}
        placeholderTextColor={cor(colors.muted, 'texto')}
        style={[ui.input, multiline && { minHeight: 95, textAlignVertical: 'top' }]}
      />
    </View>
  );
}
export function Page({
  title,
  children,
  back = true,
}: {
  title: string;
  children: ReactNode;
  back?: boolean;
}) {
  const ui = useEstilosTematicos(uiBase);

  return (
    <SafeAreaView style={ui.safe}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
        <View style={ui.row}>
          {back && (
            <Button
              secondary
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/painel'))}
            >
              Voltar
            </Button>
          )}
          <Text style={ui.brand}>CUIDADOS À MENTE</Text>
        </View>
        <Text style={ui.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Barreira de autenticação para conteúdo privado.
 * Enquanto a sessão é restaurada mostra carregamento; sem usuário, oferece
 * retorno ao login; com usuário, libera exatamente os componentes filhos.
 */
export function Guard({ children }: { children: ReactNode }) {
  const ui = useEstilosTematicos(uiBase);

  const { usuario, iniciando, erro } = useAutenticacao();
  if (iniciando) {
    return (
      <Page title="Carregando">
        <ActivityIndicator />
      </Page>
    );
  }
  if (!usuario) {
    return (
      <Page title="Acesse sua conta">
        <Text style={ui.text}>{erro || 'Entre para consultar e salvar seus dados.'}</Text>
        <Button onPress={() => router.replace('/')}>Entrar</Button>
      </Page>
    );
  }
  return <>{children}</>;
}
export const uiBase = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  page: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 22,
    gap: 18,
    paddingBottom: 55,
  },
  brand: { color: colors.purple, fontWeight: '800', letterSpacing: 1, fontSize: 13, flexShrink: 1 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 19, fontWeight: '700', color: colors.purple },
  text: { color: colors.body, fontSize: 16, lineHeight: 24 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: 'white',
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    color: colors.ink,
  },
  button: {
    minHeight: 52,
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondary: { backgroundColor: colors.pale },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    gap: 13,
  },
  error: {
    color: '#a02038',
    backgroundColor: '#fff0f2',
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  success: { color: '#176a4c', backgroundColor: '#eaf8f0', padding: 12, borderRadius: 10 },
});

export { uiBase as ui };
