import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

//Cria uma variavel para três telas, que tem o mesmo estilo
type telaVariante = "email" | "chaveacesso" | "tentarNovamente";
//Cria a variante "telaVerificacaoGeral" para guardar a variante da telaVariante
type telaVerificacaoGeral = {
  variante: telaVariante;
};

//Cria uma const "telaConteudo" para dar valores a telaVariante
const telaConteudo = {
  email: {
    telaNome: "Confirmação de email - cuidador",
    titulo: "Verifique o seu Email",
    subtitulo: "Por favor, digite o código que enviamos para:",
    texto: "usuario123@gmai.com",
    botao: "Verificar Email",
    subBotao: "Não recebeu o código?",
    rota: "/cuidador/inicial_cuidador",
    subRota: "/confirmacao/reconfirmacao-email"
  },
  chaveacesso: {
    telaNome: "Chave de acesso - responsável",
    titulo: "Contate o familiar responsável",
    subtitulo: "Por favor, digite a chave de acesso que o responsável enviou:",
    texto: "",
    botao: "Cadastrar",
    subBotao: "",
    rota: "/idoso",
    subRota: "/"
  },
  tentarNovamente: {
    telaNome: "Re-confirmação de email - cuidador",
    titulo: "Tente novamente",
    subtitulo: "Por favor, digite o código que reenviamos para:",
    texto: "usuario123@gmai.com",
    botao: "Verificar Email",
    subBotao: "Não recebeu o código?",
    rota: "/cuidador/inicial_cuidador",
    subRota: "/confirmacao/reconfirmacao-email"
  },
} as const;

function LogoTela(){
  return(
    <View style={styles.logoTamanho}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
      <Text style={styles.logoTexto}>UIDADOS-A-MENTE</Text>
    </View>
  )
}

function PaperPlane() {
  return (
    <View style={styles.aviaozinhoTamanho}>
      <Image source={require('../../assets/images/aviaozinho.png')} style={styles.aviaozinho} />
    </View>
  );
}

export function VerificationScreen({ variante }: telaVerificacaoGeral) {
  const conteudo = telaConteudo[variante];
  const [code, setCode] = useState("");

  return(
    <SafeAreaView style={styles.conteudo}>
        <View style={styles.pagina}>
          <LogoTela />

          {/* CARD */}
          <Text style={styles.titulo}>{conteudo.titulo}</Text>
          <View style={styles.card}>
            <Text style={styles.texto}>{conteudo.subtitulo}</Text>
            <Text style={styles.email}>{conteudo.texto}</Text>
            <PaperPlane />
            <TextInput accessibilityLabel="Código de confirmação" keyboardType="number-pad" maxLength={5} onChangeText={setCode}placeholder="00000" placeholderTextColor="#b7b3b5" style={styles.codigoInput} textAlign="center" value={code} />

            <TouchableOpacity accessibilityRole="button" onPress={() => router.push(conteudo.rota as any)} style={styles.verificaBotao}>
              <Text style={styles.textoVerificar}>{conteudo.botao}</Text>
            </TouchableOpacity>

            <TouchableOpacity accessibilityRole="button" onPress={() => router.push(conteudo.subRota as any)} style={styles.reenvioBotao} >
              <Text style={styles.reenvioBotaoTexto}>{conteudo.subBotao}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    width: '100%',
    height: '100%'
  },
  pagina: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
    width: "100%",
  },
  logoTamanho: {
    flexDirection: 'row'
  },
  logo: {
    height: 42,
    marginRight: 3,
    position: "relative",
    width: 38,
  },
  logoTexto: {
    marginTop: 9,
    fontSize: 20,
    fontWeight: '800',
    color: '#6f4a9d',
    letterSpacing: 0.5,
    justifyContent: 'flex-end'
  },

  titulo: {
    textAlign: 'center',
    fontSize: 18,
    color: '#050505',
    marginTop: 12,
    marginBottom: 10
  },
  card: {
    width: 320,
    backgroundColor: '#f6f2fb',
    borderRadius: 1,
    borderWidth: 25,
    borderColor: '#9E6CBA',
    elevation: 6,
    alignItems: 'center',
    marginBottom: 98,
  },
  texto: {
    color: "#777276",
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 5
  },
  email: {
    color: "#666164",
    fontSize: 13,
    marginTop: 12,
  },
  aviaozinhoTamanho: {
    marginTop: 10,
    marginBottom: 6,
    alignItems: 'center',
  },
  aviaozinho: {
    width: 120,
    height: 60,
    transform: [{ rotate: '-20deg' }],
  },

  codigoInput: {
    width: 98,
    height: 56,
    borderBottomWidth: 3,
    borderBottomColor: '#b88cd8',
    textAlign: 'center',
    fontSize: 31,
    fontWeight: '700'
  },

  verificaBotao: {
    width: 282,
    height: 75,
    marginTop: 20,
    backgroundColor: '#9E6CBA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textoVerificar: {
    marginTop: 15,
    marginRight: 14,
    justifyContent: 'center',
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  reenvioBotao: {
    alignItems: "center",
    backgroundColor: "#f6f2fb",
    height: 36,
    justifyContent: "center",
    marginTop: 11,
    marginBottom: 11,
    width: "100%",
  },
  reenvioBotaoTexto: {
    color: "#2873b7",
    fontSize: 18,
  },
});
