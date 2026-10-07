// "Cambios de esta sesión" — cada edición queda aquí con quién y cuándo.
import React from 'react';
import { History } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import type { BitacoraEntry } from '../../data/types';
import { Panel } from '../shared/ui';

export const BitacoraPanel: React.FC<{ entradas: BitacoraEntry[]; titulo?: string }> = ({ entradas, titulo = 'Cambios de esta sesión' }) => {
  const { colores } = brandingConfig;
  return (
    <Panel title={titulo} icon={<History size={16} color={colores.primario} />}>
      {entradas.length === 0 ? (
        <p style={{ fontSize: 13, color: colores.textoOscuro, margin: 0 }}>Todavía no hay cambios registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {entradas.map(e => (
            <div key={e.id} style={{ fontSize: 12.5, color: colores.textoMedio, paddingBottom: 8, borderBottom: `1px solid ${colores.borde}` }}>
              {e.mensaje}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};
