import { useEstilosTematicos, useTema } from '@/core/tema/contexto-tema';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { EstruturaAplicativo } from '@/components/layout/estrutura-aplicativo';
import {
  Action,
  colors,
  d as dBase,
  Empty,
  Icon,
  Loading,
  Message,
} from '@/components/ui/design-system';
import { useCuidados } from '@/features/cuidados/hooks/use-cuidados';
import { SeletorPessoa } from '@/features/cuidados/components/seletor-pessoa';

/** Exibe o contato configurado no perfil e abre o discador do aparelho. */
export default function Emergencia() {
  const estilosDaTela = useEstilosTematicos(dBase);
  const { cor } = useTema();

  const cuidados = useCuidados(undefined, undefined, false);
  const profile = {
    nomeEmergencia: cuidados.pessoa?.contatoEmergencia?.nome || '',
    telefoneEmergencia: cuidados.pessoa?.contatoEmergencia?.telefone || '',
  };
  const [error, setError] = useState('');
  if (cuidados.carregando) {
    return (
      <EstruturaAplicativo title="Emergência" section="emergencia" back>
        <Loading />
      </EstruturaAplicativo>
    );
  }
  if (cuidados.erro) {
    return (
      <EstruturaAplicativo title="Emergência" section="emergencia" back>
        <Message>{cuidados.erro}</Message>
        <Action soft onPress={cuidados.carregar}>
          Tentar novamente
        </Action>
      </EstruturaAplicativo>
    );
  }
  if (
    !cuidados.carregando &&
    cuidados.pessoa &&
    !cuidados.pessoa.permissoes?.includes('ver_contato_emergencia')
  ) {
    return (
      <EstruturaAplicativo title="Emergência" section="emergencia" back>
        <SeletorPessoa
          people={cuidados.pessoas}
          selected={cuidados.pessoaId}
          onSelect={cuidados.selecionarPessoa}
        />
        <Message>Você não tem permissão para ver o contato de emergência.</Message>
      </EstruturaAplicativo>
    );
  }
  // Remove máscara antes de criar o link tel:, mas mantém o sinal de número internacional.
  async function call() {
    const phone = (profile.telefoneEmergencia || '').replace(/[^\d+]/g, '');
    if (!phone) {
      return;
    }
    try {
      await Linking.openURL('tel:' + phone);
    } catch {
      setError(
        'Não foi possível abrir o telefone neste dispositivo. Ligue para ' +
          profile.telefoneEmergencia +
          '.',
      );
    }
  }
  return (
    <EstruturaAplicativo title="Emergência" section="emergencia" back>
      {cuidados.pessoas.length > 0 && (
        <SeletorPessoa
          people={cuidados.pessoas}
          selected={cuidados.pessoaId}
          onSelect={(id) => {
            setError('');
            cuidados.selecionarPessoa(id);
          }}
        />
      )}
      <Message>{error}</Message>
      {!!profile.nomeEmergencia && profile.telefoneEmergencia ? (
        <View
          style={[
            estilosDaTela.card,
            {
              backgroundColor: cor(colors.pale, 'fundo'),
              padding: 26,
              gap: 24,
              alignItems: 'center',
            },
          ]}
        >
          <Icon name="call-outline" size={76} />
          <Text style={estilosDaTela.heading}>{profile.nomeEmergencia}</Text>
          <Text style={[estilosDaTela.body, { fontSize: 24 }]}>{profile.telefoneEmergencia}</Text>
          <Action onPress={call} icon="call">
            Ligar para o contato
          </Action>
          {!!cuidados.pessoa?.contatoEmergencia?.telefoneAlternativo && (
            <>
              <Text style={estilosDaTela.body}>
                {cuidados.pessoa.contatoEmergencia.nomeAlternativo}
              </Text>
              <Text style={estilosDaTela.body}>
                {cuidados.pessoa.contatoEmergencia.telefoneAlternativo}
              </Text>
              <Action
                soft
                onPress={() => {
                  void Linking.openURL(
                    'tel:' +
                      cuidados.pessoa!.contatoEmergencia!.telefoneAlternativo!.replace(
                        /[^\d+]/g,
                        '',
                      ),
                  ).catch(() => setError('Não foi possível abrir o telefone alternativo.'));
                }}
              >
                Ligar para o contato alternativo
              </Action>
            </>
          )}
          {cuidados.pessoa?.dono && (
            <Action
              soft
              onPress={() =>
                router.push({
                  pathname: '/acompanhamento' as never,
                  params: { idosoId: cuidados.pessoaId, area: 'contatos' },
                })
              }
            >
              Editar contato
            </Action>
          )}
        </View>
      ) : (
        <Empty
          icon="call-outline"
          title="Ainda não há nenhum contato cadastrado!"
          text="Adicione uma pessoa de confiança para entrar em contato quando precisar."
        >
          {cuidados.pessoa?.dono && (
            <Action
              onPress={() =>
                router.push({
                  pathname: '/acompanhamento' as never,
                  params: { idosoId: cuidados.pessoaId, area: 'contatos' },
                })
              }
            >
              + Adicionar contato
            </Action>
          )}
        </Empty>
      )}
    </EstruturaAplicativo>
  );
}
