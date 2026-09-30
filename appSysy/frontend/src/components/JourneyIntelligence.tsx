import React, { useState, useEffect } from 'react';
import {
  Route, Scale, Activity, TrendingUp, Radio, MessageSquare, Flame,
  ArrowUpRight, ArrowDownRight, Smile, Meh, Frown, Share2, Trophy, Layers,
  FileText, Network, MousePointerClick, MapPin, Users,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import { brandingConfig } from '../config/branding';
import { estadosPaths } from '../data/mexicoPaths';

const { colores } = brandingConfig;
const V = colores.primario;
const TXT = colores.textoClaro;
const MUT = colores.textoOscuro;
const TRACK = `${colores.secundario}12`;

// ───────────────────────── DATA DUMMY (la lógica/datos reales van después) ─────────────────────────

const ETAPAS = [
  { nombre: 'Awareness', detalle: 'Descubre la marca', color: '#8B5CF6', usuarios: 1240000, share: 100, sent: { pos: 52, neu: 38, neg: 10 } },
  { nombre: 'Consideración', detalle: 'Compara y evalúa', color: '#0047AB', usuarios: 486000, share: 39, sent: { pos: 44, neu: 39, neg: 17 } },
  { nombre: 'Conversión', detalle: 'Compra', color: '#F58025', usuarios: 38400, share: 3.1, sent: { pos: 61, neu: 28, neg: 11 } },
  { nombre: 'Lealtad', detalle: 'Recompra y recomienda', color: '#10B981', usuarios: 14200, share: 1.1, sent: { pos: 74, neu: 20, neg: 6 } },
];

const CANALES = [
  { label: 'Radio', value: 31, color: '#8B5CF6' },
  { label: 'Digital', value: 27, color: '#0047AB' },
  { label: 'Retail físico', value: 19, color: '#F58025' },
  { label: 'Marketplace', value: 15, color: '#10B981' },
  { label: 'Atención a clientes', value: 8, color: '#6B7280' },
];

const EVOLUCION = [
  { sem: 'S1', Awareness: 180, Consideracion: 150, Conversion: 120 },
  { sem: 'S2', Awareness: 240, Consideracion: 170, Conversion: 140 },
  { sem: 'S3', Awareness: 210, Consideracion: 200, Conversion: 130 },
  { sem: 'S4', Awareness: 320, Consideracion: 230, Conversion: 160 },
  { sem: 'S5', Awareness: 360, Consideracion: 250, Conversion: 190 },
  { sem: 'S6', Awareness: 410, Consideracion: 290, Conversion: 200 },
  { sem: 'S7', Awareness: 440, Consideracion: 300, Conversion: 210 },
  { sem: 'S8', Awareness: 480, Consideracion: 320, Conversion: 230 },
];

// Fricciones más citadas, por peso en el journey
const FRICCIONES = [
  { tema: 'Costo de envío', v: 88 }, { tema: 'Tiempo de entrega', v: 74 },
  { tema: 'Falta de stock', v: 61 }, { tema: 'Precio vs categoría', v: 55 },
  { tema: 'Pago rechazado', v: 48 }, { tema: 'Devoluciones', v: 42 },
  { tema: 'Atención posventa', v: 35 },
];

const FRICCIONES_EMERGENTES = [
  { texto: 'Abandono en pantalla de pago', delta: 38, vol: '12.4K' },
  { texto: 'Dudas sobre disponibilidad', delta: 24, vol: '8.1K' },
  { texto: 'Comparativa con competidor', delta: 19, vol: '6.7K' },
  { texto: 'Quejas de posventa', delta: -7, vol: '5.2K' },
  { texto: 'Búsqueda de cupón', delta: 12, vol: '4.0K' },
];

// Etapas predefinidas para filtrar el feed de señales ("quiero ver la etapa…")
const ETAPAS_FILTRO = [
  { id: 'Awareness', color: '#8B5CF6' },
  { id: 'Consideración', color: '#0047AB' },
  { id: 'Conversión', color: '#F58025' },
  { id: 'Lealtad', color: '#10B981' },
];
const ETAPA_COLOR: Record<string, string> = Object.fromEntries(ETAPAS_FILTRO.map(e => [e.id, e.color]));

const FEED = [
  { hora: '14:32', canal: 'Radio · MVS 102.5', texto: 'Pico de búsquedas de marca 4 minutos después del spot de las 14:28…', touchpoint: 'Spot 20s', etapa: 'Awareness', sent: 'pos' },
  { hora: '14:18', canal: 'Sitio propio', texto: 'La ficha de producto concentra 39% de las visitas pero solo 11% llega al carrito…', touchpoint: 'Ficha de producto', etapa: 'Consideración', sent: 'neu' },
  { hora: '14:05', canal: 'Marketplace', texto: 'Reseñas nuevas mencionan el tiempo de entrega como principal fricción…', touchpoint: 'Reseñas', etapa: 'Lealtad', sent: 'neg' },
  { hora: '13:55', canal: 'Checkout', texto: '47% de abandono en la pantalla de pago; el método más rechazado es débito…', touchpoint: 'Pago', etapa: 'Conversión', sent: 'neg' },
  { hora: '13:40', canal: 'Redes', texto: 'La creatividad vertical duplica el CTR frente al formato cuadrado…', touchpoint: 'Social ads', etapa: 'Awareness', sent: 'pos' },
  { hora: '13:28', canal: 'Retail físico', texto: 'La activación en tienda genera 2.3K escaneos de QR hacia el catálogo…', touchpoint: 'Activación', etapa: 'Consideración', sent: 'pos' },
  { hora: '13:14', canal: 'Atención a clientes', texto: 'Los tickets por devolución bajan 12% tras el cambio de política…', touchpoint: 'Soporte', etapa: 'Lealtad', sent: 'pos' },
  { hora: '13:02', canal: 'Buscadores', texto: 'La marca aparece citada en 1 de cada 3 respuestas de IA de la categoría…', touchpoint: 'GEO/AEO', etapa: 'Consideración', sent: 'pos' },
  { hora: '12:48', canal: 'Marketplace', texto: 'Se perdió la buy box en 3 SKUs por diferencia de precio…', touchpoint: 'Buy box', etapa: 'Conversión', sent: 'neg' },
  { hora: '12:35', canal: 'Email', texto: 'El flujo de carrito abandonado recupera 6.4% de las sesiones…', touchpoint: 'CRM', etapa: 'Conversión', sent: 'neu' },
];

const CORRELACION = [
  { d: 'Lun', visitas: 120, conversiones: 200 }, { d: 'Mar', visitas: 180, conversiones: 260 },
  { d: 'Mié', visitas: 150, conversiones: 240 }, { d: 'Jue', visitas: 320, conversiones: 480 },
  { d: 'Vie', visitas: 280, conversiones: 520 }, { d: 'Sáb', visitas: 210, conversiones: 410 },
  { d: 'Dom', visitas: 260, conversiones: 460 },
];

const RANKING = [
  { touchpoint: 'Spot de radio 20s', impacto: 94 },
  { touchpoint: 'Ficha de producto', impacto: 81 },
  { touchpoint: 'Social ads vertical', impacto: 68 },
  { touchpoint: 'Reseñas marketplace', impacto: 57 },
  { touchpoint: 'Email de carrito', impacto: 43 },
];

const SENT_META = {
  pos: { label: 'Positivo', color: colores.exito, Icon: Smile },
  neu: { label: 'Neutral', color: colores.textoOscuro, Icon: Meh },
  neg: { label: 'Negativo', color: colores.peligro, Icon: Frown },
} as const;

// Sentimiento por canal y por touchpoint
const SENT_CANAL = [
  { nombre: 'Radio', pos: 44, neu: 38, neg: 18 },
  { nombre: 'Digital', pos: 36, neu: 40, neg: 24 },
  { nombre: 'Marketplace', pos: 30, neu: 39, neg: 31 },
  { nombre: 'Retail físico', pos: 41, neu: 36, neg: 23 },
];
const SENT_TOUCHPOINT = [
  { nombre: 'Ficha de producto', pos: 47, neu: 33, neg: 20 },
  { nombre: 'Pantalla de pago', pos: 29, neu: 38, neg: 33 },
  { nombre: 'Entrega', pos: 38, neu: 42, neg: 20 },
  { nombre: 'Posventa', pos: 34, neu: 40, neg: 26 },
];

// Mapa del journey (red etapas ↔ canales)
const NARR_NODOS = [
  { id: 'Awareness', x: 200, y: 55, tipo: 'tema' },
  { id: 'Consideración', x: 200, y: 120, tipo: 'tema' },
  { id: 'Conversión', x: 200, y: 185, tipo: 'tema' },
  { id: 'Radio', x: 60, y: 50, tipo: 'actor', color: '#8B5CF6' },
  { id: 'Digital', x: 340, y: 50, tipo: 'actor', color: '#0047AB' },
  { id: 'Retail', x: 60, y: 190, tipo: 'actor', color: '#F58025' },
  { id: 'Marketplace', x: 340, y: 190, tipo: 'actor', color: '#10B981' },
];
const NARR_LINKS: [string, string][] = [
  ['Radio', 'Awareness'], ['Radio', 'Consideración'], ['Digital', 'Awareness'],
  ['Digital', 'Consideración'], ['Retail', 'Conversión'], ['Retail', 'Consideración'],
  ['Marketplace', 'Conversión'], ['Marketplace', 'Awareness'],
];

// Mapa de México · intensidad de touchpoints por plaza (0-100), por id de estadosPaths
const TOUCHPOINTS_PLAZA: Record<string, number> = {
  MX_AG: 33, MX_BC: 38, MX_BS: 22, MX_CM: 24, MX_CS: 58, MX_CH: 52, MX_CO: 41, MX_CL: 21,
  MX_DF: 100, MX_DG: 31, MX_GT: 61, MX_GR: 51, MX_HG: 39, MX_JA: 79, MX_EM: 92, MX_MI: 54,
  MX_MO: 35, MX_NA: 26, MX_NL: 88, MX_OA: 57, MX_PU: 63, MX_QT: 48, MX_QR: 37, MX_SL: 44,
  MX_SI: 47, MX_SO: 45, MX_TB: 43, MX_TM: 49, MX_TL: 27, MX_VE: 66, MX_YU: 46, MX_ZA: 28,
};

// ───────────────────────── HELPERS ─────────────────────────

const Badge: React.FC<{ texto: string; color: string; pulse?: boolean }> = ({ texto, color, pulse }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800,
    letterSpacing: '0.06em', color, background: `${color}1F`, border: `1px solid ${color}40`,
    padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', whiteSpace: 'nowrap',
  }}>
    {pulse && <span className="iel-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: color }} />}
    {texto}
  </span>
);

const Delta: React.FC<{ v: number }> = ({ v }) => {
  const up = v >= 0; const c = up ? colores.exito : colores.peligro;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: c, fontSize: 11, fontWeight: 700 }}>
      <Icon size={12} color={c} /> {Math.abs(v)}%
    </span>
  );
};

const tooltipStyle = {
  background: colores.fondoClaro, border: `1px solid ${colores.borde}`, borderRadius: 10,
  fontSize: 12, color: TXT, padding: '6px 10px', boxShadow: colores.sombraMedia,
} as const;

const card: React.CSSProperties = {
  background: colores.fondoClaro, border: `1px solid ${colores.borde}`,
  borderRadius: 18, padding: 20, boxShadow: colores.sombra,
};

const Panel: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string }>;
  titulo: string; sub?: string; children: React.ReactNode; style?: React.CSSProperties;
}> = ({ icon: Icon, titulo, sub, children, style }) => (
  <div className="iel-panel" style={{ ...card, ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: `${V}1F`, border: `1px solid ${V}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={V} />
      </div>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TXT, margin: 0 }}>{titulo}</h3>
        {sub && <p style={{ fontSize: 11, color: MUT, margin: '1px 0 0' }}>{sub}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ───────────────────────── PÁGINA ─────────────────────────

export const JourneyIntelligence: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const col = (n: number) => (isMobile ? '1fr' : `repeat(${n}, 1fr)`);
  const maxShare = Math.max(...ETAPAS.map(e => e.share));

  const kpis = [
    { Icon: Users, label: 'Usuarios en el journey', value: '1.24M', delta: 21 },
    { Icon: MousePointerClick, label: 'Touchpoints activos', value: '34', delta: 6 },
    { Icon: Layers, label: 'Etapas monitoreadas', value: '4' },
    { Icon: MessageSquare, label: 'Señales analizadas hoy', value: '3,842', delta: 4 },
  ];

  const generarReporte = () => {
    const el = document.createElement('div');
    el.textContent = '📄 Generando reporte semanal del journey… ✓';
    el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;background:${colores.textoClaro};color:${colores.textoEnOscuro};padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:${colores.sombraGrande}`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 1800);
    setTimeout(() => el.remove(), 2300);
  };

  return (
    <div style={{ minHeight: '100vh', padding: isMobile ? 16 : 32, background: colores.fondoPrincipal }}>
      <style>{`
        @keyframes iel-fadeup { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform:none;} }
        @keyframes iel-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.35;transform:scale(.7);} }
        @keyframes iel-grow { from { width:0; } }
        .iel-panel { animation: iel-fadeup .5s ease both; }
        .iel-grow { animation: iel-grow 1s ease both; }
        .iel-pulse { animation: iel-pulse 1.4s ease-in-out infinite; }
        .iel-feed:hover { background: ${colores.fondoSecundario}; }
      `}</style>

      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        {/* HERO */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, background: V, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Route size={26} color="#0A0A0A" />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 800, color: TXT, margin: 0, letterSpacing: '-0.5px' }}>
                Journey <span style={{ color: V }}>Intelligence</span>
              </h1>
              <Badge texto="EN VIVO" color={V} pulse />
            </div>
            <p style={{ fontSize: isMobile ? 13 : 15, color: colores.textoMedio, margin: '6px 0 0', maxWidth: 720, lineHeight: 1.5 }}>
              Recorrido del consumidor de punta a punta: por dónde entra, dónde se atora y qué lo hace volver — con el drop-off medido en cada etapa.
            </p>
          </div>
          <button onClick={generarReporte} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 700, padding: '11px 18px', borderRadius: 12, alignSelf: 'center',
            border: 'none', background: colores.textoClaro, color: colores.textoEnOscuro, boxShadow: colores.sombra,
          }}>
            <FileText size={16} color={colores.textoEnOscuro} /> Reporte semanal
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {kpis.map((k, i) => (
            <div key={i} className="iel-panel" style={{ ...card, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <k.Icon size={18} color={V} />
                {k.delta !== undefined && <Delta v={k.delta} />}
              </div>
              <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: TXT, marginTop: 10, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: MUT, marginTop: 5 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* FILA 1: etapas + canales + evolución */}
        <div style={{ display: 'grid', gridTemplateColumns: col(3), gap: 16, marginBottom: 16 }}>
          <Panel icon={Scale} titulo="Etapas del journey" sub="Volumen y drop-off por etapa">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {ETAPAS.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: e.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: colores.textoMedio, width: 88, flexShrink: 0 }}>{e.nombre}</span>
                  <div style={{ flex: 1, height: 10, background: TRACK, borderRadius: 999, overflow: 'hidden' }}>
                    <div className="iel-grow" style={{ width: `${(e.share / maxShare) * 100}%`, height: '100%', background: e.color, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: TXT, width: 40, textAlign: 'right' }}>{e.share}%</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel icon={Share2} titulo="Touchpoints por canal" sub="Distribución de interacciones">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ResponsiveContainer width="55%" height={150}>
                <PieChart>
                  <Pie data={CANALES} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={3} stroke="none">
                    {CANALES.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CANALES.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color }} />
                    <span style={{ color: colores.textoMedio, flex: 1 }}>{p.label}</span>
                    <span style={{ fontWeight: 800, color: TXT }}>{p.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel icon={TrendingUp} titulo="Evolución semanal" sub="Usuarios por etapa (8 sem)">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={EVOLUCION} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colores.borde} />
                <XAxis dataKey="sem" tick={{ fill: MUT, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: MUT, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="Awareness" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Consideracion" stroke="#0047AB" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Conversion" stroke="#F58025" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* FILA 2: Sentimiento por etapa + fricciones */}
        <div style={{ display: 'grid', gridTemplateColumns: col(2), gap: 16, marginBottom: 16 }}>
          <Panel icon={Smile} titulo="Sentimiento por etapa" sub="Positivo · Neutral · Negativo">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ETAPAS.map((c, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: TXT, fontWeight: 600 }}>{c.nombre}</span>
                    <span style={{ fontSize: 11, color: MUT }}>{c.detalle}</span>
                  </div>
                  <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${c.sent.pos}%`, background: colores.exito }} title={`Positivo ${c.sent.pos}%`} />
                    <div style={{ width: `${c.sent.neu}%`, background: colores.fondoTerciario }} title={`Neutral ${c.sent.neu}%`} />
                    <div style={{ width: `${c.sent.neg}%`, background: colores.peligro }} title={`Negativo ${c.sent.neg}%`} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                {(['pos', 'neu', 'neg'] as const).map(k => {
                  const m = SENT_META[k];
                  return (
                    <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUT }}>
                      <m.Icon size={13} color={m.color} /> {m.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel icon={Flame} titulo="Puntos de fricción" sub="Lo que más frena el avance">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FRICCIONES.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: colores.textoMedio, width: 86, flexShrink: 0 }}>{t.tema}</span>
                  <div style={{ flex: 1, height: 9, background: TRACK, borderRadius: 999, overflow: 'hidden' }}>
                    <div className="iel-grow" style={{ width: `${t.v}%`, height: '100%', background: `linear-gradient(90deg, ${V}, ${colores.exito})`, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TXT, width: 30, textAlign: 'right' }}>{t.v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* FILA 2b: Sentimiento por estación y por programa */}
        <div style={{ display: 'grid', gridTemplateColumns: col(2), gap: 16, marginBottom: 16 }}>
          <Panel icon={Radio} titulo="Sentimiento por canal" sub="Tono de la conversación por canal">
            <SentList items={SENT_CANAL} />
          </Panel>
          <Panel icon={MousePointerClick} titulo="Sentimiento por touchpoint" sub="Tono en cada punto de contacto">
            <SentList items={SENT_TOUCHPOINT} />
          </Panel>
        </div>

        {/* FILA 3: Narrativas emergentes + Correlación radio/redes */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: 16, marginBottom: 16 }}>
          <Panel icon={Flame} titulo="Fricciones emergentes" sub="NLP · lo que crece esta semana">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FRICCIONES_EMERGENTES.map((n, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 12, padding: '11px 13px' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{n.texto}</div>
                    <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{n.vol} menciones</div>
                  </div>
                  <Delta v={n.delta} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel icon={Share2} titulo="Visitas vs conversiones" sub="Correlación diaria del embudo">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={CORRELACION} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="iel-visitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={V} stopOpacity={0.5} /><stop offset="100%" stopColor={V} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="iel-conv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} /><stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colores.borde} />
                <XAxis dataKey="d" tick={{ fill: MUT, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: MUT, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: TXT }} />
                <Area type="monotone" name="Visitas" dataKey="visitas" stroke={V} strokeWidth={2.5} fill="url(#iel-visitas)" />
                <Area type="monotone" name="Conversiones" dataKey="conversiones" stroke="#3B82F6" strokeWidth={2.5} fill="url(#iel-conv)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* FILA 4: Feed de detecciones + Ranking estaciones */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 16 }}>
          <MonitoreoDiscurso />

          <Panel icon={Trophy} titulo="Ranking de touchpoints" sub="Impacto en el avance del journey">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={RANKING} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="touchpoint" width={120} tick={{ fill: colores.textoMedio, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: TRACK }} />
                <Bar dataKey="impacto" radius={[0, 6, 6, 0]} barSize={18}>
                  {RANKING.map((_, i) => <Cell key={i} fill={i === 0 ? V : `${V}${(80 - i * 12).toString(16)}`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* FILA 5: Mapa de narrativa + Mapa geográfico */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginTop: 16 }}>
          <Panel icon={Network} titulo="Mapa del journey" sub="Red de canales ↔ etapas">
            <MapaNarrativa />
          </Panel>
          <Panel icon={MapPin} titulo="Mapa de México" sub="Intensidad de touchpoints por plaza">
            <MapaMexico isMobile={isMobile} />
          </Panel>
        </div>
      </div>
    </div>
  );
};

// ── Sentimiento (lista de barras apiladas reutilizable) ──
const SentList: React.FC<{ items: { nombre: string; pos: number; neu: number; neg: number }[] }> = ({ items }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    {items.map((s, i) => (
      <div key={i}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: TXT, fontWeight: 600 }}>{s.nombre}</span>
          <span style={{ fontSize: 11, color: MUT }}>{s.pos}% pos</span>
        </div>
        <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${s.pos}%`, background: colores.exito }} title={`Positivo ${s.pos}%`} />
          <div style={{ width: `${s.neu}%`, background: colores.fondoTerciario }} title={`Neutral ${s.neu}%`} />
          <div style={{ width: `${s.neg}%`, background: colores.peligro }} title={`Negativo ${s.neg}%`} />
        </div>
      </div>
    ))}
  </div>
);

// ── Mapa de narrativa (SVG network) ──
const MapaNarrativa: React.FC = () => {
  const pos = (id: string) => NARR_NODOS.find(n => n.id === id)!;
  return (
    <svg viewBox="0 0 400 240" style={{ width: '100%', height: 'auto' }}>
      {NARR_LINKS.map(([a, b], i) => {
        const A = pos(a), B = pos(b);
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={colores.borde} strokeWidth={1.5} />;
      })}
      {NARR_NODOS.map((n, i) => {
        const tema = n.tipo === 'tema';
        const fill = tema ? V : (n.color ?? V);
        const r = tema ? 8 : 14;
        return (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={r} fill={fill} fillOpacity={tema ? 1 : 0.9} />
            <text x={n.x} y={n.y - (tema ? 14 : 22)} textAnchor="middle"
              fontSize={tema ? 11 : 12} fontWeight={tema ? 600 : 800}
              fill={colores.textoClaro}>{n.id}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Mapa de México · choropleth con SVG real (geometría de mexicoPaths) ──
const tonoVerde = (v: number) => `rgba(154,194,79,${(0.12 + (v / 100) * 0.88).toFixed(2)})`;
const MapaMexico: React.FC<{ isMobile: boolean }> = () => {
  const [hover, setHover] = useState<{ x: number; y: number; id: string } | null>(null);
  const nombre = (id: string) => estadosPaths.find(e => e.id === id)?.label ?? id;

  return (
    <div style={{ position: 'relative' }}>
      {hover && (
        <div style={{
          position: 'absolute', left: hover.x + 12, top: hover.y - 10, zIndex: 10, pointerEvents: 'none',
          background: colores.textoClaro, color: colores.textoEnOscuro, padding: '5px 10px',
          borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: colores.sombraMedia,
        }}>
          {nombre(hover.id)} · {TOUCHPOINTS_PLAZA[hover.id] ?? 0} touchpoints
        </div>
      )}
      <svg viewBox="0 0 959 593" style={{ width: '100%', height: 'auto' }}
        onMouseLeave={() => setHover(null)}>
        {estadosPaths.map(e => {
          const v = TOUCHPOINTS_PLAZA[e.id] ?? 0;
          const activo = hover?.id === e.id;
          return (
            <path
              key={e.id}
              d={e.path}
              fill={activo ? V : tonoVerde(v)}
              stroke={colores.fondoClaro}
              strokeWidth={activo ? 1.4 : 0.7}
              style={{ cursor: 'pointer', transition: 'fill .15s' }}
              onMouseMove={ev => {
                const r = (ev.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect();
                setHover({ x: ev.clientX - r.left, y: ev.clientY - r.top, id: e.id });
              }}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 10, color: MUT }}>Menos</span>
        <div style={{ flex: 1, height: 8, borderRadius: 999, background: `linear-gradient(90deg, ${tonoVerde(5)}, ${tonoVerde(100)})` }} />
        <span style={{ fontSize: 10, color: MUT }}>Más touchpoints</span>
      </div>
    </div>
  );
};

const Chip: React.FC<{ texto: string; color: string }> = ({ texto, color }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, color, background: `${color}1A`,
    border: `1px solid ${color}33`, padding: '3px 8px', borderRadius: 999,
  }}>{texto}</span>
);

// ── Señales del journey — feed filtrable por etapa ──
const MonitoreoDiscurso: React.FC = () => {
  // Por defecto se muestran todas las etapas
  const [activos, setActivos] = useState<string[]>(ETAPAS_FILTRO.map(e => e.id));

  const toggle = (id: string) =>
    setActivos(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const feed = FEED.filter(f => activos.includes(f.etapa));

  return (
    <Panel icon={Activity} titulo="Señales del journey" sub="Detección automática por etapa y touchpoint">
      {/* Filtros de partido — "quiero escuchar sobre…" */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: MUT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Etapas visibles
          </span>
          <span style={{ fontSize: 11, color: MUT }}>{feed.length} detecciones</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ETAPAS_FILTRO.map(p => {
            const on = activos.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all .2s',
                  border: `1.5px solid ${on ? p.color : colores.borde}`,
                  background: on ? p.color : colores.fondoSecundario,
                  color: on ? '#fff' : colores.textoOscuro,
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: 999,
                  background: on ? '#fff' : p.color,
                }} />
                {p.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed de detecciones */}
      {feed.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 0' }}>
          <Radio size={36} color={MUT} strokeWidth={1} />
          <p style={{ fontSize: 13, color: colores.textoMedio, margin: 0 }}>Selecciona al menos una etapa para ver señales</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
          {feed.map((f, i) => {
            const sm = SENT_META[f.sent as keyof typeof SENT_META];
            const pc = ETAPA_COLOR[f.etapa] ?? colores.secundario;
            return (
              <div key={i} className="iel-feed" style={{
                display: 'flex', gap: 12, padding: '12px 13px', borderRadius: 12,
                background: colores.fondoSecundario, border: `1px solid ${colores.borde}`,
                borderLeft: `4px solid ${pc}`, transition: 'background .2s',
                animation: 'iel-fadeup .3s ease both',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: V }}>{f.hora}</span>
                  <sm.Icon size={16} color={sm.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ background: pc, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999 }}>
                      {f.etapa}
                    </span>
                    <span style={{ fontSize: 11, color: MUT }}>{f.canal}</span>
                  </div>
                  <div style={{ fontSize: 13, color: colores.textoMedio, fontStyle: 'italic', lineHeight: 1.4 }}>“{f.texto}”</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <Chip texto={f.touchpoint} color={colores.secundario} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
};
