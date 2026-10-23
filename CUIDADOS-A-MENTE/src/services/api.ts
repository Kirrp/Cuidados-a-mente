import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Tipos centrais usados no frontend para representar usuários, sessões e registros.
export type TipoUsuario = 'responsavel' | 'cuidador' | 'idoso';
export type Usuario = { id: string; nome: string; email: string; tipo: TipoUsuario; perfil: string };
export type Sessao = { token: string; usuario: Usuario };
export type Idoso = { id: string; nome: string; nascimento: string; observacoes: string; perfil: string };
export type TipoRegistro = 'consultas' | 'medicamentos' | 'rotinas' | 'memorias';
export type Registro = { id: string; idosoId: string; tipo: TipoRegistro; titulo: string; data: string; horario: string; detalhes: string; status: 'pendente' | 'concluido'; categoria?: string; midia?: string };

// URL base da API. Em Android usamos o host do emulador, em web usa localhost.
const baseURL = (process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api')).replace(/\/$/, '');
let token: string | null = null;

// Salva o token de autenticação no armazenamento seguro do dispositivo ou no sessionStorage do web.
export async function setToken(value: string | null) {
  token = value;
  if (Platform.OS !== 'web') {
    if (value) await SecureStore.setItemAsync('cuidados.session', value);
    else await SecureStore.deleteItemAsync('cuidados.session');
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try { if (value) window.sessionStorage.setItem('cuidados.session', value); else window.sessionStorage.removeItem('cuidados.session'); } catch {}
  }
}
// Recupera o token salvo ao abrir o app, para manter a sessão ativa.
export async function storedToken() {
  if (Platform.OS !== 'web') return SecureStore.getItemAsync('cuidados.session');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try { return window.sessionStorage.getItem('cuidados.session'); } catch {}
  }
  return null;
}
// Erro customizado para representar falhas da API, incluindo status HTTP.
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
// Função central para chamar a API.
// Ela adiciona o Authorization, converte o body em JSON, trata timeout e padroniza erros.
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(baseURL + path, {
      method, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || 'Não foi possível concluir a operação.', response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Não foi possível acessar o servidor. Verifique se o backend está aberto e tente novamente.');
  } finally { clearTimeout(timeout); }
}
