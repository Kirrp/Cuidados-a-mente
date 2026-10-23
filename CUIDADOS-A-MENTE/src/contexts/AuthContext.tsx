import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, ApiError, Sessao, setToken, storedToken, Usuario } from '../services/api';

// Contexto responsável por guardar o usuário logado e expor funções de autenticação.
// Basicamente, esse provider centraliza o estado de sessão para o restante do app.
type Auth = {
  usuario: Usuario | null; iniciando: boolean; erro: string;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  entrarQr: (codigo: string) => Promise<Usuario>;
  cadastrar: (dados: Record<string, string>) => Promise<Usuario>;
  sair: () => Promise<void>;
  atualizar: (dados: Record<string, string>) => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  // Ao abrir o app, tenta restaurar a sessão salva e validar com o backend.
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [erro, setErro] = useState('');
  useEffect(() => {
    void (async () => {
      try {
        const saved = await storedToken();
        if (!saved) return;
        await setToken(saved);
        setUsuario(await api<Usuario>('/auth/me'));
      } catch(e) {
        if (e instanceof ApiError && e.status === 401) await setToken(null);
        else setErro((e as Error).message);
      } finally { setIniciando(false); }
    })();
  }, []);
  // Helper compartilhado para login/cadastro/QR.
  // Depois de receber a resposta, salva o token e atualiza o usuário logado no estado.
  async function authenticate(path: string, dados: unknown) {
    const result = await api<Sessao>(path, 'POST', dados);
    await setToken(result.token); setUsuario(result.usuario); setErro('');
    return result.usuario;
  }
  // Faz logout no backend e limpa o token e o usuário local.
  async function sair() {
    try { await api('/auth/logout', 'POST'); }
    catch (e) { if (!(e instanceof ApiError && e.status === 401)) throw e; }
    await setToken(null); setUsuario(null);
  }
  return <Context.Provider value={{ usuario, iniciando, erro,
    entrar: (email, senha) => authenticate('/auth/login', { email, senha }),
    entrarQr: codigo => authenticate('/auth/qr', { codigo }),
    cadastrar: dados => authenticate('/auth/cadastro', dados), sair,
    atualizar: async dados => { setUsuario(await api<Usuario>('/auth/me', 'PUT', dados)); }
  }}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider ausente');
  return value;
}
