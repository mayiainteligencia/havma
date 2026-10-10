import React, { useState } from 'react';
import { brandingConfig } from '../../config/branding';
import { fmtMXNCorto } from '../../data/media';
import { mock, listaEjercicios, listaVersiones, useOverrides } from '../../data/store';
import { interpolarEscenario, touchpointQueMasPierdeAlcance } from '../../domain/interpolate';
import { Panel, Kpi, OrigenTag, wrap, inner, useIsMobile } from '../shared/ui';
import { Tabla, VistaHeader, BarritasChart } from './_shared';

interface Props { subId: string; onNavigate: (target: string) => void }

export const ResultadosVista: React.FC<Props> = ({ subId }) => {
  const { colores } = brandingConfig;
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const resultados = mock.simulado.resultados;
  const versiones = listaVersiones(overrides).filter(v => v.ejercicio_base_id && v.factor_presupuesto !== 1);
  const [versionId, setVersionId] = useState(versiones[0]?.id);
  const version = versiones.find(v => v.id === versionId);

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="resultados" subId={subId} />

        {subId === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
              <Kpi label="Planeado" value={fmtMXNCorto(resultados.reduce((s, r) => s + r.planeado, 0))} sub="real" />
              <Kpi label="Real" value={fmtMXNCorto(resultados.reduce((s, r) => s + r.real, 0))} sub="simulado" />
              <Kpi label="Cumplimiento" value={`${((resultados.reduce((s, r) => s + r.real, 0) / resultados.reduce((s, r) => s + r.planeado, 0)) * 100).toFixed(0)}%`} />
            </div>
            <Panel title="Planeado vs. real por marca y canal">
              <BarritasChart
                datos={Object.entries(resultados.reduce<Record<string, { planeado: number; real: number }>>((acc, r) => {
                  acc[r.canal] = { planeado: (acc[r.canal]?.planeado ?? 0) + r.planeado, real: (acc[r.canal]?.real ?? 0) + r.real };
                  return acc;
                }, {})).map(([canal, v]) => ({ nombre: canal, Planeado: v.planeado, Real: v.real }))}
                series={[{ key: 'Planeado', color: '#0EA5E9' }, { key: 'Real', color: colores.primario }]}
                formatear={fmtMXNCorto}
              />
              <Tabla keyOf={r => `${r.marca_id}-${r.canal}`} filas={resultados}
                columnas={[
                  { header: 'Marca', render: r => mock.marcas.find(m => m.id === r.marca_id)?.nombre ?? r.marca_id },
                  { header: 'Canal', render: r => <span style={{ fontWeight: 600 }}>{r.canal}</span> },
                  { header: 'Planeado', align: 'right', render: r => fmtMXNCorto(r.planeado) },
                  { header: 'Real', align: 'right', render: r => fmtMXNCorto(r.real) },
                  { header: 'Origen', render: r => <OrigenTag origen={r.origen} /> },
                ]} />
            </Panel>
          </>
        )}

        {subId === 'por-campana' && (
          <Panel title="Planeado vs. real por campaña" right={<OrigenTag origen="simulado" />}>
            <Tabla keyOf={d => d.campana} filas={mock.simulado.desviaciones}
              columnas={[
                { header: 'Campaña', render: d => <span style={{ fontWeight: 600 }}>{d.campana}</span> },
                { header: 'Planeado', align: 'right', render: d => fmtMXNCorto(d.planeado) },
                { header: 'Real', align: 'right', render: d => fmtMXNCorto(d.real) },
                { header: 'Δ', align: 'right', render: d => `${d.delta_pct > 0 ? '+' : ''}${d.delta_pct}%` },
              ]} />
          </Panel>
        )}

        {subId === 'por-canal' && (
          <Panel title="Planeado vs. real por canal" right={<OrigenTag origen="simulado" />}>
            <Tabla keyOf={r => r.canal}
              filas={Object.entries(resultados.reduce<Record<string, { planeado: number; real: number }>>((acc, r) => {
                acc[r.canal] = { planeado: (acc[r.canal]?.planeado ?? 0) + r.planeado, real: (acc[r.canal]?.real ?? 0) + r.real };
                return acc;
              }, {})).map(([canal, v]) => ({ canal, ...v }))}
              columnas={[
                { header: 'Canal', render: r => <span style={{ fontWeight: 600 }}>{r.canal}</span> },
                { header: 'Planeado', align: 'right', render: r => fmtMXNCorto(r.planeado) },
                { header: 'Real', align: 'right', render: r => fmtMXNCorto(r.real) },
              ]} />
          </Panel>
        )}

        {subId === 'kpis' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
            {listaEjercicios(overrides).map(e => (
              <Panel key={e.id} title={e.exercise.marca ?? e.fuente_archivo} right={<OrigenTag origen={e.origen} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <Kpi label="GRPs" value={e.totales.grps?.toFixed(1) ?? '—'} />
                  <Kpi label="Alcance neto" value={e.totales.alcance_neto != null ? `${(e.totales.alcance_neto * 100).toFixed(1)}%` : '—'} />
                  <Kpi label="CPGRP" value={e.totales.cpgrp != null ? fmtMXNCorto(e.totales.cpgrp) : '—'} />
                  <Kpi label="CPM" value={e.totales.cpm != null ? fmtMXNCorto(e.totales.cpm) : '—'} />
                </div>
              </Panel>
            ))}
          </div>
        )}

        {subId === 'recomendaciones-ia' && (
          <Panel title="Recomendaciones — por plantilla, sin LLM">
            <label style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio, display: 'block', marginBottom: 14 }}>
              Versión a analizar
              <select value={versionId} onChange={e => setVersionId(e.target.value)}
                style={{ display: 'block', marginTop: 5, padding: '8px 10px', borderRadius: 9, border: `1px solid ${colores.borde}`, fontSize: 13, maxWidth: 320 }}>
                {versiones.map(v => <option key={v.id} value={v.id}>{v.etiqueta}</option>)}
              </select>
            </label>
            {(() => {
              if (!version) return <p style={{ fontSize: 13, color: colores.textoMedio }}>No hay versiones con cambio de presupuesto para analizar.</p>;
              const base = mock.ejercicios.find(e => e.id === version.ejercicio_base_id);
              if (!base) return null;
              const baseInterp = interpolarEscenario(base.escenarios, 1);
              const cambio = version.interpolado ?? interpolarEscenario(base.escenarios, version.factor_presupuesto);
              if (!baseInterp || !cambio) return <p style={{ fontSize: 13, color: colores.textoMedio }}>Este ejercicio no trae Budget Scenarios para interpolar.</p>;
              const peor = touchpointQueMasPierdeAlcance(baseInterp, cambio);
              const deltaInv = cambio.presupuesto_total - baseInterp.presupuesto_total;
              const deltaGrps = cambio.totales.grps - baseInterp.totales.grps;
              const deltaImp = cambio.totales.impactos_miles - baseInterp.totales.impactos_miles;
              const deltaAlc = (cambio.totales.alcance - baseInterp.totales.alcance) * 100;
              const forzados = base.touchpoints.filter(t => t.restriccion_min != null && t.restriccion_min === t.restriccion_max);
              const dupTodasEn100 = (base.duplicaciones?.length ?? 0) > 0 && base.duplicaciones!.every(d => d.indice === 100);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13.5, color: colores.textoClaro, lineHeight: 1.6, margin: 0 }}>
                    Con el factor <strong>{version.factor_presupuesto}x</strong> ({version.etiqueta}), la inversión pasa de {fmtMXNCorto(baseInterp.presupuesto_total)} a {fmtMXNCorto(cambio.presupuesto_total)}
                    {' '}(<strong style={{ color: deltaInv >= 0 ? colores.exito : colores.peligro }}>{deltaInv >= 0 ? '+' : ''}{fmtMXNCorto(deltaInv)}</strong>).
                    Los GRPs cambian en <strong>{deltaGrps >= 0 ? '+' : ''}{deltaGrps.toFixed(1)}</strong>, los impactos (miles) en <strong>{deltaImp >= 0 ? '+' : ''}{deltaImp.toFixed(0)}</strong> y
                    {' '}el alcance neto en <strong>{deltaAlc >= 0 ? '+' : ''}{deltaAlc.toFixed(1)} pp</strong>.
                    {peor && <> El touchpoint que más alcance pierde es <strong>{peor.touchpoint}</strong> ({(peor.delta * 100).toFixed(1)} pp).</>}
                  </p>
                  {forzados.length > 0 && (
                    <div style={{ padding: 10, borderRadius: 10, background: '#FEF3C7', border: '1px solid #F59E0B', fontSize: 12.5, color: '#92400E' }}>
                      Mix forzado: {forzados.map(t => t.nombre).join(', ')} tiene(n) mínimo = máximo en Restrictions — el optimizador no optimizó ahí.
                    </div>
                  )}
                  {dupTodasEn100 && (
                    <div style={{ padding: 10, borderRadius: 10, background: '#FEF3C7', border: '1px solid #F59E0B', fontSize: 12.5, color: '#92400E' }}>
                      Todas las duplicaciones valen 100 (valor por defecto) — el alcance neto puede ser optimista.
                    </div>
                  )}
                </div>
              );
            })()}
          </Panel>
        )}
      </div>
    </div>
  );
};
