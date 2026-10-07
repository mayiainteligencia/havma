// Comandos de edición directa por voz/texto para Brief y Flowchart — reglas y
// plantillas, sin LLM. Un solo campo/celda a la vez: se parsea, se explica en
// una frase y se aplica solo si el usuario lo confirma (nunca de inmediato).
import type { Ejercicio, SemanaCalendario } from './types';

export interface CambioBrief {
  campo: 'anunciante' | 'marca' | 'campana' | 'presupuesto' | 'moneda';
  etiqueta: string;
  valorAnterior: string | number | null;
  valorNuevo: string | number;
}

const ETIQUETA_CAMPO: Record<CambioBrief['campo'], string> = {
  anunciante: 'el anunciante', marca: 'la marca', campana: 'la campaña', presupuesto: 'el presupuesto', moneda: 'la moneda',
};

function capitalizar(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

/** "pon/cambia el presupuesto a 60 millones" | "la marca a Nova" | etc. — si no reconoce el campo, null (no inventa). */
export function parsearComandoBrief(texto: string, ejercicio: Ejercicio): CambioBrief | null {
  const t = texto.toLowerCase().trim();

  if (/presupuesto/.test(t)) {
    const m = t.match(/presupuesto\D*?([\d.,]+)\s*(millones|mill[oó]n|mdp|mil)?/);
    if (m) {
      let valor = Number(m[1].replace(/,/g, ''));
      if (/mill|mdp/.test(m[2] ?? '')) valor *= 1_000_000;
      else if (/mil/.test(m[2] ?? '')) valor *= 1_000;
      if (Number.isFinite(valor) && valor > 0) {
        return { campo: 'presupuesto', etiqueta: ETIQUETA_CAMPO.presupuesto, valorAnterior: ejercicio.exercise.presupuesto, valorNuevo: valor };
      }
    }
  }

  const campos: { campo: Exclude<CambioBrief['campo'], 'presupuesto'>; patron: RegExp }[] = [
    { campo: 'anunciante', patron: /anunciante\s+(?:a|es|:)?\s*(.+)/ },
    { campo: 'marca', patron: /\bmarca\s+(?:a|es|:)?\s*(.+)/ },
    { campo: 'campana', patron: /campa[ñn]a\s+(?:a|es|:)?\s*(.+)/ },
    { campo: 'moneda', patron: /moneda\s+(?:a|es|:)?\s*(.+)/ },
  ];
  for (const { campo, patron } of campos) {
    const m = t.match(patron);
    const valor = m?.[1]?.trim();
    if (valor) {
      const valorNuevo = campo === 'moneda' ? valor.toUpperCase() : capitalizar(valor);
      return { campo, etiqueta: ETIQUETA_CAMPO[campo], valorAnterior: ejercicio.exercise[campo] as string | null, valorNuevo };
    }
  }
  return null;
}

export interface CambioFlowCelda { medio: string; semanaIdx: number; semanaLabel: number; valorAnterior: number; valorNuevo: number }

/** "sube TV semana 12 10%" | "recorta Digital semana 5" (10% por defecto) — exige medio + "semana N", nunca inventa el medio o la semana. */
export function parsearComandoFlow(texto: string, medios: string[], calendario: SemanaCalendario[], valoresPorMedio: (medio: string) => number[]): CambioFlowCelda | null {
  const t = texto.toLowerCase();
  const subir = /\b(sube|subir|aumenta|aumentar)\b/.test(t);
  const bajar = /\b(baja|bajar|recorta|recortar|reduce|reducir|disminuye|disminuir)\b/.test(t);
  if (!subir && !bajar) return null;

  const medio = medios.find(m => t.includes(m.toLowerCase()));
  if (!medio) return null;

  const mSemana = t.match(/semana\s+(\d+)/);
  if (!mSemana) return null;
  const semanaLabel = Number(mSemana[1]);
  const semanaIdx = calendario.findIndex(s => s.semana === semanaLabel);
  if (semanaIdx < 0) return null;

  const valorAnterior = valoresPorMedio(medio)[semanaIdx] ?? 0;
  const pctMatch = t.match(/(\d+(?:\.\d+)?)\s*%/);
  const pct = pctMatch ? Number(pctMatch[1]) / 100 : 0.1;
  const valorNuevo = Math.max(0, Math.round(valorAnterior * (1 + (subir ? pct : -pct))));
  return { medio, semanaIdx, semanaLabel, valorAnterior, valorNuevo };
}
