// Importa un Excel de Smart Planner o Spectrum, 100% en el navegador (SheetJS).
// Misma lógica de detección y mapeo que parse_optimizer.py, con un alcance
// más chico: solo las hojas que pide el importador (Exercise, Media Mix
// table, Reach & Frequency, Budget Scenarios / la hoja única de Spectrum).
// Los Flow no se reconocen aquí — se cargan con prep_data.py.
import * as XLSX from 'xlsx';
import type { Ejercicio, Escenario, EscenarioTouchpoint, Exercise, Touchpoint, Validacion } from './types';

type Fila = (string | number | Date | null)[];
type Hoja = Fila[];

const num = (v: unknown): number | null => {
  if (typeof v === 'number') return v;
  if (v instanceof Date) return null;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};
const txt = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s || null;
};

export interface ResultadoImportacion {
  ejercicio: Ejercicio | null;
  validaciones: Validacion[];
  error: string | null; // formato no reconocido u otro fallo antes de poder validar
}

function leerHojas(buf: ArrayBuffer): Record<string, Hoja> {
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const hojas: Record<string, Hoja> = {};
  for (const nombre of wb.SheetNames) {
    hojas[nombre] = XLSX.utils.sheet_to_json<Fila>(wb.Sheets[nombre], { header: 1, raw: true, defval: null });
  }
  return hojas;
}

function detectar(hojas: Record<string, Hoja>): 'smart_planner' | 'spectrum' | 'unknown' {
  const nombres = Object.keys(hojas);
  if (nombres.includes('Exercise') && nombres.includes('Media Mix table')) return 'smart_planner';
  if (nombres.length === 1) {
    const filas = hojas[nombres[0]];
    // "Application:" y "Havas Spectrum" vienen en columnas separadas (A1, B1).
    const fila1 = (filas[0] ?? []).filter(v => v !== null).join(' ');
    if (/Application:\s*Havas Spectrum/i.test(fila1) && filas.length >= 3) return 'spectrum';
  }
  return 'unknown';
}

// ── Smart Planner ──

function parseExercise(filas: Hoja): Exercise {
  const ex: Exercise = {
    pais: null, industria: null, anunciante: null, marca: null, campana: null,
    periodo_inicio: null, periodo_fin: null, presupuesto: null, moneda: null,
    target: null, target_descripcion: null, genero: null, edad_min: null, edad_max: null,
    universo: null, semanas: null,
  };
  const EX_KEYS: Record<string, keyof Exercise> = {
    country: 'pais', industry: 'industria', advertiser: 'anunciante', brand: 'marca', campaign: 'campana',
    budget: 'presupuesto', currency: 'moneda', target: 'target', 'target description': 'target_descripcion',
    gender: 'genero', 'target size': 'universo',
  };
  for (const fila of filas) {
    const i = fila.findIndex(v => v !== null && v !== '');
    const clave = txt(fila[i]);
    if (i < 0 || !clave || !clave.trim().endsWith(':')) continue;
    const key = clave.trim().replace(/:$/, '').trim().toLowerCase();
    const val = fila[i + 1];
    if (key === 'campaign period') {
      const partes = String(val ?? '').split(',').map(s => s.trim());
      if (partes.length === 2) { ex.periodo_inicio = partes[0]; ex.periodo_fin = partes[1]; }
    } else if (key === 'age') {
      const partes = String(val ?? '').split(',').map(s => num(s.trim()));
      if (partes.length === 2) { ex.edad_min = partes[0]; ex.edad_max = partes[1]; }
    } else if (key in EX_KEYS) {
      const campo = EX_KEYS[key];
      (ex[campo] as string | number | null) = campo === 'presupuesto' || campo === 'universo' ? num(val) : txt(val) ?? String(val ?? '');
    }
  }
  return ex;
}

const MMT_COLS: (keyof Touchpoint)[] = [
  'inversion', 'share_inversion', 'grps', 'impactos_miles', 'share_impactos', 'alcance', 'frecuencia',
  'costo_por_punto_alcance', 'cpgrp', 'cpm',
];

function vacioTouchpoint(nombre: string): Touchpoint {
  return {
    nombre, color: null, inversion: null, share_inversion: null, grps: null, impactos_miles: null,
    share_impactos: null, alcance: null, frecuencia: null, costo_por_punto_alcance: null, cpgrp: null,
    cpm: null, cpgrp_input: null, cpm_input: null, restriccion_min: null, restriccion_max: null, curva: null,
  };
}

function parseMediaMix(filas: Hoja): { touchpoints: Touchpoint[]; totales: Ejercicio['totales'] } {
  const cuerpo = filas.slice(1);
  const touchpoints: Touchpoint[] = [];
  let totales: Ejercicio['totales'] = {
    inversion: null, grps: null, impactos_miles: null, alcance_neto: null, frecuencia: null,
    costo_por_punto_alcance: null, cpgrp: null, cpm: null,
  };
  for (const fila of cuerpo) {
    const nombre = txt(fila[0]);
    if (!nombre) continue;
    const vals = MMT_COLS.reduce((acc, campo, i) => ({ ...acc, [campo]: num(fila[i + 1]) }), {} as Record<string, number | null>);
    if (nombre.toLowerCase() === 'total') {
      totales = {
        inversion: vals.inversion, grps: vals.grps, impactos_miles: vals.impactos_miles,
        alcance_neto: vals.alcance, frecuencia: vals.frecuencia, costo_por_punto_alcance: vals.costo_por_punto_alcance,
        cpgrp: vals.cpgrp, cpm: vals.cpm,
      };
    } else {
      touchpoints.push({ ...vacioTouchpoint(nombre), ...vals });
    }
  }
  return { touchpoints, totales };
}

function parseReachFrequency(filas: Hoja): Record<string, Record<string, number | null>> {
  const out: Record<string, Record<string, number | null>> = {};
  for (const fila of filas.slice(1)) {
    const nombre = txt(fila[0]);
    if (!nombre) continue;
    const serie: Record<string, number | null> = {};
    for (let k = 1; k <= 10; k++) serie[`f${k}`] = num(fila[k]);
    out[nombre] = serie;
  }
  return out;
}

/** Budget Scenarios simplificado: el orden de touchpoints sale de los encabezados `budget_<TP>`
 * (no se cruzan valores contra Media Mix como en parse_optimizer.py — limitación conocida del
 * importador en navegador, documentada en el reporte final). */
function parseBudgetScenarios(filas: Hoja, n: number): { escenarios: Escenario[] | null; validacion: Validacion } {
  if (filas.length < 2) return { escenarios: null, validacion: { regla: 'escenarios_ancho', nivel: 'warning', mensaje: 'sin hoja Budget Scenarios', detalle: [] } };
  const header = filas[0];
  const ancho = Math.max(...filas.map(f => f.length));
  if (ancho !== 5 + 5 * n) {
    return {
      escenarios: null,
      validacion: { regla: 'escenarios_ancho', nivel: 'error', detalle: [],
        mensaje: `ancho ${ancho} no cuadra con 5 + 5*N (N=${n} touchpoints ⇒ ${5 + 5 * n}); no se importan los escenarios` },
    };
  }
  const orden = Array.from({ length: n }, (_, j) => txt(header[1 + j])?.replace(/^[^_]*_/, '') ?? `TP${j}`);
  const col = (b: number, j: number) => b * (n + 1) + 1 + j;
  const escenarios: Escenario[] = [];
  for (const fila of filas.slice(1)) {
    const total = num(fila[0]);
    if (total === null) continue;
    const porTouchpoint: EscenarioTouchpoint[] = orden.map((nombre, j) => ({
      touchpoint: nombre,
      inversion: num(fila[col(0, j)]) ?? 0,
      grps: num(fila[col(1, j)]) ?? 0,
      impactos_miles: num(fila[col(2, j)]) ?? 0,
      alcance: num(fila[col(4, j)]) ?? 0,
    }));
    escenarios.push({
      factor_presupuesto: 0, // se recalcula al confirmar, contra el presupuesto ya parseado del Exercise
      presupuesto_total: total,
      por_touchpoint: porTouchpoint,
      totales: { grps: num(fila[n + 1]) ?? 0, impactos_miles: num(fila[2 * (n + 1)]) ?? 0, alcance: num(fila[4 * (n + 1)]) ?? 0 },
    });
  }
  return { escenarios, validacion: { regla: 'escenarios_ancho', nivel: 'ok', mensaje: `ancho ${ancho} = 5 + 5*${n}`, detalle: [] } };
}

function validarSmartPlanner(ex: Exercise, touchpoints: Touchpoint[], totales: Ejercicio['totales']): Validacion[] {
  const v: Validacion[] = [];
  const suma = touchpoints.reduce((s, t) => s + (t.inversion ?? 0), 0);
  if (ex.presupuesto) {
    const pct = Math.abs(suma - ex.presupuesto) / ex.presupuesto;
    v.push({ regla: 'inversion_vs_presupuesto', nivel: pct <= 0.005 ? 'ok' : 'error', detalle: [],
      mensaje: pct <= 0.005 ? 'la suma por touchpoint cuadra con el presupuesto' : `suma ${suma.toLocaleString()} vs presupuesto ${ex.presupuesto.toLocaleString()}` });
  }
  const sumaShare = touchpoints.reduce((s, t) => s + (t.share_inversion ?? 0), 0);
  if (touchpoints.some(t => t.share_inversion !== null)) {
    v.push({ regla: 'share_inversion_suma_1', nivel: Math.abs(sumaShare - 1) <= 0.01 ? 'ok' : 'warning', detalle: [],
      mensaje: `share_inversion suma ${sumaShare.toFixed(3)}` });
  }
  if (totales.inversion && ex.presupuesto) {
    const pct = Math.abs(totales.inversion - ex.presupuesto) / ex.presupuesto;
    v.push({ regla: 'total_vs_presupuesto', nivel: pct <= 0.005 ? 'ok' : 'error', detalle: [],
      mensaje: pct <= 0.005 ? 'el total de Media Mix cuadra con el presupuesto' : `total ${totales.inversion.toLocaleString()} vs presupuesto ${ex.presupuesto.toLocaleString()}` });
  }
  return v;
}

const CAMPO_LABEL: Record<string, string> = {
  anunciante: 'anunciante', marca: 'marca', campana: 'campaña', periodo_inicio: 'periodo de inicio',
  periodo_fin: 'periodo de fin', target: 'target', universo: 'universo', presupuesto: 'presupuesto',
};

/** Checks pensados para quien llena el Excel a mano: celdas vacías, números en negativo, brief incompleto. */
function validarCompletitud(ex: Exercise, touchpoints: Touchpoint[]): Validacion[] {
  const v: Validacion[] = [];

  const faltantes = (['anunciante', 'marca', 'campana', 'periodo_inicio', 'periodo_fin', 'target', 'presupuesto'] as const)
    .filter(c => ex[c] === null || ex[c] === '');
  v.push(faltantes.length
    ? { regla: 'brief_completo', nivel: 'warning', detalle: faltantes,
        mensaje: `¿Seguro? Falta capturar en el Exercise: ${faltantes.map(c => CAMPO_LABEL[c]).join(', ')}.` }
    : { regla: 'brief_completo', nivel: 'ok', mensaje: 'el brief llegó completo', detalle: [] });

  const sinInversion = touchpoints.filter(t => t.inversion === null || t.inversion === 0).map(t => t.nombre);
  if (sinInversion.length) {
    v.push({ regla: 'touchpoints_sin_inversion', nivel: 'warning', detalle: sinInversion,
      mensaje: `Ojo, vimos ${sinInversion.length} touchpoint(s) sin inversión capturada: ${sinInversion.join(', ')}. ¿Va así o faltó llenar la celda?` });
  }

  const negativos = touchpoints.filter(t => (t.inversion ?? 0) < 0).map(t => t.nombre);
  if (negativos.length) {
    v.push({ regla: 'inversion_negativa', nivel: 'warning', detalle: negativos,
      mensaje: `Vimos inversión en negativo en: ${negativos.join(', ')}. Revisa el signo antes de continuar.` });
  }

  for (const [campo, etiqueta] of [['grps', 'GRPs'], ['alcance', 'alcance'], ['share_inversion', 'share']] as const) {
    const algunLleno = touchpoints.some(t => t[campo] !== null);
    const vacios = touchpoints.filter(t => t[campo] === null).map(t => t.nombre);
    if (algunLleno && vacios.length) {
      v.push({ regla: `${campo}_incompleto`, nivel: 'warning', detalle: vacios,
        mensaje: `Vimos celdas vacías de ${etiqueta} en: ${vacios.join(', ')} — el Media Mix table no quedó parejo, revísalo.` });
    }
  }

  return v;
}

function validarContraFlow(touchpoints: Touchpoint[], mediosFlow: string[]): Validacion {
  const norm = (s: string) => s.trim().toLowerCase();
  const flowSet = new Set(mediosFlow.map(norm));
  const coincide = touchpoints.some(t => flowSet.has(norm(t.nombre)));
  return coincide
    ? { regla: 'touchpoints_vs_flow', nivel: 'ok', mensaje: 'algunos touchpoints coinciden con los medios del Flow', detalle: [] }
    : { regla: 'touchpoints_vs_flow', nivel: 'warning', detalle: [],
        mensaje: 'los touchpoints no coinciden con los medios del Flow — se muestran tal cual, sin mapear; falta la tabla de equivalencias' };
}

// ── Spectrum ──

function parseSpectrum(filas: Hoja): { subtipo: 'allocation' | 'plan_reach' | null; exercise: Exercise; touchpoints: Touchpoint[]; alcanceNeto: number | null } {
  const titulo = String(filas[2]?.filter(v => v !== null).join(' ') ?? '').replace(/^\s*Title:\s*/i, '');
  const subtipo = /^allocation\b/i.test(titulo) ? 'allocation' : /^plan reach\b/i.test(titulo) ? 'plan_reach' : null;
  const rest = titulo.replace(/^(allocation|plan reach)\s*/i, '').trim();
  const inner = rest.match(/^\((.*)\)$/);
  const ex: Exercise = {
    pais: null, industria: null, anunciante: null, marca: null, campana: null, periodo_inicio: null,
    periodo_fin: null, presupuesto: null, moneda: null, target: null, target_descripcion: null, genero: null,
    edad_min: null, edad_max: null, universo: null, semanas: null,
  };
  if (inner) {
    const partes = inner[1].split(',').map(s => s.trim());
    const semanas = partes.find(p => /^\d+\s*(weeks?|semanas?)$/i.test(p));
    if (semanas) { ex.semanas = Number(semanas.match(/\d+/)![0]); partes.splice(partes.indexOf(semanas), 1); }
    if (partes.length === 3) [ex.anunciante, ex.campana, ex.target] = partes;
  } else if (rest) {
    ex.campana = rest;
  }
  const touchpoints: Touchpoint[] = [];
  let alcanceNeto: number | null = null;
  for (const fila of filas.slice(5)) {
    const nombre = txt(fila[0]);
    const valor = num(fila[1]);
    if (!nombre) continue;
    if (subtipo === 'plan_reach' && nombre.toLowerCase() === 'net campaign reach') {
      alcanceNeto = valor;
      continue; // total de la campaña, no es un touchpoint
    }
    const tp = vacioTouchpoint(nombre);
    if (subtipo === 'plan_reach') tp.alcance = valor; else tp.inversion = valor;
    touchpoints.push(tp);
  }
  return { subtipo, exercise: ex, touchpoints, alcanceNeto };
}

// ── Entrada pública ──

export async function importarExcel(file: File, mediosFlow: string[]): Promise<ResultadoImportacion> {
  let hojas: Record<string, Hoja>;
  try {
    hojas = leerHojas(await file.arrayBuffer());
  } catch (e) {
    return { ejercicio: null, validaciones: [], error: `No se pudo leer el archivo: ${(e as Error).message}` };
  }

  const tipo = detectar(hojas);
  if (tipo === 'unknown') {
    return { ejercicio: null, validaciones: [], error: 'Formato no reconocido; los Flows se cargan con prep_data.py.' };
  }

  const id = `importado-${Date.now()}`;
  if (tipo === 'smart_planner') {
    const exercise = parseExercise(hojas['Exercise']);
    const { touchpoints, totales } = parseMediaMix(hojas['Media Mix table']);
    const rf = hojas['Reach & Frequency'] ? parseReachFrequency(hojas['Reach & Frequency']) : {};
    const alcance_por_frecuencia = Object.entries(rf).map(([touchpoint, serie]) => ({ touchpoint, ...serie }));
    const { escenarios, validacion: valAncho } = parseBudgetScenarios(hojas['Budget Scenarios'] ?? [], touchpoints.length);
    const escenariosConFactor = escenarios && exercise.presupuesto
      ? escenarios.map(e => ({ ...e, factor_presupuesto: Math.round((e.presupuesto_total / exercise.presupuesto!) * 100) / 100 }))
      : escenarios;

    const validaciones = [
      ...validarSmartPlanner(exercise, touchpoints, totales),
      valAncho,
      validarContraFlow(touchpoints, mediosFlow),
      ...validarCompletitud(exercise, touchpoints),
    ];
    const ejercicio: Ejercicio = {
      id, origen: 'importado', fuente_archivo: file.name, herramienta: 'smart_planner', subtipo: null,
      exercise, touchpoints, totales, alcance_por_frecuencia, duplicaciones: null,
      escenarios: escenariosConFactor, validaciones,
    };
    return { ejercicio, validaciones, error: null };
  }

  // Spectrum
  const nombreHoja = Object.keys(hojas)[0];
  const { subtipo, exercise, touchpoints, alcanceNeto } = parseSpectrum(hojas[nombreHoja]);
  const campo = subtipo === 'plan_reach' ? 'alcance' : 'inversion';
  const vacios = touchpoints.filter(t => t[campo] === null).map(t => t.nombre);
  const negativos = touchpoints.filter(t => (t[campo] ?? 0) < 0).map(t => t.nombre);
  const validaciones: Validacion[] = [
    subtipo
      ? { regla: 'formato', nivel: 'ok', mensaje: `Spectrum (${subtipo})`, detalle: [] }
      : { regla: 'formato', nivel: 'warning', mensaje: 'no se identificó el subtipo (Allocation / Plan reach) en el título', detalle: [] },
    validarContraFlow(touchpoints, mediosFlow),
    ...(vacios.length ? [{ regla: 'touchpoints_sin_dato', nivel: 'warning' as const, detalle: vacios,
      mensaje: `Vimos ${vacios.length} touchpoint(s) sin ${campo === 'alcance' ? 'alcance' : 'inversión'}: ${vacios.join(', ')}. ¿Va así o faltó llenar la celda?` }] : []),
    ...(negativos.length ? [{ regla: 'valor_negativo', nivel: 'warning' as const, detalle: negativos,
      mensaje: `Ojo, hay valores en negativo en: ${negativos.join(', ')}.` }] : []),
  ];
  const ejercicio: Ejercicio = {
    id, origen: 'importado', fuente_archivo: file.name, herramienta: 'spectrum', subtipo,
    exercise, touchpoints, totales: {
      inversion: subtipo === 'allocation' ? touchpoints.reduce((s, t) => s + (t.inversion ?? 0), 0) : null,
      grps: null, impactos_miles: null, alcance_neto: alcanceNeto, frecuencia: null, costo_por_punto_alcance: null, cpgrp: null, cpm: null,
    },
    alcance_por_frecuencia: null, duplicaciones: null, escenarios: null, validaciones,
  };
  return { ejercicio, validaciones, error: null };
}
