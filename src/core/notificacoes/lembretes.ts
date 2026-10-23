import type { Usuario } from '@/core/api/cliente-api';
export async function pedirPermissaoLembretes() {
  throw new Error(
    'Os lembretes com o aplicativo fechado estão disponíveis no aplicativo Android/iOS.',
  );
}
export async function limparLembretes() {}
export function observarResposta(
  _usuario: Usuario,
  _navegar: (tipo: string, idosoId?: string) => void,
) {
  return () => {};
}
export async function atualizarLembretes(_usuario: Usuario) {
  return 0;
}
