import type { Rol } from '../auth/types';
import { norm } from '../comun/texto';

export interface SubSeccion { id: string; titulo: string }
export type IconoSeccion = 'inicio' | 'plan' | 'flow' | 'check' | 'dinero' | 'grafica' | 'widgets';
export interface Seccion { id: string; titulo: string; alias: string[]; icono: IconoSeccion; subsecciones: SubSeccion[] }
/** Cualquier lugar al que se puede navegar: una sección ('flowchart') o una subsección ('flowchart:por-medio'). */
export interface Destino { id: string; titulo: string; alias: string[] }

const sub = (id: string, titulo: string): SubSeccion => ({ id, titulo });

const S: Record<string, Seccion> = {
  ejecutiva: { id: 'ejecutiva', titulo: 'Ejecutiva', alias: ['ceo', 'direccion', 'resumen'], icono: 'inicio',
    subsecciones: [sub('resumen', 'Resumen'), sub('campanas-activas', 'Campañas activas'), sub('desviaciones', 'Desviaciones'), sub('aprobaciones-pendientes', 'Aprobaciones pendientes')] },
  planeacion: { id: 'planeacion', titulo: 'Planeación', alias: ['mesa', 'brief', 'mix', 'medios', 'escenarios'], icono: 'plan',
    subsecciones: [sub('brief', 'Brief'), sub('target-audiencia', 'Target & audiencia'), sub('mix-medios', 'Mix de medios'), sub('escenarios', 'Escenarios'), sub('alcance-frecuencia', 'Alcance & frecuencia')] },
  flowchart: { id: 'flowchart', titulo: 'Flowchart', alias: ['flow', 'calendario', 'pauta'], icono: 'flow',
    subsecciones: [sub('vista-anual', 'Vista anual'), sub('vista-mensual', 'Vista mensual'), sub('por-marca', 'Por marca'), sub('por-medio', 'Por medio'), sub('por-proveedor', 'Por proveedor')] },
  aprobaciones: { id: 'aprobaciones', titulo: 'Aprobaciones', alias: ['aprobar', 'versiones'], icono: 'check',
    subsecciones: [sub('pendientes', 'Pendientes'), sub('aprobadas', 'Aprobadas'), sub('rechazadas', 'Rechazadas'), sub('historial-versiones', 'Historial de versiones')] },
  presupuesto: { id: 'presupuesto', titulo: 'Presupuesto', alias: ['budget', 'gasto', 'compromisos'], icono: 'dinero',
    subsecciones: [sub('resumen', 'Resumen'), sub('por-medio', 'Por medio'), sub('por-marca', 'Por marca'), sub('por-trimestre', 'Por trimestre'), sub('compromisos', 'Compromisos')] },
  resultados: { id: 'resultados', titulo: 'Resultados', alias: ['optimizacion', 'kpis'], icono: 'grafica',
    subsecciones: [sub('dashboard', 'Dashboard'), sub('por-campana', 'Por campaña'), sub('por-canal', 'Por canal'), sub('kpis', 'KPIs'), sub('recomendaciones-ia', 'Recomendaciones IA')] },
  widgets: { id: 'widgets', titulo: 'Widgets', alias: ['galeria', 'graficas'], icono: 'widgets', subsecciones: [] },
};

// Mismas vistas por rol que el front actual (VISTAS_POR_ROL).
export const SECCIONES_POR_ROL: Record<Rol, Seccion[]> = {
  ceo: ['ejecutiva', 'flowchart', 'presupuesto', 'resultados', 'widgets'].map(k => S[k]),
  planner: ['planeacion', 'flowchart', 'aprobaciones', 'presupuesto', 'widgets'].map(k => S[k]),
};

/** Secciones + subsecciones aplanadas, para el buscador y el asistente. */
export const destinosDe = (secciones: Seccion[]): Destino[] =>
  secciones.flatMap(s => [
    { id: s.id, titulo: s.titulo, alias: s.alias },
    ...s.subsecciones.map(x => ({ id: `${s.id}:${x.id}`, titulo: `${x.titulo} · ${s.titulo}`, alias: [] as string[] })),
  ]);

/** Coincidencia por título o alias, sin acentos ni mayúsculas. */
export function buscarDestino(destinos: Destino[], q: string): Destino[] {
  const t = norm(q).trim();
  if (!t) return [];
  return destinos.filter(s => [s.titulo, ...s.alias].some(a => norm(a).includes(t)));
}
