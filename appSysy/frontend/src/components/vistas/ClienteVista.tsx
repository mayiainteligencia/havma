import React, { useState } from 'react';
import { brandingConfig } from '../../config/branding';
import { fmtMXNCorto } from '../../data/media';
import { mock, getEjercicio, listaVersiones, setEstadoVersion, useOverrides } from '../../data/store';
import { interpolarEscenario, touchpointQueMasPierdeAlcance } from '../../data/interpolate';
import { Panel, Kpi, OrigenTag, Semaforo, wrap, inner, useIsMobile } from '../shared/ui';
import { VistaHeader, Tabla, DonaChart } from './_shared';
import { InsightsCard } from './InsightsCard';
import { useToast } from '../shared/toast';
import { useConfirm } from '../shared/confirm';

interface Props { subId: string; onNavigate: (target: string) => void }

export const ClienteVista: React.FC<Props> = ({ subId }) => {
  const { colores } = brandingConfig;
  const isMobile = useIsMobile();
  const overrides = useOverrides();
  const { push } = useToast();
  const confirmar = useConfirm();
  const [marcaId, setMarcaId] = useState(mock.marcas[0].id);
  const marca = mock.marcas.find(m => m.id === marcaId)!;
  const ejercicioId = marca.ejercicio_id ?? marca.basado_en_ejercicio_id!;
  const ejercicio = getEjercicio(overrides, ejercicioId);
  const factor = marca.factor_vs_base ?? 1;
  const presupuestoSim = mock.simulado.presupuesto.find(p => p.marca_id === marca.id);
  const versionesMarca = listaVersiones(overrides).filter(v => v.ejercicio_base_id === ejercicioId);

  const resolver = async (id: string, aprobar: boolean) => {
    const v = versionesMarca.find(x => x.id === id)!;
    if (await confirmar({ titulo: aprobar ? 'Aprobar versión' : 'Rechazar versión', descripcion: `${v.etiqueta} — ${v.motivo}` })) {
      setEstadoVersion(id, aprobar ? 'aprobada' : 'rechazada');
      push({ kind: 'success', title: aprobar ? 'Versión aprobada' : 'Versión rechazada', msg: v.etiqueta });
    }
  };

  return (
    <div style={wrap(isMobile)}>
      <div style={inner}>
        <VistaHeader vistaId="cliente" subId={subId} />
        <InsightsCard rol="cliente" marcaId={marca.id} />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {mock.marcas.map(m => (
            <button key={m.id} onClick={() => setMarcaId(m.id)}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${m.id === marcaId ? colores.primario : colores.borde}`,
                background: m.id === marcaId ? colores.primario : 'transparent',
                color: m.id === marcaId ? '#fff' : colores.textoMedio,
              }}>
              {m.nombre}
            </button>
          ))}
        </div>

        {subId === 'mis-campanas' && (
          <Panel title={`Campaña — ${ejercicio.exercise.campana ?? ejercicio.exercise.marca ?? marca.nombre}`}
                 right={<OrigenTag origen={marca.origen} />}>
            <DonaChart datos={ejercicio.touchpoints.filter(t => t.inversion).map(t => ({ nombre: t.nombre, valor: (t.inversion ?? 0) * factor }))} formatear={fmtMXNCorto} />
            <Tabla
              keyOf={t => t.nombre}
              columnas={[
                { header: 'Touchpoint', render: t => <span style={{ fontWeight: 600 }}>{t.nombre}</span> },
                { header: 'Inversión', align: 'right', render: t => fmtMXNCorto((t.inversion ?? 0) * factor) },
                { header: 'GRPs', align: 'right', render: t => t.grps != null ? (t.grps * factor).toFixed(1) : '—' },
                { header: 'Alcance', align: 'right', render: t => t.alcance != null ? `${(t.alcance * 100).toFixed(1)}%` : '—' },
              ]}
              filas={ejercicio.touchpoints}
            />
          </Panel>
        )}

        {subId === 'presupuesto' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            <Kpi label="Autorizado" value={fmtMXNCorto(marca.presupuesto)} sub={marca.origen} />
            <Kpi label="Comprometido" value={fmtMXNCorto(presupuestoSim?.comprometido ?? 0)} sub="simulado" />
            <Kpi label="Ejecutado" value={fmtMXNCorto(presupuestoSim?.ejecutado ?? 0)} sub="simulado" />
          </div>
        )}

        {subId === 'calendario' && (
          <Panel title="Calendario de la campaña" right={<OrigenTag origen="real" />}>
            <p style={{ fontSize: 13, color: colores.textoMedio, margin: '0 0 12px' }}>
              {mock.flow.calendario.length} semanas · de {mock.flow.calendario[0].fecha} a {mock.flow.calendario.at(-1)!.fecha}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {mock.flow.calendario.map(s => (
                <div key={s.semana} title={`Semana ${s.semana} · ${s.fecha}`} style={{
                  width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, background: colores.fondoTerciario, color: colores.textoMedio,
                }}>{s.semana}</div>
              ))}
            </div>
          </Panel>
        )}

        {subId === 'aprobaciones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {versionesMarca.filter(v => v.estado === 'pendiente').map(v => {
              const base = interpolarEscenario(ejercicio.escenarios, 1);
              const propuesta = interpolarEscenario(ejercicio.escenarios, v.factor_presupuesto);
              const peor = base && propuesta ? touchpointQueMasPierdeAlcance(base, propuesta) : null;
              const deltaAlcance = base && propuesta ? (propuesta.totales.alcance - base.totales.alcance) * 100 : null;
              const recorte = v.factor_presupuesto < 1;
              return (
                <Panel key={v.id} title={v.etiqueta}>
                  <p style={{ margin: '0 0 10px', fontSize: 13.5, color: colores.textoMedio }}>
                    <strong style={{ color: colores.textoClaro }}>Versión aprobada</strong> vs. <strong style={{ color: colores.textoClaro }}>propuesta</strong>: {v.motivo} —
                    cambia la inversión en {(v.delta_inversion ?? 0) >= 0 ? '+' : ''}{fmtMXNCorto(v.delta_inversion ?? 0)} ({v.factor_presupuesto}x).
                  </p>
                  {deltaAlcance !== null && (
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: colores.textoMedio, padding: 10, borderRadius: 10, background: colores.fondoSecundario }}>
                      {recorte
                        ? <>Si recortas al {(v.factor_presupuesto * 100).toFixed(0)}% del presupuesto, pierdes ~{Math.abs(deltaAlcance).toFixed(1)} pts de alcance.
                            {peor && <> El recorte menos dañino sería en <strong>{peor.touchpoint}</strong>.</>}</>
                        : <>Con este aumento ganas ~{deltaAlcance.toFixed(1)} pts de alcance adicional.</>}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => resolver(v.id, true)} style={{ border: 'none', background: colores.exito, color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>Aprobar</button>
                    <button onClick={() => resolver(v.id, false)} style={{ border: `1px solid ${colores.peligro}`, background: 'transparent', color: colores.peligro, fontSize: 11.5, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>Rechazar</button>
                  </div>
                </Panel>
              );
            })}
            {versionesMarca.filter(v => v.estado === 'pendiente').length === 0 && (
              <Panel title="Aprobaciones pendientes de tu campaña"><p style={{ fontSize: 13, color: colores.textoMedio, margin: 0 }}>No hay propuestas nuevas por revisar.</p></Panel>
            )}
          </div>
        )}

        {subId === 'historial' && (
          <Panel title="Historial de versiones">
            <Tabla
              keyOf={v => v.id}
              columnas={[
                { header: 'Etiqueta', render: v => <span style={{ fontWeight: 600 }}>{v.etiqueta}</span> },
                { header: 'Fecha', render: v => v.fecha },
                { header: 'Estado', render: v => (
                  <Semaforo ok={v.estado === 'aprobada'} textoOk="aprobada"
                    textoError={v.estado === 'rechazada' ? 'rechazada' : 'pendiente'} />
                ) },
                { header: 'Origen', render: v => <OrigenTag origen={v.origen} /> },
              ]}
              filas={versionesMarca}
            />
          </Panel>
        )}
      </div>
    </div>
  );
};
