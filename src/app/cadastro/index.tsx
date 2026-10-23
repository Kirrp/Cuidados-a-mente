import ProfileChoice from '@/features/autenticacao/components/escolha-perfil';
// Na URL `/cadastro`, o mesmo seletor da entrada funciona em modo de criação.
export default function Cadastro() {
  return <ProfileChoice cadastro />;
}
