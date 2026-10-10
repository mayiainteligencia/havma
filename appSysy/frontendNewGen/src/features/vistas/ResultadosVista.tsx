import { useState } from 'react';
import { resultadosPorCanal } from '../../application/planeacion/consultas';
import { fmtMXNCorto } from '../../domain/comun/formato';
import { interpolarEscenario, touchpointQueMasPierdeAlcance } from '../../domain/planeacion/interpolate';
import { listaEjercicios, listaVersiones, mock, useOverrides } from '../../infrastructure/planeacion/store';
import { BentoItem } from '../../ui/layouts/BentoGrid';
import { BarChart, Gauge } from '../../ui/charts/charts';
import { Aviso, Card, DataTable, KpiCard, Select } from '../../ui/widgets';
import { Kpis, OrigenTag, signo, type VistaProps } from './compartido/util';

export function ResultadosVista({ subId }: VistaProps) {
  const o = useOverrides();
  const r = mock.simulado.resultados;
  const canales = resultadosPorCanal(r);
  const planeado = r.reduce((s, x) => s + x.planeado, 0);
  const real = r.reduce((s, x) => s + x.real, 0);
  const versiones = listaVersiones(o).filter(v => v.ejercicio_base_id && v.factor_presupuesto !== 1);
  const [versionId, setVersionId] = useState(versiones[0]?.id);

  if (subId === 'por-campana') {
    const d = mock.simulado.desviaciones;
    const pl = d.reduce((s, x) => s + x.planeado, 0), re = d.reduce((s, x) => s + x.real, 0);
    return (
      <>
        <Kpis items={[{ etiqueta: 'Campañas', valor: String(d.length) }, { etiqueta: 'Planeado', valor: fmtMXNCorto(pl) }, { etiqueta: 'Real', valor: fmtMXNCorto(re), sub: 'simulado' }, { etiqueta: 'Desv. promedio', valor: `${(d.reduce((s, x) => s + x.delta_pct, 0) / (d.length || 1)).toFixed(1)}%` }]} />
        <BentoItem size="lg"><Card titulo="Planeado vs. real por campaña" derecha={<OrigenTag origen="simulado" />}><BarChart series={['Planeado', 'Real']} formato={fmtMXNCorto} data={d.map(x => ({ label: x.campana, valores: [x.planeado, x.real] }))} /></Card></BentoItem>
        <BentoItem size="lg"><Card titulo="Detalle" flush><DataTable keyOf={x => x.campana} filas={d} columnas={[
          { titulo: 'Campaña', render: x => <b>{x.campana}</b> }, { titulo: 'Planeado', derecha: true, render: x => fmtMXNCorto(x.planeado) },
          { titulo: 'Real', derecha: true, render: x => fmtMXNCorto(x.real) }, { titulo: 'Δ', derecha: true, render: x => `${signo(x.delta_pct)}${x.delta_pct}%` },
        ]} /></Card></BentoItem>
      </>
    );
  }
  if (subId === 'por-canal') return (
    <>
      <Kpis items={[{ etiqueta: 'Canales', valor: String(canales.length) }, { etiqueta: 'Planeado', valor: fmtMXNCorto(planeado) }, { etiqueta: 'Real', valor: fmtMXNCorto(real), sub: 'simulado' }, { etiqueta: 'Cumplimiento', valor: `${planeado ? ((real / planeado) * 100).toFixed(0) : 0}%` }]} />
      <BentoItem size="lg"><Card titulo="Planeado vs. real por canal" derecha={<OrigenTag origen="simulado" />}><BarChart series={['Planeado', 'Real']} formato={fmtMXNCorto} data={canales.map(c => ({ label: c.canal, valores: [c.planeado, c.real] }))} /></Card></BentoItem>
      <BentoItem size="lg"><Card titulo="Detalle" flush><DataTable keyOf={x => x.canal} filas={canales} columnas={[
        { titulo: 'Canal', render: x => <b>{x.canal}</b> }, { titulo: 'Planeado', derecha: true, render: x => fmtMXNCorto(x.planeado) }, { titulo: 'Real', derecha: true, render: x => fmtMXNCorto(x.real) },
      ]} /></Card></BentoItem>
    </>
  );
  if (subId === 'kpis') return (
    <>
      <Kpis items={[{ etiqueta: 'Ejercicios', valor: String(listaEjercicios(o).length) }, { etiqueta: 'Touchpoints', valor: String(listaEjercicios(o).reduce((s, e) => s + e.touchpoints.length, 0)) }, { etiqueta: 'GRPs totales', valor: listaEjercicios(o).reduce((s, e) => s + (e.totales.grps ?? 0), 0).toFixed(0) }, { etiqueta: 'Inversión total', valor: fmtMXNCorto(listaEjercicios(o).reduce((s, e) => s + (e.totales.inversion ?? 0), 0)) }]} />
      {listaEjercicios(o).map(e => (
        <BentoItem key={e.id} size="wide">
          <Card titulo={e.exercise.marca ?? e.fuente_archivo} derecha={<OrigenTag origen={e.origen} />}>
            <div className="stats">
              <Stat l="GRPs" v={e.totales.grps?.toFixed(1) ?? '—'} />
              <Stat l="Alcance neto" v={e.totales.alcance_neto != null ? `${(e.totales.alcance_neto * 100).toFixed(1)}%` : '—'} />
              <Stat l="CPGRP" v={e.totales.cpgrp != null ? fmtMXNCorto(e.totales.cpgrp) : '—'} />
              <Stat l="CPM" v={e.totales.cpm != null ? fmtMXNCorto(e.totales.cpm) : '—'} />
            </div>
          </Card>
        </BentoItem>
      ))}
    </>
  );
  if (subId === 'recomendaciones-ia') {
    const version = versiones.find(v => v.id === versionId);
    const base = mock.ejercicios.find(e => e.id === version?.ejercicio_base_id);
    const baseI = base && interpolarEscenario(base.escenarios, 1);
    const cambio = base && version && (version.interpolado ?? interpolarEscenario(base.escenarios, version.factor_presupuesto));
    const peor = baseI && cambio ? touchpointQueMasPierdeAlcance(baseI, cambio) : null;
    const forzados = base?.touchpoints.filter(t => t.restriccion_min != null && t.restriccion_min === t.restriccion_max) ?? [];
    const dup100 = (base?.duplicaciones?.length ?? 0) > 0 && base!.duplicaciones!.every(d => d.indice === 100);
    return (
      <>
      <Kpis items={[{ etiqueta: 'Versiones con cambio', valor: String(versiones.length) }, { etiqueta: 'Aprobadas', valor: String(versiones.filter(v => v.estado === 'aprobada').length) }, { etiqueta: 'Pendientes', valor: String(versiones.filter(v => v.estado === 'pendiente').length) }, { etiqueta: 'Factor analizado', valor: version ? `${version.factor_presupuesto}x` : '—' }]} />
      <BentoItem size="full">
        <Card titulo="Recomendaciones — por plantilla, sin LLM" derecha={
          <Select value={versionId} onChange={e => setVersionId(e.target.value)} aria-label="Versión a analizar">{versiones.map(v => <option key={v.id} value={v.id}>{v.etiqueta}</option>)}</Select>
        }>
          {!version ? <p className="insights"><span>No hay versiones con cambio de presupuesto para analizar.</span></p>
            : !baseI || !cambio ? <p className="insights"><span>Este ejercicio no trae Budget Scenarios para interpolar.</span></p>
            : (
              <div className="insights">
                <p>Con el factor <strong>{version.factor_presupuesto}x</strong> ({version.etiqueta}), la inversión pasa de {fmtMXNCorto(baseI.presupuesto_total)} a {fmtMXNCorto(cambio.presupuesto_total)} (<strong>{signo(cambio.presupuesto_total - baseI.presupuesto_total)}{fmtMXNCorto(cambio.presupuesto_total - baseI.presupuesto_total)}</strong>). Los GRPs cambian en <strong>{signo(cambio.totales.grps - baseI.totales.grps)}{(cambio.totales.grps - baseI.totales.grps).toFixed(1)}</strong>, los impactos (miles) en <strong>{(cambio.totales.impactos_miles - baseI.totales.impactos_miles).toFixed(0)}</strong> y el alcance neto en <strong>{signo(cambio.totales.alcance - baseI.totales.alcance)}{((cambio.totales.alcance - baseI.totales.alcance) * 100).toFixed(1)} pp</strong>.{peor && <> El touchpoint que más alcance pierde es <strong>{peor.touchpoint}</strong> ({(peor.delta * 100).toFixed(1)} pp).</>}</p>
                {forzados.length > 0 && <Aviso tipo="alerta">Mix forzado: {forzados.map(t => t.nombre).join(', ')} tiene(n) mínimo = máximo en Restrictions — el optimizador no optimizó ahí.</Aviso>}
                {dup100 && <Aviso tipo="alerta">Todas las duplicaciones valen 100 (valor por defecto) — el alcance neto puede ser optimista.</Aviso>}
              </div>
            )}
        </Card>
      </BentoItem>
      </>
    );
  }

  // dashboard
  return (
    <>
      <BentoItem size="kpi"><KpiCard etiqueta="Planeado" valor={fmtMXNCorto(planeado)} sub="real" /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Real" valor={fmtMXNCorto(real)} sub="simulado" /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Cumplimiento" valor={`${planeado ? ((real / planeado) * 100).toFixed(0) : 0}%`} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Canales" valor={String(canales.length)} /></BentoItem>
      <BentoItem size="third"><Card titulo="Cumplimiento"><Gauge valor={real} max={planeado || 1} etiqueta="de lo planeado" /></Card></BentoItem>
      <BentoItem size="twothirds"><Card titulo="Planeado vs. real por canal"><BarChart series={['Planeado', 'Real']} formato={fmtMXNCorto} data={canales.map(c => ({ label: c.canal, valores: [c.planeado, c.real] }))} /></Card></BentoItem>
      <BentoItem size="full"><Card titulo="Planeado vs. real por marca y canal" flush>
        <DataTable keyOf={x => `${x.marca_id}-${x.canal}`} filas={r} columnas={[
          { titulo: 'Marca', render: x => mock.marcas.find(m => m.id === x.marca_id)?.nombre ?? x.marca_id }, { titulo: 'Canal', render: x => <b>{x.canal}</b> },
          { titulo: 'Planeado', derecha: true, render: x => fmtMXNCorto(x.planeado) }, { titulo: 'Real', derecha: true, render: x => fmtMXNCorto(x.real) }, { titulo: 'Origen', render: x => <OrigenTag origen={x.origen} /> },
        ]} />
      </Card></BentoItem>
    </>
  );
}

const Stat = ({ l, v }: { l: string; v: string }) => <div className="stat"><span>{l}</span><strong>{v}</strong></div>;
