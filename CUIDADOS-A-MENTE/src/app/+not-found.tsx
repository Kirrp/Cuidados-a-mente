import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={styles.container}>
        <Text style={styles.titulo}>Essa página não existe.</Text>
        <Link href="/" style={styles.link}>
          Voltar para o início
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#FFFBFE' },
  titulo: { fontSize: 20, fontWeight: '700', color: '#321044', marginBottom: 12 },
  link: { fontSize: 16, color: '#2684FF', textDecorationLine: 'underline' },
});
