import React, { useRef, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import { fmtMXN, fmtMXNCorto } from '../../data/media';
import {
  listaEjercicios, getEjercicioActivo, setEjercicioActivo, getBitacora,
  updateBriefField, updateTouchpointInversion, registrarCambioInversion, semaforoCuadre, crearVersionEjercicio, useOverrides,
} from '../../data/store';
import { interpolarEscenario } from '../../data/interpolate';
import { ACTOR_POR_ROL } from '../../data/types';
import { Panel, OrigenTag, Semaforo, wrap, inner, useIsMobile } from '../shared/ui';
import { NumeroAnimado } from '../shared/NumeroAnimado';
import { Tabla, VistaHeader, DonaChart } from './_shared';
import { GuardarVersionModal } from './GuardarVersionModal';
import { InsightsCard } from './InsightsCard';
import { BitacoraPanel } from './BitacoraPanel';

interface Props { subId: string; onNavigate: (target: string) => void }

const CAMPO_LABEL: Record<string, string> = {
  anunciante: 'Anunciante', marca: 'Marca', campana: 'Campaña', periodo_inicio: 'Periodo — inicio',
  periodo_fin: 'Periodo — fin', presupuesto: 'Presupuesto', moneda: 'Moneda',
};

export const PlaneacionVista: React.FC<Props> = ({ subId }) => {
  const { colores } = brandingConfig;
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const ejercicio = getEjercicioActivo(overrides);
  const [factorEscenario, setFactorEscenario] = useState(1);
  const [modalVersionAbierto, setModalVersionAbierto] = useState(false);
  const valorAlEnfocar = useRef<Record<string, number>>({});

  const semaforo = semaforoCuadre(ejercicio);
  const escenarios = ejercicio.escenarios;
  const factores = escenarios?.map(e => e.factor_presupuesto) ?? [1];
  const [minF, maxF] = [Math.min(...factores), Math.max(...factores)];
  const interpolado = interpolarEscenario(escenarios, factorEscenario);

  // Efecto en vivo del mix actual vs. el presupuesto base — el "+$2M TV → +1.8 pts
  // de alcance" que pide el producto, interpolando sobre los mismos Budget Scenarios.
  const presupuestoBase = ejercicio.exercise.presupuesto ?? 0;
  const factorActual = presupuestoBase ? (ejercicio.totales.inversion ?? 0) / presupuestoBase : 1;
  const interpBase = interpolarEscenario(escenarios, 1);
  const interpActual = interpolarEscenario(escenarios, factorActual);
  const efecto = interpBase && interpActual && Math.abs(factorActual - 1) > 0.001 ? {
    deltaInversion: (ejercicio.totales.inversion ?? 0) - presupuestoBase,
    deltaAlcancePts: (interpActual.totales.alcance - interpBase.totales.alcance) * 100,
    deltaCprpPct: interpActual.totales.grps && interpBase.totales.grps
      ? (((interpActual.presupuesto_total / interpActual.totales.grps) / (interpBase.presupuesto_total / interpBase.totales.grps)) - 1) * 100
      : 0,
  } : null;

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="planeacion" subId={subId} />
        <InsightsCard rol="planner" />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: colores.textoOscuro }}>Ejercicio activo:</span>
          {listaEjercicios(overrides).map(e => (
            <button key={e.id} onClick={() => setEjercicioActivo(e.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${e.id === ejercicio.id ? colores.primario : colores.borde}`,
                background: e.id === ejercicio.id ? colores.primario : 'transparent',
                color: e.id === ejercicio.id ? '#fff' : colores.textoMedio,
              }}>
              {e.exercise.marca ?? e.fuente_archivo} <OrigenTag origen={e.origen} />
            </button>
          ))}
        </div>

        {subId === 'brief' && (
          <Panel title="Brief — editable" right={<OrigenTag origen={ejercicio.origen} />}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14 }}>
              {(['anunciante', 'marca', 'campana', 'periodo_inicio', 'periodo_fin', 'moneda'] as const).map(campo => (
                <label key={campo} style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio }}>
                  {CAMPO_LABEL[campo]}
                  <input
                    value={ejercicio.exercise[campo] ?? ''}
                    onChange={e => updateBriefField(ejercicio.id, campo, e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '9px 11px', borderRadius: 9, border: `1px solid ${colores.borde}`, fontSize: 13.5, color: colores.textoClaro }}
                  />
                </label>
              ))}
              <label style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio }}>
                Presupuesto
                <input
                  type="number"
                  value={ejercicio.exercise.presupuesto ?? ''}
                  onChange={e => updateBriefField(ejercicio.id, 'presupuesto', Number(e.target.value))}
                  style={{ display: 'block', width: '100%', marginTop: 5, padding: '9px 11px', borderRadius: 9, border: `1px solid ${colores.borde}`, fontSize: 13.5, color: colores.textoClaro }}
                />
              </label>
            </div>
          </Panel>
        )}

        {subId === 'target-audiencia' && (
          <Panel title="Target & audiencia" right={<OrigenTag origen={ejercicio.origen} />}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
              {[
                ['Target', ejercicio.exercise.target ?? '—'],
                ['Edad', ejercicio.exercise.edad_min && ejercicio.exercise.edad_max ? `${ejercicio.exercise.edad_min}–${ejercicio.exercise.edad_max}` : '—'],
                ['Género', ejercicio.exercise.genero ?? '—'],
                ['Universo', ejercicio.exercise.universo ? ejercicio.exercise.universo.toLocaleString('es-MX') : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: colores.textoOscuro, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colores.textoClaro, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {subId === 'mix-medios' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 18, alignItems: 'start' }}>
            <Panel title="Mix de medios — editable" right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Semaforo ok={semaforo.ok} textoOk={`cuadra (±${(semaforo.pct * 100).toFixed(2)}%)`} textoError={`no cuadra (${(semaforo.pct * 100).toFixed(1)}% de desvío)`} />
                <button onClick={() => setModalVersionAbierto(true)}
                  style={{ border: 'none', background: colores.primario, color: '#fff', fontWeight: 700, fontSize: 12.5, padding: '7px 14px', borderRadius: 10, cursor: 'pointer' }}>
                  Guardar como versión
                </button>
              </div>
            }>
              {/* Barra de efecto en vivo: interpola sobre Budget Scenarios al vuelo */}
              {efecto && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 12,
                  background: efecto.deltaInversion >= 0 ? `${colores.exito}0F` : `${colores.peligro}0A`,
                  border: `1px solid ${efecto.deltaInversion >= 0 ? colores.exito : colores.peligro}40`, marginBottom: 14,
                  transition: 'background .3s',
                }}>
                  {efecto.deltaInversion >= 0 ? <TrendingUp size={16} color={colores.exito} /> : <TrendingDown size={16} color={colores.peligro} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: colores.textoClaro }}>
                    <NumeroAnimado valor={efecto.deltaInversion} formatear={v => `${v >= 0 ? '+' : ''}${fmtMXNCorto(v)}`} /> vs. presupuesto
                  </span>
                  <span style={{ fontSize: 13, color: colores.textoMedio }}>
                    → <NumeroAnimado valor={efecto.deltaAlcancePts} formatear={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts`} /> de alcance,
                    {' '}CPRP <NumeroAnimado valor={efecto.deltaCprpPct} formatear={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} />
                  </span>
                </div>
              )}
              <DonaChart datos={ejercicio.touchpoints.filter(t => t.inversion).map(t => ({ nombre: t.nombre, valor: t.inversion ?? 0 }))} formatear={fmtMXNCorto} />
              <Tabla
                keyOf={t => t.nombre}
                columnas={[
                  { header: 'Touchpoint', render: t => <span style={{ fontWeight: 600 }}>{t.nombre}</span> },
                  { header: 'Inversión', align: 'right', render: t => (
                    <input type="number" value={Math.round(t.inversion ?? 0)}
                      onFocus={() => { valorAlEnfocar.current[t.nombre] = t.inversion ?? 0; }}
                      onChange={e => updateTouchpointInversion(ejercicio.id, t.nombre, Number(e.target.value))}
                      onBlur={e => registrarCambioInversion(t.nombre, valorAlEnfocar.current[t.nombre] ?? (t.inversion ?? 0), Number(e.target.value))}
                      style={{ width: 130, textAlign: 'right', padding: '5px 8px', borderRadius: 7, border: `1px solid ${colores.borde}`, fontSize: 13 }} />
                  ) },
                  { header: 'Share', align: 'right', render: t => t.share_inversion != null ? `${(t.share_inversion * 100).toFixed(1)}%` : '—' },
                  { header: 'GRPs', align: 'right', render: t => t.grps?.toFixed(1) ?? '—' },
                  { header: 'Alcance', align: 'right', render: t => t.alcance != null ? `${(t.alcance * 100).toFixed(1)}%` : '—' },
                ]}
                filas={ejercicio.touchpoints}
              />
              <div style={{ marginTop: 12, textAlign: 'right', fontSize: 13, fontWeight: 700, color: colores.textoClaro }}>
                Total: {fmtMXN(ejercicio.totales.inversion ?? 0)} · Presupuesto: {fmtMXN(ejercicio.exercise.presupuesto ?? 0)}
              </div>
              {modalVersionAbierto && (
                <GuardarVersionModal onClose={() => setModalVersionAbierto(false)}
                  onGuardar={(etiqueta, motivo) => crearVersionEjercicio({
                    ejercicioBaseId: ejercicio.id, etiqueta, motivo, autor: ACTOR_POR_ROL[overrides.rol],
                    factorPresupuesto: ejercicio.exercise.presupuesto ? Math.round(((ejercicio.totales.inversion ?? 0) / ejercicio.exercise.presupuesto) * 100) / 100 : 1,
                  })} />
              )}
            </Panel>
            <BitacoraPanel entradas={getBitacora(overrides, 20)} />
          </div>
        )}

        {subId === 'escenarios' && (
          escenarios && escenarios.length > 0 ? (
            <Panel title="Escenarios (Budget Scenarios) — interpolado en vivo" right={<OrigenTag origen={ejercicio.origen} />}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: colores.textoClaro, minWidth: 90 }}>Factor: {factorEscenario.toFixed(2)}x</span>
                <input type="range" min={minF} max={maxF} step={0.01} value={factorEscenario}
                  onChange={e => setFactorEscenario(Number(e.target.value))} style={{ flex: 1, accentColor: colores.primario }} />
                <span style={{ fontSize: 13, color: colores.textoMedio }}>{fmtMXNCorto(interpolado?.presupuesto_total ?? 0)}</span>
              </div>
              {interpolado && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={interpolado.por_touchpoint}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colores.borde} />
                    <XAxis dataKey="touchpoint" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmtMXNCorto(v)} />
                    <Bar dataKey="inversion" name="Inversión" fill={colores.primario} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 13 }}>
                <span>GRPs: <strong><NumeroAnimado valor={interpolado?.totales.grps ?? 0} formatear={v => v.toFixed(1)} /></strong></span>
                <span>Impactos (miles): <strong><NumeroAnimado valor={interpolado?.totales.impactos_miles ?? 0} formatear={v => v.toFixed(0)} /></strong></span>
                <span>Alcance: <strong><NumeroAnimado valor={(interpolado?.totales.alcance ?? 0) * 100} formatear={v => `${v.toFixed(1)}%`} /></strong></span>
              </div>
            </Panel>
          ) : (
            <Panel title="Escenarios"><p style={{ fontSize: 13, color: colores.textoMedio }}>Este ejercicio no trae Budget Scenarios.</p></Panel>
          )
        )}

        {subId === 'alcance-frecuencia' && (
          ejercicio.alcance_por_frecuencia && ejercicio.alcance_por_frecuencia.length > 0 ? (
            <Panel title="Alcance acumulado 1+ a 10+ por touchpoint" right={<OrigenTag origen={ejercicio.origen} />}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={Array.from({ length: 10 }, (_, i) => {
                  const punto: Record<string, number | string> = { freq: `${i + 1}+` };
                  ejercicio.alcance_por_frecuencia!.forEach(row => { punto[row.touchpoint] = Number(row[`f${i + 1}`]) * 100; });
                  return punto;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colores.borde} />
                  <XAxis dataKey="freq" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {ejercicio.alcance_por_frecuencia!.map((row, i) => (
                    <Line key={row.touchpoint} type="monotone" dataKey={row.touchpoint}
                      stroke={`hsl(${(i * 47) % 360} 65% 45%)`} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          ) : (
            <Panel title="Alcance & frecuencia"><p style={{ fontSize: 13, color: colores.textoMedio }}>Este ejercicio no trae Reach &amp; Frequency.</p></Panel>
          )
        )}
      </div>
    </div>
  );
};
