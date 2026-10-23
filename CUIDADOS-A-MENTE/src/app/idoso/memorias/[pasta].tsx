import { useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BarraIdoso from '../../../components/barraIdoso';
import { voltar } from '../../../components/em-breve';

const NOMES: Record<string, string> = {
  familia: 'Minha família',
  fotos: 'Álbum de fotos',
  videos: 'Vídeos',
  audios: 'Áudios',
  datas: 'Datas especiais',
};

export default function PastaMemorias() {
  const { pasta } = useLocalSearchParams<{ pasta?: string }>();
  const insets = useSafeAreaInsets();
  const titulo = NOMES[String(pasta)] ?? 'Memórias';

  return (
    <View style={styles.container}>

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => voltar("/idoso/memorias")} style={styles.botaoVoltar} hitSlop={12}>
          <Image
            source={require('../../../../assets/images/imagens/icones/voltar.png')}
            style={styles.iconeVoltar}
            resizeMode="contain"
          />
        </Pressable>

        <Text style={styles.titulo}>{titulo}</Text>
      </View>

      <View style={styles.conteudo}>
        <Text style={styles.aviso}>
          Ainda não há nada guardado em {'\n'}&quot;{titulo}&quot;.
        </Text>

        <Text style={styles.dica}>
          Peça para a sua família adicionar memórias aqui.
        </Text>
      </View>

      <View style={{ paddingBottom: insets.bottom }}>
        <BarraIdoso />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#BF89D8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoVoltar: { marginRight: 16 },
  iconeVoltar: { width: 34, height: 34 },
  titulo: { flex: 1, fontSize: 26, fontWeight: 'bold', color: '#FFFFFF' },
  conteudo: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  aviso: { fontSize: 22, textAlign: 'center', color: '#5D1186', fontWeight: '600' },
  dica: { fontSize: 17, textAlign: 'center', color: '#8A6A9B', marginTop: 14 },
});
