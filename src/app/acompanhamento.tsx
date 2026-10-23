import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Idoso, requisitarApi } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { useEstilosTematicos } from '@/core/tema/contexto-tema';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import {
  Action,
  Choice,
  d as estilos,
  Input,
  Loading,
  Message,
} from '@/components/ui/design-system';
import { SeletorPessoa } from '@/features/cuidados/components/seletor-pessoa';
import {
  DadosRelatorio,
  gerarHtmlRelatorio,
} from '@/features/cuidados/relatorios/relatorio-cuidados';
import { obterDataAtual } from '@/features/cuidados/hooks/use-cuidados';

type Linha = Record<string, string | number>;
const areas = {
  diario: 'Diário',
  historico: 'Histórico',
  contatos: 'Contatos',
  planos: 'Doses recorrentes',
  gestao: 'Administração',
  exportacao: 'Exportar',
};
type Area = keyof typeof areas;

export default function Acompanhamento() {
  const params = useLocalSearchParams<{ idosoId?: string; area?: Area; tipo?: string }>();
  const { usuario } = useAutenticacao();
  const estilosDaTela = useEstilosTematicos(estilos);
  const [pessoas, setPessoas] = useState<Idoso[]>([]);
  const [pessoaId, setPessoaId] = useState(params.idosoId || '');
  const [area, setArea] = useState<Area>(
    params.area && params.area in areas ? params.area : 'diario',
  );
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState('observacao');
  const [titulo, setTitulo] = useState('');
  const [inicio, setInicio] = useState(obterDataAtual());
  const [fim, setFim] = useState(obterDataAtual());
  const [horarios, setHorarios] = useState('08:00');
  const [intervalo, setIntervalo] = useState('1');
  const [rascunhoContato, setRascunhoContato] = useState<{
    pessoaId: string;
    dados: { nome: string; telefone: string; nomeAlternativo: string; telefoneAlternativo: string };
  }>();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [validade, setValidade] = useState('');
  const [tipoHistorico, setTipoHistorico] = useState(params.tipo || 'rotinas');
  const leitura = useRef(0);
  const pessoa = pessoas.find((p) => p.id === pessoaId);
  const pode = (acao: string) => pessoa?.permissoes?.includes(acao);
  useEffect(() => {
    if (!usuario?.id) {
      return;
    }
    let ativo = true;
    void requisitarApi<Idoso[]>('/idosos')
      .then((items) => {
        if (!ativo) {
          return;
        }
        setPessoas(items);
        setPessoaId((atual) => (items.some((p) => p.id === atual) ? atual : items[0]?.id || ''));
      })
      .catch((erroCapturado) => {
        if (ativo) {
          setErro(erroCapturado.message);
        }
      });
    return () => {
      ativo = false;
    };
  }, [usuario?.id]);
  const contato =
    rascunhoContato?.pessoaId === pessoaId
      ? rascunhoContato.dados
      : {
          nome: pessoa?.contatoEmergencia?.nome || '',
          telefone: pessoa?.contatoEmergencia?.telefone || '',
          nomeAlternativo: pessoa?.contatoEmergencia?.nomeAlternativo || '',
          telefoneAlternativo: pessoa?.contatoEmergencia?.telefoneAlternativo || '',
        };
  const setContato = (alterar: (anterior: typeof contato) => typeof contato) =>
    setRascunhoContato({ pessoaId, dados: alterar(contato) });
  const carregar = useCallback(async () => {
    const numero = ++leitura.current;
    setLinhas([]);
    if (!pessoaId) {
      setOcupado(false);
      return;
    }
    const endpoint =
      area === 'diario'
        ? 'diario'
        : area === 'historico'
          ? 'historico?tipo=' + encodeURIComponent(tipoHistorico)
          : area === 'planos'
            ? 'planos'
            : '';
    if (!endpoint) {
      setOcupado(false);
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      const dados = await requisitarApi<Linha[]>('/idosos/' + pessoaId + '/' + endpoint);
      if (numero === leitura.current) {
        setLinhas(dados);
      }
    } catch (erroCapturado) {
      if (numero === leitura.current) {
        setLinhas([]);
        setErro((erroCapturado as Error).message);
      }
    } finally {
      if (numero === leitura.current) {
        setOcupado(false);
      }
    }
  }, [area, pessoaId, tipoHistorico]);
  useEffect(() => {
    const controle = leitura;
    void Promise.resolve().then(carregar);
    return () => {
      controle.current++;
    };
  }, [carregar]);
  async function executar(endpoint: string, dados?: unknown, metodo = 'POST') {
    if (ocupado) {
      return;
    }
    setOcupado(true);
    setErro('');
    setAviso('');
    try {
      const result = await requisitarApi<{ message?: string; doses?: number }>(
        '/idosos/' + pessoaId + '/' + endpoint,
        metodo,
        dados,
      );
      setAviso(
        result?.message ||
          (result?.doses ? result.doses + ' doses programadas.' : 'Alteração salva.'),
      );
      setSenha('');
      setTexto('');
      await carregar();
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function exportar() {
    setOcupado(true);
    setErro('');
    try {
      const data = await requisitarApi<DadosRelatorio>(
        '/idosos/' +
          pessoaId +
          '/exportacao?inicio=' +
          encodeURIComponent(inicio) +
          '&fim=' +
          encodeURIComponent(fim),
      );
      const html = gerarHtmlRelatorio(data, inicio, fim);
      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'registros-cuidados.html';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const arquivo = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/pdf', UTI: '.pdf' });
        } else {
          await Print.printAsync({ uri: arquivo.uri });
        }
      }
      setAviso('Relatório gerado. Confira os destinatários antes de compartilhar.');
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  function podeMostrarArea(areaCandidata: Area) {
    switch (areaCandidata) {
      case 'gestao':
        return usuario?.tipo !== 'idoso';
      case 'exportacao':
        return pode('ver_relatorios');
      case 'planos':
        return pode('ver_medicamentos');
      case 'contatos':
        return pode('ver_contato_emergencia');
      case 'diario':
        return usuario?.tipo !== 'idoso' && pode('ver_rotinas');
      default:
        return true;
    }
  }
  const visiveis = (Object.keys(areas) as Area[]).filter(podeMostrarArea);
  return (
    <EstruturaAplicativo title="Acompanhamento" section="perfil" back>
      <SeletorPessoa people={pessoas} selected={pessoaId} onSelect={setPessoaId} />
      <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
        {visiveis.map((a) => (
          <Choice
            key={a}
            selected={a === area}
            onPress={() => {
              setArea(a);
              setAviso('');
            }}
          >
            {areas[a]}
          </Choice>
        ))}
      </View>
      <Message>{erro}</Message>
      <Message success>{aviso}</Message>
      {ocupado && <Loading />}
      {!pessoaId && (
        <Text style={estilosDaTela.body}>Cadastre ou selecione uma pessoa acompanhada.</Text>
      )}
      {pessoaId && area === 'diario' && (
        <>
          <Text style={estilosDaTela.heading}>Continuidade do cuidado</Text>
          <Text style={estilosDaTela.body}>
            Registre observações e informações para o próximo turno. Corrija uma anotação
            acrescentando outra, para preservar a autoria.
          </Text>
          {pode('criar_rotinas') && (
            <View style={estilosDaTela.card}>
              <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
                {[
                  ['observacao', 'Observação'],
                  ['passagem_turno', 'Passagem de turno'],
                  ['correcao', 'Correção'],
                ].map(([key, label]) => (
                  <Choice
                    key={key}
                    selected={categoria === key}
                    disabled={ocupado}
                    onPress={() => setCategoria(key)}
                  >
                    {label}
                  </Choice>
                ))}
              </View>
              <Input
                label="Informações do cuidado"
                value={texto}
                onChangeText={setTexto}
                multiline
                maxLength={4000}
              />
              <Action
                disabled={ocupado || !texto.trim()}
                onPress={() => void executar('diario', { texto, categoria })}
              >
                Registrar anotação
              </Action>
            </View>
          )}
          {linhas.map((l) => (
            <View key={l.id} style={estilosDaTela.card}>
              <Text style={estilosDaTela.subheading}>
                {l.categoria === 'passagem_turno'
                  ? 'Passagem de turno'
                  : l.categoria === 'correcao'
                    ? 'Correção'
                    : 'Observação'}
              </Text>
              <Text style={estilosDaTela.body}>{l.texto}</Text>
              <Text style={estilosDaTela.muted}>
                {l.autor} - {new Date(String(l.instante)).toLocaleString('pt-BR')}
              </Text>
            </View>
          ))}
        </>
      )}
      {pessoaId && area === 'historico' && (
        <>
          <Text style={estilosDaTela.heading}>Quem fez e quando</Text>
          <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
            {[
              'rotinas',
              'medicamentos',
              'consultas',
              'memorias',
              ...(pessoa?.dono ? ['acesso'] : []),
            ].map((t) => (
              <Choice
                key={t}
                selected={tipoHistorico === t}
                disabled={ocupado}
                onPress={() => setTipoHistorico(t)}
              >
                {
                  (
                    {
                      rotinas: 'Rotinas',
                      medicamentos: 'Medicamentos',
                      consultas: 'Consultas',
                      memorias: 'Memórias',
                      acesso: 'Acessos',
                    } as Record<string, string>
                  )[t]
                }
              </Choice>
            ))}
          </View>
          {linhas.map((l) => (
            <View key={l.id} style={estilosDaTela.card}>
              <Text style={estilosDaTela.subheading}>{String(l.acao).replaceAll('_', ' ')}</Text>
              <Text style={estilosDaTela.body}>
                {l.autor} - {new Date(String(l.instante)).toLocaleString('pt-BR')}
              </Text>
              <Alteracao titulo="Antes" json={String(l.antes)} />
              <Alteracao titulo="Depois" json={String(l.depois)} />
            </View>
          ))}
          {!ocupado && !linhas.length && (
            <Text style={estilosDaTela.body}>
              Nenhuma alteração registrada nesta área. Registros antigos não têm autoria
              reconstruída.
            </Text>
          )}
        </>
      )}
      {pessoaId && area === 'contatos' && (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.heading}>Contatos desta pessoa</Text>
          {(['nome', 'telefone', 'nomeAlternativo', 'telefoneAlternativo'] as const).map(
            (key, i) => (
              <Input
                key={key}
                label={
                  [
                    'Nome principal',
                    'Telefone principal',
                    'Nome alternativo (opcional)',
                    'Telefone alternativo (opcional)',
                  ][i]
                }
                value={contato[key]}
                editable={!!pode('editar_perfil_idoso')}
                onChangeText={(v) => setContato((c) => ({ ...c, [key]: v }))}
              />
            ),
          )}
          {pode('editar_perfil_idoso') && (
            <Action disabled={ocupado} onPress={() => void executar('contatos', contato, 'PUT')}>
              Salvar contatos
            </Action>
          )}
        </View>
      )}
      {pessoaId && area === 'planos' && (
        <>
          <Text style={estilosDaTela.heading}>Doses recorrentes</Text>
          <Text style={estilosDaTela.body}>
            Copie apenas o plano já orientado pela equipe de cuidado. Cada dose terá seu próprio
            estado; lembretes nunca concluem uma dose.
          </Text>
          {pode('criar_medicamentos') && usuario?.tipo !== 'idoso' && (
            <View style={estilosDaTela.card}>
              <Input
                label="Medicamento e dose já orientados"
                value={titulo}
                onChangeText={setTitulo}
              />
              <Input label="Início (AAAA-MM-DD)" value={inicio} onChangeText={setInicio} />
              <Input label="Fim (AAAA-MM-DD)" value={fim} onChangeText={setFim} />
              <Input
                label="Horários separados por vírgula (HH:MM)"
                value={horarios}
                onChangeText={setHorarios}
              />
              <Input
                label="Repetir a cada quantos dias"
                value={intervalo}
                onChangeText={setIntervalo}
                keyboardType="number-pad"
              />
              <Text style={estilosDaTela.muted}>
                Fuso do aparelho: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </Text>
              <Action
                disabled={ocupado || !titulo.trim()}
                onPress={() =>
                  void executar('planos', {
                    titulo,
                    inicio,
                    fim,
                    horarios: horarios.split(',').map((h) => h.trim()),
                    intervaloDias: Number(intervalo),
                    fuso: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  })
                }
              >
                Programar doses
              </Action>
            </View>
          )}
          {linhas.map((l) => (
            <View key={l.id} style={estilosDaTela.card}>
              <Text style={estilosDaTela.subheading}>{l.titulo}</Text>
              <Text style={estilosDaTela.body}>
                {l.inicio} até {l.fim}, a cada {l.intervaloDias} dia(s)
              </Text>
              <Text style={estilosDaTela.body}>
                {JSON.parse(String(l.horarios)).join(', ')} - {l.fuso}
              </Text>
              <Text style={estilosDaTela.muted}>{l.ativo ? 'Ativo' : 'Cancelado'}</Text>
              {!!l.ativo && pode('excluir_medicamentos') && (
                <Action
                  soft
                  disabled={ocupado}
                  onPress={() => void executar('planos/' + l.id + '/cancelar')}
                >
                  Cancelar somente as doses futuras pendentes
                </Action>
              )}
            </View>
          ))}
        </>
      )}
      {pessoaId && area === 'exportacao' && (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.heading}>Exportar registros</Text>
          <Text style={estilosDaTela.body}>
            O relatório inclui apenas as áreas autorizadas, sem documentos, endereço, fotos ou GPS.
          </Text>
          <Input label="Início (AAAA-MM-DD)" value={inicio} onChangeText={setInicio} />
          <Input label="Fim (AAAA-MM-DD)" value={fim} onChangeText={setFim} />
          <Action disabled={ocupado} onPress={() => void exportar()}>
            {Platform.OS === 'web' ? 'Baixar relatório para impressão' : 'Gerar e compartilhar PDF'}
          </Action>
        </View>
      )}
      {pessoaId && area === 'gestao' && (
        <>
          {pessoa?.dono ? (
            <>
              <View style={estilosDaTela.card}>
                <Text style={estilosDaTela.heading}>Transferir administração</Text>
                <Text style={estilosDaTela.body}>
                  O novo responsável precisa confirmar em até 24 horas. Ao aceitar, o administrador
                  anterior perde acesso; vínculos e QR precisam de nova autorização.
                </Text>
                <Input
                  label="E-mail do novo responsável"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
                <Input
                  label="Sua senha para confirmar"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                />
                <Action
                  disabled={ocupado || !email || !senha}
                  onPress={() => void executar('transferencia', { email, senha })}
                >
                  Solicitar transferência
                </Action>
              </View>
              <Revisao pessoaId={pessoaId} validade={validade} setValidade={setValidade} />
            </>
          ) : (
            usuario?.tipo === 'cuidador' && (
              <View style={estilosDaTela.card}>
                <Text style={estilosDaTela.heading}>Encerrar meu vínculo</Text>
                <Text style={estilosDaTela.body}>
                  Ao confirmar, você perde acesso aos dados desta pessoa.
                </Text>
                <Action
                  soft
                  disabled={ocupado}
                  onPress={() => void executar('meu-vinculo', undefined, 'DELETE')}
                >
                  Retirar meu acesso
                </Action>
              </View>
            )
          )}
        </>
      )}
    </EstruturaAplicativo>
  );
}
function Alteracao({ titulo, json }: { titulo: string; json: string }) {
  const estilosDaTela = useEstilosTematicos(estilos);
  let dados: Record<string, unknown> = {};
  try {
    dados = JSON.parse(json);
  } catch {}
  return Object.keys(dados).length ? (
    <View>
      <Text style={estilosDaTela.subheading}>{titulo}</Text>
      {Object.entries(dados)
        .filter(([k]) => !['id', 'idosoId', 'planoId', 'tipo', 'categoria', 'versao'].includes(k))
        .map(([k, v]) => (
          <Text key={k} style={estilosDaTela.body}>
            {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
          </Text>
        ))}
    </View>
  ) : null;
}
function Revisao({
  pessoaId,
  validade,
  setValidade,
}: {
  pessoaId: string;
  validade: string;
  setValidade: (s: string) => void;
}) {
  const estilosDaTela = useEstilosTematicos(estilos);
  const [cuidadores, setCuidadores] = useState<Linha[]>([]);
  const [erro, setErro] = useState('');
  const carregar = useCallback(async () => {
    try {
      const dados = await requisitarApi<{ cuidadores: Linha[] }>('/idosos/' + pessoaId + '/acesso');
      setCuidadores(dados.cuidadores);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message);
    }
  }, [pessoaId]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);
  return (
    <View style={estilosDaTela.card}>
      <Text style={estilosDaTela.heading}>Revisar acessos</Text>
      <Text style={estilosDaTela.body}>
        Convites aceitos valem 90 dias. Revise quem continua no cuidado e renove o prazo quando
        necessário.
      </Text>
      <Input
        label="Nova validade (AAAA-MM-DD, até um ano)"
        value={validade}
        onChangeText={setValidade}
      />
      <Message>{erro}</Message>
      {cuidadores.map((c) => (
        <View key={c.id}>
          <Text style={estilosDaTela.body}>
            {c.nome} - validade: {c.validade || 'Vínculo antigo sem prazo'}
          </Text>
          <Text style={estilosDaTela.muted}>
            Última revisão:{' '}
            {c.revisadoEm ? new Date(String(c.revisadoEm)).toLocaleDateString('pt-BR') : 'Pendente'}
          </Text>
          <Action
            soft
            onPress={() => {
              void requisitarApi(
                '/idosos/' + pessoaId + '/cuidadores/' + c.id + '/revisao',
                'PUT',
                { validade },
              )
                .then(carregar)
                .catch((erroCapturado) => setErro(erroCapturado.message));
            }}
          >
            Confirmar revisão e validade
          </Action>
        </View>
      ))}
    </View>
  );
}
