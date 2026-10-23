import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api, Idoso, Registro, TipoRegistro } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function today() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export function dateLabel(value: string) { return value.split('-').reverse().join('/'); }
export function isLate(item: Registro) { return item.status !== 'concluido' && (item.data < today() || (item.data === today() && !!item.horario && item.horario < new Date().toTimeString().slice(0, 5))); }
// Mantém apenas a seleção de navegação em memória; os registros vêm sempre da API.
let selection = { user: '', id: '' };
export function useCare(tipo?: TipoRegistro, requested?: string) {
  const { usuario } = useAuth();
  const [people, setPeople] = useState<Idoso[]>([]);
  const scope = `${usuario?.id || ''}:${requested || ''}`;
  const [selectionState, setSelectionState] = useState({ scope, id: requested || '' });
  const personId = selectionState.scope === scope ? selectionState.id : requested || '';
  const setPersonId = useCallback((id: string) => setSelectionState({ scope, id }), [scope]);
  const [items, setItems] = useState<Registro[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const request = useRef(0);
  const load = useCallback(async () => {
    if (!usuario) return;
    const version = ++request.current; setLoading(true); setError('');
    try {
      const people = await api<Idoso[]>('/idosos');
      const wanted = personId || requested || (selection.user === usuario.id ? selection.id : '');
      const id = people.find(p => p.id === wanted)?.id || people[0]?.id || '';
      const types: TipoRegistro[] = tipo ? [tipo] : ['rotinas', 'medicamentos', 'consultas'];
      const records = id ? (await Promise.all(types.map(t => api<Registro[]>(`/registros?tipo=${t}&idosoId=${encodeURIComponent(id)}`)))).flat() : [];
      if (version === request.current) { setPeople(people); setPersonId(id); selection = { user: usuario.id, id }; setItems(records); }
    } catch(e) { if (version === request.current) { setError((e as Error).message); setItems([]); } }
    finally { if (version === request.current) setLoading(false); }
  }, [usuario, personId, requested, tipo, setPersonId]);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current++; }; }, [load]));
  return { people, person: people.find(p => p.id === personId), personId, select: setPersonId, items, setItems, error, setError, loading, load };
}
