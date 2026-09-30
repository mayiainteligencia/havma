import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Search,
  CalendarDays,
  CornerDownLeft,
  ChevronDown,
  UserCog,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { brandingConfig } from '../config/branding';
import type { Vista } from '../config/menu';
import { buscarSeccion } from '../data/asistente';
import { porPeriodo, ULTIMO, CLIENTE, fmt, fmtMXNCorto, ALERTAS } from '../data/media';
import { NOMBRE_ROL, type Rol } from '../data/types';
import { resetearDatos, setRol } from '../data/store';
import { BrainCanvas } from './modules/dashboardModules/BrainCanvas';
import { ImportarExcelModal } from './ImportarExcelModal';
import { useConfirm } from './shared/confirm';
import { useToast } from './shared/toast';

interface HeaderProps {
  activeVista: string;
  /** 'planeacion' (vista) o 'planeacion:mix-medios' (vista + subsección). */
  onNavigate: (target: string) => void;
  /** Vistas que ve el rol activo — ya filtradas por App.tsx. */
  vistasVisibles: Vista[];
  rol: Rol;
}

interface Notification {
  id: number;
  tipo: 'alerta' | 'exito' | 'info' | 'urgente';
  titulo: string;
  mensaje: string;
  tiempo: string;
  leida: boolean;
  plan?: string;
}

const D = porPeriodo[ULTIMO];
const recuperableMXN = D.discrepancias.reduce((s, d) => s + d.montoMXN, 0);
const notificacionesEstaticas: Notification[] = [
  { id: 1, tipo: 'urgente', titulo: `Pauta no emitida: ${fmtMXNCorto(recuperableMXN)} recuperables`, mensaje: `Se detectaron spots contratados que no salieron al aire en ${D.discrepancias.length} plazas. El monto es reclamable al medio.`, tiempo: 'Hace 3 min',  leida: false, plan: `Generar el reclamo automático a las ${D.discrepancias.length} emisoras con spots faltantes.` },
  { id: 2, tipo: 'alerta',  titulo: 'Detección on-air · MVS 102.5',                 mensaje: `Nueva mención de ${CLIENTE.nombre} en el bloque matutino, sentimiento positivo.`,       tiempo: 'Hace 8 min',  leida: false },
  { id: 3, tipo: 'alerta',  titulo: `${ALERTAS[1].plaza}: spike de competencia`,     mensaje: ALERTAS[1].descripcion,                                                                    tiempo: 'Hace 22 min', leida: false, plan: 'Reforzar frecuencia en drive time en la plaza afectada durante 7 días.' },
  { id: 4, tipo: 'exito',   titulo: 'Cálculo de Share of Voice completado',          mensaje: `${CLIENTE.nombre} lidera ${fmt(D.plazasLideradas)} de ${fmt(D.totalPlazas)} plazas (${D.sovCliente}% de SOV ponderado) en ${ULTIMO}.`, tiempo: 'Hace 1 hora', leida: true  },
  { id: 5, tipo: 'info',    titulo: `${D.segundaMarca} avanza como 2ª marca`,        mensaje: `${D.segundaMarca} lidera ${D.lideradasSegunda} plazas. Vigilar su avance de cara al siguiente flight.`,                       tiempo: 'Hace 2 horas', leida: true  },
];

export const Header: React.FC<HeaderProps> = ({ activeVista, onNavigate, vistasVisibles, rol }) => {
  const { colores, empresa } = brandingConfig;

  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notification[]>(notificacionesEstaticas);
  const notifRef = useRef<HTMLDivElement>(null);
  const confirmar = useConfirm();
  const { push } = useToast();

  const activarPlanNotif = async (n: Notification) => {
    if (n.plan && await confirmar({ titulo: n.titulo, descripcion: n.plan })) {
      marcarComoLeida(n.id);
      push({ kind: 'success', title: 'Plan activado', msg: n.plan });
    }
  };

  const [query, setQuery] = useState('');
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultados = buscarSeccion(query);

  const irAResultado = (target: string) => {
    onNavigate(target);
    setBuscadorAbierto(false);
    setQuery('');
    inputRef.current?.blur();
  };

  // MAYIA vive siempre montada arriba de cada vista (InicioResumen): el
  // mini-jarvis solo necesita abrir su chat, no navegar a ningún lado.
  const abrirJarvis = () => window.dispatchEvent(new CustomEvent('jarvis:open'));

  const [vistaMenuAbierto, setVistaMenuAbierto] = useState(false);
  const vistaMenuRef = useRef<HTMLDivElement>(null);
  const vistaActual = vistasVisibles.find(v => v.id === activeVista);

  const [rolMenuAbierto, setRolMenuAbierto] = useState(false);
  const rolMenuRef = useRef<HTMLDivElement>(null);
  const [modalExcelAbierto, setModalExcelAbierto] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (vistaMenuRef.current && !vistaMenuRef.current.contains(e.target as Node))
        setVistaMenuAbierto(false);
      if (rolMenuRef.current && !rolMenuRef.current.contains(e.target as Node))
        setRolMenuAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const confirmarReset = async () => {
    if (await confirmar({ titulo: 'Restablecer datos', descripcion: 'Borra todos los cambios guardados en este navegador (ediciones, versiones, importaciones) y vuelve a los datos originales. No se puede deshacer.' })) {
      resetearDatos();
      push({ kind: 'success', title: 'Datos restablecidos', msg: 'La plataforma volvió a los datos originales.' });
    }
  };

  const fecha = new Date();
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotificacionesAbiertas(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node))
        setBuscadorAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  const getIconoPorTipo = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'alerta':  return <AlertTriangle size={16} color="#F59E0B" />;
      case 'exito':   return <CheckCircle   size={16} color="#10B981" />;
      case 'urgente': return <AlertTriangle size={16} color="#EF4444" />;
      case 'info':    return <Info          size={16} color="#3B82F6" />;
    }
  };

  const marcarComoLeida = (id: number) =>
    setNotificaciones(notificaciones.map(n => n.id === id ? { ...n, leida: true } : n));

  const marcarTodasComoLeidas = () =>
    setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));

  return (
    <>
      <header
        style={{
          height: '72px',
          backgroundColor: colores.fondoSecundario,
          borderBottom: `1px solid ${colores.borde}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 20px',
          flexShrink: 0,
          position: 'relative',
          zIndex: 300,
        }}
      >
        {/* ── Buscador de vistas y secciones ── */}
        <div
          ref={searchWrapRef}
          style={{ flex: '0 1 260px', minWidth: 180, position: 'relative' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 14px',
              height: '42px',
              borderRadius: buscadorAbierto && resultados.length ? '14px 14px 0 0' : '999px',
              backgroundColor: buscadorAbierto ? colores.fondoPrincipal : colores.fondoTerciario,
              border: `1px solid ${buscadorAbierto ? colores.primario : colores.borde}`,
              transition: 'border-radius 0.15s, background-color 0.2s',
              boxShadow: buscadorAbierto ? `0 0 0 3px ${colores.primario}28` : 'none',
              position: 'relative',
              zIndex: 310,
            }}
          >
            <Search size={16} style={{ color: colores.primario, flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setBuscadorAbierto(true); }}
              onFocus={() => setBuscadorAbierto(true)}
              onKeyDown={e => {
                if (e.key === 'Enter' && resultados[0]) irAResultado(resultados[0].id);
                if (e.key === 'Escape') { setBuscadorAbierto(false); inputRef.current?.blur(); }
              }}
              placeholder="Buscar vista o sección…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: '13.5px', color: colores.textoClaro, minWidth: 0,
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <X size={16} style={{ color: colores.textoMedio }} />
              </button>
            )}
          </div>

          {/* Resultados */}
          {buscadorAbierto && query.trim() && (
            <div
              style={{
                position: 'absolute', top: '41px', left: 0, right: 0,
                backgroundColor: colores.fondoPrincipal,
                border: `1px solid ${colores.primario}`,
                borderTop: `1px solid ${colores.borde}`,
                borderRadius: '0 0 16px 16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                overflow: 'hidden', zIndex: 305,
                maxHeight: 'calc(100vh - 130px)', overflowY: 'auto',
              }}
            >
              {resultados.length === 0 ? (
                <div style={{ padding: '16px', fontSize: '13px', color: colores.textoMedio }}>
                  Sin coincidencias para "{query}"
                </div>
              ) : (
                resultados.map(r => (
                  <button
                    key={r.id}
                    onClick={() => irAResultado(r.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 16px', border: 'none', background: 'transparent',
                      cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${colores.borde}`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = colores.fondoTerciario)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Search size={15} style={{ color: colores.textoOscuro, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: '14px', fontWeight: 500, color: colores.textoClaro, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.titulo}
                    </span>
                    <CornerDownLeft size={14} style={{ color: colores.textoOscuro, flexShrink: 0 }} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Selector de vista (rol) ── */}
        <div ref={vistaMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setVistaMenuAbierto(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '0 14px', height: '42px', borderRadius: '12px',
              backgroundColor: vistaMenuAbierto ? colores.fondoPrincipal : colores.fondoTerciario,
              border: `1px solid ${vistaMenuAbierto ? colores.primario : colores.borde}`,
              boxShadow: vistaMenuAbierto ? `0 0 0 3px ${colores.primario}28` : 'none',
              cursor: 'pointer', transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            {vistaActual && <vistaActual.icono size={16} color={colores.primario} />}
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: colores.textoClaro, whiteSpace: 'nowrap' }}>
              {vistaActual?.nombre ?? 'Elige una vista'}
            </span>
            <ChevronDown size={15} style={{ color: colores.textoMedio, transition: 'transform 0.15s', transform: vistaMenuAbierto ? 'rotate(180deg)' : 'none' }} />
          </button>

          {vistaMenuAbierto && (
            <div style={{
              position: 'absolute', top: '48px', left: 0, minWidth: '230px',
              backgroundColor: colores.fondoPrincipal,
              border: `1px solid ${colores.borde}`,
              borderRadius: '14px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              overflow: 'hidden', zIndex: 320, padding: '6px',
            }}>
              {vistasVisibles.map(v => {
                const Icon = v.icono;
                const isActive = v.id === activeVista;
                return (
                  <button
                    key={v.id}
                    onClick={() => { onNavigate(v.id); setVistaMenuAbierto(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 10px', border: 'none', borderRadius: '9px',
                      background: isActive ? `${colores.primario}14` : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = colores.fondoTerciario; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Icon size={16} color={isActive ? colores.primario : colores.textoOscuro} />
                    <span style={{ fontSize: '13.5px', fontWeight: isActive ? 700 : 500, color: isActive ? colores.primario : colores.textoClaro }}>
                      {v.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Derecha: rol + Excel + reset + MAYIA + fecha + campana + avatar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
          {/* Selector de rol — solo filtra el menú, no hay permisos reales */}
          <div ref={rolMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setRolMenuAbierto(o => !o)}
              title="Cambiar de rol (solo filtra el menú)"
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '0 12px', height: '40px', borderRadius: '10px',
                background: rolMenuAbierto ? colores.fondoPrincipal : colores.fondoTerciario,
                border: `1px solid ${rolMenuAbierto ? colores.primario : colores.borde}`, cursor: 'pointer',
              }}
            >
              <UserCog size={15} color={colores.textoMedio} />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: colores.textoClaro }}>{NOMBRE_ROL[rol]}</span>
              <ChevronDown size={13} style={{ color: colores.textoMedio, transform: rolMenuAbierto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
            {rolMenuAbierto && (
              <div style={{
                position: 'absolute', top: '46px', right: 0, minWidth: '160px',
                background: colores.fondoPrincipal, border: `1px solid ${colores.borde}`, borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden', zIndex: 320, padding: '5px',
              }}>
                {(Object.keys(NOMBRE_ROL) as Rol[]).map(r => (
                  <button key={r} onClick={() => { setRol(r); setRolMenuAbierto(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: '8px',
                      background: r === rol ? `${colores.primario}14` : 'transparent', cursor: 'pointer',
                      fontSize: '13px', fontWeight: r === rol ? 700 : 500, color: r === rol ? colores.primario : colores.textoClaro,
                    }}
                    onMouseEnter={e => { if (r !== rol) e.currentTarget.style.backgroundColor = colores.fondoTerciario; }}
                    onMouseLeave={e => { if (r !== rol) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {NOMBRE_ROL[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cargar Excel — global, con arrastrar y soltar dentro del modal */}
          <button onClick={() => setModalExcelAbierto(true)} title="Cargar Excel" aria-label="Cargar Excel"
            style={iconBtnStyle(colores.fondoTerciario)}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = colores.fondoPrincipal)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = colores.fondoTerciario)}
          >
            <Upload size={17} style={{ color: colores.textoClaro }} />
          </button>

          {/* Restablecer datos — borra localStorage y vuelve al mock original */}
          <button onClick={confirmarReset} title="Restablecer datos" aria-label="Restablecer datos"
            style={iconBtnStyle(colores.fondoTerciario)}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = colores.fondoPrincipal)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = colores.fondoTerciario)}
          >
            <RotateCcw size={17} style={{ color: colores.textoClaro }} />
          </button>

          {modalExcelAbierto && <ImportarExcelModal onClose={() => setModalExcelAbierto(false)} onNavigate={onNavigate} />}

          {/* Mini-jarvis (átomo) — acceso rápido al asistente */}
          <button
            onClick={abrirJarvis}
            title="Abrir MAYIA"
            aria-label="Abrir asistente MAYIA"
            style={{
              width: '46px', height: '46px', borderRadius: '50%',
              backgroundColor: colores.fondoTerciario, border: `1px solid ${colores.borde}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0, transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${colores.primario}28`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ width: 60, height: 60, pointerEvents: 'none' }}>
              <BrainCanvas accent={colores.primario} height={60} nodes={55} />
            </div>
          </button>

          {/* Fecha pegada a la campana */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '7px 14px', borderRadius: '999px',
            backgroundColor: colores.fondoTerciario,
            border: `1px solid ${colores.borde}`,
            marginRight: '4px',
          }}>
            <CalendarDays size={14} style={{ color: colores.textoMedio }} />
            <span style={{ fontSize: '13px', fontWeight: '500', color: colores.textoClaro }}>
              {fechaFormateada}
            </span>
          </div>

          {/* Notificaciones */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotificacionesAbiertas(!notificacionesAbiertas)}
              style={iconBtnStyle(colores.fondoTerciario)}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = colores.fondoPrincipal)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = colores.fondoTerciario)}
            >
              <Bell size={19} style={{ color: colores.textoClaro }} />
              {notificacionesNoLeidas > 0 && (
                <span style={{
                  position: 'absolute', top: '6px', right: '6px',
                  minWidth: '17px', height: '17px', borderRadius: '10px',
                  backgroundColor: '#EF4444', border: `2px solid ${colores.fondoSecundario}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 'bold', color: '#FFFFFF', padding: '0 3px',
                }}>
                  {notificacionesNoLeidas}
                </span>
              )}
            </button>

            {notificacionesAbiertas && (
              <div style={{
                position: 'absolute', top: '56px', right: '0',
                width: '370px', maxHeight: '480px',
                backgroundColor: colores.fondoSecundario,
                borderRadius: '14px', border: `1px solid ${colores.borde}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                overflow: 'hidden', zIndex: 1000,
              }}>
                <div style={{
                  padding: '14px 18px', borderBottom: `1px solid ${colores.borde}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: colores.textoClaro }}>Notificaciones</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: colores.textoMedio }}>{notificacionesNoLeidas} sin leer</p>
                  </div>
                  {notificacionesNoLeidas > 0 && (
                    <button onClick={marcarTodasComoLeidas}
                      style={{ background: 'none', border: 'none', color: colores.primario, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      Marcar todas
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {notificaciones.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => marcarComoLeida(notif.id)}
                      style={{
                        padding: '14px 18px', borderBottom: `1px solid ${colores.borde}`,
                        backgroundColor: notif.leida ? 'transparent' : colores.fondoTerciario + '44',
                        cursor: 'pointer', transition: 'background-color 0.15s', display: 'flex', gap: '10px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = colores.fondoTerciario)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = notif.leida ? 'transparent' : colores.fondoTerciario + '44')}
                    >
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIconoPorTipo(notif.tipo)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: notif.leida ? '500' : '700', color: colores.textoClaro }}>
                            {notif.titulo}
                          </h4>
                          {!notif.leida && (
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: colores.primario, flexShrink: 0, marginLeft: '8px', marginTop: '4px' }} />
                          )}
                        </div>
                        <p style={{ margin: '2px 0', fontSize: '12px', color: colores.textoMedio, lineHeight: '1.4' }}>{notif.mensaje}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: '11px', color: colores.textoOscuro }}>{notif.tiempo}</span>
                          {notif.plan && (
                            <button
                              onClick={e => { e.stopPropagation(); activarPlanNotif(notif); }}
                              style={{ border: 'none', background: colores.primario, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '5px 11px', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
                            >
                              Activar plan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '10px 18px', borderTop: `1px solid ${colores.borde}`, textAlign: 'center' }}>
                  <button style={{ background: 'none', border: 'none', color: colores.primario, fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%', padding: '6px' }}>
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <button
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              backgroundColor: colores.secundario, border: `2px solid ${colores.borde}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden', padding: '9px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <img
              src={empresa.logo}
              alt={empresa.nombre}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const container = target.parentElement;
                if (container) {
                  container.style.background = `linear-gradient(135deg, ${colores.primario}, ${colores.secundario})`;
                  container.style.fontSize = '16px';
                  container.style.fontWeight = 'bold';
                  container.style.color = '#FFFFFF';
                  container.textContent = 'M';
                }
              }}
            />
          </button>
        </div>
      </header>
    </>
  );
};

const iconBtnStyle = (bg: string): React.CSSProperties => ({
  width: '40px', height: '40px', borderRadius: '50%',
  backgroundColor: bg, border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  position: 'relative', transition: 'background-color 0.2s',
});
