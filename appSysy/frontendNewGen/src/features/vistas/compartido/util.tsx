import { Fragment, type ReactNode } from 'react';
import type { Origen } from '../../../domain/planeacion/types';
import { Etiqueta, KpiCard } from '../../../ui/widgets';
import { BentoItem } from '../../../ui/layouts/BentoGrid';
import type { Rol } from '../../../domain/auth/types';

export interface VistaProps { subId: string; rol: Rol; onNavegar: (destino: string) => void }

export const OrigenTag = ({ origen }: { origen: Origen }) => <Etiqueta tono={origen}>{origen}</Etiqueta>;

/** Texto con **negritas** sin usar HTML crudo. */
export const ConNegritas = ({ texto }: { texto: string }): ReactNode =>
  texto.split(/\*\*(.+?)\*\*/g).map((t, i) => <Fragment key={i}>{i % 2 ? <strong>{t}</strong> : t}</Fragment>);

export const signo = (n: number) => (n >= 0 ? '+' : '');

/** Cuatro KPIs: llenan el espacio a la derecha del HeroCard (4 col × 2 filas de KPI). */
export const Kpis = ({ items }: { items: { etiqueta: string; valor: string; sub?: string; icono?: ReactNode }[] }) => (
  <>{items.map(i => <BentoItem key={i.etiqueta} size="kpi"><KpiCard {...i} /></BentoItem>)}</>
);
