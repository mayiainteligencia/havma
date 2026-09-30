// Capa de datos de la plataforma de medios. Mock determinista (misma salida en
// cada carga) construido sobre las 32 entidades de data/mexicoPaths.ts, que aquí
// se leen como PLAZAS / mercados. Las cifras se derivan unas de otras: la
// inversión sale del peso de la plaza, los GRPs de la inversión, y el SOV por
// plaza siempre suma 100%.
//
// ponytail: todo se calcula al importar el módulo (32 plazas × 3 periodos);
// si el catálogo creciera a nivel municipio, mover a un JSON precomputado.

export interface Marca {
  id: string;
  nombre: string;
  color: string;
  esCliente: boolean;
}

export interface Plaza {
  id: string;          // mismo id que en mexicoPaths.ts
  nombre: string;
  inversionMXN: number;
  grps: number;
  alcancePct: number;
  sovPorMarca: Record<string, number>;  // marcaId -> % share of voice
}

export interface AlertaMarca {
  id: string;
  tipo: 'discrepancia-pauta' | 'mencion-negativa' | 'spike-competencia' | 'ad-fraud';
  severidad: 'alta' | 'media' | 'baja';
  plaza: string;
  medio: string;
  timestamp: string;
  descripcion: string;
}

/* ─────────────────────────── Marcas ─────────────────────────── */

// Cuenta activa del tablero: Liverpool, y su set competitivo real de retail
// departamental. Suburbia no entra como competidor: es del mismo grupo.
export const MARCAS: Marca[] = [
  { id: 'LIVERPOOL', nombre: 'Liverpool',            color: '#8B5CF6', esCliente: true },
  { id: 'PALACIO',   nombre: 'El Palacio de Hierro', color: '#0047AB', esCliente: false },
  { id: 'SEARS',     nombre: 'Sears',                color: '#F58025', esCliente: false },
  { id: 'COPPEL',    nombre: 'Coppel',               color: '#9B2247', esCliente: false },
];

export const CLIENTE = MARCAS[0];

/** Cartera de cuentas de Havas Media México. `activa` es la que alimenta el tablero. */
export interface CuentaCartera {
  nombre: string;
  categoria: string;
  sharePresupuesto: number;   // % de la inversión gestionada por la agencia
  activa?: boolean;
}

export const CARTERA: CuentaCartera[] = [
  { nombre: 'Liverpool',     categoria: 'Retail departamental', sharePresupuesto: 17.4, activa: true },
  { nombre: 'Suburbia',      categoria: 'Retail moda',          sharePresupuesto: 11.2 },
  { nombre: 'Banorte',       categoria: 'Servicios financieros', sharePresupuesto: 10.8 },
  { nombre: 'Cinépolis',     categoria: 'Entretenimiento',      sharePresupuesto: 9.6 },
  { nombre: 'Aeroméxico',    categoria: 'Aviación',             sharePresupuesto: 8.9 },
  { nombre: 'Hyundai',       categoria: 'Automotriz',           sharePresupuesto: 8.1 },
  { nombre: 'KIA',           categoria: 'Automotriz',           sharePresupuesto: 7.3 },
  { nombre: 'LVMH',          categoria: 'Lujo',                 sharePresupuesto: 6.5 },
  { nombre: 'Posadas',       categoria: 'Hotelería',            sharePresupuesto: 5.4 },
  { nombre: 'Sephora',       categoria: 'Belleza',              sharePresupuesto: 5.1 },
  { nombre: 'Little Caesars', categoria: 'QSR',                 sharePresupuesto: 4.9 },
  { nombre: 'Atún Dolores',  categoria: 'Consumo',              sharePresupuesto: 4.8 },
];

export const MARCA_COLOR: Record<string, string> = Object.fromEntries(
  MARCAS.map(m => [m.id, m.color]),
);
export const MARCA_NOMBRE: Record<string, string> = Object.fromEntries(
  MARCAS.map(m => [m.id, m.nombre]),
);

/* ─────────────────────────── Plazas ─────────────────────────── */

// Peso de cada plaza en la inversión publicitaria nacional (%). Suma ~100.
const PESO: { id: string; nombre: string; peso: number }[] = [
  { id: 'MX_DF', nombre: 'Ciudad de México',      peso: 21.5 },
  { id: 'MX_EM', nombre: 'Estado de México',      peso: 11.0 },
  { id: 'MX_JA', nombre: 'Jalisco',               peso: 8.2 },
  { id: 'MX_NL', nombre: 'Nuevo León',            peso: 7.6 },
  { id: 'MX_PU', nombre: 'Puebla',                peso: 4.5 },
  { id: 'MX_GT', nombre: 'Guanajuato',            peso: 4.2 },
  { id: 'MX_VE', nombre: 'Veracruz',              peso: 4.0 },
  { id: 'MX_CH', nombre: 'Chihuahua',             peso: 3.1 },
  { id: 'MX_BC', nombre: 'Baja California',       peso: 3.0 },
  { id: 'MX_MI', nombre: 'Michoacán',             peso: 2.8 },
  { id: 'MX_CO', nombre: 'Coahuila',              peso: 2.5 },
  { id: 'MX_SI', nombre: 'Sinaloa',               peso: 2.3 },
  { id: 'MX_SO', nombre: 'Sonora',                peso: 2.2 },
  { id: 'MX_TM', nombre: 'Tamaulipas',            peso: 2.2 },
  { id: 'MX_QT', nombre: 'Querétaro',             peso: 2.1 },
  { id: 'MX_SL', nombre: 'San Luis Potosí',       peso: 1.8 },
  { id: 'MX_HG', nombre: 'Hidalgo',               peso: 1.7 },
  { id: 'MX_GR', nombre: 'Guerrero',              peso: 1.5 },
  { id: 'MX_CS', nombre: 'Chiapas',               peso: 1.5 },
  { id: 'MX_OA', nombre: 'Oaxaca',                peso: 1.4 },
  { id: 'MX_YU', nombre: 'Yucatán',               peso: 1.4 },
  { id: 'MX_QR', nombre: 'Quintana Roo',          peso: 1.3 },
  { id: 'MX_MO', nombre: 'Morelos',               peso: 1.2 },
  { id: 'MX_DG', nombre: 'Durango',               peso: 1.0 },
  { id: 'MX_AG', nombre: 'Aguascalientes',        peso: 1.0 },
  { id: 'MX_ZA', nombre: 'Zacatecas',             peso: 0.9 },
  { id: 'MX_TB', nombre: 'Tabasco',               peso: 0.9 },
  { id: 'MX_TL', nombre: 'Tlaxcala',              peso: 0.7 },
  { id: 'MX_NA', nombre: 'Nayarit',               peso: 0.7 },
  { id: 'MX_CM', nombre: 'Campeche',              peso: 0.6 },
  { id: 'MX_CL', nombre: 'Colima',                peso: 0.5 },
  { id: 'MX_BS', nombre: 'Baja California Sur',   peso: 0.5 },
];

// Inversión total de la categoría (4 marcas) en el último periodo.
const INVERSION_CATEGORIA = 1_840_000_000;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// SOV determinista por plaza: el cliente entre 22% y 40%, el resto se reparte
// el remanente y el total siempre cierra en 100.
function sovDe(id: string, sesgoCliente: number): Record<string, number> {
  const h = hash(id);
  const cliente = Math.round(22 + (h % 19) + sesgoCliente);
  const resto = 100 - cliente;
  const a = Math.round(resto * (0.30 + ((h >> 4) % 15) / 100));
  const b = Math.round(resto * (0.28 + ((h >> 8) % 14) / 100));
  const c = resto - a - b;
  return { LIVERPOOL: cliente, PALACIO: a, SEARS: b, COPPEL: c };
}

function construirPlazas(factorInversion: number, sesgoCliente: number): Plaza[] {
  return PESO.map(p => {
    const inversionMXN = Math.round(INVERSION_CATEGORIA * factorInversion * p.peso / 100);
    // GRPs correlacionados con la inversión (costo por GRP ~ $95k en plaza grande).
    const grps = Math.round(inversionMXN / 95_000);
    // Alcance: crece con el peso de la plaza, techo 92%.
    const alcancePct = Math.min(92, Math.round(52 + p.peso * 1.6 + (hash(p.id) % 9)));
    return { id: p.id, nombre: p.nombre, inversionMXN, grps, alcancePct, sovPorMarca: sovDe(p.id, sesgoCliente) };
  });
}

/* ─────────────────────── Periodos y agregados ─────────────────────── */

export const PERIODOS = ['2023', '2024', '2025'];
export const ULTIMO = PERIODOS[PERIODOS.length - 1];

const FACTOR: Record<string, { inversion: number; sesgo: number }> = {
  '2023': { inversion: 0.78, sesgo: -5 },
  '2024': { inversion: 0.89, sesgo: -2 },
  '2025': { inversion: 1.00, sesgo: 0 },
};

export type TopPlaza = { plaza: string; inversionMXN: number; lider: string };
export type Discrepancia = { plaza: string; medio: string; esperados: number; detectados: number; montoMXN: number };
export type RiesgoAlcance = { plaza: string; alcancePct: number };

export type PeriodoData = {
  totalPlazas: number;
  plazasLideradas: number;        // plazas donde el cliente es #1 en SOV
  sovCliente: number;             // % SOV nacional ponderado
  inversionCliente: number;
  inversionTotal: number;
  alcanceProm: number;
  grpsTotal: number;
  emisoras: number;
  impactos: number;
  segundaMarca: string;
  lideradasSegunda: number;
  lideradas: Record<string, number>;
  inversionPorMarca: Record<string, number>;
  plazas: Plaza[];
  topPlazas: TopPlaza[];
  discrepancias: Discrepancia[];
  riesgoAlcance: RiesgoAlcance[];
};

const MEDIOS = ['MVS 102.5', 'W Radio 96.9', 'Los 40 101.7', 'Exa FM 104.9', 'Radio Fórmula 103.3', 'Imagen 90.5'];

function agregar(plazas: Plaza[]): PeriodoData {
  const inversionTotal = plazas.reduce((s, p) => s + p.inversionMXN, 0);
  const grpsTotal = plazas.reduce((s, p) => s + p.grps, 0);

  const lideradas: Record<string, number> = Object.fromEntries(MARCAS.map(m => [m.id, 0]));
  const sovPonderado: Record<string, number> = Object.fromEntries(MARCAS.map(m => [m.id, 0]));

  plazas.forEach(p => {
    const lider = MARCAS.map(m => m.id).reduce((a, b) => (p.sovPorMarca[a] >= p.sovPorMarca[b] ? a : b));
    lideradas[lider] += 1;
    MARCAS.forEach(m => { sovPonderado[m.id] += p.sovPorMarca[m.id] * p.inversionMXN; });
  });

  const sov = (id: string) => Math.round(sovPonderado[id] / inversionTotal * 10) / 10;
  const inversionPorMarca = Object.fromEntries(
    MARCAS.map(m => [m.id, Math.round(inversionTotal * sov(m.id) / 100)]),
  );

  const competidores = MARCAS.filter(m => !m.esCliente).sort((a, b) => sov(b.id) - sov(a.id));
  const segunda = competidores[0];

  const ordenadas = [...plazas].sort((a, b) => b.inversionMXN - a.inversionMXN);

  const topPlazas: TopPlaza[] = ordenadas.slice(0, 8).map(p => ({
    plaza: p.nombre,
    inversionMXN: p.inversionMXN,
    lider: MARCAS.map(m => m.id).reduce((a, b) => (p.sovPorMarca[a] >= p.sovPorMarca[b] ? a : b)),
  }));

  // Discrepancias de pauta: spots contratados vs detectados on-air por Testigos IA.
  const discrepancias: Discrepancia[] = ordenadas.slice(0, 6).map((p, i) => {
    const esperados = 120 + (hash(p.id) % 90);
    const detectados = esperados - (3 + (hash(p.id + 'd') % 14));
    return {
      plaza: p.nombre,
      medio: MEDIOS[i % MEDIOS.length],
      esperados,
      detectados,
      montoMXN: (esperados - detectados) * 14_500,
    };
  });

  const riesgoAlcance: RiesgoAlcance[] = [...plazas]
    .sort((a, b) => a.alcancePct - b.alcancePct)
    .slice(0, 6)
    .map(p => ({ plaza: p.nombre, alcancePct: p.alcancePct }));

  return {
    totalPlazas: plazas.length,
    plazasLideradas: lideradas[CLIENTE.id],
    sovCliente: sov(CLIENTE.id),
    inversionCliente: inversionPorMarca[CLIENTE.id],
    inversionTotal,
    alcanceProm: Math.round(plazas.reduce((s, p) => s + p.alcancePct, 0) / plazas.length),
    grpsTotal,
    emisoras: 214,
    impactos: grpsTotal * 41_000,
    segundaMarca: segunda.nombre,
    lideradasSegunda: lideradas[segunda.id],
    lideradas,
    inversionPorMarca,
    plazas,
    topPlazas,
    discrepancias,
    riesgoAlcance,
  };
}

export const porPeriodo: Record<string, PeriodoData> = Object.fromEntries(
  PERIODOS.map(p => [p, agregar(construirPlazas(FACTOR[p].inversion, FACTOR[p].sesgo))]),
);

export const PLAZAS = porPeriodo[ULTIMO].plazas;

/** Equipo y cobertura operativa del monitoreo (analogía del despliegue en campo). */
export const COBERTURA = {
  plazas: 32,
  emisoras: 214,
  presupuestoMXN: porPeriodo[ULTIMO].inversionCliente,
};

/* ─────────────────────────── Alertas ─────────────────────────── */

export const ALERTAS: AlertaMarca[] = [
  { id: 'AL-01', tipo: 'discrepancia-pauta', severidad: 'alta',  plaza: 'Ciudad de México', medio: 'MVS 102.5',        timestamp: 'hace 12 min', descripcion: '9 spots contratados no salieron al aire en el bloque de las 08:00' },
  { id: 'AL-02', tipo: 'spike-competencia',  severidad: 'alta',  plaza: 'Nuevo León',       medio: 'Multimedios 106.1', timestamp: 'hace 34 min', descripcion: 'El Palacio de Hierro subió 11 pts de SOV en 48 h con pauta nueva en drive time' },
  { id: 'AL-03', tipo: 'ad-fraud',           severidad: 'alta',  plaza: 'Jalisco',          medio: 'Programática',      timestamp: 'hace 1 h',    descripcion: '18.4% de tráfico inválido detectado en el line item de video' },
  { id: 'AL-04', tipo: 'mencion-negativa',   severidad: 'media', plaza: 'Estado de México', medio: 'W Radio 96.9',      timestamp: 'hace 2 h',    descripcion: 'Mención negativa sobre tiempos de entrega en segmento de opinión' },
  { id: 'AL-05', tipo: 'discrepancia-pauta', severidad: 'media', plaza: 'Puebla',           medio: 'Exa FM 104.9',      timestamp: 'hace 3 h',    descripcion: 'Spot emitido fuera de la franja contratada (22:40 vs 20:00-21:00)' },
  { id: 'AL-06', tipo: 'spike-competencia',  severidad: 'media', plaza: 'Guanajuato',       medio: 'Los 40 101.7',      timestamp: 'hace 5 h',    descripcion: 'Sears duplicó su frecuencia semanal en la plaza' },
  { id: 'AL-07', tipo: 'mencion-negativa',   severidad: 'baja',  plaza: 'Veracruz',         medio: 'Radio Fórmula',     timestamp: 'ayer',        descripcion: 'Comentario aislado sobre precio en programa matutino' },
  { id: 'AL-08', tipo: 'ad-fraud',           severidad: 'baja',  plaza: 'Chihuahua',        medio: 'Display',           timestamp: 'ayer',        descripcion: 'Viewability por debajo del piso contratado (58% vs 70%)' },
];

export const SEVERIDAD_COLOR: Record<AlertaMarca['severidad'], string> = {
  alta: '#EF4444',
  media: '#F59E0B',
  baja: '#6B7280',
};

export const TIPO_LABEL: Record<AlertaMarca['tipo'], string> = {
  'discrepancia-pauta': 'Discrepancia de pauta',
  'mencion-negativa': 'Mención negativa',
  'spike-competencia': 'Spike de competencia',
  'ad-fraud': 'Ad fraud',
};

/* ─────────────────────────── Helpers ─────────────────────────── */

export const fmt = (n: number) => n.toLocaleString('es-MX');
export const fmtMXN = (n: number) => '$' + n.toLocaleString('es-MX');
/** $1,840 M / $12.4 M — para KPIs donde el número completo no cabe. */
export const fmtMXNCorto = (n: number) =>
  n >= 1_000_000_000 ? `$${(n / 1_000_000_000).toFixed(2)} MMDP`
  : n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)} M`
  : fmtMXN(n);

/** Proyección lineal simple del SOV del cliente al próximo periodo. */
export function proyeccionSOV(): number {
  const a = porPeriodo[PERIODOS[0]].sovCliente;
  const b = porPeriodo[ULTIMO].sovCliente;
  return Math.round((b + (b - a) / (PERIODOS.length - 1)) * 10) / 10;
}
