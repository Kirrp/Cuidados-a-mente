import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ConfirmacaoEmail() {
  const styles = useEstilosTematicos(stylesBase);
  const { tema, cor } = useTema();
  const textoTema = tema === 'escuro' ? { color: cor('#000000') } : undefined;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Confirmação de e-mail' }} />

      <Text style={[styles.title, textoTema]}>Confirme seu e-mail</Text>

      <Text style={[styles.description, textoTema]}>
        Enviamos um código de confirmação para o seu e-mail. Digite o código abaixo para continuar.
      </Text>

      <TextInput
        style={[styles.input, textoTema]}
        placeholderTextColor={tema === 'escuro' ? cor('#999999') : undefined}
        placeholder="Código de confirmação"
        keyboardType="number-pad"
        maxLength={6}
      />

      <Pressable style={styles.button} onPress={() => router.replace('/painel')}>
        <Text style={styles.buttonText}>Confirmar</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/confirmacao/verificacao?tipo=responsavel')}>
        <Text style={styles.resendText}>Não recebeu o código? Enviar novamente</Text>
      </Pressable>
    </View>
  );
}

const stylesBase = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
  },

  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#AAAAAA',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },

  button: {
    height: 50,
    backgroundColor: '#9B59B6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  resendText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6F24BD',
    fontSize: 15,
  },
});
