import React, { useState } from 'react';
import { brandingConfig } from '../../config/branding';
import { fmtMXN } from '../../data/media';
import type { Version } from '../../data/types';
import { listaVersiones, setEstadoVersion, mock, useOverrides } from '../../data/store';
import { Panel, OrigenTag, Semaforo, wrap, inner, useIsMobile } from '../shared/ui';
import { Tabla, VistaHeader, DonaChart } from './_shared';
import { useToast } from '../shared/toast';
import { useConfirm } from '../shared/confirm';

interface Props { subId: string; onNavigate: (target: string) => void }

const nombreOrigenVersion = (v: Version) => {
  if (v.flow_campana_id) return mock.flow.campanas.find(c => c.id === v.flow_campana_id)?.campana ?? v.flow_campana_id;
  return mock.ejercicios.find(e => e.id === v.ejercicio_base_id)?.exercise.marca ?? v.ejercicio_base_id ?? '—';
};

const touchpointsDe = (v: Version): { nombre: string; inversion: number }[] =>
  v.snapshot_touchpoints ?? v.interpolado?.por_touchpoint.map(t => ({ nombre: t.touchpoint, inversion: t.inversion })) ?? [];

export const AprobacionesVista: React.FC<Props> = ({ subId }) => {
  const { colores } = brandingConfig;
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const { push } = useToast();
  const confirmar = useConfirm();
  const todas = listaVersiones(overrides);
  const [compA, setCompA] = useState(todas[1]?.id ?? todas[0]?.id);
  const [compB, setCompB] = useState(todas[2]?.id ?? todas[0]?.id);

  const resolver = async (v: Version, aprobar: boolean) => {
    if (await confirmar({ titulo: aprobar ? 'Aprobar versión' : 'Rechazar versión', descripcion: `${v.etiqueta} — ${v.motivo}` })) {
      setEstadoVersion(v.id, aprobar ? 'aprobada' : 'rechazada');
      push({ kind: 'success', title: aprobar ? 'Versión aprobada' : 'Versión rechazada', msg: v.etiqueta });
    }
  };

  const columnasBase = [
    { header: 'Etiqueta', render: (v: Version) => <span style={{ fontWeight: 600 }}>{v.etiqueta}</span> },
    { header: 'Sobre', render: (v: Version) => nombreOrigenVersion(v) },
    { header: 'Motivo', render: (v: Version) => v.motivo },
    { header: 'Autor', render: (v: Version) => v.autor },
    { header: 'Fecha', render: (v: Version) => v.fecha },
    { header: 'Origen', render: (v: Version) => <OrigenTag origen={v.origen} /> },
  ];

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="aprobaciones" subId={subId} />

        {subId === 'pendientes' && (
          <Panel title="Pendientes">
            <Tabla keyOf={v => v.id} filas={todas.filter(v => v.estado === 'pendiente')}
              columnas={[...columnasBase, { header: 'Acciones', align: 'right', render: v => (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => resolver(v, true)} style={{ border: 'none', background: colores.exito, color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer' }}>Aprobar</button>
                  <button onClick={() => resolver(v, false)} style={{ border: `1px solid ${colores.peligro}`, background: 'transparent', color: colores.peligro, fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer' }}>Rechazar</button>
                </div>
              ) }]} />
          </Panel>
        )}

        {subId === 'aprobadas' && (
          <Panel title="Aprobadas">
            <Tabla keyOf={v => v.id} columnas={columnasBase} filas={todas.filter(v => v.estado === 'aprobada')} />
          </Panel>
        )}

        {subId === 'rechazadas' && (
          <Panel title="Rechazadas">
            <Tabla keyOf={v => v.id} columnas={columnasBase} filas={todas.filter(v => v.estado === 'rechazada')} />
          </Panel>
        )}

        {subId === 'historial-versiones' && (
          <>
            <Panel title="Historial de versiones" style={{ marginBottom: 18 }}>
              <DonaChart alto={200} datos={[
                { nombre: 'Pendientes', valor: todas.filter(v => v.estado === 'pendiente').length },
                { nombre: 'Aprobadas', valor: todas.filter(v => v.estado === 'aprobada').length },
                { nombre: 'Rechazadas', valor: todas.filter(v => v.estado === 'rechazada').length },
              ].filter(d => d.valor > 0)} formatear={v => `${v} versión(es)`} />
              <Tabla keyOf={v => v.id} filas={todas}
                columnas={[...columnasBase, { header: 'Estado', render: v => (
                  <Semaforo ok={v.estado === 'aprobada'} textoOk="aprobada" textoError={v.estado === 'rechazada' ? 'rechazada' : 'pendiente'} />
                ) }]} />
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
                          return <span style={{ fontWeight: 700, color: d < 0 ? colores.peligro : d > 0 ? colores.exito : colores.textoMedio }}>{d > 0 ? '+' : ''}{fmtMXN(d)}</span>;
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
                        return <span style={{ fontWeight: 700, color: d < 0 ? colores.peligro : d > 0 ? colores.exito : colores.textoMedio }}>{d > 0 ? '+' : ''}{fmtMXN(d)}</span>;
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
