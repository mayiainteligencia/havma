import React, { useState } from 'react';
import { Palette, Wand2, Layers, FlaskConical, Check, Play } from 'lucide-react';
import { Panel, Kpi, keyframes, wrap, inner, useIsMobile } from '../shared/ui';
import { useToast } from '../shared/toast';
import { brandingConfig } from '../../config/branding';
import { CLIENTE } from '../../data/media';

const { colores } = brandingConfig;
const V = colores.primario;

const FORMATOS = [
  { id: 'radio20', nombre: 'Radio 20s', ratio: '—', nota: 'Guion + locución sintética' },
  { id: 'video15', nombre: 'Video 15s', ratio: '9:16', nota: 'Vertical para social' },
  { id: 'video30', nombre: 'Video 30s', ratio: '16:9', nota: 'In-stream y TV conectada' },
  { id: 'display', nombre: 'Display', ratio: '300x250', nota: 'Banner estándar' },
  { id: 'social', nombre: 'Social', ratio: '1:1', nota: 'Feed y carrusel' },
  { id: 'ooh', nombre: 'OOH', ratio: '3:1', nota: 'Espectacular y mobiliario' },
];

const VARIANTES = [
  { id: 'A', titulo: 'Beneficio funcional', copy: 'Meses sin intereses en toda la tienda.', ctr: 2.9, conv: 1.4, ganadora: false },
  { id: 'B', titulo: 'Beneficio emocional', copy: 'La temporada que estabas esperando.', ctr: 3.7, conv: 2.1, ganadora: true },
  { id: 'C', titulo: 'Prueba social', copy: 'Las marcas que ya están en tu lista.', ctr: 3.1, conv: 1.8, ganadora: false },
  { id: 'D', titulo: 'Urgencia', copy: 'Solo durante la Venta Nocturna.', ctr: 2.4, conv: 1.6, ganadora: false },
];

export const StudioCreativo: React.FC = () => {
  const isMobile = useIsMobile();
  const { push } = useToast();
  const [formatos, setFormatos] = useState<string[]>(['radio20', 'video15', 'social']);
  const [brief, setBrief] = useState(`Campaña de temporada para ${CLIENTE.nombre}: destacar la Venta Nocturna y los meses sin intereses.`);
  const [generando, setGenerando] = useState(false);

  const grid = (cols: string): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : cols, gap: 16 });

  const toggle = (id: string) =>
    setFormatos(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const generar = () => {
    if (formatos.length === 0) {
      push({ kind: 'info', title: 'Elige un formato', msg: 'Selecciona al menos un formato para generar variantes.' });
      return;
    }
    setGenerando(true);
    setTimeout(() => {
      setGenerando(false);
      push({ kind: 'success', title: 'Variantes generadas', msg: `${formatos.length * 4} piezas listas para revisión en ${formatos.length} formatos.` });
    }, 900);
  };

  return (
    <div style={wrap(isMobile)}>
      <style>{keyframes}</style>
      <div style={inner}>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colores.textoClaro, margin: '0 0 6px' }}>
            Studio Creativo
          </h2>
          <p style={{ color: colores.textoMedio, fontSize: isMobile ? 14 : 16, margin: 0 }}>
            Sandbox de generación de piezas: del brief a las variantes por formato y su prueba A/B.
          </p>
        </div>

        <div style={{ ...grid('repeat(4, 1fr)'), marginBottom: 22 }}>
          <Kpi label="Piezas generadas" value="486" delta="+31%" up />
          <Kpi label="Formatos activos" value={String(FORMATOS.length)} sub="por campaña" />
          <Kpi label="Aprobación 1er pase" value="72%" delta="+6 pts" up />
          <Kpi label="Tiempo por variante" value="2.4 min" sub="vs 3.5 h manual" up />
        </div>

        <div style={{ ...grid('1fr 1.2fr'), marginBottom: 22 }}>
          <Panel title="Brief y formatos" icon={<Wand2 size={17} color={V} />}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colores.textoOscuro, display: 'block', marginBottom: 7 }}>
              Brief de la pieza
            </label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={4}
              style={{
                width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
                color: colores.textoClaro, background: colores.fondoSecundario,
                border: `1px solid ${colores.borde}`, borderRadius: 12, padding: '11px 13px', marginBottom: 16,
              }}
            />

            <div style={{ fontSize: 12, fontWeight: 600, color: colores.textoOscuro, marginBottom: 9 }}>Formatos de salida</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {FORMATOS.map(f => {
                const on = formatos.includes(f.id);
                return (
                  <button key={f.id} onClick={() => toggle(f.id)} title={f.nota}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                      padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, transition: 'all .2s',
                      border: `1.5px solid ${on ? V : colores.borde}`,
                      background: on ? V : colores.fondoSecundario,
                      color: on ? '#fff' : colores.textoOscuro,
                    }}>
                    {on && <Check size={13} />}
                    {f.nombre}
                  </button>
                );
              })}
            </div>

            <button onClick={generar} disabled={generando}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, cursor: generando ? 'default' : 'pointer',
                border: 'none', background: generando ? colores.textoOscuro : colores.textoClaro, color: '#fff',
                fontSize: 13.5, fontWeight: 700, padding: '11px 20px', borderRadius: 12,
              }}>
              <Palette size={16} /> {generando ? 'Generando…' : `Generar ${formatos.length * 4} variantes`}
            </button>
          </Panel>

          <Panel title="Variantes generadas" icon={<Layers size={17} color={V} />}
            right={<span style={{ fontSize: 12, color: colores.textoOscuro }}>{formatos.length} formatos · {VARIANTES.length} ejes</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              {VARIANTES.map(v => (
                <div key={v.id} style={{
                  background: colores.fondoSecundario, borderRadius: 14, padding: 14,
                  border: `1px solid ${v.ganadora ? V : colores.borde}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: 8, background: v.ganadora ? V : colores.fondoTerciario,
                      color: v.ganadora ? '#fff' : colores.textoMedio, fontSize: 12, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{v.id}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: colores.textoClaro, flex: 1 }}>{v.titulo}</span>
                    <button onClick={() => push({ kind: 'info', title: `Vista previa · variante ${v.id}`, msg: v.copy })}
                      style={{
                        width: 28, height: 28, borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                        background: colores.fondoClaro, border: `1px solid ${colores.borde}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><Play size={13} color={colores.textoMedio} /></button>
                  </div>
                  <p style={{ fontSize: 12.5, color: colores.textoMedio, fontStyle: 'italic', margin: '0 0 10px', lineHeight: 1.4 }}>“{v.copy}”</p>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: colores.textoOscuro }}>
                    <span>CTR <strong style={{ color: colores.textoClaro }}>{v.ctr}%</strong></span>
                    <span>Conv. <strong style={{ color: colores.textoClaro }}>{v.conv}%</strong></span>
                    {v.ganadora && <span style={{ color: colores.exito, fontWeight: 700 }}>Ganadora</span>}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Prueba A/B en curso" icon={<FlaskConical size={17} color={V} />}
          right={<span style={{ fontSize: 12, color: colores.textoOscuro }}>72% de significancia</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {VARIANTES.map(v => {
              const max = Math.max(...VARIANTES.map(x => x.ctr));
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: colores.textoMedio, width: isMobile ? 90 : 130, flexShrink: 0 }}>{v.titulo}</span>
                  <div style={{ flex: 1, height: 10, background: colores.fondoTerciario, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${v.ctr / max * 100}%`, height: '100%', borderRadius: 999, background: v.ganadora ? colores.exito : V }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: colores.textoClaro, width: 44, textAlign: 'right' }}>{v.ctr}%</span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11.5, color: colores.textoOscuro, margin: '14px 0 0', lineHeight: 1.4 }}>
            La variante B gana por 0.8 pts de CTR. Se necesitan ~2 días más de exposición para cerrar la prueba.
          </p>
        </Panel>
      </div>
    </div>
  );
};
