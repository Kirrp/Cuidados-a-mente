import { useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { AppShell } from '../../components/app-shell';
import { Action, colors, d, Icon, IconName, Message } from '../../components/design';
import { today, useCare } from '../../hooks/use-care';
import { api } from '../../services/api';
const options = ['Jogo da memória', 'Desenho', 'Música favorita', 'Contar histórias', 'Pintura', 'Ler um livro'];
const randomIndex = (length: number) => Math.floor(Math.random() * length);
export default function Atividade() {
  const care = useCare('rotinas'); const [spin] = useState(() => new Animated.Value(0));
  const [turns, setTurns] = useState(0), [rolling, setRolling] = useState(false), [choice, setChoice] = useState(-1);
  const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [game, setGame] = useState(false);
  const [cards, setCards] = useState<IconName[]>([]), [open, setOpen] = useState<number[]>([]), [matched, setMatched] = useState<number[]>([]);
  function roll() {
    if (rolling) return;
    const selected = randomIndex(options.length), rotation = (turns + 4) * 360 + (360 - selected * 60 - 30);
    setRolling(true); setNotice(''); setGame(false);
    Animated.timing(spin, { toValue: rotation, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => { setChoice(selected); setTurns(turns + 5); setRolling(false); });
  }
  function beginGame() {
    const pairs: IconName[] = ['heart', 'flower', 'musical-note', 'sunny', 'heart', 'flower', 'musical-note', 'sunny'];
    for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
    setCards(pairs); setOpen([]); setMatched([]); setGame(true);
  }
  function flip(index: number) {
    if (matched.includes(index) || open.includes(index)) return;
    const next = open.length === 2 ? [index] : [...open, index]; setOpen(next);
    if (next.length === 2 && cards[next[0]] === cards[next[1]]) { setMatched(prev => [...prev, ...next]); setOpen([]); }
  }
  async function add() {
    if (busy || !care.personId || choice < 0) return; setBusy(true); care.setError('');
    try { await api('/registros', 'POST', { idosoId: care.personId, tipo: 'rotinas', titulo: options[choice], data: today(), horario: '', detalhes: 'Atividade escolhida na roleta do dia.' }); setNotice('Atividade adicionada à sua rotina de hoje.'); }
    catch(e) { care.setError((e as Error).message); } finally { setBusy(false); }
  }
  return <AppShell title="Atividade do dia" section="rotinas" back><Text style={[d.body, { textAlign: 'center' }]}>Gire a roleta e escolha um momento especial para hoje.</Text><View style={{ alignItems: 'center', paddingVertical: 14 }}><View style={{ zIndex: 1, marginBottom: -18 }}><Icon name="caret-down" size={38} /></View><Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }] }}><Svg width={290} height={290} viewBox="0 0 300 300">{options.map((label, i) => { const a = (i * 60 - 90) * Math.PI / 180, b = ((i + 1) * 60 - 90) * Math.PI / 180; return <Path key={label} d={'M150 150 L' + (150 + 136 * Math.cos(a)) + ' ' + (150 + 136 * Math.sin(a)) + ' A136 136 0 0 1 ' + (150 + 136 * Math.cos(b)) + ' ' + (150 + 136 * Math.sin(b)) + ' Z'} fill={i % 2 ? '#C79BEF' : '#E7CEFA'} stroke="white" strokeWidth={2} />; })}<Circle cx={150} cy={150} r={140} stroke="#A956DC" strokeWidth={9} fill="none" />{options.map((label, i) => { const mid = (i * 60 - 60) * Math.PI / 180; return <SvgText key={label} x={150 + 87 * Math.cos(mid)} y={150 + 87 * Math.sin(mid)} fill={colors.ink} fontSize={11} textAnchor="middle" fontWeight="bold">{label}</SvgText>; })}<Circle cx={150} cy={150} r={25} fill="#A956DC" /></Svg></Animated.View></View><Action disabled={rolling} onPress={roll}>{rolling ? 'Girando...' : 'Girar roleta'}</Action>{choice >= 0 && !rolling && <View style={d.card}><Text style={[d.heading, { textAlign: 'center' }]}>{options[choice]}</Text><Action disabled={busy || !care.personId || !!notice} onPress={add}>Adicionar à rotina</Action></View>}<Message>{care.error}</Message><Message success>{notice}</Message><Action soft onPress={beginGame}>{game ? 'Recomeçar jogo da memória' : 'Jogar memória'}</Action>{game && <><Text style={d.subheading}>{matched.length === 8 ? 'Parabéns! Você encontrou todos os pares.' : 'Encontre os pares'}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{cards.map((name, i) => { const visible = open.includes(i) || matched.includes(i); return <Pressable key={i} accessibilityRole="button" accessibilityLabel={visible ? name : 'Virar carta ' + (i + 1)} onPress={() => flip(i)} style={{ width: '21%', minHeight: 85, borderRadius: 12, backgroundColor: matched.includes(i) ? colors.green : colors.pale, justifyContent: 'center', alignItems: 'center' }}><Icon name={visible ? name : 'help'} size={36} /></Pressable>; })}</View></>}</AppShell>;
}
