import React, { useState } from 'react';
import { Download, Target, TrendingDown, Swords, Check, Zap } from 'lucide-react';
import { Panel, Kpi, Insight, SectionHero, keyframes, wrap, inner, useIsMobile } from './shared/ui';
import { brandingConfig } from '../config/branding';
import {
  porPeriodo, ULTIMO, ALERTAS, CLIENTE, fmt, fmtMXN, fmtMXNCorto,
  MARCA_COLOR, MARCA_NOMBRE, SEVERIDAD_COLOR, TIPO_LABEL, type Discrepancia,
} from '../data/media';
import { useToast } from './shared/toast';
import { useConfirm } from './shared/confirm';

const { colores } = brandingConfig;
const V = colores.primario;
const D = porPeriodo[ULTIMO];
const alertasAltas = ALERTAS.filter(a => a.severidad === 'alta').length;
const segundaId = Object.keys(MARCA_NOMBRE).find(id => MARCA_NOMBRE[id] === D.segundaMarca) ?? '';
const recuperableMXN = D.discrepancias.reduce((s, d) => s + d.montoMXN, 0);

const DiscrepanciaRow: React.FC<{ m: Discrepancia }> = ({ m }) => {
  const { push } = useToast();
  const confirmar = useConfirm();
  const [activo, setActivo] = useState(false);
  const faltantes = m.esperados - m.detectados;
  const plan = `${m.plaza}: reclamar ${faltantes} ${faltantes === 1 ? 'spot' : 'spots'} no emitidos en ${m.medio} (${fmtMXN(m.montoMXN)}).`;
  const activar = async () => {
    if (await confirmar({ titulo: `Reclamo de pauta · ${m.plaza}`, descripcion: plan })) {
      setActivo(true);
      push({ kind: 'success', title: 'Reclamo generado', msg: plan });
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: activo ? `${V}0D` : colores.fondoSecundario, border: `1px solid ${activo ? V : colores.borde}`, borderRadius: 12, padding: '11px 13px', transition: 'all .3s' }} className="el-anim">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: colores.textoClaro, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.plaza}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: colores.textoMedio, background: colores.fondoTerciario, padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>{m.medio}</span>
        </div>
        <div style={{ fontSize: 11.5, color: colores.textoOscuro, marginTop: 2 }}>
          {fmt(m.detectados)} de {fmt(m.esperados)} spots al aire · faltan {faltantes} · {fmtMXN(m.montoMXN)}
        </div>
      </div>
      {activo ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: colores.exito, flexShrink: 0 }}><Check size={15} /> Activo</span>
      ) : (
        <button onClick={activar}
          style={{ border: 'none', background: V, color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '7px 15px', borderRadius: 9, cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Zap size={13} /> Reclamar
        </button>
      )}
    </div>
  );
};

export const AlertasMarca: React.FC = () => {
  const isMobile = useIsMobile();
  const { push } = useToast();
  const grid = (cols: string): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : cols, gap: 16 });
  const dif = D.plazasLideradas - D.lideradasSegunda;
  const minAlcance = D.riesgoAlcance[0]?.alcancePct || 100;

  return (
    <div style={wrap(isMobile)}>
      <style>{keyframes}</style>
      <div style={inner}>
        <SectionHero
          eyebrow="Sistema de Alerta"
          title={<>Alertas de <strong style={{ fontWeight: 800 }}>Marca</strong></>}
          subtitle={`${ULTIMO} · discrepancias de pauta, menciones y movimientos de la competencia. Cada alerta es accionable.`}
          right={
            <button onClick={() => push({ kind: 'info', title: 'Reporte exportado', msg: 'Alertas de marca listas para descarga.' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: '#fff', color: colores.textoClaro, fontSize: 13, fontWeight: 700, padding: '10px 16px', borderRadius: 11, cursor: 'pointer' }}>
              <Download size={15} /> Exportar reporte
            </button>
          }
          insights={<>
            <Insight kind="Sugerencia" title={`${fmtMXNCorto(recuperableMXN)} recuperables por pauta no emitida`} plan={`Reclamo automático a las ${D.discrepancias.length} emisoras con spots faltantes.`}>
              Testigos IA detectó spots contratados que no salieron al aire en {D.discrepancias.length} plazas. El monto es reclamable al medio.
            </Insight>
            <Insight kind="Análisis" title={`Alcance promedio ${D.alcanceProm}%`} plan="Refuerzo de frecuencia en las plazas de menor cobertura.">
              El alcance promedio del periodo es {D.alcanceProm}%. Hay {D.riesgoAlcance.length} plazas por debajo del objetivo de cobertura.
            </Insight>
          </>}
        />

        {/* KPIs */}
        <div style={{ ...grid('repeat(4, 1fr)'), marginBottom: 22 }}>
          <Kpi label="Alertas abiertas" value={fmt(ALERTAS.length)} sub={`${alertasAltas} de severidad alta`} up={false} />
          <Kpi label="2ª marca" value={D.segundaMarca} sub={`${D.lideradasSegunda} plazas lideradas`} />
          <Kpi label="Alcance promedio" value={`${D.alcanceProm}%`} sub="cobertura por plaza" up={false} />
          <Kpi label="Presupuesto recuperable" value={fmtMXNCorto(recuperableMXN)} sub="pauta no emitida" up />
        </div>

        {/* Alertas en vivo */}
        <Panel title="Alertas en vivo" icon={<Target size={17} color={V} />} right={<span style={{ fontSize: 22, fontWeight: 800, color: colores.textoClaro }}>{ALERTAS.length}</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 4 }}>
            {ALERTAS.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderLeft: `3px solid ${SEVERIDAD_COLOR[a.severidad]}`, borderRadius: 12, padding: '11px 13px' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: SEVERIDAD_COLOR[a.severidad], background: `${SEVERIDAD_COLOR[a.severidad]}18`, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>
                  {TIPO_LABEL[a.tipo]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: colores.textoClaro }}>{a.descripcion}</div>
                  <div style={{ fontSize: 11.5, color: colores.textoOscuro, marginTop: 2 }}>{a.plaza} · {a.medio} · {a.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Discrepancias + Riesgo de alcance */}
        <div style={{ ...grid('1fr 1fr'), margin: '22px 0' }}>
          <Panel title="Discrepancias de pauta" icon={<Target size={17} color={V} />} right={<span style={{ fontSize: 22, fontWeight: 800, color: colores.textoClaro }}>{D.discrepancias.length}</span>}>
            <p style={{ fontSize: 12.5, color: colores.textoOscuro, margin: '0 0 14px', lineHeight: 1.4 }}>Spots contratados que Testigos IA no detectó al aire. Genera el reclamo al medio.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {D.discrepancias.map((m, i) => <DiscrepanciaRow key={i} m={m} />)}
            </div>
          </Panel>

          <Panel title="Riesgo de baja cobertura" icon={<TrendingDown size={17} color={colores.advertencia} />}>
            <p style={{ fontSize: 12.5, color: colores.textoOscuro, margin: '0 0 14px', lineHeight: 1.4 }}>Plazas con menor alcance del periodo. Foco de trabajo para el siguiente flight.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {D.riesgoAlcance.map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: colores.textoClaro, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{m.plaza}</span>
                    <span style={{ color: colores.peligro, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{m.alcancePct}%</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden' }}>
                    <div style={{ width: `${minAlcance / m.alcancePct * 100}%`, height: '100%', background: colores.advertencia, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Competencia */}
        <Panel title={`Análisis de competencia · ${ULTIMO}`} icon={<Swords size={17} color={V} />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: CLIENTE.color, padding: '5px 12px', borderRadius: 999 }}>{CLIENTE.nombre} · {D.plazasLideradas}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: MARCA_COLOR[segundaId] || colores.textoOscuro, padding: '5px 12px', borderRadius: 999 }}>{D.segundaMarca} · {D.lideradasSegunda}</span>
          </div>
          <div style={{ height: 14, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${D.plazasLideradas / D.totalPlazas * 100}%`, background: CLIENTE.color }} title={`${CLIENTE.nombre} ${D.plazasLideradas}`} />
            <div style={{ width: `${D.lideradasSegunda / D.totalPlazas * 100}%`, background: MARCA_COLOR[segundaId] || colores.textoOscuro }} title={`${D.segundaMarca} ${D.lideradasSegunda}`} />
          </div>
          <p style={{ fontSize: 13, color: colores.textoMedio, lineHeight: 1.5, margin: '14px 0 0' }}>
            En {ULTIMO}, {CLIENTE.nombre} lidera el Share of Voice en {D.plazasLideradas} plazas de {D.totalPlazas}. La segunda marca es {D.segundaMarca} con {D.lideradasSegunda}. Diferencia: {dif} plazas.
          </p>
          <div style={{ ...grid('repeat(4, 1fr)'), marginTop: 16 }}>
            {[
              { n: fmt(D.totalPlazas), l: 'Plazas en disputa' },
              { n: fmt(D.plazasLideradas), l: `Lideradas ${CLIENTE.nombre}` },
              { n: fmt(D.lideradasSegunda), l: `Lideradas ${D.segundaMarca}` },
              { n: fmt(dif), l: 'Diferencia' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', background: colores.fondoSecundario, border: `1px solid ${colores.borde}`, borderRadius: 12, padding: '14px 8px' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: colores.textoClaro }}>{s.n}</div>
                <div style={{ fontSize: 11.5, color: colores.textoOscuro, marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};
