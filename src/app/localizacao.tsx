import { useCallback, useRef, useState } from 'react';
import { AppState, Switch, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Idoso, requisitarApi } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { useEstilosTematicos } from '@/core/tema/contexto-tema';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import { Action, d as estilosBase, Loading, Message } from '@/components/ui/design-system';
import { SeletorPessoa } from '@/features/cuidados/components/seletor-pessoa';
import { EstadoLocalizacao } from '@/features/cuidados/localizacao/tipos';
import { MapaLocalizacao } from '@/features/cuidados/localizacao/mapa-localizacao';

export default function Localizacao() {
  const { usuario } = useAutenticacao();
  if (usuario?.tipo === 'idoso') {
    return <Redirect href="/painel" />;
  }
  return <ConteudoLocalizacao key={usuario?.id || 'sem-sessao'} />;
}
function ConteudoLocalizacao() {
  const { usuario } = useAutenticacao();
  const estilosDaTela = useEstilosTematicos(estilosBase);
  const [pessoas, setPessoas] = useState<Idoso[]>([]);
  const [selecionada, setSelecionada] = useState('');
  const [estado, setEstado] = useState<EstadoLocalizacao | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [autorizacaoTitular, setAutorizacaoTitular] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const versao = useRef(0);
  const carregar = useCallback(async () => {
    if (!usuario) {
      setCarregando(false);
      return;
    }
    const atual = ++versao.current;
    try {
      const lista = (await requisitarApi<Idoso[]>('/idosos')).filter((p) => p.podeVerLocalizacao);
      const id = lista.find((p) => p.id === selecionada)?.id || lista[0]?.id || '';
      const dados = id ? await requisitarApi<EstadoLocalizacao>(`/idosos/${id}/localizacao`) : null;
      if (atual !== versao.current) {
        return;
      }
      setPessoas(lista);
      setSelecionada(id);
      setEstado(dados);
      setErro('');
      setAgora(Date.now());
    } catch (erroCapturado) {
      if (atual === versao.current) {
        setEstado(null);
        setPessoas([]);
        setErro((erroCapturado as Error).message);
      }
    } finally {
      if (atual === versao.current) {
        setCarregando(false);
      }
    }
  }, [usuario, selecionada]);
  useFocusEffect(
    useCallback(() => {
      setEstado(null);
      setCarregando(true);
      void carregar();
      const intervalo = setInterval(() => {
        if (AppState.currentState === 'active') {
          void carregar();
        }
      }, 15000);
      const listener = AppState.addEventListener('change', (status) => {
        if (status === 'active') {
          setEstado(null);
          void carregar();
        } else {
          versao.current++;
          setEstado(null);
        }
      });
      return () => {
        versao.current++;
        clearInterval(intervalo);
        listener.remove();
      };
    }, [carregar]),
  );
  async function alterar(caminho: string, corpo: unknown) {
    if (ocupado) {
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      await requisitarApi(`/idosos/${selecionada}/localizacao/${caminho}`, 'PUT', corpo);
      await carregar();
    } catch (erroCapturado) {
      setEstado(null);
      setErro((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  const ponto = estado?.ultimaLocalizacao || null;
  const antiga =
    !!ponto &&
    (estado?.desatualizada ||
      agora - Date.parse(ponto.atualizadaEm) >
        (estado?.limiteDesatualizacaoSegundos || 300) * 1000);
  return (
    <EstruturaAplicativo title="Localização do idoso" section="perfil" back>
      <Message>{erro}</Message>
      {carregando ? (
        <Loading />
      ) : !estado ? (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.body}>
            {erro
              ? 'A localização não está disponível nesta sessão.'
              : 'Nenhuma pessoa com acesso à localização. O responsável pode configurar os cuidadores vinculados.'}
          </Text>
          <Action soft onPress={() => void carregar()}>
            Conferir acesso novamente
          </Action>
        </View>
      ) : (
        <>
          <SeletorPessoa
            people={pessoas}
            selected={selecionada}
            onSelect={(id) => {
              versao.current++;
              setEstado(null);
              setAutorizacaoTitular(false);
              setCarregando(true);
              setSelecionada(id);
            }}
          />
          <Text style={estilosDaTela.heading}>{estado.nome}</Text>
          <MapaLocalizacao
            key={`${selecionada}:${ponto?.atualizadaEm || 'sem-posicao'}`}
            ponto={ponto}
            nome={estado.nome}
          />
          <View style={estilosDaTela.card}>
            <Text style={estilosDaTela.subheading}>Privacidade e disponibilidade</Text>
            <Text style={estilosDaTela.body}>
              Coleta:{' '}
              {estado.coletando
                ? 'ativa no dispositivo da pessoa idosa'
                : estado.servicoConectado
                  ? 'inativa'
                  : 'GPS ainda não conectado'}
              .
            </Text>
            <Text style={estilosDaTela.body}>
              Compartilhamento:{' '}
              {estado.compartilhando
                ? 'última posição disponível aos cuidadores autorizados'
                : estado.compartilhamentoHabilitado
                  ? 'habilitado, mas sem posição compartilhada disponível'
                  : 'desativado para cuidadores'}
              .
            </Text>
            <Text style={estilosDaTela.body}>Seu acesso: autorizado a visualizar esta pessoa.</Text>
            <Text style={estilosDaTela.body}>
              Última atualização:{' '}
              {ponto
                ? new Date(ponto.atualizadaEm).toLocaleString('pt-BR')
                : 'nenhuma posição recebida'}
              .
            </Text>
            {!!antiga && (
              <Message>
                A localização está desatualizada há mais de 5 minutos. Ela pode não indicar onde a
                pessoa está agora.
              </Message>
            )}
            {!!ponto && !antiga && (
              <Text style={estilosDaTela.muted}>
                Última localização conhecida; não há garantia de acompanhamento contínuo.
              </Text>
            )}
            <Action disabled={ocupado} soft onPress={() => void carregar()} icon="refresh-outline">
              Atualizar localização
            </Action>
            <Text style={estilosDaTela.muted}>
              Atualizar consulta a última informação do servidor. Não solicita GPS do seu aparelho.
              Nesta versão, o serviço de localização ainda não foi integrado.
            </Text>
          </View>
          {estado.podeGerenciar && (
            <View style={estilosDaTela.card}>
              <Text style={estilosDaTela.subheading}>Compartilhamento com cuidadores</Text>
              <Text style={estilosDaTela.body}>
                Ser responsável no aplicativo não torna você representante legal da pessoa idosa.
                Respeite a vontade dela e confirme uma autorização válida antes de compartilhar.
              </Text>
              {!estado.compartilhamentoHabilitado && (
                <View style={estilosDaTela.row}>
                  <Text style={[estilosDaTela.body, { flex: 1 }]}>
                    Confirmo a autorização da pessoa idosa ou uma representação legal válida para
                    esse compartilhamento.
                  </Text>
                  <Switch
                    accessibilityLabel="Confirmar autorização do titular"
                    value={autorizacaoTitular}
                    disabled={ocupado}
                    onValueChange={setAutorizacaoTitular}
                  />
                </View>
              )}
              <Action
                disabled={ocupado || (!estado.compartilhamentoHabilitado && !autorizacaoTitular)}
                soft
                onPress={() =>
                  void alterar('compartilhamento', {
                    habilitado: !estado.compartilhamentoHabilitado,
                    autorizacaoTitularConfirmada: autorizacaoTitular,
                  })
                }
              >
                {estado.compartilhamentoHabilitado
                  ? 'Desativar compartilhamento'
                  : 'Habilitar compartilhamento'}
              </Action>
              <Text style={estilosDaTela.muted}>
                Esta escolha configura o compartilhamento futuro. Ela não inicia coleta de GPS.
              </Text>
              <Text style={estilosDaTela.subheading}>Permitir localização ao cuidador</Text>
              {!estado.cuidadores.length && (
                <>
                  <Text style={estilosDaTela.body}>
                    Vincule uma conta de cuidador em Permissões de acesso antes de autorizar.
                  </Text>
                  <Action soft onPress={() => router.push('/permissoes')}>
                    Permissões de acesso
                  </Action>
                </>
              )}
              {estado.cuidadores.map((c) => (
                <View key={c.id} style={estilosDaTela.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={estilosDaTela.body}>{c.nome}</Text>
                    <Text style={estilosDaTela.muted}>{c.email}</Text>
                  </View>
                  <Switch
                    accessibilityLabel={'Permitir localização a ' + c.nome}
                    value={c.autorizado}
                    disabled={ocupado}
                    onValueChange={(autorizado) =>
                      void alterar('cuidadores/' + c.id, { autorizado })
                    }
                  />
                </View>
              ))}
              <Text style={estilosDaTela.muted}>
                Somente você pode conceder ou retirar esses acessos. A retirada bloqueia as próximas
                consultas ao servidor. O aplicativo confere o acesso a cada 15 segundos enquanto
                esta tela está aberta.
              </Text>
            </View>
          )}
        </>
      )}
    </EstruturaAplicativo>
  );
}
