import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import { CentralPrivacidade } from '@/features/cuidados/components/central-privacidade';
export default function Privacidade() {
  return (
    <EstruturaAplicativo title="Privacidade e direitos" section="perfil" back>
      <CentralPrivacidade />
    </EstruturaAplicativo>
  );
}
