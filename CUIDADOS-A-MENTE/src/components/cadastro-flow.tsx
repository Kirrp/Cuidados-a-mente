import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { TipoUsuario } from '../services/api';
import { Action, AuthPage, colors, d, Input, Message } from './design';

const initial = { email: '', senha: '', nome: '', cpf: '', rg: '', dataNascimento: '', telefone: '', celular: '', cep: '', rua: '', bairro: '', cidade: '', estado: '', numero: '', complemento: '' };
function mask(value: string, pattern: string) { const chars = value.replace(/\D/g, ''); let index = 0; let out = ''; for (const c of pattern) { if (index >= chars.length) break; out += c === '#' ? chars[index++] : c; } return out; }
function validDate(value: string) { const [day, month, year] = value.split('/').map(Number); const date = new Date(year, month - 1, day); return year >= 1900 && date <= new Date() && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day; }
export default function CadastroFlow({ tipo }: { tipo: TipoUsuario }) {
  const { cadastrar } = useAuth();
  const [step, setStep] = useState(0), [values, setValues] = useState(initial), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const rules = [values.senha.length >= 8, /[A-Z]/.test(values.senha) && /[a-z]/.test(values.senha), /\d/.test(values.senha), /[^A-Za-z0-9\s]/.test(values.senha)];
  const change = (key: keyof typeof initial, value: string) => setValues(v => ({ ...v, [key]: value }));
  function field(key: keyof typeof initial, label: string, pattern?: string) {
    return <Input key={key} label={label} value={values[key]} onChangeText={v => change(key, pattern ? mask(v, pattern) : v)} keyboardType={pattern ? 'number-pad' : 'default'} autoCapitalize={key === 'estado' ? 'characters' : 'words'} maxLength={pattern?.length || (key === 'estado' ? 2 : 150)} />;
  }
  function back() { if (busy) return; setError(''); if (step) setStep(step - 1); else if (router.canGoBack()) router.back(); else router.replace('/cadastro'); }
  async function next() {
    if (busy) return;
    setError('');
    if (step === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return setError('Digite um e-mail válido.');
    if (step === 1 && !rules.every(Boolean)) return setError('Sua senha precisa atender aos quatro requisitos abaixo.');
    if (step === 2 && (!values.nome.trim() || values.cpf.replace(/\D/g, '').length !== 11 || !values.rg.trim())) return setError('Preencha seu nome completo, RG e CPF com 11 dígitos.');
    if (step === 3 && (!validDate(values.dataNascimento) || values.celular.replace(/\D/g, '').length < 10)) return setError('Informe uma data de nascimento válida e seu celular com DDD.');
    if (step < 4) { setStep(step + 1); return; }
    if (values.cep.replace(/\D/g, '').length !== 8 || !values.rua.trim() || !values.bairro.trim() || !values.cidade.trim() || !/^[A-Z]{2}$/i.test(values.estado) || !values.numero.trim()) return setError('Preencha CEP, rua, bairro, cidade, estado (UF) e número.');
    setBusy(true);
    try { await cadastrar({ ...values, email: values.email.trim(), tipo, estado: values.estado.toUpperCase() }); router.replace('/painel'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <AuthPage onBack={back} large={tipo === 'idoso'}>
    <Text style={[d.muted, { textAlign: 'center' }]}>{tipo === 'responsavel' ? 'Responsável' : tipo === 'cuidador' ? 'Cuidador' : 'Idoso'} · Etapa {step + 1} de 5</Text>
    <View style={d.row}>{[0, 1, 2, 3, 4].map(n => <View key={n} style={{ flex: 1, height: 3, backgroundColor: n <= step ? colors.lavender : colors.pale, borderRadius: 2 }} />)}</View>
    {step === 0 && <><Text style={[d.heading, { textAlign: 'center', fontSize: 32 }]}>Crie sua conta</Text><Text style={[d.body, { textAlign: 'center' }]}>Insira o seu endereço de email.</Text><Input label="Email" value={values.email} onChangeText={v => change('email', v)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" /></>}
    {step === 1 && <><Text style={d.muted}>{values.email}</Text><Text style={d.heading}>Crie sua senha</Text><Input label="Senha" value={values.senha} onChangeText={v => change('senha', v)} secureTextEntry autoCapitalize="none" autoCorrect={false} /><Text style={d.muted}>A sua senha deve conter:</Text><View style={{ gap: 6 }}>{['No mínimo 8 caracteres', 'Uma letra maiúscula e uma minúscula', 'Um número', 'Um caractere especial'].map((text, i) => <Text key={text} style={[d.muted, rules[i] && { color: '#287647' }]}>{rules[i] ? '✓' : '○'} {text}</Text>)}</View></>}
    {step === 2 && <><Text style={[d.heading, { textAlign: 'center' }]}>Digite algumas informações</Text><Text style={[d.body, { textAlign: 'center' }]}>Primeiro, insira o seu nome completo, seu RG e o seu CPF.</Text>{field('nome', 'Nome completo')}{field('rg', 'RG')}{field('cpf', 'CPF', '###.###.###-##')}</>}
    {step === 3 && <><Text style={[d.body, { textAlign: 'center' }]}>Agora, insira a sua data de nascimento e o seu número de telefone.</Text>{field('dataNascimento', 'Data de nascimento (DD/MM/AAAA)', '##/##/####')}{field('telefone', 'Telefone (opcional)', '(##) ####-####')}{field('celular', 'Celular', '(##) #####-####')}</>}
    {step === 4 && <><Text style={[d.body, { textAlign: 'center' }]}>Agora, para finalizar, precisamos do seu endereço.</Text>{field('cep', 'CEP', '#####-###')}{field('rua', 'Rua')}{field('bairro', 'Bairro')}{field('cidade', 'Cidade')}<View style={d.row}><View style={{ flex: 1 }}>{field('estado', 'Estado (UF)')}</View><View style={{ flex: 1 }}>{field('numero', 'Número')}</View></View>{field('complemento', 'Complemento (opcional)')}</>}
    <Message>{error}</Message><Action disabled={busy} onPress={next}>{busy ? 'Salvando...' : step === 4 ? 'Concluir' : 'Avançar'}</Action>
  </AuthPage>;
}
