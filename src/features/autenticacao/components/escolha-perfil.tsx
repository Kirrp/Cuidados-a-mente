import { useEstilosTematicos } from '@/core/tema/contexto-tema';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { art, AuthPage, colors, d as dBase, Icon, IconButton } from '@/components/ui/design-system';

/**
 * Tela reutilizada na entrada e no cadastro.
 * `cadastro=false` envia o perfil para o login; `cadastro=true` abre o fluxo de
 * criação correspondente. O idoso sempre segue para o acesso por QR Code.
 */
export default function ProfileChoice({ cadastro = false }: { cadastro?: boolean }) {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);

  // `as const` preserva os valores literais dos tipos, permitindo montar rotas
  // específicas sem transformar `tipo` em uma string genérica.
  const profiles = [
    {
      tipo: 'responsavel',
      label: 'Responsável',
      description: 'Acompanhar quem você ama',
      image: art.family,
    },
    {
      tipo: 'cuidador',
      label: 'Cuidador',
      description: 'Organizar os cuidados do dia',
      image: art.carer,
    },
  ] as const;

  return (
    <AuthPage brandOutside>
      <View style={s.qrCorner}>
        <IconButton
          name="qr-code-outline"
          label="Acesso do idoso por QR Code"
          onPress={() => router.push('/acesso-idoso')}
        />
      </View>
      <View style={{ gap: 5, paddingRight: 32 }}>
        <Text style={estilosDaTela.heading}>{cadastro ? 'Crie sua conta' : 'Boas-vindas!'}</Text>
        <Text style={estilosDaTela.body}>
          {cadastro ? 'Escolha como você vai cuidar.' : 'Escolha como deseja continuar.'}
        </Text>
      </View>
      <View style={s.choices}>
        {profiles.map((profile) => (
          <Pressable
            key={profile.tipo}
            accessibilityRole="button"
            onPress={() =>
              router.push(
                cadastro
                  ? (`/cadastro/cadastro_${profile.tipo}` as never)
                  : { pathname: '/login', params: { tipo: profile.tipo } },
              )
            }
            style={({ pressed }) => [
              s.choice,
              pressed && { opacity: 0.8, transform: [{ scale: 0.985 }] },
            ]}
          >
            <View style={s.avatar}>
              <Image source={profile.image} style={s.avatarImage} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.choiceTitle}>{profile.label}</Text>
              <Text style={estilosDaTela.muted}>{profile.description}</Text>
            </View>
            <Icon name="chevron-forward" size={21} />
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/acesso-idoso')}
        style={s.elderChoice}
      >
        <View style={s.qrIcon}>
          <Icon name="qr-code-outline" size={27} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.choiceTitle}>Acesso do idoso</Text>
          <Text style={estilosDaTela.muted}>
            Entre lendo o QR Code preparado por quem cuida de você.
          </Text>
        </View>
        <Icon name="arrow-forward" size={20} />
      </Pressable>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(cadastro ? '/login' : '/cadastro')}
      >
        <Text style={estilosDaTela.link}>
          {cadastro ? 'Já tenho uma conta' : 'Ainda não tem conta? Inscreva-se'}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push('/termos-de-uso')}>
        <Text style={estilosDaTela.link}>Termos de Uso</Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push('/politica-de-privacidade')}>
        <Text style={estilosDaTela.link}>Política de Privacidade</Text>
      </Pressable>
    </AuthPage>
  );
}

const sBase = StyleSheet.create({
  qrCorner: { position: 'absolute', top: 15, right: 15, zIndex: 1 },
  choices: { gap: 12, marginTop: 8 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    minHeight: 108,
    borderRadius: 18,
    backgroundColor: '#FAF6FF',
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 61, height: 61 },
  choiceTitle: { color: colors.ink, fontWeight: '700', fontSize: 20, lineHeight: 28 },
  elderChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.pale,
    borderWidth: 1,
    borderColor: colors.line,
  },
  qrIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
