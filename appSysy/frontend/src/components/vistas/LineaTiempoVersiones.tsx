// Línea de tiempo de versiones — avatar/iniciales, hora y delta (verde sube,
// gris baja). Es lo que "vende" la trazabilidad: quién cambió qué y cuándo.
import React from 'react';
import { brandingConfig } from '../../config/branding';
import { fmtMXNCorto } from '../../data/media';
import type { Version } from '../../data/types';
import { INICIALES_POR_ROL } from '../../data/types';
import { Semaforo } from '../shared/ui';

const inicialesDe = (autor: string, rol?: Version['rol']) => {
  if (rol) return INICIALES_POR_ROL[rol];
  const partes = autor.split(' ').filter(Boolean);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'NA';
};

export const LineaTiempoVersiones: React.FC<{ versiones: Version[] }> = ({ versiones }) => {
  const { colores } = brandingConfig;
  const ordenadas = [...versiones].sort((a, b) => (b.fecha + (b.hora ?? '')).localeCompare(a.fecha + (a.hora ?? '')));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {ordenadas.map((v, i) => {
        const delta = v.delta_inversion ?? 0;
        return (
          <div key={v.id} style={{ display: 'flex', gap: 12, paddingBottom: i < ordenadas.length - 1 ? 16 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: colores.secundario, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
              }}>
                {inicialesDe(v.autor, v.rol)}
              </div>
              {i < ordenadas.length - 1 && <div style={{ width: 2, flex: 1, background: colores.borde, marginTop: 4 }} />}
            </div>
            <div style={{ paddingBottom: 4, minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: colores.textoClaro }}>{v.autor}</span>
                <span style={{ fontSize: 11.5, color: colores.textoOscuro }}>{v.fecha}{v.hora ? ` · ${v.hora}` : ''}</span>
                <Semaforo ok={v.estado === 'aprobada'} textoOk="aprobada" textoError={v.estado === 'rechazada' ? 'rechazada' : 'pendiente'} />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: colores.textoMedio }}>
                <strong>{v.etiqueta}</strong> — {v.motivo}
              </p>
              {v.delta_inversion !== undefined && (
                <span style={{ fontSize: 12.5, fontWeight: 700, color: delta >= 0 ? colores.exito : colores.textoOscuro }}>
                  {delta >= 0 ? '▲ +' : '▼ '}{fmtMXNCorto(Math.abs(delta))}
                </span>
              )}
              {v.comentarioResolucion && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: colores.textoOscuro, fontStyle: 'italic' }}>
                  "{v.comentarioResolucion}"
                </p>
              )}
            </div>
          </div>
        );
      })}
      {ordenadas.length === 0 && <p style={{ fontSize: 13, color: colores.textoOscuro }}>Sin versiones todavía.</p>}
    </div>
  );
};
