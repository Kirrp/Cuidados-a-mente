import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Idoso, requisitarApi } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import { Action, colors, d as dBase, Input, Loading, Message } from '@/components/ui/design-system';

type AcessoQr = { codigo: string; expires: number; nome: string; id: string };
type RascunhoIdoso = {
  nome: string;
  rg: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  celular: string;
  email: string;
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  complemento: string;
  observacoes: string;
};

// `camposVazios` serve como modelo imutável para um cadastro novo. Ao editar, os
// campos salvos são sobrepostos a esta base para preencher possíveis ausências.
const camposVazios: RascunhoIdoso = {
  nome: '',
  rg: '',
  cpf: '',
  nascimento: '',
  telefone: '',
  celular: '',
  email: '',
  cep: '',
  rua: '',
  bairro: '',
  cidade: '',
  estado: '',
  numero: '',
  complemento: '',
  observacoes: '',
};
function aplicarMascara(value: string, pattern: string) {
  const digits = value.replace(/\D/g, '');
  let i = 0;
  let output = '';
  for (const part of pattern) {
    if (i >= digits.length) {
      break;
    }
    output += part === '#' ? digits[i++] : part;
  }
  return output;
}
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
// O QR só é liberado quando existem dados mínimos para identificar e apoiar o
// idoso. O backend repete esta validação, pois o frontend nunca é uma barreira de segurança.
function cadastroCompleto(pessoa: Idoso) {
  return !!pessoa.nome.trim();
}

/** Cadastro do idoso e geração/revogação de seu acesso temporário por QR. */
export default function ContasIdosos() {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const { usuario } = useAutenticacao();
  const { novo, editar } = useLocalSearchParams<{ novo?: string; editar?: string }>();
  const rotaTratada = useRef(false);
  const [pessoas, definirPessoas] = useState<Idoso[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');
  const [aviso, definirAviso] = useState('');
  const [salvando, definirSalvando] = useState(false);
  const [formularioAberto, definirFormularioAberto] = useState(false);
  const [rascunho, definirRascunho] = useState<RascunhoIdoso>(camposVazios);
  const [idEmEdicao, definirIdEmEdicao] = useState('');
  const [etapa, definirEtapa] = useState(0);
  const [qr, setQr] = useState<AcessoQr | null>(null);
  const [agora, definirAgora] = useState(Date.now());
  const [autorizado, definirAutorizado] = useState(false);
  const [representacao, definirRepresentacao] = useState('titular_autorizou');
  const [confirmarDesconexao, definirConfirmarDesconexao] = useState('');
  const [confirmarExclusao, definirConfirmarExclusao] = useState('');
  const carregarPessoas = useCallback(async () => {
    if (!usuario || usuario.tipo === 'idoso') {
      return;
    }
    definirCarregando(true);
    try {
      definirPessoas(await requisitarApi<Idoso[]>('/idosos'));
    } catch (erroCapturado) {
      definirErro((erroCapturado as Error).message);
    } finally {
      definirCarregando(false);
    }
  }, [usuario]);
  useFocusEffect(
    useCallback(() => {
      void carregarPessoas();
      return () => setQr(null);
    }, [carregarPessoas]),
  );
  // Os parâmetros ?editar= e ?novo= abrem o formulário por link direto. A trava
  // impede reabrir o modal sempre que a lista de pessoas for atualizada.
  useEffect(() => {
    if (carregando || rotaTratada.current) {
      return;
    }
    rotaTratada.current = true;
    if (editar) {
      const pessoa = pessoas.find((p) => p.id === editar);
      if (pessoa) {
        abrirFormulario(pessoa);
      }
    } else if (novo) {
      abrirFormulario();
    }
  }, [carregando, pessoas, editar, novo]);
  // O backend entrega o instante de expiração; este relógio apenas atualiza a
  // contagem regressiva visual e é sempre desmontado ao fechar ou trocar o QR.
  useEffect(() => {
    if (!qr) {
      return;
    }
    const timer = setInterval(() => definirAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [qr]);
  async function gerarCodigoQr(id: string) {
    // A resposta contém o segredo em texto apenas nesta geração. O servidor
    // guarda somente o hash e invalida o código anterior do mesmo idoso.
    const result = await requisitarApi<Omit<AcessoQr, 'id'>>(`/idosos/${id}/qr`, 'POST');
    definirAgora(Date.now());
    setQr({ ...result, id });
  }
  // Monta o mesmo formulário para criação ou edição e normaliza a data da API
  // (AAAA-MM-DD) para o formato mostrado ao usuário (DD/MM/AAAA).
  function abrirFormulario(pessoa?: Idoso) {
    const saved = pessoa ? (JSON.parse(pessoa.perfil || '{}') as Partial<RascunhoIdoso>) : {};
    definirIdEmEdicao(pessoa?.id || '');
    definirRascunho({
      ...camposVazios,
      ...saved,
      nome: pessoa?.nome || '',
      nascimento: pessoa?.nascimento?.split('-').reverse().join('/') || '',
      observacoes: pessoa?.observacoes || '',
    });
    definirEtapa(0);
    definirFormularioAberto(true);
    setQr(null);
    definirErro('');
    definirAviso('');
  }
  function campoFormulario(key: keyof RascunhoIdoso, label: string, pattern?: string) {
    return (
      <Input
        key={key}
        label={label}
        value={rascunho[key]}
        onChangeText={(value) =>
          definirRascunho((current) => ({
            ...current,
            [key]: pattern ? aplicarMascara(value, pattern) : value,
          }))
        }
        keyboardType={pattern ? 'number-pad' : key === 'email' ? 'email-address' : 'default'}
        autoCapitalize={key === 'estado' ? 'characters' : key === 'email' ? 'none' : 'words'}
        autoCorrect={key !== 'email'}
        maxLength={pattern?.length || (key === 'estado' ? 2 : 150)}
      />
    );
  }
  function avancarEtapa() {
    definirErro('');
    if (etapa === 0 && !rascunho.nome.trim()) {
      return definirErro('Informe o nome da pessoa.');
    }
    if (etapa === 1 && rascunho.nascimento && !dataValida(rascunho.nascimento)) {
      return definirErro('Confira o nascimento ou deixe-o vazio.');
    }
    if (etapa < 2) {
      definirEtapa(etapa + 1);
      return;
    }
    void executarAcao(salvarIdoso);
  }
  async function executarAcao(action: () => Promise<void>) {
    // Wrapper comum de ações assíncronas: trava cliques repetidos e padroniza
    // limpeza/visualização de erro sem duplicar try/catch em cada botão.
    if (salvando) {
      return;
    }
    definirSalvando(true);
    definirErro('');
    definirAviso('');
    try {
      await action();
    } catch (erroCapturado) {
      definirErro((erroCapturado as Error).message);
    } finally {
      definirSalvando(false);
    }
  }
  async function cadastrarIdoso() {
    await requisitarApi<Idoso>('/idosos', 'POST', {
      ...rascunho,
      autorizacaoTitularConfirmada: autorizado,
      representacao,
      nome: rascunho.nome.trim(),
      nascimento: rascunho.nascimento.split('/').reverse().join('-'),
      estado: rascunho.estado.toUpperCase(),
    });
  }
  async function salvarIdoso() {
    if (idEmEdicao) {
      await requisitarApi<Idoso>('/idosos/' + idEmEdicao, 'PUT', {
        ...rascunho,
        nome: rascunho.nome.trim(),
        nascimento: rascunho.nascimento.split('/').reverse().join('-'),
        estado: rascunho.estado.toUpperCase(),
      });
    } else {
      await cadastrarIdoso();
    }
    definirFormularioAberto(false);
    definirIdEmEdicao('');
    await carregarPessoas();
    definirAviso('Cadastro salvo. Agora escolha Gerar QR Code de acesso.');
  }
  // `expires` usa segundos Unix; Date.now() usa milissegundos, por isso a divisão.
  const segundosRestantes = qr ? Math.max(0, qr.expires - Math.floor(agora / 1000)) : 0;
  if (usuario?.tipo === 'idoso') {
    return <Redirect href="/painel" />;
  }
  return (
    <EstruturaAplicativo title="Contas dos idosos" section="perfil" back>
      <Text style={estilosDaTela.heading}>Acesso com QR Code</Text>
      <Text style={estilosDaTela.body}>
        Preencha os dados do idoso e salve o cadastro. Depois, gere o QR Code para ele acessar a
        mesma rotina e as mesmas memórias.
      </Text>
      <Message>{erro}</Message>
      <Message success>{aviso}</Message>
      {carregando ? (
        <Loading />
      ) : (
        <>
          {!formularioAberto &&
            pessoas.map((pessoa) => (
              <View key={pessoa.id} style={estilosDaTela.card}>
                <Text style={estilosDaTela.subheading}>{pessoa.nome}</Text>
                {pessoa.permissoes?.includes('gerar_qr') && cadastroCompleto(pessoa) ? (
                  <Action
                    icon="qr-code-outline"
                    disabled={salvando}
                    onPress={() => void executarAcao(() => gerarCodigoQr(pessoa.id))}
                  >
                    Gerar QR Code de acesso
                  </Action>
                ) : pessoa.permissoes?.includes('gerar_qr') ? (
                  <Text style={estilosDaTela.muted}>
                    Complete os dados do cadastro para liberar o QR Code.
                  </Text>
                ) : null}
                {pessoa.permissoes?.includes('editar_perfil_idoso') && (
                  <Action soft disabled={salvando} onPress={() => abrirFormulario(pessoa)}>
                    {cadastroCompleto(pessoa)
                      ? 'Editar cadastro do idoso'
                      : 'Completar cadastro do idoso'}
                  </Action>
                )}
                {pessoa.permissoes?.includes('revogar_qr') && (
                  <Action
                    soft
                    disabled={salvando}
                    onPress={() => {
                      definirConfirmarExclusao('');
                      definirConfirmarDesconexao(pessoa.id);
                    }}
                  >
                    Desconectar acesso do idoso
                  </Action>
                )}
                {confirmarDesconexao === pessoa.id && (
                  <>
                    <Text style={estilosDaTela.body}>
                      Isso encerra as sessões deste idoso, cancela o código atual e desativa o
                      acesso por senha. Seus dados continuam salvos.
                    </Text>
                    <Action
                      disabled={salvando}
                      onPress={() =>
                        void executarAcao(async () => {
                          await requisitarApi(`/idosos/${pessoa.id}/qr`, 'DELETE');
                          setQr(null);
                          definirConfirmarDesconexao('');
                          definirAviso('Acesso desconectado. Gere outro código quando precisar.');
                        })
                      }
                    >
                      Confirmar desconexão
                    </Action>
                    <Action soft disabled={salvando} onPress={() => definirConfirmarDesconexao('')}>
                      Cancelar
                    </Action>
                  </>
                )}
                {pessoa.dono && (
                  <Action
                    soft
                    disabled={salvando}
                    onPress={() => {
                      definirConfirmarDesconexao('');
                      definirConfirmarExclusao(pessoa.id);
                    }}
                  >
                    Excluir cadastro e dados
                  </Action>
                )}
                {confirmarExclusao === pessoa.id && (
                  <>
                    <Text style={estilosDaTela.body}>
                      Excluir {pessoa.nome} apaga permanentemente seus registros, memórias, conta de
                      acesso e QR Code. Esta ação não pode ser desfeita.
                    </Text>
                    <Action
                      disabled={salvando}
                      onPress={() =>
                        void executarAcao(async () => {
                          await requisitarApi(`/idosos/${pessoa.id}`, 'DELETE');
                          setQr(null);
                          definirConfirmarExclusao('');
                          await carregarPessoas();
                          definirAviso('Cadastro e dados excluídos.');
                        })
                      }
                    >
                      Confirmar exclusão permanente
                    </Action>
                    <Action soft disabled={salvando} onPress={() => definirConfirmarExclusao('')}>
                      Cancelar
                    </Action>
                  </>
                )}
              </View>
            ))}
          {!pessoas.length && !formularioAberto && (
            <Text style={estilosDaTela.body}>
              Cadastre o primeiro idoso para preparar seu acesso.
            </Text>
          )}
          {qr && (
            <View
              style={[
                estilosDaTela.card,
                { alignItems: 'center', backgroundColor: cor(colors.pale, 'fundo') },
              ]}
            >
              <Text style={estilosDaTela.subheading}>Acesso de {qr.nome}</Text>
              {segundosRestantes > 0 ? (
                <>
                  <View
                    accessibilityLabel={`QR Code de acesso de ${qr.nome}`}
                    style={{ padding: 20, backgroundColor: 'white' }}
                  >
                    <QRCode value={'cuidados-a-mente:acesso:' + qr.codigo} size={210} ecl="M" />
                  </View>
                  <Text style={estilosDaTela.body}>
                    Válido por {Math.floor(segundosRestantes / 60)}:
                    {String(segundosRestantes % 60).padStart(2, '0')} · uso único
                  </Text>
                  <Text style={estilosDaTela.body}>
                    No aparelho do idoso, abra o aplicativo e toque no ícone de QR Code no canto
                    superior direito da tela inicial.
                  </Text>
                  <Text style={estilosDaTela.muted}>
                    Sem câmera? Selecione e copie este código:
                  </Text>
                  <Text selectable style={[estilosDaTela.body, { fontSize: 12 }]}>
                    {qr.codigo}
                  </Text>
                </>
              ) : (
                <Message>O código expirou. Gere outro para entrar.</Message>
              )}
              <Action
                soft
                disabled={salvando}
                onPress={() => void executarAcao(() => gerarCodigoQr(qr.id))}
              >
                Gerar novo código
              </Action>
              <Text style={estilosDaTela.muted}>
                Um novo código substitui o anterior. Mostre somente ao idoso que vai acessar esta
                conta.
              </Text>
            </View>
          )}
          {formularioAberto ? (
            <View style={estilosDaTela.card}>
              <Text style={estilosDaTela.subheading}>
                {idEmEdicao ? 'Completar ou editar cadastro' : 'Cadastrar idoso'}
              </Text>
              <Text style={estilosDaTela.muted}>Etapa {etapa + 1} de 3</Text>
              <View style={estilosDaTela.row}>
                {[0, 1, 2].map((n) => (
                  <View
                    key={n}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: cor(n <= etapa ? colors.lavender : colors.pale, 'fundo'),
                    }}
                  />
                ))}
              </View>
              {etapa === 0 && (
                <>
                  <Text style={estilosDaTela.body}>Informações pessoais</Text>
                  {campoFormulario('nome', 'Nome completo')}
                  {campoFormulario('rg', 'RG (opcional)')}
                  {campoFormulario('cpf', 'CPF (opcional)', '###.###.###-##')}
                </>
              )}
              {etapa === 1 && (
                <>
                  <Text style={estilosDaTela.body}>Nascimento e contato</Text>
                  {campoFormulario(
                    'nascimento',
                    'Data de nascimento (DD/MM/AAAA) (opcional)',
                    '##/##/####',
                  )}
                  {campoFormulario('telefone', 'Telefone (opcional)', '(##) ####-####')}
                  {campoFormulario('celular', 'Celular (opcional)', '(##) #####-####')}
                  {campoFormulario('email', 'E-mail de contato (opcional)')}
                  <Text style={estilosDaTela.muted}>
                    O e-mail é apenas para contato. O idoso não precisa criar senha.
                  </Text>
                </>
              )}
              {etapa === 2 && (
                <>
                  <Text style={estilosDaTela.body}>Endereço</Text>
                  {campoFormulario('cep', 'CEP (opcional)', '#####-###')}
                  {campoFormulario('rua', 'Rua (opcional)')}
                  {campoFormulario('bairro', 'Bairro (opcional)')}
                  {campoFormulario('cidade', 'Cidade (opcional)')}
                  <View style={estilosDaTela.row}>
                    <View style={{ flex: 1 }}>
                      {campoFormulario('estado', 'Estado (UF) (opcional)')}
                    </View>
                    <View style={{ flex: 1 }}>
                      {campoFormulario('numero', 'Número (opcional)')}
                    </View>
                  </View>
                  {campoFormulario('complemento', 'Complemento (opcional)')}
                  <Input
                    label="Observações (opcional)"
                    multiline
                    value={rascunho.observacoes}
                    onChangeText={(observacoes) => definirRascunho((p) => ({ ...p, observacoes }))}
                  />
                </>
              )}
              {!idEmEdicao && (
                <View style={estilosDaTela.card}>
                  <Text style={estilosDaTela.body}>
                    Quem autorizou o cadastro e o tratamento dos dados de cuidado?
                  </Text>
                  <Action soft onPress={() => definirRepresentacao('titular_autorizou')}>
                    {representacao === 'titular_autorizou'
                      ? 'Selecionado: a própria pessoa autorizou'
                      : 'A própria pessoa autorizou'}
                  </Action>
                  <Action soft onPress={() => definirRepresentacao('representante_legal')}>
                    {representacao === 'representante_legal'
                      ? 'Selecionado: possuo representação legal válida'
                      : 'Possuo representação legal válida'}
                  </Action>
                  <Text style={estilosDaTela.body}>
                    Explique as finalidades à pessoa. Ser familiar ou cuidador não comprova
                    representação legal.
                  </Text>
                  <Switch
                    accessibilityLabel="Confirmo autorização válida para este cadastro"
                    value={autorizado}
                    onValueChange={definirAutorizado}
                  />
                  <Text style={estilosDaTela.body}>Confirmo que tenho a autorização indicada.</Text>
                </View>
              )}
              <Action disabled={salvando || (!idEmEdicao && !autorizado)} onPress={avancarEtapa}>
                {salvando ? 'Salvando...' : etapa === 2 ? 'Salvar cadastro' : 'Avançar'}
              </Action>
              {etapa > 0 && (
                <Action
                  soft
                  disabled={salvando}
                  onPress={() => {
                    definirEtapa(etapa - 1);
                    definirErro('');
                  }}
                >
                  Voltar etapa
                </Action>
              )}
              <Action soft disabled={salvando} onPress={() => definirFormularioAberto(false)}>
                Cancelar
              </Action>
            </View>
          ) : (
            <Action icon="person-add-outline" disabled={salvando} onPress={() => abrirFormulario()}>
              Cadastrar novo idoso
            </Action>
          )}
          <Action soft disabled={salvando} onPress={() => router.push('/pessoas')}>
            Editar informações dos idosos
          </Action>
        </>
      )}
    </EstruturaAplicativo>
  );
}
