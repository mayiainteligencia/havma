import React from 'react';
import { brandingConfig } from '../../config/branding';
import { fmtMXNCorto, fmt } from '../../data/media';
import { mock, listaCampanasFlow, listaVersiones, getMonitoreo, useOverrides } from '../../data/store';
import { cprpReal, cumplimientoPct } from '../../data/metricas';
import { Panel, Kpi, OrigenTag, wrap, inner, useIsMobile } from '../shared/ui';
import { VistaHeader, Tabla, DonaChart } from './_shared';
import { InsightsCard } from './InsightsCard';

interface Props { subId: string; onNavigate: (target: string) => void }

export const EjecutivaVista: React.FC<Props> = ({ subId, onNavigate }) => {
  const { colores } = brandingConfig;
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const marcas = mock.marcas;

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="ejecutiva" subId={subId} />

        {subId === 'resumen' && (
          <>
            <InsightsCard rol="ceo" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
              <Kpi label="Inversión total gestionada" value={fmtMXNCorto(marcas.reduce((s, m) => s + m.presupuesto, 0))} />
              <Kpi label="Cuentas" value={fmt(marcas.length)} sub={`${marcas.filter(m => m.origen === 'real').length} reales`} />
              <Kpi label="Campañas del Flow" value={fmt(listaCampanasFlow().length)} />
              <Kpi label="Versiones pendientes" value={fmt(listaVersiones(overrides).filter(v => v.estado === 'pendiente').length)} />
            </div>
            <Panel title="Inversión por marca contra presupuesto aprobado" style={{ marginBottom: 18 }}>
              <DonaChart datos={marcas.map(m => ({ nombre: m.nombre, valor: m.presupuesto }))} formatear={fmtMXNCorto} />
              <Tabla
                keyOf={m => m.id}
                columnas={[
                  { header: 'Marca', render: m => <span style={{ fontWeight: 600 }}>{m.nombre}</span> },
                  { header: 'Origen', render: m => <OrigenTag origen={m.origen} /> },
                  { header: 'Presupuesto aprobado', align: 'right', render: m => fmtMXNCorto(m.presupuesto) },
                  { header: '% del total', align: 'right', render: m => `${((m.presupuesto / marcas.reduce((s, x) => s + x.presupuesto, 0)) * 100).toFixed(1)}%` },
                ]}
                filas={marcas}
              />
            </Panel>
            <Panel title="Ranking de medios por eficiencia (CPRP real, monitoreo)">
              <Tabla
                keyOf={m => m[0]}
                columnas={[
                  { header: 'Medio', render: m => <span style={{ fontWeight: 600 }}>{m[0]}</span> },
                  { header: 'Cumplimiento', align: 'right', render: m => `${(m[1] as number).toFixed(0)}%` },
                  { header: 'CPRP real', align: 'right', render: m => fmtMXNCorto(m[2] as number) },
                ]}
                filas={(() => {
                  const filasMonitoreo = getMonitoreo();
                  const grupos = new Map<string, typeof filasMonitoreo>();
                  filasMonitoreo.forEach(f => grupos.set(f.medio, [...(grupos.get(f.medio) ?? []), f]));
                  return [...grupos.entries()].map(([medio, fs]) => {
                    const cprps = fs.map(cprpReal).filter((x): x is number => x !== null && x > 0);
                    return [medio, fs.reduce((s, f) => s + cumplimientoPct(f), 0) / fs.length, cprps.reduce((s, v) => s + v, 0) / (cprps.length || 1)] as [string, number, number];
                  }).sort((a, b) => a[2] - b[2]);
                })()}
              />
            </Panel>
          </>
        )}

        {subId === 'campanas-activas' && (
          <Panel title="Campañas activas (jerarquía del Flow)">
            <Tabla
              keyOf={c => c.id}
              columnas={[
                { header: 'Categoría', render: c => c.categoria ?? '—' },
                { header: 'Campaña', render: c => <span style={{ fontWeight: 600 }}>{c.campana}</span> },
                { header: 'Medios', align: 'right', render: c => fmt(c.medios.length) },
                { header: 'Inversión total', align: 'right', render: c => fmtMXNCorto(c.medios.reduce((s, m) => s + m.inversion_total, 0)) },
                { header: 'Origen', render: () => <OrigenTag origen="real" /> },
              ]}
              filas={listaCampanasFlow()}
            />
          </Panel>
        )}

        {subId === 'desviaciones' && (
          <Panel title="Desviaciones — planeado vs. real por campaña">
            <Tabla
              keyOf={d => d.campana}
              columnas={[
                { header: 'Campaña', render: d => <span style={{ fontWeight: 600 }}>{d.campana}</span> },
                { header: 'Planeado', align: 'right', render: d => fmtMXNCorto(d.planeado) },
                { header: 'Real', align: 'right', render: d => fmtMXNCorto(d.real) },
                { header: 'Desviación', align: 'right', render: d => (
                  <span style={{ fontWeight: 700, color: d.delta_pct < 0 ? colores.peligro : colores.exito }}>
                    {d.delta_pct > 0 ? '+' : ''}{d.delta_pct}%
                  </span>
                ) },
                { header: 'Origen', render: d => <OrigenTag origen={d.origen} /> },
              ]}
              filas={mock.simulado.desviaciones}
            />
          </Panel>
        )}

        {subId === 'aprobaciones-pendientes' && (
          <Panel title="Aprobaciones pendientes — de mayor a menor monto" right={
            <button onClick={() => onNavigate('aprobaciones:pendientes')}
              style={{ border: 'none', background: colores.primario, color: '#fff', fontWeight: 700, fontSize: 12.5, padding: '7px 14px', borderRadius: 10, cursor: 'pointer' }}>
              Ir al Centro de Aprobaciones
            </button>
          }>
            <Tabla
              keyOf={v => v.id}
              columnas={[
                { header: 'Etiqueta', render: v => <span style={{ fontWeight: 600 }}>{v.etiqueta}</span> },
                { header: 'Motivo', render: v => v.motivo },
                { header: 'Autor', render: v => v.autor },
                { header: 'Fecha', render: v => v.fecha },
                { header: 'Monto', align: 'right', render: v => `${(v.delta_inversion ?? 0) >= 0 ? '+' : ''}${fmtMXNCorto(v.delta_inversion ?? 0)}` },
              ]}
              filas={listaVersiones(overrides).filter(v => v.estado === 'pendiente')
                .sort((a, b) => Math.abs(b.delta_inversion ?? 0) - Math.abs(a.delta_inversion ?? 0))}
            />
          </Panel>
        )}
      </div>
    </div>
  );
};
