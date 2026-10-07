// Contenido del asistente MAYIA por pantalla y rol — "Asistente por reglas":
// texto fijo, sin LLM. Cada pantalla declara qué puede hacer cada rol y qué
// debe vigilar. Lo simulado se dice explícito ("con datos de muestra").
import type { Rol } from './types';

export interface AyudaContenido { puedes: string[]; monitoreo: string[] }
export type AyudaPantalla = Record<Rol, AyudaContenido>;

export const AYUDA: Record<string, AyudaPantalla> = {
  'planeacion:brief': {
    planner: {
      puedes: ['Editar anunciante, marca, campaña, periodo y moneda — solo cambia la etiqueta en pantalla.', 'Editar el presupuesto: es el único campo que recalcula Escenarios y el efecto en vivo del mix.'],
      monitoreo: ['El origen del ejercicio (real, importado o simulado), arriba a la derecha del panel.'],
    },
    ceo: { puedes: ['Solo lectura: ver el brief vigente de la cuenta activa.'], monitoreo: ['El presupuesto autorizado y el periodo de la campaña.'] },
    cliente: { puedes: ['Solo lectura: ver el brief de tu campaña.'], monitoreo: ['Que el periodo y el presupuesto coincidan con lo acordado con tu planner.'] },
  },
  'planeacion:escenarios': {
    planner: {
      puedes: ['Mover el slider de presupuesto y ver el efecto en vivo sobre alcance, GRPs y CPRP.', 'Pedirle a MAYIA que proponga un plan de recorte o aumento con los botones de abajo.'],
      monitoreo: ['El semáforo de cuadre: si el mix no coincide con el presupuesto del brief, se pone en rojo.'],
    },
    ceo: { puedes: ['Solo lectura: ver cómo cambiaría el alcance con distintos presupuestos.'], monitoreo: ['El rango de escenarios disponibles y el alcance esperado en cada uno.'] },
    cliente: { puedes: ['Solo lectura: ver los escenarios ya calculados para tu campaña.'], monitoreo: ['Cuánto alcance ganarías o perderías si cambia tu presupuesto.'] },
  },
  'planeacion:mix-medios': {
    planner: {
      puedes: ['Editar la inversión de cada touchpoint a mano.', 'Pedirle a MAYIA "Proponme un plan" para ver 2–3 mezclas calculadas y aplicar la que prefieras.'],
      monitoreo: ['Las restricciones mínimo/máximo de cada touchpoint — si llegas al límite, no se deja pasar.'],
    },
    ceo: { puedes: ['Solo lectura: ver cómo está repartido el presupuesto entre medios.'], monitoreo: ['Qué touchpoint concentra más inversión y cuál tiene mejor eficiencia (CPRP).'] },
    cliente: { puedes: ['Solo lectura: ver el mix de medios de tu campaña.'], monitoreo: ['Si algún medio está cerca de su tope de inversión permitido.'] },
  },
  'planeacion:alcance-frecuencia': {
    planner: { puedes: ['Ver las curvas de alcance acumulado y frecuencia por touchpoint — no se edita aquí.'], monitoreo: ['Qué touchpoint pierde más alcance si se recorta — pregúntaselo a MAYIA.'] },
    ceo: { puedes: ['Solo lectura: comparar alcance y frecuencia entre touchpoints.'], monitoreo: ['Si algún touchpoint tiene frecuencia muy por arriba o abajo del resto.'] },
    cliente: { puedes: ['Solo lectura: ver cómo llega tu campaña a la audiencia.'], monitoreo: ['El alcance acumulado de tu campaña contra el objetivo.'] },
  },
  flowchart: {
    planner: {
      puedes: ['Editar cualquier celda del calendario y confirmar el reparto por medio.', 'Guardar los cambios como una nueva versión pendiente de aprobación.'],
      monitoreo: ['Las celdas en rojo: ahí el testigo real encontró una falla (no transmitido o fuera de horario) — con datos de muestra.'],
    },
    ceo: { puedes: ['Solo lectura: ver el calendario completo de pauta por campaña.'], monitoreo: ['Cuánto dinero está en riesgo por fallas de testigo en el portafolio — con datos de muestra.'] },
    cliente: { puedes: ['Solo lectura: ver el calendario de tu campaña.'], monitoreo: ['Si algún spot tuyo no salió al aire como se planeó — con datos de muestra.'] },
  },
  aprobaciones: {
    planner: { puedes: ['Guardar versiones del plan o del Flowchart para que se revisen.', 'Restaurar cualquier versión anterior — nunca se borra nada.'], monitoreo: ['Qué versiones siguen pendientes de firma y hace cuánto se guardaron.'] },
    ceo: { puedes: ['Solo lectura: ver el historial completo de versiones y su estado.'], monitoreo: ['Las aprobaciones pendientes de mayor monto — con datos de muestra.'] },
    cliente: { puedes: ['Aprobar o rechazar las propuestas de tu campaña, con un comentario.'], monitoreo: ['Qué cambió en cada propuesta antes de decidir — usa el comparador lado a lado.'] },
  },
  presupuesto: {
    planner: { puedes: ['Ver el detalle de autorizado, comprometido y ejecutado por medio, marca y trimestre.'], monitoreo: ['El dinero en riesgo por fallas de testigo, calculado directo del monitoreo — con datos de muestra.'] },
    ceo: { puedes: ['Solo lectura: ver el estado del presupuesto de todo el portafolio.'], monitoreo: ['Alerta roja solo si lo ejecutado excede lo autorizado, o si hay dinero en riesgo.'] },
    cliente: { puedes: ['Solo lectura: ver el presupuesto autorizado y comprometido de tu cuenta.'], monitoreo: ['Cuánto te queda disponible del presupuesto aprobado.'] },
  },
  cliente: {
    planner: { puedes: ['Esta pantalla es la que ve el anunciante — aquí solo revisas cómo se ve del otro lado.'], monitoreo: ['Que la info coincida con lo que tú autorizaste en Mesa de Planeación.'] },
    ceo: { puedes: ['Solo lectura: revisar lo que ve el cliente final.'], monitoreo: ['Si el cliente tiene aprobaciones pendientes acumulándose.'] },
    cliente: { puedes: ['Ver tus campañas, presupuesto, calendario y aprobaciones pendientes.'], monitoreo: ['Tu próximo hito y qué tienes pendiente de aprobar.'] },
  },
  ejecutiva: {
    planner: { puedes: ['Vista de referencia — tu trabajo de edición vive en Mesa de Planeación.'], monitoreo: ['El ranking de eficiencia por marca, para saber dónde enfocar el siguiente ajuste.'] },
    ceo: { puedes: ['Solo lectura: inversión administrada, desviaciones y aprobaciones pendientes por monto.'], monitoreo: ['Cuántas marcas tienen al menos una desviación detectada — con datos de muestra.'] },
    cliente: { puedes: ['No disponible para tu rol — tu vista equivalente es Portal del Cliente.'], monitoreo: [] },
  },
  resultados: {
    planner: { puedes: ['Ver planeado contra real y las recomendaciones para el siguiente flight.'], monitoreo: ['Qué canal está por debajo de su meta de KPI.'] },
    ceo: { puedes: ['Solo lectura: resultados de campaña contra meta.'], monitoreo: ['El share of voice y los focos de atención del portafolio.'] },
    cliente: { puedes: ['Solo lectura: resultados de tu campaña y recomendaciones.'], monitoreo: ['Cómo va tu campaña contra la meta acordada.'] },
  },
};

const SUBS_PLANEACION = new Set(['brief', 'escenarios', 'mix-medios', 'alcance-frecuencia']);

export const ayudaKey = (vistaId: string, subId: string): string =>
  vistaId === 'planeacion' && SUBS_PLANEACION.has(subId) ? `planeacion:${subId}` : vistaId;

export function getAyuda(vistaId: string, subId: string, rol: Rol): AyudaContenido {
  const key = ayudaKey(vistaId, subId);
  return AYUDA[key]?.[rol] ?? { puedes: ['Sin ayuda específica para esta pantalla todavía.'], monitoreo: [] };
}
