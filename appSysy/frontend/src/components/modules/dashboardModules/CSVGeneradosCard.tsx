import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { brandingConfig } from '../../../config/branding';

const { colores } = brandingConfig;

export const CSVGeneradosCard: React.FC = () => {
  const [total, setTotal] = useState(0);
  const [ultimaFecha, setUltimaFecha] = useState<string | null>(null);
  const [testigos, setTestigos] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/monitor/testigos')
      .then(r => r.json())
      .then(data => {
        const t = data.testigos || [];
        setTestigos(t);
        setTotal(t.length);
        if (t.length > 0) setUltimaFecha(t[0].timestamp);
      })
      .catch(() => {});
  }, []);

  const exportarCSV = () => {
    if (!testigos.length) return;
    const BOM = '\uFEFF';
    const headers = 'ID,Emisora,Keyword,Transcripción,Timestamp\n';
    const rows = testigos.map((t, i) =>
      `${t.id ?? i + 1},"${t.emisora_nombre ?? ''}","${t.keyword_detectada ?? t.keyword ?? ''}","${(t.transcripcion ?? '').replace(/"/g, '""')}","${t.timestamp}"`
    ).join('\n');
    const blob = new Blob([BOM + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testigos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      background: colores.fondoClaro, borderRadius: '20px',
      padding: '24px', border: `1px solid ${colores.borde}`,
      boxShadow: colores.sombra, height: '100%',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: colores.fondoSecundario,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={20} color={colores.textoClaro} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colores.textoClaro, margin: 0 }}>
              Exportar Testigos
            </h3>
            <p style={{ fontSize: 12, color: colores.textoOscuro, margin: '2px 0 0' }}>
              Descarga el registro completo
            </p>
          </div>
        </div>

        <div style={{
          background: colores.fondoSecundario, borderRadius: 16,
          padding: '20px', textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: colores.textoClaro, lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: 13, color: colores.textoOscuro, marginTop: 6 }}>
            testigos registrados
          </div>
          {ultimaFecha && (
            <div style={{ fontSize: 11, color: colores.textoOscuro, marginTop: 8 }}>
              Último: {new Date(ultimaFecha).toLocaleString('es-MX')}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={exportarCSV}
        disabled={total === 0}
        style={{
          width: '100%', padding: '12px', borderRadius: 12,
          border: 'none', background: colores.textoClaro,
          color: colores.textoEnOscuro, fontSize: 14, fontWeight: 600,
          cursor: total === 0 ? 'not-allowed' : 'pointer',
          opacity: total === 0 ? 0.4 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'opacity 0.2s',
        }}
      >
        <Download size={16} />
        Descargar CSV
      </button>
    </div>
  );
};