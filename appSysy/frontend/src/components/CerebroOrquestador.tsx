import React, { useState, useEffect } from 'react';
import {
  Megaphone, TrendingUp, Users2, ShieldAlert, Radio, Activity,
  ArrowUpRight, ArrowDownRight, FileText, GitBranch, DollarSign, Settings,
  MapPin, Eye, AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, Tooltip,
} from 'recharts';
import { brandingConfig } from '../config/branding';
import { ModuloDetalleModal } from './CerebroOrquestadorDetalles';
import { porPeriodo, ULTIMO, COBERTURA, fmt } from '../data/media';
import {
  MODULOS_CEREBRO, COLOR_CATEGORIA, ESTADO_MODULO, composicion,
  type ModuloCerebro, type GraficaModulo,
} from '../data/plataforma';

const { colores } = brandingConfig;
const D = porPeriodo[ULTIMO];

const PALETA = ['#7C3AED', '#1A1A1A', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

// ───────────────────────── MÓDULOS ─────────────────────────
// num/tag/titulo/descripcion/estado/metricas/grafica salen del catálogo
// compartido (data/plataforma.ts); aquí solo se les pone cara.

const ICONOS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  intake: FileText,
  traffic: GitBranch,
  sla: ShieldAlert,
  budget: DollarSign,
  testigos: Radio,
  pauta: Settings,
  mmm: TrendingUp,
  ooh_score: MapPin,
  competencia: Eye,
  anomalias: AlertTriangle,
};

// ───────────────────────── UI HELPERS ─────────────────────────

const Badge: React.FC<{ texto: string; color: string; pulse?: boolean }> = ({ texto, color, pulse }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
    color, background: `${color}1A`, border: `1px solid ${color}40`,
    padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }}>
    {pulse && <span className="mia-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: color }} />}
    {texto}
  </span>
);

const Delta: React.FC<{ v: number }> = ({ v }) => {
  const up = v >= 0;
  const c = up ? colores.exito : colores.peligro;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: c, fontSize: 11, fontWeight: 700 }}>
      <Icon size={12} color={c} /> {Math.abs(v)}%
    </span>
  );
};

const tooltipStyle = {
  background: colores.secundario, border: 'none', borderRadius: 10,
  fontSize: 12, color: '#fff', padding: '6px 10px',
} as const;

const MiniViz: React.FC<{ g: GraficaModulo }> = ({ g }) => {
  const ejeX = g.ejeX;
  const primera = g.series[0];

  // Categórica: barras horizontales con su etiqueta, sin ejes.
  if (g.tipo === 'barrasH') {
    const max = Math.max(...g.data.map(d => Number(d[primera.key])));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        {g.data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: colores.textoMedio, width: 84, flexShrink: 0 }}>{d[ejeX]}</span>
            <div style={{ flex: 1, height: 8, background: `${colores.secundario}12`, borderRadius: 999, overflow: 'hidden' }}>
              <div className="mia-grow" style={{
                width: `${(Number(d[primera.key]) / max) * 100}%`, height: '100%', borderRadius: 999,
                background: `linear-gradient(90deg, ${colores.primario}, ${colores.exito})`,
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: colores.textoClaro, width: 26, textAlign: 'right' }}>
              {d[primera.key]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Serie temporal de una sola variable: última barra destacada.
  if (g.tipo === 'spark') {
    return (
      <ResponsiveContainer width="100%" height={88}>
        <BarChart data={g.data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey={ejeX} tick={{ fill: colores.textoOscuro, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Bar dataKey={primera.key} radius={[4, 4, 0, 0]} isAnimationActive>
            {g.data.map((_, i) => (
              <Cell key={i} fill={i === g.data.length - 1 ? colores.primario : `${colores.secundario}33`} />
            ))}
          </Bar>
          <Tooltip contentStyle={tooltipStyle} cursor={false} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (g.tipo === 'donut') {
    const total = g.data.reduce((s, d) => s + Number(d[primera.key]), 0);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ResponsiveContainer width="48%" height={98}>
          <PieChart>
            <Pie data={g.data} dataKey={primera.key} nameKey={ejeX} innerRadius={26} outerRadius={42} paddingAngle={3} stroke="none">
              {g.data.map((d, i) => <Cell key={i} fill={(d.fill as string) ?? PALETA[i % PALETA.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
          {g.data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: (d.fill as string) ?? PALETA[i % PALETA.length] }} />
              <span style={{ color: colores.textoMedio, flex: 1 }}>{d[ejeX]}</span>
              <span style={{ fontWeight: 700, color: colores.textoClaro }}>
                {Math.round((Number(d[primera.key]) / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Series comparadas (planeado vs ejecutado, cliente vs competencia...).
  return (
    <div>
      <ResponsiveContainer width="100%" height={88}>
        <BarChart data={g.data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey={ejeX} tick={{ fill: colores.textoOscuro, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: `${colores.primario}10` }} />
          {g.series.map(s => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color ?? colores.primario} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
        {g.series.map(s => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: colores.textoOscuro }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color ?? colores.primario }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const ModuloCard: React.FC<{ m: ModuloCerebro; i: number; onOpen: (num: number) => void }> = ({ m, i, onOpen }) => {
  const Icon = ICONOS[m.id] ?? Activity;
  const catColor = COLOR_CATEGORIA[m.tag];
  const est = ESTADO_MODULO[m.estado];
  const live = m.estado === 'activo';
  return (
    <div className="mia-card" role="button" tabIndex={0}
      onClick={() => onOpen(m.num)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(m.num); } }}
      style={{
        background: colores.fondoClaro, borderRadius: 20, padding: 20, cursor: 'pointer',
        border: live ? `1.5px solid ${colores.exito}` : `1px solid ${colores.borde}`,
        boxShadow: live ? `0 0 0 4px ${colores.exito}14, ${colores.sombraMedia}` : colores.sombra,
        display: 'flex', flexDirection: 'column', gap: 14,
        animationDelay: `${i * 0.05}s`,
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            background: colores.gradientePrimario,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <Icon size={20} color="#fff" />
            <span style={{
              position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 999,
              background: colores.primario, color: '#0A0A0A', fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{m.num}</span>
          </div>
          <div>
            <Badge texto={m.tag} color={catColor} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colores.textoClaro, margin: '6px 0 0', lineHeight: 1.2 }}>{m.titulo}</h3>
          </div>
        </div>
        <Badge texto={live ? 'LIVE' : est.texto} color={est.color} pulse={live} />
      </div>

      <p style={{ fontSize: 12.5, color: colores.textoOscuro, margin: 0, lineHeight: 1.45 }}>{m.descripcion}</p>

      <div style={{ display: 'flex', gap: 8 }}>
        {m.metricas.slice(0, 3).map((k, j) => (
          <div key={j} style={{
            flex: 1, background: colores.fondoSecundario, borderRadius: 12, padding: '10px 12px',
            border: `1px solid ${colores.borde}`,
          }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: colores.textoClaro, lineHeight: 1.1 }}>{k.valor}</div>
            <div style={{ fontSize: 10, color: colores.textoOscuro, marginTop: 4, lineHeight: 1.3 }}>{k.label}</div>
            {k.delta && <div style={{ fontSize: 9.5, color: colores.textoOscuro, opacity: .8, marginTop: 2 }}>{k.delta}</div>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: colores.textoOscuro, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
          {m.grafica.titulo}
        </div>
        <MiniViz g={m.grafica} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <span style={{ fontSize: 10, color: colores.textoOscuro, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: est.color }} /> {est.texto}
        </span>
        <span className="mia-vermas" style={{ fontSize: 11, fontWeight: 800, color: colores.primario }}>Ver detalle →</span>
      </div>
    </div>
  );
};

// ───────────────────────── COMPONENTE PRINCIPAL ─────────────────────────

export const CerebroOrquestador: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [openNum, setOpenNum] = useState<number | null>(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const kpisTop = [
    { icon: Radio, label: 'Emisoras monitoreadas', value: fmt(COBERTURA.emisoras), delta: 3 },
    { icon: Activity, label: 'Detecciones hoy', value: '12,480', delta: 18 },
    { icon: Megaphone, label: 'Plazas activas', value: fmt(D.totalPlazas), delta: 12 },
    { icon: Users2, label: 'Impactos del periodo', value: `${fmt(Math.round(D.impactos / 1_000_000))}M`, delta: 6 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: colores.fondoPrincipal, padding: isMobile ? 16 : 32 }}>
      <style>{`
        @keyframes mia-fadeup { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mia-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
        @keyframes mia-grow { from { width: 0; } }
        .mia-card { animation: mia-fadeup .5s ease both; }
        .mia-card:hover { box-shadow: ${colores.sombraGrande}; transform: translateY(-3px); }
        .mia-card:hover .mia-vermas { letter-spacing: .03em; }
        .mia-card:focus-visible { outline: 2px solid ${colores.primario}; outline-offset: 2px; }
        .mia-card { transition: transform .2s ease, box-shadow .2s ease; }
        @keyframes mia-modal { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: none; } }
        .mia-pulse { animation: mia-pulse 1.4s ease-in-out infinite; }
        .mia-grow { animation: mia-grow 1s ease both; }
      `}</style>

      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        {/* HERO */}
        <div style={{
          background: colores.gradientePrimario, borderRadius: 24, padding: isMobile ? 20 : 32,
          marginBottom: 24, position: 'relative', overflow: 'hidden',
          boxShadow: colores.sombraGrande,
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: 999,
            background: `radial-gradient(circle, ${colores.primario}55, transparent 70%)`,
          }} />
          <Badge texto="EN VIVO" color={colores.primario} pulse />
          <h1 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 300, color: '#fff', margin: '14px 0 6px', letterSpacing: '-0.5px' }}>
            Cerebro <span style={{ fontWeight: 800, color: colores.primario }}>Orquestador</span>
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.7)', margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
            La capa que coordina la plataforma: Agentes que operan el flujo de trabajo, Operadores que ejecutan sobre los medios, Modelos que predicen y Agentes de Insights que generan hallazgos.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
            gap: 12, marginTop: 24, position: 'relative',
          }}>
            {kpisTop.map((k, i) => {
              const Icon = k.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 16, padding: 16, backdropFilter: 'blur(6px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Icon size={18} color={colores.primario} />
                    <Delta v={k.delta} />
                  </div>
                  <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', marginTop: 10, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{k.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN MÓDULOS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colores.textoClaro, margin: 0 }}>Módulos orquestados</h2>
          <span style={{ fontSize: 12, color: colores.textoOscuro }}>{composicion()}</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20, marginBottom: 32,
        }}>
          {MODULOS_CEREBRO.map((m, i) => <ModuloCard key={m.num} m={m} i={i} onOpen={setOpenNum} />)}
        </div>
      </div>

      {/* DETALLE EN MODAL AL HACER CLIC */}
      <ModuloDetalleModal num={openNum} onClose={() => setOpenNum(null)} />
    </div>
  );
};
