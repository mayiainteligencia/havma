// Modal de "Instrucciones" del header: qué hace cada rol y qué trae cada
// sección suya. Contenido 100% derivado de config/menu.ts y data/types.ts —
// si se agrega una vista o subsección, aparece aquí solo.
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { brandingConfig } from '../config/branding';
import { vistas } from '../config/menu';
import { VISTAS_POR_ROL, NOMBRE_ROL, type Rol } from '../data/types';

const RESUMEN_ROL: Record<Rol, string> = {
  ceo: 'Vista de lectura: sigue el negocio completo, ve dónde está el riesgo y qué espera su firma. No edita nada directamente.',
  planner: 'El único rol que edita: arma el mix de medios, ajusta el Flowchart y sube cambios para que se aprueben.',
  cliente: 'Ve su propia marca: aprueba o rechaza propuestas, y puede pedirle cambios a su planner, pero no edita directo.',
};

export const InstruccionesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { colores } = brandingConfig;
  const [rolActivo, setRolActivo] = useState<Rol>('planner');
  const vistasDelRol = vistas.filter(v => VISTAS_POR_ROL[rolActivo].includes(v.id));

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Instrucciones de la plataforma"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,10,10,0.55)',
        backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        background: colores.fondoPrincipal, borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.35)',
      }}>
        {/* ── Encabezado con el gradiente de marca ── */}
        <div style={{ background: colores.gradientePrimario, padding: '22px 26px', color: '#fff', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: '50%',
                        background: `radial-gradient(circle, ${colores.primario}55, transparent 70%)` }} />
          <button onClick={onClose} aria-label="Cerrar" style={{
            position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.3)', color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={17} />
          </button>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: colores.primario }}>
            Instrucciones
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 300, margin: '8px 0 4px', position: 'relative' }}>Qué hace cada rol y cada sección</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', margin: 0, maxWidth: 560, position: 'relative' }}>
            Cambiar de rol en el header solo filtra el menú — no hay permisos reales detrás.
          </p>
        </div>

        {/* ── Pestañas de rol ── */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 26px 0', flexShrink: 0 }}>
          {(Object.keys(NOMBRE_ROL) as Rol[]).map(r => (
            <button key={r} onClick={() => setRolActivo(r)}
              style={{
                padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${r === rolActivo ? colores.primario : colores.borde}`,
                background: r === rolActivo ? colores.primario : 'transparent',
                color: r === rolActivo ? '#fff' : colores.textoMedio,
              }}>
              {NOMBRE_ROL[r]}
            </button>
          ))}
        </div>

        {/* ── Contenido scrollable ── */}
        <div style={{ overflowY: 'auto', padding: '18px 26px 26px' }}>
          <p style={{ fontSize: 14, color: colores.textoClaro, lineHeight: 1.6, margin: '0 0 18px', fontWeight: 600 }}>
            {RESUMEN_ROL[rolActivo]}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {vistasDelRol.map(v => {
              const Icon = v.icono;
              return (
                <div key={v.id} style={{ border: `1px solid ${colores.borde}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${colores.primario}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={colores.primario} />
                    </div>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: colores.textoClaro }}>{v.nombre}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: colores.textoMedio, margin: '0 0 10px', lineHeight: 1.5 }}>{v.descripcion}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {v.subsecciones.map(s => (
                      <div key={s.id} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.45 }}>
                        <span style={{ fontWeight: 700, color: colores.textoClaro, flexShrink: 0 }}>{s.nombre}:</span>
                        <span style={{ color: colores.textoOscuro }}>{s.descripcion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
