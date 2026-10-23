import { abrirArquivoPrivado, escolherEnviarArquivo } from '@/core/midia/arquivos';
import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Registro, requisitarApi, TipoRegistro } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import {
  estaAtrasado,
  formatarData,
  obterDataAtual,
  useCuidados,
} from '@/features/cuidados/hooks/use-cuidados';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import {
  Action,
  Choice,
  art,
  colors,
  d as dBase,
  Empty,
  Icon,
  Input,
  Loading,
  Message,
} from '@/components/ui/design-system';
import { correspondePesquisa } from '@/shared/pesquisa';
import { SeletorPessoa } from './seletor-pessoa';

// Textos e ícones variáveis permitem que este componente atenda quatro tipos
// de registro sem duplicar toda a lógica de listagem e formulário.
const titulos = {
  consultas: 'Consultas',
  medicamentos: 'Medicamentos',
  rotinas: 'Rotina',
  memorias: 'Banco de Memórias',
};
const nomeRegistro = {
  consultas: 'consulta',
  medicamentos: 'medicamento',
  rotinas: 'atividade',
  memorias: 'memória',
};
const icon = {
  consultas: 'location-outline',
  medicamentos: 'medkit-outline',
  rotinas: 'calendar-outline',
  memorias: 'images-outline',
} as const;
const novoRascunho = () => ({
  titulo: '',
  data: formatarData(obterDataAtual()),
  horario: '',
  detalhes: '',
  categoria: 'Histórias',
  midia: '',
});

/**
 * Entrada pública da tela. Lê filtros opcionais da URL e entrega ao conteúdo
 * os dados carregados pelo hook. A `key` reinicia filtros locais quando o tipo,
 * filtro inicial ou pessoa selecionada realmente muda.
 */
export function TelaRegistros({ tipo }: { tipo: TipoRegistro }) {
  const params = useLocalSearchParams<{ idosoId?: string; filtro?: string }>();
  const cuidados = useCuidados(tipo, params.idosoId);
  return (
    <ConteudoRegistros
      key={`${tipo}:${params.filtro || ''}:${cuidados.pessoaId}`}
      tipo={tipo}
      filtroInicial={params.filtro}
      cuidados={cuidados}
    />
  );
}

function ConteudoRegistros({
  tipo,
  filtroInicial,
  cuidados,
}: {
  tipo: TipoRegistro;
  filtroInicial?: string;
  cuidados: ReturnType<typeof useCuidados>;
}) {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const { usuario } = useAutenticacao();
  const [filtro, definirFiltro] = useState(
    filtroInicial || (tipo === 'memorias' ? 'Todos' : 'Hoje'),
  );
  const [categoria, definirCategoria] = useState('Todos');
  const [pasta, definirPasta] = useState('');
  const [dia, definirDia] = useState(obterDataAtual());
  const [busca, definirBusca] = useState('');
  const [formularioAberto, definirFormularioAberto] = useState(false);
  const [registroEmEdicao, definirRegistroEmEdicao] = useState<Registro | null>(null);
  const [rascunho, definirRascunho] = useState(novoRascunho);
  const [salvando, definirSalvando] = useState(false);
  const [aviso, definirAviso] = useState('');
  const usuarioIdoso = usuario?.tipo === 'idoso';
  const pode = (acao: string) =>
    !cuidados.pessoa?.permissoes || cuidados.pessoa.permissoes.includes(acao + '_' + tipo);

  // Abre o mesmo formulário em dois modos: novo registro ou edição. Na edição,
  // o objeto da API é convertido para o formato apresentado nos campos.
  function abrirFormulario(record?: Registro) {
    definirRegistroEmEdicao(record || null);
    definirRascunho(
      record
        ? {
            titulo: record.titulo,
            data: formatarData(record.data),
            horario: record.horario,
            detalhes: record.detalhes,
            categoria: record.categoria || 'Histórias',
            midia: record.midia || '',
          }
        : { ...novoRascunho(), data: formatarData(dia) },
    );
    cuidados.definirErro('');
    definirAviso('');
    definirFormularioAberto(true);
  }

  // Fotos são reduzidas pelo seletor e enviadas como data URL. O limite local
  // evita montar uma requisição maior que o backend aceita.
  async function escolherFoto() {
    if (salvando) {
      return;
    }
    definirSalvando(true);
    try {
      const arquivo = await escolherEnviarArquivo(cuidados.pessoaId, rascunho.categoria);
      if (arquivo) {
        definirRascunho((p) => ({ ...p, midia: arquivo.midia, titulo: p.titulo || arquivo.nome }));
      }
    } catch (erroCapturado) {
      cuidados.definirErro((erroCapturado as Error).message);
    } finally {
      definirSalvando(false);
    }
  }
  async function abrirMidia(uri: string) {
    if (uri.startsWith('media:')) {
      try {
        await abrirArquivoPrivado(uri);
      } catch (erroCapturado) {
        cuidados.definirErro((erroCapturado as Error).message);
      }
      return;
    }
    if (!/^https?:\/\//i.test(uri)) {
      return;
    }
    try {
      await Linking.openURL(uri);
    } catch {
      cuidados.definirErro('Não foi possível abrir este link.');
    }
  }
  async function salvarRegistro() {
    if (salvando) {
      return;
    }
    definirSalvando(true);
    cuidados.definirErro('');
    try {
      // O endpoint e o método dependem da presença de `registroEmEdicao`. A interface usa
      // DD/MM/AAAA, enquanto a API recebe AAAA-MM-DD para ordenar corretamente.
      await requisitarApi(
        registroEmEdicao ? '/registros/' + registroEmEdicao.id : '/registros',
        registroEmEdicao ? 'PUT' : 'POST',
        {
          ...rascunho,
          ...(registroEmEdicao ? { versao: registroEmEdicao.versao } : {}),
          idosoId: cuidados.pessoaId,
          tipo,
          data: rascunho.data.trim().split('/').reverse().join('-'),
          status: registroEmEdicao?.status || 'pendente',
        },
      );
      definirFormularioAberto(false);
      definirAviso('Registro salvo.');
      await cuidados.carregar();
    } catch (erroCapturado) {
      cuidados.definirErro((erroCapturado as Error).message);
    } finally {
      definirSalvando(false);
    }
  }
  async function alternarConclusao(item: Registro) {
    if (salvando) {
      return;
    }
    definirSalvando(true);
    cuidados.definirErro('');
    // Atualiza somente o item alterado no estado; não é necessário baixar toda
    // a lista novamente para uma simples troca de status.
    try {
      const result = await requisitarApi<Registro>('/registros/' + item?.id, 'PUT', {
        ...item,
        status: item.status === 'concluido' ? 'pendente' : 'concluido',
      });
      cuidados.definirRegistros((items) => items.map((i) => (i.id === item.id ? result : i)));
    } catch (erroCapturado) {
      cuidados.definirErro((erroCapturado as Error).message);
    } finally {
      definirSalvando(false);
    }
  }
  async function remove(item: Registro) {
    definirSalvando(true);
    cuidados.definirErro('');
    try {
      await requisitarApi('/registros/' + item.id, 'DELETE', { versao: item.versao });
      cuidados.definirRegistros((items) => items.filter((i) => i.id !== item.id));
      definirAviso('Registro excluído.');
    } catch (erroCapturado) {
      cuidados.definirErro((erroCapturado as Error).message);
    } finally {
      definirSalvando(false);
    }
  }
  function confirmarExclusao(item: Registro) {
    if (salvando) {
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir "' + item.titulo + '"?')) {
        void remove(item);
      }
    } else {
      Alert.alert('Excluir registro?', item.titulo, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => void remove(item) },
      ]);
    }
  }

  // A pesquisa complementa os filtros existentes, sem trocar o período,
  // categoria ou pasta. O campo aparece apenas quando a lista justifica a busca.
  const mostrarPesquisa = cuidados.registros.length >= (tipo === 'memorias' ? 5 : 2) || !!busca;
  const pesquisaAtiva = !!busca.trim();
  const visible = cuidados.registros.filter(
    (i) =>
      (tipo !== 'memorias' ||
        ((categoria === 'Todos' || (i.categoria || 'Histórias') === categoria) &&
          (!pasta || i.data.startsWith(pasta)))) &&
      (filtro === 'Hoje'
        ? i.data === dia
        : filtro === 'Próximos'
          ? i.data > obterDataAtual()
          : filtro === 'Pendentes'
            ? i.status !== 'concluido'
            : true) &&
      correspondePesquisa(
        busca,
        i.titulo,
        i.detalhes,
        i.categoria,
        i.horario,
        formatarData(i.data),
      ),
  );
  const labelPesquisa = {
    consultas: 'Buscar consultas',
    medicamentos: 'Buscar medicamentos',
    rotinas: 'Buscar atividades',
    memorias: 'Buscar memórias',
  }[tipo];
  const concluidos = cuidados.registros.filter(
    (i) => i.data === dia && i.status === 'concluido',
  ).length;
  const totalDoDia = cuidados.registros.filter((i) => i.data === dia).length;
  // O horário do meio-dia evita que conversões de fuso mudem o dia calculado.
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(dia + 'T12:00:00');
    date.setDate(date.getDate() - date.getDay() + i);
    return {
      iso:
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0'),
      num: date.getDate(),
      label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
    };
  });
  return (
    <EstruturaAplicativo
      section={tipo}
      title={
        tipo === 'rotinas'
          ? usuarioIdoso
            ? 'Hoje'
            : 'Rotina' + (cuidados.pessoa ? ' de ' + cuidados.pessoa.nome.split(' ')[0] : '')
          : titulos[tipo]
      }
    >
      <Action
        soft
        onPress={() =>
          router.push({
            pathname: '/acompanhamento' as never,
            params: {
              idosoId: cuidados.pessoaId,
              area:
                tipo === 'medicamentos' ? 'planos' : tipo === 'rotinas' ? 'diario' : 'historico',
              tipo,
            },
          })
        }
      >
        {tipo === 'medicamentos'
          ? 'Planos de doses e histórico'
          : tipo === 'rotinas'
            ? 'Diário e passagem de turno'
            : 'Ver histórico de alterações'}
      </Action>
      <Message>{!formularioAberto && cuidados.erro}</Message>
      <Message success>{aviso}</Message>
      {!!cuidados.erro && !formularioAberto && (
        <Action soft onPress={cuidados.carregar}>
          Tentar novamente
        </Action>
      )}
      {!usuarioIdoso && !cuidados.carregando && cuidados.pessoas.length > 0 && (
        <SeletorPessoa
          people={cuidados.pessoas}
          selected={cuidados.pessoaId}
          onSelect={cuidados.selecionarPessoa}
        />
      )}
      {!cuidados.carregando && cuidados.pessoa && !pode('ver') && (
        <Message>Você não tem permissão para ver esta área.</Message>
      )}
      {cuidados.carregando ? (
        <Loading />
      ) : !cuidados.pessoas.length && !cuidados.erro ? (
        <Empty
          icon={icon[tipo]}
          title="Vamos começar?"
          text="Adicione a pessoa que será acompanhada para organizar seus cuidados."
        >
          <Action onPress={() => router.push('/pessoas')}>+ Adicionar pessoa</Action>
        </Empty>
      ) : (
        cuidados.pessoa &&
        pode('ver') && (
          <>
            {tipo === 'rotinas' && (
              <>
                <View style={estilosDaTela.row}>
                  <View
                    style={[
                      estilosDaTela.card,
                      { flex: 1, backgroundColor: cor(colors.pale, 'fundo') },
                    ]}
                  >
                    <Text style={estilosDaTela.subheading}>Hoje</Text>
                    <Text style={estilosDaTela.muted}>
                      {totalDoDia ? Math.round((concluidos / totalDoDia) * 100) : 0}% concluído
                    </Text>
                  </View>
                  <View
                    style={[
                      estilosDaTela.card,
                      { flex: 1, backgroundColor: cor(colors.pale, 'fundo') },
                    ]}
                  >
                    <Text style={estilosDaTela.subheading}>Atividades</Text>
                    <Text style={estilosDaTela.muted}>
                      {concluidos} de {totalDoDia} concluídas
                    </Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 6 }}
                >
                  {week.map((date) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={formatarData(date.iso)}
                      aria-selected={date.iso === dia}
                      accessibilityState={{ selected: date.iso === dia }}
                      key={date.iso}
                      onPress={() => {
                        definirDia(date.iso);
                        definirFiltro('Hoje');
                      }}
                      style={{
                        minWidth: 44,
                        paddingVertical: 10,
                        paddingHorizontal: 7,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: cor(date.iso === dia ? colors.purple : colors.line, 'borda'),
                        backgroundColor: cor(date.iso === dia ? colors.purple : 'white', 'fundo'),
                      }}
                    >
                      <Text
                        style={[
                          estilosDaTela.muted,
                          { textAlign: 'center' },
                          date.iso === dia && { color: 'white' },
                        ]}
                      >
                        {date.label}
                      </Text>
                      <Text
                        style={[
                          estilosDaTela.body,
                          { textAlign: 'center', fontWeight: '700' },
                          date.iso === dia && { color: 'white' },
                        ]}
                      >
                        {date.num}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
            {tipo === 'memorias' && (
              <>
                <View style={[estilosDaTela.row, { flexWrap: 'wrap', gap: 8 }]}>
                  {(['Fotos', 'Vídeos', 'Áudios', 'Histórias'] as const).map((cat, i) => (
                    <Pressable
                      key={cat}
                      accessibilityRole="button"
                      aria-selected={categoria === cat}
                      accessibilityState={{ selected: categoria === cat }}
                      onPress={() => {
                        definirCategoria(cat);
                        definirFiltro('Todos');
                        definirPasta('');
                      }}
                      style={{
                        flex: 1,
                        minWidth: 68,
                        alignItems: 'center',
                        gap: 8,
                        padding: 12,
                        backgroundColor: cor(
                          categoria === cat ? colors.purple : colors.pale,
                          'fundo',
                        ),
                        borderRadius: 10,
                      }}
                    >
                      <Icon
                        name={
                          (
                            [
                              'image-outline',
                              'videocam-outline',
                              'mic-outline',
                              'bookmark-outline',
                            ] as const
                          )[i]
                        }
                        color={categoria === cat ? 'white' : colors.purple}
                      />
                      <Text style={[estilosDaTela.muted, categoria === cat && { color: 'white' }]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {mostrarPesquisa && (
                  <Input
                    label={labelPesquisa}
                    value={busca}
                    onChangeText={definirBusca}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    definirCategoria('Todos');
                    definirPasta('');
                    definirBusca('');
                  }}
                >
                  <Text style={estilosDaTela.link}>Ver todas as memórias</Text>
                </Pressable>
                {cuidados.registros.length > 0 && (
                  <>
                    <Text style={estilosDaTela.subheading}>Pastas de momentos</Text>
                    <ScrollView horizontal contentContainerStyle={{ gap: 12 }}>
                      {[...new Set(cuidados.registros.map((i) => i.data.slice(0, 7)))]
                        .sort()
                        .reverse()
                        .map((month) => (
                          <Pressable
                            key={month}
                            accessibilityRole="button"
                            aria-selected={pasta === month}
                            accessibilityState={{ selected: pasta === month }}
                            onPress={() => {
                              definirPasta(month === pasta ? '' : month);
                              definirFiltro('Todos');
                            }}
                            style={{
                              minWidth: 95,
                              backgroundColor: cor(
                                pasta === month ? colors.purple : colors.pale,
                                'fundo',
                              ),
                              padding: 18,
                              borderRadius: 10,
                              gap: 12,
                            }}
                          >
                            <Icon
                              name="folder"
                              size={38}
                              color={pasta === month ? 'white' : colors.purple}
                            />
                            <Text
                              style={[estilosDaTela.body, pasta === month && { color: 'white' }]}
                            >
                              {new Date(month + '-01T12:00:00').toLocaleDateString('pt-BR', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </Text>
                          </Pressable>
                        ))}
                    </ScrollView>
                    <Text style={estilosDaTela.subheading}>Memórias recentes</Text>
                  </>
                )}
              </>
            )}
            {tipo !== 'memorias' && mostrarPesquisa && (
              <Input
                label={labelPesquisa}
                value={busca}
                onChangeText={definirBusca}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
            <View style={[estilosDaTela.row, { flexWrap: 'wrap', gap: 8 }]}>
              {(tipo === 'memorias'
                ? ['Todos', 'Hoje']
                : ['Hoje', 'Próximos', 'Todos', 'Pendentes']
              ).map((f) => (
                <Choice key={f} selected={filtro === f} onPress={() => definirFiltro(f)}>
                  {f}
                </Choice>
              ))}
            </View>
            {mostrarPesquisa && (
              <Text accessibilityLiveRegion="polite" style={estilosDaTela.muted}>
                {visible.length}{' '}
                {visible.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                {pesquisaAtiva ? ' para esta pesquisa' : ' neste filtro'}.
              </Text>
            )}
            {!visible.length ? (
              <Empty
                icon={icon[tipo]}
                title={
                  pesquisaAtiva
                    ? 'Nenhum resultado para esta pesquisa'
                    : cuidados.registros.length
                      ? 'Nenhum registro neste filtro'
                      : tipo === 'memorias'
                        ? 'Suas lembranças começam aqui!'
                        : 'Ainda não há registros'
                }
                text={
                  pesquisaAtiva
                    ? 'Tente outro termo ou altere os filtros.'
                    : cuidados.registros.length
                      ? 'Escolha outro dia ou veja todos os registros.'
                      : 'Adicione o primeiro registro para começar.'
                }
              />
            ) : (
              visible.map((item) => {
                const finished = item.status === 'concluido';
                const late = estaAtrasado(item);
                const bg = finished ? colors.green : late ? colors.red : colors.pale;
                return (
                  <View
                    key={item.id}
                    style={[estilosDaTela.row, { alignItems: 'stretch', gap: 9 }]}
                  >
                    {tipo === 'rotinas' && (
                      <View
                        style={{
                          width: 49,
                          borderRightWidth: 2,
                          borderRightColor: cor('#D7CADF', 'borda'),
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={[estilosDaTela.body, { fontSize: 12 }]}>
                          {item.horario || '—'}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        estilosDaTela.card,
                        {
                          flex: 1,
                          backgroundColor: cor('white', 'fundo'),
                          borderLeftWidth: 4,
                          borderLeftColor: cor(
                            finished ? colors.teal : late ? colors.danger : colors.purple,
                            'texto',
                          ),
                          padding: 20,
                        },
                      ]}
                    >
                      {tipo === 'memorias' &&
                        item.midia &&
                        (item.categoria === 'Fotos' && !item.midia.startsWith('media:') ? (
                          <Image
                            source={{ uri: item.midia }}
                            accessibilityLabel={item.titulo}
                            style={{ width: '100%', height: 230, borderRadius: 10 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Action
                            soft
                            onPress={() => abrirMidia(item.midia!)}
                            icon="play-circle-outline"
                          >
                            Abrir{' '}
                            {item.categoria === 'Áudios'
                              ? 'áudio'
                              : item.categoria === 'Fotos'
                                ? 'foto'
                                : 'vídeo'}
                          </Action>
                        ))}
                      <View style={[estilosDaTela.row, { alignItems: 'flex-start' }]}>
                        {tipo === 'consultas' ? (
                          <View
                            style={{
                              backgroundColor: cor(colors.pale, 'fundo'),
                              padding: 12,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={estilosDaTela.heading}>{item.data.slice(8)}</Text>
                            <Text style={estilosDaTela.body}>
                              {new Date(item.data + 'T12:00:00')
                                .toLocaleDateString('pt-BR', { month: 'short' })
                                .toUpperCase()}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              backgroundColor: cor(bg, 'fundo'),
                              padding: 9,
                              borderRadius: 10,
                            }}
                          >
                            <Icon name={icon[tipo]} size={26} />
                          </View>
                        )}
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text
                            style={[estilosDaTela.subheading, { fontSize: usuarioIdoso ? 23 : 19 }]}
                          >
                            {item.titulo}
                          </Text>
                          {tipo !== 'rotinas' && (
                            <Text style={estilosDaTela.muted}>
                              {formatarData(item.data)} {item.horario}
                            </Text>
                          )}
                          {!!item.detalhes && (
                            <Text style={estilosDaTela.body}>{item.detalhes}</Text>
                          )}
                        </View>
                      </View>
                      {tipo !== 'memorias' && (
                        <Text
                          style={[
                            estilosDaTela.muted,
                            {
                              textAlign: 'right',
                              color: cor(
                                finished ? colors.teal : late ? colors.danger : colors.purple,
                                'texto',
                              ),
                            },
                          ]}
                        >
                          {item.sincronizacaoPendente
                            ? 'Aguardando sincronização'
                            : finished
                              ? 'Concluído'
                              : late
                                ? 'Em atraso'
                                : 'Pendente'}
                        </Text>
                      )}
                      <View style={[estilosDaTela.row, { flexWrap: 'wrap', gap: 12 }]}>
                        {tipo !== 'memorias' && pode('concluir') && (
                          <Pressable
                            disabled={salvando}
                            accessibilityRole="button"
                            onPress={() => alternarConclusao(item)}
                            style={{ minHeight: 48, justifyContent: 'center' }}
                          >
                            <Text style={estilosDaTela.body}>
                              {finished ? '↶ Reabrir' : '✓ Concluir'}
                            </Text>
                          </Pressable>
                        )}
                        {pode('editar') && (
                          <Pressable
                            disabled={salvando}
                            accessibilityRole="button"
                            onPress={() => abrirFormulario(item)}
                            style={{ minHeight: 40, justifyContent: 'center' }}
                          >
                            <Text style={estilosDaTela.body}>Editar</Text>
                          </Pressable>
                        )}
                        {pode('excluir') && (
                          <Pressable
                            disabled={salvando}
                            accessibilityRole="button"
                            onPress={() => confirmarExclusao(item)}
                            style={{ minHeight: 40, justifyContent: 'center', marginLeft: 'auto' }}
                          >
                            <Text style={[estilosDaTela.muted, { color: cor('#A94359', 'texto') }]}>
                              Excluir
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
            {pode('criar') && (
              <Action disabled={salvando} icon="add" onPress={() => abrirFormulario()}>
                Adicionar {nomeRegistro[tipo]}
              </Action>
            )}
            {tipo === 'medicamentos' && (
              <View
                style={[
                  estilosDaTela.card,
                  estilosDaTela.row,
                  { backgroundColor: cor(colors.pale, 'fundo') },
                ]}
              >
                <Image source={art.mascot} style={{ width: 67, height: 72 }} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={estilosDaTela.subheading}>Dica do Eugênio</Text>
                  <Text style={estilosDaTela.muted}>
                    Mantenha os medicamentos organizados e os horários em dia. Registre cada dose
                    conforme a orientação recebida.
                  </Text>
                </View>
              </View>
            )}
          </>
        )
      )}
      <Modal
        visible={formularioAberto}
        animationType="slide"
        transparent
        onRequestClose={() => !salvando && definirFormularioAberto(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: cor('#24103277', 'fundo'),
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: '90%', width: '100%', maxWidth: 460 }}
            contentContainerStyle={[estilosDaTela.card, { padding: 24, gap: 16 }]}
          >
            <Text accessibilityRole="header" style={estilosDaTela.heading}>
              {registroEmEdicao ? 'Editar ' : 'Adicionar '}
              {nomeRegistro[tipo]}
            </Text>
            <Text style={estilosDaTela.muted}>{cuidados.pessoa?.nome}</Text>
            <Input
              autoFocus
              label={
                tipo === 'medicamentos'
                  ? 'Medicamento e dose'
                  : tipo === 'consultas'
                    ? 'Especialidade / consulta'
                    : 'Título'
              }
              value={rascunho.titulo}
              onChangeText={(v) => definirRascunho((p) => ({ ...p, titulo: v }))}
            />
            <Input
              label="Data (DD/MM/AAAA)"
              value={rascunho.data}
              onChangeText={(v) => definirRascunho((p) => ({ ...p, data: v }))}
              keyboardType="numbers-and-punctuation"
            />
            <Input
              label="Horário (HH:MM, opcional)"
              value={rascunho.horario}
              onChangeText={(v) => definirRascunho((p) => ({ ...p, horario: v }))}
            />
            <Input
              label={
                tipo === 'memorias'
                  ? 'Sua história'
                  : tipo === 'consultas'
                    ? 'Profissional, local e observações'
                    : 'Detalhes e observações'
              }
              multiline
              value={rascunho.detalhes}
              onChangeText={(v) => definirRascunho((p) => ({ ...p, detalhes: v }))}
            />
            {tipo === 'memorias' && (
              <>
                <Text style={estilosDaTela.body}>Tipo de memória</Text>
                <View style={[estilosDaTela.row, { flexWrap: 'wrap' }]}>
                  {['Fotos', 'Vídeos', 'Áudios', 'Histórias'].map((cat) => (
                    <Choice
                      key={cat}
                      selected={rascunho.categoria === cat}
                      onPress={() => definirRascunho((p) => ({ ...p, categoria: cat, midia: '' }))}
                    >
                      {cat}
                    </Choice>
                  ))}
                </View>
                {rascunho.categoria === 'Fotos' && (
                  <>
                    <Action soft onPress={escolherFoto} icon="image-outline">
                      Enviar foto privada
                    </Action>
                    {!!rascunho.midia && !rascunho.midia.startsWith('media:') && (
                      <Image
                        source={{ uri: rascunho.midia }}
                        style={{ height: 160, width: '100%' }}
                        resizeMode="contain"
                      />
                    )}
                  </>
                )}
                {['Vídeos', 'Áudios'].includes(rascunho.categoria) && (
                  <>
                    <Action soft disabled={salvando} onPress={escolherFoto}>
                      Escolher e enviar arquivo (até 10 MB)
                    </Action>
                    <Text style={estilosDaTela.muted}>
                      Ou cole o link de um serviço externo autorizado.
                    </Text>
                    <Input
                      label={
                        rascunho.midia.startsWith('media:')
                          ? 'Arquivo privado enviado'
                          : 'Link (https://...)'
                      }
                      editable={!rascunho.midia.startsWith('media:')}
                      value={rascunho.midia}
                      autoCapitalize="none"
                      onChangeText={(v) => definirRascunho((p) => ({ ...p, midia: v }))}
                    />
                  </>
                )}
              </>
            )}
            <Message>{cuidados.erro}</Message>
            <Action disabled={salvando} onPress={salvarRegistro}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Action>
            <Action
              disabled={salvando}
              soft
              onPress={() => {
                definirFormularioAberto(false);
                cuidados.definirErro('');
              }}
            >
              Cancelar
            </Action>
          </ScrollView>
        </View>
      </Modal>
    </EstruturaAplicativo>
  );
}
