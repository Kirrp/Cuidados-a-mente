import { useLocalSearchParams } from 'expo-router';
import { RegistrosScreen } from '../components/registros-screen';
import { TipoRegistro } from '../services/api';
export default function Registros() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const valid = ['consultas','medicamentos','rotinas','memorias'].includes(tipo || '') ? tipo as TipoRegistro : 'rotinas';
  return <RegistrosScreen tipo={valid} />;
}
