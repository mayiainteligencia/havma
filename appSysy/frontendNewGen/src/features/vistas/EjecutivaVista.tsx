import { BadgeDollarSign, CheckSquare, Megaphone, Users } from 'lucide-react';
import { cumplimientoPorMedio, totalCampana } from '../../application/planeacion/consultas';
import { fmt, fmtMXNCorto } from '../../domain/comun/formato';
import { listaCampanasFlow, listaVersiones, mock, useOverrides } from '../../infrastructure/planeacion/store';
import { BentoItem } from '../../ui/layouts/BentoGrid';
import { BarChart, BarList, DonutChart } from '../../ui/charts/charts';
import { Card, DataTable, KpiCard } from '../../ui/widgets';
import { InsightsCard } from './compartido/InsightsCard';
import { Kpis, OrigenTag, signo, type VistaProps } from './compartido/util';

export function EjecutivaVista({ subId, rol }: VistaProps) {
  const o = useOverrides();
  const marcas = mock.marcas;
  const total = marcas.reduce((s, m) => s + m.presupuesto, 0);
  const campanas = listaCampanasFlow();
  const pendientes = listaVersiones(o).filter(v => v.estado === 'pendiente');

  if (subId === 'campanas-activas') return (
    <>
      <Kpis items={[
        { etiqueta: 'Campañas activas', valor: fmt(campanas.length), icono: <Megaphone size={20} /> },
        { etiqueta: 'Inversión del Flow', valor: fmtMXNCorto(campanas.reduce((s, c) => s + totalCampana(c), 0)), icono: <BadgeDollarSign size={20} /> },
        { etiqueta: 'Medios distintos', valor: fmt(new Set(campanas.flatMap(c => c.medios.map(m => m.medio))).size) },
        { etiqueta: 'Categorías', valor: fmt(new Set(campanas.map(c => c.categoria ?? 'Sin categoría')).size) },
      ]} />
      <BentoItem size="lg">
        <Card titulo="Inversión por campaña">
          <BarChart data={campanas.map(c => ({ label: c.campana, valores: [totalCampana(c)] }))} formato={fmtMXNCorto} />
        </Card>
      </BentoItem>
      <BentoItem size="lg">
        <Card titulo="Campañas activas (jerarquía del Flow)" flush>
          <DataTable keyOf={c => c.id} filas={campanas} columnas={[
            { titulo: 'Categoría', render: c => c.categoria ?? '—' },
            { titulo: 'Campaña', render: c => <b>{c.campana}</b> },
            { titulo: 'Medios', derecha: true, render: c => fmt(c.medios.length) },
            { titulo: 'Inversión', derecha: true, render: c => fmtMXNCorto(totalCampana(c)) },
          ]} />
        </Card>
      </BentoItem>
    </>
  );

  if (subId === 'desviaciones') {
    const d = mock.simulado.desviaciones;
    const pl = d.reduce((s, x) => s + x.planeado, 0), re = d.reduce((s, x) => s + x.real, 0);
    return (
      <>
        <Kpis items={[
          { etiqueta: 'Planeado', valor: fmtMXNCorto(pl) }, { etiqueta: 'Real', valor: fmtMXNCorto(re), sub: 'simulado' },
          { etiqueta: 'Desviación global', valor: `${signo(re - pl)}${pl ? (((re - pl) / pl) * 100).toFixed(1) : 0}%` },
          { etiqueta: 'Campañas bajo plan', valor: `${d.filter(x => x.delta_pct < 0).length}/${d.length}` },
        ]} />
        <BentoItem size="lg">
          <Card titulo="Planeado vs. real por campaña" derecha={<OrigenTag origen="simulado" />}>
            <BarChart series={['Planeado', 'Real']} formato={fmtMXNCorto} data={d.map(x => ({ label: x.campana, valores: [x.planeado, x.real] }))} />
          </Card>
        </BentoItem>
        <BentoItem size="lg">
          <Card titulo="Desviaciones" flush>
            <DataTable keyOf={x => x.campana} filas={d} columnas={[
              { titulo: 'Campaña', render: x => <b>{x.campana}</b> },
              { titulo: 'Planeado', derecha: true, render: x => fmtMXNCorto(x.planeado) },
              { titulo: 'Real', derecha: true, render: x => fmtMXNCorto(x.real) },
              { titulo: 'Desv.', derecha: true, render: x => <b style={{ color: x.delta_pct < 0 ? 'var(--accent)' : 'var(--text)' }}>{signo(x.delta_pct)}{x.delta_pct}%</b> },
            ]} />
          </Card>
        </BentoItem>
      </>
    );
  }

  if (subId === 'aprobaciones-pendientes') return (
    <>
    <Kpis items={[
      { etiqueta: 'Pendientes', valor: fmt(pendientes.length) },
      { etiqueta: 'Monto neto', valor: `${signo(pendientes.reduce((s, v) => s + (v.delta_inversion ?? 0), 0))}${fmtMXNCorto(pendientes.reduce((s, v) => s + (v.delta_inversion ?? 0), 0))}` },
      { etiqueta: 'Mayor monto', valor: fmtMXNCorto(Math.max(0, ...pendientes.map(v => Math.abs(v.delta_inversion ?? 0)))) },
      { etiqueta: 'Autores', valor: fmt(new Set(pendientes.map(v => v.autor)).size) },
    ]} />
    <BentoItem size="full">
      <Card titulo="Aprobaciones pendientes — de mayor a menor monto" flush>
        <DataTable keyOf={v => v.id} vacio="No hay versiones pendientes." filas={[...pendientes].sort((a, b) => Math.abs(b.delta_inversion ?? 0) - Math.abs(a.delta_inversion ?? 0))} columnas={[
          { titulo: 'Etiqueta', render: v => <b>{v.etiqueta}</b> },
          { titulo: 'Motivo', render: v => v.motivo },
          { titulo: 'Autor', render: v => v.autor },
          { titulo: 'Fecha', render: v => v.fecha },
          { titulo: 'Monto', derecha: true, render: v => `${signo(v.delta_inversion ?? 0)}${fmtMXNCorto(v.delta_inversion ?? 0)}` },
        ]} />
      </Card>
    </BentoItem>
    </>
  );

  // resumen
  const medios = cumplimientoPorMedio().sort((a, b) => a.cprpReal - b.cprpReal);
  return (
    <>
      <BentoItem size="kpi"><KpiCard etiqueta="Inversión gestionada" valor={fmtMXNCorto(total)} icono={<BadgeDollarSign size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Cuentas" valor={fmt(marcas.length)} sub={`${marcas.filter(m => m.origen === 'real').length} reales`} icono={<Users size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Campañas del Flow" valor={fmt(campanas.length)} icono={<Megaphone size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Versiones pendientes" valor={fmt(pendientes.length)} icono={<CheckSquare size={20} />} /></BentoItem>
      <BentoItem size="lg">
        <Card titulo="Inversión por marca"><DonutChart datos={marcas.map(m => ({ nombre: m.nombre, valor: m.presupuesto }))} formato={fmtMXNCorto} /></Card>
      </BentoItem>
      <BentoItem size="lg"><InsightsCard rol={rol} /></BentoItem>
      <BentoItem size="lg">
        <Card titulo="Presupuesto aprobado por marca" flush>
          <DataTable keyOf={m => m.id} filas={marcas} columnas={[
            { titulo: 'Marca', render: m => <b>{m.nombre}</b> },
            { titulo: 'Origen', render: m => <OrigenTag origen={m.origen} /> },
            { titulo: 'Presupuesto', derecha: true, render: m => fmtMXNCorto(m.presupuesto) },
            { titulo: '%', derecha: true, render: m => `${((m.presupuesto / total) * 100).toFixed(1)}%` },
          ]} />
        </Card>
      </BentoItem>
      <BentoItem size="lg">
        <Card titulo="Medios por eficiencia (CPRP real, menor es mejor)">
          <BarList destacar={0} items={medios.map(m => ({ label: m.medio, valor: m.cprpReal, texto: `${fmtMXNCorto(m.cprpReal)} · ${m.cumplimiento.toFixed(0)}%` }))} />
        </Card>
      </BentoItem>
    </>
  );
}
