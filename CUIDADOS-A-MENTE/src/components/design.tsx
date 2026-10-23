import { ReactNode, useState } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const colors = { purple: '#7119AA', ink: '#4C0971', lavender: '#B76AEF', pale: '#F7EFFF', nav: '#F1E3FF', line: '#EBE2F2', muted: '#74677D', green: '#E2FFF1', yellow: '#FFF8E1', red: '#FFE8E9', surface: '#FCFAFF' };
export const art = {
  logo: require('../../assets/images/logo.png'),
  wordmark: require('../../assets/images/UIDADOS-A-MENTE.png'),
  mascot: require('../../assets/images/imagens/personagens/eugenioFeliz.png'),
  elder: require('../../assets/images/perfilidoso.png'),
  elderHome: require('../../assets/images/imagens/personagens/joao.png'),
  carer: require('../../assets/images/perfilcuida.png'),
  family: require('../../assets/images/perfilfam.png'),
};
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 24, color = colors.purple }: { name: IconName; size?: number; color?: string }) { return <Ionicons name={name} size={size} color={color} />; }
export function Action({ children, onPress, disabled, soft, icon }: { children: ReactNode; onPress: () => void; disabled?: boolean; soft?: boolean; icon?: IconName }) {
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled: !!disabled }} onPress={onPress} style={({ pressed }) => [d.action, soft && d.soft, pressed && { opacity: .86, transform: [{ scale: .985 }] }, disabled && { opacity: .48 }]}>{icon && <Icon name={icon} color={soft ? colors.purple : 'white'} size={20} />}<Text style={[d.actionText, soft && { color: colors.purple }]}>{children}</Text></Pressable>;
}
export function IconButton({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={d.iconButton}><Icon name={name} /></Pressable>; }
export function Input({ label, secureTextEntry, ...props }: TextInputProps & { label: string }) {
  const [show, setShow] = useState(false), [focused, setFocused] = useState(false);
  return <View style={d.inputWrap}><Text style={d.inputLabel}>{label}</Text><View><TextInput {...props} accessibilityLabel={label} placeholder={props.placeholder || label} placeholderTextColor="#9E91A8" secureTextEntry={secureTextEntry && !show} onFocus={event => { setFocused(true); props.onFocus?.(event); }} onBlur={event => { setFocused(false); props.onBlur?.(event); }} style={[d.input, focused && d.inputFocused, props.multiline && { minHeight: 108, textAlignVertical: 'top' }, props.style]} />{secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShow(!show)} style={d.eye}><Icon name={show ? 'eye-off-outline' : 'eye-outline'} size={21} /></Pressable>}</View></View>;
}
export function Message({ children, success = false }: { children: ReactNode; success?: boolean }) { return children ? <Text accessibilityRole={success ? undefined : 'alert'} accessibilityLiveRegion="polite" style={[d.message, success && { backgroundColor: colors.green, color: '#236342' }]}>{children}</Text> : null; }
export function Brand() { return <View accessible accessibilityLabel="Cuidados à Mente" style={d.brand}><Image source={art.logo} style={d.brandMark} resizeMode="contain" /><Image source={art.wordmark} style={d.brandName} resizeMode="contain" /></View>; }
export function AuthPage({ children, onBack, large = false, brandOutside = false }: { children: ReactNode; onBack?: () => void; large?: boolean; brandOutside?: boolean }) {
  return <SafeAreaView style={d.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[d.authPage, large && { maxWidth: 470 }]}>{brandOutside && <Brand />}<View style={d.authCard}>{onBack && <View style={d.back}><IconButton name="arrow-back" label="Voltar" onPress={onBack} /></View>}{!brandOutside && <Brand />}{children}</View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function Empty({ title, text, icon = 'clipboard-outline', image, children }: { title: string; text: string; icon?: IconName; image?: ImageSourcePropType; children?: ReactNode }) {
  return <View style={d.empty}><View style={d.emptyArt}>{image ? <Image source={image} style={{ width: 160, height: 160 }} resizeMode="contain" /> : <Icon name={icon} size={92} color="#A45AD4" />}</View><Text style={[d.heading, { textAlign: 'center' }]}>{title}</Text><Text style={[d.body, { textAlign: 'center' }]}>{text}</Text>{children}</View>;
}
export function Loading() { return <ActivityIndicator color={colors.purple} style={{ margin: 24 }} accessibilityLabel="Carregando" />; }
export const d = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  authPage: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingVertical: 46, width: '100%', maxWidth: 440, alignSelf: 'center', gap: 26 },
  authCard: { backgroundColor: 'white', borderRadius: 22, padding: 24, paddingVertical: 32, gap: 18, borderWidth: 1, borderColor: '#F0E9F5', boxShadow: '0 8px 24px rgba(69, 20, 94, 0.11)' },
  back: { position: 'absolute', top: 9, left: 8, zIndex: 1 },
  brand: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 },
  brandMark: { width: 43, height: 43 },
  brandName: { width: 224, height: 38 },
  heading: { color: colors.ink, fontFamily: 'Jua', fontSize: 27, lineHeight: 34 },
  subheading: { color: colors.ink, fontFamily: 'Jua', fontSize: 20, lineHeight: 26 },
  body: { color: '#4C315C', fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 18, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.line, boxShadow: '0 5px 14px rgba(66, 20, 95, 0.07)' },
  action: { minHeight: 52, paddingVertical: 11, paddingHorizontal: 18, backgroundColor: colors.purple, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Jua', fontSize: 20, color: 'white', textAlign: 'center' },
  soft: { backgroundColor: colors.pale, borderWidth: 1, borderColor: '#E8D4F5' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#F8F0FF' },
  inputWrap: { gap: 6 },
  inputLabel: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  input: { borderRadius: 13, borderColor: '#DDD2E7', borderWidth: 1, backgroundColor: '#FFF', minHeight: 52, padding: 13, paddingRight: 42, fontSize: 15, color: colors.ink },
  inputFocused: { borderColor: colors.lavender, backgroundColor: '#FEFBFF', borderWidth: 2 },
  eye: { position: 'absolute', right: 0, top: 4, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  message: { backgroundColor: '#FFF0F2', color: '#A02440', padding: 12, borderRadius: 10, fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', gap: 18, padding: 24, paddingVertical: 40, backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: colors.line },
  emptyArt: { width: 195, height: 175, borderRadius: 65, backgroundColor: colors.pale, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  link: { color: colors.purple, textAlign: 'center', textDecorationLine: 'underline', paddingVertical: 10, fontSize: 15, fontWeight: '600' },
});
