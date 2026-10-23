import { usePathname } from 'expo-router';
import { HotbarGlobal } from './hotbar-global';

/** Adaptador da barra antiga: converte a URL atual no nome da aba selecionada. */
export default function BarraIdoso() {
  const pathname = usePathname();
  // O fallback é Início para rotas filhas, desconhecidas ou acessadas por link.
  const ativo =
    pathname === '/idoso/rotina'
      ? 'Rotina'
      : pathname === '/idoso/memorias'
        ? 'Memórias'
        : pathname === '/idoso/emergencia'
          ? 'Emergência'
          : 'Início';

  return <HotbarGlobal tipo="idoso" ativo={ativo} />;
}
