import React, { useState, useEffect } from 'react';
import { Radio, TrendingUp } from 'lucide-react';
import { brandingConfig } from '../../../config/branding';

const { colores } = brandingConfig;

interface RadioItem {
  emisora_nombre: string;
  emisora_url: string;
  total_detecciones: number;
  total_chunks: number;
}

export const RadiosEscuchadasCard: React.FC = () => {
  const [radios, setRadios] = useState<RadioItem[]>([]);

  useEffect(() => {
    fetch('/api/monitor/testigos')
      .then(r => r.json())
      .then(data => {
        const mapa: Record<string, RadioItem> = {};
        (data.testigos || []).forEach((t: any) => {
          if (!mapa[t.emisora_url]) {
            mapa[t.emisora_url] = {
              emisora_nombre: t.emisora_nombre,
              emisora_url: t.emisora_url,
              total_detecciones: 0,
              total_chunks: 0,
            };
          }
          mapa[t.emisora_url].total_detecciones += 1;
        });
        setRadios(Object.values(mapa));
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      background: colores.fondoClaro, borderRadius: '20px',
      padding: '24px', border: `1px solid ${colores.borde}`,
      boxShadow: colores.sombra, height: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: colores.fondoSecundario,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Radio size={20} color={colores.textoClaro} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colores.textoClaro, margin: 0 }}>
            Radios Escuchadas
          </h3>
          <p style={{ fontSize: 12, color: colores.textoOscuro, margin: '2px 0 0' }}>
            Emisoras monitoreadas
          </p>
        </div>
      </div>

      {radios.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '32px 0', color: colores.textoOscuro, fontSize: 13 }}>
          <Radio size={16} /> Sin registros aún
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {radios.map((r, i) => (
            <div key={i} style={{
              background: colores.fondoSecundario,
              borderRadius: 12, padding: '12px 14px',
              border: `1px solid ${colores.borde}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colores.textoClaro }}>
                  {r.emisora_nombre}
                </div>
                <div style={{ fontSize: 11, color: colores.textoOscuro, marginTop: 2 }}>
                  {r.emisora_url.length > 35 ? r.emisora_url.slice(0, 35) + '...' : r.emisora_url}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={12} color={colores.exito} />
                <span style={{ fontSize: 13, fontWeight: 700, color: colores.exito }}>
                  {r.total_detecciones}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};