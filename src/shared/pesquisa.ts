// Pesquisa local, sem acentos e sem distinção entre maiúsculas/minúsculas.
export function normalizarPesquisa(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}
export function correspondePesquisa(busca: string, ...campos: (string | undefined)[]) {
  return normalizarPesquisa(campos.filter(Boolean).join(' ')).includes(normalizarPesquisa(busca));
}
