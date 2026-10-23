import { useEstilosTematicos } from '@/core/tema/contexto-tema';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { Action, AuthPage, d as dBase, Input, Message } from '@/components/ui/design-system';

/** Login por senha; contas de idoso dependem de credenciais preparadas pelo proprietário. */
export default function Login() {
  const estilosDaTela = useEstilosTematicos(dBase);

  const { entrar } = useAutenticacao();
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    // `busy` também impede dois envios se o usuário tocar rapidamente no botão.
    if (ocupado) {
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await entrar(email.trim(), senha);
      router.replace('/painel');
    } catch (erroCapturado) {
      setError((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <AuthPage onBack={() => router.replace(tipo === 'idoso' ? '/acesso-idoso' : '/')}>
      <Text style={[estilosDaTela.heading, { textAlign: 'center' }]}>Bem-vindo de volta!</Text>
      <Text style={[estilosDaTela.body, { textAlign: 'center' }]}>
        Entre na sua conta
        {tipo === 'responsavel'
          ? ' de responsável'
          : tipo === 'cuidador'
            ? ' de cuidador'
            : tipo === 'idoso'
              ? ' de idoso'
              : ''}
        .
      </Text>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
      />
      <Input
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={submit}
      />
      {tipo !== 'idoso' && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/recuperar-acesso' as never)}
        >
          <Text style={estilosDaTela.link}>Esqueci minha senha</Text>
        </Pressable>
      )}
      <Message>{error}</Message>
      <Action disabled={ocupado} onPress={submit}>
        {ocupado ? 'Entrando...' : 'Entrar'}
      </Action>
      {tipo !== 'idoso' && (
        <Pressable accessibilityRole="link" onPress={() => router.push('/cadastro')}>
          <Text style={estilosDaTela.link}>Ainda não tem conta? Inscreva-se</Text>
        </Pressable>
      )}
    </AuthPage>
  );
}
