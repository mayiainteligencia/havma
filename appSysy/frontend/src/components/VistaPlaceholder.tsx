import React from 'react';
import { Database, LayoutGrid } from 'lucide-react';
import { brandingConfig } from '../config/branding';
import { vistaActiva } from '../config/menu';
import { Panel, SectionHero, Insight, keyframes, wrap, inner, useIsMobile } from './shared/ui';

// Datos de havasData que alimentarán cada vista en la Fase 2. Vive aquí (y no
// repartido) para que sea fácil de actualizar cuando el pipeline crezca.
const FUENTES: Record<string, string[]> = {
  ejecutiva:    ['Smart Planner — totales del plan (inversión, GRPs, alcance)', 'Spectrum — allocation por medio', 'Flow — resumen de escenario'],
  cliente:      ['Flow — resumen por marca', 'Smart Planner — ejercicio (target, presupuesto, periodo) y totales'],
  planeacion:   ['Smart Planner — touchpoints, mix y escenarios', 'Smart Planner — curvas de alcance y frecuencia', 'Spectrum — alcance por touchpoint'],
  flowchart:    ['Flow principal (1,027 filas × 69 columnas)', 'Flows por categoría y por marca', 'Patrones de flighting LANZ / MANT / MIN'],
  aprobaciones: ['Smart Planner como "versión a aprobar" (demo mientras se define el flujo real)'],
  presupuesto:  ['Spectrum — allocation', 'Flow — RI por marca, por trimestre y por mes', 'Flow — RI compromisos'],
  resultados:   ['Smart Planner — escenarios y sus validaciones de cuadre', 'Rules catalog — factores de fórmula y patrones de flighting'],
};

interface VistaPlaceholderProps {
  vistaId: string;
  subId: string;
}

export const VistaPlaceholder: React.FC<VistaPlaceholderProps> = ({ vistaId, subId }) => {
  const isMobile = useIsMobile();
  const { colores } = brandingConfig;
  const vista = vistaActiva(vistaId);
  const sub = vista.subsecciones.find(s => s.id === subId) ?? vista.subsecciones[0];
  const fuentes = FUENTES[vista.id] ?? [];
  const VistaIcon = vista.icono;

  return (
    <div style={wrap(isMobile)}>
      <style>{keyframes}</style>
      <div style={inner}>
        <SectionHero
          eyebrow={vista.nombre}
          title={sub?.nombre ?? vista.nombre}
          subtitle={sub?.descripcion ?? vista.descripcion}
          insights={
            <Insight kind="Análisis" title="Estructura lista, datos en camino">
              La navegación, el diseño y las subsecciones de {vista.nombre.toLowerCase()} ya están armados.
              Esta pantalla se conecta a datos reales en la siguiente fase del proyecto.
            </Insight>
          }
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr',
          gap: 18,
        }}>
          <Panel title="Subsecciones de esta vista" icon={<LayoutGrid size={17} color={colores.primario} />}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {vista.subsecciones.map(s => {
                const Icon = s.icono;
                const activa = s.id === sub?.id;
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
                    borderRadius: 12, border: `1px solid ${activa ? colores.primario : colores.borde}`,
                    background: activa ? `${colores.primario}0D` : colores.fondoSecundario,
                  }}>
                    <Icon size={15} color={activa ? colores.primario : colores.textoOscuro} />
                    <span style={{ fontSize: 12.5, fontWeight: activa ? 700 : 500, color: activa ? colores.primario : colores.textoMedio }}>
                      {s.nombre}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Fuentes de datos previstas" icon={<Database size={17} color={colores.primario} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fuentes.length > 0 ? fuentes.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <VistaIcon size={14} color={colores.textoOscuro} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: colores.textoMedio, lineHeight: 1.5 }}>{f}</span>
                </div>
              )) : (
                <span style={{ fontSize: 13, color: colores.textoOscuro }}>Por definir.</span>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
