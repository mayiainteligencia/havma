// Piezas chicas que comparten las 7 vistas reales (no placeholders): título de
// subsección, tabla genérica, gráficas y el layout de página. El resto de lo
// compartido (Panel, Kpi, OrigenTag, Semaforo, wrap/inner) vive en
// components/shared/ui.tsx.
import React from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { brandingConfig } from '../../config/branding';
import { vistaActiva } from '../../config/menu';

// Paleta determinista (mismo dato → mismo color siempre) para pies y barras
// de varias series — el color no depende del orden en que lleguen los datos.
export const colorSerie = (indice: number) => `hsl(${(indice * 47) % 360} 65% 45%)`;

export const VistaHeader: React.FC<{ vistaId: string; subId: string }> = ({ vistaId, subId }) => {
  const { colores } = brandingConfig;
  const vista = vistaActiva(vistaId);
  const sub = vista.subsecciones.find(s => s.id === subId) ?? vista.subsecciones[0];
  return (
    <div style={{
      background: colores.gradientePrimario, borderRadius: 22, padding: '22px 26px', color: '#fff',
      position: 'relative', overflow: 'hidden', marginBottom: 20,
    }}>
      <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%',
                    background: `radial-gradient(circle, ${colores.primario}55, transparent 70%)` }} />
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: colores.primario }}>
          {vista.nombre}
        </span>
        <h1 style={{ fontSize: 24, fontWeight: 300, margin: '8px 0 4px' }}>{sub?.nombre ?? vista.nombre}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.72)', margin: 0, maxWidth: 640 }}>{sub?.descripcion ?? vista.descripcion}</p>
      </div>
    </div>
  );
};

export interface DatoDona { nombre: string; valor: number; [extra: string]: unknown }

/** Dona (pie) con leyenda — para "esto se ve mejor que una tabla" en los resúmenes por marca/medio/canal. */
export const DonaChart: React.FC<{ datos: DatoDona[]; formatear?: (v: number) => string; alto?: number }> =
({ datos, formatear = String, alto = 260 }) => {
  const { colores } = brandingConfig;
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <PieChart>
        <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius="45%" outerRadius="80%" paddingAngle={2} isAnimationActive={false}>
          {datos.map((d, i) => <Cell key={d.nombre} fill={colorSerie(i)} stroke={colores.fondoPrincipal} />)}
        </Pie>
        <Tooltip formatter={(v: number) => formatear(v)} />
        <Legend wrapperStyle={{ fontSize: 11.5 }} layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </ResponsiveContainer>
  );
};

export interface DatoBarra { nombre: string; [serie: string]: number | string }

/** Barras — una o varias series (ej. autorizado vs. comprometido) contra la misma categoría. */
export const BarritasChart: React.FC<{ datos: DatoBarra[]; series: { key: string; color?: string; nombre?: string }[]; formatear?: (v: number) => string; alto?: number }> =
({ datos, series, formatear = String, alto = 260 }) => {
  const { colores } = brandingConfig;
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke={colores.borde} />
        <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} angle={datos.length > 5 ? -20 : 0} textAnchor={datos.length > 5 ? 'end' : 'middle'} height={datos.length > 5 ? 50 : 30} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={formatear} width={70} />
        <Tooltip formatter={(v: number) => formatear(v)} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11.5 }} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.nombre ?? s.key} fill={s.color ?? colorSerie(i)} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export interface Columna<T> { header: string; render: (row: T) => React.ReactNode; align?: 'left' | 'right' }

export function Tabla<T>({ columnas, filas, keyOf }: { columnas: Columna<T>[]; filas: T[]; keyOf: (row: T) => string }) {
  const { colores } = brandingConfig;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columnas.map((c, i) => (
              <th key={i} style={{
                textAlign: c.align ?? 'left', padding: '8px 12px', borderBottom: `2px solid ${colores.borde}`,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em', color: colores.textoOscuro, whiteSpace: 'nowrap',
              }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map(row => (
            <tr key={keyOf(row)}>
              {columnas.map((c, i) => (
                <td key={i} style={{ textAlign: c.align ?? 'left', padding: '9px 12px', borderBottom: `1px solid ${colores.borde}`, color: colores.textoClaro }}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {filas.length === 0 && (
            <tr><td colSpan={columnas.length} style={{ padding: 16, color: colores.textoOscuro, fontSize: 13 }}>Sin datos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
