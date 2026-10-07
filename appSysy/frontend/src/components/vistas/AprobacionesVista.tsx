import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import { fmtMXN, fmtMXNCorto } from '../../data/media';
import { ACTOR_POR_ROL, type Version } from '../../data/types';
import { listaVersiones, setEstadoVersion, restaurarVersion, mock, useOverrides, getEjercicio, updateTouchpointInversion, crearVersionEjercicio } from '../../data/store';
import { Panel, OrigenTag, Semaforo, wrap, inner, useIsMobile } from '../shared/ui';
import { Tabla, VistaHeader, DonaChart } from './_shared';
import { LineaTiempoVersiones } from './LineaTiempoVersiones';
import { useToast } from '../shared/toast';

interface Props { subId: string; onNavigate: (target: string) => void }

const nombreOrigenVersion = (v: Version) => {
  if (v.flow_campana_id) return mock.flow.campanas.find(c => c.id === v.flow_campana_id)?.campana ?? v.flow_campana_id;
  return mock.ejercicios.find(e => e.id === v.ejercicio_base_id)?.exercise.marca ?? v.ejercicio_base_id ?? '—';
};

const touchpointsDe = (v: Version): { nombre: string; inversion: number }[] =>
  v.snapshot_touchpoints ?? v.interpolado?.por_touchpoint.map(t => ({ nombre: t.touchpoint, inversion: t.inversion })) ?? [];

/** Tarjeta por versión: delta, motivo, autor, hora y botón de restaurar — lo que pide "mini comparador" a simple vista. */
const TarjetaVersion: React.FC<{ v: Version; onResolver?: (v: Version, aprobar: boolean, comentario: string) => void; onRestaurar?: (v: Version) => void }> =
({ v, onResolver, onRestaurar }) => {
  const { colores } = brandingConfig;
  const [comentario, setComentario] = useState('');
  const delta = v.delta_inversion ?? 0;

  return (
    <div style={{ border: `1px solid ${colores.borde}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colores.textoClaro }}>{v.etiqueta}</div>
          <div style={{ fontSize: 12, color: colores.textoOscuro, marginTop: 2 }}>
            {nombreOrigenVersion(v)} · {v.autor} · {v.fecha}{v.hora ? ` ${v.hora}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OrigenTag origen={v.origen} />
          <Semaforo ok={v.estado === 'aprobada'} textoOk="aprobada" textoError={v.estado === 'rechazada' ? 'rechazada' : 'pendiente'} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: colores.textoMedio }}>{v.motivo}</p>
      {v.delta_inversion !== undefined && (
        <span style={{ fontSize: 13, fontWeight: 700, color: delta >= 0 ? colores.exito : colores.textoOscuro }}>
          {delta >= 0 ? '▲ +' : '▼ '}{fmtMXNCorto(Math.abs(delta))} vs. base
        </span>
      )}
      {v.comentarioResolucion && (
        <p style={{ margin: 0, fontSize: 12, color: colores.textoOscuro, fontStyle: 'italic' }}>"{v.comentarioResolucion}"</p>
      )}
      {onResolver && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Comentario (opcional)"
            style={{ flex: 1, minWidth: 160, padding: '7px 10px', borderRadius: 8, border: `1px solid ${colores.borde}`, fontSize: 12.5 }} />
          <button onClick={() => onResolver(v, true, comentario)} style={{ border: 'none', background: colores.exito, color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 9, cursor: 'pointer' }}>Aprobar</button>
          <button onClick={() => onResolver(v, false, comentario)} style={{ border: `1px solid ${colores.peligro}`, background: 'transparent', color: colores.peligro, fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 9, cursor: 'pointer' }}>Rechazar</button>
        </div>
      )}
      {onRestaurar && (
        <button onClick={() => onRestaurar(v)} style={{
          display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', border: `1px solid ${colores.borde}`,
          background: 'transparent', color: colores.textoMedio, fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
        }}>
          <RotateCcw size={13} /> Restaurar esta versión
        </button>
      )}
    </div>
  );
};

export const AprobacionesVista: React.FC<Props> = ({ subId }) => {
  const { colores } = brandingConfig;
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const { push } = useToast();
  const todas = listaVersiones(overrides);
  const [compA, setCompA] = useState(todas[1]?.id ?? todas[0]?.id);
  const [compB, setCompB] = useState(todas[2]?.id ?? todas[0]?.id);
  const [deshacerDisponible, setDeshacerDisponible] = useState<{ ejercicioId: string; previos: { touchpoint: string; inversion: number }[]; etiqueta: string } | null>(null);

  // Las versiones que MAYIA sube para aprobación (Mesa de Planeación → "¿Qué pasaría?") no tocan
  // el mix activo al crearse — solo al aprobarlas aquí, y solo si quien aprueba es el Planner.
  const esPropuestaDeMayia = (v: Version) => v.autor.startsWith('MAYIA') && !!v.ejercicio_base_id && !!v.snapshot_touchpoints;

  const resolver = (v: Version, aprobar: boolean, comentario: string) => {
    setEstadoVersion(v.id, aprobar ? 'aprobada' : 'rechazada', comentario || undefined);
    if (aprobar && overrides.rol === 'planner' && esPropuestaDeMayia(v)) {
      const ejercicio = getEjercicio(overrides, v.ejercicio_base_id!);
      const previos = ejercicio.touchpoints.map(t => ({ touchpoint: t.nombre, inversion: t.inversion ?? 0 }));
      v.snapshot_touchpoints!.forEach(t => updateTouchpointInversion(v.ejercicio_base_id!, t.nombre, t.inversion));
      setDeshacerDisponible({ ejercicioId: v.ejercicio_base_id!, previos, etiqueta: v.etiqueta });
      push({ kind: 'success', title: 'Versión aprobada y aplicada', msg: `"${v.etiqueta}" ya es el mix activo.` });
    } else {
      push({ kind: 'success', title: aprobar ? 'Versión aprobada' : 'Versión rechazada', msg: v.etiqueta });
    }
  };

  const deshacerAprobacion = () => {
    if (!deshacerDisponible) return;
    deshacerDisponible.previos.forEach(p => updateTouchpointInversion(deshacerDisponible.ejercicioId, p.touchpoint, p.inversion));
    crearVersionEjercicio({
      ejercicioBaseId: deshacerDisponible.ejercicioId, etiqueta: `Restauración de "${deshacerDisponible.etiqueta}"`,
      motivo: `Se deshizo la aplicación de "${deshacerDisponible.etiqueta}".`, autor: ACTOR_POR_ROL[overrides.rol], factorPresupuesto: 1,
    });
    push({ kind: 'info', title: 'Deshecho', msg: `El mix volvió a como estaba antes de "${deshacerDisponible.etiqueta}".` });
    setDeshacerDisponible(null);
  };

  const restaurar = (v: Version) => {
    const nueva = restaurarVersion(v.id);
    push({ kind: 'success', title: 'Versión restaurada', msg: `"${nueva.etiqueta}" quedó pendiente de revisión.` });
  };

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="aprobaciones" subId={subId} />

        {deshacerDisponible && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', borderRadius: 12, background: `${colores.primario}0F`, border: `1px solid ${colores.primario}40`, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: colores.textoClaro }}>"{deshacerDisponible.etiqueta}" ya es el mix activo.</span>
            <button onClick={deshacerAprobacion} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${colores.borde}`, background: 'transparent', color: colores.textoMedio, fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 9, cursor: 'pointer' }}>
              <RotateCcw size={13} /> Deshacer
            </button>
          </div>
        )}

        {subId === 'pendientes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todas.filter(v => v.estado === 'pendiente').map(v => (
              <TarjetaVersion key={v.id} v={v} onResolver={resolver} />
            ))}
            {todas.filter(v => v.estado === 'pendiente').length === 0 && (
              <Panel title="Pendientes"><p style={{ fontSize: 13, color: colores.textoMedio, margin: 0 }}>No hay versiones esperando revisión.</p></Panel>
            )}
          </div>
        )}

        {subId === 'aprobadas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todas.filter(v => v.estado === 'aprobada').map(v => <TarjetaVersion key={v.id} v={v} onRestaurar={restaurar} />)}
          </div>
        )}

        {subId === 'rechazadas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todas.filter(v => v.estado === 'rechazada').map(v => <TarjetaVersion key={v.id} v={v} onRestaurar={restaurar} />)}
          </div>
        )}

        {subId === 'historial-versiones' && (
          <>
            <Panel title="Historial de versiones" style={{ marginBottom: 18 }}>
              <DonaChart alto={200} datos={[
                { nombre: 'Pendientes', valor: todas.filter(v => v.estado === 'pendiente').length },
                { nombre: 'Aprobadas', valor: todas.filter(v => v.estado === 'aprobada').length },
                { nombre: 'Rechazadas', valor: todas.filter(v => v.estado === 'rechazada').length },
              ].filter(d => d.valor > 0)} formatear={v => `${v} versión(es)`} />
              <LineaTiempoVersiones versiones={todas} />
            </Panel>

            <Panel title="Comparador entre dos versiones">
              <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                {[['Versión A', compA, setCompA], ['Versión B', compB, setCompB]].map(([label, valor, setter], i) => (
                  <label key={i} style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio }}>
                    {label as string}
                    <select value={valor as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                      style={{ display: 'block', marginTop: 5, padding: '8px 10px', borderRadius: 9, border: `1px solid ${colores.borde}`, fontSize: 13 }}>
                      {todas.map(v => <option key={v.id} value={v.id}>{v.etiqueta}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              {(() => {
                const va = todas.find(v => v.id === compA);
                const vb = todas.find(v => v.id === compB);
                if (!va || !vb) return null;
                if (va.flow_campana_id || vb.flow_campana_id) {
                  if (va.flow_campana_id !== vb.flow_campana_id) return <p style={{ fontSize: 13, color: colores.textoMedio }}>Son de campañas distintas del Flow — elige dos versiones de la misma campaña.</p>;
                  const medios = Object.keys(va.snapshot_semanas ?? {});
                  return (
                    <Tabla keyOf={m => m} filas={medios}
                      columnas={[
                        { header: 'Medio', render: m => <span style={{ fontWeight: 600 }}>{m}</span> },
                        { header: `Total ${va.etiqueta}`, align: 'right', render: m => fmtMXN((va.snapshot_semanas?.[m] ?? []).reduce((s, v) => s + v, 0)) },
                        { header: `Total ${vb.etiqueta}`, align: 'right', render: m => fmtMXN((vb.snapshot_semanas?.[m] ?? []).reduce((s, v) => s + v, 0)) },
                        { header: 'Diferencia', align: 'right', render: m => {
                          const d = (vb.snapshot_semanas?.[m] ?? []).reduce((s, v) => s + v, 0) - (va.snapshot_semanas?.[m] ?? []).reduce((s, v) => s + v, 0);
                          return (
                            <span style={{
                              fontWeight: 700, color: d < 0 ? colores.peligro : d > 0 ? colores.exito : colores.textoMedio,
                              background: d !== 0 ? (d > 0 ? `${colores.exito}14` : `${colores.peligro}0F`) : 'transparent',
                              padding: d !== 0 ? '2px 6px' : 0, borderRadius: 6,
                            }}>{d > 0 ? '+' : ''}{fmtMXN(d)}</span>
                          );
                        } },
                      ]} />
                  );
                }
                const ta = touchpointsDe(va);
                const tb = touchpointsDe(vb);
                const nombres = Array.from(new Set([...ta.map(t => t.nombre), ...tb.map(t => t.nombre)]));
                return (
                  <Tabla keyOf={n => n} filas={nombres}
                    columnas={[
                      { header: 'Touchpoint', render: n => <span style={{ fontWeight: 600 }}>{n}</span> },
                      { header: va.etiqueta, align: 'right', render: n => fmtMXN(ta.find(t => t.nombre === n)?.inversion ?? 0) },
                      { header: vb.etiqueta, align: 'right', render: n => fmtMXN(tb.find(t => t.nombre === n)?.inversion ?? 0) },
                      { header: 'Diferencia', align: 'right', render: n => {
                        const d = (tb.find(t => t.nombre === n)?.inversion ?? 0) - (ta.find(t => t.nombre === n)?.inversion ?? 0);
                        return (
                          <span style={{
                            fontWeight: 700, color: d < 0 ? colores.peligro : d > 0 ? colores.exito : colores.textoMedio,
                            background: d !== 0 ? (d > 0 ? `${colores.exito}14` : `${colores.peligro}0F`) : 'transparent',
                            padding: d !== 0 ? '2px 6px' : 0, borderRadius: 6,
                          }}>{d > 0 ? '+' : ''}{fmtMXN(d)}</span>
                        );
                      } },
                    ]} />
                );
              })()}
            </Panel>
          </>
        )}
      </div>
    </div>
  );
};
