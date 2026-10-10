import { useRef, useState } from 'react';
import { BadgeDollarSign, Gauge as GaugeIcon, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { fmtMXN, fmtMXNCorto } from '../../domain/comun/formato';
import { interpolarEscenario } from '../../domain/planeacion/interpolate';
import { ACTOR_POR_ROL } from '../../domain/planeacion/types';
import {
  crearVersionEjercicio, getBitacora, getEjercicioActivo, listaEjercicios, registrarCambioInversion, semaforoCuadre,
  setEjercicioActivo, updateBriefField, updateTouchpointInversion, useOverrides,
} from '../../infrastructure/planeacion/store';
import { BentoItem } from '../../ui/layouts/BentoGrid';
import { BarChart, DonutChart, LineChart } from '../../ui/charts/charts';
import { Aviso, Boton, Card, DataTable, Etiqueta, KpiCard } from '../../ui/widgets';
import { GuardarVersionModal } from './compartido/GuardarVersionModal';
import { InsightsCard } from './compartido/InsightsCard';
import { OrigenTag, signo, type VistaProps } from './compartido/util';

const CAMPOS = [['anunciante', 'Anunciante'], ['marca', 'Marca'], ['campana', 'Campaña'], ['periodo_inicio', 'Periodo — inicio'], ['periodo_fin', 'Periodo — fin'], ['moneda', 'Moneda']] as const;

export function PlaneacionVista({ subId, rol }: VistaProps) {
  const o = useOverrides();
  const e = getEjercicioActivo(o);
  const [factor, setFactor] = useState(1);
  const [modal, setModal] = useState(false);
  const valorAlEnfocar = useRef<Record<string, number>>({});
  const semaforo = semaforoCuadre(e);
  const escenarios = e.escenarios;
  const factores = escenarios?.map(x => x.factor_presupuesto) ?? [1];
  const [minF, maxF] = [Math.min(...factores), Math.max(...factores)];
  const interp = interpolarEscenario(escenarios, factor);

  // Efecto en vivo del mix actual vs. el presupuesto base
  const base = e.exercise.presupuesto ?? 0;
  const factorActual = base ? (e.totales.inversion ?? 0) / base : 1;
  const iBase = interpolarEscenario(escenarios, 1), iAct = interpolarEscenario(escenarios, factorActual);
  const efecto = iBase && iAct && Math.abs(factorActual - 1) > 0.001 ? {
    dInv: (e.totales.inversion ?? 0) - base,
    dAlc: (iAct.totales.alcance - iBase.totales.alcance) * 100,
    dCprp: iAct.totales.grps && iBase.totales.grps ? ((iAct.presupuesto_total / iAct.totales.grps) / (iBase.presupuesto_total / iBase.totales.grps) - 1) * 100 : 0,
  } : null;

  const cabecera = (
    <>
      <BentoItem size="kpi"><KpiCard etiqueta="Inversión del mix" valor={fmtMXNCorto(e.totales.inversion ?? 0)} sub={`de ${fmtMXNCorto(base)}`} icono={<BadgeDollarSign size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="GRPs" valor={e.totales.grps?.toFixed(1) ?? '—'} icono={<GaugeIcon size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Alcance neto" valor={e.totales.alcance_neto != null ? `${(e.totales.alcance_neto * 100).toFixed(1)}%` : '—'} icono={<Target size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Cuadre del mix" valor={semaforo.ok ? 'Cuadra' : 'No cuadra'} sub={`${(semaforo.pct * 100).toFixed(2)}% de desvío`} /></BentoItem>
      <BentoItem size="bar">
        <Card titulo="Ejercicio activo" derecha={<OrigenTag origen={e.origen} />}>
          <div className="chips">
            {listaEjercicios(o).map(x => (
              <button key={x.id} className={`chip ${x.id === e.id ? 'is-on' : ''}`} onClick={() => setEjercicioActivo(x.id)}>{x.exercise.marca ?? x.fuente_archivo}</button>
            ))}
          </div>
        </Card>
      </BentoItem>
    </>
  );

  let cuerpo;
  if (subId === 'target-audiencia') {
    cuerpo = [
      ['Target', e.exercise.target ?? '—'],
      ['Edad', e.exercise.edad_min && e.exercise.edad_max ? `${e.exercise.edad_min}–${e.exercise.edad_max}` : '—'],
      ['Género', e.exercise.genero ?? '—'],
      ['Universo', e.exercise.universo ? e.exercise.universo.toLocaleString('es-MX') : '—'],
    ].map(([l, v]) => <BentoItem key={l} size="sm"><KpiCard etiqueta={l} valor={v} /></BentoItem>);
  } else if (subId === 'mix-medios') {
    cuerpo = (
      <>
        <BentoItem size="xl">
          <Card titulo="Mix de medios — editable" derecha={<><Etiqueta tono={semaforo.ok ? 'ok' : 'alerta'}>{semaforo.ok ? `cuadra ±${(semaforo.pct * 100).toFixed(2)}%` : `no cuadra ${(semaforo.pct * 100).toFixed(1)}%`}</Etiqueta><Boton onClick={() => setModal(true)}>Guardar como versión</Boton></>} flush>
            {efecto && (
              <div style={{ padding: '0 18px 8px' }}>
                <Aviso tipo={efecto.dInv >= 0 ? 'info' : 'alerta'}>
                  {efecto.dInv >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <b>{signo(efecto.dInv)}{fmtMXNCorto(efecto.dInv)}</b> vs. presupuesto → {signo(efecto.dAlc)}{efecto.dAlc.toFixed(1)} pts de alcance, CPRP {signo(efecto.dCprp)}{efecto.dCprp.toFixed(1)}%
                </Aviso>
              </div>
            )}
            <DataTable keyOf={t => t.nombre} filas={e.touchpoints} columnas={[
              { titulo: 'Touchpoint', render: t => <b>{t.nombre}</b> },
              { titulo: 'Inversión', derecha: true, render: t => (
                <input className="celda" type="number" aria-label={`Inversión ${t.nombre}`} value={Math.round(t.inversion ?? 0)} style={{ width: 120 }}
                  onFocus={() => { valorAlEnfocar.current[t.nombre] = t.inversion ?? 0; }}
                  onChange={ev => updateTouchpointInversion(e.id, t.nombre, Number(ev.target.value))}
                  onBlur={ev => registrarCambioInversion(t.nombre, valorAlEnfocar.current[t.nombre] ?? (t.inversion ?? 0), Number(ev.target.value))} />
              ) },
              { titulo: 'Share', derecha: true, render: t => t.share_inversion != null ? `${(t.share_inversion * 100).toFixed(1)}%` : '—' },
              { titulo: 'GRPs', derecha: true, render: t => t.grps?.toFixed(1) ?? '—' },
              { titulo: 'Alcance', derecha: true, render: t => t.alcance != null ? `${(t.alcance * 100).toFixed(1)}%` : '—' },
            ]} />
            <p className="total">Total: {fmtMXN(e.totales.inversion ?? 0)} · Presupuesto: {fmtMXN(base)}</p>
          </Card>
        </BentoItem>
        <BentoItem size="side"><Card titulo="Distribución"><DonutChart datos={e.touchpoints.filter(t => t.inversion).map(t => ({ nombre: t.nombre, valor: t.inversion ?? 0 }))} formato={fmtMXNCorto} /></Card></BentoItem>
        <BentoItem size="wide">
          <Card titulo="Cambios de esta sesión">
            <div className="insights">{getBitacora(o, 20).length === 0 ? <p>Todavía no hay cambios registrados.</p> : getBitacora(o, 20).map(b => <p key={b.id}>{b.mensaje}</p>)}</div>
          </Card>
        </BentoItem>
        {modal && <GuardarVersionModal onCerrar={() => setModal(false)} onGuardar={(etiqueta, motivo) => crearVersionEjercicio({
          ejercicioBaseId: e.id, etiqueta, motivo, autor: ACTOR_POR_ROL[o.rol], factorPresupuesto: base ? Math.round(((e.totales.inversion ?? 0) / base) * 100) / 100 : 1,
        })} />}
      </>
    );
  } else if (subId === 'escenarios') {
    cuerpo = escenarios && escenarios.length > 0 && interp ? (
      <>
        <BentoItem size="kpi"><KpiCard etiqueta="GRPs" valor={interp.totales.grps.toFixed(1)} /></BentoItem>
        <BentoItem size="kpi"><KpiCard etiqueta="Impactos (miles)" valor={interp.totales.impactos_miles.toFixed(0)} /></BentoItem>
        <BentoItem size="kpi"><KpiCard etiqueta="Alcance" valor={`${(interp.totales.alcance * 100).toFixed(1)}%`} sub={`${factor.toFixed(2)}x · ${fmtMXNCorto(interp.presupuesto_total)}`} /></BentoItem>
        <BentoItem size="full">
          <Card titulo="Escenarios (Budget Scenarios) — interpolado en vivo" derecha={<OrigenTag origen={e.origen} />}>
            <label className="slider">Factor {factor.toFixed(2)}x
              <input type="range" min={minF} max={maxF} step={0.01} value={factor} onChange={ev => setFactor(Number(ev.target.value))} />
              <span>{fmtMXNCorto(interp.presupuesto_total)}</span>
            </label>
            <div style={{ height: 'calc(100% - 44px)', minHeight: 160 }}>
              <BarChart data={interp.por_touchpoint.map(t => ({ label: t.touchpoint, valores: [t.inversion] }))} formato={fmtMXNCorto} />
            </div>
          </Card>
        </BentoItem>
      </>
    ) : <BentoItem size="bar"><Card titulo="Escenarios"><p className="insights"><span>Este ejercicio no trae Budget Scenarios.</span></p></Card></BentoItem>;
  } else if (subId === 'alcance-frecuencia') {
    const rows = e.alcance_por_frecuencia;
    cuerpo = rows && rows.length > 0 ? (
      <BentoItem size="full">
        <Card titulo="Alcance acumulado 1+ a 10+ por touchpoint" derecha={<OrigenTag origen={e.origen} />}>
          <LineChart area={false} formato={v => `${v.toFixed(0)}%`} labels={Array.from({ length: 10 }, (_, i) => `${i + 1}+`)}
            series={rows.map(r => ({ nombre: r.touchpoint, valores: Array.from({ length: 10 }, (_, i) => Number(r[`f${i + 1}`]) * 100) }))} />
        </Card>
      </BentoItem>
    ) : <BentoItem size="bar"><Card titulo="Alcance & frecuencia"><p className="insights"><span>Este ejercicio no trae Reach &amp; Frequency.</span></p></Card></BentoItem>;
  } else {
    cuerpo = (
      <>
        <BentoItem size="xl">
          <Card titulo="Brief — editable" derecha={<OrigenTag origen={e.origen} />}>
            <div className="form-grid">
              {CAMPOS.map(([k, l]) => <label key={k} className="fld">{l}<input value={e.exercise[k] ?? ''} onChange={ev => updateBriefField(e.id, k, ev.target.value)} /></label>)}
              <label className="fld">Presupuesto<input type="number" value={e.exercise.presupuesto ?? ''} onChange={ev => updateBriefField(e.id, 'presupuesto', Number(ev.target.value))} /></label>
            </div>
          </Card>
        </BentoItem>
        <BentoItem size="side"><InsightsCard rol={rol} /></BentoItem>
      </>
    );
  }

  return <>{cabecera}{cuerpo}</>;
}
