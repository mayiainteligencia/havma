import React, { useState } from 'react';
import { Radio, Smartphone, Globe, MessageCircle, Brain, Sparkles, MapPin } from 'lucide-react';
import { brandingConfig } from '../../../config/branding';
import { estadosPaths } from '../../../data/mexicoPaths';
import { porPeriodo, ULTIMO, CLIENTE, fmt, fmtMXNCorto } from '../../../data/media';
import { useToast } from '../../shared/toast';
import { useConfirm } from '../../shared/confirm';

const { colores } = brandingConfig;
const V = colores.primario;
const D = porPeriodo[ULTIMO];
const PLAZA_POR_ID = Object.fromEntries(D.plazas.map(p => [p.id, p]));
// Plaza con monitoreo on-air en vivo (Testigos IA); el resto es proyección.
const PLAZA_VIVA = 'MX_DF';

// Seed determinista por plaza → señales dummy plausibles.
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

type Señal = {
  radio: number; inApp: number; openWeb: number; redes: number;
  pos: number; neu: number; neg: number;
  sov: number; inversionMXN: number; grps: number; alcancePct: number;
  prediccion: string; speech: string; real: boolean;
};

const PREDICCIONES = [
  'el mensaje de producto gana tracción en radio; conviene reforzarlo en redes esta semana.',
  'el eje de precio polariza; un ajuste de copy bajaría el sentimiento negativo.',
  'hay ventana en open web: la competencia no está ocupando ese espacio.',
  'la conversación en redes crece más rápido que en radio; prioriza formatos cortos.',
  'la audiencia responde mejor a creatividades locales; personaliza por plaza.',
];
const SPEECHES = [
  'la gente repite el claim de la campaña, pero pide ejemplos concretos.',
  'el público reacciona positivo a disponibilidad y frío a temas de precio.',
  'el último spot se cita textual en 3 estaciones; el mensaje pegó.',
  'hay dudas recurrentes sobre el tiempo de entrega; conviene aclararlo.',
  'las menciones suben cuando se habla de servicio; la audiencia lo valida.',
];

function señal(id: string): Señal {
  const p = PLAZA_POR_ID[id];
  const h = hash(id);
  const sov = p?.sovPorMarca[CLIENTE.id] ?? 0;
  const radio = 20 + (h % 180), inApp = 15 + ((h >> 3) % 140), openWeb = 10 + ((h >> 6) % 120), redes = 40 + ((h >> 9) % 320);
  const pos = 28 + (h % 30), neg = 15 + ((h >> 4) % 25); const neu = Math.max(10, 100 - pos - neg);
  const real = id === PLAZA_VIVA;
  return {
    radio, inApp, openWeb, redes, pos, neu, neg,
    sov,
    inversionMXN: p?.inversionMXN ?? 0,
    grps: p?.grps ?? 0,
    alcancePct: p?.alcancePct ?? 0,
    real,
    prediccion: real
      ? `${CLIENTE.nombre} tiene ${sov}% de SOV en la plaza con ${fmt(p?.grps ?? 0)} GRPs. Rebalancear al drive time PM sube la cobertura sin más inversión.`
      : PREDICCIONES[h % PREDICCIONES.length],
    speech: SPEECHES[(h >> 5) % SPEECHES.length],
  };
}

// Intensidad del mapa = Share of Voice del cliente en la plaza.
function nivel(s: Señal): 'low' | 'medium' | 'high' | 'critical' {
  if (s.neg >= 32) return 'critical';
  if (s.sov >= 34) return 'high';
  if (s.sov >= 27) return 'medium';
  return 'low';
}
const FILL: Record<string, string> = {
  low: `${V}33`, medium: `${V}66`, high: `${V}AA`, critical: 'rgba(225,37,27,0.62)',
};
const STROKE: Record<string, string> = { low: V, medium: V, high: V, critical: '#E1251B' };

const CANALES = (s: Señal) => [
  { Icon: Radio, label: 'Radio', v: s.radio, color: V },
  { Icon: Smartphone, label: 'In-App', v: s.inApp, color: '#0047AB' },
  { Icon: Globe, label: 'Open Web', v: s.openWeb, color: '#E56A00' },
  { Icon: MessageCircle, label: 'Redes', v: s.redes, color: colores.exito },
];

const METRICAS = (s: Señal) => [
  { label: 'Share of Voice', v: `${s.sov}%` },
  { label: 'Inversión', v: fmtMXNCorto(s.inversionMXN) },
  { label: 'GRPs', v: fmt(s.grps) },
  { label: 'Alcance', v: `${s.alcancePct}%` },
];

export const MapaMexicoDashboard: React.FC = () => {
  const { push } = useToast();
  const confirmar = useConfirm();
  const [sel, setSel] = useState<{ id: string; label: string }>({ id: PLAZA_VIVA, label: 'Ciudad de México' });
  const s = señal(sel.id);
  const dataMap = React.useMemo(() => {
    const m: Record<string, Señal> = {};
    estadosPaths.forEach(e => { m[e.id] = señal(e.id); });
    return m;
  }, []);

  return (
    <div style={{ background: colores.fondoClaro, borderRadius: 20, padding: 24, border: `1px solid ${colores.borde}`, boxShadow: colores.sombra, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${V}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={20} color={V} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colores.textoClaro, margin: 0 }}>Share of Voice por plaza</h3>
          <p style={{ fontSize: 12, color: colores.textoOscuro, margin: '2px 0 0' }}>Intensidad = SOV de {CLIENTE.nombre} · pasa el cursor</p>
        </div>
      </div>

      {/* Mapa */}
      <div style={{ position: 'relative', width: '100%', background: colores.fondoSecundario, borderRadius: 14, padding: 8, marginTop: 12, flexShrink: 0 }}>
        <svg viewBox="0 0 959 593" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', maxHeight: 240, display: 'block', margin: '0 auto' }} aria-label="Mapa de México · señales por estado">
          {estadosPaths.map(e => {
            const lv = nivel(dataMap[e.id]);
            const active = sel.id === e.id;
            const isViva = e.id === PLAZA_VIVA;
            return (
              <path
                key={e.id}
                d={e.path}
                fill={active ? STROKE[lv] : FILL[lv]}
                stroke={active || isViva ? STROKE[lv] : colores.fondoClaro}
                strokeWidth={active ? 2.4 : isViva ? 1.8 : 0.8}
                style={{ cursor: 'pointer', transition: 'fill .18s, stroke .18s' }}
                onMouseEnter={() => setSel({ id: e.id, label: e.label })}
                onClick={() => setSel({ id: e.id, label: e.label })}
              >
                <title>{e.label}</title>
              </path>
            );
          })}
        </svg>
      </div>

      {/* Panel de detalle del estado seleccionado */}
      <div style={{ marginTop: 14, background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 14, padding: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: colores.textoClaro }}>{sel.label}</span>
          {s.real
            ? <span style={{ fontSize: 10.5, fontWeight: 700, color: colores.exito, background: `${colores.exito}18`, padding: '2px 8px', borderRadius: 999 }}>ON-AIR EN VIVO</span>
            : <span style={{ fontSize: 10.5, fontWeight: 700, color: colores.textoOscuro, background: colores.fondoTerciario, padding: '2px 8px', borderRadius: 999 }}>proyección</span>}
        </div>

        {/* Métricas de plaza */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          {METRICAS(s).map(m => (
            <div key={m.label} style={{ background: colores.fondoClaro, border: `1px solid ${colores.borde}`, borderRadius: 10, padding: '9px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: colores.textoClaro, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{m.v}</div>
              <div style={{ fontSize: 10, color: colores.textoOscuro, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Canales detectados */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          {CANALES(s).map(c => (
            <div key={c.label} style={{ background: colores.fondoClaro, border: `1px solid ${colores.borde}`, borderRadius: 10, padding: '9px 8px', textAlign: 'center' }}>
              <c.Icon size={15} color={c.color} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: colores.textoClaro, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fmt(c.v)}</div>
              <div style={{ fontSize: 10, color: colores.textoOscuro, marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Sentimiento */}
        <div style={{ display: 'flex', height: 7, borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${s.pos}%`, background: colores.exito }} title={`Positivo ${s.pos}%`} />
          <div style={{ width: `${s.neu}%`, background: colores.fondoTerciario }} title={`Neutral ${s.neu}%`} />
          <div style={{ width: `${s.neg}%`, background: colores.peligro }} title={`Negativo ${s.neg}%`} />
        </div>

        {/* Predicción MAYIA */}
        <div style={{ display: 'flex', gap: 9, marginBottom: 8 }}>
          <Brain size={16} color={V} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: colores.textoMedio, lineHeight: 1.45, margin: 0 }}>
            <strong style={{ color: colores.textoClaro }}>Con base a esto podemos deducir que </strong>{s.prediccion}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 9, marginBottom: 14 }}>
          <Sparkles size={16} color={colores.exito} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: colores.textoMedio, lineHeight: 1.45, margin: 0 }}>
            <strong style={{ color: colores.textoClaro }}>En tu speech, </strong>{s.speech}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={async () => { if (await confirmar({ titulo: `Plan · ${sel.label}`, descripcion: s.prediccion })) push({ kind: 'success', title: `Plan activado · ${sel.label}`, msg: s.prediccion }); }}
            style={{ border: 'none', background: V, color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 10, cursor: 'pointer' }}>
            Activar plan
          </button>
          <button onClick={() => push({ kind: 'info', title: `Otras opciones · ${sel.label}`, msg: 'MAYIA generará 2 alternativas de estrategia para este estado.' })}
            style={{ border: `1px solid ${colores.borde}`, background: 'transparent', color: colores.textoMedio, fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 10, cursor: 'pointer' }}>
            Prefiero otro
          </button>
        </div>
      </div>
    </div>
  );
};
