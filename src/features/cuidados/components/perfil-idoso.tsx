import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { Image, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCuidados } from '@/features/cuidados/hooks/use-cuidados';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import {
  Action,
  art,
  colors,
  d as dBase,
  Empty,
  Icon,
  Loading,
  Message,
} from '@/components/ui/design-system';

/** Detalhes da pessoa identificada pelo parâmetro `idosoId` da URL. */
export default function PerfilIdoso() {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const { idosoId } = useLocalSearchParams<{ idosoId?: string }>();
  const cuidados = useCuidados(undefined, idosoId, false);
  // Dados variáveis ficam serializados em `perfil`; nome, nascimento e
  // observações fazem parte dos campos principais da pessoa.
  const info = cuidados.pessoa
    ? (JSON.parse(cuidados.pessoa.perfil || '{}') as Record<string, string>)
    : {};
  return (
    <EstruturaAplicativo title="Perfil do Idoso" section="idosos" back>
      <Message>{cuidados.erro}</Message>
      {cuidados.carregando ? (
        <Loading />
      ) : !cuidados.pessoa ? (
        <Empty
          image={art.elder}
          title="Nenhum idoso selecionado"
          text="Cadastre a pessoa que deseja acompanhar."
        >
          <Action onPress={() => router.push('/pessoas')}>Meus idosos</Action>
        </Empty>
      ) : (
        <>
          <View
            style={[
              estilosDaTela.card,
              estilosDaTela.row,
              { backgroundColor: cor(colors.pale, 'fundo') },
            ]}
          >
            <Image source={art.elder} style={{ width: 95, height: 100 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={estilosDaTela.heading}>{cuidados.pessoa.nome}</Text>
              <Text style={estilosDaTela.muted}>
                {cuidados.pessoa.nascimento
                  ? cuidados.pessoa.nascimento.split('-').reverse().join('/')
                  : 'Pessoa acompanhada'}
              </Text>
            </View>
          </View>
          <View style={estilosDaTela.card}>
            <Text style={estilosDaTela.subheading}>Perfil e saúde</Text>
            <Text style={estilosDaTela.body}>
              {cuidados.pessoa.observacoes || 'Ainda não há observações cadastradas.'}
            </Text>
            <Action
              soft
              onPress={() =>
                router.push({ pathname: '/contas-idosos', params: { editar: cuidados.pessoaId } })
              }
            >
              Editar informações
            </Action>
          </View>
          <View style={estilosDaTela.card}>
            <Text style={estilosDaTela.subheading}>Dados cadastrais</Text>
            {(
              [
                ['rg', 'RG'],
                ['cpf', 'CPF'],
                ['celular', 'Celular'],
                ['telefone', 'Telefone'],
                ['email', 'E-mail de contato'],
                ['cep', 'CEP'],
                ['rua', 'Rua'],
                ['bairro', 'Bairro'],
                ['cidade', 'Cidade'],
                ['estado', 'Estado'],
                ['numero', 'Número'],
                ['complemento', 'Complemento'],
              ] as const
            )
              .filter(([key]) => !!info[key])
              .map(([key, label]) => (
                <Text key={key} style={estilosDaTela.body}>
                  {label}: {info[key]}
                </Text>
              ))}
          </View>
          {(
            [
              { label: 'Rotina e atividades', icon: 'calendar-outline', tipo: 'rotinas' },
              { label: 'Medicamentos', icon: 'medkit-outline', tipo: 'medicamentos' },
              { label: 'Consultas', icon: 'location-outline', tipo: 'consultas' },
              { label: 'Banco de memórias', icon: 'images-outline', tipo: 'memorias' },
            ] as const
          ).map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.tipo}
              onPress={() =>
                router.push({
                  pathname: '/registros',
                  params: { tipo: item.tipo, idosoId: cuidados.pessoaId },
                })
              }
              style={[estilosDaTela.card, estilosDaTela.row]}
            >
              <Icon name={item.icon} />
              <Text style={[estilosDaTela.subheading, { flex: 1 }]}>{item.label}</Text>
              <Icon name="chevron-forward" />
            </Pressable>
          ))}
        </>
      )}
    </EstruturaAplicativo>
  );
}
