import React from 'react';
import { fmtMXNCorto } from '../../data/media';
import { mock, listaCampanasFlow, getFilaFlow, useOverrides } from '../../data/store';
import { Panel, Kpi, OrigenTag, wrap, inner, useIsMobile } from '../shared/ui';
import { Tabla, VistaHeader, DonaChart, BarritasChart } from './_shared';

interface Props { subId: string; onNavigate: (target: string) => void }

export const PresupuestoVista: React.FC<Props> = ({ subId }) => {
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const campanas = listaCampanasFlow();

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="presupuesto" subId={subId} />

        {subId === 'resumen' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
              <Kpi label="Autorizado" value={fmtMXNCorto(mock.marcas.reduce((s, m) => s + m.presupuesto, 0))} sub="real" />
              <Kpi label="Comprometido" value={fmtMXNCorto(mock.simulado.presupuesto.reduce((s, p) => s + p.comprometido, 0))} sub="simulado" />
              <Kpi label="Ejecutado" value={fmtMXNCorto(mock.simulado.presupuesto.reduce((s, p) => s + p.ejecutado, 0))} sub="simulado" />
            </div>
            <Panel title="Por marca">
              <BarritasChart
                datos={mock.marcas.map(m => ({
                  nombre: m.nombre,
                  Autorizado: m.presupuesto,
                  Comprometido: mock.simulado.presupuesto.find(p => p.marca_id === m.id)?.comprometido ?? 0,
                  Ejecutado: mock.simulado.presupuesto.find(p => p.marca_id === m.id)?.ejecutado ?? 0,
                }))}
                series={[
                  { key: 'Autorizado', color: '#0EA5E9' },
                  { key: 'Comprometido', color: '#F59E0B' },
                  { key: 'Ejecutado', color: '#10B981' },
                ]}
                formatear={fmtMXNCorto}
              />
              <Tabla
                keyOf={m => m.id}
                columnas={[
                  { header: 'Marca', render: m => <span style={{ fontWeight: 600 }}>{m.nombre}</span> },
                  { header: 'Autorizado', align: 'right', render: m => fmtMXNCorto(m.presupuesto) },
                  { header: 'Comprometido', align: 'right', render: m => fmtMXNCorto(mock.simulado.presupuesto.find(p => p.marca_id === m.id)?.comprometido ?? 0) },
                  { header: 'Ejecutado', align: 'right', render: m => fmtMXNCorto(mock.simulado.presupuesto.find(p => p.marca_id === m.id)?.ejecutado ?? 0) },
                  { header: 'Saldo', align: 'right', render: m => fmtMXNCorto(m.presupuesto - (mock.simulado.presupuesto.find(p => p.marca_id === m.id)?.comprometido ?? 0)) },
                  { header: 'Origen', render: m => <OrigenTag origen={m.origen} /> },
                ]}
                filas={mock.marcas}
              />
            </Panel>
          </>
        )}

        {subId === 'por-medio' && (() => {
          const filas = Object.entries(
            campanas.reduce<Record<string, number>>((acc, c) => {
              c.medios.forEach(m => { acc[m.medio] = (acc[m.medio] ?? 0) + m.inversion_total; });
              return acc;
            }, {}),
          ).sort((a, b) => b[1] - a[1]);
          return (
            <Panel title="Autorizado por medio (Flow)" right={<OrigenTag origen="real" />}>
              <DonaChart datos={filas.map(([medio, total]) => ({ nombre: medio, valor: total }))} formatear={fmtMXNCorto} />
              <Tabla
                keyOf={m => m[0]}
                columnas={[
                  { header: 'Medio', render: m => <span style={{ fontWeight: 600 }}>{m[0]}</span> },
                  { header: 'Autorizado', align: 'right', render: m => fmtMXNCorto(m[1] as number) },
                ]}
                filas={filas}
              />
            </Panel>
          );
        })()}

        {subId === 'por-marca' && (
          <Panel title="Autorizado por categoría (Flow)" right={<OrigenTag origen="real" />}>
            <Tabla
              keyOf={c => c[0]}
              columnas={[
                { header: 'Categoría', render: c => <span style={{ fontWeight: 600 }}>{c[0]}</span> },
                { header: 'Autorizado', align: 'right', render: c => fmtMXNCorto(c[1] as number) },
              ]}
              filas={Object.entries(
                campanas.reduce<Record<string, number>>((acc, c) => {
                  const cat = c.categoria ?? 'Sin categoría';
                  acc[cat] = (acc[cat] ?? 0) + c.medios.reduce((s, m) => s + m.inversion_total, 0);
                  return acc;
                }, {}),
              ).sort((a, b) => b[1] - a[1])}
            />
          </Panel>
        )}

        {subId === 'por-trimestre' && (
          <Panel title="Autorizado por trimestre (repartido con el patrón de flighting)" right={<OrigenTag origen="real" />}>
            {(() => {
              const trimestres: string[] = [];
              mock.flow.calendario.forEach(s => { if (s.trimestre && !trimestres.includes(s.trimestre)) trimestres.push(s.trimestre); });
              const totalesPorTrimestre = trimestres.map(tr =>
                campanas.reduce((s, c) => s + c.medios.reduce((s2, m) => {
                  const fila = getFilaFlow(overrides, c.id, m.medio);
                  return s2 + mock.flow.calendario.reduce((acc, sem, i) => acc + (sem.trimestre === tr ? fila.valores[i] ?? 0 : 0), 0);
                }, 0), 0),
              );
              return (
                <Tabla keyOf={t => t} filas={trimestres}
                  columnas={[
                    { header: 'Trimestre', render: t => <span style={{ fontWeight: 600 }}>{t}</span> },
                    { header: 'Autorizado', align: 'right', render: t => fmtMXNCorto(totalesPorTrimestre[trimestres.indexOf(t)]) },
                  ]} />
              );
            })()}
          </Panel>
        )}

        {subId === 'compromisos' && (
          <Panel title="Compromisos con proveedores" right={<OrigenTag origen="simulado" />}>
            <Tabla
              keyOf={c => `${c.campana}-${c.medio}`}
              columnas={[
                { header: 'Campaña', render: c => c.campana },
                { header: 'Medio', render: c => c.medio },
                { header: 'Proveedor', render: c => <span style={{ fontWeight: 600 }}>{c.proveedor}</span> },
                { header: 'Monto', align: 'right', render: c => fmtMXNCorto(c.monto) },
                { header: 'Facturado', align: 'right', render: c => c.facturado ? 'Sí' : 'No' },
              ]}
              filas={mock.simulado.compromisos}
            />
          </Panel>
        )}
      </div>
    </div>
  );
};
