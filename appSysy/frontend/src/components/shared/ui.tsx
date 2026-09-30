import React, { useState } from 'react';
import { Brain, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import { useToast } from './toast';
import { useConfirm } from './confirm';
import type { Origen } from '../../data/types';

const { colores } = brandingConfig;
const V = colores.primario;

export const keyframes = `
@keyframes elFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes elPulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes elPop{0%{transform:scale(1)}45%{transform:scale(.97)}100%{transform:scale(1)}}
@media (prefers-reduced-motion: reduce){.el-anim,.el-pulse{animation:none!important}}
`;

// ── Punto "LIVE" parpadeante ──
export const LiveDot: React.FC<{ label?: string }> = ({ label = 'LIVE' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.05em', color: colores.exito }}>
    <span className="el-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: colores.exito, animation: 'elPulse 1.4s ease-in-out infinite' }} />
    {label}
  </span>
);

// ── Panel / tarjeta contenedora ──
export const Panel: React.FC<{ title?: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }> =
({ title, icon, right, children, style }) => (
  <section style={{
    background: colores.fondoClaro, border: `1px solid ${colores.borde}`, borderRadius: 18,
    padding: 20, boxShadow: colores.sombra, animation: 'elFadeUp .4s ease both', ...style,
  }} className="el-anim">
    {(title || right) && (
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {icon}
          {title && <h3 style={{ fontSize: 15, fontWeight: 700, color: colores.textoClaro, margin: 0 }}>{title}</h3>}
        </div>
        {right}
      </header>
    )}
    {children}
  </section>
);

// ── KPI tile ──
export const Kpi: React.FC<{ label: string; value: string; delta?: string; up?: boolean; sub?: string }> =
({ label, value, delta, up, sub }) => (
  <div style={{ background: colores.fondoClaro, border: `1px solid ${colores.borde}`, borderRadius: 14, padding: 16, boxShadow: colores.sombra }}>
    <div style={{ fontSize: 12, color: colores.textoOscuro, fontWeight: 600, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: colores.textoClaro, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
    {(delta || sub) && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: up === false ? colores.peligro : colores.exito, fontWeight: 600 }}>
        {up !== undefined && (up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
        <span style={{ color: delta ? undefined : colores.textoOscuro }}>{delta || sub}</span>
        {delta && sub && <span style={{ color: colores.textoOscuro, fontWeight: 500 }}>· {sub}</span>}
      </div>
    )}
  </div>
);

// ── Tarjeta de insight de MAYIA (Análisis / Predicción / Sugerencia) ──
type InsightKind = 'Análisis' | 'Predicción' | 'Sugerencia';
export const Insight: React.FC<{ kind: InsightKind; title: string; children: React.ReactNode; plan?: string }> =
({ kind, title, children, plan }) => {
  const { push } = useToast();
  const confirmar = useConfirm();
  const [state, setState] = useState<'idle' | 'activo' | 'descartado'>('idle');
  const activar = async () => {
    if (await confirmar({ titulo: title, descripcion: plan! })) {
      setState('activo');
      push({ kind: 'success', title: 'Plan activado', msg: plan! });
    }
  };
  const kindColor = kind === 'Predicción' ? '#0047AB' : kind === 'Sugerencia' ? V : colores.textoClaro;

  if (state === 'descartado') return null;

  return (
    <div className="el-anim" style={{
      background: state === 'activo' ? `${V}0D` : colores.fondoSecundario,
      border: `1px solid ${state === 'activo' ? V : colores.borde}`,
      borderRadius: 14, padding: 15, transition: 'background .3s, border-color .3s', animation: state === 'activo' ? 'elPop .35s ease' : undefined,
    }}>
      <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: kindColor, marginBottom: 7 }}>{kind}</span>
      <div style={{ fontSize: 14, fontWeight: 700, color: colores.textoClaro, marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: 13, color: colores.textoMedio, lineHeight: 1.5, margin: 0 }}>{children}</p>
      {plan && (
        state === 'activo' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, color: colores.exito, fontSize: 13, fontWeight: 700 }}>
            <Check size={16} /> Plan activado
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={activar}
              style={{ border: 'none', background: V, color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }}>
              Activar plan
            </button>
            <button onClick={() => setState('descartado')}
              style={{ border: `1px solid ${colores.borde}`, background: 'transparent', color: colores.textoMedio, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }}>
              Descartar
            </button>
          </div>
        )
      )}
    </div>
  );
};

// ── Cabecera de sección con panel "MAYIA · análisis en vivo" ──
export const SectionHero: React.FC<{ eyebrow: string; title: React.ReactNode; subtitle: string; right?: React.ReactNode; insights: React.ReactNode }> =
({ eyebrow, title, subtitle, right, insights }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 18, marginBottom: 22 }} className="el-hero">
    <div style={{
      background: colores.gradientePrimario, borderRadius: 22, padding: 26, color: '#fff', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -60, right: -40, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${V}55, transparent 70%)` }} />
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: `${V}` }}>{eyebrow}</span>
        <h1 style={{ fontSize: 30, fontWeight: 300, margin: '10px 0 6px', letterSpacing: '-0.5px' }}>{title}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.72)', margin: 0, maxWidth: 560, lineHeight: 1.5 }}>{subtitle}</p>
        {right && <div style={{ marginTop: 16 }}>{right}</div>}
      </div>
    </div>
    <Panel title="MAYIA · análisis" icon={<div style={{ width: 30, height: 30, borderRadius: 9, background: `${V}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={17} color={V} /></div>} right={<LiveDot label="análisis en vivo" />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{insights}</div>
    </Panel>
  </div>
);

// ── Etiqueta de origen del dato: real (verde) / importado (azul) / simulado (gris) ──
const ORIGEN_INFO: Record<Origen, { label: string; color: string }> = {
  real: { label: 'real', color: colores.exito },
  importado: { label: 'importado', color: '#3B82F6' },
  simulado: { label: 'simulado', color: colores.textoOscuro },
};

export const OrigenTag: React.FC<{ origen: Origen; style?: React.CSSProperties }> = ({ origen, style }) => {
  const { label, color } = ORIGEN_INFO[origen];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '.04em', color, background: `${color}17`,
      border: `1px solid ${color}40`, borderRadius: 999, padding: '2px 8px', lineHeight: 1.6, ...style,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
};

// ── Semáforo de cuadre: rojo solo se usa para esto (alertas de descuadre) ──
export const Semaforo: React.FC<{ ok: boolean; textoOk?: string; textoError?: string }> =
({ ok, textoOk = 'cuadra', textoError = 'no cuadra' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
    color: ok ? colores.exito : colores.peligro,
  }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? colores.exito : colores.peligro }} />
    {ok ? textoOk : textoError}
  </span>
);

export const wrap = (isMobile: boolean): React.CSSProperties => ({
  minHeight: '100%', padding: isMobile ? 16 : 30, background: colores.fondoPrincipal,
});
export const inner: React.CSSProperties = { maxWidth: 1500, margin: '0 auto' };

export function useIsMobile() {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  React.useEffect(() => {
    const f = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return m;
}
