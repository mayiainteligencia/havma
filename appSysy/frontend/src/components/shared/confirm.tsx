import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { brandingConfig } from '../../config/branding';

const { colores } = brandingConfig;
const V = colores.primario;

export type ConfirmOpts = { titulo: string; descripcion: string; confirmLabel?: string };
type Ctx = { confirmar: (o: ConfirmOpts) => Promise<boolean> };
const ConfirmCtx = createContext<Ctx>({ confirmar: async () => false });
export const useConfirm = () => useContext(ConfirmCtx).confirmar;

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<(v: boolean) => void>(() => {});

  const confirmar = useCallback((o: ConfirmOpts) => new Promise<boolean>(res => {
    resolver.current = res;
    setOpts(o);
  }), []);

  const cerrar = useCallback((v: boolean) => { resolver.current(v); setOpts(null); }, []);

  useEffect(() => {
    if (!opts) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [opts, cerrar]);

  return (
    <ConfirmCtx.Provider value={{ confirmar }}>
      {children}
      {opts && (
        <div role="dialog" aria-modal="true" aria-label={opts.titulo}
          onClick={e => { if (e.target === e.currentTarget) cerrar(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'cfFade .18s ease' }}>
          <style>{`@keyframes cfFade{from{opacity:0}to{opacity:1}}@keyframes cfPop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}`}</style>
          <div style={{ width: 'min(440px, 100%)', background: colores.fondoClaro, borderRadius: 18, boxShadow: colores.sombraGrande, overflow: 'hidden', animation: 'cfPop .22s cubic-bezier(.16,1,.3,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 20px', borderBottom: `1px solid ${colores.borde}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${V}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={19} color={V} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: colores.textoClaro }}>¿Estás seguro de activar este plan?</div>
              </div>
              <button onClick={() => cerrar(false)} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: colores.textoOscuro, padding: 2 }}><X size={18} /></button>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colores.textoClaro, marginBottom: 6 }}>{opts.titulo}</div>
              <p style={{ fontSize: 13.5, color: colores.textoMedio, lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: colores.textoClaro }}>Este plan hará: </strong>{opts.descripcion}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 20px 20px' }}>
              <button onClick={() => cerrar(false)} style={{ border: `1px solid ${colores.borde}`, background: 'transparent', color: colores.textoMedio, fontSize: 13.5, fontWeight: 600, padding: '10px 18px', borderRadius: 11, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => cerrar(true)} style={{ border: 'none', background: V, color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 18px', borderRadius: 11, cursor: 'pointer' }}>{opts.confirmLabel || 'Sí, activar plan'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
};
