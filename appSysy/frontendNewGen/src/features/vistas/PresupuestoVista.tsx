import { AlertTriangle } from 'lucide-react';
import { cumplimientoPorMedio, inversionPorCategoria, inversionPorMedio, inversionPorTrimestre } from '../../application/planeacion/consultas';
import { fmtMXNCorto } from '../../domain/comun/formato';
import { dineroEnRiesgo } from '../../domain/planeacion/metricas';
import { getMonitoreo, listaCampanasFlow, mock, useOverrides } from '../../infrastructure/planeacion/store';
import { BentoItem } from '../../ui/layouts/BentoGrid';
import { BarChart, BarList, DonutChart, Gauge } from '../../ui/charts/charts';
import { Aviso, Card, DataTable, KpiCard } from '../../ui/widgets';
import { Kpis, OrigenTag, type VistaProps } from './compartido/util';

export function PresupuestoVista({ subId }: VistaProps) {
  const o = useOverrides();
  const campanas = listaCampanasFlow();
  const p = mock.simulado.presupuesto;
  const autorizado = mock.marcas.reduce((s, m) => s + m.presupuesto, 0);
  const comprometido = p.reduce((s, x) => s + x.comprometido, 0);
  const ejecutado = p.reduce((s, x) => s + x.ejecutado, 0);
  const riesgo = dineroEnRiesgo(getMonitoreo());
  const excedido = ejecutado > autorizado;
  const por = (id: string) => p.find(x => x.marca_id === id);
  const pct = (v: number) => `${autorizado ? ((v / autorizado) * 100).toFixed(0) : 0}% del autorizado`;

  if (subId === 'por-medio') {
    const f = inversionPorMedio(campanas);
    const t = f.reduce((s, [, v]) => s + v, 0);
    return (
      <>
        <Kpis items={[{ etiqueta: 'Medios', valor: String(f.length) }, { etiqueta: 'Autorizado', valor: fmtMXNCorto(t) }, { etiqueta: 'Mayor medio', valor: f[0]?.[0] ?? '—' }, { etiqueta: 'Peso del mayor', valor: `${t ? ((f[0]?.[1] ?? 0) / t * 100).toFixed(0) : 0}%` }]} />
        <BentoItem size="lg"><Card titulo="Autorizado por medio (Flow)" derecha={<OrigenTag origen="real" />}><DonutChart datos={f.map(([n, v]) => ({ nombre: n, valor: v }))} formato={fmtMXNCorto} /></Card></BentoItem>
        <BentoItem size="lg"><Card titulo="Ranking de medios"><BarList items={f.map(([n, v]) => ({ label: n, valor: v }))} formato={fmtMXNCorto} /></Card></BentoItem>
      </>
    );
  }
  if (subId === 'por-marca') {
    const f = inversionPorCategoria(campanas).sort((a, b) => b.total - a.total);
    return (
      <>
        <Kpis items={[{ etiqueta: 'Categorías', valor: String(f.length) }, { etiqueta: 'Campañas', valor: String(campanas.length) }, { etiqueta: 'Autorizado', valor: fmtMXNCorto(f.reduce((s, x) => s + x.total, 0)) }, { etiqueta: 'Mayor categoría', valor: f[0]?.categoria ?? '—' }]} />
        <BentoItem size="lg"><Card titulo="Autorizado por categoría (Flow)" derecha={<OrigenTag origen="real" />}><BarChart data={f.map(x => ({ label: x.categoria, valores: [x.total] }))} formato={fmtMXNCorto} /></Card></BentoItem>
        <BentoItem size="lg"><Card titulo="Detalle" flush><DataTable keyOf={x => x.categoria} filas={f} columnas={[
          { titulo: 'Categoría', render: x => <b>{x.categoria}</b> },
          { titulo: 'Campañas', derecha: true, render: x => x.campanas },
          { titulo: 'Autorizado', derecha: true, render: x => fmtMXNCorto(x.total) },
        ]} /></Card></BentoItem>
      </>
    );
  }
  if (subId === 'por-trimestre') {
    const f = inversionPorTrimestre(o);
    const mayor = [...f].sort((a, b) => b.total - a.total)[0];
    return (
      <>
        <Kpis items={[{ etiqueta: 'Trimestres', valor: String(f.length) }, { etiqueta: 'Autorizado', valor: fmtMXNCorto(f.reduce((s, x) => s + x.total, 0)) }, { etiqueta: 'Mayor trimestre', valor: mayor?.trimestre ?? '—' }, { etiqueta: 'Promedio', valor: fmtMXNCorto(f.length ? f.reduce((s, x) => s + x.total, 0) / f.length : 0) }]} />
        <BentoItem size="lg"><Card titulo="Autorizado por trimestre" derecha={<OrigenTag origen="real" />}><BarChart data={f.map(x => ({ label: x.trimestre, valores: [x.total] }))} formato={fmtMXNCorto} /></Card></BentoItem>
        <BentoItem size="lg"><Card titulo="Detalle (según patrón de flighting)" flush><DataTable keyOf={x => x.trimestre} filas={f} columnas={[
          { titulo: 'Trimestre', render: x => <b>{x.trimestre}</b> },
          { titulo: 'Autorizado', derecha: true, render: x => fmtMXNCorto(x.total) },
        ]} /></Card></BentoItem>
      </>
    );
  }
  if (subId === 'compromisos') {
    const c = mock.simulado.compromisos;
    const facturado = c.filter(x => x.facturado).reduce((s, x) => s + x.monto, 0);
    return (
      <>
        <Kpis items={[{ etiqueta: 'Compromisos', valor: String(c.length) }, { etiqueta: 'Comprometido', valor: fmtMXNCorto(c.reduce((s, x) => s + x.monto, 0)) }, { etiqueta: 'Facturado', valor: fmtMXNCorto(facturado) }, { etiqueta: 'Por facturar', valor: fmtMXNCorto(c.reduce((s, x) => s + x.monto, 0) - facturado) }]} />
        <BentoItem size="full"><Card titulo="Compromisos con proveedores" derecha={<OrigenTag origen="simulado" />} flush>
          <DataTable keyOf={x => `${x.campana}-${x.medio}`} filas={c} columnas={[
            { titulo: 'Campaña', render: x => x.campana }, { titulo: 'Medio', render: x => x.medio },
            { titulo: 'Proveedor', render: x => <b>{x.proveedor}</b> }, { titulo: 'Monto', derecha: true, render: x => fmtMXNCorto(x.monto) },
            { titulo: 'Facturado', derecha: true, render: x => x.facturado ? 'Sí' : 'No' },
          ]} />
        </Card></BentoItem>
      </>
    );
  }

  // resumen
  const medios = cumplimientoPorMedio();
  return (
    <>
      <BentoItem size="kpi"><KpiCard etiqueta="Autorizado" valor={fmtMXNCorto(autorizado)} sub="real" /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Comprometido" valor={fmtMXNCorto(comprometido)} sub={pct(comprometido)} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Ejecutado" valor={fmtMXNCorto(ejecutado)} sub={pct(ejecutado)} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="En riesgo" valor={fmtMXNCorto(riesgo)} sub="testigo" icono={<AlertTriangle size={20} />} /></BentoItem>
      {(excedido || riesgo > 0) && (
        <BentoItem size="strip"><Aviso tipo="alerta">{excedido && 'Lo ejecutado excede lo autorizado. '}{riesgo > 0 && `${fmtMXNCorto(riesgo)} en riesgo por spots no transmitidos o fuera de horario.`}</Aviso></BentoItem>
      )}
      <BentoItem size="third"><Card titulo="Ejecución"><Gauge valor={ejecutado} max={autorizado} etiqueta="del autorizado" /></Card></BentoItem>
      <BentoItem size="twothirds">
        <Card titulo="Por marca">
          <BarChart series={['Autorizado', 'Comprometido', 'Ejecutado']} formato={fmtMXNCorto}
            data={mock.marcas.map(m => ({ label: m.nombre, valores: [m.presupuesto, por(m.id)?.comprometido ?? 0, por(m.id)?.ejecutado ?? 0] }))} />
        </Card>
      </BentoItem>
      <BentoItem size="lg">
        <Card titulo="Cumplimiento y CPRP por medio" flush>
          <DataTable keyOf={m => m.medio} filas={medios} columnas={[
            { titulo: 'Medio', render: m => <b>{m.medio}</b> },
            { titulo: 'Cumpl.', derecha: true, render: m => `${m.cumplimiento.toFixed(0)}%` },
            { titulo: 'CPRP plan', derecha: true, render: m => fmtMXNCorto(m.cprpPlan) },
            { titulo: 'CPRP real', derecha: true, render: m => m.cprpReal > 0 ? fmtMXNCorto(m.cprpReal) : '—' },
          ]} />
        </Card>
      </BentoItem>
      <BentoItem size="lg">
        <Card titulo="Saldo por marca" flush>
          <DataTable keyOf={m => m.id} filas={mock.marcas} columnas={[
            { titulo: 'Marca', render: m => <b>{m.nombre}</b> },
            { titulo: 'Autorizado', derecha: true, render: m => fmtMXNCorto(m.presupuesto) },
            { titulo: 'Saldo', derecha: true, render: m => fmtMXNCorto(m.presupuesto - (por(m.id)?.comprometido ?? 0)) },
            { titulo: 'Origen', render: m => <OrigenTag origen={m.origen} /> },
          ]} />
        </Card>
      </BentoItem>
    </>
  );
}
