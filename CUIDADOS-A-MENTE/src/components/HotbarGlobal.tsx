import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Design } from "../constants/theme";

type TipoHotbar = "responsavel" | "cuidador" | "idoso";

type PropsHotbar = {
  tipo: TipoHotbar;
  ativo: string;
};

const imagensGlobais = {
  inicio: require("../../assets/illustrations/inicioGlobalRC.png"),
  rotina: require("../../assets/illustrations/rotinaGlobalC.png"),
  memorias: require("../../assets/illustrations/memoriasGlobalRC.png"),
  idoso: require("../../assets/illustrations/idosoGlobalRC.png"),
  consultas: require("../../assets/illustrations/consultaGlobalRC.png"),
  relatorio: require("../../assets/illustrations/relatorioGlobalR.png"),
  remedio: require("../../assets/illustrations/remedioGlobalC.png"),
  perfil: require("../../assets/illustrations/perfilGlobalRC.png"),
} as const;


// ============================================================
// ROTAS DO RESPONSÁVEL
// ============================================================

const rotasResponsavel: Record<string, string> = {
  inicio: "/responsavel",
  rotina: "/responsavel/rotina",
  memorias: "/responsavel/banco_de_memorias_responsavel",
  idoso: "/responsavel/perfil_idoso_responsavel",
  consultas: "/consultas",
  relatorio: "/responsavel/relatorio_responsavel",
  remedio: "/medicamentos",
  perfil: "/responsavel/perfilresponsavel",
};


// ============================================================
// ROTAS DO CUIDADOR
// ============================================================

const rotasCuidador: Record<string, string> = {
  inicio: "/cuidador/inicial_cuidador",
  rotina: "/cuidador/rotina",
  memorias: "/cuidador/banco_de_memorias_cuidador",
  consultas: "/cuidador/consulta_cuidador",
  remedio: "/medicamentos",
  perfil: "/cuidador",
};

const rotasIdoso: Record<string, string> = {
  inicio: "/idoso",
  rotina: "/idoso/rotina",
  memorias: "/idoso/memorias",
  emergencia: "/idoso/emergencia",
};


// ============================================================
// HOTBAR
// ============================================================

export function HotbarGlobal({
  tipo,
  ativo,
}: PropsHotbar) {

  // ----------------------------------------------------------
  // ITENS DO RESPONSÁVEL
  // ----------------------------------------------------------

  const itensResponsavel = [
    {
      nome: "Início",
      chave: "inicio",
      imagem: imagensGlobais.inicio,
    },
    {
      nome: "Rotina",
      chave: "rotina",
      imagem: imagensGlobais.rotina,
    },
    {
      nome: "Memórias",
      chave: "memorias",
      imagem: imagensGlobais.memorias,
    },
    {
      nome: "Idoso",
      chave: "idoso",
      imagem: imagensGlobais.idoso,
    },
    {
      nome: "Consultas",
      chave: "consultas",
      imagem: imagensGlobais.consultas,
    },
    {
      nome: "Relatórios",
      chave: "relatorio",
      imagem: imagensGlobais.relatorio,
    },
    {
      nome: "Perfil",
      chave: "perfil",
      imagem: imagensGlobais.perfil,
    },
  ];


  // ----------------------------------------------------------
  // ITENS DO CUIDADOR
  // ----------------------------------------------------------

  const itensCuidador = [
    {
      nome: "Início",
      chave: "inicio",
      imagem: imagensGlobais.inicio,
    },
    {
      nome: "Rotina",
      chave: "rotina",
      imagem: imagensGlobais.rotina,
    },
    {
      nome: "Memórias",
      chave: "memorias",
      imagem: imagensGlobais.memorias,
    },
    {
      nome: "Consultas",
      chave: "consultas",
      imagem: imagensGlobais.consultas,
    },
    {
      nome: "Remédios",
      chave: "remedio",
      imagem: imagensGlobais.remedio,
    },
    {
      nome: "Perfil",
      chave: "perfil",
      imagem: imagensGlobais.perfil,
    },
  ];

  const itensIdoso = [
    { nome: "Início", chave: "inicio", imagem: imagensGlobais.inicio },
    { nome: "Rotina", chave: "rotina", imagem: imagensGlobais.rotina },
    { nome: "Memórias", chave: "memorias", imagem: imagensGlobais.memorias },
    { nome: "Emergência", chave: "emergencia", imagem: imagensGlobais.idoso },
  ];


  // ----------------------------------------------------------
  // ESCOLHE OS ITENS CONFORME O TIPO
  // ----------------------------------------------------------

  const itens = tipo === "responsavel"
    ? itensResponsavel
    : tipo === "idoso"
      ? itensIdoso
      : itensCuidador;


  // ----------------------------------------------------------
  // ESCOLHE AS ROTAS CONFORME O TIPO
  // ----------------------------------------------------------

  const rotas = tipo === "responsavel"
    ? rotasResponsavel
    : tipo === "idoso"
      ? rotasIdoso
      : rotasCuidador;


  // Com 6 ou 7 itens o espaço por item fica pequeno: reduz ícone e fonte.
  const apertado = itens.length >= 6;
  const tamanhoIcone = apertado ? 30 : 40;

  return (
    <View style={styles.container}>

      {itens.map((item) => {

        const selecionado = item.nome === ativo;

        return (
          <TouchableOpacity
            key={item.nome}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => {

              const rota = rotas[item.chave];

              if (rota) {
                router.push(rota as any);
              }

            }}
          >

            <View
              style={[
                  styles.icone,
                selecionado && styles.iconeSelecionado,
              ]}
            >

              <Image
                source={item.imagem}
                style={[styles.imagemIcone, { width: tamanhoIcone, height: tamanhoIcone }]}
                resizeMode="contain"
              />

            </View>

            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.texto,
                apertado && styles.textoApertado,
                selecionado && styles.textoSelecionado,
              ]}
            >
              {item.nome}
            </Text>

          </TouchableOpacity>
        );

      })}

    </View>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  container: {
    height: Design.navigation.height,
    width: "100%",
    backgroundColor: Design.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Design.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  item: {
    flex: 1,
    height: Design.navigation.height,
    alignItems: "center",
    justifyContent: "center",
  },

  icone: {
    width: "100%",
    maxWidth: 48,
    height: 44,
    borderRadius: Design.radius.control,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },

  imagemIcone: {
    width: 40,
    height: 40,
  },

  iconeSelecionado: {
    backgroundColor: Design.colors.surfaceSelected,
  },

  texto: {
    fontSize: 10,
    color: Design.colors.primary,
    textAlign: "center",
  },

  textoApertado: {
    fontSize: 9,
  },

  textoSelecionado: {
    fontWeight: "700",
  },

});
