import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react';
import { fmtMXN, fmtMXNCorto } from '../../domain/comun/formato';
import { ACTOR_POR_ROL, type Version } from '../../domain/planeacion/types';
import {
  crearVersionEjercicio, getEjercicio, listaVersiones, mock, restaurarVersion, setEstadoVersion, updateTouchpointInversion, useOverrides,
} from '../../infrastructure/planeacion/store';
import { BentoItem } from '../../ui/layouts/BentoGrid';
import { DonutChart } from '../../ui/charts/charts';
import { Aviso, Boton, Card, DataTable, Etiqueta, KpiCard, Select, useToast } from '../../ui/widgets';
import { LineaTiempo } from './compartido/LineaTiempo';
import { OrigenTag, signo, type VistaProps } from './compartido/util';

const nombreOrigen = (v: Version) =>
  v.flow_campana_id ? (mock.flow.campanas.find(c => c.id === v.flow_campana_id)?.campana ?? v.flow_campana_id)
    : (mock.ejercicios.find(e => e.id === v.ejercicio_base_id)?.exercise.marca ?? v.ejercicio_base_id ?? '—');
const touchpointsDe = (v: Version) => v.snapshot_touchpoints ?? v.interpolado?.por_touchpoint.map(t => ({ nombre: t.touchpoint, inversion: t.inversion })) ?? [];
const tonoEstado = (v: Version) => (v.estado === 'aprobada' ? 'ok' : v.estado === 'rechazada' ? 'alerta' : 'pend');

function TarjetaVersion({ v, onResolver, onRestaurar }: { v: Version; onResolver?: (v: Version, ok: boolean, c: string) => void; onRestaurar?: (v: Version) => void }) {
  const [comentario, setComentario] = useState('');
  const d = v.delta_inversion ?? 0;
  return (
    <Card titulo={nombreOrigen(v)} derecha={<><OrigenTag origen={v.origen} /><Etiqueta tono={tonoEstado(v)}>{v.estado}</Etiqueta></>}>
      <div className="vcard">
        <b>{v.etiqueta}</b>
        <small>{v.autor} · {v.fecha}{v.hora ? ` ${v.hora}` : ''}</small>
        <p>{v.motivo}</p>
        {v.delta_inversion !== undefined && <strong className="vcard__delta">{d >= 0 ? '▲' : '▼'} {signo(d)}{fmtMXNCorto(Math.abs(d))} vs. base</strong>}
        {v.comentarioResolucion && <em>"{v.comentarioResolucion}"</em>}
        {onResolver && (
          <div className="vcard__acts">
            <input className="sel" style={{ flex: 1, minWidth: 140 }} value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Comentario (opcional)" aria-label="Comentario" />
            <Boton onClick={() => onResolver(v, true, comentario)}>Aprobar</Boton>
            <Boton variante="peligro" onClick={() => onResolver(v, false, comentario)}>Rechazar</Boton>
          </div>
        )}
        {onRestaurar && <Boton variante="borde" onClick={() => onRestaurar(v)}><RotateCcw size={13} /> Restaurar esta versión</Boton>}
      </div>
    </Card>
  );
}

export function AprobacionesVista({ subId }: VistaProps) {
  const o = useOverrides();
  const toast = useToast();
  const todas = listaVersiones(o);
  const [a, setA] = useState(todas[1]?.id ?? todas[0]?.id);
  const [b, setB] = useState(todas[2]?.id ?? todas[0]?.id);
  const [deshacer, setDeshacer] = useState<{ ejercicioId: string; previos: { touchpoint: string; inversion: number }[]; etiqueta: string } | null>(null);
  const cuenta = (e: Version['estado']) => todas.filter(v => v.estado === e).length;

  // Las propuestas de MAYIA no tocan el mix activo al crearse: solo al aprobarlas aquí, y solo si aprueba el Planner.
  const esPropuestaMayia = (v: Version) => v.autor.startsWith('MAYIA') && !!v.ejercicio_base_id && !!v.snapshot_touchpoints;
  const resolver = (v: Version, ok: boolean, comentario: string) => {
    setEstadoVersion(v.id, ok ? 'aprobada' : 'rechazada', comentario || undefined);
    if (ok && o.rol === 'planner' && esPropuestaMayia(v)) {
      const ej = getEjercicio(o, v.ejercicio_base_id!);
      setDeshacer({ ejercicioId: v.ejercicio_base_id!, previos: ej.touchpoints.map(t => ({ touchpoint: t.nombre, inversion: t.inversion ?? 0 })), etiqueta: v.etiqueta });
      v.snapshot_touchpoints!.forEach(t => updateTouchpointInversion(v.ejercicio_base_id!, t.nombre, t.inversion));
      toast({ titulo: 'Versión aprobada y aplicada', msg: `"${v.etiqueta}" ya es el mix activo.` });
    } else toast({ titulo: ok ? 'Versión aprobada' : 'Versión rechazada', msg: v.etiqueta });
  };
  const deshacerAprobacion = () => {
    if (!deshacer) return;
    deshacer.previos.forEach(p => updateTouchpointInversion(deshacer.ejercicioId, p.touchpoint, p.inversion));
    crearVersionEjercicio({ ejercicioBaseId: deshacer.ejercicioId, etiqueta: `Restauración de "${deshacer.etiqueta}"`, motivo: `Se deshizo la aplicación de "${deshacer.etiqueta}".`, autor: ACTOR_POR_ROL[o.rol], factorPresupuesto: 1 });
    toast({ titulo: 'Deshecho', msg: `El mix volvió a como estaba antes de "${deshacer.etiqueta}".` });
    setDeshacer(null);
  };
  const restaurar = (v: Version) => { const n = restaurarVersion(v.id); toast({ titulo: 'Versión restaurada', msg: `"${n.etiqueta}" quedó pendiente de revisión.` }); };

  const kpis = (
    <>
      <BentoItem size="kpi"><KpiCard etiqueta="Pendientes" valor={String(cuenta('pendiente'))} icono={<ClipboardCheck size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Aprobadas" valor={String(cuenta('aprobada'))} icono={<CheckCircle2 size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Rechazadas" valor={String(cuenta('rechazada'))} icono={<XCircle size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Versiones" valor={String(todas.length)} /></BentoItem>
    </>
  );
  const aviso = deshacer && (
    <BentoItem size="strip"><Aviso>"{deshacer.etiqueta}" ya es el mix activo. <Boton variante="borde" onClick={deshacerAprobacion}><RotateCcw size={13} /> Deshacer</Boton></Aviso></BentoItem>
  );

  const lista = (estado: Version['estado'], vacio: string) => {
    const fs = todas.filter(v => v.estado === estado);
    return fs.length === 0
      ? <BentoItem size="bar"><Card titulo={estado}><p className="insights"><span>{vacio}</span></p></Card></BentoItem>
      : fs.map(v => <BentoItem key={v.id} size="wide"><TarjetaVersion v={v} onResolver={estado === 'pendiente' ? resolver : undefined} onRestaurar={estado !== 'pendiente' ? restaurar : undefined} /></BentoItem>);
  };

  if (subId === 'aprobadas') return <>{kpis}{aviso}{lista('aprobada', 'Todavía no hay versiones aprobadas.')}</>;
  if (subId === 'rechazadas') return <>{kpis}{aviso}{lista('rechazada', 'No hay versiones rechazadas.')}</>;
  if (subId === 'historial-versiones') {
    const va = todas.find(v => v.id === a), vb = todas.find(v => v.id === b);
    const total = (v: Version | undefined, m: string) => (v?.snapshot_semanas?.[m] ?? []).reduce((s, x) => s + x, 0);
    const delta = (d: number) => <b style={{ color: d < 0 ? 'var(--accent)' : 'var(--text)' }}>{signo(d)}{fmtMXN(d)}</b>;
    let comparador;
    if (!va || !vb) comparador = null;
    else if (va.flow_campana_id || vb.flow_campana_id) {
      comparador = va.flow_campana_id !== vb.flow_campana_id
        ? <p className="insights"><span>Son de campañas distintas del Flow — elige dos versiones de la misma campaña.</span></p>
        : <DataTable keyOf={m => m} filas={Object.keys(va.snapshot_semanas ?? {})} columnas={[
          { titulo: 'Medio', render: m => <b>{m}</b> }, { titulo: va.etiqueta, derecha: true, render: m => fmtMXN(total(va, m)) },
          { titulo: vb.etiqueta, derecha: true, render: m => fmtMXN(total(vb, m)) }, { titulo: 'Diferencia', derecha: true, render: m => delta(total(vb, m) - total(va, m)) },
        ]} />;
    } else {
      const ta = touchpointsDe(va), tb = touchpointsDe(vb);
      const nombres = Array.from(new Set([...ta.map(t => t.nombre), ...tb.map(t => t.nombre)]));
      const inv = (t: typeof ta, n: string) => t.find(x => x.nombre === n)?.inversion ?? 0;
      comparador = <DataTable keyOf={n => n} filas={nombres} columnas={[
        { titulo: 'Touchpoint', render: n => <b>{n}</b> }, { titulo: va.etiqueta, derecha: true, render: n => fmtMXN(inv(ta, n)) },
        { titulo: vb.etiqueta, derecha: true, render: n => fmtMXN(inv(tb, n)) }, { titulo: 'Diferencia', derecha: true, render: n => delta(inv(tb, n) - inv(ta, n)) },
      ]} />;
    }
    return (
      <>
        {kpis}
        <BentoItem size="side"><Card titulo="Estado de las versiones"><DonutChart datos={[{ nombre: 'Pendientes', valor: cuenta('pendiente') }, { nombre: 'Aprobadas', valor: cuenta('aprobada') }, { nombre: 'Rechazadas', valor: cuenta('rechazada') }].filter(d => d.valor > 0)} formato={v => `${v}`} /></Card></BentoItem>
        <BentoItem size="xl"><Card titulo="Historial de versiones"><LineaTiempo versiones={todas} /></Card></BentoItem>
        <BentoItem size="full">
          <Card titulo="Comparador entre dos versiones" derecha={<>
            <Select value={a} onChange={e => setA(e.target.value)} aria-label="Versión A">{todas.map(v => <option key={v.id} value={v.id}>{v.etiqueta}</option>)}</Select>
            <Select value={b} onChange={e => setB(e.target.value)} aria-label="Versión B">{todas.map(v => <option key={v.id} value={v.id}>{v.etiqueta}</option>)}</Select>
          </>} flush>{comparador}</Card>
        </BentoItem>
      </>
    );
  }
  return <>{kpis}{aviso}{lista('pendiente', 'No hay versiones esperando revisión.')}</>;
}
