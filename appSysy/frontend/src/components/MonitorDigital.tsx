import React, { useState, useEffect } from 'react';
import {
  Globe, Smartphone, Lock, User, ShieldCheck, Loader2, Plus, Check,
  Music2, Instagram, Facebook, Youtube, Twitter, FileText, Megaphone,
  ArrowUpRight, ArrowDownRight, Heart, Eye, Users2, Activity, X,
  ThumbsUp, ThumbsDown, Minus,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip,
} from 'recharts';
import { brandingConfig } from '../config/branding';

const { colores } = brandingConfig;

// ───────────────────────── DATA DUMMY (feedback simulado de cada app) ─────────────────────────

type Sent = { pos: number; neu: number; neg: number };

interface Feedback {
  seguidores: string;
  alcanceMes: string;
  engagement: string;
  impresionesInApp: string;
  deltaSeguidores: number;
  deltaEngagement: number;
  sentimiento: Sent;
  serie: number[];
  topPosts: { titulo: string; alcance: string; interacciones: string }[];
}

interface Plataforma {
  id: string;
  nombre: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  ambito: 'in-app' | 'open-web';
  placeholder: string;
  feedback: Feedback;
}

const PLATAFORMAS: Plataforma[] = [
  {
    id: 'tiktok', nombre: 'TikTok', icon: Music2, color: '#000000', ambito: 'in-app',
    placeholder: '@tu_cuenta',
    feedback: {
      seguidores: '48.2K', alcanceMes: '1.9M', engagement: '7.4%', impresionesInApp: '2.3M',
      deltaSeguidores: 12, deltaEngagement: 5,
      sentimiento: { pos: 68, neu: 24, neg: 8 },
      serie: [30, 45, 40, 62, 55, 80, 74, 96, 88, 120],
      topPosts: [
        { titulo: 'Haul de temporada — formato vertical', alcance: '412K', interacciones: '38.2K' },
        { titulo: 'Reto viral #EstiloLiverpool', alcance: '287K', interacciones: '24.1K' },
        { titulo: 'Probador virtual (clip)', alcance: '155K', interacciones: '11.8K' },
      ],
    },
  },
  {
    id: 'instagram', nombre: 'Instagram', icon: Instagram, color: '#E1306C', ambito: 'in-app',
    placeholder: '@tu_cuenta',
    feedback: {
      seguidores: '73.5K', alcanceMes: '980K', engagement: '4.9%', impresionesInApp: '1.4M',
      deltaSeguidores: 6, deltaEngagement: -2,
      sentimiento: { pos: 61, neu: 30, neg: 9 },
      serie: [50, 48, 60, 58, 72, 68, 85, 80, 92, 100],
      topPosts: [
        { titulo: 'Reel — lanzamiento de temporada', alcance: '210K', interacciones: '17.4K' },
        { titulo: 'Carrusel: 5 looks de la colección', alcance: '134K', interacciones: '9.2K' },
        { titulo: 'Historia con encuesta de estilo', alcance: '88K', interacciones: '6.1K' },
      ],
    },
  },
  {
    id: 'facebook', nombre: 'Facebook', icon: Facebook, color: '#1877F2', ambito: 'in-app',
    placeholder: 'Página o perfil',
    feedback: {
      seguidores: '112K', alcanceMes: '1.3M', engagement: '3.1%', impresionesInApp: '1.8M',
      deltaSeguidores: 3, deltaEngagement: 1,
      sentimiento: { pos: 54, neu: 34, neg: 12 },
      serie: [70, 65, 72, 68, 74, 70, 78, 75, 82, 86],
      topPosts: [
        { titulo: 'Live de compras — catálogo nuevo', alcance: '320K', interacciones: '14.6K' },
        { titulo: 'Publicación patrocinada — promo 3x2', alcance: '198K', interacciones: '8.9K' },
        { titulo: 'Álbum de la activación en tienda', alcance: '96K', interacciones: '4.2K' },
      ],
    },
  },
  {
    id: 'youtube', nombre: 'YouTube', icon: Youtube, color: '#FF0000', ambito: 'open-web',
    placeholder: 'Canal',
    feedback: {
      seguidores: '29.7K', alcanceMes: '640K', engagement: '6.2%', impresionesInApp: '820K',
      deltaSeguidores: 9, deltaEngagement: 4,
      sentimiento: { pos: 72, neu: 21, neg: 7 },
      serie: [20, 28, 25, 40, 38, 52, 60, 72, 80, 95],
      topPosts: [
        { titulo: 'Spot extendido — campaña anual', alcance: '180K', interacciones: '12.1K' },
        { titulo: 'Reseñas de clientes reales', alcance: '95K', interacciones: '6.8K' },
        { titulo: 'Detrás de la campaña de temporada', alcance: '61K', interacciones: '3.9K' },
      ],
    },
  },
  {
    id: 'x', nombre: 'X (Twitter)', icon: Twitter, color: '#1A1A1A', ambito: 'open-web',
    placeholder: '@tu_cuenta',
    feedback: {
      seguidores: '55.1K', alcanceMes: '2.4M', engagement: '2.8%', impresionesInApp: '3.1M',
      deltaSeguidores: 4, deltaEngagement: 3,
      sentimiento: { pos: 47, neu: 33, neg: 20 },
      serie: [60, 80, 70, 110, 95, 130, 120, 150, 140, 170],
      topPosts: [
        { titulo: 'Hilo: respuesta a la competencia', alcance: '540K', interacciones: '28.7K' },
        { titulo: 'Encuesta de preferencia de marca', alcance: '210K', interacciones: '15.3K' },
        { titulo: 'Cita del vocero de marca', alcance: '132K', interacciones: '7.6K' },
      ],
    },
  },
  {
    id: 'blog', nombre: 'Sitio propio / e-commerce', icon: FileText, color: '#8B5CF6', ambito: 'open-web',
    placeholder: 'https://tublog.com',
    feedback: {
      seguidores: '18.4K', alcanceMes: '410K', engagement: '5.5%', impresionesInApp: '520K',
      deltaSeguidores: 7, deltaEngagement: 6,
      sentimiento: { pos: 64, neu: 29, neg: 7 },
      serie: [15, 22, 20, 30, 34, 42, 48, 55, 60, 68],
      topPosts: [
        { titulo: 'Nota: guía de regalos de temporada', alcance: '86K', interacciones: '4.1K' },
        { titulo: 'Comparativa contra la categoría', alcance: '52K', interacciones: '2.7K' },
        { titulo: 'Ficha técnica y disponibilidad', alcance: '38K', interacciones: '1.9K' },
      ],
    },
  },
  {
    id: 'googleads', nombre: 'Google Ads', icon: Megaphone, color: '#F59E0B', ambito: 'open-web',
    placeholder: 'ID de cuenta',
    feedback: {
      seguidores: '—', alcanceMes: '3.7M', engagement: '3.4%', impresionesInApp: '4.9M',
      deltaSeguidores: 0, deltaEngagement: 8,
      sentimiento: { pos: 58, neu: 35, neg: 7 },
      serie: [90, 110, 100, 140, 130, 170, 160, 200, 190, 230],
      topPosts: [
        { titulo: 'Campaña "Venta Nocturna"', alcance: '1.2M', interacciones: '48K clics' },
        { titulo: 'Display remarketing', alcance: '780K', interacciones: '22K clics' },
        { titulo: 'Búsqueda — marca', alcance: '410K', interacciones: '31K clics' },
      ],
    },
  },
];

const EMBUDO = [
  { etapa: 'Visitas', valor: '1.24M', pct: 100 },
  { etapa: 'Ficha de producto', valor: '486K', pct: 39 },
  { etapa: 'Carrito', valor: '142K', pct: 11 },
  { etapa: 'Pago iniciado', valor: '75K', pct: 6 },
  { etapa: 'Compra', valor: '38.4K', pct: 3.1 },
];

const MARKETPLACES = [
  { nombre: 'Amazon MX', skus: 412, stock: 94, buyBox: 71, rating: 4.5 },
  { nombre: 'Mercado Libre', skus: 508, stock: 88, buyBox: 63, rating: 4.7 },
  { nombre: 'liverpool.com.mx (propio)', skus: 1208, stock: 91, buyBox: 100, rating: 4.4 },
];

const VISIBILIDAD = [
  { motor: 'Google — orgánico', tipo: 'SEO', share: 62, nota: 'Top 3 en 148 términos de categoría' },
  { motor: 'Google — AI Overviews', tipo: 'IA', share: 34, nota: 'Citada en 1 de cada 3 respuestas' },
  { motor: 'Asistentes de IA', tipo: 'IA', share: 27, nota: 'Recomendada al preguntar por la categoría' },
  { motor: 'Bing / otros', tipo: 'SEO', share: 18, nota: 'Cobertura secundaria' },
];

// ───────────────────────── UI HELPERS ─────────────────────────

const Bloque: React.FC<{ titulo: string; sub: string; children: React.ReactNode }> = ({ titulo, sub, children }) => (
  <div style={{ background: colores.fondoClaro, borderRadius: 20, padding: 20, border: `1px solid ${colores.borde}`, boxShadow: colores.sombra }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: colores.textoClaro, marginBottom: 4 }}>{titulo}</div>
    <div style={{ fontSize: 12, color: colores.textoOscuro, marginBottom: 14 }}>{sub}</div>
    {children}
  </div>
);

const Delta: React.FC<{ v: number }> = ({ v }) => {
  if (v === 0) return null;
  const up = v > 0;
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

const serie = (vals: number[]) => vals.map((v, i) => ({ x: `${i}`, v }));

const SentBar: React.FC<{ s: Sent }> = ({ s }) => (
  <div>
    <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden' }}>
      <div className="md-grow" style={{ width: `${s.pos}%`, background: colores.exito }} />
      <div className="md-grow" style={{ width: `${s.neu}%`, background: colores.advertencia }} />
      <div className="md-grow" style={{ width: `${s.neg}%`, background: colores.peligro }} />
    </div>
    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: colores.textoMedio }}>
        <ThumbsUp size={11} color={colores.exito} /> {s.pos}%
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: colores.textoMedio }}>
        <Minus size={11} color={colores.advertencia} /> {s.neu}%
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: colores.textoMedio }}>
        <ThumbsDown size={11} color={colores.peligro} /> {s.neg}%
      </span>
    </div>
  </div>
);

// Tarjeta de plataforma en el grid de conexión
const PlataformaCard: React.FC<{
  p: Plataforma; i: number; conectada: boolean; onConnect: (p: Plataforma) => void;
}> = ({ p, i, conectada, onConnect }) => {
  const Icon = p.icon;
  return (
    <div className="md-card" style={{
      background: colores.fondoClaro, borderRadius: 18, padding: 18,
      border: `1px solid ${conectada ? colores.primario : colores.borde}`,
      boxShadow: colores.sombra, display: 'flex', flexDirection: 'column', gap: 14,
      animationDelay: `${i * 0.05}s`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: `${p.color}14`, border: `1px solid ${p.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={22} color={p.color === '#000000' ? colores.textoClaro : p.color} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colores.textoClaro }}>{p.nombre}</div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
              color: p.ambito === 'in-app' ? colores.advertencia : colores.exito,
              textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2,
            }}>
              {p.ambito === 'in-app' ? <Smartphone size={10} /> : <Globe size={10} />}
              {p.ambito === 'in-app' ? 'In-App' : 'Open Web'}
            </span>
          </div>
        </div>
      </div>

      {conectada ? (
        <button disabled style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 12, border: `1px solid ${colores.primario}`,
          background: `${colores.primario}1A`, color: colores.textoClaro, fontWeight: 700, fontSize: 13,
          cursor: 'default',
        }}>
          <Check size={16} color={colores.primario} /> Cuenta conectada
        </button>
      ) : (
        <button className="md-btn" onClick={() => onConnect(p)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 12, border: 'none',
          background: colores.gradientePrimario, color: '#fff', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease',
        }}>
          <Plus size={16} /> Conectar cuenta
        </button>
      )}
    </div>
  );
};

// Panel de feedback de una plataforma conectada
const FeedbackPanel: React.FC<{ p: Plataforma }> = ({ p }) => {
  const Icon = p.icon;
  const f = p.feedback;
  const kpis = [
    { icon: Users2, label: 'Seguidores', value: f.seguidores, delta: f.deltaSeguidores },
    { icon: Eye, label: 'Alcance mes', value: f.alcanceMes, delta: undefined },
    { icon: Heart, label: 'Engagement', value: f.engagement, delta: f.deltaEngagement },
    { icon: Smartphone, label: 'Impresiones in-app', value: f.impresionesInApp, delta: undefined },
  ];
  return (
    <div className="md-card" style={{
      background: colores.fondoClaro, borderRadius: 20, padding: 20,
      border: `1px solid ${colores.borde}`, boxShadow: colores.sombra,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: `${p.color}14`,
          border: `1px solid ${p.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={p.color === '#000000' ? colores.textoClaro : p.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colores.textoClaro }}>{p.nombre}</div>
          <div style={{ fontSize: 11, color: colores.textoOscuro }}>Feedback de la plataforma · últimos 30 días</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800,
          color: colores.exito, background: `${colores.exito}1A`, border: `1px solid ${colores.exito}40`,
          padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase',
        }}>
          <span className="md-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: colores.exito }} />
          Sincronizado
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {kpis.map((k, j) => {
          const K = k.icon;
          return (
            <div key={j} style={{
              background: colores.fondoSecundario, borderRadius: 12, padding: '12px 14px',
              border: `1px solid ${colores.borde}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <K size={15} color={colores.textoOscuro} />
                {k.delta !== undefined && <Delta v={k.delta} />}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: colores.textoClaro, marginTop: 8, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: colores.textoOscuro, marginTop: 4 }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio, marginBottom: 6 }}>Alcance en el tiempo</div>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={serie(f.serie)} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`md-ar-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={p.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={p.color === '#000000' ? colores.textoClaro : p.color}
              strokeWidth={2.5} fill={`url(#md-ar-${p.id})`} dot={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio, marginBottom: 8 }}>Sentimiento de la audiencia</div>
        <SentBar s={f.sentimiento} />
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio, marginBottom: 8 }}>Publicaciones destacadas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {f.topPosts.map((post, j) => (
            <div key={j} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              background: colores.fondoSecundario, borderRadius: 10, border: `1px solid ${colores.borde}`,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 8, flexShrink: 0, background: `${p.color}1A`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: p.color === '#000000' ? colores.textoClaro : p.color,
              }}>{j + 1}</div>
              <span style={{ flex: 1, fontSize: 12, color: colores.textoClaro, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.titulo}</span>
              <span style={{ fontSize: 11, color: colores.textoOscuro, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <Eye size={11} /> {post.alcance}
              </span>
              <span style={{ fontSize: 11, color: colores.textoOscuro, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <Heart size={11} /> {post.interacciones}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modal de conexión (usuario + contraseña, dummy)
const ConexionModal: React.FC<{
  p: Plataforma | null; onClose: () => void; onDone: (id: string) => void;
}> = ({ p, onClose, onDone }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [estado, setEstado] = useState<'form' | 'conectando' | 'ok'>('form');

  useEffect(() => {
    if (p) { setUser(''); setPass(''); setEstado('form'); }
  }, [p]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (p) { document.addEventListener('keydown', onEsc); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', onEsc); document.body.style.overflow = ''; };
  }, [p, onClose]);

  if (!p) return null;
  const Icon = p.icon;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) return;
    setEstado('conectando');
    // ponytail: timers dummy; al cablear OAuth real esto se reemplaza por el flujo de la API
    setTimeout(() => setEstado('ok'), 1500);
    setTimeout(() => { onDone(p.id); onClose(); }, 2600);
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div className="md-modal" onClick={e => e.stopPropagation()} style={{
        background: colores.fondoClaro, borderRadius: 22, width: '100%', maxWidth: 420,
        boxShadow: colores.sombraGrande, overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{
          background: colores.gradientePrimario, padding: 24, position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 999,
            background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16} color="#fff" /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={24} color={p.color === '#000000' ? colores.textoClaro : p.color} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Conectar {p.nombre}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Autoriza el acceso para leer tus métricas</div>
            </div>
          </div>
        </div>

        {/* body */}
        <div style={{ padding: 24 }}>
          {estado === 'ok' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="md-pop" style={{
                width: 64, height: 64, borderRadius: 999, margin: '0 auto 16px',
                background: `${colores.exito}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={34} color={colores.exito} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: colores.textoClaro }}>¡Cuenta conectada!</div>
              <div style={{ fontSize: 13, color: colores.textoOscuro, marginTop: 4 }}>
                Ya estamos leyendo el feedback de {p.nombre}.
              </div>
            </div>
          ) : estado === 'conectando' ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <Loader2 size={40} color={colores.primario} className="md-spin" style={{ margin: '0 auto' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: colores.textoClaro, marginTop: 16 }}>Conectando con {p.nombre}…</div>
              <div style={{ fontSize: 12, color: colores.textoOscuro, marginTop: 4 }}>Verificando credenciales y permisos</div>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: colores.textoMedio }}>Usuario / cuenta</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, border: `1px solid ${colores.borde}`, background: colores.fondoSecundario }}>
                  <User size={16} color={colores.textoOscuro} />
                  <input value={user} onChange={e => setUser(e.target.value)} placeholder={p.placeholder}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: colores.textoClaro }} />
                </div>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: colores.textoMedio }}>Contraseña</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, border: `1px solid ${colores.borde}`, background: colores.fondoSecundario }}>
                  <Lock size={16} color={colores.textoOscuro} />
                  <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••"
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: colores.textoClaro }} />
                </div>
              </label>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: `${colores.primario}12`, borderRadius: 10, border: `1px solid ${colores.primario}30` }}>
                <ShieldCheck size={16} color={colores.primario} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: colores.textoMedio, lineHeight: 1.4 }}>
                  Conexión segura y cifrada. Solo leemos métricas — nunca publicamos ni modificamos tu cuenta.
                </span>
              </div>

              <button type="submit" className="md-btn" style={{
                padding: '12px', borderRadius: 12, border: 'none', background: colores.gradientePrimario,
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: user && pass ? 1 : 0.55,
              }}>Conectar y sincronizar</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ───────────────────────── COMPONENTE PRINCIPAL ─────────────────────────

export const MonitorDigital: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [conectadas, setConectadas] = useState<string[]>([]);
  const [modal, setModal] = useState<Plataforma | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const conectar = (id: string) => setConectadas(prev => prev.includes(id) ? prev : [...prev, id]);
  const panels = PLATAFORMAS.filter(p => conectadas.includes(p.id));

  // KPIs agregados de las cuentas conectadas
  const cobertura = [
    { label: 'Open Web (medible)', value: 20 },
    { label: 'In-App (cerrado)', value: 80 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: colores.fondoPrincipal, padding: isMobile ? 16 : 32 }}>
      <style>{`
        @keyframes md-fadeup { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes md-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
        @keyframes md-grow { from { width: 0; } }
        @keyframes md-spin { to { transform: rotate(360deg); } }
        @keyframes md-pop { 0% { transform: scale(.4); opacity: 0; } 60% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes md-modal { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: none; } }
        .md-card { animation: md-fadeup .5s ease both; transition: transform .2s ease, box-shadow .2s ease; }
        .md-card:hover { box-shadow: ${colores.sombraGrande}; transform: translateY(-3px); }
        .md-pulse { animation: md-pulse 1.4s ease-in-out infinite; }
        .md-grow { animation: md-grow 1s ease both; }
        .md-spin { animation: md-spin 1s linear infinite; }
        .md-pop { animation: md-pop .5s cubic-bezier(.2,1.4,.4,1) both; }
        .md-modal { animation: md-modal .35s ease both; }
        .md-btn:hover { transform: translateY(-1px); box-shadow: ${colores.sombraMedia}; }
      `}</style>

      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        {/* HERO */}
        <div style={{
          background: colores.gradientePrimario, borderRadius: 24, padding: isMobile ? 20 : 32,
          marginBottom: 24, position: 'relative', overflow: 'hidden', boxShadow: colores.sombraGrande,
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: 999,
            background: `radial-gradient(circle, ${colores.primario}55, transparent 70%)`,
          }} />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800,
            color: colores.primario, background: `${colores.primario}1A`, border: `1px solid ${colores.primario}40`,
            padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase',
          }}>
            <span className="md-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: colores.primario }} /> Monitoreo digital
          </span>
          <h1 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 300, color: '#fff', margin: '14px 0 6px', letterSpacing: '-0.5px' }}>
            Monitor <span style={{ fontWeight: 800, color: colores.primario }}>Digital</span> & E-Commerce
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.7)', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
            Tráfico, conversión y marketplaces en un solo tablero. Conecta las cuentas de la marca
            y suma la visibilidad en buscadores y en respuestas de IA (GEO/AEO).
          </p>

          {/* explicación in-app vs open web */}
          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginTop: 24, position: 'relative',
          }}>
            {[
              { icon: Smartphone, t: 'In-App', d: 'Publicidad dentro de las apps (TikTok, Instagram…). Cerrada por privacidad — solo visible con tus propios accesos.', c: colores.advertencia },
              { icon: Globe, t: 'Open Web', d: 'Sitios abiertos en el navegador. Medible desde fuera, pero es la porción menor del gasto digital.', c: colores.exito },
              { icon: ShieldCheck, t: 'Con tus accesos', d: 'Entramos por la puerta oficial (APIs) y leemos el 100% de tus campañas, incluido lo in-app.', c: colores.primario },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 16, padding: 16, backdropFilter: 'blur(6px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={18} color={b.c} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{b.t}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '8px 0 0', lineHeight: 1.45 }}>{b.d}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* COBERTURA + CONTADOR */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{
            background: colores.fondoClaro, borderRadius: 20, padding: 20,
            border: `1px solid ${colores.borde}`, boxShadow: colores.sombra,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: colores.textoClaro, marginBottom: 4 }}>Visibilidad del gasto digital</div>
            <div style={{ fontSize: 12, color: colores.textoOscuro, marginBottom: 8 }}>Del total de la pauta, cuánto es medible desde fuera vs. cerrado por privacidad.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={cobertura} dataKey="value" innerRadius={40} outerRadius={64} paddingAngle={3} stroke="none">
                    <Cell fill={colores.exito} />
                    <Cell fill={colores.advertencia} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cobertura.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: i === 0 ? colores.exito : colores.advertencia }} />
                      <span style={{ color: colores.textoMedio, flex: 1 }}>{c.label}</span>
                      <span style={{ fontWeight: 800, color: colores.textoClaro }}>{c.value}%</span>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: colores.textoOscuro, margin: '4px 0 0', lineHeight: 1.4 }}>
                  Ese hueco in-app es un límite del mercado por privacidad — igual para toda la industria.
                  Con los accesos del cliente, lo propio se cubre completo.
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: colores.gradienteSecundario, borderRadius: 20, padding: 20,
            border: `1px solid ${colores.borde}`, boxShadow: colores.sombra,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <Activity size={22} color={colores.primario} />
            <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginTop: 10, lineHeight: 1 }}>
              {conectadas.length}<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>/{PLATAFORMAS.length}</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>cuentas conectadas y sincronizando feedback</div>
          </div>
        </div>

        {/* EMBUDO + MARKETPLACES + GEO/AEO */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr', gap: 20, marginBottom: 28 }}>
          <Bloque titulo="Embudo de conversión" sub="Del clic a la compra, últimos 30 días">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EMBUDO.map((e, i) => (
                <div key={e.etapa}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: colores.textoMedio, fontWeight: 600 }}>{e.etapa}</span>
                    <span style={{ color: colores.textoOscuro, fontVariantNumeric: 'tabular-nums' }}>{e.valor} · {e.pct}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden' }}>
                    <div className="md-grow" style={{ width: `${e.pct}%`, height: '100%', borderRadius: 999, background: i === EMBUDO.length - 1 ? colores.exito : colores.primario }} />
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: colores.textoOscuro, margin: '12px 0 0', lineHeight: 1.4 }}>
              Mayor fuga entre carrito y pago: 47% de abandono. Foco de trabajo del Operador de E-Commerce.
            </p>
          </Bloque>

          <Bloque titulo="Marketplaces" sub="Disponibilidad y buy box por canal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MARKETPLACES.map(m => (
                <div key={m.nombre} style={{ background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: colores.textoClaro }}>{m.nombre}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.buyBox >= 60 ? colores.exito : colores.advertencia }}>buy box {m.buyBox}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: colores.textoOscuro }}>
                    <span>{m.skus} SKUs</span>
                    <span>{m.stock}% en stock</span>
                    <span>★ {m.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </Bloque>

          <Bloque titulo="Visibilidad en buscadores e IA" sub="SEO tradicional + GEO/AEO">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {VISIBILIDAD.map(v => (
                <div key={v.motor}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: colores.textoMedio, fontWeight: 600 }}>{v.motor}</span>
                    <span style={{ color: colores.textoOscuro, fontVariantNumeric: 'tabular-nums' }}>{v.share}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden' }}>
                    <div style={{ width: `${v.share}%`, height: '100%', borderRadius: 999, background: v.tipo === 'IA' ? '#8B5CF6' : colores.primario }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: colores.textoOscuro, marginTop: 3 }}>{v.nota}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: colores.textoOscuro, margin: '12px 0 0', lineHeight: 1.4 }}>
              GEO/AEO: con qué frecuencia la marca aparece citada dentro de respuestas generadas por IA.
            </p>
          </Bloque>
        </div>

        {/* GRID DE CONEXIÓN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colores.textoClaro, margin: 0 }}>Conecta las cuentas de la marca</h2>
          <span style={{ fontSize: 12, color: colores.textoOscuro }}>Agrega los accesos para leer su feedback</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16, marginBottom: 32,
        }}>
          {PLATAFORMAS.map((p, i) => (
            <PlataformaCard key={p.id} p={p} i={i} conectada={conectadas.includes(p.id)} onConnect={setModal} />
          ))}
        </div>

        {/* FEEDBACK DE CUENTAS CONECTADAS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colores.textoClaro, margin: 0 }}>Feedback de tus apps</h2>
          <span style={{ fontSize: 12, color: colores.textoOscuro }}>Métricas establecidas por cada plataforma</span>
        </div>

        {panels.length === 0 ? (
          <div style={{
            background: colores.fondoClaro, borderRadius: 20, padding: 48, textAlign: 'center',
            border: `1px dashed ${colores.bordeHover}`,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 999, margin: '0 auto 14px',
              background: colores.fondoSecundario, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Smartphone size={28} color={colores.textoOscuro} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colores.textoClaro }}>Aún no hay cuentas conectadas</div>
            <div style={{ fontSize: 13, color: colores.textoOscuro, marginTop: 6 }}>
              Conecta una cuenta arriba para ver aquí su feedback en tiempo real.
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: 20, marginBottom: 32,
          }}>
            {panels.map(p => <FeedbackPanel key={p.id} p={p} />)}
          </div>
        )}
      </div>

      <ConexionModal p={modal} onClose={() => setModal(null)} onDone={conectar} />
    </div>
  );
};
