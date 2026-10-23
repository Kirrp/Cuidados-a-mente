import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Idoso, requisitarApi } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import {
  Action,
  art,
  colors,
  d as dBase,
  Icon,
  IconName,
  Input,
  Message,
} from '@/components/ui/design-system';

type MenuItem = { title: string; text: string; icon: IconName; onPress: () => void };

// Linha reutilizável do menu. Receber a ação no objeto permite montar opções
// diferentes por perfil sem duplicar o JSX.
function MenuRow({ item }: { item: MenuItem }) {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={item.onPress}
      style={({ pressed }) => [
        s.menuRow,
        pressed && { backgroundColor: cor(colors.pale, 'fundo') },
      ]}
    >
      <View style={s.menuIcon}>
        <Icon name={item.icon} size={26} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.menuTitle}>{item.title}</Text>
        <Text style={estilosDaTela.muted}>{item.text}</Text>
      </View>
      <Icon name="chevron-forward" size={21} />
    </Pressable>
  );
}

export default function Perfil() {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);

  const { usuario, atualizar, sair, excluirConta } = useAutenticacao();
  // `perfil` vem como JSON porque o backend guarda campos adicionais flexíveis
  // em uma coluna do SQLite. A parte fixa (id, nome, e-mail e tipo) fica em Usuario.
  const profile = usuario ? (JSON.parse(usuario.perfil) as Record<string, string>) : {};
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [notice, setNotice] = useState('');
  const [exclusaoAberta, definirExclusaoAberta] = useState(false);
  const [senhaExclusao, definirSenhaExclusao] = useState('');
  const [podeEditarPerfil, definirPodeEditarPerfil] = useState(false);
  useFocusEffect(
    useCallback(() => {
      if (usuario?.tipo !== 'idoso') {
        return;
      }
      let ativo = true;
      void requisitarApi<Idoso[]>('/idosos')
        .then((pessoas) => {
          if (ativo) {
            definirPodeEditarPerfil(
              !!pessoas[0]?.permissoes?.includes('editar_perfil_proprio') &&
                !!pessoas[0]?.permissoes?.includes('ver_perfil_idoso'),
            );
          }
        })
        .catch(() => {});
      return () => {
        ativo = false;
      };
    }, [usuario?.tipo]),
  );
  const role =
    usuario?.tipo === 'responsavel'
      ? 'Responsável'
      : usuario?.tipo === 'cuidador'
        ? 'Cuidador'
        : 'Idoso';

  // O rascunho separa o que está sendo digitado dos dados já salvos da sessão.
  function begin() {
    setDraft({ ...profile, nome: usuario?.nome || '' });
    setEdit(true);
    setNotice('');
  }
  async function save() {
    if (ocupado) {
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await atualizar(draft);
      setEdit(false);
      setNotice('Perfil atualizado.');
    } catch (erroCapturado) {
      setError((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function logout() {
    if (ocupado) {
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await sair();
      router.replace('/');
    } catch (erroCapturado) {
      setError((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function confirmarExclusao() {
    if (ocupado || !senhaExclusao) {
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await excluirConta(senhaExclusao);
      router.replace('/');
    } catch (erroCapturado) {
      setError((erroCapturado as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  // O spread condicional remove gerenciamento de idosos da própria conta de
  // idoso, mas mantém opções comuns como documentos e lembretes.
  const menu: MenuItem[] = [
    {
      title: 'Informações pessoais',
      text: 'Confira ou edite seus dados',
      icon: 'person-outline',
      onPress: () =>
        usuario?.tipo === 'idoso' && !podeEditarPerfil
          ? setNotice('A edição do perfil não está liberada.')
          : begin(),
    },
    {
      title: 'Configurações',
      text: 'Escolha a aparência do aplicativo',
      icon: 'settings-outline',
      onPress: () => router.push('/configuracoes'),
    },
    ...(usuario?.tipo === 'idoso'
      ? []
      : [
          {
            title: 'Permissões de acesso',
            text: 'Defina o que cuidador e idoso podem fazer',
            icon: 'shield-checkmark-outline' as IconName,
            onPress: () => router.push('/permissoes'),
          },
          {
            title: 'Pessoas acompanhadas',
            text: 'Dados e cadastros dos idosos',
            icon: 'people-outline' as IconName,
            onPress: () => router.push('/pessoas'),
          },
          {
            title: 'Acesso por QR Code',
            text: 'Prepare a conta do idoso',
            icon: 'qr-code-outline' as IconName,
            onPress: () => router.push('/contas-idosos'),
          },
        ]),
    {
      title: 'Lembretes',
      text: 'Atividades que precisam de atenção',
      icon: 'notifications-outline',
      onPress: () => router.push('/registros?tipo=rotinas&filtro=Pendentes'),
    },
    ...(usuario?.tipo === 'idoso'
      ? []
      : [
          {
            title: 'Contato de emergência',
            text: profile.nomeEmergencia || 'Cadastre uma pessoa de confiança',
            icon: 'call-outline' as IconName,
            onPress: begin,
          },
        ]),
    {
      title: 'Termos de Uso',
      text: 'Leia as condições de uso',
      icon: 'document-text-outline',
      onPress: () => router.push('/termos-de-uso'),
    },
    {
      title: 'Política de Privacidade',
      text: 'Entenda o uso dos seus dados',
      icon: 'shield-checkmark-outline',
      onPress: () => router.push('/politica-de-privacidade'),
    },
  ];

  return (
    <EstruturaAplicativo title="Meu perfil" section="perfil">
      <View style={s.hero}>
        <View style={s.avatar}>
          <Image
            source={
              usuario?.tipo === 'idoso'
                ? art.elder
                : usuario?.tipo === 'cuidador'
                  ? art.carer
                  : art.family
            }
            style={s.avatarImage}
            resizeMode="contain"
          />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.name} numberOfLines={2}>
            {usuario?.nome}
          </Text>
          <Text style={estilosDaTela.body}>Meu espaço de cuidado</Text>
          <View style={s.role}>
            <Text style={s.roleText}>{role}</Text>
          </View>
        </View>
      </View>
      <Message>{error}</Message>
      <Message success>{notice}</Message>
      <View style={s.contactCard}>
        <View style={s.contactRow}>
          <Icon name={usuario?.tipo === 'idoso' ? 'qr-code-outline' : 'mail-outline'} />
          <Text style={[estilosDaTela.body, { flex: 1 }]}>
            {usuario?.tipo === 'idoso' ? 'Acesso por QR Code' : usuario?.email}
          </Text>
        </View>
        {!!profile.celular && (
          <View style={s.contactRow}>
            <Icon name="call-outline" />
            <Text style={estilosDaTela.body}>{profile.celular}</Text>
          </View>
        )}
        {!!profile.cidade && (
          <View style={s.contactRow}>
            <Icon name="location-outline" />
            <Text style={estilosDaTela.body}>
              {profile.cidade}
              {profile.estado ? ', ' + profile.estado : ''}
            </Text>
          </View>
        )}
      </View>
      {edit ? (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.subheading}>Informações pessoais</Text>
          {(
            [
              ['nome', 'Nome completo'],
              ['celular', 'Celular'],
              ['telefone', 'Telefone'],
              ['cep', 'CEP'],
              ['rua', 'Rua'],
              ['bairro', 'Bairro'],
              ['cidade', 'Cidade'],
              ['estado', 'Estado (UF)'],
              ['numero', 'Número'],
              ['complemento', 'Complemento'],
              ['nomeEmergencia', 'Nome do contato de emergência'],
              ['telefoneEmergencia', 'Telefone de emergência'],
            ] as const
          )
            .filter(
              ([key]) =>
                usuario?.tipo !== 'idoso' ||
                !['nomeEmergencia', 'telefoneEmergencia'].includes(key),
            )
            .map(([key, label]) => (
              <Input
                key={key}
                label={label}
                value={draft[key] || ''}
                onChangeText={(value) => setDraft((previous) => ({ ...previous, [key]: value }))}
              />
            ))}
          <Action disabled={ocupado} onPress={save}>
            {ocupado ? 'Salvando...' : 'Salvar alterações'}
          </Action>
          <Action soft disabled={ocupado} onPress={() => setEdit(false)}>
            Cancelar
          </Action>
        </View>
      ) : (
        <View style={s.menuCard}>
          {menu.map((item) => (
            <MenuRow key={item.title} item={item} />
          ))}
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={ocupado}
        onPress={logout}
        style={({ pressed }) => [s.logout, pressed && { opacity: 0.7 }]}
      >
        <Icon name="log-out-outline" color="#C84255" />
        <Text style={s.logoutText}>Sair da conta</Text>
      </Pressable>
      {usuario?.tipo !== 'idoso' && (
        <View style={estilosDaTela.card}>
          <Text style={estilosDaTela.subheading}>Excluir minha conta</Text>
          <Text style={estilosDaTela.body}>
            A exclusão apaga permanentemente esta conta, os idosos que você cadastrou, seus
            registros, memórias e acessos por QR Code. Esta ação não pode ser desfeita.
          </Text>
          {exclusaoAberta ? (
            <>
              <Input
                label="Confirme sua senha"
                value={senhaExclusao}
                onChangeText={definirSenhaExclusao}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Action disabled={ocupado || !senhaExclusao} onPress={() => void confirmarExclusao()}>
                {ocupado ? 'Excluindo...' : 'Excluir conta e dados permanentemente'}
              </Action>
              <Action
                soft
                disabled={ocupado}
                onPress={() => {
                  definirExclusaoAberta(false);
                  definirSenhaExclusao('');
                  setError('');
                }}
              >
                Cancelar
              </Action>
            </>
          ) : (
            <Action soft disabled={ocupado} onPress={() => definirExclusaoAberta(true)}>
              Quero excluir minha conta
            </Action>
          )}
        </View>
      )}
    </EstruturaAplicativo>
  );
}

const sBase = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 84, height: 84 },
  name: { color: colors.ink, fontWeight: '800', fontSize: 26, lineHeight: 34 },
  role: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.purple,
  },
  roleText: { color: 'white', fontSize: 13, fontWeight: '700' },
  contactCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 20,
    gap: 17,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: colors.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { color: colors.ink, fontWeight: '700', fontSize: 17, lineHeight: 24 },
  logout: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minWidth: 240,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#FFE7E9',
  },
  logoutText: { color: '#B52C47', fontWeight: '700', fontSize: 17 },
});
