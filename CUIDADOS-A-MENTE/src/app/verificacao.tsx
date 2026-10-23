import { Redirect, useLocalSearchParams } from 'expo-router';
export default function VerificacaoAlias() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  return <Redirect href={{ pathname: '/confirmacao/verificacao', params: tipo ? { tipo } : {} }} />;
}
