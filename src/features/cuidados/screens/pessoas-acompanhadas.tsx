import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { useCallback, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Redirect, useFocusEffect, router } from 'expo-router';
import { Idoso, requisitarApi } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import {
  Action,
  IconButton,
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

/** Lista e pesquisa as pessoas acompanhadas pelo cuidador ou responsável. */
export default function Pessoas() {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const { usuario } = useAutenticacao();
  const [items, setItems] = useState<Idoso[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!usuario || usuario.tipo === 'idoso') {
      return;
    }
    setLoading(true);
    setError('');
    try {
      setItems(await requisitarApi<Idoso[]>('/idosos'));
    } catch (erroCapturado) {
      setError((erroCapturado as Error).message);
    } finally {
      setLoading(false);
    }
  }, [usuario]);
  // Recarrega toda vez que a rota ganha foco; assim uma edição feita em outra
  // tela aparece quando o usuário volta para a lista.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const mostrarPesquisa = items.length >= 5 || !!query;
  const pessoasVisiveis = items.filter((p) =>
    correspondePesquisa(
      query,
      p.nome,
      p.observacoes,
      p.nascimento,
      p.nascimento?.split('-').reverse().join('/'),
    ),
  );

  // A conta do idoso só pode ver os próprios dados, não a lista administrativa.
  if (usuario?.tipo === 'idoso') {
    return <Redirect href="/painel" />;
  }
  return (
    <EstruturaAplicativo
      title="Meus idosos"
      section="idosos"
      right={
        items.some((p) => p.permissoes?.includes('gerar_qr')) ? (
          <IconButton
            name="qr-code-outline"
            label="Configurar acesso dos idosos"
            onPress={() => router.push('/contas-idosos')}
          />
        ) : null
      }
    >
      <View
        style={[
          estilosDaTela.card,
          estilosDaTela.row,
          { backgroundColor: cor(colors.pale, 'fundo') },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={estilosDaTela.subheading}>Gerencie os idosos que você cuida</Text>
          <Text style={estilosDaTela.muted}>
            Acompanhe a rotina, medicações e memórias de cada um.
          </Text>
        </View>
        <Image source={art.mascot} style={{ width: 90, height: 90 }} resizeMode="contain" />
      </View>
      <Message>{error}</Message>
      {!!error && (
        <Action soft onPress={load}>
          Tentar novamente
        </Action>
      )}
      {mostrarPesquisa && (
        <Input
          label="Buscar idoso..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
      <Text accessibilityLiveRegion="polite" style={estilosDaTela.subheading}>
        Meus idosos ({pessoasVisiveis.length})
      </Text>
      {loading ? (
        <Loading />
      ) : items.length === 0 && !error ? (
        <Empty
          image={art.elder}
          title="Ainda não há nenhum idoso cadastrado"
          text="Cadastre a primeira pessoa para começar o acompanhamento."
        />
      ) : pessoasVisiveis.length === 0 && !!query.trim() ? (
        <Empty
          image={art.elder}
          title="Nenhum idoso encontrado"
          text="Tente outro nome ou termo de pesquisa."
        />
      ) : (
        pessoasVisiveis.map((item) => (
          <View key={item.id} style={estilosDaTela.card}>
            <Pressable
              accessibilityRole="button"
              disabled={!item.permissoes?.includes('ver_perfil_idoso')}
              style={estilosDaTela.row}
              onPress={() =>
                router.push({
                  pathname: '/responsavel/perfil_idoso_responsavel',
                  params: { idosoId: item.id },
                })
              }
            >
              <Image source={art.elder} style={{ width: 75, height: 80 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={estilosDaTela.subheading}>{item.nome}</Text>
                <Text style={estilosDaTela.muted}>
                  {item.nascimento
                    ? item.nascimento.split('-').reverse().join('/')
                    : 'Cadastro pendente'}
                </Text>
                {!!item.observacoes && <Text style={estilosDaTela.muted}>{item.observacoes}</Text>}
              </View>
              <Icon name="chevron-forward" />
            </Pressable>
            <View style={[estilosDaTela.row, { justifyContent: 'space-between' }]}>
              {item.permissoes?.includes('editar_perfil_idoso') && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/contas-idosos', params: { editar: item.id } })
                  }
                  style={{ padding: 8 }}
                >
                  <Text style={estilosDaTela.body}>Editar cadastro</Text>
                </Pressable>
              )}
              {item.permissoes?.includes('ver_medicamentos') && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/registros',
                      params: { tipo: 'medicamentos', idosoId: item.id },
                    })
                  }
                  style={{ padding: 8 }}
                >
                  <Text style={estilosDaTela.body}>Medicamentos</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))
      )}
      <Action icon="person-add-outline" onPress={() => router.push('/contas-idosos?novo=1')}>
        Cadastrar novo idoso
      </Action>
    </EstruturaAplicativo>
  );
}
