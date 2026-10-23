import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { atualizarLembretes, limparLembretes, observarResposta } from './lembretes';
export function ObservadorLembretes() {
  const { usuario } = useAutenticacao();
  useEffect(() => {
    if (!usuario) {
      void limparLembretes().catch(() => {});
      return;
    }
    let ativo = true;
    const atualizar = () => {
      void atualizarLembretes(usuario).catch(() => {
        if (ativo) {
          void limparLembretes().catch(() => {});
        }
      });
    };
    atualizar();
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        atualizar();
      }
    });
    const resposta = observarResposta(usuario, (tipo, idosoId) =>
      router.push({
        pathname: '/registros',
        params: { tipo, filtro: 'Pendentes', ...(idosoId ? { idosoId } : {}) },
      }),
    );
    const timer = setInterval(atualizar, 60000);
    return () => {
      ativo = false;
      sub.remove();
      resposta();
      clearInterval(timer);
      void limparLembretes().catch(() => {});
    };
  }, [usuario]);
  return null;
}
