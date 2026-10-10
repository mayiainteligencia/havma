// Reparte el total de un medio entre las semanas del calendario según su
// patrón de flighting (LANZ / MANT / MIN — MMTO cuenta como MANT, separadores
// "|" o "/"), ponderado por los niveles de presión de esa campaña, y escalado
// para que la suma dé EXACTAMENTE el total. Sin patrón o sin niveles: reparte
// parejo y la fila queda "sin confirmar" (amarillo) hasta que alguien la edite
// o la confirme.
//
// ponytail: la confirmación se lleva por fila (campaña + medio), no celda por
// celda — con 53 semanas por fila alcanza para lo que pide el MVP; si hace
// falta granularidad de celda, `confirmado` pasa a ser `boolean[]`.
import type { NivelesPresion } from '../data/types';

const NIVEL_KEY: Record<string, keyof NivelesPresion> = { LANZ: 'lanzamiento', MANT: 'mantenimiento', MIN: 'minimo' };

export interface SemanaDistribuida { semana: number; valor: number }

export function distribuirSemanas(
  total: number,
  numSemanas: number,
  patron: string | null,
  niveles: NivelesPresion | null,
): { valores: number[]; sinPatron: boolean } {
  if (numSemanas <= 0) return { valores: [], sinPatron: true };

  const etapas = patron ? patron.split('|').map(s => s.trim()).filter(Boolean) : [];
  const pesosEtapa = etapas.map(e => {
    const key = NIVEL_KEY[e];
    const v = key && niveles ? niveles[key] : null;
    return v !== null && v !== undefined ? v : null;
  });
  const sinPatron = etapas.length === 0 || pesosEtapa.some(p => p === null);

  let pesos: number[];
  if (sinPatron) {
    pesos = Array(numSemanas).fill(1);
  } else {
    // `etapas.length` bloques contiguos de semanas, tamaño lo más parejo posible.
    pesos = [];
    const base = Math.floor(numSemanas / etapas.length);
    const resto = numSemanas % etapas.length;
    for (let i = 0; i < etapas.length; i++) {
      const largo = base + (i < resto ? 1 : 0);
      for (let s = 0; s < largo; s++) pesos.push(pesosEtapa[i] as number);
    }
  }

  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  // Escala exacta: reparte el total según peso relativo; el último ajusta el
  // residuo de redondeo para que la suma cierre exactamente con `total`.
  const valores = pesos.map(p => (sumaPesos > 0 ? (p / sumaPesos) * total : total / numSemanas));
  const suma = valores.reduce((a, b) => a + b, 0);
  if (valores.length > 0 && suma !== 0) valores[valores.length - 1] += total - suma;

  return { valores, sinPatron };
}
