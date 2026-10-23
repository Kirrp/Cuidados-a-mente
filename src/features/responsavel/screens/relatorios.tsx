import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { Text, View } from 'react-native';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import { Action, colors, d as dBase, Empty, Loading, Message } from '@/components/ui/design-system';
import { estaAtrasado, obterDataAtual, useCuidados } from '@/features/cuidados/hooks/use-cuidados';
import { SeletorPessoa } from '@/features/cuidados/components/seletor-pessoa';

// Relatório calculado no cliente a partir dos registros já entregues pela API.
// O progresso representa apenas o dia atual da pessoa selecionada.
export default function Relatorios() {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const cuidados = useCuidados();
  const permitido = !!cuidados.pessoa?.permissoes?.includes('ver_relatorios');
  const data = cuidados.registros.filter((i) => i.data === obterDataAtual());
  const done = data.filter((i) => i.status === 'concluido').length;
  return (
    <EstruturaAplicativo title="Relatórios" section="relatorios">
      <Message>{cuidados.erro}</Message>
      {!!cuidados.erro && (
        <Action soft onPress={cuidados.carregar}>
          Tentar novamente
        </Action>
      )}
      {!cuidados.carregando && cuidados.pessoas.length > 0 && (
        <SeletorPessoa
          people={cuidados.pessoas}
          selected={cuidados.pessoaId}
          onSelect={cuidados.selecionarPessoa}
        />
      )}
      {cuidados.carregando ? (
        <Loading />
      ) : cuidados.pessoa && !permitido ? (
        <Message>Você não tem permissão para ver relatórios desta pessoa.</Message>
      ) : !cuidados.registros.length ? (
        <Empty
          icon="stats-chart-outline"
          title="Não há nenhum relatório no momento!"
          text="Adicione atividades, consultas ou medicamentos para acompanhar seus registros."
        />
      ) : (
        <>
          <Text style={estilosDaTela.heading}>Resumo de hoje</Text>
          <Text style={estilosDaTela.body}>{new Date().toLocaleDateString('pt-BR')}</Text>
          {[
            ['Concluídas', done, colors.green],
            ['Pendentes hoje', data.length - done, colors.yellow],
            ['Em atraso', cuidados.registros.filter(estaAtrasado).length, colors.red],
          ].map(([label, value, bg]) => (
            <View
              key={String(label)}
              style={[
                estilosDaTela.card,
                estilosDaTela.row,
                { backgroundColor: cor(String(bg), 'fundo'), justifyContent: 'space-between' },
              ]}
            >
              <Text style={estilosDaTela.subheading}>{label}</Text>
              <Text style={estilosDaTela.heading}>{value}</Text>
            </View>
          ))}
          <View style={estilosDaTela.card}>
            <Text style={estilosDaTela.subheading}>Progresso do dia</Text>
            <View
              style={{
                height: 18,
                borderRadius: 9,
                backgroundColor: cor(colors.pale, 'fundo'),
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 18,
                  width: ((data.length ? (done / data.length) * 100 : 0) + '%') as `${number}%`,
                  backgroundColor: cor(colors.lavender, 'fundo'),
                }}
              />
            </View>
            <Text style={estilosDaTela.body}>
              {done} de {data.length} registros concluídos
            </Text>
          </View>
        </>
      )}
    </EstruturaAplicativo>
  );
}
