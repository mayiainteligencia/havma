import React from 'react';
import { ShieldAlert, Eye, Ban, PiggyBank, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Panel, Kpi, keyframes, wrap, inner, useIsMobile } from '../shared/ui';
import { brandingConfig } from '../../config/branding';
import { fmtMXNCorto, porPeriodo, ULTIMO } from '../../data/media';

const { colores } = brandingConfig;
const V = colores.primario;
const D = porPeriodo[ULTIMO];

// Inversión digital expuesta a riesgo (≈35% del total del cliente).
const INVERSION_DIGITAL = Math.round(D.inversionCliente * 0.35);

const TRAFICO = [
  { fuente: 'Programática', invalido: 18.4, gasto: 0.34 },
  { fuente: 'Display directo', invalido: 6.1, gasto: 0.21 },
  { fuente: 'Video in-stream', invalido: 4.3, gasto: 0.24 },
  { fuente: 'Social ads', invalido: 2.2, gasto: 0.15 },
  { fuente: 'Búsqueda', invalido: 0.9, gasto: 0.06 },
];

const VIEWABILITY = [
  { formato: 'Video in-stream', valor: 82, piso: 70 },
  { formato: 'Display 300x250', valor: 64, piso: 70 },
  { formato: 'Display 728x90', valor: 51, piso: 70 },
  { formato: 'Rich media', valor: 76, piso: 70 },
];

const ADYACENCIAS = [
  { categoria: 'Contenido violento', impresiones: '142K', severidad: 'alta' as const, sitio: 'Red programática · long tail' },
  { categoria: 'Desinformación', impresiones: '96K', severidad: 'alta' as const, sitio: 'Agregadores de noticias' },
  { categoria: 'Contenido para adultos', impresiones: '31K', severidad: 'media' as const, sitio: 'Apps de terceros' },
  { categoria: 'Piratería', impresiones: '18K', severidad: 'media' as const, sitio: 'Sitios de streaming' },
  { categoria: 'Comentarios tóxicos', impresiones: '9K', severidad: 'baja' as const, sitio: 'Video social' },
];

const SEV_COLOR = { alta: colores.peligro, media: colores.advertencia, baja: colores.textoOscuro };

export const AdFraudBrandSafety: React.FC = () => {
  const isMobile = useIsMobile();
  const grid = (cols: string): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : cols, gap: 16 });

  const invalidoPonderado = TRAFICO.reduce((s, t) => s + t.invalido * t.gasto, 0);
  const recuperable = Math.round(INVERSION_DIGITAL * invalidoPonderado / 100);

  return (
    <div style={wrap(isMobile)}>
      <style>{keyframes}</style>
      <div style={inner}>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colores.textoClaro, margin: '0 0 6px' }}>
            Ad Fraud & Brand Safety
          </h2>
          <p style={{ color: colores.textoMedio, fontSize: isMobile ? 14 : 16, margin: 0 }}>
            Tráfico inválido, viewability y adyacencia de contenido riesgoso sobre la inversión digital.
          </p>
        </div>

        <div style={{ ...grid('repeat(4, 1fr)'), marginBottom: 22 }}>
          <Kpi label="Tráfico inválido" value={`${invalidoPonderado.toFixed(1)}%`} sub="ponderado por gasto" up={false} />
          <Kpi label="Viewability media" value="68%" delta="piso contratado 70%" up={false} />
          <Kpi label="Adyacencias de riesgo" value="296K" sub="impresiones bloqueables" up={false} />
          <Kpi label="Presupuesto recuperable" value={fmtMXNCorto(recuperable)} sub={`de ${fmtMXNCorto(INVERSION_DIGITAL)} digital`} up />
        </div>

        <div style={{ ...grid('1.3fr 1fr'), marginBottom: 22 }}>
          <Panel title="Tráfico inválido por fuente" icon={<Ban size={17} color={colores.peligro} />}>
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={TRAFICO} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colores.borde} vertical={false} />
                  <XAxis dataKey="fuente" tick={{ fontSize: 10.5, fill: colores.textoOscuro }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: colores.textoOscuro }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`${v}% inválido`, '']} cursor={{ fill: `${V}12` }} />
                  <Bar dataKey="invalido" radius={[6, 6, 0, 0]}>
                    {TRAFICO.map((t, i) => (
                      <Cell key={i} fill={t.invalido >= 10 ? colores.peligro : t.invalido >= 4 ? colores.advertencia : V} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: 12, color: colores.textoOscuro, margin: '10px 0 0', lineHeight: 1.4 }}>
              La programática concentra el problema: 18.4% de tráfico inválido sobre el 34% del gasto digital.
            </p>
          </Panel>

          <Panel title="Viewability por formato" icon={<Eye size={17} color={V} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {VIEWABILITY.map(f => {
                const bajoPiso = f.valor < f.piso;
                return (
                  <div key={f.formato}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, color: colores.textoClaro }}>{f.formato}</span>
                      <span style={{ fontWeight: 700, color: bajoPiso ? colores.peligro : colores.exito, fontVariantNumeric: 'tabular-nums' }}>
                        {f.valor}%
                      </span>
                    </div>
                    <div style={{ position: 'relative', height: 10, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden' }}>
                      <div style={{ width: `${f.valor}%`, height: '100%', borderRadius: 999, background: bajoPiso ? colores.peligro : colores.exito }} />
                      <span style={{ position: 'absolute', left: `${f.piso}%`, top: -2, width: 2, height: 14, background: colores.textoClaro }} title={`Piso contratado ${f.piso}%`} />
                    </div>
                  </div>
                );
              })}
              <p style={{ fontSize: 11.5, color: colores.textoOscuro, margin: 0 }}>
                La marca vertical indica el piso contratado con el medio (70%).
              </p>
            </div>
          </Panel>
        </div>

        <div style={grid('1.3fr 1fr')}>
          <Panel title="Adyacencia de contenido riesgoso" icon={<ShieldAlert size={17} color={colores.peligro} />}
            right={<span style={{ fontSize: 12, color: colores.textoOscuro }}>{ADYACENCIAS.length} categorías</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {ADYACENCIAS.map(a => (
                <div key={a.categoria} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: colores.fondoSecundario, border: `1px solid ${colores.borde}`,
                  borderLeft: `3px solid ${SEV_COLOR[a.severidad]}`, borderRadius: 12, padding: '11px 13px',
                }}>
                  <AlertTriangle size={16} color={SEV_COLOR[a.severidad]} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: colores.textoClaro }}>{a.categoria}</div>
                    <div style={{ fontSize: 11.5, color: colores.textoOscuro, marginTop: 2 }}>{a.sitio}</div>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: colores.textoClaro, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {a.impresiones}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Presupuesto recuperable" icon={<PiggyBank size={17} color={colores.exito} />}>
            <div style={{ textAlign: 'center', padding: '12px 0 18px' }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: colores.textoClaro, lineHeight: 1 }}>{fmtMXNCorto(recuperable)}</div>
              <div style={{ fontSize: 12, color: colores.textoOscuro, marginTop: 6 }}>reclamable al cierre del periodo</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { l: 'Impresiones no visibles', v: 46 },
                { l: 'Tráfico de bots', v: 33 },
                { l: 'Adyacencia bloqueada tarde', v: 21 },
              ].map(r => (
                <div key={r.l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: colores.textoMedio }}>{r.l}</span>
                    <span style={{ fontWeight: 700, color: colores.textoClaro }}>{r.v}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden' }}>
                    <div style={{ width: `${r.v}%`, height: '100%', borderRadius: 999, background: V }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
