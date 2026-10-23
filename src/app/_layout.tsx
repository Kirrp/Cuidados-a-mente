import { ObservadorLembretes } from '@/core/notificacoes/observador';
import { Stack } from 'expo-router';
import { Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProvedorAutenticacao, useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { LegalGate } from '@/features/autenticacao/components/documentos-legais';
import { ProvedorTema, useTema } from '@/core/tema/contexto-tema';

/**
 * Ponto de entrada visual do Expo Router.
 *
 * Diferente de uma tela comum, este arquivo envolve TODAS as rotas do app.
 * Por isso ele é o lugar apropriado para instalar contextos
 * globais e configurar a pilha de navegação.
 */
export default function RootLayout() {
  // A tipografia usa a fonte nativa do aparelho, sem baixar uma fonte extra.
  // SafeAreaProvider informa os recuos de câmera/notch/barra do sistema.
  // ProvedorAutenticacao deixa a sessão disponível para qualquer tela filha.
  return (
    <SafeAreaProvider>
      <ProvedorAutenticacao>
        <ProvedorTema>
          <RootNavigation />
        </ProvedorTema>
      </ProvedorAutenticacao>
    </SafeAreaProvider>
  );
}

function RootNavigation() {
  const { usuario, iniciando } = useAutenticacao();
  const { tema, cor } = useTema();
  return (
    <>
      {/* O Stack encontra automaticamente os arquivos de src/app. O cabeçalho
        padrão fica oculto porque o projeto usa um cabeçalho próprio. */}
      <ObservadorLembretes />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle:
            tema === 'escuro' ? { backgroundColor: cor('#FCFAFF', 'fundo') } : undefined,
        }}
      />
      {/* Usuários com documentos desatualizados ficam bloqueados por este modal
        até aceitar a versão jurídica atual ou sair da conta. */}
      <Modal
        visible={!iniciando && !!usuario && !usuario.legalAccepted}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <LegalGate />
      </Modal>
    </>
  );
}
