import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Action, AuthPage, d, Input, Loading, Message } from '../components/design';

const prefix = 'cuidados-a-mente:acesso:';
export default function AcessoIdoso() {
  const { entrarQr, usuario, iniciando } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const lock = useRef(false);
  const [camera, setCamera] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [code, setCode] = useState(''), [manual, setManual] = useState(false);
  useFocusEffect(useCallback(() => () => setCamera(false), []));
  async function enter(value: string) {
    if (lock.current) return;
    setCamera(false); setError('');
    const codigo = value.trim().replace(prefix, '');
    if (!/^[A-Za-z0-9_-]{43}$/.test(codigo)) { setError('Este não é um código de acesso do Cuidados à Mente. Peça o código ao cuidador ou responsável.'); return; }
    lock.current = true; setBusy(true);
    try { await entrarQr(codigo); router.replace('/painel'); }
    catch(e) { setError((e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }
  async function openCamera() {
    setError('');
    try {
      const allowed = permission?.granted ? permission : await requestPermission();
      if (allowed.granted) setCamera(true);
      else { setManual(true); setError('A câmera não foi liberada. Você pode permitir o acesso nas configurações do aparelho ou usar o código abaixo.'); }
    } catch { setManual(true); setError('Não foi possível abrir a câmera. Use o código de acesso abaixo.'); }
  }
  if (iniciando) return <AuthPage><Loading /></AuthPage>;
  if (usuario?.tipo === 'idoso') return <Redirect href="/painel" />;
  if (usuario) return <AuthPage onBack={() => router.replace('/painel')}><Text style={d.heading}>Acesso do idoso</Text><Text style={d.body}>Você está na conta do cuidador ou responsável. Gere o código e abra esta tela no aparelho do idoso.</Text><Action onPress={() => router.replace('/contas-idosos')}>Gerenciar contas dos idosos</Action></AuthPage>;
  return <AuthPage onBack={() => router.replace('/')}>
    <Text style={[d.heading, { textAlign: 'center' }]}>Vamos entrar?</Text>
    <Text style={[d.body, { textAlign: 'center' }]}>Seu cuidador ou responsável cria sua conta. Aponte a câmera para o QR Code que ele mostrar e você entra direto.</Text>
    <Message>{error}</Message>
    {busy ? <><Loading /><Text style={d.body}>Entrando na sua conta...</Text></> : camera && permission?.granted ? <>
      <View style={{ height: 280, borderRadius: 16, overflow: 'hidden' }}><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => void enter(data)} onMountError={() => { setCamera(false); setManual(true); setError('A câmera não está disponível. Use o código de acesso.'); }} /></View>
      <Action soft onPress={() => setCamera(false)}>Fechar câmera</Action>
    </> : <Action icon="qr-code-outline" onPress={openCamera}>Escanear QR Code</Action>}
    {!busy && <Action soft onPress={() => { setManual(!manual); setCamera(false); }}>Usar código de acesso</Action>}
    {manual && !busy && <View style={d.card}><Text style={d.body}>Peça ajuda para copiar o código exibido abaixo do QR Code.</Text><Input label="Cole o código de acesso" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} /><Action disabled={!code.trim()} onPress={() => void enter(code)}>Acessar minha conta</Action></View>}
  </AuthPage>;
}
