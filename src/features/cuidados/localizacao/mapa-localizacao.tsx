import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Action, d as estilosBase, Icon } from '@/components/ui/design-system';
import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { PontoLocalizacao } from './tipos';

// Sem endpoint configurado, o mapa fica indisponível. Nunca há ponto de exemplo.
const urlTiles = process.env.EXPO_PUBLIC_MAP_TILE_URL || '';
const credito = process.env.EXPO_PUBLIC_MAP_ATTRIBUTION || '';
const provedor = process.env.EXPO_PUBLIC_MAP_PROVIDER_NAME || '';
const configurado =
  /^https:\/\//.test(urlTiles) &&
  ['{z}', '{x}', '{y}'].every((token) => urlTiles.includes(token)) &&
  !!credito &&
  !!provedor;

export function MapaLocalizacao({ ponto, nome }: { ponto: PontoLocalizacao | null; nome: string }) {
  const estilosDaTela = useEstilosTematicos(estilosBase);
  const { cor } = useTema();
  const [largura, setLargura] = useState(320);
  const [carregar, setCarregar] = useState(false);
  const [erro, setErro] = useState(false);
  const altura = 300;
  const zoom = 15;
  const quantidade = 2 ** zoom;
  const latitude = ponto ? Math.max(-85.05112878, Math.min(85.05112878, ponto.latitude)) : 0;
  const radianos = (latitude * Math.PI) / 180;
  const centroX = ponto ? ((ponto.longitude + 180) / 360) * quantidade * 256 : 0;
  const centroY = ponto
    ? ((1 - Math.asinh(Math.tan(radianos)) / Math.PI) / 2) * quantidade * 256
    : 0;
  const tiles: { x: number; y: number; esquerda: number; topo: number }[] = [];
  if (ponto && configurado && carregar && !erro) {
    for (
      let x = Math.floor((centroX - largura / 2) / 256);
      x <= Math.floor((centroX + largura / 2) / 256);
      x++
    ) {
      for (
        let y = Math.floor((centroY - altura / 2) / 256);
        y <= Math.floor((centroY + altura / 2) / 256);
        y++
      ) {
        if (y >= 0 && y < quantidade) {
          tiles.push({
            x,
            y,
            esquerda: x * 256 - centroX + largura / 2,
            topo: y * 256 - centroY + altura / 2,
          });
        }
      }
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <View
        onLayout={(erroCapturado) => setLargura(erroCapturado.nativeEvent.layout.width)}
        accessibilityLabel={
          ponto
            ? 'Mapa da última localização conhecida de ' + nome
            : 'Mapa indisponível: nenhuma localização recebida'
        }
        style={{
          height: altura,
          overflow: 'hidden',
          borderRadius: 18,
          backgroundColor: cor('#F7EFFF', 'fundo'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {tiles.length > 0 ? (
          <>
            {tiles.map((tile) => (
              <Image
                key={tile.x + ':' + tile.y}
                source={{
                  uri: urlTiles
                    .replace('{z}', String(zoom))
                    .replace('{x}', String(((tile.x % quantidade) + quantidade) % quantidade))
                    .replace('{y}', String(tile.y)),
                }}
                onError={() => setErro(true)}
                style={{
                  position: 'absolute',
                  left: tile.esquerda,
                  top: tile.topo,
                  width: 256,
                  height: 256,
                }}
              />
            ))}
            <View style={{ position: 'absolute', left: largura / 2 - 20, top: altura / 2 - 40 }}>
              <Icon name="location" size={40} />
            </View>
            <View style={[estilosDaTela.card, { position: 'absolute', bottom: 12, padding: 10 }]}>
              <Text style={estilosDaTela.body}>{nome}</Text>
              <Text style={estilosDaTela.muted}>Última localização conhecida</Text>
            </View>
          </>
        ) : (
          <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
            <Icon name="map-outline" size={62} />
            <Text style={estilosDaTela.subheading}>
              {ponto
                ? erro
                  ? 'Mapa indisponível'
                  : 'Cartografia não carregada'
                : 'Nenhuma localização recebida'}
            </Text>
            <Text style={[estilosDaTela.body, { textAlign: 'center' }]}>
              {ponto
                ? erro
                  ? 'Não foi possível carregar o mapa externo.'
                  : 'O mapa depende de um provedor de cartografia configurado.'
                : 'O serviço de GPS do dispositivo da pessoa idosa ainda não foi conectado.'}
            </Text>
          </View>
        )}
      </View>
      {ponto && (
        <Text style={estilosDaTela.muted}>
          Coordenada recebida: {ponto.latitude.toFixed(5)}, {ponto.longitude.toFixed(5)}. Precisão
          informada: {Math.round(ponto.precisaoMetros)} m.
        </Text>
      )}
      {ponto && configurado && !carregar && (
        <>
          <Text style={estilosDaTela.muted}>
            Ao carregar o mapa, {provedor} recebe seu endereço IP e a área geográfica consultada. O
            nome do idoso não é enviado.
          </Text>
          <Action soft onPress={() => setCarregar(true)}>
            Carregar mapa externo
          </Action>
        </>
      )}
      {!!tiles.length && <Text style={estilosDaTela.muted}>{credito}</Text>}
    </View>
  );
}
