import React, { useState } from 'react';
import { X } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import { useToast } from '../shared/toast';

interface Props {
  onClose: () => void;
  onGuardar: (etiqueta: string, motivo: string) => void;
}

/** Modal genérico de "Guardar como versión" — lo usan Mesa de Planeación y Flowchart. */
export const GuardarVersionModal: React.FC<Props> = ({ onClose, onGuardar }) => {
  const { colores } = brandingConfig;
  const [etiqueta, setEtiqueta] = useState('');
  const [motivo, setMotivo] = useState('');
  const { push } = useToast();

  const guardar = () => {
    if (!etiqueta.trim() || !motivo.trim()) return;
    onGuardar(etiqueta.trim(), motivo.trim());
    push({ kind: 'success', title: 'Versión guardada', msg: `${etiqueta} quedó pendiente de revisión.` });
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${colores.borde}`,
    fontSize: 13.5, color: colores.textoClaro, background: colores.fondoPrincipal, outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
         onClick={onClose}>
      <div style={{ background: colores.fondoPrincipal, borderRadius: 18, width: 'min(420px, 100%)', boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}
           onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${colores.borde}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: colores.textoClaro }}>Guardar como versión</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={colores.textoMedio} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio }}>
            Etiqueta
            <input style={{ ...inputStyle, marginTop: 5 }} value={etiqueta} onChange={e => setEtiqueta(e.target.value)}
                   placeholder="Cambio A · +15% presupuesto" autoFocus />
          </label>
          <label style={{ fontSize: 12, fontWeight: 700, color: colores.textoMedio }}>
            Motivo
            <textarea style={{ ...inputStyle, marginTop: 5, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }}
                      value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="¿Por qué se hizo este cambio?" />
          </label>
          <button onClick={guardar} disabled={!etiqueta.trim() || !motivo.trim()}
            style={{
              border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 13.5, fontWeight: 700, marginTop: 4,
              cursor: etiqueta.trim() && motivo.trim() ? 'pointer' : 'not-allowed',
              background: etiqueta.trim() && motivo.trim() ? colores.primario : colores.borde,
              color: etiqueta.trim() && motivo.trim() ? '#fff' : colores.textoOscuro,
            }}>
            Guardar versión pendiente
          </button>
        </div>
      </div>
    </div>
  );
};
