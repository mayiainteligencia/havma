// src/components/TestigosIA.tsx
import { useState, useEffect, useRef } from 'react';
import { brandingConfig } from '../config/branding';
import { Search, RotateCcw, Radio, ChevronDown, ChevronUp } from 'lucide-react';

const { colores } = brandingConfig;

// El REST del monitor va por el proxy de Vite (/api/monitor); el WebSocket no,
// así que la URL se toma del entorno y cae a localhost en desarrollo.
const WS_BASE = import.meta.env.VITE_MONITOR_WS_URL ?? 'ws://localhost:8001';

interface Sesion {
  sesion_id: string;
  emisora_nombre: string;
  emisora_url: string;
  keywords: string[];
  iniciada_en: string;
  total_chunks: number;
  total_detecciones: number;
}

interface Testigo {
  id?: number;
  sesion_id?: string;
  emisora_nombre?: string;
  emisora?: string;
  keyword_detectada?: string;
  keyword?: string;
  transcripcion?: string;
  timestamp: string;
}

const EMISORAS_PREDEFINIDAS = [
  {
    nombre: 'Radio Amor',
    frecuencia: '95.3 FM',
    url: 'https://16603.live.streamtheworld.com/XHSHFM_SC',
    imagen: '/assets/emisoras/amor.png',
  },
  {
    nombre: 'Los 40',
    frecuencia: '101.7 FM',
    url: 'https://26373.live.streamtheworld.com/LOS40_MEXICO_SC',
    imagen: '/assets/emisoras/los40.png',
  },
  {
    nombre: 'MVS Noticias',
    frecuencia: '102.5 FM',
    url: 'https://19313.live.streamtheworld.com/XHMVSFM_SC',
    imagen: '/assets/emisoras/mvs.png',
  },
  {
    nombre: 'La Mejor',
    frecuencia: '97.7 FM',
    url: 'https://19003.live.streamtheworld.com/XERCFM_SC',
    imagen: '/assets/emisoras/lamejor.png',
  },
  {
    nombre: 'Radio Disney',
    frecuencia: '92.1 FM',
    url: 'https://22203.live.streamtheworld.com/XHFOFMAAC_SC',
    imagen: '/assets/emisoras/disney.png',
  },
];

export const TestigosIA = () => {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [testigos, setTestigos] = useState<Testigo[]>([]);
  const [emisoraUrl, setEmisoraUrl] = useState('');
  const [emisoraNombre, setEmisoraNombre] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [filtroKeyword, setFiltroKeyword] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<'config' | 'testigos'>('testigos');
  const [formColapsado, setFormColapsado] = useState(false);
  const wsRefs = useRef<Record<string, WebSocket>>({});

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetchSesiones();
    fetchTestigos();
    const interval = setInterval(fetchSesiones, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    sesiones.forEach(s => {
      if (!wsRefs.current[s.sesion_id]) conectarWS(s.sesion_id);
    });
  }, [sesiones]);

  const fetchSesiones = async () => {
    try {
      const res = await fetch('/api/monitor/sessions');
      const data = await res.json();
      setSesiones(data.sesiones || []);
    } catch {}
  };

  const fetchTestigos = async () => {
    try {
      const res = await fetch('/api/monitor/testigos');
      const data = await res.json();
      setTestigos(data.testigos || []);
    } catch {}
  };

  const conectarWS = (sesionId: string) => {
    const ws = new WebSocket(`${WS_BASE}/ws/${sesionId}`);
    ws.onmessage = (e) => {
      const alerta: Testigo = JSON.parse(e.data);
      setTestigos(prev => [alerta, ...prev]);
    };
    ws.onclose = () => { delete wsRefs.current[sesionId]; };
    wsRefs.current[sesionId] = ws;
  };

  const iniciarMonitoreo = async () => {
    setError('');
    if (!emisoraUrl.trim()) return setError('Ingresa la URL de la emisora');
    if (!keywordsInput.trim()) return setError('Ingresa al menos una keyword');
    if (sesiones.length >= 3) return setError('Máximo 3 sesiones simultáneas');
    setCargando(true);
    try {
      const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);
      const res = await fetch('/api/monitor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emisora_url: emisoraUrl, emisora_nombre: emisoraNombre || 'Sin nombre', keywords })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Error al iniciar');
      setEmisoraUrl('');
      setEmisoraNombre('');
      setKeywordsInput('');
      await fetchSesiones();
      if (isMobile) setVistaActiva('testigos');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const detenerSesion = async (sesionId: string) => {
    try {
      await fetch(`/api/monitor/stop/${sesionId}`, { method: 'DELETE' });
      wsRefs.current[sesionId]?.close();
      delete wsRefs.current[sesionId];
      await fetchSesiones();
    } catch {}
  };

  const reiniciarVista = () => {
    setTestigos([]);
    setFiltroKeyword('');
  };

  const exportarCSV = () => {
    const datos = testigosFiltrados;
    if (!datos.length) return;
    const BOM = '\uFEFF';
    const headers = 'ID,Emisora,Keyword,Transcripción,Timestamp\n';
    const rows = datos.map((t, i) =>
      `${t.id ?? i + 1},"${t.emisora_nombre ?? t.emisora ?? ''}","${t.keyword_detectada ?? t.keyword ?? ''}","${(t.transcripcion ?? '').replace(/"/g, '""')}","${t.timestamp}"`
    ).join('\n');
    const blob = new Blob([BOM + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testigos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const keywordsUnicas = Array.from(new Set(
    testigos.map(t => t.keyword_detectada ?? t.keyword ?? '').filter(Boolean)
  ));

  const seleccionarEmisora = (emisora: typeof EMISORAS_PREDEFINIDAS[0]) => {
  setEmisoraUrl(emisora.url);
  setEmisoraNombre(`${emisora.nombre} ${emisora.frecuencia}`);
  setError('');
};

  const testigosFiltrados = filtroKeyword
    ? testigos.filter(t => (t.keyword_detectada ?? t.keyword) === filtroKeyword)
    : testigos;

  // ── Panel configuración (compartido desktop/mobile) ──────────────
  const panelConfig = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>


      {/* Emisoras predefinidas */}
  <div style={{
    background: colores.fondoClaro, borderRadius: 16,
    border: `1px solid ${colores.borde}`, boxShadow: colores.sombra,
    padding: '16px 20px',
  }}>
    <h2 style={{ fontSize: 15, fontWeight: 600, color: colores.textoClaro, margin: '0 0 14px' }}>
      Emisoras disponibles
    </h2>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 10,
    }}>
      {EMISORAS_PREDEFINIDAS.map(emisora => {
        const seleccionada = emisoraUrl === emisora.url;
        return (
          <button
            key={emisora.url}
            onClick={() => seleccionarEmisora(emisora)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8,
              padding: '12px 8px', borderRadius: 12,
              border: seleccionada
                ? `2px solid ${colores.textoClaro}`
                : `1px solid ${colores.borde}`,
              background: seleccionada ? colores.textoClaro : colores.fondoSecundario,
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!seleccionada) e.currentTarget.style.background = colores.fondoTerciario;
            }}
            onMouseLeave={e => {
              if (!seleccionada) e.currentTarget.style.background = colores.fondoSecundario;
            }}
          >
            {/* Indicador activo */}
            {seleccionada && (
              <div style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: colores.exito,
                boxShadow: `0 0 6px ${colores.exito}`,
              }} />
            )}

            {/* Logo emisora */}
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              overflow: 'hidden', flexShrink: 0,
              background: colores.fondoTerciario,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src={emisora.imagen}
                alt={emisora.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span style="font-size:11px;font-weight:700;color:${colores.textoOscuro}">${emisora.nombre.slice(0, 2).toUpperCase()}</span>`;
                  }
                }}
              />
            </div>

            {/* Nombre */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: seleccionada ? colores.textoEnOscuro : colores.textoClaro,
                lineHeight: 1.2,
              }}>
                {emisora.nombre}
              </div>
              <div style={{
                fontSize: 10,
                color: seleccionada ? 'rgba(255,255,255,0.7)' : colores.textoOscuro,
                marginTop: 2,
              }}>
                {emisora.frecuencia}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>

      {/* Formulario nueva sesión */}
      <div style={{
        background: colores.fondoClaro, borderRadius: 16,
        border: `1px solid ${colores.borde}`, boxShadow: colores.sombra,
        overflow: 'hidden'
      }}>
        {/* Header colapsable en mobile */}
        <div
          onClick={() => isMobile && setFormColapsado(v => !v)}
          style={{
            padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: isMobile ? 'pointer' : 'default',
            borderBottom: formColapsado ? 'none' : `1px solid ${colores.borde}`,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: colores.textoClaro, margin: 0 }}>
            Nueva sesión
          </h2>
          {isMobile && (
            formColapsado
              ? <ChevronDown size={18} color={colores.textoOscuro} />
              : <ChevronUp size={18} color={colores.textoOscuro} />
          )}
        </div>

        {!formColapsado && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>URL de la emisora</label>
              <input value={emisoraUrl} onChange={e => setEmisoraUrl(e.target.value)}
                placeholder="https://streaming.ejemplo.com/radio" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input value={emisoraNombre} onChange={e => setEmisoraNombre(e.target.value)}
                placeholder="Ej: Exa FM 104.9" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Keywords (separadas por coma)</label>
              <input value={keywordsInput} onChange={e => setKeywordsInput(e.target.value)}
                placeholder="Ej: Coca-Cola, Telcel, Oxxo" style={inputStyle} />
            </div>
            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626'
              }}>
                {error}
              </div>
            )}
            <button onClick={iniciarMonitoreo} disabled={cargando} style={{
              padding: '12px 0', borderRadius: 10, border: 'none',
              background: colores.textoClaro, color: colores.textoEnOscuro,
              fontWeight: 600, fontSize: 14, cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.6 : 1,
            }}>
              {cargando ? 'Iniciando...' : '▶ Iniciar monitoreo'}
            </button>
          </div>
        )}
      </div>

      {/* Sesiones activas */}
      <div style={{
        background: colores.fondoClaro, borderRadius: 16,
        padding: '16px 20px', border: `1px solid ${colores.borde}`, boxShadow: colores.sombra
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: colores.textoClaro, margin: 0 }}>
            Sesiones activas
          </h2>
          <span style={{
            background: sesiones.length > 0 ? '#DCFCE7' : colores.fondoSecundario,
            color: sesiones.length > 0 ? '#16A34A' : colores.textoOscuro,
            fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999
          }}>
            {sesiones.length}/3
          </span>
        </div>

        {sesiones.length === 0 ? (
          <p style={{ fontSize: 13, color: colores.textoOscuro, textAlign: 'center', padding: '16px 0', margin: 0 }}>
            No hay sesiones activas
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sesiones.map(s => (
              <div key={s.sesion_id} style={{
                background: colores.fondoSecundario, borderRadius: 10,
                padding: '12px 14px', border: `1px solid ${colores.borde}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981'
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: colores.textoClaro }}>
                        {s.emisora_nombre}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: colores.textoOscuro, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.emisora_url}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {s.keywords.map(kw => (
                        <span key={kw} style={{
                          background: colores.fondoTerciario, color: colores.textoMedio,
                          fontSize: 11, padding: '2px 8px', borderRadius: 999
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: colores.textoOscuro, marginTop: 6 }}>
                      {s.total_detecciones} detecciones · {s.total_chunks} chunks
                    </div>
                  </div>
                  <button onClick={() => detenerSesion(s.sesion_id)} style={{
                    marginLeft: 10, padding: '4px 10px', borderRadius: 6,
                    border: '1px solid #FECACA', background: '#FEF2F2',
                    color: '#DC2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0
                  }}>
                    Detener
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Panel testigos (compartido desktop/mobile) ────────────────────
  const panelTestigos = (
    <div style={{
      background: colores.fondoClaro, borderRadius: 16,
      padding: isMobile ? '16px' : '24px',
      border: `1px solid ${colores.borde}`,
      boxShadow: colores.sombra,
      minHeight: isMobile ? 'auto' : 600,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: colores.textoClaro, margin: 0 }}>
            Testigos detectados
          </h2>
          <span style={{ fontSize: 12, color: colores.textoOscuro }}>
            {testigosFiltrados.length} registros
          </span>
        </div>

        {/* Acciones — en mobile van en 2 filas */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 10,
        }}>
          {/* Filtro keyword */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: isMobile ? '1 1 100%' : 'none' }}>
            <Search size={13} color={colores.textoOscuro} style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} />
            <select
              value={filtroKeyword}
              onChange={e => setFiltroKeyword(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                borderRadius: 8, border: `1px solid ${colores.borde}`,
                background: colores.fondoSecundario, color: colores.textoMedio,
                fontSize: 13, cursor: 'pointer', appearance: 'none', outline: 'none'
              }}
            >
              <option value="">Todas las keywords</option>
              {keywordsUnicas.map(kw => (
                <option key={kw} value={kw}>{kw}</option>
              ))}
            </select>
          </div>

          {/* Reiniciar */}
          <button onClick={reiniciarVista} style={{
            flex: isMobile ? '1' : 'none',
            padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${colores.borde}`,
            background: colores.fondoSecundario, color: colores.textoMedio,
            fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <RotateCcw size={13} />
            Reiniciar
          </button>

          {/* CSV */}
          <button onClick={exportarCSV} disabled={testigosFiltrados.length === 0} style={{
            flex: isMobile ? '1' : 'none',
            padding: '8px 16px', borderRadius: 8,
            border: `1px solid ${colores.borde}`,
            background: colores.fondoSecundario, color: colores.textoMedio,
            fontSize: 13, fontWeight: 500,
            cursor: testigosFiltrados.length === 0 ? 'not-allowed' : 'pointer',
            opacity: testigosFiltrados.length === 0 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            ↓ CSV
          </button>
        </div>

        {filtroKeyword && (
          <p style={{ fontSize: 11, color: colores.textoOscuro, margin: '6px 0 0' }}>
            Filtrando por "{filtroKeyword}"
          </p>
        )}
      </div>

      {/* Lista */}
      {testigosFiltrados.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: isMobile ? 260 : 400, gap: 12
        }}>
          <Radio size={40} color={colores.textoOscuro} strokeWidth={1} />
          <p style={{ fontSize: 14, fontWeight: 500, color: colores.textoMedio, margin: 0, textAlign: 'center' }}>
            {filtroKeyword ? `Sin detecciones para "${filtroKeyword}"` : 'Esperando detecciones...'}
          </p>
          <p style={{ fontSize: 12, color: colores.textoOscuro, margin: 0, textAlign: 'center' }}>
            {filtroKeyword ? 'Prueba con otra keyword' : 'Inicia una sesión para ver los testigos aquí'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          maxHeight: isMobile ? '60vh' : 700, overflowY: 'auto',
          paddingRight: 4,
        }}>
          {testigosFiltrados.map((t, i) => (
            <div key={t.id ?? i} style={{
              background: colores.fondoSecundario, borderRadius: 12,
              padding: '12px 14px', border: `1px solid ${colores.borde}`,
              borderLeft: `4px solid ${colores.textoClaro}`,
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    background: colores.textoClaro, color: colores.textoEnOscuro,
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999
                  }}>
                    {t.keyword_detectada ?? t.keyword}
                  </span>
                  <span style={{ fontSize: 11, color: colores.textoOscuro }}>
                    {t.emisora_nombre ?? t.emisora}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: colores.textoOscuro, flexShrink: 0, marginLeft: 8 }}>
                  {new Date(t.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p style={{
                fontSize: 13, color: colores.textoMedio,
                margin: 0, lineHeight: 1.5, fontStyle: 'italic'
              }}>
                "{t.transcripcion}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: colores.fondoPrincipal,
      padding: isMobile ? '16px' : '32px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: isMobile ? 16 : 28 }}>
          <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: colores.textoClaro, margin: 0 }}>
            Testigos IA
          </h1>
          <p style={{ fontSize: 13, color: colores.textoOscuro, margin: '4px 0 0' }}>
            Verificación on-air: detección automática de marcas y spots en radio en vivo
          </p>
        </div>

        {/* ── MOBILE: tabs de navegación ── */}
        {isMobile && (
          <div style={{
            display: 'flex', gap: 8, marginBottom: 16,
            background: colores.fondoSecundario,
            borderRadius: 12, padding: 4,
          }}>
            {[
              { id: 'testigos', label: `Testigos${testigosFiltrados.length > 0 ? ` (${testigosFiltrados.length})` : ''}` },
              { id: 'config', label: `Configurar${sesiones.length > 0 ? ` · ${sesiones.length} activas` : ''}` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setVistaActiva(tab.id as 'config' | 'testigos')}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none',
                  background: vistaActiva === tab.id ? colores.textoClaro : 'transparent',
                  color: vistaActiva === tab.id ? colores.textoEnOscuro : colores.textoOscuro,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── MOBILE: render por tab ── */}
        {isMobile ? (
          <div>
            {vistaActiva === 'testigos' ? panelTestigos : panelConfig}
          </div>
        ) : (
          /* ── DESKTOP: grid 2 columnas ── */
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
            <div>{panelConfig}</div>
            <div>{panelTestigos}</div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: colores.textoMedio, marginBottom: 6
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${colores.borde}`, background: colores.fondoSecundario,
  color: colores.textoClaro, fontSize: 13, outline: 'none', boxSizing: 'border-box'
};