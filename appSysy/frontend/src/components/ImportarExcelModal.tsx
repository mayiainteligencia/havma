import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, XCircle, PencilLine } from 'lucide-react';
import { brandingConfig } from '../config/branding';
import { importarExcel, type ResultadoImportacion } from '../data/importarExcel';
import { importarEjercicio, mock } from '../data/store';
import { useToast } from './shared/toast';

interface Props { onClose: () => void; onNavigate: (target: string) => void }

const NIVEL_ICONO: Record<string, React.ReactNode> = {
  ok: <CheckCircle2 size={15} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />,
  warning: <AlertTriangle size={15} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />,
  error: <XCircle size={15} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />,
};
const ORDEN_NIVEL = { error: 0, warning: 1, ok: 2 };

export const ImportarExcelModal: React.FC<Props> = ({ onClose, onNavigate }) => {
  const { colores } = brandingConfig;
  const [arrastrando, setArrastrando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  const procesar = async (file: File) => {
    setCargando(true);
    setResultado(null);
    try {
      const r = await importarExcel(file, mock.flow.medios);
      setResultado(r);
    } finally {
      setCargando(false);
    }
  };

  const validaciones = [...(resultado?.validaciones ?? [])].sort((a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]);
  const conteos = { error: 0, warning: 0, ok: 0 };
  validaciones.forEach(v => conteos[v.nivel]++);
  const hayErrores = conteos.error > 0;

  const confirmar = () => {
    if (!resultado?.ejercicio) return;
    importarEjercicio(resultado.ejercicio);
    push({ kind: 'success', title: 'Ejercicio importado', msg: `${resultado.ejercicio.fuente_archivo} ya es el ejercicio activo — te llevamos a Mix de medios para que lo revises.` });
    onNavigate('planeacion:mix-medios');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div
        style={{
          background: colores.fondoPrincipal, borderRadius: 20, width: 'min(560px, 100%)',
          maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${colores.borde}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colores.textoClaro }}>Cargar Excel</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color={colores.textoMedio} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: colores.textoMedio, lineHeight: 1.5 }}>
            Smart Planner (hojas Exercise + Media Mix table) o Spectrum (una hoja con "Application: Havas Spectrum").
            Los Flows no se reconocen aquí — se cargan con <code>prep_data.py</code>.
          </p>

          <div
            onDragOver={e => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={e => {
              e.preventDefault();
              setArrastrando(false);
              const f = e.dataTransfer.files[0];
              if (f) procesar(f);
            }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${arrastrando ? colores.primario : colores.borde}`,
              borderRadius: 16, padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
              background: arrastrando ? `${colores.primario}0A` : colores.fondoSecundario,
              transition: 'border-color .15s, background .15s',
            }}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xlsm" hidden
                   onChange={e => { const f = e.target.files?.[0]; if (f) procesar(f); }} />
            {cargando ? (
              <Loader2 size={28} color={colores.primario} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload size={28} color={colores.textoOscuro} />
            )}
            <p style={{ margin: '10px 0 0', fontSize: 13.5, fontWeight: 600, color: colores.textoClaro }}>
              {cargando ? 'Procesando…' : 'Arrastra el archivo aquí o haz clic para elegirlo'}
            </p>
          </div>

          {resultado?.error && (
            <div style={{ display: 'flex', gap: 8, padding: 12, borderRadius: 12, background: `${colores.peligro}0F`, border: `1px solid ${colores.peligro}40` }}>
              <XCircle size={16} color={colores.peligro} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: colores.textoClaro }}>{resultado.error}</span>
            </div>
          )}

          {resultado?.ejercicio && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: colores.textoClaro }}>
                <FileSpreadsheet size={16} color={colores.primario} />
                {resultado.ejercicio.fuente_archivo}
                <span style={{ fontSize: 11, fontWeight: 600, color: colores.textoOscuro }}>
                  · {resultado.ejercicio.herramienta}{resultado.ejercicio.subtipo ? ` (${resultado.ejercicio.subtipo})` : ''}
                </span>
              </div>

              {/* Semáforo resumen — de un vistazo, antes de leer el detalle */}
              <div style={{ display: 'flex', gap: 10 }}>
                {(['error', 'warning', 'ok'] as const).filter(n => conteos[n] > 0).map(n => (
                  <span key={n} style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 999,
                    color: n === 'error' ? colores.peligro : n === 'warning' ? '#B45309' : colores.exito,
                    background: n === 'error' ? `${colores.peligro}14` : n === 'warning' ? '#FEF3C7' : `${colores.exito}14`,
                  }}>
                    {NIVEL_ICONO[n]} {conteos[n]}
                  </span>
                ))}
              </div>

              {conteos.warning > 0 && !hayErrores && (
                <div style={{ display: 'flex', gap: 8, padding: 12, borderRadius: 12, background: '#FEF3C7', border: '1px solid #F59E0B' }}>
                  <AlertTriangle size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12.5, color: '#78350F' }}>
                    Puedes seguir, pero primero échale un ojo a las {conteos.warning} advertencia(s) de abajo — no bloquean la importación, pero conviene revisarlas.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {validaciones.map((v, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: colores.textoMedio,
                    padding: '8px 10px', borderRadius: 9,
                    background: v.nivel === 'ok' ? 'transparent' : v.nivel === 'error' ? `${colores.peligro}0A` : '#FFFBEB',
                  }}>
                    {NIVEL_ICONO[v.nivel]}
                    <span>{v.mensaje}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={confirmar} disabled={hayErrores}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 13.5, fontWeight: 700,
                    cursor: hayErrores ? 'not-allowed' : 'pointer', background: hayErrores ? colores.borde : colores.primario,
                    color: hayErrores ? colores.textoOscuro : '#fff',
                  }}>
                  <PencilLine size={15} />
                  {hayErrores ? 'Corrige los errores antes de confirmar' : 'Confirmar — lo podrás seguir editando después'}
                </button>
              </div>
            </>
          )}
        </div>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    </div>
  );
};
