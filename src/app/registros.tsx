import { useLocalSearchParams } from 'expo-router';
import { TelaRegistros } from '@/features/cuidados/components/registros-compartilhados';
import { TipoRegistro } from '@/core/api/cliente-api';

/**
 * Rota genérica `/registros?tipo=...`.
 * Uma única implementação atende rotina, consulta, medicamento e memória;
 * o parâmetro da URL decide qual conteúdo e quais campos serão exibidos.
 */
export default function Registros() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  // Nunca repassamos um valor arbitrário da URL. Se `tipo` não estiver na
  // lista permitida, a tela abre a rotina como opção segura.
  const valid = ['consultas', 'medicamentos', 'rotinas', 'memorias'].includes(tipo || '')
    ? (tipo as TipoRegistro)
    : 'rotinas';
  return <TelaRegistros tipo={valid} />;
}
