// Formas de mock.json (prep_data.py) y del store. Cada dato lleva `origen`:
// 'real' (sale de un archivo procesado), 'importado' (lo cargó el usuario por
// Excel) o 'simulado' (prep_data.py lo calculó con factores fijos).
export type Origen = 'real' | 'importado' | 'simulado';

export interface Curva { param_a: number; param_b: number; param_c: number }

export interface Touchpoint {
  nombre: string;
  color: string | null;
  inversion: number | null;
  share_inversion: number | null;
  grps: number | null;
  impactos_miles: number | null;
  share_impactos: number | null;
  alcance: number | null;
  frecuencia: number | null;
  costo_por_punto_alcance: number | null;
  cpgrp: number | null;
  cpm: number | null;
  cpgrp_input: number | null;
  cpm_input: number | null;
  restriccion_min: number | null;
  restriccion_max: number | null;
  curva: Curva | null;
}

export interface Exercise {
  pais: string | null;
  industria: string | null;
  anunciante: string | null;
  marca: string | null;
  campana: string | null;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  presupuesto: number | null;
  moneda: string | null;
  target: string | null;
  target_descripcion: string | null;
  genero: string | null;
  edad_min: number | null;
  edad_max: number | null;
  universo: number | null;
  semanas: number | null;
}

export interface Totales {
  inversion: number | null;
  grps: number | null;
  impactos_miles: number | null;
  alcance_neto: number | null;
  frecuencia: number | null;
  costo_por_punto_alcance: number | null;
  cpgrp: number | null;
  cpm: number | null;
}

export interface AlcancePorFrecuencia { touchpoint: string; [f: `f${number}`]: number | string }

export interface EscenarioTouchpoint { touchpoint: string; inversion: number; grps: number; impactos_miles: number; alcance: number }
export interface Escenario {
  indice?: number;
  factor_presupuesto: number;
  presupuesto_total: number;
  por_touchpoint: EscenarioTouchpoint[];
  totales: { grps: number; impactos_miles: number; alcance: number };
}

export interface Validacion { regla: string; nivel: 'ok' | 'warning' | 'error'; mensaje: string; detalle: unknown[] }

export interface Ejercicio {
  id: string;
  origen: Origen;
  fuente_archivo: string;
  herramienta: string;
  subtipo: string | null;
  exercise: Exercise;
  touchpoints: Touchpoint[];
  totales: Totales;
  alcance_por_frecuencia: AlcancePorFrecuencia[] | null;
  duplicaciones: { touchpoint_a: string; touchpoint_b: string; indice: number }[] | null;
  escenarios: Escenario[] | null;
  validaciones: Validacion[] | null;
}

export interface SemanaCalendario { semana: number; fecha: string; columna: string; mes: string | null; trimestre: string | null }

export interface NivelesPresion { lanzamiento: number | null; mantenimiento: number | null; minimo: number | null }

export interface FlowMedio {
  medio: string;
  inversion_total: number;
  patron_normalizado: string | null;
  niveles: NivelesPresion | null;
}

export interface FlowCampana {
  id: string;
  categoria: string | null;
  campana: string;
  medios: FlowMedio[];
}

export interface Flow {
  origen: Origen;
  fuente_archivo: string;
  calendario: SemanaCalendario[];
  medios: string[];
  campanas: FlowCampana[];
}

export interface Marca {
  id: string;
  nombre: string;
  origen: Origen;
  ejercicio_id?: string;
  basado_en_ejercicio_id?: string;
  factor_vs_base?: number;
  presupuesto: number;
}

export type EstadoVersion = 'pendiente' | 'aprobada' | 'rechazada';

export interface Version {
  id: string;
  origen: Origen;
  /** De qué se guardó la versión: un ejercicio (Mesa de Planeación) o una campaña del Flow (Flowchart). */
  ejercicio_base_id: string | null;
  flow_campana_id?: string | null;
  etiqueta: string;
  motivo: string;
  autor: string;
  rol?: Rol;
  fecha: string;
  /** Hora exacta "HH:MM", aparte de `fecha` para que la línea de tiempo la muestre sin reparsear. */
  hora?: string;
  estado: EstadoVersion;
  /** Comentario al aprobar/rechazar (Centro de Aprobaciones). */
  comentarioResolucion?: string;
  factor_presupuesto: number;
  /** $ que cambia esta versión vs. la base — lo que pinta verde/gris en la línea de tiempo. */
  delta_inversion?: number;
  /** Si viene de "restaurar" otra versión, el id de esa versión. */
  restaurada_de?: string;
  /** Congelado al momento de guardar — la versión no se mueve aunque el ejercicio se siga editando después. */
  snapshot_touchpoints?: { nombre: string; inversion: number }[];
  snapshot_semanas?: Record<string, number[]>; // medio -> valores por semana (versiones de Flowchart)
  interpolado: {
    factor_presupuesto: number;
    presupuesto_total: number;
    por_touchpoint: EscenarioTouchpoint[];
    totales: { grps: number; impactos_miles: number; alcance: number };
  } | null;
}

/** Una línea de la bitácora de actividad — "Ana (Planner) subió TV Abierta +$2M, 14:32". */
export interface BitacoraEntry {
  id: string;
  fecha: string;   // ISO datetime completo
  autor: string;
  rol: Rol;
  mensaje: string;
}

export interface Desviacion { campana: string; categoria: string | null; origen: Origen; planeado: number; real: number; delta_pct: number }
export interface PresupuestoMarca { marca_id: string; origen: Origen; autorizado_origen: Origen; autorizado: number; comprometido: number; ejecutado: number }
export interface Compromiso { campana: string; medio: string; proveedor: string; origen: Origen; monto: number; facturado: boolean }
export interface ResultadoCanal { marca_id: string; canal: string; origen: Origen; planeado: number; real: number }

export interface Simulado {
  desviaciones: Desviacion[];
  presupuesto: PresupuestoMarca[];
  compromisos: Compromiso[];
  resultados: ResultadoCanal[];
}

export interface MockData {
  meta: { generado_en: string; fuentes: string[] };
  ejercicios: Ejercicio[];
  flow: Flow;
  marcas: Marca[];
  versiones: Version[];
  simulado: Simulado;
}

// ── Roles (config/menu.ts trae las vistas; esto solo dice cuáles ve cada rol) ──
export type Rol = 'ceo' | 'planner' | 'cliente';
export const VISTAS_POR_ROL: Record<Rol, string[]> = {
  ceo: ['ejecutiva', 'flowchart', 'presupuesto', 'resultados', 'widgets'],
  planner: ['planeacion', 'flowchart', 'aprobaciones', 'presupuesto', 'widgets'],
  cliente: ['cliente', 'flowchart', 'aprobaciones', 'resultados'],
};
export const NOMBRE_ROL: Record<Rol, string> = { ceo: 'CEO', planner: 'Planner', cliente: 'Cliente' };

// Identidad simulada para la bitácora y las versiones — no hay login real,
// pero cada rol firma sus cambios con un nombre reconocible ("Ana (Planner)").
export const ACTOR_POR_ROL: Record<Rol, string> = {
  ceo: 'Luis (CEO)', planner: 'Ana (Planner)', cliente: 'Equipo Cliente',
};
export const INICIALES_POR_ROL: Record<Rol, string> = { ceo: 'LU', planner: 'AN', cliente: 'EQ' };
