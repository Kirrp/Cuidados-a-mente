import { Jua_400Regular, useFonts } from '@expo-google-fonts/jua';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';

// Layout principal da aplicação.
// Aqui ficam os providers globais e a tela base da navegação do app.
export default function RootLayout() {
  const [loaded, error] = useFonts({ Jua: Jua_400Regular });
  if (!loaded && !error) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#6413A3" /></View>;
  return <SafeAreaProvider><AuthProvider><Stack screenOptions={{ headerShown: false }} /></AuthProvider></SafeAreaProvider>;
}
