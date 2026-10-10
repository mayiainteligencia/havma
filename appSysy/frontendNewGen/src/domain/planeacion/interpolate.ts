// Interpolación lineal entre los Budget Scenarios de un ejercicio — misma
// lógica que prep_data.py usa (en Python) para sembrar las versiones "cambio
// A/B"; aquí corre en vivo para el slider de Escenarios y para las
// Recomendaciones IA.
import type { Escenario } from './types';

export interface Interpolado {
  factor_presupuesto: number;
  presupuesto_total: number;
  por_touchpoint: { touchpoint: string; inversion: number; grps: number; impactos_miles: number; alcance: number }[];
  totales: { grps: number; impactos_miles: number; alcance: number };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function interpolarEscenario(escenarios: Escenario[] | null | undefined, factor: number): Interpolado | null {
  if (!escenarios || escenarios.length === 0) return null;
  const ordenados = [...escenarios].sort((x, y) => x.factor_presupuesto - y.factor_presupuesto);
  let a = ordenados[0];
  let b = ordenados[ordenados.length - 1];
  if (factor <= a.factor_presupuesto) {
    b = a;
  } else if (factor >= b.factor_presupuesto) {
    a = b;
  } else {
    a = [...ordenados].reverse().find(e => e.factor_presupuesto <= factor)!;
    b = ordenados.find(e => e.factor_presupuesto >= factor)!;
  }
  const t = a.factor_presupuesto === b.factor_presupuesto ? 0
    : (factor - a.factor_presupuesto) / (b.factor_presupuesto - a.factor_presupuesto);

  const porTp = a.por_touchpoint.map((ta, i) => {
    const tb = b.por_touchpoint[i];
    return {
      touchpoint: ta.touchpoint,
      inversion: lerp(ta.inversion, tb.inversion, t),
      grps: lerp(ta.grps, tb.grps, t),
      impactos_miles: lerp(ta.impactos_miles, tb.impactos_miles, t),
      alcance: lerp(ta.alcance, tb.alcance, t),
    };
  });

  return {
    factor_presupuesto: factor,
    presupuesto_total: lerp(a.presupuesto_total, b.presupuesto_total, t),
    por_touchpoint: porTp,
    totales: {
      grps: lerp(a.totales.grps, b.totales.grps, t),
      impactos_miles: lerp(a.totales.impactos_miles, b.totales.impactos_miles, t),
      alcance: lerp(a.totales.alcance, b.totales.alcance, t),
    },
  };
}

/** El touchpoint que más alcance pierde al pasar de `base` a `interpolado` (para Recomendaciones IA). */
export function touchpointQueMasPierdeAlcance(base: Interpolado, comparado: Interpolado): { touchpoint: string; delta: number } | null {
  let peor: { touchpoint: string; delta: number } | null = null;
  base.por_touchpoint.forEach((tb, i) => {
    const tc = comparado.por_touchpoint[i];
    const delta = tc.alcance - tb.alcance;
    if (!peor || delta < peor.delta) peor = { touchpoint: tb.touchpoint, delta };
  });
  return peor;
}
