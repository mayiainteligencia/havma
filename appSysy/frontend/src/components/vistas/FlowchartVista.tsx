import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import { fmtMXNCorto } from '../../data/media';
import { mock, listaCampanasFlow, getFilaFlow, getMonitoreo, setCeldaFlow, registrarCambioFlow, confirmarFilaFlow, crearVersionFlow, useOverrides } from '../../data/store';
import { indiceFallasPorSemana, fallaTestigoCelda } from '../../data/metricas';
import { ACTOR_POR_ROL } from '../../data/types';
import { Panel, OrigenTag, wrap, inner, useIsMobile } from '../shared/ui';
import { Tabla, VistaHeader, DonaChart, BarritasChart } from './_shared';
import { GuardarVersionModal } from './GuardarVersionModal';
import { InsightsCard } from './InsightsCard';

interface Props { subId: string; onNavigate: (target: string) => void }

const AMARILLO = '#FEF3C7';
const AMARILLO_BORDE = '#F59E0B';
const TODAS = '__todas__';

export const FlowchartVista: React.FC<Props> = ({ subId }) => {
  const { colores } = brandingConfig;
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const todasCampanas = listaCampanasFlow();
  const [filtroCategoria, setFiltroCategoria] = useState(TODAS);
  const [filtroMedio, setFiltroMedio] = useState(TODAS);
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'sin-confirmar' | 'con-falla'>('todas');
  const categorias = [...new Set(todasCampanas.map(c => c.categoria ?? 'Sin categoría'))];
  const campanas = filtroCategoria === TODAS ? todasCampanas : todasCampanas.filter(c => (c.categoria ?? 'Sin categoría') === filtroCategoria);
  const [campanaId, setCampanaId] = useState(campanas[0]?.id ?? todasCampanas[0].id);
  const campana = campanas.find(c => c.id === campanaId) ?? campanas[0] ?? todasCampanas[0];
  const [modalVersionAbierto, setModalVersionAbierto] = useState(false);

  const indiceFallas = useMemo(() => indiceFallasPorSemana(getMonitoreo(), mock.flow.calendario), []);
  const medioCoincideFiltro = (medio: string) => filtroMedio === TODAS || medio === filtroMedio;
  const filaConFalla = (medio: string) => (indiceFallas.get(medio)?.size ?? 0) > 0;
  const mediosVisibles = campana.medios.filter(m => medioCoincideFiltro(m.medio) && (
    filtroEstado === 'todas'
    || (filtroEstado === 'sin-confirmar' && !getFilaFlow(overrides, campana.id, m.medio).confirmado)
    || (filtroEstado === 'con-falla' && filaConFalla(m.medio))
  ));

  const SelectorCampana = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
      {campanas.map(c => (
        <button key={c.id} onClick={() => setCampanaId(c.id)}
          style={{
            padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${c.id === campanaId ? colores.primario : colores.borde}`,
            background: c.id === campanaId ? colores.primario : 'transparent',
            color: c.id === campanaId ? '#fff' : colores.textoMedio,
          }}>
          {c.campana}
        </button>
      ))}
      {campanas.length === 0 && <span style={{ fontSize: 12.5, color: colores.textoOscuro }}>Sin campañas con estos filtros.</span>}
    </div>
  );

  const selectStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: 9, border: `1px solid ${colores.borde}`, fontSize: 12.5, color: colores.textoClaro };
  const Filtros = (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); }} style={selectStyle}>
        <option value={TODAS}>Todas las marcas</option>
        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filtroMedio} onChange={e => setFiltroMedio(e.target.value)} style={selectStyle}>
        <option value={TODAS}>Todos los medios</option>
        {mock.flow.medios.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as typeof filtroEstado)} style={selectStyle}>
        <option value="todas">Cualquier estado</option>
        <option value="sin-confirmar">Sin confirmar</option>
        <option value="con-falla">Con falla de testigo</option>
      </select>
    </div>
  );

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="flowchart" subId={subId} flowCampanaId={subId === 'vista-anual' ? campana.id : undefined} />

        {subId === 'vista-anual' && (
          <>
            <InsightsCard rol={overrides.rol === 'cliente' ? 'planner' : overrides.rol} />
            {Filtros}
            {SelectorCampana}
            <Panel title={`${campana.campana} — medio × semana`} right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: colores.textoMedio }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: AMARILLO, border: `1px solid ${AMARILLO_BORDE}` }} /> sin confirmar
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: colores.textoMedio }}>
                  <AlertTriangle size={12} color={colores.peligro} /> falla de testigo
                </span>
                <button onClick={() => setModalVersionAbierto(true)}
                  style={{ border: 'none', background: colores.primario, color: '#fff', fontWeight: 700, fontSize: 12.5, padding: '7px 14px', borderRadius: 10, cursor: 'pointer' }}>
                  Guardar como versión
                </button>
              </div>
            }>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11.5 }}>
                  <thead>
                    <tr>
                      <th style={{ position: 'sticky', left: 0, background: colores.fondoPrincipal, padding: '6px 10px', textAlign: 'left', borderBottom: `2px solid ${colores.borde}`, minWidth: 110 }}>Medio</th>
                      {mock.flow.calendario.map(s => (
                        <th key={s.semana} title={s.fecha} style={{ padding: '4px 3px', borderBottom: `2px solid ${colores.borde}`, color: colores.textoOscuro, fontWeight: 600, minWidth: 46 }}>
                          {s.semana}
                        </th>
                      ))}
                      <th style={{ padding: '6px 10px', borderBottom: `2px solid ${colores.borde}`, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediosVisibles.map(m => {
                      const fila = getFilaFlow(overrides, campana.id, m.medio);
                      let valorAlEnfocar = 0;
                      return (
                        <tr key={m.medio}>
                          <td style={{ position: 'sticky', left: 0, background: colores.fondoPrincipal, padding: '6px 10px', fontWeight: 600, borderBottom: `1px solid ${colores.borde}`, whiteSpace: 'nowrap' }}>
                            {m.medio}
                            {!fila.confirmado && (
                              <button onClick={() => confirmarFilaFlow(campana.id, m.medio)}
                                title="Confirmar reparto"
                                style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 700, border: `1px solid ${AMARILLO_BORDE}`, background: AMARILLO, color: '#92400E', borderRadius: 6, padding: '1px 5px', cursor: 'pointer' }}>
                                confirmar
                              </button>
                            )}
                          </td>
                          {fila.valores.map((v, i) => {
                            const falla = fallaTestigoCelda(indiceFallas, m.medio, i, v);
                            const semana = mock.flow.calendario[i];
                            const tooltip = falla
                              ? `Semana ${semana.semana} (${semana.fecha}) — Plan: ${fmtMXNCorto(v)} · ${falla.fila.cadena_plataforma} "${falla.fila.formato_programa}" (${falla.fila.horario}): ${falla.fila.monitoreo}${falla.tipo === 'no_transmitido' ? ` — a reclamar ${fmtMXNCorto(falla.monto)}` : ''}`
                              : `Semana ${semana.semana} (${semana.fecha}) — Plan: ${fmtMXNCorto(v)}`;
                            return (
                              <td key={i} title={tooltip} style={{
                                position: 'relative', padding: 1, borderBottom: `1px solid ${colores.borde}`,
                                background: falla ? '#FEE2E2' : fila.confirmado ? 'transparent' : AMARILLO,
                              }}>
                                {falla && <AlertTriangle size={9} color={colores.peligro} style={{ position: 'absolute', top: 2, right: 2 }} />}
                                <input
                                  value={Math.round(v)}
                                  onFocus={() => { valorAlEnfocar = v; }}
                                  onChange={e => setCeldaFlow(campana.id, m.medio, i, Number(e.target.value) || 0)}
                                  onBlur={e => registrarCambioFlow(m.medio, valorAlEnfocar, Number(e.target.value) || 0)}
                                  style={{
                                    width: 44, textAlign: 'right', border: 'none', background: 'transparent',
                                    fontSize: 10.5, padding: '5px 3px', color: colores.textoClaro,
                                  }}
                                />
                              </td>
                            );
                          })}
                          <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colores.borde}`, textAlign: 'right', fontWeight: 700 }}>
                            {fmtMXNCorto(fila.valores.reduce((s, v) => s + v, 0))}
                          </td>
                        </tr>
                      );
                    })}
                    {mediosVisibles.length === 0 && (
                      <tr><td colSpan={mock.flow.calendario.length + 2} style={{ padding: 16, color: colores.textoOscuro, fontSize: 13 }}>Sin medios con estos filtros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
            {modalVersionAbierto && (
              <GuardarVersionModal onClose={() => setModalVersionAbierto(false)}
                onGuardar={(etiqueta, motivo) => crearVersionFlow({ campanaId: campana.id, etiqueta, motivo, autor: ACTOR_POR_ROL[overrides.rol] })} />
            )}
          </>
        )}

        {subId === 'vista-mensual' && (
          <>
            {SelectorCampana}
            <Panel title={`${campana.campana} — medio × mes`} right={<OrigenTag origen="real" />}>
              {(() => {
                const meses: string[] = [];
                mock.flow.calendario.forEach(s => { if (s.mes && !meses.includes(s.mes)) meses.push(s.mes); });
                return (
                  <Tabla
                    keyOf={m => m.medio}
                    columnas={[
                      { header: 'Medio', render: m => <span style={{ fontWeight: 600 }}>{m.medio}</span> },
                      ...meses.map((mes): { header: string; align: 'right'; render: (m: typeof campana.medios[0]) => React.ReactNode } => ({
                        header: mes.slice(0, 3), align: 'right',
                        render: m => {
                          const fila = getFilaFlow(overrides, campanaId, m.medio);
                          const suma = mock.flow.calendario.reduce((s, sem, i) => s + (sem.mes === mes ? fila.valores[i] ?? 0 : 0), 0);
                          return fmtMXNCorto(suma);
                        },
                      })),
                    ]}
                    filas={campana.medios}
                  />
                );
              })()}
            </Panel>
          </>
        )}

        {subId === 'por-marca' && (() => {
          const filas = Object.entries(
            campanas.reduce<Record<string, { n: number; total: number }>>((acc, c) => {
              const cat = c.categoria ?? 'Sin categoría';
              const total = c.medios.reduce((s, m) => s + m.inversion_total, 0);
              acc[cat] = { n: (acc[cat]?.n ?? 0) + 1, total: (acc[cat]?.total ?? 0) + total };
              return acc;
            }, {}),
          ).map(([cat, v]) => [cat, v.n, v.total] as [string, number, number]);
          return (
            <Panel title="Inversión por marca / categoría (agregado del Flow)" right={<OrigenTag origen="real" />}>
              <DonaChart datos={filas.map(([cat, , total]) => ({ nombre: cat, valor: total }))} formatear={fmtMXNCorto} />
              <Tabla
                keyOf={c => c[0]}
                columnas={[
                  { header: 'Categoría', render: c => <span style={{ fontWeight: 600 }}>{c[0]}</span> },
                  { header: 'Campañas', align: 'right', render: c => String(c[1]) },
                  { header: 'Inversión total', align: 'right', render: c => fmtMXNCorto(c[2] as number) },
                ]}
                filas={filas}
              />
            </Panel>
          );
        })()}

        {subId === 'por-medio' && (() => {
          const filas = Object.entries(
            campanas.reduce<Record<string, number>>((acc, c) => {
              c.medios.forEach(m => { acc[m.medio] = (acc[m.medio] ?? 0) + m.inversion_total; });
              return acc;
            }, {}),
          ).sort((a, b) => b[1] - a[1]);
          return (
            <Panel title="Inversión por medio (agregado del Flow)" right={<OrigenTag origen="real" />}>
              <BarritasChart datos={filas.map(([medio, total]) => ({ nombre: medio, Inversión: total }))}
                series={[{ key: 'Inversión' }]} formatear={fmtMXNCorto} />
              <Tabla
                keyOf={m => m[0]}
                columnas={[
                  { header: 'Medio', render: m => <span style={{ fontWeight: 600 }}>{m[0]}</span> },
                  { header: 'Inversión total', align: 'right', render: m => fmtMXNCorto(m[1] as number) },
                ]}
                filas={filas}
              />
            </Panel>
          );
        })()}

        {subId === 'por-proveedor' && (() => {
          const filas = Object.entries(
            mock.simulado.compromisos.reduce<Record<string, { n: number; total: number }>>((acc, c) => {
              acc[c.proveedor] = { n: (acc[c.proveedor]?.n ?? 0) + 1, total: (acc[c.proveedor]?.total ?? 0) + c.monto };
              return acc;
            }, {}),
          ).map(([prov, v]) => [prov, v.n, v.total] as [string, number, number]);
          return (
            <Panel title="Inversión por proveedor" right={<OrigenTag origen="simulado" />}>
              <DonaChart datos={filas.map(([prov, , total]) => ({ nombre: prov, valor: total }))} formatear={fmtMXNCorto} />
              <Tabla
                keyOf={p => p[0]}
                columnas={[
                  { header: 'Proveedor', render: p => <span style={{ fontWeight: 600 }}>{p[0]}</span> },
                  { header: 'Compromisos', align: 'right', render: p => String(p[1]) },
                  { header: 'Monto', align: 'right', render: p => fmtMXNCorto(p[2] as number) },
                ]}
                filas={filas}
              />
            </Panel>
          );
        })()}
      </div>
    </div>
  );
};
