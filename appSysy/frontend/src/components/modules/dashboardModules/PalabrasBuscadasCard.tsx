import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { brandingConfig } from '../../../config/branding';

const { colores } = brandingConfig;

interface KeywordStat {
  keyword: string;
  count: number;
}

export const PalabrasBuscadasCard: React.FC = () => {
  const [keywords, setKeywords] = useState<KeywordStat[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/monitor/testigos')
      .then(r => r.json())
      .then(data => {
        const mapa: Record<string, number> = {};
        (data.testigos || []).forEach((t: any) => {
          const kw = t.keyword_detectada ?? t.keyword ?? 'desconocida';
          mapa[kw] = (mapa[kw] || 0) + 1;
        });
        const sorted = Object.entries(mapa)
          .map(([keyword, count]) => ({ keyword, count }))
          .sort((a, b) => b.count - a.count);
        setKeywords(sorted);
        setTotal(data.total || 0);
      })
      .catch(() => {});
  }, []);

  const max = keywords[0]?.count || 1;

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
          <Search size={20} color={colores.textoClaro} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colores.textoClaro, margin: 0 }}>
            Palabras Buscadas
          </h3>
          <p style={{ fontSize: 12, color: colores.textoOscuro, margin: '2px 0 0' }}>
            {total} detecciones totales
          </p>
        </div>
      </div>

      {keywords.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '32px 0', color: colores.textoOscuro, fontSize: 13 }}>
          <Search size={16} /> Sin detecciones aún
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {keywords.slice(0, 6).map((kw, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colores.textoClaro }}>
                  {kw.keyword}
                </span>
                <span style={{ fontSize: 12, color: colores.textoOscuro }}>
                  {kw.count} veces
                </span>
              </div>
              <div style={{ height: 6, background: colores.fondoSecundario, borderRadius: 999 }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: colores.textoClaro,
                  width: `${(kw.count / max) * 100}%`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};