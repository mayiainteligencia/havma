import React, { useMemo, useState } from 'react';
import {
  MapPin, BarChart3, Layers, Filter, TrendingUp, Monitor, X, Plus, Trash2, Ruler,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
// TODO: mover a import() dinámico antes de producción
// los 3 JSON del datalab pesan ~437 kB en el bundle inicial
import {
  soportesCircuito, todosSoportes, resumenPorZona, zonasMetropolitanas,
  CIRCUITO_COMEX, MXM_DISPONIBLES, MXM_OCUPADOS, MXM_DOOH, TOTAL_INVENTARIO, MAX_IMPACTOS,
  calcularOOHScore, colorScore, NOMBRE_TIPO, NOMBRE_DISPONIBILIDAD,
  fmtMXN, fmtNum, fmtCorto,
  type Soporte, type EstadoDisponibilidad, type TipoSoporte,
} from '../data/ooh';
import { brandingConfig } from '../config/branding';
import { Panel, SectionHero, Insight, keyframes, wrap, inner, useIsMobile } from './shared/ui';

const { colores } = brandingConfig;
const V = colores.primario;

// ponytail: 755 soportes en el DOM matan el scroll — cada ciudad muestra sus
// mejores TOPE_POR_CIUDAD por score y el resto queda en el contador.
const TOPE_POR_CIUDAD = 12;
const TOPE_LISTA_BUILDER = 40;

type Tab = 'mapa' | 'builder' | 'measurement';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: 'mapa', label: 'Mapa de inventario', icon: MapPin },
  { id: 'builder', label: 'Circuit Builder', icon: Layers },
  { id: 'measurement', label: 'Measurement Lab', icon: BarChart3 },
];

const zonaCorta = (z: string | null): string =>
  (z ?? '').replace(/^Zona metropolitana de[l]? /, '') || '—';

const truncar = (s: string | null, n = 40): string =>
  !s ? 'Sin dirección' : s.length > n ? `${s.slice(0, n - 1)}…` : s;

const esPantalla = (t: TipoSoporte) =>
  t === 'cartelera_digital' || t === 'pantalla_digital';

const tooltipStyle = {
  background: colores.fondoClaro, border: `1px solid ${colores.borde}`,
  borderRadius: 10, fontSize: 12,
} as const;

const tick = { fill: colores.textoOscuro, fontSize: 11 };

/* ───────────────────────────── piezas chicas ───────────────────────────── */

const BadgeDisp: React.FC<{ estado: EstadoDisponibilidad; fecha: string | null }> = ({ estado, fecha }) => {
  const color =
    estado === 'inmediata' ? colores.exito
    : estado === 'ocupado' ? colores.peligro
    : estado === 'fecha' ? colores.advertencia
    : colores.textoOscuro;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '3px 8px', whiteSpace: 'nowrap',
      color, background: `${color}1A`, border: `1px solid ${color}33`,
    }}>
      {NOMBRE_DISPONIBILIDAD[estado]}{estado === 'fecha' && fecha ? ` ${fecha}` : ''}
    </span>
  );
};

const Select: React.FC<{ label: string; value: string; onChange: (v: string) => void; opciones: string[] }> =
({ label, value, onChange, opciones }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: colores.textoOscuro, fontWeight: 600 }}>
    {label}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      border: `1px solid ${colores.borde}`, borderRadius: 10, padding: '8px 10px',
      fontSize: 13, color: colores.textoClaro, background: colores.fondoClaro, cursor: 'pointer',
      fontWeight: 600, minWidth: 140,
    }}>
      {opciones.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

const KpiChip: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{
    background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.16)',
    borderRadius: 12, padding: '10px 14px', minWidth: 118,
  }}>
    <div style={{ fontSize: 20, fontWeight: 800, color: color ?? '#fff', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>{label}</div>
  </div>
);

const SoporteCard: React.FC<{ s: Soporte; score: number; onClick: () => void; accion?: React.ReactNode }> =
({ s, score, onClick, accion }) => {
  return (
    <div role="button" tabIndex={0} onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="ooh-card"
      style={{
        background: colores.fondoClaro, border: `1px solid ${colores.borde}`, borderRadius: 14,
        padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8,
        boxShadow: colores.sombra,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: `${V}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {esPantalla(s.tipo) ? <Monitor size={15} color={V} /> : <MapPin size={15} color={V} />}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: colores.textoClaro, flex: 1 }}>
          {NOMBRE_TIPO[s.tipo]}
        </span>
        {s.es_digital && (
          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#3B82F6', background: '#3B82F614', border: '1px solid #3B82F633', borderRadius: 999, padding: '2px 7px' }}>DOOH</span>
        )}
      </div>

      <div style={{ fontSize: 11.5, color: colores.textoOscuro, lineHeight: 1.35, minHeight: 31 }}>
        {truncar(s.direccion)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 11.5, fontWeight: 800, color: colorScore(score),
          background: `${colorScore(score)}18`, borderRadius: 8, padding: '3px 8px',
        }}>Score {score}</span>
        <BadgeDisp estado={s.disponibilidad.estado} fecha={s.disponibilidad.fecha} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 2 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: colores.textoMedio }}>
          {s.tarifa_publicada_mxn ? `${fmtMXN(s.tarifa_publicada_mxn)} MXN` : 'Sin tarifa'}
        </span>
        {accion}
      </div>
    </div>
  );
};

/* ─────────────────────── panel lateral de detalle ─────────────────────── */

const barrasMini = (data: { x: string; v: number }[]) => (
  <ResponsiveContainer width="100%" height={130}>
    <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
      <CartesianGrid stroke={colores.borde} strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="x" tick={tick} axisLine={false} tickLine={false} />
      <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={fmtCorto} />
      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtNum(v)} cursor={{ fill: `${V}12` }} />
      <Bar dataKey="v" fill={V} radius={[5, 5, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const DetalleSoporte: React.FC<{ s: Soporte; onClose: () => void }> = ({ s, onClose }) => {
  const isMobile = useIsMobile();
  const score = calcularOOHScore(s, MAX_IMPACTOS);
  const a = s.audiencia;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,10,10,.45)',
      display: 'flex', justifyContent: 'flex-end',
    }}>
      <aside onClick={e => e.stopPropagation()} className="ooh-drawer" style={{
        background: colores.fondoClaro, width: isMobile ? '100%' : 440, height: '100%',
        overflowY: 'auto', padding: 22, borderLeft: `1px solid ${colores.borde}`,
        boxShadow: colores.sombraGrande,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: V, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {NOMBRE_TIPO[s.tipo]}{s.id_operador ? ` · ${s.id_operador}` : ''}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: colores.textoClaro, margin: '4px 0 0', lineHeight: 1.3 }}>
              {s.direccion ?? 'Sin dirección'}
            </h3>
            <div style={{ fontSize: 12, color: colores.textoOscuro, marginTop: 4 }}>
              {[s.municipio, s.ciudad, s.zona_metropolitana].filter(Boolean).join(' · ') || s.estado}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{
            width: 34, height: 34, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
            background: colores.fondoSecundario, border: `1px solid ${colores.borde}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={17} color={colores.textoMedio} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: colorScore(score), background: `${colorScore(score)}18`, borderRadius: 9, padding: '6px 11px' }}>
            OOH Score {score}/100
          </span>
          <BadgeDisp estado={s.disponibilidad.estado} fecha={s.disponibilidad.fecha} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: colores.textoMedio, background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 9, padding: '5px 10px' }}>
            {s.fuente === 'circuito_comex' ? 'Circuito medido' : 'Inventario MXM'}
          </span>
        </div>

        {a ? (
          <>
            <Panel title="Audiencia por género" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {[['Masculino', a.masculino], ['Femenino', a.femenino]].map(([l, v]) => (
                  <div key={l as string} style={{ flex: 1, background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: colores.textoClaro, lineHeight: 1 }}>{fmtCorto(v as number)}</div>
                    <div style={{ fontSize: 11, color: colores.textoOscuro, marginTop: 5 }}>{l as string}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Audiencia por edad" style={{ marginBottom: 14 }}>
              {barrasMini([
                { x: '18-25', v: a.edad_18_25 }, { x: '26-40', v: a.edad_26_40 },
                { x: '41-55', v: a.edad_41_55 }, { x: '55+', v: a.edad_55_mas },
              ])}
            </Panel>

            <Panel title="Audiencia por NSE" style={{ marginBottom: 14 }}>
              {barrasMini([
                { x: 'A', v: a.nse_a }, { x: 'B', v: a.nse_b }, { x: 'C', v: a.nse_c },
                { x: 'D', v: a.nse_d }, { x: 'E', v: a.nse_e },
              ])}
            </Panel>
          </>
        ) : (
          <Panel style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12.5, color: colores.textoOscuro, margin: 0, lineHeight: 1.5 }}>
              Este soporte viene del inventario del operador: trae tarifa y disponibilidad,
              pero no tiene medición de audiencia. La medición llega al cruzarlo con el
              circuito medido.
            </p>
          </Panel>
        )}

        <Panel title="Métricas y ficha técnica">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {[
              ['Impactos totales', s.impactos_totales ? fmtNum(s.impactos_totales) : '—'],
              ['Usuarios únicos', a ? fmtNum(a.total) : '—'],
              ['Alcance en zona', s.alcance_zona_pct != null ? `${s.alcance_zona_pct.toFixed(2)}%` : '—'],
              ['Alcance nacional', s.alcance_nacional_pct != null ? `${s.alcance_nacional_pct.toFixed(2)}%` : '—'],
              ['Tarifa publicada', s.tarifa_publicada_mxn ? `${fmtMXN(s.tarifa_publicada_mxn)} MXN` : 'Sin tarifa'],
              ['Dimensiones', s.mts2 ? `${s.base_m ?? '?'} × ${s.altura_m ?? '?'} m · ${s.mts2} m²` : '—'],
              ['Vista', s.vista ?? '—'],
              ['Coordenadas', s.mapeable === false ? 'Sin coordenadas' : `${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}`],
            ].map(([l, v]) => (
              <div key={l} style={{ background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 11, padding: 12 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: colores.textoClaro, lineHeight: 1.2 }}>{v}</div>
                <div style={{ fontSize: 10.5, color: colores.textoOscuro, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
};

/* ───────────────────────────── componente ───────────────────────────── */

export const OOHPlanner: React.FC = () => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>('mapa');
  const [ciudad, setCiudad] = useState('Todas');
  const [tipo, setTipo] = useState('Todos');
  const [disp, setDisp] = useState('Todas');
  const [abierto, setAbierto] = useState<Soporte | null>(null);
  const [seleccionados, setSeleccionados] = useState<Soporte[]>([]);

  const scores = useMemo(() => {
    const m = new Map<string, number>();
    todosSoportes.forEach(s => m.set(s.id, calcularOOHScore(s, MAX_IMPACTOS)));
    return m;
  }, []);
  const score = (s: Soporte) => scores.get(s.id) ?? 0;

  const ciudades = useMemo(
    () => ['Todas', ...Array.from(new Set(todosSoportes.map(s => s.ciudad).filter(Boolean) as string[])).sort()],
    [],
  );
  const tipos = useMemo(
    () => ['Todos', ...Array.from(new Set(todosSoportes.map(s => s.tipo))).sort().map(t => NOMBRE_TIPO[t])],
    [],
  );
  const disponibilidades = ['Todas', 'Inmediata', 'Ocupado', 'Libera', 'Sin dato'];

  const filtrados = useMemo(() => todosSoportes.filter(s =>
    (ciudad === 'Todas' || s.ciudad === ciudad) &&
    (tipo === 'Todos' || NOMBRE_TIPO[s.tipo] === tipo) &&
    (disp === 'Todas' || NOMBRE_DISPONIBILIDAD[s.disponibilidad.estado] === disp),
  ), [ciudad, tipo, disp]);

  const porCiudad = useMemo(() => {
    const grupos = new Map<string, Soporte[]>();
    filtrados.forEach(s => {
      const k = s.ciudad ?? 'Sin ciudad';
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k)!.push(s);
    });
    return Array.from(grupos.entries())
      .map(([nombre, lista]) => ({ nombre, lista: [...lista].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)) }))
      .sort((a, b) => b.lista.length - a.lista.length);
  }, [filtrados, scores]);

  // ── métricas del circuito en construcción ──
  const metricas = useMemo(() => {
    const impactos = seleccionados.reduce((s, x) => s + (x.impactos_totales ?? 0), 0);
    const usuarios = seleccionados.reduce((s, x) => s + (x.audiencia?.total ?? 0), 0);
    // ponytail: dedup plana al 25%; el solapamiento real sale del proveedor de medición.
    const usuariosDedup = Math.round(usuarios * 0.75);
    const presupuesto = seleccionados.reduce((s, x) => s + (x.tarifa_publicada_mxn ?? 0), 0);
    const alcancePromedio = seleccionados.length > 0
      ? seleccionados.reduce((s, x) => s + (x.alcance_zona_pct ?? 0), 0) / seleccionados.length
      : 0;
    return { impactos, usuariosDedup, presupuesto, alcancePromedio };
  }, [seleccionados]);

  const disponiblesBuilder = useMemo(
    () => filtrados
      .filter(s => !seleccionados.some(x => x.id === s.id))
      .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
      .slice(0, TOPE_LISTA_BUILDER),
    [filtrados, seleccionados, scores],
  );

  // ── datos del Measurement Lab ──
  const zonas = useMemo(
    () => zonasMetropolitanas.map(z => ({
      zona: zonaCorta(z.zona),
      alcance: z.alcance_pct ?? 0,
      grp: z.grp ?? 0,
      frecuencia: z.frecuencia ?? 0,
    })).sort((a, b) => b.alcance - a.alcance),
    [],
  );

  const genero = useMemo(() => {
    const m = soportesCircuito.reduce((s, x) => s + (x.audiencia?.masculino ?? 0), 0);
    const f = soportesCircuito.reduce((s, x) => s + (x.audiencia?.femenino ?? 0), 0);
    return [{ name: 'Masculino', value: m }, { name: 'Femenino', value: f }];
  }, []);

  const edades = useMemo(() => {
    const suma = (k: 'edad_18_25' | 'edad_26_40' | 'edad_41_55' | 'edad_55_mas') =>
      soportesCircuito.reduce((s, x) => s + (x.audiencia?.[k] ?? 0), 0);
    return [
      { x: '18-25', v: suma('edad_18_25') }, { x: '26-40', v: suma('edad_26_40') },
      { x: '41-55', v: suma('edad_41_55') }, { x: '55+', v: suma('edad_55_mas') },
    ];
  }, []);

  const grid = (cols: string): React.CSSProperties =>
    ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : cols, gap: 16 });

  return (
    <div style={wrap(isMobile)}>
      <style>{`
        ${keyframes}
        .ooh-card { transition: transform .18s ease, box-shadow .18s ease; }
        .ooh-card:hover { transform: translateY(-2px); box-shadow: ${colores.sombraMedia}; }
        .ooh-card:focus-visible { outline: 2px solid ${V}; outline-offset: 2px; }
        @keyframes ooh-slide { from { transform: translateX(30px); opacity: .4 } to { transform: none; opacity: 1 } }
        .ooh-drawer { animation: ooh-slide .22s ease both; }
        @media (prefers-reduced-motion: reduce) { .ooh-drawer, .ooh-card { animation: none; transition: none; } }
      `}</style>

      <div style={inner}>
        <SectionHero
          eyebrow="OOH Planner"
          title={<>Inventario <strong style={{ fontWeight: 800 }}>Exterior</strong></>}
          subtitle="Inventario, circuito medido y planeación en una sola vista. Los datos salen de los Excel del circuito COMEX y del inventario del operador, procesados por el datalab."
          right={
            <div style={{ display: 'inline-flex', gap: 6, background: 'rgba(255,255,255,.12)', padding: 5, borderRadius: 12, flexWrap: 'wrap' }}>
              {TABS.map(t => {
                const on = t.id === tab;
                const Icono = t.icon;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 9,
                    fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: on ? '#fff' : 'transparent',
                    color: on ? colores.textoClaro : 'rgba(255,255,255,.75)', transition: 'all .2s',
                  }}>
                    <Icono size={15} color={on ? V : 'rgba(255,255,255,.75)'} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          }
          insights={<>
            <Insight kind="Análisis" title={`${MXM_DISPONIBLES} soportes con disponibilidad inmediata`}>
              De los {fmtNum(TOTAL_INVENTARIO)} soportes del inventario, {MXM_DISPONIBLES} están
              libres hoy y {MXM_OCUPADOS} ocupados. {MXM_DOOH} son DOOH — el circuito digital ya
              es el 14% de la planta.
            </Insight>
            <Insight kind="Sugerencia" title="El circuito medido rinde 269 GRPs con 77 soportes">
              El circuito COMEX alcanza {CIRCUITO_COMEX?.alcance_pct?.toFixed(1)}% de cobertura
              nacional con frecuencia {CIRCUITO_COMEX?.frecuencia?.toFixed(1)}. Usa el Circuit
              Builder para comparar tu selección contra esa referencia.
            </Insight>
          </>}
        />

        {/* KPIs globales */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, padding: 16,
          background: colores.gradienteSecundario, borderRadius: 18,
        }}>
          <KpiChip label="Total inventario" value={fmtNum(TOTAL_INVENTARIO)} />
          <KpiChip label="Disponibles" value={fmtNum(MXM_DISPONIBLES)} color={colores.exito} />
          <KpiChip label="Ocupados" value={fmtNum(MXM_OCUPADOS)} color={colores.peligro} />
          <KpiChip label="DOOH" value={fmtNum(MXM_DOOH)} color="#60A5FA" />
          <KpiChip label="Medidos (COMEX)" value={fmtNum(soportesCircuito.length)} />
        </div>

        {/* ═════════════ TAB 1 · MAPA DE INVENTARIO ═════════════ */}
        {tab === 'mapa' && (
          <>
            <Panel
              title="Filtros"
              icon={<Filter size={16} color={V} />}
              right={<span style={{ fontSize: 12, color: colores.textoOscuro }}>{fmtNum(filtrados.length)} soportes</span>}
              style={{ marginBottom: 18 }}
            >
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <Select label="Ciudad" value={ciudad} onChange={setCiudad} opciones={ciudades} />
                <Select label="Tipo" value={tipo} onChange={setTipo} opciones={tipos} />
                <Select label="Disponibilidad" value={disp} onChange={setDisp} opciones={disponibilidades} />
                {(ciudad !== 'Todas' || tipo !== 'Todos' || disp !== 'Todas') && (
                  <button onClick={() => { setCiudad('Todas'); setTipo('Todos'); setDisp('Todas'); }} style={{
                    border: `1px solid ${colores.borde}`, background: 'transparent', cursor: 'pointer',
                    borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, color: colores.textoMedio,
                  }}>Limpiar</button>
                )}
              </div>
            </Panel>

            {porCiudad.length === 0 && (
              <Panel><p style={{ margin: 0, fontSize: 13, color: colores.textoOscuro }}>Ningún soporte cumple estos filtros.</p></Panel>
            )}

            {porCiudad.map(({ nombre, lista }) => (
              <Panel key={nombre} title={nombre}
                right={<span style={{ fontSize: 12, color: colores.textoOscuro }}>
                  {lista.length} soporte{lista.length === 1 ? '' : 's'}
                  {lista.length > TOPE_POR_CIUDAD && ` · mostrando los ${TOPE_POR_CIUDAD} de mejor score`}
                </span>}
                style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: 12,
                }}>
                  {lista.slice(0, TOPE_POR_CIUDAD).map(s => (
                    <SoporteCard key={s.id} s={s} score={score(s)} onClick={() => setAbierto(s)} />
                  ))}
                </div>
              </Panel>
            ))}
          </>
        )}

        {/* ═════════════ TAB 2 · CIRCUIT BUILDER ═════════════ */}
        {tab === 'builder' && (
          <div style={grid('1.25fr 1fr')}>
            <Panel
              title="Soportes disponibles"
              icon={<Layers size={16} color={V} />}
              right={<span style={{ fontSize: 12, color: colores.textoOscuro }}>
                top {Math.min(TOPE_LISTA_BUILDER, disponiblesBuilder.length)} de {fmtNum(filtrados.length)} · filtra en el tab de inventario
              </span>}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12, maxHeight: 620, overflowY: 'auto',
              }}>
                {disponiblesBuilder.map(s => (
                  <SoporteCard key={s.id} s={s} score={score(s)} onClick={() => setAbierto(s)}
                    accion={
                      <button onClick={e => { e.stopPropagation(); setSeleccionados(prev => [...prev, s]); }}
                        aria-label="Agregar al circuito"
                        style={{
                          border: 'none', background: V, color: '#fff', cursor: 'pointer',
                          width: 28, height: 28, borderRadius: 9, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}><Plus size={16} /></button>
                    } />
                ))}
                {disponiblesBuilder.length === 0 && (
                  <p style={{ fontSize: 13, color: colores.textoOscuro, margin: 0 }}>
                    No quedan soportes por agregar con los filtros actuales.
                  </p>
                )}
              </div>
            </Panel>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Panel title="Tu circuito" icon={<TrendingUp size={16} color={V} />}
                right={seleccionados.length > 0 ? (
                  <button onClick={() => setSeleccionados([])} style={{
                    border: `1px solid ${colores.borde}`, background: 'transparent', cursor: 'pointer',
                    borderRadius: 9, padding: '5px 10px', fontSize: 11.5, fontWeight: 700,
                    color: colores.textoMedio, display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}><Trash2 size={13} /> Vaciar</button>
                ) : undefined}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  {[
                    ['Soportes', fmtNum(seleccionados.length)],
                    ['Impactos', fmtCorto(metricas.impactos)],
                    ['Usuarios (dedup.)', fmtCorto(metricas.usuariosDedup)],
                    ['Alcance promedio', `${metricas.alcancePromedio.toFixed(2)}%`],
                    ['Presupuesto', `${fmtMXN(metricas.presupuesto)}`],
                    ['DOOH en circuito', fmtNum(seleccionados.filter(s => s.es_digital).length)],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 12, padding: 13 }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: colores.textoClaro, lineHeight: 1.1 }}>{v}</div>
                      <div style={{ fontSize: 10.5, color: colores.textoOscuro, marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>

                {seleccionados.length > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 230, overflowY: 'auto' }}>
                    {seleccionados.map((s, i) => (
                      <div key={`${s.id}-${i}`} style={{
                        display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                        background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 10,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: 999, background: colorScore(score(s)), flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, color: colores.textoMedio, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {truncar(s.direccion, 34)}
                        </span>
                        <button onClick={() => setSeleccionados(prev => prev.filter((_, j) => j !== i))}
                          aria-label="Quitar del circuito"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: colores.textoOscuro, display: 'flex' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Referencia · Circuito COMEX medido" icon={<Ruler size={16} color={V} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    ['Soportes', fmtNum(CIRCUITO_COMEX?.soportes ?? soportesCircuito.length)],
                    ['Impactos', fmtCorto(CIRCUITO_COMEX?.impactos_totales ?? 0)],
                    ['Usuarios únicos', fmtCorto(CIRCUITO_COMEX?.usuarios_unicos ?? 0)],
                    ['Alcance', `${(CIRCUITO_COMEX?.alcance_pct ?? 0).toFixed(1)}%`],
                    ['Frecuencia', (CIRCUITO_COMEX?.frecuencia ?? 0).toFixed(1)],
                    ['GRPs', Math.round(CIRCUITO_COMEX?.grp ?? 0).toString()],
                  ].map(([l, v]) => (
                    <div key={l} style={{ textAlign: 'center', background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 11, padding: 12 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: colores.textoClaro, lineHeight: 1.1 }}>{v}</div>
                      <div style={{ fontSize: 10, color: colores.textoOscuro, marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11.5, color: colores.textoOscuro, margin: '12px 0 0', lineHeight: 1.5 }}>
                  Cifras medidas del circuito nacional. Los soportes del circuito no traen tarifa
                  publicada, por eso su presupuesto no suma en el builder.
                </p>
              </Panel>
            </div>
          </div>
        )}

        {/* ═════════════ TAB 3 · MEASUREMENT LAB ═════════════ */}
        {tab === 'measurement' && (
          <>
            <div style={{ ...grid('1fr 1fr'), marginBottom: 16 }}>
              <Panel title="Alcance por zona metropolitana (%)" icon={<BarChart3 size={16} color={V} />}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={zonas} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke={colores.borde} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="zona" tick={tick} axisLine={false} tickLine={false} width={104} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}%`} cursor={{ fill: `${V}12` }} />
                    <Bar dataKey="alcance" fill={V} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="GRPs por zona metropolitana" icon={<TrendingUp size={16} color={V} />}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={zonas} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
                    <CartesianGrid stroke={colores.borde} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="zona" tick={{ ...tick, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={54} />
                    <YAxis tick={tick} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle}
                      formatter={(v: number, _n, item) => [`${Math.round(v)} GRPs · frec. ${item?.payload?.frecuencia?.toFixed(1)}`, 'GRPs']}
                      cursor={{ fill: `${V}12` }} />
                    <Bar dataKey="grp" fill={colores.exito} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            <div style={{ ...grid('1fr 1fr'), marginBottom: 16 }}>
              <Panel title="Audiencia por género · circuito medido">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={genero} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3} stroke="none">
                      {genero.map((_, i) => <Cell key={i} fill={i === 0 ? V : '#3B82F6'} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" height={28} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtNum(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Audiencia por grupo de edad · circuito medido">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={edades} margin={{ top: 4, right: 8, bottom: 0, left: -6 }}>
                    <CartesianGrid stroke={colores.borde} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="x" tick={tick} axisLine={false} tickLine={false} />
                    <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={fmtCorto} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtNum(v)} cursor={{ fill: `${V}12` }} />
                    <Bar dataKey="v" fill={V} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            <Panel title="Resumen medido por zona" right={<span style={{ fontSize: 12, color: colores.textoOscuro }}>{resumenPorZona.length} filas · datos del proveedor de medición</span>}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 640 }}>
                  <thead>
                    <tr>
                      {['Zona', 'Soportes', 'Población', 'Usuarios únicos', 'Alcance %', 'Frecuencia', 'GRPs'].map((h, i) => (
                        <th key={h} style={{
                          textAlign: i === 0 ? 'left' : 'right', padding: '10px 12px', color: colores.textoOscuro,
                          fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em',
                          borderBottom: `1px solid ${colores.borde}`, whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resumenPorZona.map(z => (
                      <tr key={z.zona}>
                        <td style={{ padding: '10px 12px', color: colores.textoClaro, fontWeight: 700, borderBottom: `1px solid ${colores.borde}` }}>{z.zona}</td>
                        {[
                          z.soportes != null ? fmtNum(z.soportes) : '—',
                          z.poblacion_total != null ? fmtNum(z.poblacion_total) : '—',
                          z.usuarios_unicos != null ? fmtNum(z.usuarios_unicos) : '—',
                          z.alcance_pct != null ? `${z.alcance_pct.toFixed(2)}%` : '—',
                          z.frecuencia != null ? z.frecuencia.toFixed(2) : '—',
                          z.grp != null ? fmtNum(Math.round(z.grp)) : '—',
                        ].map((v, i) => (
                          <td key={i} style={{
                            padding: '10px 12px', textAlign: 'right', color: colores.textoMedio,
                            fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${colores.borde}`,
                          }}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </div>

      {abierto && <DetalleSoporte s={abierto} onClose={() => setAbierto(null)} />}
    </div>
  );
};
