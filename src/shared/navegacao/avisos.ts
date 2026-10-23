import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

/**
 * Substitui Alert.alert nas telas de cadastro.
 *
 * Alert.alert do React Native não tem efeito nenhum no navegador
 * (react-native-web não implementa a caixinha) — é por isso que um botão
 * "Cadastrar" que só navega dentro do onPress do OK do Alert parece não
 * fazer nada na web: o alerta nunca aparece, então o OK nunca é tocado.
 *
 * Use esta função em vez de Alert.alert em qualquer tela que precise
 * continuar (navegar, etc.) depois que a pessoa confirmar o aviso.
 */
type BotaoAlerta = { text: string; onPress?: () => void };

export function alertaUniversal(titulo: string, mensagem: string, botoes?: BotaoAlerta[]) {
  const lista = botoes && botoes.length > 0 ? botoes : [{ text: 'OK' }];

  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    // Na web não dá pra saber em qual botão a pessoa "clicaria" — dispara
    // sempre o último (é o botão de confirmar/positivo por convenção).
    lista[lista.length - 1].onPress?.();
    return;
  }

  Alert.alert(titulo, mensagem, lista);
}

/**
 * Usado nos botões que ainda não têm tela de destino.
 * Evita botão "morto": o usuário toca e recebe uma resposta.
 */
export function emBreve(nome: string = 'Essa função') {
  const titulo = 'Em desenvolvimento';
  const texto = `${nome} ainda está sendo construído.`;

  if (Platform.OS === 'web') {
    // Alert.alert não aparece no navegador
    window.alert(`${titulo}\n\n${texto}`);
    return;
  }

  Alert.alert(titulo, texto, [{ text: 'Entendi' }]);
}

/**
 * Volta com segurança: se não existe tela anterior (link direto, refresh
 * no navegador), router.back() não faz nada — aí manda para o destino padrão.
 */
export function voltar(destinoPadrao: string = '/') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(destinoPadrao as never);
}
