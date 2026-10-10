// Descarga el Flow original (public/flow-original.xlsx) con las ediciones del grid aplicadas,
// conservando formato. ponytail: las celdas del Excel son TRPs, el grid es dinero → se escala
// cada TRP por nuevo$/base$ de su semana. Para el demo; el mapeo exacto sería con el backend.
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { mock, getFilaFlow, type OverridesState } from './store';
import { distribuirSemanas } from '../domain/distribuirSemanas';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toUpperCase();

export async function descargarFlowEditado(o: OverridesState) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await (await fetch('/flow-original.xlsx')).arrayBuffer());
  const ws = wb.getWorksheet('FLOW')!;
  const filas = new Map<string, number>();
  let camp = '';
  for (let r = 48; r <= ws.rowCount; r++) {
    const b = ws.getCell(r, 2).value, e = ws.getCell(r, 5).value;
    if (typeof b === 'string' && b.trim().startsWith('TOTAL')) break;
    if (typeof b === 'string' && b.trim()) camp = norm(b);
    if (typeof e === 'string') filas.set(`${camp}::${e.trim()}`, r);
  }
  for (const c of mock.flow.campanas) for (const m of c.medios) {
    const r = filas.get(`${norm(c.campana)}::${m.medio}`);
    if (!r) continue;
    const base = distribuirSemanas(m.inversion_total, mock.flow.calendario.length, m.patron_normalizado, m.niveles).valores;
    const nuevo = getFilaFlow(o, c.id, m.medio).valores;
    let cambio = false;
    nuevo.forEach((v, i) => {
      if (v === base[i]) return;
      cambio = true;
      const cel = ws.getCell(`${mock.flow.calendario[i].columna}${r}`);
      if (typeof cel.value === 'number' && base[i] > 0) cel.value = Math.round(cel.value * v / base[i] * 100) / 100;
    });
    if (cambio) ws.getCell(r, 6).value = nuevo.reduce((a, b) => a + b, 0);
  }
  const url = URL.createObjectURL(new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  Object.assign(document.createElement('a'), { href: url, download: 'Flow_editado.xlsx' }).click();
  URL.revokeObjectURL(url);
}
