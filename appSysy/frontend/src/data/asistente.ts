// Cerebro / asistente front-only (sin backend, sin Gemini).
// Conoce el mapa completo de la plataforma: vistas y subsecciones
// (config/menu.ts), los módulos del Cerebro Orquestador (data/plataforma.ts)
// y las cifras de data/media.ts.
import {
  porPeriodo, ULTIMO, CLIENTE, CARTERA, COBERTURA, ALERTAS, MARCAS,
  fmt, fmtMXNCorto, proyeccionSOV,
} from './media';
import { vistas } from '../config/menu';
import { brandingConfig } from '../config/branding';
import { MODULOS_CEREBRO, modulosPorTipo, composicion } from './plataforma';

const D = porPeriodo[ULTIMO];
const { ia } = brandingConfig;

// id de navegación: 'planeacion' (la vista) o 'planeacion:mix-medios' (una
// de sus subsecciones) — el mismo formato que espera `navigate()` en App.tsx.
export type Seccion = { id: string; titulo: string; alias: string[] };

// Alias de voz/búsqueda por vista. Los títulos y subsecciones salen de config/menu.ts.
const ALIAS: Record<string, string[]> = {
  ejecutiva:   ['ejecutiva', 'ceo', 'direccion', 'resumen ejecutivo'],
  cliente:     ['cliente', 'portal', 'anunciante'],
  planeacion:  ['planeacion', 'mesa', 'brief', 'mix', 'medios', 'escenarios'],
  flowchart:   ['flowchart', 'flow', 'calendario', 'pauta'],
  aprobaciones:['aprobaciones', 'aprobar', 'versiones', 'diffs'],
  presupuesto: ['presupuesto', 'budget', 'gasto', 'compromisos'],
  resultados:  ['resultados', 'optimizacion', 'kpis', 'kpi'],
};

export const SECCIONES: Seccion[] = vistas.flatMap(v => [
  { id: v.id, titulo: v.nombre, alias: ALIAS[v.id] ?? [] },
  ...v.subsecciones.map(sub => ({
    id: `${v.id}:${sub.id}`,
    titulo: `${sub.nombre} · ${v.nombre}`,
    alias: [] as string[],
  })),
]);

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Búsqueda del header: coincidencias por título o alias.
export function buscarSeccion(q: string): Seccion[] {
  const t = norm(q).trim();
  if (!t) return [];
  return SECCIONES.filter(s =>
    norm(s.titulo).includes(t) || s.alias.some(a => norm(a).includes(t) || t.includes(norm(a)))
  );
}

const VERBOS_NAV = ['ve al', 've a', 'ir al', 'ir a', 'entra', 'llevame', 'vamos a', 'muestrame', 'muestra', 'abre', 'abrir', 'ir '];

export type Respuesta = { text: string; navigateTo?: string };

export function responder(texto: string): Respuesta {
  const t = norm(texto);

  // ── Navegación por voz ──
  if (VERBOS_NAV.some(v => t.includes(v))) {
    const s = seccionMencionada(t);
    if (s) return { text: `Te llevo a ${s.titulo}.`, navigateTo: s.id };
  }

  // ── Qué es la plataforma / qué puede hacer ──
  if (/(que puedes hacer|que sabes|para que sirves|ayuda|que es esta plataforma|quien eres)/.test(t)) {
    return { text: `Soy ${ia.nombre}, el asistente de la plataforma. Conozco las ${vistas.length} vistas y sus subsecciones, los ${MODULOS_CEREBRO.length} módulos del Cerebro Orquestador y las cifras de la cuenta ${CLIENTE.nombre}. Puedes pedirme que te lleve a una vista ("ve a Presupuesto"), preguntarme qué hace cualquiera de ellas, o consultarme plazas, inversión, alcance, competencia y alertas.` };
  }

  // ── Mapa de vistas ──
  if (/(que vistas|cuantas vistas|que secciones|que hay en la plataforma|menu|navegacion)/.test(t) && !seccionMencionada(t)) {
    const lista = vistas.map(v => `· ${v.nombre}`).join('\n');
    return { text: `La plataforma tiene ${vistas.length} vistas:\n${lista}\nPregúntame por cualquiera para el detalle, o dime "ve a…" para abrirla.` };
  }

  // ── Qué hace una vista o subsección concreta ──
  const sec = seccionMencionada(t);
  if (sec && /(que es|que hace|para que|que veo|que hay en|explicame|de que trata|como funciona|que tiene)/.test(t)) {
    const [vistaId, subId] = sec.id.split(':');
    const vista = vistas.find(v => v.id === vistaId)!;
    const sub = subId ? vista.subsecciones.find(s => s.id === subId) : undefined;
    const desc = sub ? sub.descripcion : vista.descripcion;
    return { text: `${sec.titulo}: ${desc} Dime "ve a ${vista.nombre}" y te llevo.` };
  }

  // ── Módulos del Cerebro Orquestador ──
  if (/(operadores)/.test(t)) return { text: listaModulos('Operador') };
  if (/(modelos predictivos|los modelos|modelo de)/.test(t)) return { text: listaModulos('Modelo') };
  if (/(agentes de insights|insights)/.test(t)) return { text: listaModulos('Agente de Insights') };
  if (/(agentes|los agentes)/.test(t)) return { text: listaModulos('Agente') };
  if (/(modulos|orquestador|cerebro)/.test(t)) {
    return { text: `El Cerebro Orquestador coordina ${MODULOS_CEREBRO.length} módulos: ${composicion()}. Los Agentes operan el flujo de trabajo, los Operadores ejecutan sobre los medios, los Modelos predicen y los Agentes de Insights generan hallazgos. Pregúntame por los Agentes, los Operadores, los Modelos o los Agentes de Insights para el desglose.` };
  }
  const modulo = MODULOS_CEREBRO.find(m => t.includes(norm(m.titulo)) || t.includes(norm(m.titulo.replace(/^(Operador|Modelo|Agente) (de |Predictivo de )?/, ''))));
  if (modulo) {
    return { text: `${modulo.titulo} (${modulo.tag}): ${modulo.descripcion}${modulo.enVivo ? ' Es el único módulo enchufado al monitoreo real.' : ''}` };
  }

  // ── Cartera de clientes ──
  if (/(clientes|cartera|cuentas|marcas que|portafolio)/.test(t)) {
    const top = CARTERA.slice(0, 4).map(c => c.nombre).join(', ');
    return { text: `La cartera tiene ${CARTERA.length} cuentas: ${top} y ${CARTERA.length - 4} más. La que alimenta este tablero es ${CLIENTE.nombre} (${CARTERA[0].categoria}), con ${CARTERA[0].sharePresupuesto}% de la inversión gestionada.` };
  }

  // ── Competencia y set competitivo ──
  if (/(competencia|segunda marca|rival|competidor|contra quien)/.test(t)) {
    const comp = MARCAS.filter(m => !m.esCliente).map(m => m.nombre).join(', ');
    return { text: `${CLIENTE.nombre} compite contra ${comp}. La segunda marca es ${D.segundaMarca} con ${D.lideradasSegunda} plazas lideradas, ${D.plazasLideradas - D.lideradasSegunda} por debajo.` };
  }

  // ── Alertas ──
  if (/(alertas|que paso|novedades|urgente|pendientes)/.test(t)) {
    const altas = ALERTAS.filter(a => a.severidad === 'alta');
    return { text: `Hay ${ALERTAS.length} alertas abiertas, ${altas.length} de severidad alta. La más reciente: ${altas[0].descripcion} (${altas[0].plaza}, ${altas[0].medio}). Revísalas en Dirección Ejecutiva.`, navigateTo: 'ejecutiva:desviaciones' };
  }

  // ── Preguntas sobre los datos ──
  if (/(redes|social|facebook|twitter|instagram|tiktok)/.test(t)) {
    return { text: `En redes la conversación crece: ${fmt(Math.round(D.impactos / 1_000_000))}M de impactos estimados esta semana, +18% vs la anterior. El sentimiento a favor ronda el 46%. Revisa Resultados y Optimización para el detalle por canal.`, navigateTo: 'resultados:por-canal' };
  }
  if (/(a favor|nos ven|como nos ven|sentimiento|percepcion)/.test(t)) {
    return { text: `La audiencia ve a ${CLIENTE.nombre} mayormente a favor: 46% positivo, 34% neutral, 20% negativo. En las plazas líderes el positivo sube.` };
  }
  if (/(que dicen|dicen de|hablan de|menciones|narrativa)/.test(t)) {
    return { text: `Lo que más se dice de ${CLIENTE.nombre}: servicio y disponibilidad (positivo), dudas sobre precio (neutral). ${D.segundaMarca} es la principal competencia con ${D.lideradasSegunda} plazas lideradas.` };
  }
  if (/(ultima mencion|mencion.*radio|radio.*mencion|en radio|on air|al aire)/.test(t)) {
    return { text: `La última mención al aire fue hace 8 min en MVS Radio 102.5, sentimiento positivo.` };
  }
  if (/(plazas|como vamos|share of voice|sov|cuantas plazas)/.test(t)) {
    return { text: `Vamos bien: ${CLIENTE.nombre} lidera ${fmt(D.plazasLideradas)} de ${fmt(D.totalPlazas)} plazas con ${D.sovCliente}% de Share of Voice ponderado (${fmt(D.grpsTotal)} GRPs). Hay ${D.discrepancias.length} plazas con discrepancias de pauta abiertas.`, navigateTo: 'ejecutiva:resumen' };
  }
  if (/(inversion|presupuesto|gasto|cuanto invertimos)/.test(t)) {
    return { text: `La inversión de ${CLIENTE.nombre} en el periodo es ${fmtMXNCorto(D.inversionCliente)} sobre ${fmtMXNCorto(D.inversionTotal)} de categoría. Control Presupuestal tiene el desglose por medio y por marca.`, navigateTo: 'presupuesto:resumen' };
  }
  if (/(alcance|cobertura)/.test(t)) {
    return { text: `El alcance promedio es ${D.alcanceProm}%. Hay ${D.riesgoAlcance.length} plazas por debajo del objetivo de cobertura.`, navigateTo: 'planeacion:alcance-frecuencia' };
  }
  if (/(prediccion|proyeccion|proximo periodo|futuro|forecast)/.test(t)) {
    return { text: `Proyección: si la tendencia se mantiene, ${CLIENTE.nombre} llegaría a ~${proyeccionSOV()}% de SOV el próximo periodo (venía de ${porPeriodo['2023'].sovCliente}% en 2023 a ${D.sovCliente}% en ${ULTIMO}).`, navigateTo: 'resultados:kpis' };
  }
  if (/(que funciona|conectado|en vivo|datos reales)/.test(t)) {
    return { text: `Hoy escuchamos ${fmt(COBERTURA.emisoras)} emisoras en vivo; el resto de las vistas corre con datos estructurados de demo mientras se conecta cada fuente real.` };
  }

  return {
    text: `Puedo llevarte a cualquiera de las ${vistas.length} vistas ("ve a Presupuesto"), explicarte qué hace cada una o qué son los Operadores, Modelos y Agentes de Insights del Cerebro Orquestador. También te respondo cómo vamos en plazas, cuánto invertimos, qué dicen de la marca, cómo va el alcance, quién es la competencia o qué alertas hay abiertas.`,
  };
}

// ── Utilidades de conocimiento ──

/** Devuelve la vista o subsección mencionada en el texto, si la hay. */
function seccionMencionada(t: string): Seccion | undefined {
  return SECCIONES.find(s =>
    norm(s.titulo).split(/\s+/).some(w => w.length > 3 && t.includes(w)) ||
    s.alias.some(a => t.includes(norm(a)))
  );
}

function listaModulos(tipo: Parameters<typeof modulosPorTipo>[0]): string {
  const ms = modulosPorTipo(tipo);
  const lista = ms.map(m => `· ${m.titulo} — ${m.descripcion}`).join('\n');
  return `${ms.length} ${tipo}${ms.length > 1 ? 's' : ''} en el Cerebro Orquestador:\n${lista}`;
}
