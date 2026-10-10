import { useMemo, useState } from 'react';
import { AlertTriangle, BadgeDollarSign, CalendarDays, CheckCircle2, Layers } from 'lucide-react';
import { inversionPorCategoria, inversionPorMedio, inversionPorProveedor, mesesDelCalendario, totalCampana } from '../../application/planeacion/consultas';
import { fmtMXNCorto } from '../../domain/comun/formato';
import { fallaTestigoCelda, indiceFallasPorSemana } from '../../domain/planeacion/metricas';
import { ACTOR_POR_ROL } from '../../domain/planeacion/types';
import {
  confirmarFilaFlow, crearVersionFlow, getFilaFlow, getMonitoreo, listaCampanasFlow, mock, registrarCambioFlow, setCeldaFlow, useOverrides,
} from '../../infrastructure/planeacion/store';
import { BentoItem } from '../../ui/layouts/BentoGrid';
import { BarChart, BarList, DonutChart } from '../../ui/charts/charts';
import { Boton, Card, DataTable, KpiCard, Select } from '../../ui/widgets';
import { GuardarVersionModal } from './compartido/GuardarVersionModal';
import { OrigenTag, type VistaProps } from './compartido/util';

const TODAS = '__todas__';

export function FlowchartVista({ subId }: VistaProps) {
  const o = useOverrides();
  const todas = listaCampanasFlow();
  const [cat, setCat] = useState(TODAS);
  const [medioF, setMedioF] = useState(TODAS);
  const [estado, setEstado] = useState<'todas' | 'sin-confirmar' | 'con-falla'>('todas');
  const [campanaId, setCampanaId] = useState(todas[0].id);
  const [modal, setModal] = useState(false);
  const categorias = [...new Set(todas.map(c => c.categoria ?? 'Sin categoría'))];
  const campanas = cat === TODAS ? todas : todas.filter(c => (c.categoria ?? 'Sin categoría') === cat);
  const campana = campanas.find(c => c.id === campanaId) ?? campanas[0] ?? todas[0];
  const cal = mock.flow.calendario;
  const indice = useMemo(() => indiceFallasPorSemana(getMonitoreo(), cal), [cal]);
  const visibles = campana.medios.filter(m => (medioF === TODAS || m.medio === medioF) && (
    estado === 'todas' || (estado === 'sin-confirmar' && !getFilaFlow(o, campana.id, m.medio).confirmado) || (estado === 'con-falla' && (indice.get(m.medio)?.size ?? 0) > 0)));

  const kpis = (
    <>
      <BentoItem size="kpi"><KpiCard etiqueta="Inversión de la campaña" valor={fmtMXNCorto(totalCampana(campana))} icono={<BadgeDollarSign size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Medios" valor={String(campana.medios.length)} icono={<Layers size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Semanas" valor={String(cal.length)} icono={<CalendarDays size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Filas confirmadas" valor={`${campana.medios.filter(m => getFilaFlow(o, campana.id, m.medio).confirmado).length}/${campana.medios.length}`} icono={<CheckCircle2 size={20} />} /></BentoItem>
    </>
  );
  const filtros = (
    <>{kpis}<BentoItem size="bar">
      <Card titulo="Filtros" derecha={
        <>
          <Select value={cat} onChange={e => setCat(e.target.value)} aria-label="Marca"><option value={TODAS}>Todas las marcas</option>{categorias.map(c => <option key={c}>{c}</option>)}</Select>
          <Select value={medioF} onChange={e => setMedioF(e.target.value)} aria-label="Medio"><option value={TODAS}>Todos los medios</option>{mock.flow.medios.map(m => <option key={m}>{m}</option>)}</Select>
          <Select value={estado} onChange={e => setEstado(e.target.value as typeof estado)} aria-label="Estado"><option value="todas">Cualquier estado</option><option value="sin-confirmar">Sin confirmar</option><option value="con-falla">Con falla de testigo</option></Select>
        </>
      }>
        <div className="chips">
          {campanas.map(c => <button key={c.id} className={`chip ${c.id === campana.id ? 'is-on' : ''}`} onClick={() => setCampanaId(c.id)}>{c.campana}</button>)}
          {campanas.length === 0 && <span className="insights"><span>Sin campañas con estos filtros.</span></span>}
        </div>
      </Card>
    </BentoItem></>
  );

  if (subId === 'vista-mensual') {
    const meses = mesesDelCalendario();
    return (
      <>
        {filtros}
        <BentoItem size="full">
          <Card titulo={`${campana.campana} — medio × mes`} derecha={<OrigenTag origen="real" />} flush>
            <DataTable keyOf={m => m.medio} filas={campana.medios} columnas={[
              { titulo: 'Medio', render: m => <b>{m.medio}</b> },
              ...meses.map(mes => ({ titulo: mes.slice(0, 3), derecha: true, render: (m: typeof campana.medios[0]) => {
                const fila = getFilaFlow(o, campana.id, m.medio);
                return fmtMXNCorto(cal.reduce((s, sem, i) => s + (sem.mes === mes ? fila.valores[i] ?? 0 : 0), 0));
              } })),
            ]} />
          </Card>
        </BentoItem>
      </>
    );
  }
  if (subId === 'por-marca') {
    const f = inversionPorCategoria(campanas);
    return (
      <>
        {filtros}
        <BentoItem size="lg"><Card titulo="Inversión por marca / categoría" derecha={<OrigenTag origen="real" />}><DonutChart datos={f.map(x => ({ nombre: x.categoria, valor: x.total }))} formato={fmtMXNCorto} /></Card></BentoItem>
        <BentoItem size="lg"><Card titulo="Detalle" flush><DataTable keyOf={x => x.categoria} filas={f} columnas={[
          { titulo: 'Categoría', render: x => <b>{x.categoria}</b> }, { titulo: 'Campañas', derecha: true, render: x => x.campanas }, { titulo: 'Inversión', derecha: true, render: x => fmtMXNCorto(x.total) },
        ]} /></Card></BentoItem>
      </>
    );
  }
  if (subId === 'por-medio') {
    const f = inversionPorMedio(campanas);
    return (
      <>
        {filtros}
        <BentoItem size="lg"><Card titulo="Inversión por medio" derecha={<OrigenTag origen="real" />}><BarChart data={f.map(([n, v]) => ({ label: n, valores: [v] }))} formato={fmtMXNCorto} /></Card></BentoItem>
        <BentoItem size="lg"><Card titulo="Ranking"><BarList items={f.map(([n, v]) => ({ label: n, valor: v }))} formato={fmtMXNCorto} /></Card></BentoItem>
      </>
    );
  }
  if (subId === 'por-proveedor') {
    const f = inversionPorProveedor();
    return (
      <>
        {kpis}
        <BentoItem size="lg"><Card titulo="Inversión por proveedor" derecha={<OrigenTag origen="simulado" />}><DonutChart datos={f.map(x => ({ nombre: x.proveedor, valor: x.total }))} formato={fmtMXNCorto} /></Card></BentoItem>
        <BentoItem size="lg"><Card titulo="Detalle" flush><DataTable keyOf={x => x.proveedor} filas={f} columnas={[
          { titulo: 'Proveedor', render: x => <b>{x.proveedor}</b> }, { titulo: 'Compromisos', derecha: true, render: x => x.compromisos }, { titulo: 'Monto', derecha: true, render: x => fmtMXNCorto(x.total) },
        ]} /></Card></BentoItem>
      </>
    );
  }

  // vista-anual: grid medio × semana editable
  return (
    <>
      {filtros}
      <BentoItem size="huge">
        <Card titulo={`${campana.campana} — medio × semana`} flush derecha={
          <>
            <span className="flow__legend"><i className="flow__sw" /> sin confirmar</span>
            <span className="flow__legend"><AlertTriangle size={12} color="var(--accent)" /> falla de testigo</span>
            <Boton onClick={() => setModal(true)}>Guardar como versión</Boton>
          </>
        }>
          <div className="tbl-wrap">
            <table className="tbl flow">
              <thead><tr>
                <th className="flow__sticky">Medio</th>
                {cal.map(s => <th key={s.semana} title={s.fecha} className="r">{s.semana}</th>)}
                <th className="r">Total</th>
              </tr></thead>
              <tbody>
                {visibles.map(m => {
                  const fila = getFilaFlow(o, campana.id, m.medio);
                  let previo = 0;
                  return (
                    <tr key={m.medio}>
                      <td className="flow__sticky"><b>{m.medio}</b>{!fila.confirmado && <button className="flow__confirm" onClick={() => confirmarFilaFlow(campana.id, m.medio)}>confirmar</button>}</td>
                      {fila.valores.map((v, i) => {
                        const falla = fallaTestigoCelda(indice, m.medio, i, v);
                        const sem = cal[i];
                        const tip = falla
                          ? `Semana ${sem.semana} (${sem.fecha}) — Plan: ${fmtMXNCorto(v)} · ${falla.fila.cadena_plataforma} "${falla.fila.formato_programa}" (${falla.fila.horario}): ${falla.fila.monitoreo}${falla.tipo === 'no_transmitido' ? ` — a reclamar ${fmtMXNCorto(falla.monto)}` : ''}`
                          : `Semana ${sem.semana} (${sem.fecha}) — Plan: ${fmtMXNCorto(v)}`;
                        return (
                          <td key={i} title={tip} className={`flow__cell ${falla ? 'is-fail' : fila.confirmado ? '' : 'is-pend'}`}>
                            {falla && <AlertTriangle size={9} className="flow__warn" />}
                            <input className="celda" aria-label={`${m.medio} semana ${sem.semana}`} value={Math.round(v)}
                              onFocus={() => { previo = v; }}
                              onChange={e => setCeldaFlow(campana.id, m.medio, i, Number(e.target.value) || 0)}
                              onBlur={e => registrarCambioFlow(m.medio, previo, Number(e.target.value) || 0)} />
                          </td>
                        );
                      })}
                      <td className="r"><b>{fmtMXNCorto(fila.valores.reduce((s, v) => s + v, 0))}</b></td>
                    </tr>
                  );
                })}
                {visibles.length === 0 && <tr><td colSpan={cal.length + 2} className="tbl__empty">Sin medios con estos filtros.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </BentoItem>
      {modal && <GuardarVersionModal onCerrar={() => setModal(false)} onGuardar={(etiqueta, motivo) => crearVersionFlow({ campanaId: campana.id, etiqueta, motivo, autor: ACTOR_POR_ROL[o.rol] })} />}
    </>
  );
}
