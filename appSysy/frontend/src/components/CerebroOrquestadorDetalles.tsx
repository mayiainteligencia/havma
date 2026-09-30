import React, { useState, useEffect } from 'react';
import {
  FileText, GitBranch, ShieldAlert, DollarSign, Radio, Settings,
  TrendingUp, MapPin, Eye, AlertTriangle, Activity, X,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell, Legend,
} from 'recharts';
import { brandingConfig } from '../config/branding';
import {
  MODULOS_CEREBRO, COLOR_CATEGORIA, ESTADO_MODULO,
  type ModuloCerebro, type GraficaModulo,
} from '../data/plataforma';

const { colores } = brandingConfig;
const V = colores.primario;
const TXT = colores.textoClaro;
const MUT = colores.textoOscuro;
const MED = colores.textoMedio;

const PALETA = ['#7C3AED', '#1A1A1A', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

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

const useIsMobile = (bp = 768) => {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < bp);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);
  return m;
};

// ── primitivas ──
const sub: React.CSSProperties = {
  background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 14, padding: 16,
};
const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: MED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{children}</div>
);
const Chip: React.FC<{ t: string; c: string; solid?: boolean }> = ({ t, c, solid }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap',
    color: solid ? '#fff' : c, background: solid ? c : `${c}1A`, border: `1px solid ${c}33`,
  }}>{t}</span>
);

const ejes = {
  tick: { fill: MUT, fontSize: 11 },
  tooltip: { background: colores.fondoClaro, border: `1px solid ${colores.borde}`, borderRadius: 10, fontSize: 12 },
};

// ── versión grande de la gráfica del catálogo ──
const MiniChart: React.FC<{ g: GraficaModulo }> = ({ g }) => {
  const primera = g.series[0];
  const esDonut = g.tipo === 'donut';
  return (
    <div style={sub}>
      <SubTitle>{g.titulo}</SubTitle>
      <ResponsiveContainer width="100%" height={210}>
        {esDonut ? (
          <PieChart>
            <Pie data={g.data} dataKey={primera.key} nameKey={g.ejeX} innerRadius={52} outerRadius={82} paddingAngle={3} stroke="none">
              {g.data.map((d, i) => <Cell key={i} fill={(d.fill as string) ?? PALETA[i % PALETA.length]} />)}
            </Pie>
            <Legend verticalAlign="bottom" height={26} />
            <Tooltip contentStyle={ejes.tooltip} />
          </PieChart>
        ) : (
          <BarChart data={g.data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
            <CartesianGrid stroke={colores.borde} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={g.ejeX} tick={ejes.tick} axisLine={false} tickLine={false} />
            <YAxis tick={ejes.tick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={ejes.tooltip} cursor={{ fill: `${V}12` }} />
            {g.series.length > 1 && <Legend verticalAlign="top" height={26} />}
            {g.series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label}
                fill={s.color ?? (g.series.length > 1 ? PALETA[i % PALETA.length] : V)}
                radius={[6, 6, 0, 0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// ════════════════════════ DETALLE ════════════════════════
// El contenido sale del catálogo compartido (data/plataforma.ts): mismas
// métricas y misma gráfica que la tarjeta, en tamaño grande.

const DetalleModulo: React.FC<{ d: ModuloCerebro; isMobile: boolean }> = ({ d, isMobile }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <p style={{ fontSize: 13.5, color: MED, lineHeight: 1.5, margin: 0 }}>{d.descripcion}</p>

    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : `repeat(${d.metricas.length},1fr)`, gap: 10 }}>
      {d.metricas.map(m => (
        <div key={m.label} style={{ ...sub, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: TXT, lineHeight: 1.2 }}>{m.valor}</div>
          <div style={{ fontSize: 10.5, color: MUT, marginTop: 4 }}>{m.label}</div>
          {m.delta && <div style={{ fontSize: 10, color: MUT, opacity: .8, marginTop: 3 }}>{m.delta}</div>}
        </div>
      ))}
    </div>

    <MiniChart g={d.grafica} />

    {d.enVivo && (
      <p style={{ fontSize: 11.5, color: MUT, margin: 0 }}>
        Único módulo conectado a datos en vivo — se alimenta del servicio de monitoreo de la sección Testigos IA.
      </p>
    )}
  </div>
);

// ════════════════════════ REGISTRO + MODAL ════════════════════════
export const META = MODULOS_CEREBRO.map(d => ({
  num: d.num, icon: ICONOS[d.id] ?? Activity, tag: d.tag, titulo: d.titulo,
}));

export const ModuloDetalleModal: React.FC<{ num: number | null; onClose: () => void }> = ({ num, onClose }) => {
  const isMobile = useIsMobile();
  useEffect(() => {
    if (num == null) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [num, onClose]);

  if (num == null) return null;
  const d = MODULOS_CEREBRO.find(x => x.num === num);
  if (!d) return null;
  const Icon = ICONOS[d.id] ?? Activity;
  const est = ESTADO_MODULO[d.estado];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,10,10,0.55)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: isMobile ? 12 : 32, overflowY: 'auto', animation: 'iel-fadeup .2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: colores.fondoClaro, borderRadius: 20, border: `1px solid ${colores.borde}`,
        boxShadow: colores.sombraGrande, width: '100%', maxWidth: 920, padding: isMobile ? 16 : 26,
        animation: 'mia-modal .25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: colores.gradientePrimario, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <Icon size={20} color="#fff" />
            <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 999, background: V, color: '#0A0A0A', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{num}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLOR_CATEGORIA[d.tag], letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d.tag}</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: TXT, margin: '2px 0 0' }}>{d.titulo}</h3>
          </div>
          {d.enVivo
            ? <Chip t="DATOS EN VIVO" c={colores.exito} solid />
            : <Chip t={est.texto} c={est.color} />}
          <button onClick={onClose} aria-label="Cerrar" style={{
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
            background: colores.fondoSecundario, border: `1px solid ${colores.borde}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} color={MED} /></button>
        </div>
        <DetalleModulo d={d} isMobile={isMobile} />
      </div>
    </div>
  );
};
