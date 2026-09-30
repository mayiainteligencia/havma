import React from 'react';
import { brandingConfig } from '../../../config/branding';
import { ALERTAS, CARTERA, ULTIMO, fmt, fmtMXNCorto, porPeriodo } from '../../../data/media';

const D = porPeriodo[ULTIMO];

export interface EstadisticaPulso { v: string; l: string; alerta?: boolean }

interface WelcomeHeaderProps {
  isMobile?: boolean;
  /** La pregunta bajo el saludo — cambia según la vista activa. */
  pregunta?: string;
  /** Las 4 cifras del pulso — cambian según la vista activa. */
  stats?: EstadisticaPulso[];
}

const STATS_DEFECTO: EstadisticaPulso[] = [
  { v: fmt(CARTERA.length), l: 'campañas activas' },
  { v: fmtMXNCorto(D.inversionCliente), l: 'inversión gestionada' },
  { v: `${D.sovCliente}%`, l: 'share of voice promedio' },
  { v: fmt(ALERTAS.length), l: 'alertas activas', alerta: ALERTAS.length > 0 },
];

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  isMobile = false,
  pregunta = '¿Qué vamos a monitorear hoy?',
  stats = STATS_DEFECTO,
}) => {
  const { empresa, colores } = brandingConfig;
  const V = colores.primario;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        minHeight: isMobile ? 0 : 260,
        borderRadius: 24,
        padding: isMobile ? '24px 22px' : '34px 36px',
        background: colores.gradientePrimario,
        boxShadow: colores.sombraGrande,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Resplandor de marca */}
      <div style={{
        position: 'absolute', top: -90, right: -60, width: 320, height: 320, borderRadius: '50%',
        background: `radial-gradient(circle, ${V}55, transparent 70%)`, pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
          color: V, background: `${V}1F`, border: `1px solid ${V}40`,
          padding: '4px 11px', borderRadius: 999, marginBottom: 16,
        }}>
          Cuenta activa
        </span>

        <h1 style={{
          fontSize: isMobile ? 28 : 42, fontWeight: 300, lineHeight: 1.15,
          color: '#fff', margin: '0 0 10px', letterSpacing: '-0.5px',
        }}>
          Bienvenido a <span style={{ fontWeight: 700 }}>{empresa.nombre}</span>
          {empresa.eslogan && (
            <span style={{ fontWeight: 300, fontSize: isMobile ? 18 : 24, color: 'rgba(255,255,255,.6)', marginLeft: 12 }}>
              {empresa.eslogan}
            </span>
          )}
        </h1>

        <p style={{
          fontSize: isMobile ? 16 : 19, fontWeight: 300,
          color: 'rgba(255,255,255,.72)', margin: 0, letterSpacing: '-0.3px',
        }}>
          {pregunta}
        </p>

        {/* Pulso de la operación */}
        <div style={{ display: 'flex', gap: isMobile ? 18 : 30, marginTop: isMobile ? 20 : 26, flexWrap: 'wrap' }}>
          {stats.map(k => (
            <div key={k.l}>
              <div style={{
                fontSize: isMobile ? 20 : 24, fontWeight: 800, lineHeight: 1,
                color: k.alerta ? colores.peligro : '#fff',
              }}>{k.v}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
