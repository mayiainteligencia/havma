import type { ReactNode } from 'react';
import './BentoGrid.css';

/** Tamaños en rejilla de 12 columnas (escritorio). En tablet pasa a 6 y en móvil a 1 columna. */
export type TamanoBento = 'kpi' | 'sm' | 'md' | 'wide' | 'lg' | 'xl' | 'side' | 'tall' | 'full' | 'huge' | 'bar' | 'strip' | 'third' | 'twothirds';

export const BentoGrid = ({ children }: { children: ReactNode }) => <div className="bento">{children}</div>;

/** Todo widget del dashboard se monta dentro de un BentoItem: el tamaño decide cómo se adapta. */
export const BentoItem = ({ size = 'md', children }: { size?: TamanoBento; children: ReactNode }) => (
  <div className={`bento__item bento--${size}`}>{children}</div>
);
