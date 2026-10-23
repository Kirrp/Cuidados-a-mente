import type { Registro } from '@/core/api/cliente-api';

export type DadosRelatorio = { nome: string; geradoEm: string; registros: Registro[] };

const escaparHtml = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/** Mantém os dados digitados como texto no relatório para impressão. */
export function gerarHtmlRelatorio(data: DadosRelatorio, inicio: string, fim: string): string {
  return (
    '<!doctype html><html lang="pt-BR"><meta charset="UTF-8"><title>Registros de ' +
    'cuidado</title><style>body{font:15px ' +
    'Arial;padding:24px;color:#21192c}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:8px;text-align:left}tr{break-inside:avoid}</style><h1>Cuidados à Mente</h1><h2>' +
    escaparHtml(data.nome) +
    '</h2><p>Período: ' +
    escaparHtml(inicio) +
    ' até ' +
    escaparHtml(fim) +
    '</p><p>Gerado em: ' +
    escaparHtml(new Date(data.geradoEm).toLocaleString('pt-BR')) +
    '</p><table><tr><th>Data e hora</th><th>Tipo</th><th>Registro</th><th>Estado</th></tr>' +
    data.registros
      .map(
        (r) =>
          '<tr><td>' +
          escaparHtml(r.data + ' ' + r.horario) +
          '</td><td>' +
          escaparHtml(r.tipo) +
          '</td><td>' +
          escaparHtml(r.titulo) +
          '<br>' +
          escaparHtml(r.detalhes) +
          '</td><td>' +
          escaparHtml(r.status) +
          '</td></tr>',
      )
      .join('') +
    ('</table><p>Resumo dos registros atuais. Uma conclusão registrada não ' +
      'comprova ingestão. Compartilhe somente com pessoas autorizadas.</p></html>')
  );
}
