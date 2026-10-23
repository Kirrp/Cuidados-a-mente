import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Action, AuthPage, d, Input, Message } from '../../components/design';
export default function Login() {
  const { entrar } = useAuth();
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const [email, setEmail] = useState(''), [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit() {
    if (busy) return; setBusy(true); setError('');
    try { await entrar(email.trim(), senha); router.replace('/painel'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  if (tipo === 'idoso') return <Redirect href="/acesso-idoso" />;
  return <AuthPage onBack={() => router.replace('/')}><Text style={[d.heading, { textAlign: 'center' }]}>Bem-vindo de volta!</Text><Text style={[d.body, { textAlign: 'center' }]}>Entre na sua conta{tipo === 'responsavel' ? ' de responsável' : tipo === 'cuidador' ? ' de cuidador' : ''}.</Text><Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" /><Input label="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoCapitalize="none" autoCorrect={false} onSubmitEditing={submit} /><Message>{error}</Message><Action disabled={busy} onPress={submit}>{busy ? 'Entrando...' : 'Entrar'}</Action><Pressable accessibilityRole="link" onPress={() => router.push('/cadastro')}><Text style={d.link}>Ainda não tem conta? Inscreva-se</Text></Pressable></AuthPage>;
}
