import React from 'react';
import { Gauge, Bell, Activity, Megaphone } from 'lucide-react';
import { Panel, Kpi, Insight, SectionHero, LiveDot, keyframes, wrap, inner, useIsMobile } from './shared/ui';
import { brandingConfig } from '../config/branding';
import {
  porPeriodo, COBERTURA, ULTIMO, MARCAS, CLIENTE, fmt, fmtMXN, fmtMXNCorto, MARCA_COLOR, MARCA_NOMBRE,
} from '../data/media';

const { colores } = brandingConfig;
const V = colores.primario;
const D = porPeriodo[ULTIMO];

// Alertas del sistema derivadas de los datos
const ALERTAS_SISTEMA = [
  { tipo: 'Share of Voice', nivel: 'OK',   fuente: ULTIMO,   texto: `${CLIENTE.nombre} lidera ${D.plazasLideradas} de ${D.totalPlazas} plazas` },
  { tipo: 'Competencia',    nivel: 'Alta', fuente: 'México', texto: `${D.segundaMarca} es 2ª marca con ${D.lideradasSegunda} plazas lideradas` },
  { tipo: 'Plaza clave',    nivel: 'Info', fuente: ULTIMO,   texto: `Mayor inversión: ${D.topPlazas[0].plaza} (${fmtMXNCorto(D.topPlazas[0].inversionMXN)})` },
  { tipo: 'Cobertura',      nivel: 'Alta', fuente: 'México', texto: `Alcance promedio ${D.alcanceProm}% — 6 plazas por debajo del objetivo` },
  { tipo: 'Pauta',          nivel: 'Info', fuente: 'México', texto: `${fmt(COBERTURA.emisoras)} emisoras monitoreadas · ${fmt(D.grpsTotal)} GRPs` },
];
const NIVEL_COLOR: Record<string, string> = { OK: colores.exito, Alta: colores.advertencia, Info: '#0047AB' };

const ACTIVIDAD = [
  { titulo: 'Plan de medios del trimestre cargado', meta: `${D.totalPlazas} plazas · planning`, cuando: 'hoy' },
  { titulo: 'Testigos IA verificó la pauta del día', meta: `${COBERTURA.emisoras} emisoras · on-air`, cuando: 'hoy' },
  { titulo: 'Cálculo de Share of Voice', meta: 'México · Cerebro Orquestador', cuando: 'hoy' },
  { titulo: 'Conciliación de spots vs contrato', meta: `${D.discrepancias.length} discrepancias abiertas`, cuando: 'hoy' },
];

const NIVEL_ACT = [
  { label: 'Drive time AM (06-10)', pct: 34, color: V },
  { label: 'Mediodía (10-15)', pct: 21, color: colores.advertencia },
  { label: 'Drive time PM (15-20)', pct: 31, color: colores.exito },
  { label: 'Nocturno (20-00)', pct: 14, color: colores.textoOscuro },
];

export const ComandoCampana: React.FC = () => {
  const isMobile = useIsMobile();
  const grid = (cols: string): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : cols, gap: 16 });

  return (
    <div style={wrap(isMobile)}>
      <style>{keyframes}</style>
      <div style={inner}>
        <SectionHero
          eyebrow="Comando de Campaña"
          title={<>Comando de <strong style={{ fontWeight: 800 }}>Campaña</strong> · {CLIENTE.nombre}</>}
          subtitle="Vista de mando sobre la campaña en curso: inversión, Share of Voice y cobertura por plaza en las 32 entidades."
          insights={<>
            <Insight kind="Análisis" title={`${CLIENTE.nombre} lidera ${D.plazasLideradas} de ${D.totalPlazas} plazas`}>
              En {ULTIMO} la marca es #1 en Share of Voice en el {Math.round(D.plazasLideradas / D.totalPlazas * 100)}% de las plazas, con {D.sovCliente}% de SOV nacional ponderado.
            </Insight>
            <Insight kind="Análisis" title={`Plaza clave: ${D.topPlazas[0].plaza}`}>
              {D.topPlazas[0].plaza} concentra la mayor inversión de la categoría ({fmtMXNCorto(D.topPlazas[0].inversionMXN)}). Núcleo a defender.
            </Insight>
            <Insight kind="Sugerencia" title={`Inversión del cliente: ${fmtMXN(D.inversionCliente)}`} plan={`Rebalanceo de ${fmt(D.grpsTotal)} GRPs hacia las plazas con menor costo por punto.`}>
              {fmt(COBERTURA.emisoras)} emisoras monitoreadas en {fmt(COBERTURA.plazas)} plazas. El Cerebro Orquestador puede rebalancear la pauta por rendimiento.
            </Insight>
          </>}
        />

        {/* KPIs */}
        <div style={{ ...grid('repeat(5, 1fr)'), marginBottom: 22 }}>
          <Kpi label={`Plazas ${ULTIMO}`} value={fmt(D.totalPlazas)} sub="México" up />
          <Kpi label="Plazas lideradas" value={fmt(D.plazasLideradas)} delta={`2ª: ${D.segundaMarca} ${D.lideradasSegunda}`} up />
          <Kpi label={`SOV ${CLIENTE.nombre}`} value={`${D.sovCliente}%`} delta={`${fmt(D.grpsTotal)} GRPs`} up />
          <Kpi label="Inversión del cliente" value={fmtMXNCorto(D.inversionCliente)} delta={`categoría ${fmtMXNCorto(D.inversionTotal)}`} up />
          <Kpi label="Alcance promedio" value={`${D.alcanceProm}%`} sub={`${fmt(Math.round(D.impactos / 1_000_000))} M de impactos`} up />
        </div>

        {/* Alertas + Actividad */}
        <div style={{ ...grid('1.4fr 1fr'), marginBottom: 22 }}>
          <Panel title="Alertas del Sistema" icon={<Bell size={17} color={V} />} right={<span style={{ fontSize: 22, fontWeight: 800, color: colores.textoClaro }}>{ALERTAS_SISTEMA.length}</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ALERTAS_SISTEMA.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 12, padding: '11px 13px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: NIVEL_COLOR[a.nivel], background: `${NIVEL_COLOR[a.nivel]}18`, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>{a.nivel}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: colores.textoClaro }}>{a.texto}</div>
                    <div style={{ fontSize: 11.5, color: colores.textoOscuro, marginTop: 2 }}>{a.tipo} · {a.fuente}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Actividad Reciente" icon={<Activity size={17} color={V} />} right={<LiveDot />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ACTIVIDAD.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 11 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: V }} />
                    {i < ACTIVIDAD.length - 1 && <span style={{ width: 2, flex: 1, background: colores.borde, marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: colores.textoClaro }}>{a.titulo}</div>
                    <div style={{ fontSize: 11.5, color: colores.textoOscuro }}>{a.meta} · {a.cuando}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Inversión por marca + pauta por franja */}
        <div style={grid('1.4fr 1fr')}>
          <Panel title={`Inversión por marca · ${ULTIMO}`} icon={<Megaphone size={17} color={V} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {MARCAS.map(m => {
                const v = D.inversionPorMarca[m.id];
                const pct = Math.round(v / D.inversionTotal * 1000) / 10;
                return (
                  <div key={m.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: colores.textoClaro }}>{MARCA_NOMBRE[m.id]}</span>
                      <span style={{ color: colores.textoOscuro, fontVariantNumeric: 'tabular-nums' }}>{fmtMXNCorto(v)} · {pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: MARCA_COLOR[m.id], borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Pauta por franja horaria" icon={<Gauge size={17} color={V} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {NIVEL_ACT.map(n => (
                <div key={n.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: colores.textoClaro }}>{n.label}</span>
                    <span style={{ color: colores.textoOscuro, fontWeight: 700 }}>{n.pct}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden' }}>
                    <div style={{ width: `${n.pct}%`, height: '100%', background: n.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
