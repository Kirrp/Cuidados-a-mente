import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { TipoUsuario } from '@/core/api/cliente-api';
import {
  Action,
  AuthPage,
  colors,
  d as dBase,
  Input,
  Message,
} from '@/components/ui/design-system';
import { LegalChoices } from './documentos-legais';
import { LEGAL_VERSION } from '@/legal/content';

const camposIniciais = {
  email: '',
  senha: '',
  nome: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  telefone: '',
  celular: '',
  cep: '',
  rua: '',
  bairro: '',
  cidade: '',
  estado: '',
  numero: '',
  complemento: '',
};

// Aplica máscaras progressivamente: `#` consome um dígito e os demais
// caracteres do padrão (pontos, barras e parênteses) são inseridos pela função.
function aplicarMascara(value: string, pattern: string) {
  const chars = value.replace(/\D/g, '');
  let index = 0;
  let out = '';
  for (const c of pattern) {
    if (index >= chars.length) {
      break;
    }
    out += c === '#' ? chars[index++] : c;
  }
  return out;
}
// Reconstruir a data detecta combinações que parecem válidas, mas não existem,
// como 31/02. A comparação de cada parte evita que o Date faça correção automática.
function dataValida(value: string) {
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    year >= 1900 &&
    date <= new Date() &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
export default function CadastroEtapas({ tipo }: { tipo: TipoUsuario }) {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const { cadastrar } = useAutenticacao();
  const [etapa, definirEtapa] = useState(0);
  const [campos, definirCampos] = useState(camposIniciais);
  const [erro, definirErro] = useState('');
  const [salvando, definirSalvando] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [healthChecked, setHealthChecked] = useState(false);
  // Cada posição representa uma regra mostrada na tela e alimenta tanto a cor
  // do requisito quanto a validação antes de avançar.
  const regrasSenha = [
    campos.senha.length >= 8,
    /[A-Z]/.test(campos.senha) && /[a-z]/.test(campos.senha),
    /\d/.test(campos.senha),
    /[^A-Za-z0-9\s]/.test(campos.senha),
  ];
  const alterarCampo = (key: keyof typeof camposIniciais, value: string) =>
    definirCampos((v) => ({ ...v, [key]: value }));
  function campoFormulario(key: keyof typeof camposIniciais, label: string, pattern?: string) {
    // Fábrica de campos: reduz repetição e mantém máscara, teclado e limites
    // iguais em todas as etapas do formulário.
    return (
      <Input
        key={key}
        label={label}
        value={campos[key]}
        onChangeText={(v) => alterarCampo(key, pattern ? aplicarMascara(v, pattern) : v)}
        keyboardType={pattern ? 'number-pad' : 'default'}
        autoCapitalize={key === 'estado' ? 'characters' : 'words'}
        maxLength={pattern?.length || (key === 'estado' ? 2 : 150)}
      />
    );
  }
  function voltar() {
    if (salvando) {
      return;
    }
    definirErro('');
    if (etapa) {
      definirEtapa(etapa - 1);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/cadastro');
    }
  }
  async function avancarEtapa() {
    if (salvando) {
      return;
    }
    definirErro('');
    // Cada etapa valida somente os campos visíveis. O envio ao backend acontece
    // apenas na última etapa, depois dos três consentimentos obrigatórios.
    if (etapa === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email.trim())) {
      return definirErro('Digite um e-mail válido.');
    }
    if (etapa === 1 && !regrasSenha.every(Boolean)) {
      return definirErro('Sua senha precisa atender aos quatro requisitos abaixo.');
    }
    if (etapa === 2 && !campos.nome.trim()) {
      return definirErro('Informe seu nome.');
    }
    if (etapa === 3 && campos.dataNascimento && !dataValida(campos.dataNascimento)) {
      return definirErro('Confira a data de nascimento ou deixe-a vazia.');
    }
    if (etapa < 4) {
      definirEtapa(etapa + 1);
      return;
    }
    if (!termsChecked || !privacyChecked || !healthChecked) {
      return definirErro(
        'Leia e confirme os Termos de Uso, a Política de Privacidade e o tratamento dos dados de saúde.',
      );
    }
    definirSalvando(true);
    // As versões jurídicas acompanham o cadastro para que o backend registre
    // exatamente qual texto foi aceito pelo usuário.
    try {
      await cadastrar({
        ...campos,
        email: campos.email.trim(),
        tipo,
        estado: campos.estado.toUpperCase(),
        termsVersion: LEGAL_VERSION,
        privacyVersion: LEGAL_VERSION,
        healthConsent: true,
      });
      router.replace('/painel');
    } catch (erroCapturado) {
      definirErro((erroCapturado as Error).message);
    } finally {
      definirSalvando(false);
    }
  }
  return (
    <AuthPage onBack={voltar} large={tipo === 'idoso'}>
      <Text style={[estilosDaTela.muted, { textAlign: 'center' }]}>
        {tipo === 'responsavel' ? 'Responsável' : tipo === 'cuidador' ? 'Cuidador' : 'Idoso'} ·
        Etapa {etapa + 1} de 5
      </Text>
      <View style={estilosDaTela.row}>
        {[0, 1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={{
              flex: 1,
              height: 3,
              backgroundColor: cor(n <= etapa ? colors.lavender : colors.pale, 'fundo'),
              borderRadius: 2,
            }}
          />
        ))}
      </View>
      {etapa === 0 && (
        <>
          <Text style={[estilosDaTela.heading, { textAlign: 'center', fontSize: 32 }]}>
            Crie sua conta
          </Text>
          <Text style={[estilosDaTela.body, { textAlign: 'center' }]}>
            Insira o seu endereço de email.
          </Text>
          <Input
            label="Email"
            value={campos.email}
            onChangeText={(v) => alterarCampo('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
        </>
      )}
      {etapa === 1 && (
        <>
          <Text style={estilosDaTela.muted}>{campos.email}</Text>
          <Text style={estilosDaTela.heading}>Crie sua senha</Text>
          <Input
            label="Senha"
            value={campos.senha}
            onChangeText={(v) => alterarCampo('senha', v)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={estilosDaTela.muted}>A sua senha deve conter:</Text>
          <View style={{ gap: 6 }}>
            {[
              'No mínimo 8 caracteres',
              'Uma letra maiúscula e uma minúscula',
              'Um número',
              'Um caractere especial',
            ].map((text, i) => (
              <Text
                key={text}
                style={[estilosDaTela.muted, regrasSenha[i] && { color: cor('#287647', 'texto') }]}
              >
                {regrasSenha[i] ? '✓' : '○'} {text}
              </Text>
            ))}
          </View>
        </>
      )}
      {etapa === 2 && (
        <>
          <Text style={[estilosDaTela.heading, { textAlign: 'center' }]}>
            Digite algumas informações
          </Text>
          <Text style={[estilosDaTela.body, { textAlign: 'center' }]}>
            Informe seu nome. Documentos e endereço são opcionais; preencha apenas se forem
            necessários para o cuidado.
          </Text>
          {campoFormulario('nome', 'Nome completo')}
          {campoFormulario('rg', 'RG (opcional)')}
          {campoFormulario('cpf', 'CPF (opcional)', '###.###.###-##')}
        </>
      )}
      {etapa === 3 && (
        <>
          <Text style={[estilosDaTela.body, { textAlign: 'center' }]}>
            Agora, insira a sua data de nascimento e o seu número de telefone.
          </Text>
          {campoFormulario(
            'dataNascimento',
            'Data de nascimento (DD/MM/AAAA) (opcional)',
            '##/##/####',
          )}
          {campoFormulario('telefone', 'Telefone (opcional)', '(##) ####-####')}
          {campoFormulario('celular', 'Celular (opcional)', '(##) #####-####')}
        </>
      )}
      {etapa === 4 && (
        <>
          <Text style={[estilosDaTela.body, { textAlign: 'center' }]}>
            Agora, para finalizar, precisamos do seu endereço.
          </Text>
          {campoFormulario('cep', 'CEP (opcional)', '#####-###')}
          {campoFormulario('rua', 'Rua (opcional)')}
          {campoFormulario('bairro', 'Bairro (opcional)')}
          {campoFormulario('cidade', 'Cidade (opcional)')}
          <View style={estilosDaTela.row}>
            <View style={{ flex: 1 }}>{campoFormulario('estado', 'Estado (UF) (opcional)')}</View>
            <View style={{ flex: 1 }}>{campoFormulario('numero', 'Número (opcional)')}</View>
          </View>
          {campoFormulario('complemento', 'Complemento (opcional)')}
          <LegalChoices
            termsChecked={termsChecked}
            privacyChecked={privacyChecked}
            healthChecked={healthChecked}
            onTerms={() => setTermsChecked(!termsChecked)}
            onPrivacy={() => setPrivacyChecked(!privacyChecked)}
            onHealth={() => setHealthChecked(!healthChecked)}
            onOpen={(kind) =>
              router.push(kind === 'terms' ? '/termos-de-uso' : '/politica-de-privacidade')
            }
          />
        </>
      )}
      <Message>{erro}</Message>
      <Action disabled={salvando} onPress={avancarEtapa}>
        {salvando ? 'Salvando...' : etapa === 4 ? 'Concluir' : 'Avançar'}
      </Action>
    </AuthPage>
  );
}
