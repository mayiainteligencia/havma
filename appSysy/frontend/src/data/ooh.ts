// Capa de datos OOH. Contrato entre el datalab y el frontend: los JSON los
// genera `backend/datalab/run.py` a partir de los Excel reales de uploads/.
// No editar los JSON a mano — se regeneran.
import circuitoRaw from '../../../backend/datalab/datos/ooh_circuito.json';
import inventarioRaw from '../../../backend/datalab/datos/ooh_inventario.json';
import resumenRaw from '../../../backend/datalab/datos/ooh_resumen_circuito.json';

export type TipoSoporte =
  | 'cartelera' | 'cartelera_digital' | 'pantalla_digital'
  | 'puente' | 'muro' | 'azotea' | 'tunel' | 'otro';

export type EstadoDisponibilidad =
  | 'inmediata' | 'ocupado' | 'fecha' | 'indefinido' | 'desconocido';

export type FuenteSoporte = 'circuito_comex' | 'mxm' | 'combinado';

export interface AudienciaSoporte {
  total: number;
  masculino: number;
  femenino: number;
  edad_18_25: number;
  edad_26_40: number;
  edad_41_55: number;
  edad_55_mas: number;
  nse_a: number;
  nse_b: number;
  nse_c: number;
  nse_d: number;
  nse_e: number;
}

export interface Soporte {
  id: string;
  id_operador?: string;
  fuente: FuenteSoporte;
  lat: number;
  lon: number;
  mapeable?: boolean;
  direccion: string | null;
  ciudad: string | null;
  estado: string | null;
  municipio?: string | null;
  zona_metropolitana?: string | null;
  tipo: TipoSoporte;
  estructura?: string | null;
  vista?: string | null;
  base_m?: number | null;
  altura_m?: number | null;
  mts2?: number | null;
  es_digital: boolean;
  tarifa_publicada_mxn?: number | null;
  disponibilidad: {
    estado: EstadoDisponibilidad;
    fecha: string | null;
  };
  audiencia?: AudienciaSoporte | null;
  impactos_totales?: number | null;
  alcance_zona_pct?: number | null;
  alcance_nacional_pct?: number | null;
}

export interface ZonaResumen {
  zona: string | null;
  poblacion_total: number | null;
  usuarios_unicos: number | null;
  alcance_pct: number | null;
  frecuencia: number | null;
  impactos_totales: number | null;
  grp: number | null;
  trp: number | null;
  soportes: number | null;
}

// Soportes del circuito medido (77, con audiencia real)
export const soportesCircuito = circuitoRaw.datos as unknown as Soporte[];

// Soportes del inventario MXM (698, con tarifa y disponibilidad)
// Solo exponer los mapeables (lat/lon válidos) para el mapa
export const soportesInventario = (inventarioRaw.datos as unknown as Soporte[])
  .filter(s => s.mapeable !== false);

// Todos los soportes combinados (para listas y búsqueda)
export const todosSoportes: Soporte[] = [
  ...soportesCircuito,
  ...soportesInventario,
];

// Resumen por zona (9 filas: Nacional + Ciudades Pauta + 7 ZM)
export const resumenPorZona = resumenRaw.datos as unknown as ZonaResumen[];

// Constantes del inventario completo MXM (incluye los no mapeables)
export const MXM_TOTAL = inventarioRaw.meta.total_registros;
export const MXM_DISPONIBLES = (inventarioRaw.datos as unknown as Soporte[])
  .filter(s => s.disponibilidad.estado === 'inmediata').length;
export const MXM_OCUPADOS = (inventarioRaw.datos as unknown as Soporte[])
  .filter(s => s.disponibilidad.estado === 'ocupado').length;
export const MXM_DOOH = (inventarioRaw.datos as unknown as Soporte[])
  .filter(s => s.es_digital).length;

// Inventario total del planner: circuito medido + inventario del operador
export const TOTAL_INVENTARIO = soportesCircuito.length + MXM_TOTAL;

// Impactos del soporte más alto del circuito — normaliza el score
export const MAX_IMPACTOS = Math.max(
  ...todosSoportes.map(s => s.impactos_totales ?? 0),
);

// Fila "Nacional" del resumen COMEX: el circuito de referencia del Circuit Builder
export const CIRCUITO_COMEX = resumenPorZona.find(z => z.zona === 'Nacional');

// Zonas metropolitanas (sin los agregados Nacional / Ciudades Pauta)
export const zonasMetropolitanas = resumenPorZona.filter(
  z => z.zona !== 'Nacional' && z.zona !== 'Ciudades Pauta',
);

// OOH Opportunity Score — calcula para un soporte individual
// Score 0–100: verde >70, ámbar 40–70, rojo <40
export function calcularOOHScore(s: Soporte, maxImpactos: number): number {
  const alcance = s.alcance_zona_pct ?? 0;
  const impactos = s.impactos_totales
    ? (s.impactos_totales / maxImpactos) * 100
    : 0;
  const dispScore: Record<EstadoDisponibilidad, number> = {
    inmediata: 100,
    fecha: 60,
    desconocido: 30,
    indefinido: 10,
    ocupado: 0,
  };
  const disponibilidad = dispScore[s.disponibilidad.estado];
  // Los del circuito traen alcance e impactos medidos pero no tarifa;
  // los del inventario traen tarifa pero no medición — score parcial en ambos.
  const score =
    alcance * 0.3 +
    impactos * 0.3 +
    disponibilidad * 0.2 +
    (s.tarifa_publicada_mxn ? Math.min(100, 10_000_000 / s.tarifa_publicada_mxn) : 50) * 0.2;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function colorScore(score: number): string {
  if (score >= 70) return '#22c55e';   // verde
  if (score >= 40) return '#f59e0b';   // ámbar
  return '#ef4444';                     // rojo
}

/** Etiqueta legible del tipo de soporte. */
export const NOMBRE_TIPO: Record<TipoSoporte, string> = {
  cartelera: 'Cartelera',
  cartelera_digital: 'Cartelera digital',
  pantalla_digital: 'Pantalla digital',
  puente: 'Puente',
  muro: 'Muro',
  azotea: 'Azotea',
  tunel: 'Túnel',
  otro: 'Otro',
};

export const NOMBRE_DISPONIBILIDAD: Record<EstadoDisponibilidad, string> = {
  inmediata: 'Inmediata',
  ocupado: 'Ocupado',
  fecha: 'Libera',
  indefinido: 'Indefinido',
  desconocido: 'Sin dato',
};

export const fmtMXN = (v: number): string =>
  `$${Math.round(v).toLocaleString('es-MX')}`;

export const fmtNum = (v: number): string => v.toLocaleString('es-MX');

/** 163854720 → "163.9M" */
export const fmtCorto = (v: number): string => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
};
