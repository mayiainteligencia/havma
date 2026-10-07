import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import { fmtMXNCorto } from '../../data/media';
import { mock, listaCampanasFlow, getFilaFlow, getMonitoreo, useOverrides } from '../../data/store';
import { cumplimientoPct, cprpPlan, cprpReal, dineroEnRiesgo } from '../../data/metricas';
import { Panel, OrigenTag, wrap, inner, useIsMobile } from '../shared/ui';
import { Tabla, VistaHeader, DonaChart, BarritasChart } from './_shared';

interface Props { subId: string; onNavigate: (target: string) => void }

/** Tarjeta con barra de progreso — autorizado/comprometido/ejecutado, con rojo solo si se excede. */
const TarjetaProgreso: React.FC<{ label: string; valor: number; total: number; color: string; sub?: string; alerta?: boolean }> =
({ label, valor, total, color, sub, alerta }) => {
  const { colores } = brandingConfig;
  const pct = total ? Math.min(100, (valor / total) * 100) : 0;
  return (
    <div style={{ background: colores.fondoClaro, border: `1px solid ${alerta ? colores.peligro : colores.borde}`, borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 12, color: colores.textoOscuro, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: alerta ? colores.peligro : colores.textoClaro }}>{fmtMXNCorto(valor)}</div>
      <div style={{ height: 6, borderRadius: 999, background: colores.fondoTerciario, marginTop: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: alerta ? colores.peligro : color, transition: 'width .4s' }} />
      </div>
      {sub && <div style={{ fontSize: 11, color: colores.textoOscuro, marginTop: 6 }}>{sub}</div>}
    </div>
  );
};

export const PresupuestoVista: React.FC<Props> = ({ subId }) => {
  const { colores } = brandingConfig;
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const campanas = listaCampanasFlow();
  const autorizado = mock.marcas.reduce((s, m) => s + m.presupuesto, 0);
  const comprometido = mock.simulado.presupuesto.reduce((s, p) => s + p.comprometido, 0);
  const ejecutado = mock.simulado.presupuesto.reduce((s, p) => s + p.ejecutado, 0);
  const enRiesgo = dineroEnRiesgo(getMonitoreo());
  const excedido = ejecutado > autorizado;

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="presupuesto" subId={subId} />

        {subId === 'resumen' && (
          <>
            {(excedido || enRiesgo > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: `${colores.peligro}0F`, border: `1px solid ${colores.peligro}40`, marginBottom: 16 }}>
                <AlertTriangle size={18} color={colores.peligro} />
                <span style={{ fontSize: 13, color: colores.textoClaro }}>
                  {excedido && <>Lo ejecutado excede lo autorizado. </>}
                  {enRiesgo > 0 && <>{fmtMXNCorto(enRiesgo)} en riesgo por spots no transmitidos o fuera de horario.</>}
                </span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
              <TarjetaProgreso label="Autorizado" valor={autorizado} total={autorizado} color="#0EA5E9" sub="real" />
              <TarjetaProgreso label="Comprometido" valor={comprometido} total={autorizado} color="#F59E0B" sub="simulado" />
              <TarjetaProgreso label="Ejecutado" valor={ejecutado} total={autorizado} color={colores.exito} sub="simulado" alerta={excedido} />
              <TarjetaProgreso label="En riesgo" valor={enRiesgo} total={autorizado} color={colores.peligro} sub="simulado (testigo)" alerta={enRiesgo > 0} />
            </div>
            <Panel title="Cumplimiento y CPRP por medio (monitoreo)" style={{ marginBottom: 18 }}>
              <Tabla
                keyOf={m => m[0]}
                columnas={[
                  { header: 'Medio', render: m => <span style={{ fontWeight: 600 }}>{m[0]}</span> },
                  { header: 'Cumplimiento', align: 'right', render: m => `${(m[1] as number).toFixed(0)}%` },
                  { header: 'CPRP plan', align: 'right', render: m => fmtMXNCorto(m[2] as number) },
                  { header: 'CPRP real', align: 'right', render: m => (m[3] as number) > 0 ? fmtMXNCorto(m[3] as number) : '—' },
                ]}
                filas={Object.entries(
                  getMonitoreo().reduce<Record<string, { cump: number[]; plan: number[]; real: number[] }>>((acc, f) => {
                    const g = acc[f.medio] ?? { cump: [], plan: [], real: [] };
                    g.cump.push(cumplimientoPct(f));
                    const p = cprpPlan(f); if (p !== null) g.plan.push(p);
                    const r = cprpReal(f); if (r !== null) g.real.push(r);
                    acc[f.medio] = g;
                    return acc;
                  }, {}),
                ).map(([medio, g]) => [
                  medio,
                  g.cump.reduce((s, v) => s + v, 0) / g.cump.length,
                  g.plan.reduce((s, v) => s + v, 0) / (g.plan.length || 1),
                  g.real.reduce((s, v) => s + v, 0) / (g.real.length || 1),
                ] as [string, number, number, number])}
              />
            </Panel>
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
