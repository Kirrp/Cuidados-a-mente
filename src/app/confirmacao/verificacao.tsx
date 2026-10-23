import { useLocalSearchParams } from 'expo-router';
import { VerificationScreen } from '@/features/autenticacao/components/tela-verificacao';

// Escolhe uma apresentação da tela legada a partir de `?tipo=responsavel`.
export default function Verificacao() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();

  // Qualquer valor ausente/desconhecido usa a confirmação de e-mail.
  const variante = tipo === 'responsavel' ? 'chaveacesso' : 'email';

  return <VerificationScreen variante={variante} />;
}
