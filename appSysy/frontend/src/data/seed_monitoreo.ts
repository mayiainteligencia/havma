// Datos semilla del monitoreo de medios (testigos). 100% simulado, con una
// semilla fija: misma tabla en cada carga. Cubre el mismo año que el Flow
// real (dic 2024 – dic 2025) y seis el mismo calendario semanal, así el
// Flowchart puede cruzar sus celdas contra estas filas por fecha real (ver
// metricas.ts → semanaIndexDeFecha), no con un supuesto.
//
// La estacionalidad del mercado mexicano viene de una tabla que nos pasó el
// cliente (enero bajo con bonificaciones, mayo con el primer pico, jul-ago
// con la caída de encendido matutino de TV y el alza de digital/radio de
// mediodía, nov-dic con la saturación máxima del año) — ver ESTACIONALIDAD.
import mockRaw from './mock.json';
import type { MockData } from './types';

const mock = mockRaw as unknown as MockData;

export type Medio = 'TV Abierta' | 'Radio' | 'Digital';

export interface FilaMonitoreo {
  id: string;
  medio: Medio;
  cadena_plataforma: string;
  formato_programa: string;
  fecha: string;    // dd/mm/yyyy, o "dd-dd/mm/yyyy" para bloques quincenales de Digital
  horario: string;
  target: string;
  trp_plan: number;
  inversion_plan: number;
  trp_real: number;
  monitoreo: string; // texto del testigo: "Transmitido OK" | "No transmitido" | "Fuera de horario (HH:MM)" | "Reporte Comscore OK"
  marca_id: string;
  campana: string;
  /** Nota de temporada, solo en las filas ancla de la tabla de estacionalidad — el resto no la trae. */
  nota?: string;
}

// ── PRNG determinista (mulberry32) — misma semilla, misma secuencia siempre ──
function mulberry32(semilla: number) {
  let s = semilla;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260415); // semilla fija del proyecto
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const entre = (min: number, max: number) => min + rand() * (max - min);
const redondo = (n: number, dec = 1) => Math.round(n * 10 ** dec) / 10 ** dec;
const fechaStr = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

// ── Estacionalidad del mercado (ene 2025 – dic 2025; diciembre 2024 reusa el perfil de diciembre) ──
interface Estacion {
  deliveryMin: number; deliveryMax: number; // rango de trp_real / trp_plan en un spot "normal" de ese mes
  tasaFalla: number;                        // probabilidad de "No transmitido" o "Fuera de horario" en TV/Radio
  inflacionCPRP: number;                    // multiplicador sobre inversion_plan (sube el CPRP sin tocar TRPs)
  tvMananaExtra: number;                    // penalización extra a trp_real de TV mañana (verano)
  digitalBono: number;                      // bono a trp_real de Digital (verano / Hot Sale)
  nota: string;
}
const ESTACIONALIDAD: Record<number, Estacion> = {
  0: { deliveryMin: 1.00, deliveryMax: 1.05, tasaFalla: 0.01, inflacionCPRP: 0.95, tvMananaExtra: 1, digitalBono: 1, nota: 'Cuesta de enero — bonificaciones entregadas' },
  1: { deliveryMin: 1.00, deliveryMax: 1.05, tasaFalla: 0.01, inflacionCPRP: 0.95, tvMananaExtra: 1, digitalBono: 1, nota: 'Cuesta de enero — alta disponibilidad' },
  2: { deliveryMin: 0.95, deliveryMax: 1.03, tasaFalla: 0.03, inflacionCPRP: 1.00, tvMananaExtra: 1, digitalBono: 1, nota: 'Ejecución limpia' },
  3: { deliveryMin: 0.93, deliveryMax: 1.02, tasaFalla: 0.04, inflacionCPRP: 1.00, tvMananaExtra: 1, digitalBono: 1, nota: 'Mes neutro' },
  4: { deliveryMin: 0.92, deliveryMax: 1.02, tasaFalla: 0.06, inflacionCPRP: 1.05, tvMananaExtra: 1, digitalBono: 1.02, nota: 'Día de las Madres / Hot Sale — primer pico del año' },
  5: { deliveryMin: 0.93, deliveryMax: 1.02, tasaFalla: 0.04, inflacionCPRP: 1.00, tvMananaExtra: 1, digitalBono: 1, nota: 'Mes neutro' },
  6: { deliveryMin: 0.85, deliveryMax: 0.98, tasaFalla: 0.08, inflacionCPRP: 1.04, tvMananaExtra: 0.90, digitalBono: 1.03, nota: 'Vacaciones de verano — cae el encendido matutino de TV' },
  7: { deliveryMin: 0.85, deliveryMax: 0.98, tasaFalla: 0.08, inflacionCPRP: 1.04, tvMananaExtra: 0.90, digitalBono: 1.03, nota: 'Vacaciones de verano — sube digital y radio de mediodía' },
  8: { deliveryMin: 0.93, deliveryMax: 1.02, tasaFalla: 0.04, inflacionCPRP: 1.00, tvMananaExtra: 1, digitalBono: 1, nota: 'Mes neutro' },
  9: { deliveryMin: 0.93, deliveryMax: 1.02, tasaFalla: 0.04, inflacionCPRP: 1.00, tvMananaExtra: 1, digitalBono: 1, nota: 'Mes neutro' },
  10: { deliveryMin: 0.80, deliveryMax: 0.95, tasaFalla: 0.18, inflacionCPRP: 1.25, tvMananaExtra: 1, digitalBono: 1, nota: 'Buen Fin — máxima saturación, medios sobre-venden espacios' },
  11: { deliveryMin: 0.85, deliveryMax: 0.98, tasaFalla: 0.15, inflacionCPRP: 1.20, tvMananaExtra: 1, digitalBono: 1, nota: 'Navidad — sobreventa, desplazamientos de pauta' },
};
const estacionDe = (fecha: Date): Estacion => ESTACIONALIDAD[fecha.getMonth()];

const CAMPANAS = ['Lanzamiento Primavera', 'Reactivación Abril', 'Promo Fin de Semana', 'Campaña Institucional', 'Impulso Trimestral', 'Hot Sale', 'Buen Fin', 'Campaña Navideña'];
const marcaId = () => pick(mock.marcas).id;
const campana = () => pick(CAMPANAS);

const TV_PRIME: [string, string][] = [
  ['TVP-TUDN', 'Fútbol Liga MX'], ['Azteca 7', 'Box Azteca'], ['Las Estrellas', 'Noche de Estrellas'],
  ['Azteca Uno', 'Deportes en Vivo'], ['Canal 5', 'Gala de Verano'],
];
const TV_MANANA: [string, string][] = [
  ['Azteca Uno', 'Venga la Alegría'], ['Las Estrellas', 'Hoy'], ['Canal 5', 'Sale el Sol'], ['Azteca 7', 'Buenos Días'],
];
const RADIO_NOTICIEROS: [string, string][] = [
  ['Grupo Fórmula', 'Ciro por la Mañana'], ['MVS', 'Aristegui'], ['Radio Centro', 'En los Tiempos de la Radio'],
  ['ADN40 Radio', 'Imagen Informativa'], ['Exa FM', 'La Mesa Caliente'],
];
const DIGITAL_FORMATOS: [string, string][] = [
  ['YouTube', 'Bumper 6s'], ['Spotify', 'Audio 20s'], ['Meta', 'Video 15s'], ['TikTok', 'Story 9:16'],
];
const TARGETS = ['25-44 ABC+', 'P18-55 ABC+C', 'P18-35 ABC+C', 'AC 25-50 ABC+C'];

function horaAleatoria(desde: number, hasta: number): string {
  const h = Math.floor(entre(desde, hasta));
  const m = pick([0, 15, 20, 30, 45]);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Fallas de testigo con tasa y rango de entrega de la estación del año — Nov/Dic fallan mucho más que Ene/Feb. */
function testigoTV_Radio(horarioPlan: string, trpPlan: number, est: Estacion, extraDelivery = 1): { monitoreo: string; trpReal: number } {
  const r = rand();
  if (r < est.tasaFalla * 0.6) return { monitoreo: 'No transmitido', trpReal: 0 };
  if (r < est.tasaFalla) {
    const [h, m] = horarioPlan.split(':').map(Number);
    // en temporada alta el desplazamiento es más severo (hasta la madrugada), no solo ±45 min
    const desfase = est.tasaFalla > 0.1 ? pick([-300, -240, 180, 240, 300]) : pick([-45, -30, -20, 20, 30, 45]);
    const total = ((h * 60 + m + desfase) + 24 * 60) % (24 * 60);
    const horaReal = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    return { monitoreo: `Fuera de horario (${horaReal})`, trpReal: redondo(trpPlan * entre(est.deliveryMin, est.deliveryMax) * extraDelivery) };
  }
  return { monitoreo: 'Transmitido OK', trpReal: redondo(trpPlan * entre(est.deliveryMin, est.deliveryMax) * extraDelivery) };
}

function generarTV(prime: boolean, fecha: Date): FilaMonitoreo {
  const est = estacionDe(fecha);
  const [cadena, programa] = pick(prime ? TV_PRIME : TV_MANANA);
  const trpPlan = redondo(prime ? entre(2.5, 6.0) : entre(1.0, 2.5));
  const horario = horaAleatoria(prime ? 19 : 7, prime ? 22 : 11);
  const extra = prime ? 1 : est.tvMananaExtra; // la caída de verano solo pega en la franja matutina
  const { monitoreo, trpReal } = testigoTV_Radio(horario, trpPlan, est, extra);
  return {
    id: `mon-${fecha.getTime()}-${Math.floor(rand() * 1e6)}`, medio: 'TV Abierta', cadena_plataforma: cadena,
    formato_programa: programa, fecha: fechaStr(fecha), horario, target: pick(TARGETS), trp_plan: trpPlan,
    inversion_plan: Math.round((prime ? entre(60000, 120000) : entre(20000, 50000)) * est.inflacionCPRP),
    trp_real: trpReal, monitoreo, marca_id: marcaId(), campana: campana(),
  };
}

function generarRadio(fecha: Date): FilaMonitoreo {
  const est = estacionDe(fecha);
  const [cadena, programa] = pick(RADIO_NOTICIEROS);
  const trpPlan = redondo(entre(0.3, 1.2));
  const horario = horaAleatoria(6, 9);
  const { monitoreo, trpReal } = testigoTV_Radio(horario, trpPlan, est);
  return {
    id: `mon-${fecha.getTime()}-${Math.floor(rand() * 1e6)}`, medio: 'Radio', cadena_plataforma: cadena,
    formato_programa: programa, fecha: fechaStr(fecha), horario, target: pick(TARGETS), trp_plan: trpPlan,
    inversion_plan: Math.round(entre(5000, 15000) * est.inflacionCPRP), trp_real: trpReal, monitoreo,
    marca_id: marcaId(), campana: campana(),
  };
}

function generarDigital(inicioMes: Date): FilaMonitoreo {
  const est = estacionDe(inicioMes);
  const [plataforma, formato] = pick(DIGITAL_FORMATOS);
  const trpPlan = redondo(entre(5, 15));
  const quincena1 = rand() < 0.5;
  const dd1 = quincena1 ? 1 : 16;
  const dd2 = quincena1 ? 15 : new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0).getDate();
  const fecha = `${String(dd1).padStart(2, '0')}-${String(dd2).padStart(2, '0')}/${String(inicioMes.getMonth() + 1).padStart(2, '0')}/${inicioMes.getFullYear()}`;
  return {
    id: `mon-${inicioMes.getTime()}-${Math.floor(rand() * 1e6)}`, medio: 'Digital', cadena_plataforma: plataforma,
    formato_programa: formato, fecha, horario: '24 hrs', target: pick(TARGETS), trp_plan: trpPlan,
    inversion_plan: Math.round(entre(8000, 20000) * est.inflacionCPRP),
    trp_real: redondo(trpPlan * entre(est.deliveryMin, est.deliveryMax) * est.digitalBono),
    monitoreo: 'Reporte Comscore OK', marca_id: marcaId(), campana: campana(),
  };
}

// Filas ancla: las 7 originales más las 9 de la tabla de estacionalidad mensual
// (vista agregada dic 2024–dic 2025) que trajo el cliente, tal cual sus cifras.
const SEMILLA: FilaMonitoreo[] = [
  { id: 'mon-seed-1', medio: 'TV Abierta', cadena_plataforma: 'Azteca Uno', formato_programa: 'Venga la Alegría', fecha: '15/04/2025', horario: '09:30', target: '25-44 ABC+', trp_plan: 1.5, inversion_plan: 25000, trp_real: 1.8, monitoreo: 'Transmitido OK', marca_id: marcaId(), campana: 'Lanzamiento Primavera' },
  { id: 'mon-seed-2', medio: 'TV Abierta', cadena_plataforma: 'Las Estrellas', formato_programa: 'Hoy', fecha: '16/04/2025', horario: '10:15', target: 'P18-55 ABC+C', trp_plan: 2.1, inversion_plan: 42000, trp_real: 1.9, monitoreo: 'Transmitido OK', marca_id: marcaId(), campana: 'Reactivación Abril' },
  { id: 'mon-seed-3', medio: 'TV Abierta', cadena_plataforma: 'TVP-TUDN', formato_programa: 'Fútbol Liga MX', fecha: '18/04/2025', horario: '21:00', target: 'P18-55 ABC+C', trp_plan: 4.5, inversion_plan: 90000, trp_real: 0.0, monitoreo: 'No transmitido', marca_id: marcaId(), campana: 'Impulso Trimestral' },
  { id: 'mon-seed-4', medio: 'Radio', cadena_plataforma: 'Grupo Fórmula', formato_programa: 'Ciro por la Mañana', fecha: '20/04/2025', horario: '08:20', target: '25-44 ABC+', trp_plan: 0.8, inversion_plan: 8500, trp_real: 0.7, monitoreo: 'Transmitido OK', marca_id: marcaId(), campana: 'Promo Fin de Semana' },
  { id: 'mon-seed-5', medio: 'Radio', cadena_plataforma: 'MVS', formato_programa: 'Aristegui', fecha: '21/04/2025', horario: '07:45', target: 'P18-55 ABC+C', trp_plan: 0.6, inversion_plan: 6000, trp_real: 0.6, monitoreo: 'Fuera de horario (07:15)', marca_id: marcaId(), campana: 'Campaña Institucional' },
  { id: 'mon-seed-6', medio: 'Digital', cadena_plataforma: 'YouTube', formato_programa: 'Bumper 6s', fecha: '01-15/04/2025', horario: '24 hrs', target: '25-44 ABC+', trp_plan: 12.0, inversion_plan: 15000, trp_real: 12.5, monitoreo: 'Reporte Comscore OK', marca_id: marcaId(), campana: 'Lanzamiento Primavera' },
  { id: 'mon-seed-7', medio: 'Digital', cadena_plataforma: 'Spotify', formato_programa: 'Audio 20s', fecha: '01-15/04/2025', horario: '24 hrs', target: 'P18-55 ABC+C', trp_plan: 8.0, inversion_plan: 12000, trp_real: 7.2, monitoreo: 'Reporte Comscore OK', marca_id: marcaId(), campana: 'Reactivación Abril' },
  // ── Tabla de estacionalidad mensual (vista agregada) — una fila representativa por mes/medio ──
  { id: 'mon-seed-dic24', medio: 'TV Abierta', cadena_plataforma: 'Las Estrellas', formato_programa: 'Noche de Estrellas', fecha: '15/12/2024', horario: '20:30', target: 'P18-55 ABC+C', trp_plan: 120.0, inversion_plan: 850000, trp_real: 108.5, monitoreo: 'Fuera de horario (04:15)', marca_id: marcaId(), campana: 'Campaña Navideña', nota: 'Faltantes por sobreventa' },
  { id: 'mon-seed-ene25', medio: 'TV Abierta', cadena_plataforma: 'Azteca Uno', formato_programa: 'Venga la Alegría', fecha: '20/01/2025', horario: '09:00', target: 'P18-55 ABC+C', trp_plan: 45.0, inversion_plan: 200000, trp_real: 48.0, monitoreo: 'Transmitido OK', marca_id: marcaId(), campana: 'Cuesta de Enero', nota: 'Bonificaciones entregadas' },
  { id: 'mon-seed-mar25', medio: 'Radio', cadena_plataforma: 'Grupo Fórmula', formato_programa: 'Ciro por la Mañana', fecha: '12/03/2025', horario: '08:00', target: '25-44 ABC+', trp_plan: 80.0, inversion_plan: 150000, trp_real: 80.0, monitoreo: 'Transmitido OK', marca_id: marcaId(), campana: 'Campaña Institucional', nota: 'Ejecución limpia' },
  { id: 'mon-seed-may25-dig', medio: 'Digital', cadena_plataforma: 'Meta', formato_programa: 'Video 15s', fecha: '01-15/05/2025', horario: '24 hrs', target: '25-44 ABC+', trp_plan: 150.0, inversion_plan: 400000, trp_real: 148.5, monitoreo: 'Reporte Comscore OK', marca_id: marcaId(), campana: 'Hot Sale', nota: 'Campaña Hot Sale' },
  { id: 'mon-seed-may25-tv', medio: 'TV Abierta', cadena_plataforma: 'Canal 5', formato_programa: 'Gala de Verano', fecha: '08/05/2025', horario: '20:00', target: 'P18-55 ABC+C', trp_plan: 95.0, inversion_plan: 600000, trp_real: 91.0, monitoreo: 'Fuera de horario (23:40)', marca_id: marcaId(), campana: 'Día de las Madres', nota: 'Ligeros desplazamientos' },
  { id: 'mon-seed-ago25-tv', medio: 'TV Abierta', cadena_plataforma: 'Las Estrellas', formato_programa: 'Hoy', fecha: '14/08/2025', horario: '08:30', target: 'P18-55 ABC+C', trp_plan: 60.0, inversion_plan: 300000, trp_real: 52.0, monitoreo: 'Transmitido OK', marca_id: marcaId(), campana: 'Impulso Trimestral', nota: 'Caída de encendido (verano)' },
  { id: 'mon-seed-ago25-dig', medio: 'Digital', cadena_plataforma: 'TikTok', formato_programa: 'Story 9:16', fecha: '16-31/08/2025', horario: '24 hrs', target: '25-44 ABC+', trp_plan: 130.0, inversion_plan: 350000, trp_real: 135.0, monitoreo: 'Reporte Comscore OK', marca_id: marcaId(), campana: 'Impulso Trimestral', nota: 'Sobre-entrega de impresiones' },
  { id: 'mon-seed-nov25', medio: 'TV Abierta', cadena_plataforma: 'TVP-TUDN', formato_programa: 'Fútbol Liga MX', fecha: '21/11/2025', horario: '21:00', target: 'P18-55 ABC+C', trp_plan: 180.0, inversion_plan: 1200000, trp_real: 155.0, monitoreo: 'Fuera de horario (03:00)', marca_id: marcaId(), campana: 'Buen Fin', nota: 'Faltantes graves (Buen Fin)' },
  { id: 'mon-seed-dic25', medio: 'Radio', cadena_plataforma: 'MVS', formato_programa: 'Aristegui', fecha: '10/12/2025', horario: '07:30', target: '25-44 ABC+', trp_plan: 110.0, inversion_plan: 250000, trp_real: 102.0, monitoreo: 'Fuera de horario (02:45)', marca_id: marcaId(), campana: 'Campaña Navideña', nota: 'Desplazamientos de pauta' },
];

function generar(): FilaMonitoreo[] {
  const filas = [...SEMILLA];
  // Mismo rango que el Flow real: dic 2024 a dic 2025 — así el Flowchart puede
  // cruzar sus celdas contra estas filas por semana real (no por un supuesto).
  const inicio = new Date(mock.flow.calendario[0].fecha);
  const fin = new Date(mock.flow.calendario[mock.flow.calendario.length - 1].fecha);
  const diasTotales = Math.round((fin.getTime() - inicio.getTime()) / 86400000);
  for (let i = 0; i < 120; i++) {
    const dia = new Date(inicio.getTime() + Math.floor(rand() * diasTotales) * 86400000);
    const tipo = pick(['tv_prime', 'tv_manana', 'radio', 'digital'] as const);
    if (tipo === 'tv_prime') filas.push(generarTV(true, dia));
    else if (tipo === 'tv_manana') filas.push(generarTV(false, dia));
    else if (tipo === 'radio') filas.push(generarRadio(dia));
    else filas.push(generarDigital(dia));
  }
  return filas;
}

export const MONITOREO: FilaMonitoreo[] = generar();
