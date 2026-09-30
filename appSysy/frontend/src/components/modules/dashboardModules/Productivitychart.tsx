import React, { useState, useEffect, useRef } from 'react';
import { Radio, TrendingUp } from 'lucide-react';
import { brandingConfig } from '../../../config/branding';

const { colores } = brandingConfig;

interface Testigo {
  emisora_nombre: string;
  timestamp: string;
}

interface PuntoTiempo {
  hora: string;
  [emisora: string]: number | string;
}

export const ProductivityChart: React.FC = () => {
  const [datos, setDatos] = useState<PuntoTiempo[]>([]);
  const [emisoras, setEmisoras] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; contenido: string } | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch('/api/monitor/testigos')
      .then(r => r.json())
      .then(data => {
        const testigos: Testigo[] = data.testigos || [];
        setTotal(testigos.length);

        if (testigos.length === 0) return;

        // Agrupar por hora y emisora
        const emisorasSet = new Set<string>();
        const porHora: Record<string, Record<string, number>> = {};

        testigos.forEach(t => {
          const fecha = new Date(t.timestamp);
          const hora = `${fecha.getHours().toString().padStart(2, '0')}:00`;
          const nombre = t.emisora_nombre || 'Sin nombre';
          emisorasSet.add(nombre);
          if (!porHora[hora]) porHora[hora] = {};
          porHora[hora][nombre] = (porHora[hora][nombre] || 0) + 1;
        });

        const emisorasArr = Array.from(emisorasSet);
        setEmisoras(emisorasArr);

        // Llenar horas vacías
        const horasOrdenadas = Object.keys(porHora).sort();
        const puntos: PuntoTiempo[] = horasOrdenadas.map(hora => {
          const punto: PuntoTiempo = { hora };
          emisorasArr.forEach(e => { punto[e] = porHora[hora][e] || 0; });
          return punto;
        });

        setDatos(puntos);
      })
      .catch(() => {});

    const interval = setInterval(() => {
      fetch('/api/monitor/testigos')
        .then(r => r.json())
        .then(data => {
          const testigos: Testigo[] = data.testigos || [];
          setTotal(testigos.length);
          if (testigos.length === 0) return;
          const emisorasSet = new Set<string>();
          const porHora: Record<string, Record<string, number>> = {};
          testigos.forEach(t => {
            const fecha = new Date(t.timestamp);
            const hora = `${fecha.getHours().toString().padStart(2, '0')}:00`;
            const nombre = t.emisora_nombre || 'Sin nombre';
            emisorasSet.add(nombre);
            if (!porHora[hora]) porHora[hora] = {};
            porHora[hora][nombre] = (porHora[hora][nombre] || 0) + 1;
          });
          const emisorasArr = Array.from(emisorasSet);
          setEmisoras(emisorasArr);
          const horasOrdenadas = Object.keys(porHora).sort();
          const puntos: PuntoTiempo[] = horasOrdenadas.map(hora => {
            const punto: PuntoTiempo = { hora };
            emisorasArr.forEach(e => { punto[e] = porHora[hora][e] || 0; });
            return punto;
          });
          setDatos(puntos);
        }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Paleta de colores para líneas
  const COLORES_LINEA = ['#0A0A0A', '#6B7280', '#D4D4D4', '#1A1A1A', '#9CA3AF'];

  const chartH = isMobile ? 200 : 280;
  const paddingL = 40;
  const paddingB = 30;
  const W = 1000;
  const H = chartH;

  const maxVal = datos.length > 0
    ? Math.max(...datos.flatMap(p => emisoras.map(e => Number(p[e] || 0))), 1)
    : 1;

  const getX = (i: number) => datos.length < 2 ? W / 2 : (i / (datos.length - 1)) * W;
  const getY = (val: number) => H - paddingB - ((val / maxVal) * (H - paddingB - 20));

  return (
    <div style={{
      background: colores.fondoClaro, borderRadius: 20,
      padding: isMobile ? 16 : 28,
      border: `1px solid ${colores.borde}`,
      boxShadow: colores.sombraMedia,
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: colores.fondoSecundario,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={22} color={colores.textoClaro} />
          </div>
          <div>
            <h3 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: colores.textoClaro, margin: 0 }}>
              Actividad por Emisora
            </h3>
            <p style={{ fontSize: 13, color: colores.textoOscuro, margin: '4px 0 0' }}>
              Detecciones por hora del día
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: colores.fondoSecundario, borderRadius: 10,
          padding: '8px 14px',
        }}>
          <Radio size={14} color={colores.textoOscuro} />
          <span style={{ fontSize: 13, fontWeight: 700, color: colores.textoClaro }}>
            {total}
          </span>
          <span style={{ fontSize: 12, color: colores.textoOscuro }}>
            detecciones
          </span>
        </div>
      </div>

      {/* Gráfica */}
      {datos.length === 0 ? (
        <div style={{
          height: chartH, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <Radio size={40} color={colores.textoOscuro} strokeWidth={1} />
          <p style={{ fontSize: 14, color: colores.textoOscuro, margin: 0 }}>
            Sin datos aún — inicia una sesión de monitoreo
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            width="100%"
            height={chartH}
            viewBox={`0 0 ${W + paddingL} ${H}`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              {emisoras.map((e, i) => (
                <linearGradient key={e} id={`area-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={COLORES_LINEA[i % COLORES_LINEA.length]} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={COLORES_LINEA[i % COLORES_LINEA.length]} stopOpacity="0.01" />
                </linearGradient>
              ))}
            </defs>

            {/* Líneas de guía horizontales */}
            {[0, 25, 50, 75, 100].map(pct => {
              const y = H - paddingB - ((pct / 100) * (H - paddingB - 20));
              const val = Math.round((pct / 100) * maxVal);
              return (
                <g key={pct}>
                  <line x1={paddingL} y1={y} x2={W + paddingL} y2={y}
                    stroke={colores.borde} strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                  <text x={paddingL - 6} y={y + 4} textAnchor="end"
                    fontSize="11" fill={colores.textoOscuro}>{val}</text>
                </g>
              );
            })}

            {/* Áreas y líneas por emisora */}
            {emisoras.map((e, i) => {
              const color = COLORES_LINEA[i % COLORES_LINEA.length];
              const pts = datos.map((p, idx) => ({
                x: getX(idx) + paddingL,
                y: getY(Number(p[e] || 0)),
              }));

              const areaPath = `M ${pts[0].x},${H - paddingB} `
                + pts.map(p => `L ${p.x},${p.y}`).join(' ')
                + ` L ${pts[pts.length - 1].x},${H - paddingB} Z`;

              const linePath = pts.map((p, idx) =>
                `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`
              ).join(' ');

              return (
                <g key={e}>
                  <path d={areaPath} fill={`url(#area-${i})`} />
                  <path d={linePath} stroke={color} strokeWidth="2.5"
                    fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {pts.map((p, idx) => (
                    <circle
                      key={idx} cx={p.x} cy={p.y} r="4"
                      fill={color} stroke="white" strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setTooltip({
                        x: p.x, y: p.y,
                        contenido: `${e}\n${datos[idx].hora}: ${datos[idx][e]} detecciones`
                      })}
                    />
                  ))}
                </g>
              );
            })}

            {/* Eje X — horas */}
            {datos.map((p, i) => (
              <text key={i}
                x={getX(i) + paddingL} y={H - 8}
                textAnchor="middle" fontSize="11" fill={colores.textoOscuro}
              >
                {p.hora}
              </text>
            ))}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute',
              left: `${(tooltip.x / (W + paddingL)) * 100}%`,
              top: tooltip.y - 10,
              transform: 'translate(-50%, -100%)',
              background: colores.textoClaro,
              color: colores.textoEnOscuro,
              padding: '6px 12px', borderRadius: 8,
              fontSize: 12, fontWeight: 500,
              whiteSpace: 'pre', pointerEvents: 'none',
              boxShadow: colores.sombraMedia,
              zIndex: 10,
            }}>
              {tooltip.contenido}
            </div>
          )}
        </div>
      )}

      {/* Leyenda */}
      {emisoras.length > 0 && (
        <div style={{
          display: 'flex', gap: 20, flexWrap: 'wrap',
          marginTop: 20, paddingTop: 16,
          borderTop: `1px solid ${colores.borde}`,
        }}>
          {emisoras.map((e, i) => (
            <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 3, borderRadius: 999,
                background: COLORES_LINEA[i % COLORES_LINEA.length],
              }} />
              <span style={{ fontSize: 12, color: colores.textoMedio, fontWeight: 500 }}>
                {e}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};