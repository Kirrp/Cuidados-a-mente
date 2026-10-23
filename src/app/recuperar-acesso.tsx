import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { requisitarApi } from '@/core/api/cliente-api';
import { Action, AuthPage, d as estilos, Input, Message } from '@/components/ui/design-system';
import { useEstilosTematicos } from '@/core/tema/contexto-tema';

export default function RecuperarAcesso() {
  const estilosDaTela = useEstilosTematicos(estilos);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function executar(confirmar: boolean) {
    setOcupado(true);
    setErro('');
    setAviso('');
    try {
      if (confirmar) {
        await requisitarApi('/auth/recuperacao/confirmar', 'POST', { codigo, senha });
        setCodigo('');
        setSenha('');
        setAviso(
          'Senha atualizada. Todas as sessões anteriores foram encerradas. Entre novamente.',
        );
      } else {
        const result = await requisitarApi<{ message: string }>('/auth/recuperacao', 'POST', {
          email,
        });
        setAviso(result.message);
      }
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <AuthPage onBack={() => router.replace('/login')}>
      <Text style={estilosDaTela.heading}>Recuperar acesso</Text>
      <Text style={estilosDaTela.body}>
        Solicite um código por e-mail e cole-o abaixo. O código vale por 30 minutos.
      </Text>
      <Input
        label="E-mail da conta"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Action disabled={ocupado || !email} onPress={() => void executar(false)}>
        Enviar código
      </Action>
      <Input
        label="Código recebido"
        value={codigo}
        onChangeText={setCodigo}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Input
        label="Nova senha, mínimo 8 caracteres"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      <Action disabled={ocupado || !codigo || senha.length < 8} onPress={() => void executar(true)}>
        Atualizar senha
      </Action>
      <Message>{erro}</Message>
      <Message success>{aviso}</Message>
      <Action soft onPress={() => router.replace('/login')}>
        Voltar ao login
      </Action>
    </AuthPage>
  );
}
