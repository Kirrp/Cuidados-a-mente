import { createContext, ReactNode, useContext, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAutenticacao } from '@/core/autenticacao/contexto-autenticacao';
import { adaptarCor, adaptarEstilos, Tema, UsoCor } from './paleta';

const ContextoTema = createContext<Tema>('claro');
export function ProvedorTema({ children }: { children: ReactNode }) {
  const { usuario } = useAutenticacao();
  const tema = usuario?.tema || 'claro';
  return (
    <ContextoTema.Provider value={tema}>
      <StatusBar style={tema === 'escuro' ? 'light' : 'dark'} />
      {children}
    </ContextoTema.Provider>
  );
}
export function useTema() {
  const tema = useContext(ContextoTema);
  return { tema, cor: (valor: string, uso: UsoCor = 'texto') => adaptarCor(valor, tema, uso) };
}
export function useEstilosTematicos<T>(estilos: T): T {
  const tema = useContext(ContextoTema);
  const { usuario } = useAutenticacao();
  const escala = usuario?.preferencias?.font_scale || 1;
  return useMemo(() => adaptarEstilos(estilos, tema, escala), [estilos, tema, escala]);
}
