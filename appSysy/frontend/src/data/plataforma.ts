// Catálogo de los módulos del Cerebro Orquestador. Vive aquí, y no dentro del
// componente, para que la tarjeta, el modal de detalle y el asistente hablen de
// los mismos módulos con las mismas cifras.
//
// Jerarquía: Agentes operan el flujo de trabajo · Operadores ejecutan sobre los
// medios · Modelos predicen · Agentes de Insights generan hallazgos.

import {
  todosSoportes, soportesCircuito, calcularOOHScore, MAX_IMPACTOS, MXM_TOTAL, TOTAL_INVENTARIO,
} from './ooh';

export type TipoModulo = 'Agente' | 'Operador' | 'Modelo' | 'Agente de Insights';

export type EstadoModulo = 'activo' | 'demo' | 'en-activacion';

export interface SerieGrafica {
  key: string;
  label: string;
  color?: string;
}

export interface GraficaModulo {
  /** barrasH: categórica horizontal · barras: series comparadas · donut · spark */
  tipo: 'barrasH' | 'barras' | 'donut' | 'spark';
  titulo: string;
  ejeX: string;
  series: SerieGrafica[];
  data: Record<string, string | number>[];
}

export interface ModuloCerebro {
  num: number;
  id: string;
  tag: TipoModulo;
  titulo: string;
  descripcion: string;
  estado: EstadoModulo;
  /** Único módulo enchufado al servicio de monitoreo real. */
  enVivo?: boolean;
  metricas: { label: string; valor: string; delta?: string }[];
  grafica: GraficaModulo;
}

// Cifras reales del OOH Opportunity Score: se calculan sobre el inventario que
// ya está cargado, no se escriben a mano. Si el datalab reprocesa los Excel, el
// módulo cambia solo — y nunca muestra un número que la fórmula no produce.
const SCORES = todosSoportes.map(s => calcularOOHScore(s, MAX_IMPACTOS));
const scorePromedio = Math.round(SCORES.reduce((a, b) => a + b, 0) / SCORES.length);
const scoreMaximo = Math.max(...SCORES);
const scoreSobre70 = SCORES.filter(x => x >= 70).length;
const enRango = (min: number, max: number) => SCORES.filter(x => x >= min && x < max).length;
/** Soportes con audiencia medida Y tarifa: los únicos que podrían llegar a score alto. */
const conAmbasFuentes = todosSoportes.filter(s => s.audiencia && s.tarifa_publicada_mxn).length;

const AZUL = '#1E3A8A';
const VERDE = '#22c55e';
const AMBAR = '#f59e0b';
const ROJO = '#ef4444';
const GRIS = '#94a3b8';

export const MODULOS_CEREBRO: ModuloCerebro[] = [
  {
    num: 1, id: 'intake', tag: 'Agente', titulo: 'Intake Agent', estado: 'en-activacion',
    descripcion: 'Recibe el brief, detecta campos faltantes y genera preguntas de clarificación. Crea el expediente de campaña automáticamente con RACI, SLA y checklist.',
    metricas: [
      { label: 'Briefs procesados', valor: '147', delta: '+12 este mes' },
      { label: 'Campos detectados faltantes', valor: '89%', delta: 'precisión' },
      { label: 'Tiempo brief→expediente', valor: '4 min', delta: 'vs 2.5 hrs manual' },
      { label: 'First-time-right rate', valor: '73%', delta: '+8pp vs baseline' },
    ],
    grafica: {
      tipo: 'barras', titulo: 'Briefs recibidos vs. completos', ejeX: 'semana',
      series: [{ key: 'briefs', label: 'Recibidos', color: GRIS }, { key: 'completos', label: 'Completos', color: AZUL }],
      data: [
        { semana: 'S1', briefs: 28, completos: 19 },
        { semana: 'S2', briefs: 35, completos: 27 },
        { semana: 'S3', briefs: 41, completos: 32 },
        { semana: 'S4', briefs: 43, completos: 34 },
      ],
    },
  },
  {
    num: 2, id: 'traffic', tag: 'Agente', titulo: 'Traffic Controller', estado: 'en-activacion',
    descripcion: 'Prioriza, asigna y propone fechas de entrega según la capacidad real de cada hub. Detecta saturación antes de que ocurra.',
    metricas: [
      { label: 'Campañas en flujo activo', valor: '23', delta: '5 en riesgo' },
      { label: 'Utilización promedio hubs', valor: '78%', delta: 'Hub OOH: 94%' },
      { label: 'SLA en riesgo detectados', valor: '5', delta: 'vs 12 anterior' },
      { label: 'Reasignaciones sugeridas', valor: '8', delta: 'esta semana' },
    ],
    grafica: {
      tipo: 'barrasH', titulo: 'Carga por hub (%)', ejeX: 'hub',
      series: [{ key: 'carga', label: 'Carga' }],
      data: [
        { hub: 'TV', carga: 65 }, { hub: 'Radio', carga: 72 }, { hub: 'OOH', carga: 94 },
        { hub: 'Digital', carga: 81 }, { hub: 'Prog.', carga: 58 },
      ],
    },
  },
  {
    num: 3, id: 'sla', tag: 'Agente', titulo: 'SLA Guardian', estado: 'en-activacion',
    descripcion: 'Predice atrasos y escalaciones antes de que ocurran. Semáforo de riesgo por campaña con tiempo restante y dependencias bloqueadas.',
    metricas: [
      { label: 'SLAs activos monitoreados', valor: '67' },
      { label: 'En verde (a tiempo)', valor: '51', delta: '76%' },
      { label: 'En ámbar (riesgo)', valor: '11', delta: '16%' },
      { label: 'En rojo (vencido / crítico)', valor: '5', delta: '7%' },
    ],
    grafica: {
      tipo: 'donut', titulo: 'Semáforo de SLAs', ejeX: 'estado',
      series: [{ key: 'valor', label: 'SLAs' }],
      data: [
        { estado: 'Verde', valor: 51, fill: VERDE },
        { estado: 'Ámbar', valor: 11, fill: AMBAR },
        { estado: 'Rojo', valor: 5, fill: ROJO },
      ],
    },
  },
  {
    num: 4, id: 'budget', tag: 'Agente', titulo: 'Budget Sentinel', estado: 'en-activacion',
    descripcion: 'Detecta desvíos de inversión y cambios de alcance en tiempo real. Alerta antes de que un cambio de tarifa o inventario rompa el plan aprobado.',
    metricas: [
      { label: 'Inversión total monitoreada', valor: '$47.3M MXN', delta: 'este mes' },
      { label: 'Desvíos detectados', valor: '3', delta: 'total $1.2M' },
      { label: 'Alertas de tarifa activas', valor: '7' },
      { label: 'Ahorro estimado detectado', valor: '$890K MXN', delta: 'renegociaciones' },
    ],
    grafica: {
      tipo: 'barras', titulo: 'Planeado vs. ejecutado (MDP)', ejeX: 'mes',
      series: [{ key: 'planeado', label: 'Planeado', color: GRIS }, { key: 'ejecutado', label: 'Ejecutado', color: AZUL }],
      data: [
        { mes: 'May', planeado: 38, ejecutado: 36.2 },
        { mes: 'Jun', planeado: 42, ejecutado: 43.1 },
        { mes: 'Jul', planeado: 47, ejecutado: 47.3 },
      ],
    },
  },
  {
    num: 5, id: 'testigos', tag: 'Operador', titulo: 'Operador de Testigos', estado: 'activo', enVivo: true,
    descripcion: 'Verificación on-air en tiempo real. Escucha emisoras, transcribe menciones y detecta discrepancias entre lo comprado y lo transmitido.',
    metricas: [
      { label: 'Emisoras monitoreadas', valor: '5', delta: 'en vivo' },
      { label: 'Menciones detectadas hoy', valor: '34' },
      { label: 'Discrepancias de pauta', valor: '2', delta: 'alta prioridad' },
      { label: 'Uptime del servicio', valor: '99.2%', delta: '30 días' },
    ],
    grafica: {
      tipo: 'spark', titulo: 'Menciones detectadas por hora', ejeX: 'hora',
      series: [{ key: 'menciones', label: 'Menciones' }],
      data: [
        { hora: '08h', menciones: 3 }, { hora: '10h', menciones: 7 }, { hora: '12h', menciones: 11 },
        { hora: '14h', menciones: 8 }, { hora: '16h', menciones: 5 },
      ],
    },
  },
  {
    num: 6, id: 'pauta', tag: 'Operador', titulo: 'Operador de Pauta', estado: 'en-activacion',
    descripcion: 'Optimización de compra online/offline. Compara lo negociado vs lo publicado y detecta inventario no entregado o mal ejecutado.',
    metricas: [
      { label: 'Líneas de pauta activas', valor: '312' },
      { label: 'Entrega vs. comprado', valor: '94.3%' },
      { label: 'Inventario no entregado', valor: '$340K MXN', delta: 'en proceso' },
      { label: 'Optimizaciones sugeridas', valor: '18', delta: 'esta semana' },
    ],
    grafica: {
      tipo: 'barrasH', titulo: 'Entregado sobre comprado (%)', ejeX: 'medio',
      series: [{ key: 'entregado', label: 'Entregado' }],
      data: [
        { medio: 'TV', entregado: 97 }, { medio: 'Radio', entregado: 99 },
        { medio: 'OOH', entregado: 91 }, { medio: 'Digital', entregado: 96 },
      ],
    },
  },
  {
    num: 7, id: 'mmm', tag: 'Modelo', titulo: 'Modelo de Mix de Medios', estado: 'en-activacion',
    descripcion: 'Atribución de inversión por canal con modelo MMM. Estima la contribución marginal de cada medio al resultado de negocio y proyecta escenarios.',
    metricas: [
      { label: 'Inversión modelada', valor: '$142M MXN', delta: 'últimos 6 meses' },
      { label: 'R² del modelo', valor: '0.87', delta: 'buena precisión' },
      { label: 'Mayor contribuyente', valor: 'TV abierta', delta: '34% del efecto' },
      { label: 'Canal subinvertido', valor: 'OOH', delta: '+12% rendimiento marginal' },
    ],
    grafica: {
      tipo: 'donut', titulo: 'Contribución por canal (%)', ejeX: 'canal',
      series: [{ key: 'contribucion', label: 'Contribución' }],
      data: [
        { canal: 'TV', contribucion: 34 }, { canal: 'Digital', contribucion: 28 },
        { canal: 'OOH', contribucion: 18 }, { canal: 'Radio', contribucion: 12 },
        { canal: 'Otros', contribucion: 8 },
      ],
    },
  },
  {
    num: 8, id: 'ooh_score', tag: 'Modelo', titulo: 'Modelo OOH Opportunity Score', estado: 'demo',
    descripcion: 'Califica soportes OOH por afinidad de audiencia × alcance incremental × proximidad a PDV ÷ costo ajustado. Conectado al OOH Planner. El score mejora cuando se cruzan audiencia + tarifa por soporte: hoy el circuito medido trae audiencia sin tarifa y el inventario trae tarifa sin audiencia, así que ningún soporte puntúa completo. Se destraba cuando el proveedor entregue ambas fuentes en un solo archivo.',
    metricas: [
      { label: 'Soportes evaluados', valor: String(TOTAL_INVENTARIO), delta: `${soportesCircuito.length} medidos + ${MXM_TOTAL} inventario` },
      { label: 'Score promedio', valor: `${scorePromedio}/100`, delta: `techo actual ${scoreMaximo}/100 por datos incompletos` },
      { label: 'Soportes score >70', valor: String(scoreSobre70), delta: `${conAmbasFuentes} soportes con audiencia y tarifa` },
      { label: 'Ahorro potencial', valor: '~$420K MXN', delta: 'estimado, pendiente de medición' },
    ],
    grafica: {
      tipo: 'barrasH', titulo: 'Distribución de scores', ejeX: 'rango',
      series: [{ key: 'count', label: 'Soportes' }],
      data: [
        { rango: '0-40', count: enRango(0, 40) }, { rango: '40-60', count: enRango(40, 60) },
        { rango: '60-80', count: enRango(60, 80) }, { rango: '80-100', count: enRango(80, 101) },
      ],
    },
  },
  {
    num: 9, id: 'competencia', tag: 'Agente de Insights', titulo: 'Agente de Competencia', estado: 'en-activacion',
    descripcion: 'Monitorea share of voice y movimientos del mercado. Detecta cambios de presión, lanzamientos creativos y entrada a nuevas plazas.',
    metricas: [
      { label: 'Marcas monitoreadas', valor: '8', delta: '3 competidores directos' },
      { label: 'SOV cliente este mes', valor: '24.3%', delta: '+2.1pp vs anterior' },
      { label: 'Alertas de competencia', valor: '3', delta: 'esta semana' },
      { label: 'Creatividades detectadas', valor: '12', delta: 'de competidores' },
    ],
    grafica: {
      tipo: 'barras', titulo: 'Share of Voice semanal (%)', ejeX: 'semana',
      series: [
        { key: 'cliente', label: 'Cliente', color: AZUL },
        { key: 'comp1', label: 'Comp. 1', color: GRIS },
        { key: 'comp2', label: 'Comp. 2', color: '#cbd5e1' },
      ],
      data: [
        { semana: 'S1', cliente: 22, comp1: 31, comp2: 28 },
        { semana: 'S2', cliente: 23, comp1: 29, comp2: 27 },
        { semana: 'S3', cliente: 24, comp1: 28, comp2: 29 },
        { semana: 'S4', cliente: 24.3, comp1: 27, comp2: 28 },
      ],
    },
  },
  {
    num: 10, id: 'anomalias', tag: 'Agente de Insights', titulo: 'Agente de Anomalías', estado: 'en-activacion',
    descripcion: 'Detecta fraude publicitario, discrepancias de pauta y gasto desperdiciado. Conectado a ad verification y al Operador de Testigos.',
    metricas: [
      { label: 'Anomalías detectadas este mes', valor: '23' },
      { label: 'Tráfico inválido identificado', valor: '3.2%', delta: 'de impresiones' },
      { label: 'Gasto en riesgo', valor: '$234K MXN', delta: 'en revisión' },
      { label: 'Discrepancias OOH', valor: '2', delta: 'alta prioridad' },
    ],
    grafica: {
      tipo: 'barrasH', titulo: 'Anomalías por tipo', ejeX: 'tipo',
      series: [{ key: 'count', label: 'Casos' }],
      data: [
        { tipo: 'Ad fraud', count: 11 }, { tipo: 'Discrepancia pauta', count: 7 },
        { tipo: 'Viewability baja', count: 3 }, { tipo: 'Colocación incorrecta', count: 2 },
      ],
    },
  },
];

export const modulosPorTipo = (tipo: TipoModulo) => MODULOS_CEREBRO.filter(m => m.tag === tipo);

/** Color del badge de categoría. */
export const COLOR_CATEGORIA: Record<TipoModulo, string> = {
  'Agente': '#1E3A8A',              // azul oscuro
  'Agente de Insights': '#8B5CF6',  // púrpura
  'Operador': '#F97316',            // naranja
  'Modelo': '#15803D',              // verde oscuro
};

/** Punto + etiqueta del estado del módulo. */
export const ESTADO_MODULO: Record<EstadoModulo, { texto: string; color: string }> = {
  'activo': { texto: 'En vivo', color: '#22c55e' },
  'demo': { texto: 'Demo', color: '#f59e0b' },
  'en-activacion': { texto: 'Próximamente', color: '#94a3b8' },
};

/** Composición del cerebro, para textos que la enumeran. */
export const composicion = (): string =>
  (['Agente', 'Operador', 'Modelo', 'Agente de Insights'] as TipoModulo[])
    .map(t => {
      const n = modulosPorTipo(t).length;
      const plural = t === 'Agente de Insights' ? 'Agentes de Insights' : `${t}s`;
      return `${n} ${n === 1 ? t : plural}`;
    })
    .join(' · ');
