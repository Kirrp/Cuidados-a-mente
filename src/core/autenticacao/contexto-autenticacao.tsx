import { limparArquivosTemporarios } from '@/core/midia/arquivos';
import { limparLembretes } from '@/core/notificacoes/lembretes';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ErroApi,
  lerTokenSessao,
  requisitarApi,
  salvarTokenSessao,
  Sessao,
  Usuario,
  Idoso,
} from '@/core/api/cliente-api';
import { LEGAL_VERSION } from '@/legal/content';

// Contexto responsável por guardar o usuário logado e expor funções de autenticação.
// Basicamente, esse provider centraliza o estado de sessão para o restante do app.
type ContextoAutenticacao = {
  usuario: Usuario | null;
  iniciando: boolean;
  erro: string;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  entrarQr: (codigo: string) => Promise<Usuario>;
  cadastrar: (dados: Record<string, string | boolean>) => Promise<Usuario>;
  aceitarTermos: () => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: (senha: string) => Promise<void>;
  atualizar: (dados: Record<string, string>) => Promise<void>;
  recarregarUsuario: () => Promise<void>;
  permissoesNavegacao: string[];
  recarregarPermissoesNavegacao: () => Promise<void>;
  alterarTema: (tema: 'claro' | 'escuro') => Promise<void>;
};
const AutenticacaoContexto = createContext<ContextoAutenticacao | null>(null);

/**
 * Dono do estado global da sessão.
 * As telas não precisam conhecer SecureStore, token ou endpoints: elas chamam
 * `entrar`, `cadastrar`, `sair` e observam o valor atual de `usuario`.
 */
export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  // Ao abrir o app, tenta restaurar a sessão salva e validar com o backend.
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [erro, setErro] = useState('');
  // A barra usa a última resposta válida desta conta enquanto a próxima tela carrega.
  // Este estado é apenas de navegação; a API continua autorizando cada operação.
  const [permissoesNavegacao, definirPermissoesNavegacao] = useState({
    usuarioId: '',
    itens: [] as string[],
  });
  const versaoPermissoes = useRef(0);
  const usuarioId = usuario?.id;
  function limparPermissoesNavegacao() {
    versaoPermissoes.current++;
    definirPermissoesNavegacao({ usuarioId: '', itens: [] });
  }
  const recarregarPermissoesNavegacao = useCallback(async () => {
    if (!usuarioId) {
      return;
    }
    const versaoAtual = ++versaoPermissoes.current;
    try {
      const pessoas = await requisitarApi<Idoso[]>('/idosos');
      if (versaoAtual === versaoPermissoes.current) {
        definirPermissoesNavegacao({
          usuarioId,
          itens: [...new Set(pessoas.flatMap((p) => p.permissoes || []))],
        });
      }
    } catch (erroCapturado) {
      // Falha de rede preserva os atalhos; sessão recusada retira as permissões.
      if (
        versaoAtual === versaoPermissoes.current &&
        erroCapturado instanceof ErroApi &&
        (erroCapturado.status === 401 || erroCapturado.status === 403)
      ) {
        definirPermissoesNavegacao({ usuarioId, itens: [] });
      }
      throw erroCapturado;
    }
  }, [usuarioId]);
  const recarregarUsuario = useCallback(async () => {
    const atualizado = await requisitarApi<Usuario>('/auth/me');
    setUsuario((atual) => (atual?.id === atualizado.id ? atualizado : atual));
  }, []);
  useEffect(() => {
    // A função assíncrona autoexecutável permite usar await dentro do effect.
    // O retorno do effect continua reservado ao cleanup do React.
    void (async () => {
      try {
        const tokenSalvo = await lerTokenSessao();
        if (!tokenSalvo) {
          return;
        }
        await salvarTokenSessao(tokenSalvo);
        // O token salvo só é aceito depois que /auth/me o valida no servidor.
        setUsuario(await requisitarApi<Usuario>('/auth/me'));
      } catch (erroCapturado) {
        // 401 significa token expirado/inválido: ele não deve continuar salvo.
        if (erroCapturado instanceof ErroApi && erroCapturado.status === 401) {
          await salvarTokenSessao(null);
        } else {
          setErro((erroCapturado as Error).message);
        }
      } finally {
        setIniciando(false);
      }
    })();
  }, []);
  // Helper compartilhado para login/cadastro/QR.
  // Depois de receber a resposta, salva o token e atualiza o usuário logado no estado.
  async function autenticar(caminho: string, dados: unknown) {
    const sessao = await requisitarApi<Sessao>(caminho, 'POST', dados);
    await salvarTokenSessao(sessao.token);
    limparPermissoesNavegacao();
    setUsuario(sessao.usuario);
    setErro('');
    return sessao.usuario;
  }
  // Faz logout no backend e limpa o token e o usuário local.
  async function sair() {
    limparPermissoesNavegacao();
    try {
      await requisitarApi('/auth/logout', 'POST');
    } catch {
      /* Sair também funciona sem rede; sessões remotas podem ser encerradas em outro aparelho. */
    }
    await limparArquivosTemporarios().catch(() => {});
    await limparLembretes().catch(() => {});
    await salvarTokenSessao(null);
    setUsuario(null);
  }
  async function excluirConta(senha: string) {
    await requisitarApi('/auth/me', 'DELETE', { senha });
    limparPermissoesNavegacao();
    // A sessão já foi apagada junto com a conta no servidor.
    await limparArquivosTemporarios().catch(() => {});
    await limparLembretes().catch(() => {});
    await salvarTokenSessao(null);
    setUsuario(null);
  }
  return (
    <AutenticacaoContexto.Provider
      value={{
        usuario,
        iniciando,
        erro,
        entrar: (email, senha) => autenticar('/auth/login', { email, senha }),
        entrarQr: (codigo) => autenticar('/auth/qr', { codigo }),
        cadastrar: (dados) => autenticar('/auth/cadastro', dados),
        sair,
        excluirConta,
        aceitarTermos: async () => {
          // As versões enviadas precisam coincidir com as exigidas pelo backend.
          setUsuario(
            await requisitarApi<Usuario>('/legal/accept', 'POST', {
              termsVersion: LEGAL_VERSION,
              privacyVersion: LEGAL_VERSION,
              healthConsent: true,
            }),
          );
        },
        atualizar: async (dados) => {
          const atualizado = await requisitarApi<Usuario>('/auth/me', 'PUT', dados);
          setUsuario((atual) => (atual?.id === atualizado.id ? atualizado : atual));
        },
        recarregarUsuario,
        permissoesNavegacao:
          permissoesNavegacao.usuarioId === usuarioId ? permissoesNavegacao.itens : [],
        recarregarPermissoesNavegacao,
        alterarTema: async (tema) => {
          const atualizado = await requisitarApi<Usuario>('/auth/me/tema', 'PUT', { tema });
          // Uma resposta atrasada não restaura a conta anterior após logout/troca.
          setUsuario((atual) => (atual?.id === atualizado.id ? atualizado : atual));
        },
      }}
    >
      {children}
    </AutenticacaoContexto.Provider>
  );
}
export function useAutenticacao() {
  const autenticacao = useContext(AutenticacaoContexto);
  // Falhar cedo ajuda a identificar uma tela renderizada fora do RootLayout.
  if (!autenticacao) {
    throw new Error('ProvedorAutenticacao ausente');
  }
  return autenticacao;
}
