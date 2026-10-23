import { useEstilosTematicos } from '@/core/tema/contexto-tema';
import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import {
  Action,
  AuthPage,
  d as dBase,
  Input,
  Loading,
  Message,
} from '@/components/ui/design-system';

const prefix = 'cuidados-a-mente:acesso:';

/** Autenticação simplificada do idoso por câmera ou código digitado. */
export default function AcessoIdoso() {
  const estilosDaTela = useEstilosTematicos(dBase);

  const { entrarQr, usuario, iniciando } = useAutenticacao();
  const [permission, requestPermission] = useCameraPermissions();
  // O leitor de QR pode emitir o mesmo valor várias vezes por segundo. Esta trava
  // garante uma única tentativa enquanto a autenticação está em andamento.
  const lock = useRef(false);
  const [camera, setCamera] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [manual, setManual] = useState(false);
  useFocusEffect(useCallback(() => () => setCamera(false), []));
  async function enter(value: string) {
    if (lock.current) {
      return;
    }
    setCamera(false);
    setError('');
    // O QR possui um prefixo legível para não confundir outros códigos com um
    // acesso do aplicativo. A entrada manual também aceita apenas a parte secreta.
    const codigo = value.trim().replace(prefix, '');
    if (!/^[A-Za-z0-9_-]{43}$/.test(codigo)) {
      setError(
        'Este não é um código de acesso do Cuidados à Mente. Peça o código ao cuidador ou responsável.',
      );
      return;
    }
    lock.current = true;
    setOcupado(true);
    try {
      await entrarQr(codigo);
      router.replace('/painel');
    } catch (erroCapturado) {
      setError((erroCapturado as Error).message);
    } finally {
      lock.current = false;
      setOcupado(false);
    }
  }
  async function openCamera() {
    setError('');
    try {
      // Só pergunta ao sistema quando a permissão ainda não foi concedida.
      const allowed = permission?.granted ? permission : await requestPermission();
      if (allowed.granted) {
        setCamera(true);
      } else {
        setManual(true);
        setError(
          'A câmera não foi liberada. Você pode permitir o acesso nas configurações do ' +
            'aparelho ou usar o código abaixo.',
        );
      }
    } catch {
      setManual(true);
      setError('Não foi possível abrir a câmera. Use o código de acesso abaixo.');
    }
  }
  // Estes retornos antecipados separam estados de sessão antes de montar a
  // interface da câmera, evitando que ela abra para um usuário já autenticado.
  if (iniciando) {
    return (
      <AuthPage>
        <Loading />
      </AuthPage>
    );
  }
  if (usuario?.tipo === 'idoso') {
    return <Redirect href="/painel" />;
  }
  if (usuario) {
    return (
      <AuthPage onBack={() => router.replace('/painel')}>
        <Text style={estilosDaTela.heading}>Acesso do idoso</Text>
        <Text style={estilosDaTela.body}>
          Você está na conta do cuidador ou responsável. Gere o código e abra esta tela no aparelho
          do idoso.
        </Text>
        <Action onPress={() => router.replace('/contas-idosos')}>
          Gerenciar contas dos idosos
        </Action>
      </AuthPage>
    );
  }
  return (
    <AuthPage onBack={() => router.replace('/')}>
      <Text style={[estilosDaTela.heading, { textAlign: 'center' }]}>Vamos entrar?</Text>
      <Text style={[estilosDaTela.body, { textAlign: 'center' }]}>
        Seu cuidador ou responsável cria sua conta. Aponte a câmera para o QR Code que ele mostrar e
        você entra direto.
      </Text>
      <Message>{error}</Message>
      {ocupado ? (
        <>
          <Loading />
          <Text style={estilosDaTela.body}>Entrando na sua conta...</Text>
        </>
      ) : camera && permission?.granted ? (
        <>
          <View style={{ height: 280, borderRadius: 16, overflow: 'hidden' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => void enter(data)}
              onMountError={() => {
                setCamera(false);
                setManual(true);
                setError('A câmera não está disponível. Use o código de acesso.');
              }}
            />
          </View>
          <Action soft onPress={() => setCamera(false)}>
            Fechar câmera
          </Action>
        </>
      ) : (
        <Action icon="qr-code-outline" onPress={openCamera}>
          Escanear QR Code
        </Action>
      )}
      {!ocupado && (
        <Action
          soft
          onPress={() => {
            setManual(!manual);
            setCamera(false);
          }}
        >
          Usar código de acesso
        </Action>
      )}
      {!ocupado && !camera && (
        <Action soft icon="key-outline" onPress={() => router.push('/login?tipo=idoso' as never)}>
          Entrar com e-mail e senha
        </Action>
      )}
      {manual && !ocupado && (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.body}>
            Peça ajuda para copiar o código exibido abaixo do QR Code.
          </Text>
          <Input
            label="Cole o código de acesso"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Action disabled={!code.trim()} onPress={() => void enter(code)}>
            Acessar minha conta
          </Action>
        </View>
      )}
    </AuthPage>
  );
}
