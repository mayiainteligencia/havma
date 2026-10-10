// Motor de propuestas de MAYIA para Mesa de Planeación — reglas y plantillas,
// sin LLM. Cada plan se calcula interpolando los Budget Scenarios ya
// existentes (interpolarEscenario, misma curva que usa el slider de
// Escenarios) o, cuando no hay una curva precomputada para ese reparto
// (reasignación entre medios, "otro plan" en texto libre), con una
// aproximación proporcional simple — se marca `estimado: true` donde aplica.
import type { Ejercicio, Touchpoint } from '../data/types';
import { interpolarEscenario, type Interpolado } from './interpolate';
import { fmtMXNCorto } from '../data/media';

export interface Asignacion { touchpoint: string; inversion: number }
export interface EfectoPlan { deltaInversion: number; deltaGRPs: number; deltaAlcancePts: number; deltaCPRPpct: number; estimado: boolean }
export interface PlanPropuesto { id: string; nombre: string; descripcion: string; asignaciones: Asignacion[]; efecto: EfectoPlan; avisos: string[]; medioMasAfectado: string }
export interface PlanRechazado { nombre: string; motivoRechazo: string }

/** El touchpoint cuya inversión se mueve más (en pesos absolutos) entre la mezcla actual y la propuesta. */
export function medioMasAfectado(ejercicio: Ejercicio, asignaciones: Asignacion[]): string {
  let peor = asignaciones[0]?.touchpoint ?? '—';
  let max = -Infinity;
  for (const a of asignaciones) {
    const base = ejercicio.touchpoints.find(t => t.nombre === a.touchpoint)?.inversion ?? 0;
    const delta = Math.abs(a.inversion - base);
    if (delta > max) { max = delta; peor = a.touchpoint; }
  }
  return peor;
}

/** La frase "Esto pasaría…" que arma MAYIA al previsualizar un plan — mismo texto para la tarjeta y la voz. */
export function explicacionPlan(ejercicio: Ejercicio, plan: PlanPropuesto): string {
  const e = plan.efecto;
  const dir = (n: number) => (n >= 0 ? 'sube' : 'baja');
  const pctInversion = ejercicio.totales.inversion ? (Math.abs(e.deltaInversion) / ejercicio.totales.inversion) * 100 : 0;
  const partes = [
    `Esto pasaría: la inversión ${dir(e.deltaInversion)} ${fmtMXNCorto(Math.abs(e.deltaInversion))} (${pctInversion.toFixed(1)}%)`,
    `el alcance ${dir(e.deltaAlcancePts)} ${Math.abs(e.deltaAlcancePts).toFixed(1)} pts${e.estimado ? ' (estimado)' : ''}`,
    `GRPs ${dir(e.deltaGRPs)} ${Math.abs(e.deltaGRPs).toFixed(0)}`,
    `CPRP ${dir(e.deltaCPRPpct)} ${Math.abs(e.deltaCPRPpct).toFixed(1)}%`,
  ];
  return `${partes.join(', ')}. Medio más afectado: ${plan.medioMasAfectado}.`;
}

const cprp = (inversion: number, grps: number) => (grps ? inversion / grps : 0);

function efectoUniforme(base: Interpolado, plan: Interpolado): EfectoPlan {
  const a = cprp(base.presupuesto_total, base.totales.grps);
  const b = cprp(plan.presupuesto_total, plan.totales.grps);
  return {
    deltaInversion: plan.presupuesto_total - base.presupuesto_total,
    deltaGRPs: plan.totales.grps - base.totales.grps,
    deltaAlcancePts: (plan.totales.alcance - base.totales.alcance) * 100,
    deltaCPRPpct: a ? ((b / a) - 1) * 100 : 0,
    estimado: false,
  };
}

/** Efecto para reasignaciones sin curva precomputada: escala cada touchpoint por su propio factor
 * inversión-nueva/inversión-vieja; el alcance usa raíz cuadrada del factor como castigo de rendimientos
 * decrecientes — una aproximación, no la red de alcance real (por eso `estimado: true`). */
export function efectoEstimado(ejercicio: Ejercicio, asignaciones: Asignacion[]): EfectoPlan {
  const invBase = ejercicio.totales.inversion ?? 0;
  const grpsBase = ejercicio.totales.grps ?? 0;
  let invNueva = 0, grpsNuevos = 0, alcanceNuevo = 0, alcanceBase = 0;
  ejercicio.touchpoints.forEach(t => {
    const a = asignaciones.find(x => x.touchpoint === t.nombre);
    const inv = a ? a.inversion : (t.inversion ?? 0);
    const factor = (t.inversion ?? 0) > 0 ? inv / (t.inversion as number) : 1;
    invNueva += inv;
    grpsNuevos += (t.grps ?? 0) * factor;
    alcanceNuevo += (t.alcance ?? 0) * Math.min(1, Math.sqrt(Math.max(factor, 0))) * (t.share_inversion ?? 0);
    alcanceBase += (t.alcance ?? 0) * (t.share_inversion ?? 0);
  });
  const a = cprp(invBase, grpsBase);
  const b = cprp(invNueva, grpsNuevos);
  return {
    deltaInversion: invNueva - invBase,
    deltaGRPs: grpsNuevos - grpsBase,
    deltaAlcancePts: (alcanceNuevo - alcanceBase) * 100,
    deltaCPRPpct: a ? ((b / a) - 1) * 100 : 0,
    estimado: true,
  };
}

export interface ValidacionPlan { ok: boolean; motivoRechazo?: string; avisos: string[] }

/** Presupuesto 50%–150% del importado, restricciones min/max por touchpoint (% de la mezcla, no pesos —
 * así vienen en la hoja "Restrictions" del Smart Planner), mezcla forzada y duplicaciones avisadas. */
export function validarPlan(ejercicio: Ejercicio, asignaciones: Asignacion[]): ValidacionPlan {
  const avisos: string[] = [];
  const presupuestoBase = ejercicio.exercise.presupuesto || ejercicio.totales.inversion || 0;
  const totalNuevo = asignaciones.reduce((s, a) => s + a.inversion, 0);
  if (presupuestoBase > 0 && (totalNuevo < presupuestoBase * 0.5 || totalNuevo > presupuestoBase * 1.5)) {
    return { ok: false, motivoRechazo: 'El total quedaría fuera del rango permitido (50%–150% del presupuesto importado).', avisos };
  }
  for (const a of asignaciones) {
    const t = ejercicio.touchpoints.find(x => x.nombre === a.touchpoint);
    if (!t) continue;
    const sharePct = totalNuevo ? (a.inversion / totalNuevo) * 100 : 0;
    if (t.restriccion_min != null && t.restriccion_max != null && t.restriccion_min === t.restriccion_max) {
      if (Math.abs(sharePct - t.restriccion_min) > 0.5) avisos.push(`${t.nombre} tiene su mezcla forzada (mínimo = máximo = ${t.restriccion_min}%) — no se movió.`);
      continue;
    }
    if (t.restriccion_min != null && sharePct < t.restriccion_min - 0.5) {
      return { ok: false, motivoRechazo: `${t.nombre} bajaría de su mínimo permitido (${t.restriccion_min}% de la mezcla).`, avisos };
    }
    if (t.restriccion_max != null && sharePct > t.restriccion_max + 0.5) {
      return { ok: false, motivoRechazo: `${t.nombre} superaría su máximo permitido (${t.restriccion_max}% de la mezcla).`, avisos };
    }
  }
  if (ejercicio.duplicaciones && ejercicio.duplicaciones.length > 0) {
    avisos.push(`Hay duplicación de audiencia entre ${ejercicio.duplicaciones.length} par(es) de touchpoints — el alcance incremental real puede ser menor al mostrado.`);
  }
  return { ok: true, avisos };
}

/** Mueve `shiftPct` del touchpoint menos eficiente (mayor costo por punto) al más eficiente, sin cambiar el total. */
function reasignarHaciaEficiencia(ejercicio: Ejercicio, shiftPct = 0.15): Asignacion[] {
  const base = ejercicio.touchpoints.map(t => ({ touchpoint: t.nombre, inversion: t.inversion ?? 0 }));
  const tps = ejercicio.touchpoints.filter(t => (t.inversion ?? 0) > 0);
  if (tps.length < 2) return base;
  const puntuacion = (t: Touchpoint) => t.costo_por_punto_alcance ?? t.cpgrp_input ?? t.cpgrp ?? Infinity;
  const ordenado = [...tps].sort((a, b) => puntuacion(a) - puntuacion(b));
  const mejor = ordenado[0];
  const peor = ordenado[ordenado.length - 1];
  if (mejor.nombre === peor.nombre) return base;
  const total = base.reduce((s, a) => s + a.inversion, 0);
  let monto = (peor.inversion ?? 0) * shiftPct;
  if (peor.restriccion_min != null) monto = Math.min(monto, Math.max(0, (peor.inversion ?? 0) - (peor.restriccion_min / 100) * total));
  if (mejor.restriccion_max != null) monto = Math.min(monto, Math.max(0, (mejor.restriccion_max / 100) * total - (mejor.inversion ?? 0)));
  monto = Math.max(0, monto);
  return base.map(a => {
    if (a.touchpoint === peor.nombre) return { ...a, inversion: a.inversion - monto };
    if (a.touchpoint === mejor.nombre) return { ...a, inversion: a.inversion + monto };
    return a;
  });
}

/** 3 planes calculados: A "menor daño" (recorte/aumento parejo), B "mejor eficiencia" (reasigna, mismo total),
 * C "mantener alcance" (presupuesto mínimo para no bajar del alcance de hoy). Un plan rechazado se explica, no se oculta. */
export function generarPlanes(ejercicio: Ejercicio, intencion: 'recorte' | 'aumento' | 'general'): (PlanPropuesto | PlanRechazado)[] {
  const presupuestoBase = ejercicio.exercise.presupuesto || ejercicio.totales.inversion || 0;
  const factorActual = presupuestoBase ? (ejercicio.totales.inversion ?? 0) / presupuestoBase : 1;
  const interpActual = interpolarEscenario(ejercicio.escenarios, factorActual);
  if (!interpActual) return [];

  const pct = intencion === 'general' ? 0.1 : 0.15;
  const signo = intencion === 'aumento' ? 1 : -1;
  const resultado: (PlanPropuesto | PlanRechazado)[] = [];

  // Plan A — Menor daño: escala uniforme sobre la curva de Budget Scenarios (misma mezcla de hoy).
  const factorA = Math.max(0.1, factorActual * (1 + signo * pct));
  const interpA = interpolarEscenario(ejercicio.escenarios, factorA);
  if (interpA) {
    const asignacionesA = interpA.por_touchpoint.map(t => ({ touchpoint: t.touchpoint, inversion: t.inversion }));
    const val = validarPlan(ejercicio, asignacionesA);
    resultado.push(val.ok
      ? { id: 'plan-a', nombre: 'Menor daño', descripcion: `${signo > 0 ? 'Sube' : 'Recorta'} el presupuesto ${(pct * 100).toFixed(0)}% repartido igual entre medios (misma mezcla de hoy).`, asignaciones: asignacionesA, efecto: efectoUniforme(interpActual, interpA), avisos: val.avisos, medioMasAfectado: medioMasAfectado(ejercicio, asignacionesA) }
      : { nombre: 'Menor daño', motivoRechazo: val.motivoRechazo! });
  }

  // Plan B — Mejor eficiencia: reasigna entre medios, mismo presupuesto total.
  const asignacionesB = reasignarHaciaEficiencia(ejercicio, 0.15);
  const valB = validarPlan(ejercicio, asignacionesB);
  resultado.push(valB.ok
    ? { id: 'plan-b', nombre: 'Mejor eficiencia', descripcion: 'Mueve presupuesto del touchpoint menos eficiente al de mejor CPRP, sin cambiar el total.', asignaciones: asignacionesB, efecto: efectoEstimado(ejercicio, asignacionesB), avisos: [...valB.avisos, 'Esta mezcla no usa la curva real de Budget Scenarios — el alcance y los GRPs son una estimación proporcional.'], medioMasAfectado: medioMasAfectado(ejercicio, asignacionesB) }
    : { nombre: 'Mejor eficiencia', motivoRechazo: valB.motivoRechazo! });

  // Plan C — Mantener alcance: el factor mínimo (o máximo, si es aumento) que no baja del alcance de hoy.
  const factores = (ejercicio.escenarios ?? []).map(e => e.factor_presupuesto);
  if (factores.length > 0) {
    const minF = Math.min(...factores);
    const maxF = Math.max(...factores);
    const alcanceObjetivo = interpActual.totales.alcance;
    let lo = signo < 0 ? minF : factorActual;
    let hi = signo < 0 ? factorActual : maxF;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      const interpMid = interpolarEscenario(ejercicio.escenarios, mid)!;
      if (interpMid.totales.alcance >= alcanceObjetivo) hi = mid; else lo = mid;
    }
    const factorC = signo < 0 ? hi : lo;
    const interpC = interpolarEscenario(ejercicio.escenarios, factorC)!;
    if (Math.abs(factorC - factorActual) < 0.01) {
      resultado.push({ nombre: 'Mantener alcance', motivoRechazo: 'Ya estás en el presupuesto mínimo para no perder alcance — no hay margen adicional que recortar.' });
    } else {
      const asignacionesC = interpC.por_touchpoint.map(t => ({ touchpoint: t.touchpoint, inversion: t.inversion }));
      const valC = validarPlan(ejercicio, asignacionesC);
      resultado.push(valC.ok
        ? { id: 'plan-c', nombre: 'Mantener alcance', descripcion: `El presupuesto mínimo para no bajar de tu alcance actual (${(alcanceObjetivo * 100).toFixed(1)} pts).`, asignaciones: asignacionesC, efecto: efectoUniforme(interpActual, interpC), avisos: valC.avisos, medioMasAfectado: medioMasAfectado(ejercicio, asignacionesC) }
        : { nombre: 'Mantener alcance', motivoRechazo: valC.motivoRechazo! });
    }
  }

  return resultado;
}

/** Interpreta "sube|baja|recorta|aumenta" + nombre de touchpoint + % — si no reconoce nada, devuelve null (no inventa). */
export function parsearComando(texto: string, ejercicio: Ejercicio): { asignaciones: Asignacion[]; descripcion: string } | null {
  const t = texto.toLowerCase();
  const subir = /\b(sube|subir|aumenta|aumentar|incrementa|incrementar)\b/.test(t);
  const bajar = /\b(baja|bajar|recorta|recortar|reduce|reducir|disminuye|disminuir)\b/.test(t);
  if (!subir && !bajar) return null;
  const tp = ejercicio.touchpoints.find(x => t.includes(x.nombre.toLowerCase()));
  if (!tp) return null;
  const pctMatch = t.match(/(\d+(?:\.\d+)?)\s*%/);
  const pct = pctMatch ? Number(pctMatch[1]) / 100 : 0.1;
  const factor = 1 + (subir ? pct : -pct);
  const nuevaInversion = Math.max(0, (tp.inversion ?? 0) * factor);
  const asignaciones = ejercicio.touchpoints.map(x => ({ touchpoint: x.nombre, inversion: x.nombre === tp.nombre ? nuevaInversion : (x.inversion ?? 0) }));
  return { asignaciones, descripcion: `${subir ? 'Sube' : 'Recorta'} ${tp.nombre} ${(pct * 100).toFixed(0)}%.` };
}
