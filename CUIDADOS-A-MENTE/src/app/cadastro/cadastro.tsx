import { Redirect } from 'expo-router';

// Compatibilidade: /cadastro/cadastro continua funcionando e cai em /cadastro.
export default function CadastroAlias() {
  return <Redirect href="/cadastro" />;
}
