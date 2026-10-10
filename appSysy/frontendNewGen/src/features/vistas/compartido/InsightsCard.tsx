import { Sparkles } from 'lucide-react';
import type { Rol } from '../../../domain/auth/types';
import { fmtMXNCorto } from '../../../domain/comun/formato';
import { cumplimientoPct, dineroEnRiesgo, esFalla } from '../../../domain/planeacion/metricas';
import { getMonitoreo, listaVersiones, mock, useOverrides } from '../../../infrastructure/planeacion/store';
import { cumplimientoPorMedio } from '../../../application/planeacion/consultas';
import { Card } from '../../../ui/widgets';
import { ConNegritas, signo } from './util';

/** "Lo que detectamos": frases por plantilla, cada una con la cifra que la respalda. */
export function InsightsCard({ rol }: { rol: Rol }) {
  const o = useOverrides();
  const filas = getMonitoreo();
  const agg = cumplimientoPorMedio(filas);
  const peor = [...agg].sort((a, b) => a.cumplimiento - b.cumplimiento)[0];
  const mejor = [...agg].filter(m => m.cprpReal > 0).sort((a, b) => a.cprpReal - b.cprpReal)[0];
  const riesgo = dineroEnRiesgo(filas);
  const ultima = [...listaVersiones(o)].sort((a, b) => (b.fecha + (b.hora ?? '')).localeCompare(a.fecha + (a.hora ?? '')))[0];

  const frases: Record<Rol, string[]> = {
    planner: [
      peor ? `**${peor.medio}** tiene el peor cumplimiento: ${peor.cumplimiento.toFixed(0)}% de lo planeado.` : '',
      `Hay ${fmtMXNCorto(riesgo)} en riesgo por spots no transmitidos o fuera de horario (${filas.filter(esFalla).length} de ${filas.length} filas).`,
      mejor ? `**${mejor.medio}** tiene el mejor CPRP real: ${fmtMXNCorto(mejor.cprpReal)} por punto.` : '',
      ultima ? `El último cambio ("${ultima.etiqueta}") movió la inversión en ${signo(ultima.delta_inversion ?? 0)}${fmtMXNCorto(ultima.delta_inversion ?? 0)}.` : 'Sin cambios guardados todavía en esta sesión.',
    ],
    ceo: [
      `Inversión administrada: **${fmtMXNCorto(mock.marcas.reduce((s, m) => s + m.presupuesto, 0))}** en ${mock.marcas.length} cuentas.`,
      `Cumplimiento global del monitoreo: **${(filas.reduce((s, f) => s + cumplimientoPct(f), 0) / (filas.length || 1)).toFixed(0)}%**.`,
      `${fmtMXNCorto(riesgo)} en riesgo por fallas de testigo en todo el portafolio.`,
      `${new Set(filas.filter(esFalla).map(f => f.marca_id)).size} de ${mock.marcas.length} marcas tienen al menos una desviación detectada.`,
    ],
  };

  return (
    <Card titulo="Insights automáticos" derecha={<Sparkles size={16} color="var(--accent)" />}>
      <div className="insights">{frases[rol].filter(Boolean).map((f, i) => <p key={i}><ConNegritas texto={f} /></p>)}</div>
    </Card>
  );
}
