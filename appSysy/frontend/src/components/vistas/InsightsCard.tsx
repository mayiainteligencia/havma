// "Lo que detectamos" — insights por plantilla (sin LLM): cada frase cita la
// cifra que la respalda, calculada con metricas.ts sobre seed_monitoreo.ts.
import React from 'react';
import { Sparkles } from 'lucide-react';
import { brandingConfig } from '../../config/branding';
import { fmtMXNCorto } from '../../data/media';
import { getMonitoreo, listaVersiones, mock, useOverrides } from '../../data/store';
import { cumplimientoPct, cprpReal, dineroEnRiesgo, esFalla } from '../../data/metricas';
import type { Rol } from '../../data/types';
import { Panel } from '../shared/ui';

function porMedio(filas: ReturnType<typeof getMonitoreo>) {
  const grupos = new Map<string, typeof filas>();
  filas.forEach(f => grupos.set(f.medio, [...(grupos.get(f.medio) ?? []), f]));
  return [...grupos.entries()].map(([medio, fs]) => ({
    medio,
    cumplimiento: fs.reduce((s, f) => s + cumplimientoPct(f), 0) / fs.length,
    cprp: fs.map(cprpReal).filter((x): x is number => x !== null).reduce((s, x, _, a) => s + x / a.length, 0),
  }));
}

export const InsightsCard: React.FC<{ rol: Rol; marcaId?: string }> = ({ rol, marcaId }) => {
  const { colores } = brandingConfig;
  const overrides = useOverrides();
  const todas = getMonitoreo();
  const filas = marcaId ? todas.filter(f => f.marca_id === marcaId) : todas;
  const agg = porMedio(filas);
  const peorMedio = [...agg].sort((a, b) => a.cumplimiento - b.cumplimiento)[0];
  const mejorMedio = [...agg].filter(m => m.cprp > 0).sort((a, b) => a.cprp - b.cprp)[0];
  const enRiesgo = dineroEnRiesgo(filas);
  const versiones = listaVersiones(overrides).filter(v => !marcaId || mock.marcas.find(m => m.id === marcaId)?.ejercicio_id === v.ejercicio_base_id);
  const ultimaVersion = [...versiones].sort((a, b) => (b.fecha + (b.hora ?? '')).localeCompare(a.fecha + (a.hora ?? '')))[0];

  const frasesPorRol: Record<Rol, string[]> = {
    planner: [
      peorMedio ? `**${peorMedio.medio}** tiene el peor cumplimiento: ${peorMedio.cumplimiento.toFixed(0)}% de lo planeado.` : '',
      `Hay ${fmtMXNCorto(enRiesgo)} en riesgo por spots no transmitidos o fuera de horario (${filas.filter(esFalla).length} de ${filas.length} filas).`,
      mejorMedio ? `**${mejorMedio.medio}** tiene el mejor CPRP real: ${fmtMXNCorto(mejorMedio.cprp)} por punto.` : '',
      ultimaVersion ? `El último cambio ("${ultimaVersion.etiqueta}") movió la inversión en ${(ultimaVersion.delta_inversion ?? 0) >= 0 ? '+' : ''}${fmtMXNCorto(ultimaVersion.delta_inversion ?? 0)}.` : 'Sin cambios guardados todavía en esta sesión.',
    ],
    ceo: [
      `Inversión administrada: ${fmtMXNCorto(mock.marcas.reduce((s, m) => s + m.presupuesto, 0))} en ${mock.marcas.length} cuentas.`,
      `Cumplimiento global del monitoreo: ${(filas.reduce((s, f) => s + cumplimientoPct(f), 0) / (filas.length || 1)).toFixed(0)}%.`,
      `${fmtMXNCorto(enRiesgo)} en riesgo por fallas de testigo en todo el portafolio.`,
      `${new Set(filas.filter(esFalla).map(f => f.marca_id)).size} de ${mock.marcas.length} marcas tienen al menos una desviación detectada.`,
    ],
    cliente: [
      peorMedio ? `Tu medio con más atención pendiente es **${peorMedio.medio}** (${peorMedio.cumplimiento.toFixed(0)}% de cumplimiento).` : 'Sin filas de monitoreo para esta marca todavía.',
      enRiesgo > 0 ? `${fmtMXNCorto(enRiesgo)} de tu inversión está en riesgo de no haberse transmitido como se contrató.` : 'No hay inversión en riesgo detectada para tu marca.',
      ultimaVersion ? `La última propuesta ("${ultimaVersion.etiqueta}") cambia la inversión en ${(ultimaVersion.delta_inversion ?? 0) >= 0 ? '+' : ''}${fmtMXNCorto(ultimaVersion.delta_inversion ?? 0)} — está ${ultimaVersion.estado}.` : 'Sin propuestas nuevas pendientes de tu revisión.',
    ],
  };

  return (
    <Panel
      title="Insights automáticos"
      icon={<div style={{ width: 30, height: 30, borderRadius: 9, background: `${colores.primario}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={16} color={colores.primario} /></div>}
      style={{ marginBottom: 18 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {frasesPorRol[rol].filter(Boolean).map((f, i) => (
          <p key={i} style={{ margin: 0, fontSize: 13.5, color: colores.textoMedio, lineHeight: 1.5 }}
             dangerouslySetInnerHTML={{ __html: f.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${colores.textoClaro}">$1</strong>`) }} />
        ))}
      </div>
    </Panel>
  );
};
