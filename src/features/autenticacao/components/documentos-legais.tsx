import { CentralPrivacidade } from '@/features/cuidados/components/central-privacidade';
import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { LEGAL_VERSION, LegalText, privacy, terms } from '@/legal/content';
import {
  Action,
  AuthPage,
  colors,
  d as dBase,
  Input,
  Message,
} from '@/components/ui/design-system';

// Renderizador comum dos Termos e da Política. O conteúdo fica em legal/content
// para que texto jurídico e componentes visuais possam evoluir separadamente.
export function LegalDocument({ document }: { document: LegalText }) {
  const estilosDaTela = useEstilosTematicos(dBase);

  return (
    <>
      <Text accessibilityRole="header" style={estilosDaTela.heading}>
        {document.title}
      </Text>
      <Text style={estilosDaTela.muted}>{document.intro}</Text>
      {document.sections.map((section) => (
        <View key={section.heading} style={{ gap: 6 }}>
          <Text style={estilosDaTela.subheading}>{section.heading}</Text>
          <Text style={estilosDaTela.body}>{section.text}</Text>
        </View>
      ))}
    </>
  );
}

export function LegalPage({ document }: { document: LegalText }) {
  return (
    <AuthPage large onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <LegalDocument document={document} />
    </AuthPage>
  );
}

export function LegalChoices({
  termsChecked,
  privacyChecked,
  healthChecked,
  onTerms,
  onPrivacy,
  onHealth,
  onOpen,
}: {
  termsChecked: boolean;
  privacyChecked: boolean;
  healthChecked: boolean;
  onTerms: () => void;
  onPrivacy: () => void;
  onHealth: () => void;
  onOpen: (kind: 'terms' | 'privacy') => void;
}) {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);

  // Os três aceites são separados de propósito: ler os termos, conhecer a
  // política e autorizar dados sensíveis representam decisões diferentes.
  return (
    <View style={s.choices}>
      <Text style={estilosDaTela.subheading}>Antes de continuar</Text>
      <Pressable accessibilityRole="link" onPress={() => onOpen('terms')}>
        <Text style={estilosDaTela.link}>Ler Termos de Uso</Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => onOpen('privacy')}>
        <Text style={estilosDaTela.link}>Ler Política de Privacidade</Text>
      </Pressable>
      <Choice
        checked={termsChecked}
        onPress={onTerms}
        label={`Li e aceito os Termos de Uso (versão ${LEGAL_VERSION}).`}
      />
      <Choice
        checked={privacyChecked}
        onPress={onPrivacy}
        label={`Li e concordo com a Política de Privacidade (versão ${LEGAL_VERSION}).`}
      />
      <Choice
        checked={healthChecked}
        onPress={onHealth}
        label="Autorizo, de forma específica, o tratamento dos dados de saúde que eu inserir, para organizar medicamentos, consultas, rotina e acompanhamento, conforme a Política de Privacidade. Confirmo que tenho autorização válida para cadastrar dados de outra pessoa."
      />
      <Text style={estilosDaTela.muted}>
        Sem essas confirmações, as funções de cuidado não ficam disponíveis. Você pode solicitar a
        revogação do consentimento pelo contato da Política de Privacidade.
      </Text>
    </View>
  );
}

function Choice({
  checked,
  onPress,
  label,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
}) {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={checked}
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onPress}
      style={s.choice}
    >
      <View style={[s.box, checked && s.boxChecked]}>
        <Text style={{ color: cor(checked ? 'white' : colors.purple, 'texto'), fontWeight: '700' }}>
          {checked ? '✓' : ''}
        </Text>
      </View>
      <Text style={[estilosDaTela.body, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

export function LegalGate() {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);

  const { usuario, aceitarTermos, sair, excluirConta } = useAutenticacao();
  const [opened, setOpened] = useState<'terms' | 'privacy' | null>(null);
  const [direitos, setDireitos] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [healthChecked, setHealthChecked] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [exclusaoAberta, definirExclusaoAberta] = useState(false);
  const [senhaExclusao, definirSenhaExclusao] = useState('');
  async function accept() {
    if (ocupado || !termsChecked || !privacyChecked || !healthChecked) {
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await aceitarTermos();
    } catch (erroCapturado) {
      setError((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function excluirSemAceitar() {
    if (ocupado || !senhaExclusao) {
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await excluirConta(senhaExclusao);
      router.replace('/');
    } catch (erroCapturado) {
      setError((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  // O próprio bloqueio pode alternar entre o texto completo e as caixas de
  // aceite sem liberar as rotas protegidas por baixo do modal.
  if (direitos) {
    return (
      <AuthPage large>
        <CentralPrivacidade />
        <Action soft onPress={() => setDireitos(false)}>
          Voltar
        </Action>
      </AuthPage>
    );
  }
  if (opened) {
    return (
      <View style={s.full}>
        <ScrollView contentContainerStyle={s.document}>
          <LegalDocument document={opened === 'terms' ? terms : privacy} />
          <Action soft onPress={() => setOpened(null)}>
            Voltar ao aceite
          </Action>
        </ScrollView>
      </View>
    );
  }
  return (
    <AuthPage large>
      <Text style={estilosDaTela.heading}>Confirme para acessar</Text>
      <Text style={estilosDaTela.body}>
        Leia os documentos e escolha cada opção. Seu aceite será registrado na sua conta.
      </Text>
      <LegalChoices
        termsChecked={termsChecked}
        privacyChecked={privacyChecked}
        healthChecked={healthChecked}
        onTerms={() => setTermsChecked(!termsChecked)}
        onPrivacy={() => setPrivacyChecked(!privacyChecked)}
        onHealth={() => setHealthChecked(!healthChecked)}
        onOpen={setOpened}
      />
      <Message>{error}</Message>
      <Action
        disabled={ocupado || !termsChecked || !privacyChecked || !healthChecked}
        onPress={() => void accept()}
      >
        {ocupado ? 'Registrando...' : 'Concordar e acessar'}
      </Action>
      <Action soft onPress={() => setDireitos(true)}>
        Meus direitos sem aceitar nova versão
      </Action>
      <Action
        soft
        disabled={ocupado}
        onPress={() =>
          void sair().catch((erroCapturado) => setError((erroCapturado as Error).message))
        }
      >
        Sair sem aceitar
      </Action>
      {usuario?.tipo !== 'idoso' && (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.subheading}>Encerrar conta sem aceitar</Text>
          <Text style={estilosDaTela.body}>
            Você pode excluir sua conta e todos os dados vinculados sem aceitar esta nova versão. A
            exclusão é permanente.
          </Text>
          {exclusaoAberta ? (
            <>
              <Input
                label="Confirme sua senha"
                value={senhaExclusao}
                onChangeText={definirSenhaExclusao}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Action disabled={ocupado || !senhaExclusao} onPress={() => void excluirSemAceitar()}>
                Excluir conta e dados permanentemente
              </Action>
              <Action
                soft
                disabled={ocupado}
                onPress={() => {
                  definirExclusaoAberta(false);
                  definirSenhaExclusao('');
                  setError('');
                }}
              >
                Cancelar
              </Action>
            </>
          ) : (
            <Action soft disabled={ocupado} onPress={() => definirExclusaoAberta(true)}>
              Excluir minha conta
            </Action>
          )}
        </View>
      )}
    </AuthPage>
  );
}

const sBase = StyleSheet.create({
  choices: { gap: 14, padding: 16, backgroundColor: colors.pale, borderRadius: 16 },
  choice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  box: {
    width: 23,
    height: 23,
    borderWidth: 2,
    borderColor: colors.purple,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 2,
  },
  boxChecked: { backgroundColor: colors.purple },
  full: { flex: 1, backgroundColor: colors.surface },
  document: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    padding: 24,
    gap: 20,
    paddingBottom: 50,
  },
});
