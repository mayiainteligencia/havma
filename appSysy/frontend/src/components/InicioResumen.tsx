import React, { useState, useEffect } from 'react';
import { brandingConfig } from '../config/branding';
import { ALERTAS, CARTERA, ULTIMO, porPeriodo, fmt, fmtMXNCorto } from '../data/media';
import { WelcomeHeader, type EstadisticaPulso } from './modules/dashboardModules/WelcomeHeader';
import { HeroCard } from './modules/dashboardModules/Herocard';
import { Kpi } from './shared/ui';

const D = porPeriodo[ULTIMO];
// ponytail: sin vista de Aprobaciones conectada aún, se muestran conteos de
// referencia; se reemplazan por datos reales cuando esa vista tenga fuente propia.
const APROBACIONES_PENDIENTES = 3;
const APROBADAS_SEMANA = 2;
const RECHAZADAS_SEMANA = 1;

interface ContenidoVista {
  pregunta: string;
  stats: EstadisticaPulso[];
  asesorTitulo: string;
  asesorSubtitulo: string;
  asesorSaludo: string;
}

// Lo que dice el bloque de Inicio (bienvenida + MAYIA) cambia según la vista
// activa, para que se note de un vistazo en qué parte de la plataforma estás.
const CONTENIDO_POR_VISTA: Record<string, ContenidoVista> = {
  ejecutiva: {
    pregunta: '¿Qué vamos a monitorear hoy?',
    stats: [
      { v: fmt(CARTERA.length), l: 'campañas activas' },
      { v: fmtMXNCorto(D.inversionCliente), l: 'inversión gestionada' },
      { v: `${D.sovCliente}%`, l: 'share of voice promedio' },
      { v: fmt(ALERTAS.length), l: 'alertas activas', alerta: ALERTAS.length > 0 },
    ],
    asesorTitulo: 'MAYIA · tu asesor ejecutivo',
    asesorSubtitulo: 'Pregúntame cómo vamos contra la meta o di "MAYIA" para hablar',
    asesorSaludo: 'Soy MAYIA. Pregúntame "¿cómo vamos contra la meta?", "¿cuánto invertimos?" o "¿qué alertas hay abiertas?".',
  },
  cliente: {
    pregunta: '¿Cómo va tu campaña esta semana?',
    stats: [
      { v: CARTERA[0].nombre, l: 'cuenta activa' },
      { v: `${CARTERA[0].sharePresupuesto}%`, l: 'share del presupuesto' },
      { v: fmtMXNCorto(D.inversionCliente), l: 'presupuesto autorizado' },
      { v: fmt(APROBACIONES_PENDIENTES), l: 'aprobaciones pendientes' },
    ],
    asesorTitulo: 'MAYIA · tu asesor del cliente',
    asesorSubtitulo: 'Pregúntame por tu presupuesto o tus próximas aprobaciones',
    asesorSaludo: 'Soy MAYIA. Pregúntame por el presupuesto de tu cuenta, tu calendario o qué te falta por aprobar.',
  },
  planeacion: {
    pregunta: '¿Qué mix armamos para el próximo flight?',
    stats: [
      { v: fmt(D.grpsTotal), l: 'GRPs del plan vigente' },
      { v: `${D.alcanceProm}%`, l: 'alcance promedio' },
      { v: fmt(D.totalPlazas), l: 'plazas contempladas' },
      { v: fmt(D.riesgoAlcance.length), l: 'plazas bajo objetivo', alerta: D.riesgoAlcance.length > 0 },
    ],
    asesorTitulo: 'MAYIA · tu asesor de planeación',
    asesorSubtitulo: 'Pregúntame por el mix de medios o los escenarios del plan',
    asesorSaludo: 'Soy MAYIA. Pregúntame por el mix de medios, el alcance esperado o cómo comparan los escenarios.',
  },
  flowchart: {
    pregunta: '¿Qué sale al aire esta semana?',
    stats: [
      { v: '52', l: 'semanas en el calendario' },
      { v: '7', l: 'medios en el flow' },
      { v: fmt(CARTERA.length), l: 'campañas programadas' },
      { v: fmt(D.discrepancias.length), l: 'ajustes pendientes', alerta: D.discrepancias.length > 0 },
    ],
    asesorTitulo: 'MAYIA · tu asesor de flowchart',
    asesorSubtitulo: 'Pregúntame qué campaña sale al aire esta semana',
    asesorSaludo: 'Soy MAYIA. Pregúntame qué sale al aire esta semana o qué proveedor factura cada medio.',
  },
  aprobaciones: {
    pregunta: '¿Qué está esperando tu firma?',
    stats: [
      { v: fmt(APROBACIONES_PENDIENTES), l: 'pendientes', alerta: true },
      { v: fmt(APROBADAS_SEMANA), l: 'aprobadas esta semana' },
      { v: fmt(RECHAZADAS_SEMANA), l: 'rechazadas esta semana' },
      { v: fmt(APROBACIONES_PENDIENTES + APROBADAS_SEMANA + RECHAZADAS_SEMANA), l: 'versiones en el historial' },
    ],
    asesorTitulo: 'MAYIA · tu asesor de aprobaciones',
    asesorSubtitulo: 'Pregúntame qué versión sigue pendiente de revisión',
    asesorSaludo: 'Soy MAYIA. Pregúntame qué versiones están pendientes de tu firma o qué cambió entre dos versiones.',
  },
  presupuesto: {
    pregunta: '¿Cómo va el presupuesto este trimestre?',
    stats: [
      { v: fmtMXNCorto(D.inversionCliente), l: 'presupuesto gestionado' },
      { v: fmtMXNCorto(D.inversionTotal - D.inversionCliente), l: 'resto de la categoría' },
      { v: fmt(D.discrepancias.length), l: 'discrepancias por revisar', alerta: D.discrepancias.length > 0 },
      { v: fmt(APROBACIONES_PENDIENTES), l: 'compromisos por aprobar' },
    ],
    asesorTitulo: 'MAYIA · tu asesor de presupuesto',
    asesorSubtitulo: 'Pregúntame cuánto llevamos comprometido o qué falta por asignar',
    asesorSaludo: 'Soy MAYIA. Pregúntame cuánto llevamos comprometido, por medio o por marca, y qué falta por asignar.',
  },
  resultados: {
    pregunta: '¿Cómo va la campaña contra la meta?',
    stats: [
      { v: `${D.sovCliente}%`, l: 'share of voice actual' },
      { v: fmt(D.grpsTotal), l: 'GRPs acumulados' },
      { v: `${D.alcanceProm}%`, l: 'alcance promedio' },
      { v: fmt(ALERTAS.length), l: 'focos de atención', alerta: ALERTAS.length > 0 },
    ],
    asesorTitulo: 'MAYIA · tu asesor de resultados',
    asesorSubtitulo: 'Pregúntame cómo vamos contra la meta o qué recomienda para el próximo flight',
    asesorSaludo: 'Soy MAYIA. Pregúntame cómo va la campaña contra la meta o qué me recomiendas ajustar.',
  },
};

interface InicioResumenProps {
  activeVista: string;
  onNavigate: (target: string) => void;
}

/**
 * Chrome permanente arriba de cada vista: MAYIA + el resumen ejecutivo del
 * día. No es una vista propia — vive siempre montado (App.tsx), la vista
 * elegida en el dropdown del Header se renderiza justo debajo. Su contenido
 * cambia según `activeVista` para que se note en qué parte de la
 * plataforma estás.
 */
export const InicioResumen: React.FC<InicioResumenProps> = ({ activeVista, onNavigate }) => {
  const { colores } = brandingConfig;
  const [isMobile, setIsMobile] = useState(false);
  const c = CONTENIDO_POR_VISTA[activeVista] ?? CONTENIDO_POR_VISTA.ejecutiva;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ background: colores.fondoPrincipal, padding: isMobile ? '16px 16px 0' : '32px 32px 0' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* ── Bienvenida + MAYIA a su derecha ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.55fr 1fr',
          gap: isMobile ? 16 : 24,
          marginBottom: isMobile ? 16 : 24,
          alignItems: 'stretch',
        }}>
          <WelcomeHeader isMobile={isMobile} pregunta={c.pregunta} stats={c.stats} />
          <div style={{ height: isMobile ? 300 : 'auto', minHeight: isMobile ? 0 : 260 }}>
            <HeroCard
              onNavigate={onNavigate}
              titulo={c.asesorTitulo}
              subtitulo={c.asesorSubtitulo}
              saludo={c.asesorSaludo}
            />
          </div>
        </div>

        {/* ── Resumen ejecutivo — se mantiene fijo, no es lo que pidió variar ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 10 : 16,
        }}>
          <Kpi label="Campañas activas" value={fmt(CARTERA.length)} sub="en la cartera gestionada" />
          <Kpi label="Presupuesto gestionado" value={fmtMXNCorto(D.inversionCliente)} sub={`periodo ${ULTIMO}`} />
          <Kpi label="Alertas abiertas" value={fmt(ALERTAS.length)} up={ALERTAS.length === 0}
               sub={ALERTAS.filter(a => a.severidad === 'alta').length + ' de severidad alta'} />
          <Kpi label="Aprobaciones pendientes" value={fmt(APROBACIONES_PENDIENTES)} sub="esperando revisión" />
        </div>

        <style>{`
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: ${colores.fondoSecundario}40; border-radius: 4px; }
          ::-webkit-scrollbar-thumb { background: ${colores.primario}60; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${colores.primario}80; }
        `}</style>
      </div>
    </div>
  );
};
