import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { useCallback, useRef, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { Idoso, requisitarApi } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import { Action, colors, d as dBase, Input, Loading, Message } from '@/components/ui/design-system';

type Cuidador = { id: string; nome: string; email: string; permissoes: string[] };
type Acesso = {
  catalogo: string[];
  minhasPermissoes: string[];
  permissoesIdoso: string[];
  cuidadores: Cuidador[];
  dono: boolean;
};
const grupos = [
  { titulo: 'Rotina', chave: 'rotinas' },
  { titulo: 'Remédios', chave: 'medicamentos' },
  { titulo: 'Consultas', chave: 'consultas' },
  { titulo: 'Banco de memórias', chave: 'memorias' },
];
const acoes: Record<string, string> = {
  ver: 'Ver',
  criar: 'Adicionar',
  editar: 'Alterar',
  concluir: 'Concluir ou reabrir',
  excluir: 'Excluir',
};
const outras: Record<string, string> = {
  ver_perfil_idoso: 'Ver dados pessoais do idoso',
  editar_perfil_idoso: 'Alterar cadastro do idoso',
  editar_perfil_proprio: 'Idoso pode alterar o próprio perfil',
  ver_contato_emergencia: 'Ver contato de emergência',
  ver_relatorios: 'Ver relatórios',
  usar_atividade_dia: 'Usar atividade do dia',
  gerar_qr: 'Gerar QR Code de acesso',
  revogar_qr: 'Desconectar acesso por QR Code',
  gerenciar_permissoes_idoso: 'Configurar permissões do idoso',
};
function nomePermissao(chave: string) {
  const prefixo = Object.keys(acoes).find((acao) => chave.startsWith(acao + '_'));
  return prefixo ? `${acoes[prefixo]} ${chave.slice(prefixo.length + 1)}` : outras[chave] || chave;
}

export default function Permissoes() {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const { usuario } = useAutenticacao();
  const [pessoas, setPessoas] = useState<Idoso[]>([]);
  const [pessoaId, setPessoaId] = useState('');
  const [estadoAcesso, setEstadoAcesso] = useState<{ pessoaId: string; dados: Acesso } | null>(
    null,
  );
  const [alvo, setAlvo] = useState('idoso');
  const acesso = estadoAcesso?.pessoaId === pessoaId ? estadoAcesso.dados : null;
  const leitura = useRef(0);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const carregarAcesso = useCallback(
    async (id: string, novoAlvo = 'idoso', numero = ++leitura.current) => {
      const result = await requisitarApi<Acesso>(`/idosos/${id}/acesso`);
      if (numero !== leitura.current) {
        return;
      }
      setEstadoAcesso({ pessoaId: id, dados: result });
      setAlvo(novoAlvo);
      setSelecionadas(
        novoAlvo === 'idoso'
          ? result.permissoesIdoso
          : result.cuidadores.find((c) => c.id === novoAlvo)?.permissoes || [],
      );
    },
    [],
  );
  const carregar = useCallback(async () => {
    if (!usuario) {
      return;
    }
    const numero = ++leitura.current;
    setCarregando(true);
    setErro('');
    setEstadoAcesso(null);
    setSelecionadas([]);
    try {
      const lista = await requisitarApi<Idoso[]>('/idosos');
      if (numero !== leitura.current) {
        return;
      }
      setPessoas(lista);
      const id = lista.find((p) => p.id === pessoaId)?.id || lista[0]?.id || '';
      setPessoaId(id);
      if (id) {
        await carregarAcesso(id, 'idoso', numero);
      }
    } catch (erroCapturado) {
      if (numero === leitura.current) {
        setErro((erroCapturado as Error).message);
      }
    } finally {
      if (numero === leitura.current) {
        setCarregando(false);
      }
    }
  }, [usuario, pessoaId, carregarAcesso]);
  useFocusEffect(
    useCallback(() => {
      void carregar();
      return () => {
        leitura.current++;
      };
    }, [carregar]),
  );
  async function executar(acao: () => Promise<void>, mensagem: string) {
    if (ocupado) {
      return;
    }
    setOcupado(true);
    setErro('');
    setAviso('');
    try {
      await acao();
      setAviso(mensagem);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  function mudarPessoa(id: string) {
    if (ocupado || id === pessoaId) {
      return;
    }
    setPessoaId(id);
    setErro('');
    setAviso('');
  }
  function mudarAlvo(id: string) {
    if (ocupado) {
      return;
    }
    setAlvo(id);
    setSelecionadas(
      id === 'idoso'
        ? acesso?.permissoesIdoso || []
        : acesso?.cuidadores.find((c) => c.id === id)?.permissoes || [],
    );
    setAviso('');
  }
  const podeEditarIdoso =
    !!acesso && (acesso.dono || acesso.minhasPermissoes.includes('gerenciar_permissoes_idoso'));
  const editavel = !!acesso && (alvo === 'idoso' ? podeEditarIdoso : acesso.dono);
  const catalogo = (acesso?.catalogo || []).filter((chave) =>
    alvo === 'idoso'
      ? ![
          'editar_perfil_idoso',
          'gerar_qr',
          'revogar_qr',
          'gerenciar_permissoes_idoso',
          'ver_relatorios',
        ].includes(chave)
      : chave !== 'editar_perfil_proprio',
  );
  const gruposVisiveis = grupos.map((grupo) => ({
    ...grupo,
    chaves: catalogo.filter((chave) => chave.endsWith('_' + grupo.chave)),
  }));
  const extras = catalogo.filter(
    (chave) => !grupos.some((grupo) => chave.endsWith('_' + grupo.chave)),
  );
  if (usuario?.tipo === 'idoso') {
    return <Redirect href="/painel" />;
  }
  return (
    <EstruturaAplicativo title="Permissões" section="perfil" back>
      <Text style={estilosDaTela.heading}>Controle de acesso</Text>
      <Text style={estilosDaTela.body}>
        Escolha a pessoa acompanhada e defina exatamente o que cada perfil pode fazer. O responsável
        mantém o controle dos cuidadores. Um cuidador delegado pode ajustar somente as permissões do
        idoso.
      </Text>
      <Message>{erro}</Message>
      <Message success>{aviso}</Message>
      {!!erro && (
        <Action soft disabled={carregando || ocupado} onPress={carregar}>
          Tentar novamente
        </Action>
      )}
      {carregando ? (
        <Loading />
      ) : !pessoas.length ? (
        <Text style={estilosDaTela.body}>
          Cadastre uma pessoa acompanhada para configurar seus acessos.
        </Text>
      ) : (
        <>
          <Text style={estilosDaTela.subheading}>Pessoa acompanhada</Text>
          <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
            {pessoas.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                onPress={() => void mudarPessoa(p.id)}
                style={{
                  padding: 11,
                  borderRadius: 10,
                  backgroundColor: cor(p.id === pessoaId ? colors.lavender : colors.pale, 'fundo'),
                }}
              >
                <Text style={estilosDaTela.body}>{p.nome}</Text>
              </Pressable>
            ))}
          </View>
          {acesso && (
            <>
              <Text style={estilosDaTela.subheading}>Configurar acesso de</Text>
              <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => mudarAlvo('idoso')}
                  style={{
                    padding: 11,
                    borderRadius: 10,
                    backgroundColor: cor(alvo === 'idoso' ? colors.lavender : colors.pale, 'fundo'),
                  }}
                >
                  <Text style={estilosDaTela.body}>Idoso</Text>
                </Pressable>
                {acesso.dono &&
                  acesso.cuidadores.map((c) => (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      onPress={() => mudarAlvo(c.id)}
                      style={{
                        padding: 11,
                        borderRadius: 10,
                        backgroundColor: cor(
                          alvo === c.id ? colors.lavender : colors.pale,
                          'fundo',
                        ),
                      }}
                    >
                      <Text style={estilosDaTela.body}>{c.nome}</Text>
                    </Pressable>
                  ))}
              </View>
              {acesso.dono && usuario?.tipo === 'responsavel' && (
                <View style={estilosDaTela.card}>
                  <Text style={estilosDaTela.subheading}>Adicionar cuidador</Text>
                  <Text style={estilosDaTela.muted}>
                    O cuidador precisa ter uma conta cadastrada. O cuidador precisa confirmar o
                    convite. O vínculo vale somente para esta pessoa acompanhada.
                  </Text>
                  <Input
                    label="E-mail do cuidador"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <Action
                    disabled={ocupado || !email.trim()}
                    onPress={() =>
                      void executar(async () => {
                        await requisitarApi(`/idosos/${pessoaId}/cuidadores`, 'POST', {
                          email: email.trim(),
                        });
                        setEmail('');
                        await carregarAcesso(pessoaId);
                      }, 'Convite enviado. O acesso começa após a confirmação.')
                    }
                  >
                    Enviar convite
                  </Action>
                </View>
              )}
              {alvo !== 'idoso' && acesso.dono && (
                <Action
                  soft
                  disabled={ocupado}
                  onPress={() =>
                    void executar(async () => {
                      await requisitarApi(`/idosos/${pessoaId}/cuidadores/${alvo}`, 'DELETE');
                      await carregarAcesso(pessoaId);
                    }, 'Cuidador removido.')
                  }
                >
                  Remover vínculo deste cuidador
                </Action>
              )}
              {!editavel && (
                <Text style={estilosDaTela.muted}>
                  Seu acesso permite consultar estas opções, mas somente o responsável pode
                  alterá-las.
                </Text>
              )}
              {gruposVisiveis.map((grupo) => (
                <View key={grupo.chave} style={estilosDaTela.card}>
                  <Text style={estilosDaTela.subheading}>{grupo.titulo}</Text>
                  {grupo.chaves.map((chave) => (
                    <Linha
                      key={chave}
                      nome={nomePermissao(chave)}
                      valor={selecionadas.includes(chave)}
                      inativo={
                        !editavel ||
                        ocupado ||
                        (alvo === 'idoso' &&
                          !acesso.dono &&
                          !acesso.minhasPermissoes.includes(chave) &&
                          !selecionadas.includes(chave))
                      }
                      alterar={() =>
                        setSelecionadas((prev) =>
                          prev.includes(chave) ? prev.filter((p) => p !== chave) : [...prev, chave],
                        )
                      }
                    />
                  ))}
                </View>
              ))}
              <View style={estilosDaTela.card}>
                <Text style={estilosDaTela.subheading}>Outros acessos</Text>
                {extras.map((chave) => (
                  <Linha
                    key={chave}
                    nome={outras[chave] || chave}
                    valor={selecionadas.includes(chave)}
                    inativo={
                      !editavel ||
                      ocupado ||
                      (alvo === 'idoso' &&
                        !acesso.dono &&
                        !acesso.minhasPermissoes.includes(chave) &&
                        !selecionadas.includes(chave))
                    }
                    alterar={() =>
                      setSelecionadas((prev) =>
                        prev.includes(chave) ? prev.filter((p) => p !== chave) : [...prev, chave],
                      )
                    }
                  />
                ))}
              </View>
              {editavel && (
                <Action
                  disabled={ocupado}
                  onPress={() =>
                    void executar(async () => {
                      const path =
                        alvo === 'idoso'
                          ? `/idosos/${pessoaId}/permissoes-idoso`
                          : `/idosos/${pessoaId}/cuidadores/${alvo}/permissoes`;
                      await requisitarApi(path, 'PUT', { permissoes: selecionadas });
                      await carregarAcesso(pessoaId, alvo);
                    }, 'Permissões salvas.')
                  }
                >
                  {ocupado ? 'Salvando...' : 'Salvar permissões'}
                </Action>
              )}
            </>
          )}
        </>
      )}
    </EstruturaAplicativo>
  );
}
function Linha({
  nome,
  valor,
  inativo,
  alterar,
}: {
  nome: string;
  valor: boolean;
  inativo: boolean;
  alterar: () => void;
}) {
  const estilosDaTela = useEstilosTematicos(dBase);

  return (
    <View style={[estilosDaTela.row, { minHeight: 46, justifyContent: 'space-between' }]}>
      <Text style={[estilosDaTela.body, { flex: 1 }]}>{nome}</Text>
      <Switch accessibilityLabel={nome} value={valor} disabled={inativo} onValueChange={alterar} />
    </View>
  );
}
