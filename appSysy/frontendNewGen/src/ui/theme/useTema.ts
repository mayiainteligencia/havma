import { useCallback, useState } from 'react';

export type Tema = 'claro' | 'oscuro';
const KEY = 'havasdata:tema';

const inicial = (): Tema => {
  try {
    const g = localStorage.getItem(KEY);
    if (g === 'claro' || g === 'oscuro') return g;
  } catch { /* sin storage */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
};

const aplicar = (t: Tema) => {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(KEY, t); } catch { /* noop */ }
};

/** Llamar antes del primer render para evitar parpadeo. */
export const iniciarTema = () => aplicar(inicial());

export function useTema() {
  const [tema, setTema] = useState<Tema>(() => (document.documentElement.getAttribute('data-theme') as Tema) || inicial());
  const alternar = useCallback(() => {
    const n: Tema = tema === 'claro' ? 'oscuro' : 'claro';
    aplicar(n); setTema(n);
  }, [tema]);
  return { tema, alternar };
}
