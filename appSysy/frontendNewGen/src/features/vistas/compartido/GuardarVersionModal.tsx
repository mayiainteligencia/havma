import { useState } from 'react';
import { Boton, Modal, useToast } from '../../../ui/widgets';

/** Modal genérico de "Guardar como versión" — lo usan Planeación y Flowchart. */
export function GuardarVersionModal({ onCerrar, onGuardar }: { onCerrar: () => void; onGuardar: (etiqueta: string, motivo: string) => void }) {
  const [etiqueta, setEtiqueta] = useState('');
  const [motivo, setMotivo] = useState('');
  const toast = useToast();
  const valido = etiqueta.trim() && motivo.trim();
  const guardar = () => {
    if (!valido) return;
    onGuardar(etiqueta.trim(), motivo.trim());
    toast({ titulo: 'Versión guardada', msg: `${etiqueta} quedó pendiente de revisión.` });
    onCerrar();
  };
  return (
    <Modal titulo="Guardar como versión" onCerrar={onCerrar}>
      <label className="fld">Etiqueta<input value={etiqueta} onChange={e => setEtiqueta(e.target.value)} placeholder="Cambio A · +15% presupuesto" autoFocus /></label>
      <label className="fld">Motivo<textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="¿Por qué se hizo este cambio?" /></label>
      <Boton onClick={guardar} disabled={!valido}>Guardar versión pendiente</Boton>
    </Modal>
  );
}
