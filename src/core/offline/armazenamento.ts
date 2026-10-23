// Web: mantém os dados somente em memória; sem cache persistente de saúde.
export type Pendente = { id: string; caminho: string; metodo: string; corpo: string; erro: string };
export async function configurarOffline(_token: string | null) {}
export async function habilitarOffline(_habilitado: boolean) {
  if (_habilitado) {
    throw new Error('O modo offline protegido exige um aplicativo nativo com SQLCipher.');
  }
}
export async function offlineHabilitado() {
  return false;
}
export async function guardarCache(_chave: string, _dados: unknown) {}
export async function lerCache<T>(_chave: string): Promise<T | undefined> {
  return undefined;
}
export async function limparOffline() {}
export async function listarPendentes(): Promise<Pendente[]> {
  return [];
}
export async function removerPendente(_id: string) {}
export async function marcarErroPendente(_id: string, _erro: string) {}
export async function enfileirar<T>(
  _caminho: string,
  _metodo: string,
  _corpo: unknown,
): Promise<T> {
  throw new Error('Sem conexão. Tente novamente quando o servidor estiver disponível.');
}
