// Agregaciones de solo lectura sobre el store: lo que las vistas pintan, calculado en un solo lugar.
import { cprpPlan, cprpReal, cumplimientoPct } from '../../domain/planeacion/metricas';
import type { FilaMonitoreo, FlowCampana, ResultadoCanal } from '../../domain/planeacion/types';
import { getFilaFlow, getMonitoreo, listaCampanasFlow, mock, type OverridesState } from '../../infrastructure/planeacion/store';

const media = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
export const totalCampana = (c: FlowCampana) => c.medios.reduce((s, m) => s + m.inversion_total, 0);

export function inversionPorMedio(campanas: FlowCampana[]): [string, number][] {
  const acc: Record<string, number> = {};
  campanas.forEach(c => c.medios.forEach(m => { acc[m.medio] = (acc[m.medio] ?? 0) + m.inversion_total; }));
  return Object.entries(acc).sort((a, b) => b[1] - a[1]);
}

export function inversionPorCategoria(campanas: FlowCampana[]): { categoria: string; campanas: number; total: number }[] {
  const acc: Record<string, { campanas: number; total: number }> = {};
  campanas.forEach(c => {
    const k = c.categoria ?? 'Sin categoría';
    acc[k] = { campanas: (acc[k]?.campanas ?? 0) + 1, total: (acc[k]?.total ?? 0) + totalCampana(c) };
  });
  return Object.entries(acc).map(([categoria, v]) => ({ categoria, ...v }));
}

export function inversionPorProveedor(): { proveedor: string; compromisos: number; total: number }[] {
  const acc: Record<string, { compromisos: number; total: number }> = {};
  mock.simulado.compromisos.forEach(c => { acc[c.proveedor] = { compromisos: (acc[c.proveedor]?.compromisos ?? 0) + 1, total: (acc[c.proveedor]?.total ?? 0) + c.monto }; });
  return Object.entries(acc).map(([proveedor, v]) => ({ proveedor, ...v }));
}

export function cumplimientoPorMedio(filas: FilaMonitoreo[] = getMonitoreo()) {
  const g = new Map<string, FilaMonitoreo[]>();
  filas.forEach(f => g.set(f.medio, [...(g.get(f.medio) ?? []), f]));
  return [...g.entries()].map(([medio, fs]) => ({
    medio,
    cumplimiento: media(fs.map(cumplimientoPct)),
    cprpPlan: media(fs.map(cprpPlan).filter((x): x is number => x !== null)),
    cprpReal: media(fs.map(cprpReal).filter((x): x is number => x !== null && x > 0)),
  }));
}

export function resultadosPorCanal(resultados: ResultadoCanal[] = mock.simulado.resultados) {
  const acc: Record<string, { planeado: number; real: number }> = {};
  resultados.forEach(r => { acc[r.canal] = { planeado: (acc[r.canal]?.planeado ?? 0) + r.planeado, real: (acc[r.canal]?.real ?? 0) + r.real }; });
  return Object.entries(acc).map(([canal, v]) => ({ canal, ...v }));
}

export function inversionPorTrimestre(o: OverridesState): { trimestre: string; total: number }[] {
  const cal = mock.flow.calendario;
  const trimestres: string[] = [];
  cal.forEach(s => { if (s.trimestre && !trimestres.includes(s.trimestre)) trimestres.push(s.trimestre); });
  return trimestres.map(tr => ({
    trimestre: tr,
    total: listaCampanasFlow().reduce((s, c) => s + c.medios.reduce((s2, m) => {
      const fila = getFilaFlow(o, c.id, m.medio);
      return s2 + cal.reduce((acc, sem, i) => acc + (sem.trimestre === tr ? fila.valores[i] ?? 0 : 0), 0);
    }, 0), 0),
  }));
}

export function mesesDelCalendario(): string[] {
  const meses: string[] = [];
  mock.flow.calendario.forEach(s => { if (s.mes && !meses.includes(s.mes)) meses.push(s.mes); });
  return meses;
}
