import React, { useState } from 'react';
import { PieChart as PieIcon, TrendingUp, Trophy, Megaphone } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Panel, Kpi, Insight, SectionHero, keyframes, wrap, inner, useIsMobile } from './shared/ui';
import { brandingConfig } from '../config/branding';
import {
  porPeriodo, PERIODOS, ULTIMO, MARCAS, CLIENTE, fmt, fmtMXNCorto,
  MARCA_COLOR, MARCA_NOMBRE, proyeccionSOV,
} from '../data/media';

const { colores } = brandingConfig;
const V = colores.primario;

const tendencia = PERIODOS.map(p => ({
  periodo: p,
  sov: porPeriodo[p].sovCliente,
  lideradas: porPeriodo[p].plazasLideradas,
}));

export const InvestmentValue: React.FC = () => {
  const isMobile = useIsMobile();
  const [anio, setAnio] = useState(ULTIMO);
  const D = porPeriodo[anio];
  const proj = proyeccionSOV();
  const grid = (cols: string): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : cols, gap: 16 });

  const lideradasData = MARCAS.map(m => [m.id, D.lideradas[m.id]] as const).sort((a, b) => b[1] - a[1]);
  const pieData = lideradasData.map(([id, v]) => ({ name: id, value: v }));

  return (
    <div style={wrap(isMobile)}>
      <style>{keyframes}</style>
      <div style={inner}>
        <SectionHero
          eyebrow="Investment Value IA"
          title={<>Valor de la <strong style={{ fontWeight: 800 }}>Inversión</strong></>}
          subtitle="Inversión, GRPs y Share of Voice por plaza. Selecciona el periodo para comparar la evolución."
          right={
            <div style={{ display: 'inline-flex', gap: 6, background: 'rgba(255,255,255,.12)', padding: 5, borderRadius: 12 }}>
              {PERIODOS.map(a => {
                const on = String(a) === anio;
                return (
                  <button key={a} onClick={() => setAnio(String(a))} style={{
                    border: 'none', cursor: 'pointer', padding: '8px 20px', borderRadius: 9, fontSize: 14, fontWeight: 700,
                    background: on ? '#fff' : 'transparent', color: on ? colores.textoClaro : 'rgba(255,255,255,.75)', transition: 'all .2s',
                  }}>{a}</button>
                );
              })}
            </div>
          }
          insights={<>
            <Insight kind="Predicción" title={`Proyección de SOV: ~${proj}% el próximo periodo`}>
              El Share of Voice de {CLIENTE.nombre} pasó de {porPeriodo[PERIODOS[0]].sovCliente}% ({PERIODOS[0]}) a {porPeriodo[ULTIMO].sovCliente}% ({ULTIMO}). El modelo proyecta ~{proj}% si la tendencia se mantiene.
            </Insight>
            <Insight kind="Análisis" title={`${D.segundaMarca} es la 2ª marca (${D.lideradasSegunda} plazas)`}>
              Tras {CLIENTE.nombre}, {D.segundaMarca} lidera {D.lideradasSegunda} plazas. Vigilar su avance en el siguiente flight.
            </Insight>
          </>}
        />

        {/* KPIs */}
        <div style={{ ...grid('repeat(4, 1fr)'), marginBottom: 22 }}>
          <Kpi label="Plazas lideradas" value={`${Math.round(D.plazasLideradas / D.totalPlazas * 100)}%`} sub={`${fmt(D.plazasLideradas)} de ${fmt(D.totalPlazas)}`} up />
          <Kpi label="Inversión del cliente" value={fmtMXNCorto(D.inversionCliente)} delta={`SOV ${D.sovCliente}%`} up />
          <Kpi label="Inversión de categoría" value={fmtMXNCorto(D.inversionTotal)} sub={`${fmt(D.grpsTotal)} GRPs`} up />
          <Kpi label="Alcance promedio" value={`${D.alcanceProm}%`} sub="cobertura por plaza" up />
        </div>

        {/* Ganados (dona) + Tendencia histórica */}
        <div style={{ ...grid('1fr 1.3fr'), marginBottom: 22 }}>
          <Panel title={`Plazas lideradas · ${anio}`} icon={<PieIcon size={17} color={V} />}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
              <div style={{ width: 150, height: 150, position: 'relative', flexShrink: 0 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="none">
                      {pieData.map(d => <Cell key={d.name} fill={MARCA_COLOR[d.name] || colores.textoOscuro} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [`${v} plazas`, MARCA_NOMBRE[n] ?? n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: colores.textoClaro }}>{fmt(D.totalPlazas)}</span>
                  <span style={{ fontSize: 11, color: colores.textoOscuro }}>plazas</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
                {lideradasData.map(([id, v]) => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: MARCA_COLOR[id] || colores.textoOscuro, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, color: colores.textoClaro, flex: 1 }}>{MARCA_NOMBRE[id]}</span>
                    <span style={{ color: colores.textoOscuro, fontVariantNumeric: 'tabular-nums' }}>{v} · {Math.round(v / D.totalPlazas * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title={`Tendencia de SOV · ${CLIENTE.nombre}`} icon={<TrendingUp size={17} color={V} />}>
            <div style={{ height: 210 }}>
              <ResponsiveContainer>
                <LineChart data={tendencia} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colores.borde} vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: colores.textoOscuro }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: colores.textoOscuro }} axisLine={false} tickLine={false} unit="%" domain={[0, 60]} />
                  <Tooltip formatter={(v: number) => [`${v}%`, `SOV ${CLIENTE.nombre}`]} />
                  <Line type="monotone" dataKey="sov" stroke={V} strokeWidth={3} dot={{ r: 5, fill: V }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6 }}>
              {tendencia.map(t => (
                <div key={t.periodo} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: colores.textoClaro }}>{t.lideradas}</div>
                  <div style={{ fontSize: 11.5, color: colores.textoOscuro }}>plazas · {t.periodo}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Inversión por marca + top plazas */}
        <div style={grid('1fr 1fr')}>
          <Panel title={`Inversión por marca · ${anio}`} icon={<Megaphone size={17} color={V} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {MARCAS.map(m => {
                const v = D.inversionPorMarca[m.id];
                const pct = Math.round(v / D.inversionTotal * 1000) / 10;
                return (
                  <div key={m.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: colores.textoClaro }}>{m.nombre}</span>
                      <span style={{ color: colores.textoOscuro, fontVariantNumeric: 'tabular-nums' }}>{fmtMXNCorto(v)} · {pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: MARCA_COLOR[m.id], borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title={`Top plazas por inversión · ${anio}`} icon={<Trophy size={17} color={V} />} right={<span style={{ fontSize: 12, color: colores.textoOscuro }}>{D.topPlazas.length} plazas</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {D.topPlazas.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 11, padding: '10px 12px' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: colores.textoClaro, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colores.textoClaro, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.plaza}</div>
                    <div style={{ fontSize: 11.5, color: colores.textoOscuro }}>{fmtMXNCorto(m.inversionMXN)} de inversión</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: MARCA_COLOR[m.lider] || V, background: `${MARCA_COLOR[m.lider] || V}18`, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>{MARCA_NOMBRE[m.lider]}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
