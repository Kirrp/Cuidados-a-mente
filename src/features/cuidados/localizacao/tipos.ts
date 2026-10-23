export type PontoLocalizacao = {
  latitude: number;
  longitude: number;
  precisaoMetros: number;
  atualizadaEm: string;
};
export type EstadoLocalizacao = {
  idosoId: string;
  nome: string;
  autorizado: boolean;
  podeGerenciar: boolean;
  servicoConectado: boolean;
  coletando: boolean;
  compartilhamentoHabilitado: boolean;
  compartilhando: boolean;
  ultimaLocalizacao: PontoLocalizacao | null;
  desatualizada: boolean;
  limiteDesatualizacaoSegundos: number;
  cuidadores: { id: string; nome: string; email: string; autorizado: boolean }[];
};
