// Métricas calculadas sobre una fila de monitoreo — funciones puras, sin
// estado, para que Flowchart, Control Presupuestal y los insights usen
// siempre la misma cuenta.
import type { FilaMonitoreo, SemanaCalendario } from './types';

export const esFalla = (f: FilaMonitoreo) => f.monitoreo === 'No transmitido' || f.monitoreo.startsWith('Fuera de horario');
export const esNoTransmitido = (f: FilaMonitoreo) => f.monitoreo === 'No transmitido';

/** inversión real: 0 en "No transmitido" (no se pagó lo que no salió al aire); el resto, la planeada. */
export const inversionReal = (f: FilaMonitoreo) => (esNoTransmitido(f) ? 0 : f.inversion_plan);

export const cumplimientoPct = (f: FilaMonitoreo) => (f.trp_plan ? (f.trp_real / f.trp_plan) * 100 : 0);

export const cprpPlan = (f: FilaMonitoreo) => (f.trp_plan ? f.inversion_plan / f.trp_plan : null);

/** null cuando trp_real = 0 (no hay CPRP real posible) — esa fila va "a reclamar" por el monto completo. */
export const cprpReal = (f: FilaMonitoreo) => (f.trp_real ? inversionReal(f) / f.trp_real : null);

export const montoAReclamar = (f: FilaMonitoreo) => (esNoTransmitido(f) ? f.inversion_plan : 0);

export type NivelSemaforo = 'verde' | 'ambar' | 'rojo';

/** Verde ≥95%, ámbar 80–95%, rojo <80% o falla de testigo (No transmitido / Fuera de horario). */
export function semaforoFila(f: FilaMonitoreo): NivelSemaforo {
  if (esFalla(f)) return 'rojo';
  const pct = cumplimientoPct(f);
  if (pct >= 95) return 'verde';
  if (pct >= 80) return 'ambar';
  return 'rojo';
}

export const COLOR_SEMAFORO: Record<NivelSemaforo, string> = { verde: '#10B981', ambar: '#F59E0B', rojo: '#EF4444' };
export const LABEL_SEMAFORO: Record<NivelSemaforo, string> = { verde: 'Cumple', ambar: 'En riesgo', rojo: 'Falla' };

export function dineroEnRiesgo(filas: FilaMonitoreo[]): number {
  return filas.filter(esFalla).reduce((s, f) => s + f.inversion_plan, 0);
}

// ── Fallas de testigo proyectadas sobre el grid del Flowchart ──
// seed_monitoreo.ts ahora cubre el mismo año que el Flow (dic 2024–dic
// 2025), así que el cruce es por fecha real: a qué semana del calendario
// cae cada fila de monitoreo, y esa semana es la que se marca en la celda
// del medio correspondiente.

/** "dd/mm/yyyy" o "dd-dd/mm/yyyy" (Digital, quincenal — usa el primer día) → Date. */
function parseFechaMonitoreo(fecha: string): Date | null {
  const m = fecha.match(/^(\d{2})(?:-\d{2})?\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

/** Índice de semana (0-based, como las filas del Flowchart) a la que cae una fecha de monitoreo. */
export function semanaIndexDeFecha(fechaMonitoreo: string, calendario: SemanaCalendario[]): number | null {
  const fecha = parseFechaMonitoreo(fechaMonitoreo);
  if (!fecha) return null;
  for (let i = 0; i < calendario.length; i++) {
    const inicio = new Date(calendario[i].fecha);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    if (fecha >= inicio && fecha <= fin) return i;
  }
  return null;
}

export interface FallaTestigoCelda { tipo: 'no_transmitido' | 'fuera_de_horario'; monto: number; fila: FilaMonitoreo }

const MEDIOS_CON_TESTIGO = new Set(['TV Abierta', 'Radio', 'Digital']);

/** Índice {medio -> {semanaIdx -> fila con falla}} — se construye una vez por tabla de monitoreo, no por celda. */
export function indiceFallasPorSemana(filas: FilaMonitoreo[], calendario: SemanaCalendario[]): Map<string, Map<number, FilaMonitoreo>> {
  const idx = new Map<string, Map<number, FilaMonitoreo>>();
  for (const f of filas) {
    if (!MEDIOS_CON_TESTIGO.has(f.medio) || !esFalla(f)) continue;
    const semana = semanaIndexDeFecha(f.fecha, calendario);
    if (semana === null) continue;
    if (!idx.has(f.medio)) idx.set(f.medio, new Map());
    idx.get(f.medio)!.set(semana, f); // si hay varias en la misma semana, se queda la última — hay espacio de sobra
  }
  return idx;
}

export function fallaTestigoCelda(indice: Map<string, Map<number, FilaMonitoreo>>, medio: string, semanaIdx: number, valorCelda: number): FallaTestigoCelda | null {
  const fila = indice.get(medio)?.get(semanaIdx);
  if (!fila) return null;
  return {
    tipo: esNoTransmitido(fila) ? 'no_transmitido' : 'fuera_de_horario',
    monto: esNoTransmitido(fila) ? valorCelda : 0,
    fila,
  };
}

export function resumenMonitoreo(filas: FilaMonitoreo[]) {
  const planTotal = filas.reduce((s, f) => s + f.inversion_plan, 0);
  const realTotal = filas.reduce((s, f) => s + inversionReal(f), 0);
  const trpPlanTotal = filas.reduce((s, f) => s + f.trp_plan, 0);
  const trpRealTotal = filas.reduce((s, f) => s + f.trp_real, 0);
  return {
    planTotal, realTotal, enRiesgo: dineroEnRiesgo(filas),
    cumplimientoGlobal: trpPlanTotal ? (trpRealTotal / trpPlanTotal) * 100 : 0,
    cprpPlanGlobal: trpPlanTotal ? planTotal / trpPlanTotal : null,
    cprpRealGlobal: trpRealTotal ? realTotal / trpRealTotal : null,
    reclamos: filas.filter(esNoTransmitido).length,
  };
}
