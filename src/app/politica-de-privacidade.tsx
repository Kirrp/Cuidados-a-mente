import { LegalPage } from '@/features/autenticacao/components/documentos-legais';
import { privacy } from '@/legal/content';
export default function PoliticaDePrivacidade() {
  return <LegalPage document={privacy} />;
}
