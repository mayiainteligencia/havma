import {
  LayoutDashboard,
  Radio,
  BrainCircuit,
  Command,
  ClipboardList,
  Bell,
  Globe,
  MapPin,
  ShieldAlert,
  Palette,
  GraduationCap,
  UserCircle2,
  Target,
  Rows3,
  ListChecks,
  PiggyBank,
  LineChart,
  BarChart3,
  Rocket,
  Gauge,
  ClipboardCheck,
  Megaphone,
  Wallet,
  CalendarRange,
  FileCheck2,
  History,
  FileText,
  Users,
  PieChart,
  Layers,
  CalendarDays,
  Building2,
  Truck,
  CheckCircle2,
  XCircle,
  Handshake,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { brandingConfig } from './branding';

export type EstadoSeccion = 'activo' | 'demo' | 'en-activacion';

export interface ItemMenu {
  id: string;
  nombre: string;
  icono: LucideIcon;
  estado: EstadoSeccion;
  grupo: 'principal' | 'extra';
  /** Una línea de qué hace la sección. La usa el asistente para explicarla. */
  descripcion: string;
}

// Secciones del dashboard anterior, apagadas para el MVP: el código de cada
// una sigue en disco y su caso en el switch de App.tsx. Reemplazadas por las
// 8 vistas de abajo; se conservan aquí solo como referencia si alguna vuelve
// a activarse dentro de una vista nueva.
export const seccionesArchivadas: ItemMenu[] = [
  { id: 'warroom',    nombre: 'War Room de Cliente',          icono: LayoutDashboard, estado: 'demo',          grupo: 'principal',
    descripcion: 'La vista de arranque: cartera de cuentas, Share of Voice por plaza en el mapa de México y los accesos rápidos al resto del tablero.' },
  { id: 'testigos',   nombre: 'Testigos IA',                  icono: Radio,           estado: 'activo',        grupo: 'principal',
    descripcion: 'Monitoreo on-air en vivo: escucha las emisoras, transcribe y verifica que cada spot contratado haya salido al aire. Es la única sección conectada a datos reales.' },
  { id: 'cerebro',    nombre: 'Cerebro Orquestador',          icono: BrainCircuit,    estado: 'en-activacion', grupo: 'principal',
    descripcion: 'La capa que coordina la plataforma: 4 Agentes que operan el flujo de trabajo (intake, tráfico, SLA y presupuesto), 2 Operadores que ejecutan sobre los medios, 2 Modelos que predicen y 2 Agentes de Insights que generan hallazgos.' },
  { id: 'comando',    nombre: 'Comando de Campaña',           icono: Command,         estado: 'demo',          grupo: 'principal',
    descripcion: 'Vista de mando de la campaña en curso: KPIs, alertas del sistema, actividad reciente, inversión por marca y reparto de pauta por franja horaria.' },
  { id: 'investment', nombre: 'Investment Value IA',          icono: ClipboardList,   estado: 'demo',          grupo: 'principal',
    descripcion: 'El valor de la inversión: plazas lideradas, inversión por marca, GRPs, tendencia de Share of Voice y las top plazas por inversión.' },
  { id: 'alertas',    nombre: 'Alertas de Marca',             icono: Bell,            estado: 'demo',          grupo: 'principal',
    descripcion: 'Discrepancias de pauta, menciones negativas, spikes de competencia y ad fraud. Cada alerta se puede convertir en un reclamo al medio.' },
  { id: 'digital',    nombre: 'Monitor Digital & E-Commerce', icono: Globe,           estado: 'en-activacion', grupo: 'principal',
    descripcion: 'Tráfico, embudo de conversión, marketplaces, sentimiento en redes y visibilidad en buscadores y en respuestas de IA (GEO/AEO).' },
  { id: 'ooh',        nombre: 'OOH Planner',                  icono: MapPin,          estado: 'demo',          grupo: 'principal',
    descripcion: 'Inventario exterior real: 775 soportes con tarifa y disponibilidad, el circuito medido con su audiencia por edad y NSE, y un builder para armar circuitos y ver sus métricas.' },
  { id: 'adfraud',    nombre: 'Ad Fraud & Brand Safety',      icono: ShieldAlert,     estado: 'en-activacion', grupo: 'extra',
    descripcion: 'Tráfico inválido, viewability por formato, adyacencia de contenido riesgoso y el presupuesto recuperable de todo eso.' },
  { id: 'studio',     nombre: 'Studio Creativo',              icono: Palette,         estado: 'en-activacion', grupo: 'extra',
    descripcion: 'Sandbox de generación de piezas: del brief a las variantes por formato, con su prueba A/B.' },
  { id: 'academia',   nombre: 'Academia',                     icono: GraduationCap,   estado: 'en-activacion', grupo: 'extra',
    descripcion: 'Rutas de capacitación del AI Acceleration Lab México para equipos de medios, creatividad y datos.' },
];

// Compatibilidad con el menú anterior (hoy vacío: no hay secciones activas
// fuera de las vistas). Nada las consume ya, quedan por si algo externo las
// importa todavía.
export const secciones: ItemMenu[] = [];
export const seccionesPrincipales = secciones.filter(s => s.grupo === 'principal');
export const seccionesExtra = secciones.filter(s => s.grupo === 'extra');

/** Color del punto de estado, tomado de la paleta de branding. */
export const colorEstado = (estado: EstadoSeccion): string => {
  const { colores } = brandingConfig;
  if (estado === 'activo') return colores.exito;
  if (estado === 'demo') return colores.advertencia;
  return colores.textoOscuro;
};

export const tituloEstado: Record<EstadoSeccion, string> = {
  'activo': 'Conectado a datos en vivo',
  'demo': 'Demo con datos estructurados',
  'en-activacion': 'En activación',
};

// ─────────────────────────────────────────────────────────────────────────
// Vistas — la navegación actual de la plataforma.
//
// El resumen de Inicio (MAYIA + KPIs) ya no es una vista propia: es chrome
// permanente que aparece arriba de las 7 vistas de abajo (components/App.tsx).
// El Header trae un selector (dropdown) para elegir entre ellas — ninguna
// tiene "estado", todas son parte del mismo producto. El Sidebar (y en
// móvil la barra inferior + el drawer) muestra las subsecciones de la
// vista activa.
// ─────────────────────────────────────────────────────────────────────────

export interface SubSeccion {
  id: string;
  nombre: string;
  icono: LucideIcon;
  descripcion: string;
}

export interface Vista {
  id: string;
  nombre: string;
  /** Etiqueta corta para la pill del header cuando el espacio aprieta. */
  nombreCorto: string;
  icono: LucideIcon;
  descripcion: string;
  subsecciones: SubSeccion[];
}

export const vistas: Vista[] = [
  {
    id: 'ejecutiva', nombre: 'Dirección Ejecutiva', nombreCorto: 'Ejecutiva', icono: LayoutDashboard,
    descripcion: 'Inversión administrada, campañas activas y resultados contra la meta, para quien dirige la cuenta.',
    subsecciones: [
      { id: 'resumen',                nombre: 'Resumen',                 icono: BarChart3,      descripcion: 'Los números de la cuenta en una sola vista: inversión, cobertura y avance contra meta.' },
      { id: 'campanas-activas',       nombre: 'Campañas activas',        icono: Rocket,         descripcion: 'Todas las campañas que están al aire hoy, con su estatus y presupuesto.' },
      { id: 'desviaciones',           nombre: 'Desviaciones',            icono: Gauge,          descripcion: 'Dónde el plan se aparta de lo ejecutado: medio, plaza o campaña.' },
      { id: 'aprobaciones-pendientes',nombre: 'Aprobaciones pendientes', icono: ClipboardCheck, descripcion: 'Lo que espera una firma antes de seguir adelante.' },
    ],
  },
  {
    id: 'cliente', nombre: 'Portal del Cliente', nombreCorto: 'Cliente', icono: UserCircle2,
    descripcion: 'La vista que ve el anunciante: sus campañas, su presupuesto y sus aprobaciones.',
    subsecciones: [
      { id: 'mis-campanas', nombre: 'Mis campañas', icono: Megaphone,    descripcion: 'Las campañas de la cuenta, con su avance y próximos hitos.' },
      { id: 'presupuesto',  nombre: 'Presupuesto',  icono: Wallet,       descripcion: 'Lo autorizado, lo comprometido y lo que queda por asignar.' },
      { id: 'calendario',   nombre: 'Calendario',   icono: CalendarRange,descripcion: 'El flighting de la campaña en un calendario.' },
      { id: 'aprobaciones', nombre: 'Aprobaciones', icono: FileCheck2,  descripcion: 'Lo que el cliente tiene pendiente de aprobar.' },
      { id: 'historial',    nombre: 'Historial',    icono: History,     descripcion: 'Versiones y cambios anteriores de la campaña.' },
    ],
  },
  {
    id: 'planeacion', nombre: 'Mesa de Planeación', nombreCorto: 'Planeación', icono: Target,
    descripcion: 'Del brief al mix de medios: construir y comparar escenarios antes de salir al aire.',
    subsecciones: [
      { id: 'brief',              nombre: 'Brief',              icono: FileText, descripcion: 'Objetivo, presupuesto y restricciones de la campaña.' },
      { id: 'target-audiencia',   nombre: 'Target & audiencia', icono: Users,    descripcion: 'A quién le habla la campaña: target, edad y universo.' },
      { id: 'mix-medios',         nombre: 'Mix de medios',      icono: PieChart, descripcion: 'Cómo se reparte el presupuesto entre TV, Digital, OOH, Radio y más.' },
      { id: 'escenarios',         nombre: 'Escenarios',         icono: Layers,   descripcion: 'Comparar distintos presupuestos y su efecto en alcance y GRPs.' },
      { id: 'alcance-frecuencia', nombre: 'Alcance & frecuencia', icono: Radio,  descripcion: 'Curvas de alcance acumulado y frecuencia por touchpoint.' },
    ],
  },
  {
    id: 'flowchart', nombre: 'Flowchart Interactivo', nombreCorto: 'Flowchart', icono: Rows3,
    descripcion: 'El calendario de pauta completo: una fila por marca, campaña y medio.',
    subsecciones: [
      { id: 'vista-anual',   nombre: 'Vista anual',   icono: CalendarRange, descripcion: 'Las 52 semanas del año en una sola fila por campaña.' },
      { id: 'vista-mensual', nombre: 'Vista mensual', icono: CalendarDays,  descripcion: 'El detalle semana a semana de un mes.' },
      { id: 'por-marca',     nombre: 'Por marca',     icono: Building2,     descripcion: 'El flow agrupado por marca o categoría.' },
      { id: 'por-medio',     nombre: 'Por medio',     icono: Radio,         descripcion: 'El flow agrupado por medio: TV, Digital, OOH, Radio.' },
      { id: 'por-proveedor', nombre: 'Por proveedor', icono: Truck,         descripcion: 'Qué proveedor factura qué parte del flow.' },
    ],
  },
  {
    id: 'aprobaciones', nombre: 'Centro de Aprobaciones', nombreCorto: 'Aprobaciones', icono: ListChecks,
    descripcion: 'El flujo de versiones: qué cambió, quién lo pidió y qué impacto tiene en presupuesto.',
    subsecciones: [
      { id: 'pendientes',          nombre: 'Pendientes',            icono: ClipboardCheck, descripcion: 'Versiones esperando revisión.' },
      { id: 'aprobadas',           nombre: 'Aprobadas',             icono: CheckCircle2,   descripcion: 'Lo ya autorizado y en marcha.' },
      { id: 'rechazadas',          nombre: 'Rechazadas',            icono: XCircle,        descripcion: 'Lo que se regresó y por qué.' },
      { id: 'historial-versiones', nombre: 'Historial de versiones',icono: History,        descripcion: 'Todas las versiones de un plan, una tras otra.' },
    ],
  },
  {
    id: 'presupuesto', nombre: 'Control Presupuestal', nombreCorto: 'Presupuesto', icono: PiggyBank,
    descripcion: 'Autorizado, asignado, comprometido, ejecutado y el saldo que queda.',
    subsecciones: [
      { id: 'resumen',       nombre: 'Resumen',       icono: BarChart3,     descripcion: 'El estado del presupuesto en un vistazo.' },
      { id: 'por-medio',     nombre: 'Por medio',     icono: Radio,         descripcion: 'Cuánto se asignó y se comprometió por medio.' },
      { id: 'por-marca',     nombre: 'Por marca',     icono: Building2,     descripcion: 'El desglose por marca o cuenta dentro de la cartera.' },
      { id: 'por-trimestre', nombre: 'Por trimestre', icono: CalendarRange, descripcion: 'La evolución del presupuesto trimestre a trimestre.' },
      { id: 'compromisos',   nombre: 'Compromisos',   icono: Handshake,     descripcion: 'Lo comprometido con proveedores, con o sin factura aún.' },
    ],
  },
  {
    id: 'resultados', nombre: 'Resultados y Optimización', nombreCorto: 'Resultados', icono: LineChart,
    descripcion: 'Planeado contra real, los KPIs de la campaña y qué recomienda MAYIA para el siguiente flight.',
    subsecciones: [
      { id: 'dashboard',            nombre: 'Dashboard',            icono: LayoutDashboard, descripcion: 'La foto completa de resultados de la campaña.' },
      { id: 'por-campana',          nombre: 'Por campaña',          icono: Megaphone,       descripcion: 'El desempeño desglosado por campaña.' },
      { id: 'por-canal',            nombre: 'Por canal',            icono: Globe,           descripcion: 'El desempeño desglosado por canal o medio.' },
      { id: 'kpis',                 nombre: 'KPIs',                 icono: Gauge,           descripcion: 'Los indicadores clave contra su meta.' },
      { id: 'recomendaciones-ia',   nombre: 'Recomendaciones IA',   icono: Sparkles,        descripcion: 'Lo que MAYIA sugiere ajustar para el próximo periodo.' },
    ],
  },
];

export const vistaActiva = (id: string): Vista => vistas.find(v => v.id === id) ?? vistas[0];

/** true si `id` es una vista válida del menú actual. */
export const esVista = (id: string): boolean => vistas.some(v => v.id === id);
