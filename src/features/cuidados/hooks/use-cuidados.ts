import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Idoso, Registro, requisitarApi, TipoRegistro } from '@/core/api/cliente-api';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';

export function obterDataAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
}
export function formatarData(valor: string) {
  return valor.split('-').reverse().join('/');
}
export function estaAtrasado(registro: Registro) {
  return (
    registro.status !== 'concluido' &&
    (registro.data < obterDataAtual() ||
      (registro.data === obterDataAtual() &&
        !!registro.horario &&
        registro.horario < new Date().toTimeString().slice(0, 5)))
  );
}
// Mantém apenas a seleção de navegação em memória; os registros vêm sempre da API.
let selecaoPersistida = { usuarioId: '', pessoaId: '' };

/**
 * Carrega as pessoas e os registros usados nas telas de cuidado.
 *
 * O hook reúne estado, seleção e chamadas de API para que Painel e
 * TelaRegistros não implementem a mesma lógica. `tipo` limita a consulta a uma
 * categoria; sem ele, busca o resumo necessário para o painel.
 */
export function useCuidados(
  tipo?: TipoRegistro,
  pessoaSolicitadaId?: string,
  carregarRegistros = true,
) {
  const { usuario } = useAutenticacao();
  const [pessoas, definirPessoas] = useState<Idoso[]>([]);
  // O escopo muda quando muda o usuário ou o idoso recebido pela URL. Assim,
  // uma seleção antiga não vaza para outra conta ou link direto.
  const escopo = `${usuario?.id || ''}:${pessoaSolicitadaId || ''}`;
  const [estadoSelecao, definirEstadoSelecao] = useState({ escopo, id: pessoaSolicitadaId || '' });
  const pessoaId = estadoSelecao.escopo === escopo ? estadoSelecao.id : pessoaSolicitadaId || '';
  const definirPessoaId = useCallback(
    (id: string) => definirEstadoSelecao({ escopo, id }),
    [escopo],
  );
  const [registros, definirRegistros] = useState<Registro[]>([]);
  const [erro, definirErro] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const versaoRequisicao = useRef(0);
  const carregar = useCallback(async () => {
    if (!usuario) {
      return;
    }
    const versaoAtual = ++versaoRequisicao.current;
    definirCarregando(true);
    definirErro('');
    try {
      const pessoasRecebidas = await requisitarApi<Idoso[]>('/idosos');
      // Ordem de preferência: seleção atual, parâmetro da URL, última seleção
      // desta conta e, por fim, a primeira pessoa recebida.
      const pessoaDesejadaId =
        pessoaId ||
        pessoaSolicitadaId ||
        (selecaoPersistida.usuarioId === usuario.id ? selecaoPersistida.pessoaId : '');
      const pessoaValidaId =
        pessoasRecebidas.find((pessoa) => pessoa.id === pessoaDesejadaId)?.id ||
        pessoasRecebidas[0]?.id ||
        '';
      // O painel precisa de três categorias; telas específicas pedem só uma.
      const tiposConsultados: TipoRegistro[] = !carregarRegistros
        ? []
        : tipo
          ? [tipo]
          : ['rotinas', 'medicamentos', 'consultas'];
      const permissoes = pessoasRecebidas.find(
        (pessoa) => pessoa.id === pessoaValidaId,
      )?.permissoes;
      const tiposPermitidos = tiposConsultados.filter(
        (tipoConsultado) => !permissoes || permissoes.includes(`ver_${tipoConsultado}`),
      );
      const registrosRecebidos = pessoaValidaId
        ? (
            await Promise.all(
              tiposPermitidos.map((tipoConsultado) =>
                requisitarApi<Registro[]>(
                  `/registros?tipo=${tipoConsultado}&idosoId=${encodeURIComponent(pessoaValidaId)}`,
                ),
              ),
            )
          ).flat()
        : [];

      // Uma troca rápida de tela pode terminar requisições fora de ordem. A versão
      // impede que uma resposta antiga sobrescreva a seleção e os dados mais novos.
      if (versaoAtual === versaoRequisicao.current) {
        definirPessoas(pessoasRecebidas);
        definirPessoaId(pessoaValidaId);
        selecaoPersistida = { usuarioId: usuario.id, pessoaId: pessoaValidaId };
        definirRegistros(registrosRecebidos);
      }
    } catch (erroCapturado) {
      if (versaoAtual === versaoRequisicao.current) {
        definirErro((erroCapturado as Error).message);
        definirRegistros([]);
      }
    } finally {
      if (versaoAtual === versaoRequisicao.current) {
        definirCarregando(false);
      }
    }
  }, [usuario, pessoaId, pessoaSolicitadaId, tipo, definirPessoaId, carregarRegistros]);

  // useFocusEffect recarrega ao voltar para a tela (por exemplo, depois de
  // criar um registro). O cleanup invalida respostas que chegarem tarde.
  useFocusEffect(
    useCallback(() => {
      void carregar();
      return () => {
        versaoRequisicao.current++;
      };
    }, [carregar]),
  );
  return {
    pessoas: pessoas,
    pessoa: pessoas.find((pessoa) => pessoa.id === pessoaId),
    pessoaId: pessoaId,
    selecionarPessoa: definirPessoaId,
    registros: registros,
    definirRegistros: definirRegistros,
    erro: erro,
    definirErro: definirErro,
    carregando: carregando,
    carregar: carregar,
  };
}
