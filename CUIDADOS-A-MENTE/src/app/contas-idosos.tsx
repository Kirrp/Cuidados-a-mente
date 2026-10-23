import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api, Idoso } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppShell } from '../components/app-shell';
import { Action, colors, d, Input, Loading, Message } from '../components/design';

type Access = { codigo: string; expires: number; nome: string; id: string };
type ElderDraft = { nome: string; rg: string; cpf: string; nascimento: string; telefone: string; celular: string; email: string; cep: string; rua: string; bairro: string; cidade: string; estado: string; numero: string; complemento: string; observacoes: string };
const blank: ElderDraft = { nome: '', rg: '', cpf: '', nascimento: '', telefone: '', celular: '', email: '', cep: '', rua: '', bairro: '', cidade: '', estado: '', numero: '', complemento: '', observacoes: '' };
function mask(value: string, pattern: string) { const digits=value.replace(/\D/g,''); let i=0, output=''; for (const part of pattern) { if (i>=digits.length) break; output+=part==='#'?digits[i++]:part; } return output; }
function validDate(value: string) { const [day,month,year]=value.split('/').map(Number); const date=new Date(year,month-1,day); return year>=1900 && date<=new Date() && date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day; }
function complete(person: Idoso) { const p=JSON.parse(person.perfil || '{}') as Record<string,string>; return !!person.nascimento && !!p.rg?.trim() && p.cpf?.replace(/\D/g,'').length===11 && p.celular?.replace(/\D/g,'').length>=10 && p.cep?.replace(/\D/g,'').length===8 && !!p.rua?.trim() && !!p.bairro?.trim() && !!p.cidade?.trim() && /^[A-Z]{2}$/i.test(p.estado || '') && !!p.numero?.trim(); }
export default function ContasIdosos() {
  const { usuario } = useAuth();
  const { novo, editar } = useLocalSearchParams<{ novo?: string; editar?: string }>();
  const routeHandled = useRef(false);
  const [people, setPeople] = useState<Idoso[]>([]), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [form, setForm] = useState(false), [draft, setDraft] = useState<ElderDraft>(blank), [editingId, setEditingId] = useState(''), [step, setStep] = useState(0);
  const [qr, setQr] = useState<Access | null>(null), [now, setNow] = useState(Date.now());
  const [confirmRevoke, setConfirmRevoke] = useState('');
  const load = useCallback(async () => {
    if (!usuario || usuario.tipo === 'idoso') return;
    setLoading(true);
    try { setPeople(await api<Idoso[]>('/idosos')); } catch(e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [usuario]);
  useFocusEffect(useCallback(() => { void load(); return () => setQr(null); }, [load]));
  useEffect(() => { if (loading || routeHandled.current) return; routeHandled.current=true; if (editar) { const person=people.find(p => p.id===editar); if (person) begin(person); } else if (novo) begin(); }, [loading, people, editar, novo]);
  useEffect(() => { if (!qr) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [qr]);
  async function generate(id: string) {
    const result = await api<Omit<Access, 'id'>>(`/idosos/${id}/qr`, 'POST');
    setNow(Date.now()); setQr({ ...result, id });
  }
  function begin(person?: Idoso) { const saved=person ? JSON.parse(person.perfil || '{}') as Partial<ElderDraft> : {}; setEditingId(person?.id || ''); setDraft({ ...blank, ...saved, nome:person?.nome || '', nascimento:person?.nascimento?.split('-').reverse().join('/') || '', observacoes:person?.observacoes || '' }); setStep(0); setForm(true); setQr(null); setError(''); setNotice(''); }
  function field(key: keyof ElderDraft,label: string,pattern?: string) { return <Input key={key} label={label} value={draft[key]} onChangeText={value => setDraft(current => ({ ...current, [key]:pattern?mask(value,pattern):value }))} keyboardType={pattern?'number-pad':key==='email'?'email-address':'default'} autoCapitalize={key==='estado'?'characters':key==='email'?'none':'words'} autoCorrect={key!=='email'} maxLength={pattern?.length || (key==='estado'?2:150)} />; }
  function next() {
    setError('');
    if (step===0 && (!draft.nome.trim() || !draft.rg.trim() || draft.cpf.replace(/\D/g,'').length!==11)) return setError('Preencha o nome, RG e CPF com 11 dígitos.');
    if (step===1 && (!validDate(draft.nascimento) || draft.celular.replace(/\D/g,'').length<10 || (!!draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())))) return setError('Confira o nascimento, o celular com DDD e o e-mail, se informado.');
    if (step<2) { setStep(step+1); return; }
    if (draft.cep.replace(/\D/g,'').length!==8 || !draft.rua.trim() || !draft.bairro.trim() || !draft.cidade.trim() || !/^[A-Z]{2}$/i.test(draft.estado) || !draft.numero.trim()) return setError('Preencha CEP, rua, bairro, cidade, estado (UF) e número.');
    void run(save);
  }
  async function run(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function create() {
    await api<Idoso>('/idosos', 'POST', { ...draft, nome:draft.nome.trim(), nascimento:draft.nascimento.split('/').reverse().join('-'), estado:draft.estado.toUpperCase() });
  }
  async function save() {
    if (editingId) await api<Idoso>('/idosos/'+editingId,'PUT',{ ...draft, nome:draft.nome.trim(), nascimento:draft.nascimento.split('/').reverse().join('-'), estado:draft.estado.toUpperCase() });
    else await create();
    setForm(false); setEditingId(''); await load(); setNotice('Cadastro salvo. Agora escolha Gerar QR Code de acesso.');
  }
  const seconds = qr ? Math.max(0, qr.expires - Math.floor(now / 1000)) : 0;
  if (usuario?.tipo === 'idoso') return <Redirect href="/painel" />;
  return <AppShell title="Contas dos idosos" section="perfil" back>
    <Text style={d.heading}>Acesso com QR Code</Text>
    <Text style={d.body}>Preencha os dados do idoso e salve o cadastro. Depois, gere o QR Code para ele acessar a mesma rotina e as mesmas memórias.</Text>
    <Message>{error}</Message><Message success>{notice}</Message>
    {loading ? <Loading /> : <>
      {!form && people.map(person => <View key={person.id} style={d.card}><Text style={d.subheading}>{person.nome}</Text>{complete(person) ? <Action icon="qr-code-outline" disabled={busy} onPress={() => void run(() => generate(person.id))}>Gerar QR Code de acesso</Action> : <Text style={d.muted}>Complete os dados do cadastro para liberar o QR Code.</Text>}<Action soft disabled={busy} onPress={() => begin(person)}>{complete(person) ? 'Editar cadastro do idoso' : 'Completar cadastro do idoso'}</Action><Action soft disabled={busy} onPress={() => setConfirmRevoke(person.id)}>Desconectar acesso do idoso</Action>
        {confirmRevoke === person.id && <><Text style={d.body}>Isso encerra as sessões deste idoso e cancela o código atual. Seus dados continuam salvos.</Text><Action disabled={busy} onPress={() => void run(async () => { await api(`/idosos/${person.id}/qr`, 'DELETE'); setQr(null); setConfirmRevoke(''); setNotice('Acesso desconectado. Gere outro código quando precisar.'); })}>Confirmar desconexão</Action><Action soft disabled={busy} onPress={() => setConfirmRevoke('')}>Cancelar</Action></>}
      </View>)}
      {!people.length && !form && <Text style={d.body}>Cadastre o primeiro idoso para preparar seu acesso.</Text>}
      {qr && <View style={[d.card, { alignItems: 'center', backgroundColor: colors.pale }]}><Text style={d.subheading}>Acesso de {qr.nome}</Text>{seconds > 0 ? <>
        <View accessibilityLabel={`QR Code de acesso de ${qr.nome}`} style={{ padding: 20, backgroundColor: 'white' }}><QRCode value={'cuidados-a-mente:acesso:' + qr.codigo} size={210} ecl="M" /></View>
        <Text style={d.body}>Válido por {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} · uso único</Text>
        <Text style={d.body}>No aparelho do idoso, abra o aplicativo e toque no ícone de QR Code no canto superior direito da tela inicial.</Text>
        <Text style={d.muted}>Sem câmera? Selecione e copie este código:</Text><Text selectable style={[d.body, { fontSize: 12 }]}>{qr.codigo}</Text>
      </> : <Message>O código expirou. Gere outro para entrar.</Message>}<Action soft disabled={busy} onPress={() => void run(() => generate(qr.id))}>Gerar novo código</Action><Text style={d.muted}>Um novo código substitui o anterior. Mostre somente ao idoso que vai acessar esta conta.</Text></View>}
      {form ? <View style={d.card}><Text style={d.subheading}>{editingId ? 'Completar ou editar cadastro' : 'Cadastrar idoso'}</Text><Text style={d.muted}>Etapa {step+1} de 3</Text><View style={d.row}>{[0,1,2].map(n => <View key={n} style={{ flex:1, height:3, borderRadius:2, backgroundColor:n<=step?colors.lavender:colors.pale }} />)}</View>
        {step===0 && <><Text style={d.body}>Informações pessoais</Text>{field('nome','Nome completo')}{field('rg','RG')}{field('cpf','CPF','###.###.###-##')}</>}
        {step===1 && <><Text style={d.body}>Nascimento e contato</Text>{field('nascimento','Data de nascimento (DD/MM/AAAA)','##/##/####')}{field('telefone','Telefone (opcional)','(##) ####-####')}{field('celular','Celular','(##) #####-####')}{field('email','E-mail de contato (opcional)')}<Text style={d.muted}>O e-mail é apenas para contato. O idoso não precisa criar senha.</Text></>}
        {step===2 && <><Text style={d.body}>Endereço</Text>{field('cep','CEP','#####-###')}{field('rua','Rua')}{field('bairro','Bairro')}{field('cidade','Cidade')}<View style={d.row}><View style={{ flex:1 }}>{field('estado','Estado (UF)')}</View><View style={{ flex:1 }}>{field('numero','Número')}</View></View>{field('complemento','Complemento (opcional)')}<Input label="Observações (opcional)" multiline value={draft.observacoes} onChangeText={observacoes => setDraft(p => ({ ...p, observacoes }))} /></>}
        <Action disabled={busy} onPress={next}>{busy?'Salvando...':step===2?'Salvar cadastro':'Avançar'}</Action>{step>0 && <Action soft disabled={busy} onPress={() => { setStep(step-1); setError(''); }}>Voltar etapa</Action>}<Action soft disabled={busy} onPress={() => setForm(false)}>Cancelar</Action></View> : <Action icon="person-add-outline" disabled={busy} onPress={() => begin()}>Cadastrar novo idoso</Action>}
      <Action soft disabled={busy} onPress={() => router.push('/pessoas')}>Editar informações dos idosos</Action>
    </>}
  </AppShell>;
}
