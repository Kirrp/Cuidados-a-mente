import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Tokens visuais reutilizados pelo aplicativo. Alterar uma cor aqui mantém
// botões, cartões, mensagens e navegação com a mesma identidade visual.
import { colors } from '@/core/tema/paleta';
export { colors } from '@/core/tema/paleta';

// Catálogo central das imagens usadas em mais de uma funcionalidade.
export const art = {
  logo: require('../../../assets/images/logo.png'),
  wordmark: require('../../../assets/images/UIDADOS-A-MENTE.png'),
  mascot: require('../../../assets/images/imagens/personagens/eugenioFeliz.png'),
  elder: require('../../../assets/images/perfilidoso.png'),
  elderHome: require('../../../assets/images/imagens/personagens/joao.png'),
  carer: require('../../../assets/images/perfilcuida.png'),
  family: require('../../../assets/images/perfilfam.png'),
};
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  size = 24,
  color = colors.purple,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { cor } = useTema();
  return (
    <Ionicons
      aria-hidden
      accessible={false}
      importantForAccessibility="no"
      name={name}
      size={size}
      color={cor(color, 'texto')}
    />
  );
}

// Botão principal. `soft` cria a variação secundária e `disabled` também é
// informado às tecnologias assistivas por accessibilityState.
export function Action({
  children,
  onPress,
  disabled,
  soft,
  icon,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  soft?: boolean;
  icon?: IconName;
}) {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        estilosDaTela.action,
        soft && estilosDaTela.soft,
        pressed && { opacity: 0.86, transform: [{ scale: 0.985 }] },
        disabled && { opacity: 0.48 },
      ]}
    >
      {icon && <Icon name={icon} color={soft ? colors.purple : 'white'} size={20} />}
      <Text style={[estilosDaTela.actionText, soft && { color: cor(colors.purple, 'texto') }]}>
        {children}
      </Text>
    </Pressable>
  );
}
export function Choice({
  children,
  selected,
  onPress,
  disabled = false,
}: {
  children: ReactNode;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const estilosDaTela = useEstilosTematicos(dBase);
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={selected}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        estilosDaTela.choice,
        selected && estilosDaTela.choiceSelected,
        pressed && { opacity: 0.86 },
        disabled && { opacity: 0.48 },
      ]}
    >
      <Text style={[estilosDaTela.choiceText, selected && estilosDaTela.choiceSelectedText]}>
        {children}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  const estilosDaTela = useEstilosTematicos(dBase);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={estilosDaTela.iconButton}
    >
      <Icon name={name} />
    </Pressable>
  );
}

// Campo padronizado com rótulo, destaque de foco e controle de exibição para
// senhas. Os demais TextInputProps são repassados para manter o componente flexível.
export function Input({ label, secureTextEntry, ...props }: TextInputProps & { label: string }) {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={estilosDaTela.inputWrap}>
      <Text style={estilosDaTela.inputLabel}>{label}</Text>
      <View>
        <TextInput
          {...props}
          accessibilityLabel={label}
          placeholder={props.placeholder || label}
          placeholderTextColor={cor(colors.muted, 'texto')}
          secureTextEntry={secureTextEntry && !show}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[
            estilosDaTela.input,
            focused && estilosDaTela.inputFocused,
            props.multiline && { minHeight: 108, textAlignVertical: 'top' },
            props.style,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            aria-expanded={show}
            accessibilityState={{ expanded: show }}
            accessibilityLabel={show ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setShow(!show)}
            style={estilosDaTela.eye}
          >
            <Icon name={show ? 'eye-off-outline' : 'eye-outline'} size={21} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
export function Message({ children, success = false }: { children: ReactNode; success?: boolean }) {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();
  return children ? (
    <Text
      accessibilityRole={success ? undefined : 'alert'}
      accessibilityLiveRegion="polite"
      style={[
        estilosDaTela.message,
        success && { backgroundColor: cor(colors.green, 'fundo'), color: cor('#236342', 'texto') },
      ]}
    >
      {children}
    </Text>
  ) : null;
}
export function Brand() {
  const estilosDaTela = useEstilosTematicos(dBase);
  return (
    <View accessible accessibilityLabel="Cuidados à Mente" style={estilosDaTela.brand}>
      <View style={estilosDaTela.brandSymbol}>
        <Image source={art.logo} style={estilosDaTela.brandMark} resizeMode="contain" />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={estilosDaTela.brandTitle}>Cuidados à Mente</Text>
        <Text style={estilosDaTela.brandCaption}>Cuidado presente, todos os dias.</Text>
      </View>
    </View>
  );
}

// Estrutura das telas públicas de autenticação. KeyboardAvoidingView impede
// que o teclado cubra o formulário no iOS; ScrollView atende telas menores.
export function AuthPage({
  children,
  onBack,
  large = false,
  brandOutside = false,
}: {
  children: ReactNode;
  onBack?: () => void;
  large?: boolean;
  brandOutside?: boolean;
}) {
  const estilosDaTela = useEstilosTematicos(dBase);

  return (
    <SafeAreaView style={estilosDaTela.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[estilosDaTela.authPage, large && { maxWidth: 560 }]}
        >
          {brandOutside && <Brand />}
          <View style={estilosDaTela.authCard}>
            {onBack && (
              <View style={estilosDaTela.back}>
                <IconButton name="arrow-back" label="Voltar" onPress={onBack} />
              </View>
            )}
            {!brandOutside && <Brand />}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Empty({
  title,
  text,
  icon = 'clipboard-outline',
  image,
  children,
}: {
  title: string;
  text: string;
  icon?: IconName;
  image?: ImageSourcePropType;
  children?: ReactNode;
}) {
  const estilosDaTela = useEstilosTematicos(dBase);

  return (
    <View style={estilosDaTela.empty}>
      <View style={estilosDaTela.emptyArt}>
        {image ? (
          <Image source={image} style={{ width: 160, height: 160 }} resizeMode="contain" />
        ) : (
          <Icon name={icon} size={92} color="#A45AD4" />
        )}
      </View>
      <Text style={[estilosDaTela.heading, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[estilosDaTela.body, { textAlign: 'center' }]}>{text}</Text>
      {children}
    </View>
  );
}
export function Loading() {
  const { cor } = useTema();
  return (
    <ActivityIndicator
      color={cor(colors.purple, 'texto')}
      style={{ margin: 24 }}
      accessibilityLabel="Carregando"
    />
  );
}

// `d` reúne estilos semânticos (heading, body, card, action...). As telas
// escolhem o papel visual em vez de repetir valores de tamanho e cor.
export const dBase = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  authPage: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 32,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    gap: 26,
  },
  authCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    paddingVertical: 32,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 5,
    borderTopColor: colors.purple,
    boxShadow: '0 12px 36px rgba(40, 19, 63, 0.10)',
  },
  back: { position: 'absolute', top: 9, left: 8, zIndex: 1 },
  brand: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  brandSymbol: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.pale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', lineHeight: 29 },
  brandCaption: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  brandMark: { width: 43, height: 43 },
  brandName: { width: 224, height: 38 },
  heading: { color: colors.ink, fontWeight: '800', fontSize: 26, lineHeight: 34 },
  subheading: { color: colors.ink, fontWeight: '700', fontSize: 20, lineHeight: 28 },
  body: { color: colors.body, fontSize: 16, lineHeight: 25 },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.line,
    boxShadow: '0 3px 12px rgba(40, 19, 63, 0.05)',
  },
  action: {
    minHeight: 52,
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: colors.purple,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 24,
    color: 'white',
    textAlign: 'center',
    flexShrink: 1,
  },
  soft: {
    backgroundColor: colors.pale,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
  },
  choice: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.nav,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceSelected: { backgroundColor: colors.purple, borderColor: colors.purple },
  choiceText: {
    color: colors.purple,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  choiceSelectedText: { color: 'white', fontWeight: '700' },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.pale,
  },
  inputWrap: { gap: 6 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  input: {
    borderRadius: 13,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFF',
    minHeight: 52,
    padding: 13,
    paddingRight: 42,
    fontSize: 16,
    color: colors.ink,
  },
  inputFocused: { borderColor: colors.purple, backgroundColor: '#FEFBFF', borderWidth: 2 },
  eye: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    backgroundColor: '#FFF0F2',
    color: '#A02440',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    gap: 18,
    padding: 24,
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyArt: {
    width: 195,
    height: 175,
    borderRadius: 65,
    backgroundColor: colors.pale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  link: {
    color: colors.purple,
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
});

export { dBase as d };
