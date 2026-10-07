// "?" de cada pestaña — abre MAYIA en modo ayuda: qué puedes hacer aquí / qué
// monitorear, lectura por voz, preguntas por voz (reusan las mismas
// respuestas que los chips) y edición directa por voz en Brief, Mix de
// medios y Flowchart. Todo por reglas y plantillas — "Asistente por reglas",
// sin LLM ni backend.
//
// Dos flujos distintos, que no se cruzan:
//  · Planes (Mesa de Planeación): "¿Qué pasaría?" solo previsualiza; "Subir
//    para aprobación"/"Proponer a mi planner" crea una versión PENDIENTE
//    (crearVersionEjercicio) sin tocar el mix — este se mueve solo cuando el
//    Planner aprueba esa versión en Centro de Aprobaciones.
//  · Edición directa (Brief / Mix de medios / Flowchart): se dicta o escribe
//    un cambio puntual a un solo campo o celda, MAYIA lo explica en una
//    frase y, si se acepta, se aplica YA (mismas funciones del store que usa
//    la edición manual: updateBriefField, updateTouchpointInversion,
//    setCeldaFlow) — es el mismo riesgo que teclear el valor a mano.
import React, { useState } from 'react';
import { HelpCircle, X, Volume2, Pause, Square, Sparkles, Mic } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import { BrainCanvas } from '../modules/dashboardModules/BrainCanvas';
import { fmtMXNCorto } from '../../data/media';
import { getAyuda } from '../../data/ayuda';
import {
  useOverrides, getEjercicioActivo, crearVersionEjercicio, getMonitoreo, listaVersiones,
  updateBriefField, updateTouchpointInversion, registrarCambioInversion, setCeldaFlow, registrarCambioFlow, getFilaFlow, mock,
} from '../../data/store';
import { ACTOR_POR_ROL, type Rol, type Ejercicio } from '../../data/types';
import { interpolarEscenario, touchpointQueMasPierdeAlcance } from '../../data/interpolate';
import { resumenMonitoreo, esNoTransmitido } from '../../data/metricas';
import {
  generarPlanes, parsearComando, validarPlan, efectoEstimado, explicacionPlan, medioMasAfectado,
  type PlanPropuesto, type PlanRechazado,
} from '../../data/planesIA';
import { parsearComandoBrief, parsearComandoFlow, type CambioBrief, type CambioFlowCelda } from '../../data/comandosVoz';
import { useSpeech } from './useSpeech';
import { useVoiceInput } from './useVoiceInput';
import { useToast } from './toast';

type ResultadoOtroPlan =
  | { tipo: 'ok'; plan: PlanPropuesto }
  | { tipo: 'rechazado'; motivo: string }
  | { tipo: 'no-entendido' };

type EdicionDirecta =
  | { tipo: 'brief'; cambio: CambioBrief }
  | { tipo: 'mix'; touchpoint: string; valorAnterior: number; valorNuevo: number }
  | { tipo: 'flow'; cambio: CambioFlowCelda }
  | { tipo: 'no-entendido' };

const esPlanValido = (p: PlanPropuesto | PlanRechazado): p is PlanPropuesto => 'asignaciones' in p;

const btnGhost: React.CSSProperties = { border: '1px solid rgba(255,255,255,.25)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 9, cursor: 'pointer' };
const btnPrimario: React.CSSProperties = { border: 'none', background: '#fff', color: '#111', fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 9, cursor: 'pointer' };
const btnChip: React.CSSProperties = { border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 999, cursor: 'pointer' };
const btnMic = (activo: boolean): React.CSSProperties => ({ ...btnGhost, display: 'flex', alignItems: 'center', gap: 6, borderColor: activo ? '#EF4444' : 'rgba(255,255,255,.25)', color: activo ? '#EF4444' : '#fff' });

/** Clasifica una pregunta hablada contra los mismos intents que ya cubren los chips — si no reconoce nada, 'ninguna' (no inventa). */
function clasificarPregunta(texto: string): string {
  const t = texto.toLowerCase();
  if (/recort|baja.*presupuesto/.test(t)) return 'recorte';
  if (/aument|sube.*presupuesto/.test(t)) return 'aumento';
  if (/propon|plan/.test(t)) return 'general';
  if (/d[oó]nde.*(pierdo|pierde)|p[eé]rdida.*alcance/.test(t)) return 'donde-pierdo';
  if (/falla.*testigo|testigo.*falla/.test(t)) return 'fallas';
  if (/reclam/.test(t)) return 'reclamar';
  if (/resum.*pendient|pendientes/.test(t)) return 'resumir';
  if (/cambi[oó].*por qu[eé]|qu[eé].*cambi[oó]/.test(t)) return 'que-cambio';
  return 'ninguna';
}

/** Dónde ver el cambio en pantalla — para no tener que ir a buscarlo. */
function ubicarEdicion(e: EdicionDirecta): string {
  if (e.tipo === 'brief') return `Mesa de Planeación → Brief, campo "${e.cambio.etiqueta.replace(/^(el|la) /, '')}".`;
  if (e.tipo === 'mix') return `Mesa de Planeación → Mix de medios, fila "${e.touchpoint}".`;
  if (e.tipo === 'flow') return `Flowchart → Vista anual, fila "${e.cambio.medio}", semana ${e.cambio.semanaLabel}.`;
  return '';
}

function explicarEdicion(e: EdicionDirecta): string {
  if (e.tipo === 'brief') return `Cambié ${e.cambio.etiqueta} de "${e.cambio.valorAnterior ?? '—'}" a "${e.cambio.valorNuevo}". Lo verás en ${ubicarEdicion(e)} Revísalo y dime si lo aceptas.`;
  if (e.tipo === 'mix') return `Cambié la inversión de ${e.touchpoint} de ${fmtMXNCorto(e.valorAnterior)} a ${fmtMXNCorto(e.valorNuevo)}. Lo verás en ${ubicarEdicion(e)} Revísalo y dime si lo aceptas.`;
  if (e.tipo === 'flow') return `Cambié ${e.cambio.medio} semana ${e.cambio.semanaLabel} de ${fmtMXNCorto(e.cambio.valorAnterior)} a ${fmtMXNCorto(e.cambio.valorNuevo)}. Lo verás en ${ubicarEdicion(e)} Revísalo y dime si lo aceptas.`;
  return 'No entendí qué querías cambiar.';
}

const TarjetaPlan: React.FC<{ plan: PlanPropuesto; ejercicio: Ejercicio; rol: Rol; onSubir: (p: PlanPropuesto) => void; onAjustar: (p: PlanPropuesto) => void }> =
({ plan, ejercicio, rol, onSubir, onAjustar }) => {
  const [previsualizado, setPrevisualizado] = useState(false);
  const [descartado, setDescartado] = useState(false);
  if (descartado) return null;

  return (
    <div style={{ border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.06)' }}>
      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{plan.nombre}</div>
      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.65)', margin: '4px 0 10px' }}>{plan.descripcion}</p>

      {!previsualizado && (
        <button onClick={() => setPrevisualizado(true)} style={btnGhost}>¿Qué pasaría?</button>
      )}

      {previsualizado && (
        <>
          <p style={{ fontSize: 13.5, color: '#fff', lineHeight: 1.55, margin: '0 0 8px' }}>{explicacionPlan(ejercicio, plan)}</p>
          {plan.avisos.map((a, i) => <p key={i} style={{ fontSize: 11.5, color: '#FBBF24', margin: '2px 0 6px' }}>⚠ {a}</p>)}
          {rol !== 'ceo' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <button onClick={() => onSubir(plan)} style={btnPrimario}>{rol === 'cliente' ? 'Proponer a mi planner' : 'Subir para aprobación'}</button>
              <button onClick={() => setDescartado(true)} style={btnGhost}>Descartar</button>
              {rol === 'planner' && <button onClick={() => onAjustar(plan)} style={btnGhost}>Ajustar</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const AyudaMayia: React.FC<{ vistaId: string; subId: string; flowCampanaId?: string }> = ({ vistaId, subId, flowCampanaId }) => {
  const { colores } = brandingConfig;
  const overrides = useOverrides();
  const rol = overrides.rol;
  const { push } = useToast();
  const speech = useSpeech();
  const voz = useVoiceInput();

  const [open, setOpen] = useState(false);
  const [vista2, setVista2] = useState<'inicio' | 'resultado'>('inicio');
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [planes, setPlanes] = useState<(PlanPropuesto | PlanRechazado)[] | null>(null);
  const [textoLibre, setTextoLibre] = useState('');
  const [planOtro, setPlanOtro] = useState<ResultadoOtroPlan | null>(null);
  const [confirmando, setConfirmando] = useState<PlanPropuesto | null>(null);
  const [motivo, setMotivo] = useState('');
  const [edicionDirecta, setEdicionDirecta] = useState<EdicionDirecta | null>(null);

  const ayuda = getAyuda(vistaId, subId, rol);
  const ejercicio = vistaId === 'planeacion' ? getEjercicioActivo(overrides) : null;
  const tieneChipsPlan = vistaId === 'planeacion' && (subId === 'mix-medios' || subId === 'escenarios') && !!ejercicio;
  const tieneChipsFlow = vistaId === 'flowchart';
  const tieneChipsAprob = vistaId === 'aprobaciones';
  const esBrief = vistaId === 'planeacion' && subId === 'brief' && !!ejercicio;
  const esMixDirecto = vistaId === 'planeacion' && subId === 'mix-medios' && !!ejercicio && rol !== 'ceo';
  const esFlowDirecto = vistaId === 'flowchart' && subId === 'vista-anual' && !!flowCampanaId && rol !== 'ceo';
  const tieneEdicionDirecta = (esBrief || esMixDirecto || esFlowDirecto) && rol !== 'ceo';

  const cerrar = () => { setOpen(false); setVista2('inicio'); setRespuesta(null); setPlanes(null); setPlanOtro(null); setConfirmando(null); setEdicionDirecta(null); speech.detener(); };
  const volver = () => { setVista2('inicio'); setRespuesta(null); setPlanes(null); setPlanOtro(null); setEdicionDirecta(null); };

  const textoAyuda = [
    ayuda.puedes.length ? `Qué puedes hacer aquí: ${ayuda.puedes.join('. ')}` : '',
    ayuda.monitoreo.length ? `Qué monitorear aquí: ${ayuda.monitoreo.join('. ')}` : '',
  ].filter(Boolean).join('. ');

  const onChipPlan = (intencion: 'recorte' | 'aumento' | 'general'): string => {
    if (!ejercicio) return '';
    const resultado = generarPlanes(ejercicio, intencion);
    setPlanes(resultado);
    setVista2('resultado');
    const validos = resultado.filter(esPlanValido).length;
    return validos > 0 ? `Te armé ${validos} opción${validos === 1 ? '' : 'es'}. Revísalas en pantalla.` : 'No encontré un plan válido con esas condiciones.';
  };

  const onDondePierdoAlcance = (): string => {
    if (!ejercicio) return '';
    const presupuestoBase = ejercicio.exercise.presupuesto || ejercicio.totales.inversion || 0;
    const factorActual = presupuestoBase ? (ejercicio.totales.inversion ?? 0) / presupuestoBase : 1;
    const base = interpolarEscenario(ejercicio.escenarios, factorActual);
    const recorte = interpolarEscenario(ejercicio.escenarios, Math.max(0.1, factorActual * 0.85));
    let texto: string;
    if (!base || !recorte) texto = 'No hay escenarios cargados para este ejercicio.';
    else {
      const peor = touchpointQueMasPierdeAlcance(base, recorte);
      texto = peor ? `Si recortas presupuesto 15%, ${peor.touchpoint} es el que más alcance pierde primero (${(peor.delta * 100).toFixed(1)} pts).` : 'No se detectó un touchpoint con pérdida de alcance clara.';
    }
    setRespuesta(texto);
    setVista2('resultado');
    return texto;
  };

  const onOtroPlan = () => {
    if (!ejercicio || !textoLibre.trim()) return;
    const parsed = parsearComando(textoLibre, ejercicio);
    if (!parsed) { setPlanOtro({ tipo: 'no-entendido' }); setVista2('resultado'); return; }
    const val = validarPlan(ejercicio, parsed.asignaciones);
    if (!val.ok) { setPlanOtro({ tipo: 'rechazado', motivo: val.motivoRechazo! }); setVista2('resultado'); return; }
    setPlanOtro({
      tipo: 'ok',
      plan: {
        id: 'plan-otro', nombre: 'Plan personalizado', descripcion: parsed.descripcion, asignaciones: parsed.asignaciones,
        efecto: efectoEstimado(ejercicio, parsed.asignaciones), avisos: val.avisos, medioMasAfectado: medioMasAfectado(ejercicio, parsed.asignaciones),
      },
    });
    setVista2('resultado');
  };

  const onMostrarFallas = (): string => {
    const r = resumenMonitoreo(getMonitoreo());
    const texto = `Cumplimiento global: ${r.cumplimientoGlobal.toFixed(0)}%. ${r.reclamos} spot(s) no transmitido(s), ${fmtMXNCorto(r.enRiesgo)} en riesgo (con datos de muestra).`;
    setRespuesta(texto);
    setVista2('resultado');
    return texto;
  };

  const onQueReclamar = (): string => {
    const filas = getMonitoreo().filter(esNoTransmitido);
    let texto: string;
    if (filas.length === 0) texto = 'No hay spots no transmitidos que reclamar ahora mismo (con datos de muestra).';
    else {
      const porCadena = new Map<string, number>();
      filas.forEach(f => porCadena.set(f.cadena_plataforma, (porCadena.get(f.cadena_plataforma) ?? 0) + f.inversion_plan));
      const top = [...porCadena.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      texto = `A reclamar: ${top.map(([c, m]) => `${c} (${fmtMXNCorto(m)})`).join(', ')} — ${filas.length} spot(s) en total (con datos de muestra).`;
    }
    setRespuesta(texto);
    setVista2('resultado');
    return texto;
  };

  const onResumirPendientes = (): string => {
    const todas = listaVersiones(overrides).filter(v => v.estado === 'pendiente');
    const total = todas.reduce((s, v) => s + (v.delta_inversion ?? 0), 0);
    const texto = todas.length ? `${todas.length} versión(es) pendiente(s), con un movimiento neto de ${total >= 0 ? '+' : ''}${fmtMXNCorto(total)}.` : 'No hay versiones pendientes ahora mismo.';
    setRespuesta(texto);
    setVista2('resultado');
    return texto;
  };

  const onQueCambio = (): string => {
    const todas = listaVersiones(overrides);
    const ultima = [...todas].sort((a, b) => (b.fecha + (b.hora ?? '')).localeCompare(a.fecha + (a.hora ?? '')))[0];
    const texto = ultima
      ? `La última versión ("${ultima.etiqueta}") la guardó ${ultima.autor} — ${ultima.motivo}. Mueve la inversión en ${(ultima.delta_inversion ?? 0) >= 0 ? '+' : ''}${fmtMXNCorto(ultima.delta_inversion ?? 0)}.`
      : 'Todavía no hay versiones guardadas.';
    setRespuesta(texto);
    setVista2('resultado');
    return texto;
  };

  const onMicPreguntar = async () => {
    const texto = await voz.escuchar();
    if (!texto) return;
    const intento = clasificarPregunta(texto);
    let hablado: string;
    if (intento === 'recorte' && tieneChipsPlan) hablado = onChipPlan('recorte');
    else if (intento === 'aumento' && tieneChipsPlan) hablado = onChipPlan('aumento');
    else if (intento === 'general' && tieneChipsPlan) hablado = onChipPlan('general');
    else if (intento === 'donde-pierdo' && tieneChipsPlan) hablado = onDondePierdoAlcance();
    else if (intento === 'fallas' && tieneChipsFlow) hablado = onMostrarFallas();
    else if (intento === 'reclamar' && tieneChipsFlow) hablado = onQueReclamar();
    else if (intento === 'resumir' && tieneChipsAprob) hablado = onResumirPendientes();
    else if (intento === 'que-cambio' && tieneChipsAprob) hablado = onQueCambio();
    else {
      hablado = 'No entendí esa pregunta. Prueba alguna de las opciones.';
      setRespuesta(hablado);
      setVista2('resultado');
    }
    speech.hablar(hablado);
  };

  const onMicEditar = async () => {
    const texto = await voz.escuchar();
    if (!texto) return;
    let resultado: EdicionDirecta = { tipo: 'no-entendido' };
    if (esBrief && ejercicio) {
      const c = parsearComandoBrief(texto, ejercicio);
      if (c) resultado = { tipo: 'brief', cambio: c };
    } else if (esMixDirecto && ejercicio) {
      const parsed = parsearComando(texto, ejercicio);
      const tp = parsed && ejercicio.touchpoints.find(t => parsed.asignaciones.some(a => a.touchpoint === t.nombre && Math.abs(a.inversion - (t.inversion ?? 0)) > 0.5));
      if (tp) {
        const nueva = parsed!.asignaciones.find(a => a.touchpoint === tp.nombre)!.inversion;
        resultado = { tipo: 'mix', touchpoint: tp.nombre, valorAnterior: tp.inversion ?? 0, valorNuevo: nueva };
      }
    } else if (esFlowDirecto && flowCampanaId) {
      const medios = mock.flow.campanas.find(c => c.id === flowCampanaId)?.medios.map(m => m.medio) ?? [];
      const c = parsearComandoFlow(texto, medios, mock.flow.calendario, medio => getFilaFlow(overrides, flowCampanaId, medio).valores);
      if (c) resultado = { tipo: 'flow', cambio: c };
    }
    setEdicionDirecta(resultado);
    setVista2('resultado');
    speech.hablar(explicarEdicion(resultado));
  };

  const confirmarEdicionDirecta = () => {
    if (!edicionDirecta || edicionDirecta.tipo === 'no-entendido') return;
    if (edicionDirecta.tipo === 'brief' && ejercicio) {
      updateBriefField(ejercicio.id, edicionDirecta.cambio.campo, edicionDirecta.cambio.valorNuevo as never);
      push({ kind: 'success', title: 'Brief actualizado', msg: `Ya lo ves en ${ubicarEdicion(edicionDirecta)}` });
    } else if (edicionDirecta.tipo === 'mix' && ejercicio) {
      updateTouchpointInversion(ejercicio.id, edicionDirecta.touchpoint, edicionDirecta.valorNuevo);
      registrarCambioInversion(edicionDirecta.touchpoint, edicionDirecta.valorAnterior, edicionDirecta.valorNuevo);
      push({ kind: 'success', title: 'Mix actualizado', msg: `Ya lo ves en ${ubicarEdicion(edicionDirecta)}` });
    } else if (edicionDirecta.tipo === 'flow' && flowCampanaId) {
      setCeldaFlow(flowCampanaId, edicionDirecta.cambio.medio, edicionDirecta.cambio.semanaIdx, edicionDirecta.cambio.valorNuevo);
      registrarCambioFlow(edicionDirecta.cambio.medio, edicionDirecta.cambio.valorAnterior, edicionDirecta.cambio.valorNuevo);
      push({ kind: 'success', title: 'Flowchart actualizado', msg: `Ya lo ves en ${ubicarEdicion(edicionDirecta)}` });
    }
    volver();
  };

  const iniciarSubir = (plan: PlanPropuesto) => { setConfirmando(plan); setMotivo(plan.descripcion); };

  /** Solo crea la versión pendiente — el mix activo no se toca hasta que se apruebe en Centro de Aprobaciones. */
  const confirmarSubir = () => {
    if (!confirmando || !ejercicio) return;
    const presupuestoBase = ejercicio.exercise.presupuesto || ejercicio.totales.inversion || 1;
    const totalNuevo = confirmando.asignaciones.reduce((s, a) => s + a.inversion, 0);
    crearVersionEjercicio({
      ejercicioBaseId: ejercicio.id, etiqueta: confirmando.nombre, motivo: motivo || confirmando.descripcion,
      autor: `MAYIA (a solicitud de ${ACTOR_POR_ROL[rol]})`, factorPresupuesto: totalNuevo / presupuestoBase,
    });
    push(rol === 'cliente'
      ? { kind: 'success', title: 'Propuesta enviada a tu planner', msg: `"${confirmando.nombre}" quedó pendiente en Aprobaciones.` }
      : { kind: 'success', title: 'Subido para aprobación', msg: `"${confirmando.nombre}" quedó pendiente en Centro de Aprobaciones.` });
    setConfirmando(null);
    volver();
  };

  const onAjustar = (plan: PlanPropuesto) => {
    setTextoLibre(plan.descripcion);
    setPlanes(null);
    setPlanOtro(null);
    setVista2('inicio');
  };

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Ayuda de MAYIA" title="Ayuda de MAYIA"
        style={{
          position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: '50%', zIndex: 1,
          border: '1px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.12)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
        <HelpCircle size={18} />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Ayuda de MAYIA"
          onClick={e => { if (e.target === e.currentTarget) cerrar(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,10,10,0.6)',
            backdropFilter: 'blur(20px) saturate(120%)', WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', padding: '26px 20px 36px',
          }}>
          <button onClick={cerrar} aria-label="Cerrar" style={{ position: 'absolute', top: 22, right: 24, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={19} />
          </button>

          <div style={{ width: 150, marginTop: 8, marginBottom: 2 }}>
            <BrainCanvas accent={colores.primario} height={130} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>MAYIA</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 18 }}>
            Asistente por reglas
          </div>

          <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ── Voz (lectura) ── */}
            {speech.hayVozEsMx && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.65)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={speech.vozActivada} onChange={e => speech.setVozActivada(e.target.checked)} /> Voz activada
                </label>
                {speech.vozActivada && vista2 === 'inicio' && (
                  <button onClick={() => speech.hablando && !speech.pausado ? speech.pausar() : speech.hablando ? speech.reanudar() : speech.hablar(textoAyuda)}
                    style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {speech.hablando && !speech.pausado ? <Pause size={13} /> : <Volume2 size={13} />}
                    {speech.hablando && !speech.pausado ? 'Pausar' : speech.pausado ? 'Reanudar' : 'Escuchar'}
                  </button>
                )}
                {speech.hablando && (
                  <button onClick={speech.detener} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Square size={12} /> Detener
                  </button>
                )}
              </div>
            )}

            {vista2 === 'inicio' && (
              <>
                <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Qué puedes hacer aquí</div>
                  {ayuda.puedes.map((p, i) => <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', margin: '0 0 6px' }}>• {p}</p>)}
                </div>
                {ayuda.monitoreo.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Qué monitorear aquí</div>
                    {ayuda.monitoreo.map((m, i) => <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', margin: '0 0 6px' }}>• {m}</p>)}
                  </div>
                )}

                {(tieneChipsPlan || tieneChipsFlow || tieneChipsAprob) && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 10 }}>¿Qué te gustaría hacer?</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {tieneChipsPlan && <>
                        <button style={btnChip} onClick={() => onChipPlan('general')}>Proponme un plan</button>
                        <button style={btnChip} onClick={() => onChipPlan('recorte')}>Recortar presupuesto</button>
                        <button style={btnChip} onClick={() => onChipPlan('aumento')}>Aumentar presupuesto</button>
                        <button style={btnChip} onClick={onDondePierdoAlcance}>¿Dónde pierdo más alcance?</button>
                      </>}
                      {tieneChipsFlow && <>
                        <button style={btnChip} onClick={onMostrarFallas}>Mostrar fallas de testigo</button>
                        <button style={btnChip} onClick={onQueReclamar}>¿Qué reclamo a los medios?</button>
                      </>}
                      {tieneChipsAprob && <>
                        <button style={btnChip} onClick={onResumirPendientes}>Resumir pendientes</button>
                        <button style={btnChip} onClick={onQueCambio}>¿Qué cambió y por qué?</button>
                      </>}
                    </div>
                    {voz.hayReconocimiento && (
                      <button onClick={onMicPreguntar} style={{ ...btnMic(voz.escuchando), marginTop: 10 }}>
                        <Mic size={13} /> {voz.escuchando ? 'Escuchando…' : 'Preguntar con voz'}
                      </button>
                    )}
                    {tieneChipsPlan && rol !== 'ceo' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <input value={textoLibre} onChange={e => setTextoLibre(e.target.value)} placeholder='Otro plan: "sube TV 10%"'
                          onKeyDown={e => e.key === 'Enter' && onOtroPlan()}
                          style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 13 }} />
                        <button onClick={onOtroPlan} style={btnPrimario}>Proponer</button>
                      </div>
                    )}
                  </div>
                )}

                {tieneEdicionDirecta && voz.hayReconocimiento && (
                  <div style={{ textAlign: 'center', borderTop: (tieneChipsPlan || tieneChipsFlow || tieneChipsAprob) ? '1px solid rgba(255,255,255,.12)' : 'none', paddingTop: (tieneChipsPlan || tieneChipsFlow || tieneChipsAprob) ? 14 : 0 }}>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginBottom: 8 }}>
                      {esBrief && 'Dicta un cambio, por ejemplo "pon el presupuesto en 60 millones" o "la marca a Nova".'}
                      {esMixDirecto && 'Dicta un cambio directo, por ejemplo "sube TV 10%" — se aplica si lo aceptas.'}
                      {esFlowDirecto && 'Dicta un cambio, por ejemplo "sube TV semana 12 diez por ciento".'}
                    </div>
                    <button onClick={onMicEditar} style={btnMic(voz.escuchando)}>
                      <Mic size={13} /> {voz.escuchando ? 'Escuchando…' : 'Dictar un cambio'}
                    </button>
                  </div>
                )}
              </>
            )}

            {vista2 === 'resultado' && (
              <>
                <button onClick={volver} style={{ ...btnGhost, alignSelf: 'flex-start' }}>← Volver</button>

                {respuesta && (
                  <p style={{ fontSize: 15, color: '#fff', lineHeight: 1.6, textAlign: 'center' }}
                     dangerouslySetInnerHTML={{ __html: respuesta.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                )}

                {edicionDirecta && edicionDirecta.tipo !== 'no-entendido' && (
                  <div style={{ border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.06)' }}>
                    <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.55, margin: 0 }}>{explicarEdicion(edicionDirecta)}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={confirmarEdicionDirecta} style={btnPrimario}>Aceptar</button>
                      <button onClick={volver} style={btnGhost}>Cancelar</button>
                    </div>
                  </div>
                )}
                {edicionDirecta?.tipo === 'no-entendido' && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', textAlign: 'center' }}>
                    No entendí qué querías cambiar. Prueba con algo más concreto, con el nombre del campo o del medio y la semana.
                  </p>
                )}

                {planes && ejercicio && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {planes.map((p, i) => esPlanValido(p)
                      ? <TarjetaPlan key={p.id ?? i} plan={p} ejercicio={ejercicio} rol={rol} onSubir={iniciarSubir} onAjustar={onAjustar} />
                      : <div key={i} style={{ border: '1px solid rgba(239,68,68,.4)', borderRadius: 14, padding: 14, background: 'rgba(239,68,68,.08)' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: 13.5 }}>{p.nombre} — no se ofrece</div>
                          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)', margin: '4px 0 0' }}>{p.motivoRechazo}</p>
                        </div>)}
                  </div>
                )}

                {planOtro?.tipo === 'ok' && ejercicio && <TarjetaPlan plan={planOtro.plan} ejercicio={ejercicio} rol={rol} onSubir={iniciarSubir} onAjustar={onAjustar} />}
                {planOtro?.tipo === 'rechazado' && (
                  <div style={{ border: '1px solid rgba(239,68,68,.4)', borderRadius: 14, padding: 14, background: 'rgba(239,68,68,.08)' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 13.5 }}>No se ofrece ese cambio</div>
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)', margin: '4px 0 0' }}>{planOtro.motivo}</p>
                  </div>
                )}
                {planOtro?.tipo === 'no-entendido' && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', textAlign: 'center' }}>
                    No entendí esa instrucción. Prueba con algo como "sube TV 10%" o "recorta Digital 15%", o elige una de las opciones.
                  </p>
                )}
              </>
            )}

            {confirmando && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 2100, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                   onClick={e => { if (e.target === e.currentTarget) setConfirmando(null); }}>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,.18)', borderRadius: 16, padding: 20, maxWidth: 420, width: '100%' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} /> {rol === 'cliente' ? '¿Proponer este plan a tu planner?' : '¿Subir este plan para aprobación?'}
                  </div>
                  <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                    style={{ width: '100%', padding: 10, borderRadius: 9, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 13, resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                    <button onClick={() => setConfirmando(null)} style={btnGhost}>Cancelar</button>
                    <button onClick={confirmarSubir} style={btnPrimario}>Confirmar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
