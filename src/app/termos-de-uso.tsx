import { LegalPage } from '@/features/autenticacao/components/documentos-legais';
import { terms } from '@/legal/content';
export default function TermosDeUso() {
  return <LegalPage document={terms} />;
}
