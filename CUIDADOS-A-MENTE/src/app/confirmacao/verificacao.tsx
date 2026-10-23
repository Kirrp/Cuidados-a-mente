import { useLocalSearchParams } from "expo-router";
import { VerificationScreen } from "../../components/verificacaotela";

export default function Verificacao() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();

  const variante = tipo === "responsavel" ? "chaveacesso" : "email";

  return <VerificationScreen variante={variante} />;
}
