import React from 'react';
import { Briefcase, Check } from 'lucide-react';
import { brandingConfig } from '../../../config/branding';
import { CARTERA, fmtMXNCorto, porPeriodo, ULTIMO } from '../../../data/media';

const { colores } = brandingConfig;
const V = colores.primario;
const D = porPeriodo[ULTIMO];

// La inversión de cada cuenta sale de su share sobre el total gestionado.
const TOTAL_GESTIONADO = Math.round(D.inversionCliente / (CARTERA[0].sharePresupuesto / 100));
const MAX_SHARE = Math.max(...CARTERA.map(c => c.sharePresupuesto));

export const CarteraClientes: React.FC = () => (
  <div style={{
    background: colores.fondoClaro, borderRadius: 20, padding: 24,
    border: `1px solid ${colores.borde}`, boxShadow: colores.sombra,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${V}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Briefcase size={20} color={V} />
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: colores.textoClaro, margin: 0 }}>Cartera de clientes</h3>
        <p style={{ fontSize: 12, color: colores.textoOscuro, margin: '2px 0 0' }}>
          {CARTERA.length} cuentas · {fmtMXNCorto(TOTAL_GESTIONADO)} de inversión gestionada
        </p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: colores.textoOscuro, background: colores.fondoTerciario, padding: '4px 10px', borderRadius: 999 }}>
        cifras demo
      </span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
      {CARTERA.map(c => {
        const inversion = Math.round(TOTAL_GESTIONADO * c.sharePresupuesto / 100);
        return (
          <div key={c.nombre} style={{
            background: colores.fondoSecundario, borderRadius: 14, padding: '13px 15px',
            border: `1px solid ${c.activa ? V : colores.borde}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: colores.textoClaro, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.nombre}
              </span>
              {c.activa && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: V, background: `${V}18`, padding: '2px 7px', borderRadius: 999, flexShrink: 0 }}>
                  <Check size={10} /> En pantalla
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: colores.textoOscuro, marginBottom: 9 }}>{c.categoria}</div>
            <div style={{ height: 7, borderRadius: 999, background: colores.fondoTerciario, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ width: `${c.sharePresupuesto / MAX_SHARE * 100}%`, height: '100%', borderRadius: 999, background: c.activa ? V : colores.textoOscuro }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: colores.textoOscuro, fontVariantNumeric: 'tabular-nums' }}>
              <span>{fmtMXNCorto(inversion)}</span>
              <span>{c.sharePresupuesto}%</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
