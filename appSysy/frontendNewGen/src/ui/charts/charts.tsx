import { useId, useState, type ReactNode } from 'react';
import { useSize } from '../hooks/useSize';
import './charts.css';

/** Color de la serie i de la paleta de marca (ver branding.ts). */
export const serie = (i: number) => `var(--serie${(i % 6) + 1})`;

const nice = (max: number) => {
  if (max <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  const f = max / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
};
const corto = (s: string, n = 11) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const compacto = (v: number) => (Math.abs(v) >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `${+(v / 1e3).toFixed(1)}k` : `${+v.toFixed(1)}`);

function Hatch({ id, color }: { id: string; color: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" style={{ fill: color, opacity: 0.16 }} />
      <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: color }} strokeWidth="2" />
    </pattern>
  );
}

// ─────────── Barras verticales (una o varias series) ───────────
export interface DatoBarra { label: string; valores: number[] }

export function BarChart({ data, series = [''], formato = compacto, destacar }: {
  data: DatoBarra[]; series?: string[]; formato?: (v: number) => string; destacar?: number;
}) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const k = series.length;
  const rot = data.length > 0 && w / data.length < 74;
  const m = { t: 24, r: 8, b: rot ? 56 : 28, l: 52 };
  const max = nice(Math.max(...data.flatMap(d => d.valores), 1));
  const pw = Math.max(w - m.l - m.r, 10), ph = Math.max(h - m.t - m.b, 10);
  const band = pw / Math.max(data.length, 1);
  const gw = Math.min(band * 0.72, 46 * k), bw = gw / k - 2;
  const top = destacar ?? data.reduce((b, d, i, a) => (d.valores[0] > a[b].valores[0] ? i : b), 0);
  const y = (v: number) => m.t + ph - (v / max) * ph;

  return (
    <div className="chart">
      <div ref={ref} className="chart__plot">
      {w > 0 && (
        <svg width={w} height={h} role="img">
          <defs>{series.map((_, i) => <Hatch key={i} id={`${uid}h${i}`} color={k === 1 ? 'var(--serie5)' : serie(i)} />)}<Hatch id={`${uid}ha`} color="var(--serie1)" /></defs>
          {[0, 1, 2, 3, 4].map(t => {
            const v = (max / 4) * t;
            return <g key={t}><line className="chart__grid" x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} /><text className="chart__tick" x={m.l - 8} y={y(v) + 3} textAnchor="end">{formato(v)}</text></g>;
          })}
          {data.map((d, i) => {
            const x0 = m.l + band * i + (band - gw) / 2;
            const activo = k === 1 && (hover ?? top) === i;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={m.l + band * i} y={m.t} width={band} height={ph} fill="transparent" />
                {d.valores.map((v, j) => {
                  const bx = x0 + j * (gw / k) + 1, by = y(v), bh = m.t + ph - by;
                  return (
                    <g key={j}>
                      <rect x={bx} y={by} width={bw} height={Math.max(bh, 0)} style={{ fill: `url(#${uid}${k === 1 && activo ? 'ha' : 'h' + (k === 1 ? 0 : j)})`, stroke: k === 1 ? (activo ? 'var(--serie1)' : 'var(--serie5)') : serie(j) }} strokeWidth="1" />
                      <rect x={bx} y={by - 2} width={bw} height="2" style={{ fill: k === 1 ? (activo ? 'var(--serie1)' : 'var(--text)') : serie(j) }} />
                    </g>
                  );
                })}
                {(k === 1 ? activo : hover === i) && <text className="chart__val" x={m.l + band * i + band / 2} y={y(Math.max(...d.valores)) - 8} textAnchor="middle">{formato(d.valores[0])}</text>}
                <text className={`chart__tick ${activo ? 'is-on' : ''}`} textAnchor={rot ? 'end' : 'middle'}
                  transform={rot ? `translate(${m.l + band * i + band / 2},${m.t + ph + 14}) rotate(-30)` : undefined}
                  x={rot ? undefined : m.l + band * i + band / 2} y={rot ? undefined : m.t + ph + 18}>{corto(d.label, rot ? 14 : 12)}</text>
              </g>
            );
          })}
          <line className="chart__axis" x1={m.l} x2={w - m.r} y1={m.t + ph} y2={m.t + ph} />
        </svg>
      )}
      </div>
      {k > 1 && <Leyenda items={series} />}
    </div>
  );
}

export const Leyenda = ({ items }: { items: string[] }) => (
  <div className="chart__legend">{items.map((s, i) => <span key={s}><i style={{ background: serie(i) }} />{s}</span>)}</div>
);

// ─────────── Línea / área ───────────
export function LineChart({ labels, series, area = true, formato = compacto }: {
  labels: string[]; series: { nombre: string; valores: number[] }[]; area?: boolean; formato?: (v: number) => string;
}) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const m = { t: 18, r: 14, b: 28, l: 52 };
  const max = nice(Math.max(...series.flatMap(s => s.valores), 1));
  const pw = Math.max(w - m.l - m.r, 10), ph = Math.max(h - m.t - m.b, 10);
  const n = labels.length;
  const x = (i: number) => m.l + (n > 1 ? (pw * i) / (n - 1) : pw / 2);
  const y = (v: number) => m.t + ph - (v / max) * ph;
  const paso = Math.max(1, Math.ceil(n / Math.max(Math.floor(pw / 60), 1)));

  return (
    <div className="chart">
      <div ref={ref} className="chart__plot">
      {w > 0 && (
        <svg width={w} height={h} onMouseLeave={() => setHover(null)}
          onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left - m.l) / pw) * (n - 1))))); }}>
          <defs>
            {series.map((_, i) => (
              <linearGradient key={i} id={`${uid}g${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: serie(i), stopOpacity: 0.45 }} /><stop offset="100%" style={{ stopColor: serie(i), stopOpacity: 0 }} />
              </linearGradient>
            ))}
            <filter id={`${uid}glow`}><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {[0, 1, 2, 3, 4].map(t => {
            const v = (max / 4) * t;
            return <g key={t}><line className="chart__grid" x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} /><text className="chart__tick" x={m.l - 8} y={y(v) + 3} textAnchor="end">{formato(v)}</text></g>;
          })}
          {labels.map((l, i) => i % paso === 0 && <text key={i} className="chart__tick" x={x(i)} y={m.t + ph + 18} textAnchor="middle">{corto(l, 8)}</text>)}
          {hover !== null && <line className="chart__grid is-on" x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ph} />}
          {series.map((s, si) => {
            const pts = s.valores.map((v, i) => `${x(i)},${y(v)}`);
            return (
              <g key={s.nombre}>
                {area && si === 0 && <path d={`M${x(0)},${m.t + ph} L${pts.join(' L')} L${x(n - 1)},${m.t + ph}Z`} style={{ fill: `url(#${uid}g${si})` }} />}
                <polyline points={pts.join(' ')} fill="none" style={{ stroke: serie(si) }} strokeWidth={si === 0 ? 2 : 1.4} filter={`url(#${uid}glow)`} />
                {s.valores.map((v, i) => (n <= 24 || i === hover) && <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 2.6} style={{ fill: hover === i ? 'var(--surface)' : serie(si), stroke: serie(si) }} strokeWidth="1.6" />)}
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && w > 0 && (
        <div className="chart__tip" style={{ left: Math.min(Math.max(x(hover) + 10, 0), w - 140), top: 6 }}>
          <b>{labels[hover]}</b>
          {series.map((s, i) => <span key={s.nombre}><i style={{ background: serie(i) }} />{s.nombre} {formato(s.valores[hover])}</span>)}
        </div>
      )}
      </div>
      {series.length > 1 && <Leyenda items={series.map(s => s.nombre)} />}
    </div>
  );
}

// ─────────── Dona con total al centro ───────────
export function DonutChart({ datos, formato = compacto, centro }: {
  datos: { nombre: string; valor: number }[]; formato?: (v: number) => string; centro?: { etiqueta: string; valor: string };
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = datos.reduce((s, d) => s + d.valor, 0) || 1;
  const R = 38, C = 2 * Math.PI * R, gap = datos.length > 1 ? 1.6 : 0;
  let acc = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 100 100" className="donut__svg">
        <circle cx="50" cy="50" r={R} className="donut__track" />
        {datos.map((d, i) => {
          const len = (d.valor / total) * C;
          const el = (
            <circle key={d.nombre} cx="50" cy="50" r={R} fill="none" strokeWidth={hover === i ? 13 : 10}
              style={{ stroke: serie(i), opacity: hover === null || hover === i ? 1 : 0.35, transition: 'all .2s' }}
              strokeDasharray={`${Math.max(len - gap, 0)} ${C - Math.max(len - gap, 0)}`} strokeDashoffset={-acc}
              transform="rotate(-90 50 50)" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          );
          acc += len;
          return el;
        })}
        <text x="50" y="47" textAnchor="middle" className="donut__lbl">{hover !== null ? corto(datos[hover].nombre, 14) : centro?.etiqueta ?? 'Total'}</text>
        <text x="50" y="60" textAnchor="middle" className="donut__val">{hover !== null ? formato(datos[hover].valor) : centro?.valor ?? formato(total)}</text>
      </svg>
      <ul className="donut__list">
        {datos.map((d, i) => (
          <li key={d.nombre} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={hover === i ? 'is-on' : ''}>
            <i style={{ background: serie(i) }} /><span>{d.nombre}</span><b>{((d.valor / total) * 100).toFixed(1)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────── Medidor circular ───────────
export function Gauge({ valor, max = 100, etiqueta, formato }: { valor: number; max?: number; etiqueta?: string; formato?: (v: number) => string }) {
  const R = 40, C = 2 * Math.PI * R, arco = C * 0.75;
  const pct = Math.max(0, Math.min(1, valor / max));
  return (
    <div className="gauge">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={R + 7} className="gauge__ticks" strokeDasharray="1.2 3.1" transform="rotate(135 50 50)" />
        <circle cx="50" cy="50" r={R} className="gauge__track" strokeDasharray={`${arco} ${C}`} transform="rotate(135 50 50)" />
        <circle cx="50" cy="50" r={R} className="gauge__fill" strokeDasharray={`${arco * pct} ${C}`} transform="rotate(135 50 50)" />
        <text x="50" y="53" textAnchor="middle" className="gauge__val">{formato ? formato(valor) : `${Math.round((valor / max) * 100)}%`}</text>
        {etiqueta && <text x="50" y="66" textAnchor="middle" className="gauge__lbl">{etiqueta}</text>}
      </svg>
    </div>
  );
}

// ─────────── Lista de barras horizontales (con relleno rayado) ───────────
export function BarList({ items, formato = compacto, destacar }: {
  items: { label: string; valor: number; texto?: string }[]; formato?: (v: number) => string; destacar?: number;
}) {
  const max = Math.max(...items.map(i => i.valor), 1);
  return (
    <div className="blist">
      {items.map((it, i) => (
        <div key={it.label} className="blist__row">
          <span className="blist__lbl" title={it.label}>{it.label}</span>
          <span className="blist__track">
            <span className="blist__fill" style={{ width: `${(it.valor / max) * 100}%`, color: i === (destacar ?? 0) ? 'var(--serie1)' : 'var(--serie5)', borderColor: i === (destacar ?? 0) ? 'var(--serie1)' : 'var(--serie5)' }} />
          </span>
          <b className="blist__val">{it.texto ?? formato(it.valor)}</b>
        </div>
      ))}
    </div>
  );
}

/** Barra de progreso fina (meta/avance). */
export const Progreso = ({ valor, total, alerta }: { valor: number; total: number; alerta?: boolean }) => (
  <span className="prog"><span className={alerta ? 'is-alert' : ''} style={{ width: `${total ? Math.min(100, (valor / total) * 100) : 0}%` }} /></span>
);

export const SinDatos = ({ children = 'Sin datos.' }: { children?: ReactNode }) => <p className="chart__empty">{children}</p>;
