// Capa de datos única del front: mock.json (generado por prep_data.py desde
// ./canonical y ./rules) + los cambios del usuario, guardados en
// localStorage. Ningún componente importa mock.json directo — todos pasan
// por los selectores de aquí, para que "Restablecer datos" y el Excel
// importado se vean consistentes en toda la plataforma.
import { useSyncExternalStore } from 'react';
import mockRaw from './mock.json';
import type {
  MockData, Ejercicio, FlowCampana, Version, EstadoVersion, Rol, BitacoraEntry,
} from './types';
import { ACTOR_POR_ROL } from './types';
import { distribuirSemanas } from '../domain/distribuirSemanas';
import { interpolarEscenario } from '../domain/interpolate';
import { MONITOREO, type FilaMonitoreo } from './seed_monitoreo';
import { fmtMXNCorto } from './media';

const mock = mockRaw as unknown as MockData;
export { mock };

const STORAGE_KEY = 'havasdata:overrides';

interface FlowCellOverride { celdas?: Record<number, number>; confirmado?: boolean }
interface EjercicioOverride { exercise?: Partial<Ejercicio['exercise']>; touchpointInversion?: Record<string, number> }

export interface OverridesState {
  ejercicioActivoId: string;
  ejercicioOverrides: Record<string, EjercicioOverride>;
  ejerciciosImportados: Ejercicio[];
  flowOverrides: Record<string, FlowCellOverride>;
  versionesExtra: Version[];
  versionEstados: Record<string, { estado: EstadoVersion; comentario?: string }>;
  rol: Rol;
  bitacora: BitacoraEntry[];
}

const ESTADO_INICIAL: OverridesState = {
  ejercicioActivoId: mock.ejercicios[1]?.id ?? mock.ejercicios[0].id, // el mix más completo, por defecto
  ejercicioOverrides: {},
  ejerciciosImportados: [],
  flowOverrides: {},
  versionesExtra: [],
  versionEstados: {},
  rol: 'ceo',
  bitacora: [],
};

import { ROLES_ACTIVOS } from '../config/roles';

function cargar(): OverridesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ESTADO_INICIAL;
    const data = { ...ESTADO_INICIAL, ...JSON.parse(raw) };
    if (!ROLES_ACTIVOS.includes(data.rol)) {
      data.rol = 'planner';
    }
    return data;
  } catch {
    return ESTADO_INICIAL; // localStorage bloqueado o dato corrupto: arranca limpio
  }
}

function guardar(s: OverridesState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ventana privada / cuota llena: los cambios viven solo en memoria de esta sesión
  }
}

let estado = cargar();
const listeners = new Set<() => void>();
const notificar = () => listeners.forEach(l => l());

function set(patch: Partial<OverridesState>) {
  estado = { ...estado, ...patch };
  guardar(estado);
  notificar();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Hook de lectura: cualquier componente que llame esto se vuelve a pintar en cada cambio del store. */
export function useOverrides(): OverridesState {
  return useSyncExternalStore(subscribe, () => estado, () => estado);
}

export function resetearDatos() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  estado = ESTADO_INICIAL;
  notificar();
}

const horaActual = () => new Date().toTimeString().slice(0, 5);

/** Escribe una línea en la bitácora de actividad, firmada por el rol activo. */
function registrar(mensaje: string) {
  const entry: BitacoraEntry = {
    id: `bit-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
    fecha: new Date().toISOString(),
    autor: ACTOR_POR_ROL[estado.rol],
    rol: estado.rol,
    mensaje,
  };
  // la propia llamada hace `set` después (quien la invoque decide cuándo notificar);
  // aquí solo se acumula para que quede en el mismo patch que el cambio real.
  estado = { ...estado, bitacora: [entry, ...estado.bitacora].slice(0, 200) };
}

export function getBitacora(o: OverridesState, limite = 50): BitacoraEntry[] {
  return o.bitacora.slice(0, limite);
}

export function getMonitoreo(): FilaMonitoreo[] {
  return MONITOREO;
}

// ── Ejercicios (Smart Planner / Spectrum) ──

export function listaEjercicios(o: OverridesState): Ejercicio[] {
  return [...mock.ejercicios, ...o.ejerciciosImportados];
}

export function getEjercicio(o: OverridesState, id: string): Ejercicio {
  const base = listaEjercicios(o).find(e => e.id === id) ?? listaEjercicios(o)[0];
  const patch = o.ejercicioOverrides[base.id];
  if (!patch) return base;

  const exercise = patch.exercise ? { ...base.exercise, ...patch.exercise } : base.exercise;
  let touchpoints = base.touchpoints;
  let totales = base.totales;
  if (patch.touchpointInversion) {
    touchpoints = base.touchpoints.map(t => ({
      ...t, inversion: patch.touchpointInversion![t.nombre] ?? t.inversion,
    }));
    const suma = touchpoints.reduce((s, t) => s + (t.inversion ?? 0), 0);
    touchpoints = touchpoints.map(t => ({ ...t, share_inversion: suma ? (t.inversion ?? 0) / suma : t.share_inversion }));
    totales = { ...base.totales, inversion: suma };
  }
  return { ...base, exercise, touchpoints, totales };
}

export function getEjercicioActivo(o: OverridesState): Ejercicio {
  return getEjercicio(o, o.ejercicioActivoId);
}

export function setEjercicioActivo(id: string) {
  set({ ejercicioActivoId: id });
}

export function updateBriefField<K extends keyof Ejercicio['exercise']>(id: string, field: K, value: Ejercicio['exercise'][K]) {
  const prev = estado.ejercicioOverrides[id] ?? {};
  set({ ejercicioOverrides: { ...estado.ejercicioOverrides, [id]: { ...prev, exercise: { ...prev.exercise, [field]: value } } } });
}

export function updateTouchpointInversion(id: string, nombre: string, inversion: number) {
  const prev = estado.ejercicioOverrides[id] ?? {};
  set({
    ejercicioOverrides: {
      ...estado.ejercicioOverrides,
      [id]: { ...prev, touchpointInversion: { ...prev.touchpointInversion, [nombre]: inversion } },
    },
  });
}

/** Una línea en la bitácora por edición terminada (no por cada tecleo) — se llama al salir del campo. */
export function registrarCambioInversion(nombre: string, anterior: number, nuevo: number) {
  if (anterior === nuevo) return;
  const delta = nuevo - anterior;
  registrar(`${ACTOR_POR_ROL[estado.rol]} ${delta > 0 ? 'subió' : 'bajó'} ${nombre} ${delta > 0 ? '+' : ''}${fmtMXNCorto(delta)}, ${horaActual()}`);
  set({});
}

/** Semáforo de cuadre del mix contra el presupuesto del brief — rojo solo se usa aquí. */
export function semaforoCuadre(ej: Ejercicio): { ok: boolean; pct: number } {
  const presupuesto = ej.exercise.presupuesto ?? 0;
  const inversion = ej.totales.inversion ?? 0;
  if (!presupuesto) return { ok: true, pct: 0 };
  const pct = Math.abs(inversion - presupuesto) / presupuesto;
  return { ok: pct <= 0.005, pct };
}

export function importarEjercicio(ejercicio: Ejercicio) {
  registrar(`${ACTOR_POR_ROL[estado.rol]} importó "${ejercicio.fuente_archivo}", ${horaActual()}`);
  set({
    ejerciciosImportados: [...estado.ejerciciosImportados, ejercicio],
    ejercicioActivoId: ejercicio.id,
  });
}

// ── Flowchart (grid medio × semana) ──

const flowKey = (campanaId: string, medio: string) => `${campanaId}::${medio}`;

export function listaCampanasFlow(): FlowCampana[] {
  return mock.flow.campanas;
}

export interface FilaFlow { valores: number[]; confirmado: boolean; sinPatron: boolean; total: number }

export function getFilaFlow(o: OverridesState, campanaId: string, medio: string): FilaFlow {
  const campana = mock.flow.campanas.find(c => c.id === campanaId);
  const m = campana?.medios.find(x => x.medio === medio);
  if (!campana || !m) return { valores: [], confirmado: true, sinPatron: false, total: 0 };

  const { valores: base, sinPatron } = distribuirSemanas(
    m.inversion_total, mock.flow.calendario.length, m.patron_normalizado, m.niveles,
  );
  const ov = o.flowOverrides[flowKey(campanaId, medio)];
  const valores = ov?.celdas ? base.map((v, i) => ov.celdas![i] ?? v) : base;
  const confirmado = ov?.confirmado ?? !sinPatron;
  return { valores, confirmado, sinPatron, total: m.inversion_total };
}

export function setCeldaFlow(campanaId: string, medio: string, semanaIdx: number, valor: number) {
  const key = flowKey(campanaId, medio);
  const prev = estado.flowOverrides[key] ?? {};
  set({ flowOverrides: { ...estado.flowOverrides, [key]: { ...prev, celdas: { ...prev.celdas, [semanaIdx]: valor }, confirmado: true } } });
}

export function confirmarFilaFlow(campanaId: string, medio: string) {
  const key = flowKey(campanaId, medio);
  const prev = estado.flowOverrides[key] ?? {};
  registrar(`${ACTOR_POR_ROL[estado.rol]} confirmó el reparto de ${medio}, ${horaActual()}`);
  set({ flowOverrides: { ...estado.flowOverrides, [key]: { ...prev, confirmado: true } } });
}

/** Una línea en la bitácora por edición de celda terminada (no por cada tecleo). */
export function registrarCambioFlow(medio: string, anterior: number, nuevo: number) {
  if (anterior === nuevo) return;
  const delta = nuevo - anterior;
  registrar(`${ACTOR_POR_ROL[estado.rol]} ${delta > 0 ? 'subió' : 'bajó'} una semana de ${medio} ${delta > 0 ? '+' : ''}${fmtMXNCorto(delta)}, ${horaActual()}`);
  set({});
}

// ── Versiones / Centro de Aprobaciones ──

export function listaVersiones(o: OverridesState): Version[] {
  return [...mock.versiones, ...o.versionesExtra].map(v => {
    const ov = o.versionEstados[v.id];
    return ov ? { ...v, estado: ov.estado, comentarioResolucion: ov.comentario ?? v.comentarioResolucion } : v;
  });
}

/** Congela el mix actual (con overrides ya aplicados) — la versión no se mueve si el ejercicio se sigue editando después. */
export function crearVersionEjercicio(input: { ejercicioBaseId: string; etiqueta: string; motivo: string; autor: string; factorPresupuesto: number }): Version {
  const base = getEjercicio(estado, input.ejercicioBaseId);
  const interpolado = input.factorPresupuesto === 1 ? null : interpolarEscenario(base.escenarios, input.factorPresupuesto);
  const deltaInversion = (interpolado ? interpolado.presupuesto_total : base.totales.inversion ?? 0) - (base.exercise.presupuesto ?? 0);
  const version: Version = {
    id: `v-${Date.now()}`,
    origen: interpolado ? 'simulado' : base.origen,
    ejercicio_base_id: base.id,
    etiqueta: input.etiqueta,
    motivo: input.motivo,
    autor: input.autor,
    rol: estado.rol,
    fecha: new Date().toISOString().slice(0, 10),
    hora: horaActual(),
    estado: 'pendiente',
    factor_presupuesto: input.factorPresupuesto,
    delta_inversion: deltaInversion,
    snapshot_touchpoints: base.touchpoints.map(t => ({ nombre: t.nombre, inversion: t.inversion ?? 0 })),
    interpolado,
  };
  registrar(`${ACTOR_POR_ROL[estado.rol]} guardó la versión "${input.etiqueta}" (${deltaInversion >= 0 ? '+' : ''}${fmtMXNCorto(deltaInversion)}), ${horaActual()}`);
  set({ versionesExtra: [...estado.versionesExtra, version] });
  return version;
}

/** Versión del Flowchart: congela el reparto semanal actual de cada medio de la campaña. */
export function crearVersionFlow(input: { campanaId: string; etiqueta: string; motivo: string; autor: string }): Version {
  const campana = mock.flow.campanas.find(c => c.id === input.campanaId)!;
  const snapshot_semanas: Record<string, number[]> = {};
  for (const m of campana.medios) snapshot_semanas[m.medio] = getFilaFlow(estado, input.campanaId, m.medio).valores;
  const totalSnapshot = Object.values(snapshot_semanas).flat().reduce((s, v) => s + v, 0);
  const totalBase = campana.medios.reduce((s, m) => s + m.inversion_total, 0);
  const version: Version = {
    id: `v-${Date.now()}`,
    origen: 'real',
    ejercicio_base_id: null,
    flow_campana_id: input.campanaId,
    etiqueta: input.etiqueta,
    motivo: input.motivo,
    autor: input.autor,
    rol: estado.rol,
    fecha: new Date().toISOString().slice(0, 10),
    hora: horaActual(),
    estado: 'pendiente',
    factor_presupuesto: 1,
    delta_inversion: totalSnapshot - totalBase,
    snapshot_semanas,
    interpolado: null,
  };
  registrar(`${ACTOR_POR_ROL[estado.rol]} guardó la versión "${input.etiqueta}" del Flowchart, ${horaActual()}`);
  set({ versionesExtra: [...estado.versionesExtra, version] });
  return version;
}

export function setEstadoVersion(id: string, nuevoEstado: EstadoVersion, comentario?: string) {
  const v = listaVersiones(estado).find(x => x.id === id);
  registrar(`${ACTOR_POR_ROL[estado.rol]} ${nuevoEstado === 'aprobada' ? 'aprobó' : 'rechazó'} "${v?.etiqueta ?? id}"${comentario ? ` — "${comentario}"` : ''}, ${horaActual()}`);
  set({ versionEstados: { ...estado.versionEstados, [id]: { estado: nuevoEstado, comentario } } });
}

/** "Restaurar esta versión": crea una versión NUEVA con el mismo contenido — nunca borra ni pisa la anterior. */
export function restaurarVersion(id: string): Version {
  const v = listaVersiones(estado).find(x => x.id === id)!;
  const version: Version = {
    ...v,
    id: `v-${Date.now()}`,
    etiqueta: `${v.etiqueta} (restaurada)`,
    motivo: `Restaurada desde "${v.etiqueta}"`,
    autor: ACTOR_POR_ROL[estado.rol],
    rol: estado.rol,
    fecha: new Date().toISOString().slice(0, 10),
    hora: horaActual(),
    estado: 'pendiente',
    comentarioResolucion: undefined,
    restaurada_de: v.id,
  };
  registrar(`${ACTOR_POR_ROL[estado.rol]} restauró la versión "${v.etiqueta}", ${horaActual()}`);
  set({ versionesExtra: [...estado.versionesExtra, version] });
  return version;
}

// ── Rol (filtra el menú; sin permisos reales de verdad) ──

export function setRol(rol: Rol) {
  set({ rol });
}
