import { Text, View } from 'react-native';
import { AppShell } from '../../components/app-shell';
import { Action, colors, d, Empty, Loading, Message } from '../../components/design';
import { useCare, today, isLate } from '../../hooks/use-care';
import { PersonPicker } from '../../components/person-picker';
export default function Relatorios() {
  const care = useCare();
  const data = care.items.filter(i => i.data === today()), done = data.filter(i => i.status === 'concluido').length;
  return <AppShell title="Relatórios" section="relatorios"><Message>{care.error}</Message>{!!care.error && <Action soft onPress={care.load}>Tentar novamente</Action>}{care.loading ? <Loading /> : !care.items.length ? <Empty icon="stats-chart-outline" title="Não há nenhum relatório no momento!" text="Adicione atividades, consultas ou medicamentos para acompanhar seus registros." /> : <><PersonPicker people={care.people} selected={care.personId} onSelect={care.select} /><Text style={d.heading}>Resumo de hoje</Text><Text style={d.body}>{new Date().toLocaleDateString('pt-BR')}</Text>{[['Concluídas', done, colors.green], ['Pendentes hoje', data.length - done, colors.yellow], ['Em atraso', care.items.filter(isLate).length, colors.red]].map(([label, value, bg]) => <View key={String(label)} style={[d.card, d.row, { backgroundColor: String(bg), justifyContent: 'space-between' }]}><Text style={d.subheading}>{label}</Text><Text style={d.heading}>{value}</Text></View>)}<View style={d.card}><Text style={d.subheading}>Progresso do dia</Text><View style={{ height: 18, borderRadius: 9, backgroundColor: colors.pale, overflow: 'hidden' }}><View style={{ height: 18, width: (data.length ? done / data.length * 100 : 0) + '%' as `${number}%`, backgroundColor: colors.lavender }} /></View><Text style={d.body}>{done} de {data.length} registros concluídos</Text></View></>}</AppShell>;
}
