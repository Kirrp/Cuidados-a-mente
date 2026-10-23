import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { requisitarApi } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { Action, d as estilos, Input, Message } from '@/components/ui/design-system';
import { useEstilosTematicos } from '@/core/tema/contexto-tema';

type Dados = {
  contato: string;
  pessoas: {
    id: string;
    nome: string;
    consentimento: { aceitoEm?: string; revogadoEm?: string };
  }[];
  solicitacoes: {
    id: string;
    categoria: string;
    texto: string;
    status: string;
    resposta?: string;
    criadoEm: string;
  }[];
};
export function CentralPrivacidade() {
  const estilosDaTela = useEstilosTematicos(estilos);
  const { usuario } = useAutenticacao();
  const [dados, setDados] = useState<Dados>();
  const [pessoaId, setPessoaId] = useState('');
  const [categoria, setCategoria] = useState('informacao');
  const [texto, setTexto] = useState('');
  const [representacao, setRepresentacao] = useState('titular_autorizou');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const usuarioId = usuario?.id;
  const carregar = useCallback(async () => {
    if (!usuarioId) {
      return;
    }
    try {
      setDados(await requisitarApi<Dados>('/privacidade'));
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    }
  }, [usuarioId]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);
  async function executar(path: string, dados: unknown, metodo = 'POST') {
    setOcupado(true);
    setErro('');
    setAviso('');
    try {
      const res = await requisitarApi<{ id?: string; message: string }>(path, metodo, dados);
      setAviso(res.message + (res.id ? ' Protocolo: ' + res.id : ''));
      setConfirmacao('');
      setTexto('');
      await carregar();
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <Text accessibilityRole="header" style={estilosDaTela.heading}>
        Seus dados e suas escolhas
      </Text>
      <Text style={estilosDaTela.body}>
        Registre um pedido e guarde seu protocolo. A análise e a comprovação de representação são
        feitas pelo responsável pelos dados.
      </Text>
      <Text style={estilosDaTela.body}>
        Canal responsável: {dados?.contato || 'Ainda precisa ser definido pelo mantenedor.'}
      </Text>
      <Message>{erro}</Message>
      <Message success>{aviso}</Message>
      <View style={estilosDaTela.card}>
        <Text style={estilosDaTela.subheading}>Sobre quem é o pedido?</Text>
        <Action soft disabled={pessoaId === ''} onPress={() => setPessoaId('')}>
          Minha conta
        </Action>
        {dados?.pessoas.map((p) => (
          <Action
            key={p.id}
            soft
            disabled={pessoaId === p.id}
            onPress={() => {
              setPessoaId(p.id);
              setConfirmacao('');
            }}
          >
            {p.nome}
          </Action>
        ))}
        <Text style={estilosDaTela.subheading}>O que deseja solicitar?</Text>
        <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
          {['informacao', 'acesso', 'correcao', 'exclusao', 'revogacao'].map((c) => (
            <Action key={c} soft disabled={categoria === c} onPress={() => setCategoria(c)}>
              {
                (
                  {
                    informacao: 'Informações',
                    acesso: 'Acesso aos dados',
                    correcao: 'Correção',
                    exclusao: 'Exclusão',
                    revogacao: 'Revogação',
                  } as Record<string, string>
                )[c]
              }
            </Action>
          ))}
        </View>
        <Input
          label="Descreva seu pedido (sem anexar documentos aqui)"
          value={texto}
          onChangeText={setTexto}
          multiline
          maxLength={2000}
        />
        <Action
          disabled={ocupado || !texto.trim()}
          onPress={() => void executar('/privacidade/solicitacoes', { pessoaId, categoria, texto })}
        >
          Registrar pedido
        </Action>
      </View>
      {!!pessoaId && (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.subheading}>Consentimento desta pessoa</Text>
          <Text style={estilosDaTela.body}>
            {dados?.pessoas.find((p) => p.id === pessoaId)?.consentimento.revogadoEm
              ? 'Revogado'
              : dados?.pessoas.find((p) => p.id === pessoaId)?.consentimento.aceitoEm
                ? 'Declaração registrada'
                : 'Ainda não registrado individualmente'}
          </Text>
          <Text style={estilosDaTela.body}>
            A revogação bloqueia novas consultas aos dados de cuidado e apaga a última posição GPS.
            Cópias já exportadas e informações vistas por terceiros precisam de tratamento pelo
            responsável.
          </Text>
          {usuario?.tipo !== 'idoso' && (
            <>
              <Action soft onPress={() => setRepresentacao('titular_autorizou')}>
                {representacao === 'titular_autorizou'
                  ? 'Selecionado: a pessoa autorizou'
                  : 'A pessoa autorizou'}
              </Action>
              <Action soft onPress={() => setRepresentacao('representante_legal')}>
                {representacao === 'representante_legal'
                  ? 'Selecionado: representação legal válida'
                  : 'Tenho representação legal válida'}
              </Action>
            </>
          )}
          <Input
            label="Digite REVOGAR para interromper ou AUTORIZAR para registrar autorização válida"
            value={confirmacao}
            onChangeText={setConfirmacao}
            autoCapitalize="characters"
          />
          <Action
            soft
            disabled={ocupado || !['REVOGAR', 'AUTORIZAR'].includes(confirmacao)}
            onPress={() =>
              void executar(
                '/privacidade/pessoas/' + pessoaId + '/consentimento',
                {
                  autorizado: confirmacao === 'AUTORIZAR',
                  representacao: usuario?.tipo === 'idoso' ? 'titular' : representacao,
                },
                'PUT',
              )
            }
          >
            {confirmacao === 'AUTORIZAR'
              ? 'Confirmo minha autorização ou representação legal válida'
              : 'Revogar consentimento desta pessoa'}
          </Action>
        </View>
      )}
      <Text style={estilosDaTela.subheading}>Seus protocolos</Text>
      {dados?.solicitacoes.map((s) => (
        <View style={estilosDaTela.card} key={s.id}>
          <Text style={estilosDaTela.body}>
            {s.categoria} - {s.status.replaceAll('_', ' ')}
          </Text>
          <Text style={estilosDaTela.body}>{s.texto}</Text>
          {!!s.resposta && <Text style={estilosDaTela.body}>Resposta: {s.resposta}</Text>}
          <Text style={estilosDaTela.muted}>{s.id}</Text>
          <Text style={estilosDaTela.muted}>{new Date(s.criadoEm).toLocaleString('pt-BR')}</Text>
        </View>
      ))}
    </>
  );
}
