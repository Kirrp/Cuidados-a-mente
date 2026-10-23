import { usePathname } from 'expo-router';
import { HotbarGlobal } from './HotbarGlobal';

export default function BarraIdoso() {
  const pathname = usePathname();
  const ativo = pathname === '/idoso/rotina'
    ? 'Rotina'
    : pathname === '/idoso/memorias'
      ? 'Memórias'
      : pathname === '/idoso/emergencia'
        ? 'Emergência'
        : 'Início';

  return <HotbarGlobal tipo="idoso" ativo={ativo} />;
}
