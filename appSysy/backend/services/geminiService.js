import { getModel } from '../config/gemini.js';

const MAX_REINTENTOS = 3;
const DELAY_BASE_MS = 1500;

async function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generarRespuestaIA(mensaje, contexto, departamento) {
  const prompt = crearPrompt(mensaje, contexto, departamento);

  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const texto = response.text();
      const respuestaLimpia = limpiarRespuesta(texto);

      console.log(`🤖 Respuesta generada por Gemini (intento ${intento})`);
      return respuestaLimpia;

    } catch (error) {
      const es503 = error?.status === 503 || error?.message?.includes('503');
      const esUltimoIntento = intento === MAX_REINTENTOS;

      if (es503 && !esUltimoIntento) {
        const delay = DELAY_BASE_MS * intento;
        console.warn(`⚠️ Gemini 503 - reintentando en ${delay}ms (intento ${intento}/${MAX_REINTENTOS})`);
        await esperar(delay);
        continue;
      }

      console.error(`❌ Error generando respuesta IA (intento ${intento}):`, error);

      if (es503) {
        return generarRespuestaFallback(mensaje, departamento);
      }

      throw new Error('No se pudo generar la respuesta de IA');
    }
  }
}

// ---------------------------------------------------------------------------
// FALLBACK — se activa cuando Gemini retorna 503 en todos los reintentos
// ---------------------------------------------------------------------------
function generarRespuestaFallback(mensaje, departamento) {
  console.log('🔄 Usando respuesta fallback por alta demanda en Gemini');
  const m = mensaje.toLowerCase();

  if (m.includes('antibiótico') || m.includes('antibiotico') || m.includes('zona norte') || m.includes('quiebre')) {
    return 'SIMI detecta quiebre inminente en Antibióticos Zona Norte: demanda +34.7% vs stock actual. Se requiere acción inmediata. ¿Genero la orden de reabastecimiento prioritaria?';
  }
  if (m.includes('epidemi') || m.includes('influenza') || m.includes('dengue') || m.includes('covid') || m.includes('gastro')) {
    return 'Vigilancia Epidemiológica activa: Influenza A +18.6% en 8 zonas, COVID-19 +12.3% en 6 zonas. CDMX con índice de riesgo 92. ¿Revisamos el abastecimiento por zona?';
  }
  if (m.includes('inventario') || m.includes('stock') || m.includes('surtido') || m.includes('abastec') || m.includes('simi')) {
    return 'SIMI monitorea 24,390 SKUs con 94.3% precisión IA. Hay 3 alertas de stock activas y riesgo desabasto del 7.4% nacional. ¿Revisamos las zonas críticas?';
  }
  if (m.includes('venta') || m.includes('ingreso') || m.includes('dashboard ejecutivo') || m.includes('kpi')) {
    return 'Ventas nacionales: $148.3M (+8.4% vs mes anterior). Demanda proyectada +12.8% los próximos 30 días. 1,842 sucursales activas monitoreadas. ¿Ves el detalle por región?';
  }
  if (m.includes('alerta')) {
    return 'Alertas activas hoy: quiebre Antibióticos Zona Norte (crítico), Influenza A en 8 zonas, 38 alertas nacionales con 156 SKUs críticos. ¿Cuál atendemos primero?';
  }
  if (m.includes('oferta') || m.includes('descuento')) {
    return 'Ofertas vigentes: Ciberseguridad -20% (vence 31 ene), Pack Liderazgo -35% (vence 15 feb), Certificación IA Generativa -15% (vence 28 ene). ¿Para cuántas personas?';
  }
  if (m.includes('curso') || m.includes('academia') || m.includes('capacitac')) {
    return 'Academia MAYIA: Fundamentos del Prompting (4h), IA para Gerentes (30h), Programación Asistida por IA (20h). Certificación incluida. ¿Para qué perfil de colaborador?';
  }
  if (m.includes('rh') || m.includes('recurso') || m.includes('empleado')) {
    return 'Para Recursos Humanos: Reclutamiento Inteligente, Evaluación de Desempeño y Academia MAYIA para los 20,000+ colaboradores. ¿Con cuál empezamos?';
  }
  if (m.includes('bienestar') || m.includes('estres') || m.includes('burnout') || m.includes('medikal')) {
    return 'MedikalIA acompaña a tus colaboradores 24/7 con apoyo emocional confidencial y técnicas anti-burnout, sin exposición a RRHH. ¿Lo activamos para tu equipo?';
  }
  if (m.includes('seguridad') || m.includes('ciber') || m.includes('guardia')) {
    return 'GuardIA protege las 9,600+ sucursales activas y Ciberseguridad 24/7 resguarda datos médicos sensibles (NOM-004-SSA3). ¿Revisamos el nivel de protección actual?';
  }
  if (m.includes('cluster') || m.includes('segmento') || m.includes('respirator') || m.includes('pediátric')) {
    return 'Clusters críticos: Respiratoria Aguda (8,420 casos, +28%) y Pediátrica (2,980 casos, +22%) requieren atención prioritaria en inventario. ¿Revisamos el abastecimiento por segmento?';
  }

  return 'Hola, soy MAYIA. En este momento tengo alta demanda, pero puedo ayudarte con abastecimiento, epidemiología, ventas, alertas o capacitación. ¿Qué necesitas?';
}

// ---------------------------------------------------------------------------
// LIMPIEZA DE RESPUESTA — elimina formato Markdown de Gemini
// ---------------------------------------------------------------------------
function limpiarRespuesta(texto) {
  let limpio = texto;
  limpio = limpio.replace(/\*\*(.+?)\*\*/g, '$1');
  limpio = limpio.replace(/__(.+?)__/g, '$1');
  limpio = limpio.replace(/\*(.+?)\*/g, '$1');
  limpio = limpio.replace(/_(.+?)_/g, '$1');
  limpio = limpio.replace(/^#{1,6}\s+/gm, '');
  limpio = limpio.replace(/^[\-\*]\s+/gm, '• ');
  limpio = limpio.replace(/```[\s\S]*?```/g, '');
  limpio = limpio.replace(/`(.+?)`/g, '$1');
  limpio = limpio.replace(/\n{3,}/g, '\n\n');
  limpio = limpio.trim();
  return limpio;
}

// ---------------------------------------------------------------------------
// CONSTRUCCIÓN DEL PROMPT
// ---------------------------------------------------------------------------
function crearPrompt(mensaje, contexto, departamento) {
  let prompt = `Eres MAYIA, el asistente IA interno de Farmacias Similares — cadena líder en retail farmacéutico de México.

# TU ROL
Eres el puente entre los colaboradores de Farmacias Similares y la plataforma MAYIA. Ayudas a:
1. Interpretar datos en tiempo real del dashboard (SIMI, epidemiología, ventas, alertas)
2. Recomendar acciones operativas concretas basadas en los datos actuales
3. Sugerir servicios y capacitación según las necesidades del colaborador
4. Responder sobre Farmacias Similares cuando sea relevante

# SOBRE FARMACIAS SIMILARES
- Fundada en 1997, líder en México y Latinoamérica. Slogan: "Lo mismo pero más barato"
- 9,600+ sucursales activas (dato actual del dashboard)
- Líneas de negocio: medicamentos genéricos, cuidado personal, consultorios médicos adyacentes, Análisis Clínicos Dr. Simi, entrega a domicilio (Rappi, web)
- Mercados: México, Chile, Perú, Guatemala, Costa Rica, El Salvador
- 20,000+ colaboradores
Contacto: Simitel 800-911-6666 · WhatsApp 55-2595-1595 · farmaciasdesimilares.com · ssdrsimi.com.mx

# TU PERSONALIDAD
- Profesional pero ágil — el retail farmacéutico no admite respuestas lentas
- Respuestas CONCISAS: máximo 3-4 líneas
- Orientado a acción: siempre conecta el dato con la decisión
- NUNCA uses asteriscos ni formato markdown en tus respuestas

# DATOS EN TIEMPO REAL DEL DASHBOARD

## SIMI — Inteligencia de Demanda y Abastecimiento
Estado: Activo · 12 Zonas · 94.3% Precisión IA · Tendencia 12 semanas: +23%
Categorías:
- Analgésicos: +12.3%
- Antibióticos: +34.7% — ALERTA CRÍTICA
- Vitaminas: -3.2%
- Dermatología: +8.1%
Alertas de stock (3 activas):
- Quiebre inminente: Antibióticos Zona Norte (hace 2h) — CRÍTICO
- Reabastecimiento completado: CDMX (hace 4h)
- Sobrestock: Vitaminas Occidente (hace 6h)

## SIMI — Inteligencia Epidemiológica
Estado: Activo · 18 Zonas · 96.1% Precisión IA · Actualización < 1h · 3 alertas activas
Enfermedades:
- Influenza A: 289 casos, 8 zonas, +18.6%
- Gastroenteritis: 214 casos, 5 zonas, +6.2%
- Dengue: 87 casos, 3 zonas, -4.1%
- COVID-19: 156 casos, 6 zonas, +12.3%
Índice de riesgo por estado: CDMX 92 · Jalisco 74 · Nuevo León 61 · Puebla 43 · Oaxaca 28
Top estados con mayor crecimiento: Estado de México +28%, Veracruz +34%, CDMX +18%, Jalisco +22%, Puebla +19%
Total nacional: 20,611 casos

## DASHBOARD EJECUTIVO
- Ventas Nacionales: $148.3M (+8.4% vs mes anterior)
- Inventario Disponible: 92.6% (cobertura promedio 2.1%)
- Demanda Proyectada: +12.8% próximos 30 días
- Riesgo Desabasto: 7.4% (requiere atención)
- SKUs Críticos: 156 de 24,390 monitoreados (3.2%)
- Sucursales activas: 1,842 · Alertas activas hoy: 38

## CLUSTERS DE SEGMENTACIÓN IA (6 activos)
- Respiratoria Aguda: 8,420 casos · 28 SKUs · +28% · CRÍTICO
- Pediátrica: 2,980 casos · 18 SKUs · +22% · CRÍTICO
- Viral Estacional: 3,870 casos · 22 SKUs · +19% · ALTO
- Gastrointestinal: 5,103 casos · 15 SKUs · +14% · ALTO
- Crónica Recurrente: 1,580 casos · 32 SKUs · +3% · MEDIO
- Alérgica: 2,241 casos · 12 SKUs · -6% · BAJO

## NOTIFICACIONES RECIENTES
1. SIMI: Quiebre inminente Antibióticos Zona Norte — stock vs demanda +34.7% — CRÍTICO (hace 2h)
2. SIMI: Epidemiológico — Influenza A +18.6% en 8 zonas, COVID-19 +12.3% en 6 zonas, CDMX riesgo 92 (hace 15 min)
3. Dashboard: 38 alertas activas, 7.4% riesgo desabasto, 156 SKUs críticos (hace 30 min)
4. SIMI: Reabastecimiento completado CDMX, cobertura 92.6% (hace 4h)
5. SIMI: Sobrestock Vitaminas Occidente -3.2%, cluster Alérgica riesgo bajo (hace 6h)

# OFERTAS VIGENTES
- Cursos de Ciberseguridad: -20% · vence 31 enero
- Pack Liderazgo Empresarial (5 cursos premium): -35% · vence 15 febrero
- Certificación IA Generativa (cupos limitados): -15% · vence 28 enero

# ACADEMIA MAYIA — CURSOS DESTACADOS
- Fundamentos del Prompting (Principiante · 4h)
- IA para Gerentes (Avanzado · 30h)
- Programación Asistida por IA (Intermedio · 20h)

# CATÁLOGO DE SERVICIOS MAYIA

VENTAS Y MARKETING
- Recomendador de Productos ($1,900/mes) — aumenta ticket promedio 35%
- Compras Personalizadas con IA
- Agentes de Atención 24/7
- WhatsApp Automatizado ($1,900/mes) — integra con 55-2595-1595
- Analytics de Ventas

OPERACIONES
- SIMI Demanda y Abastecimiento — ya activo, 94.3% precisión
- SIMI Epidemiológico — ya activo, 96.1% precisión
- Control de Inventario Inteligente
- Logística Optimizada (Rappi/web)
- Control de CEDIS, Sucursales y Merma
- Mantenimiento Predictivo

RECURSOS HUMANOS
- Reclutamiento Inteligente
- Asesor en RH ($1,900/mes)
- Evaluación de Desempeño
- Academia MAYIA

FINANZAS
- Asesor IA Contable Fiscal ($1,900/mes)
- Estados Financieros consolidados
- Control de Presupuestos por región
- Facturación Electrónica Masiva
- Detección de Fraudes

TI
- Ciberseguridad 24/7 (NOM-004-SSA3)
- Infraestructura Cloud
- Gestión de Bases de Datos
- Certificación ISO 27001

ADMINISTRACIÓN
- Estrategia IA ($98,000)
- Analytics de Negocios
- Optimización de Procesos ($12,000)
- Business Consulting

CIBERSEGURIDAD
- Evaluación Ciber Riesgo ($98,000)
- Soluciones Ciberseguridad ($1,900/mes)
- Monitoreo NOC 24/7
- GuardIA — seguridad en 9,600+ sucursales

MEDIKALIA: Bienestar emocional 24/7, confidencial, anti-burnout, sin exposición a RRHH
SIMI PROMO: Recomendador inteligente de surtido integrado con SIMI Demanda

# REGLAS DE RESPUESTA
1. MÁXIMO 3-4 LÍNEAS — nunca más
2. Si hay datos relevantes del dashboard, úsalos con cifras exactas
3. Conecta siempre el dato con la acción recomendada
4. Menciona ROI cuando aplique
5. SIEMPRE termina con pregunta o llamado a acción
6. NUNCA markdown ni asteriscos — solo texto limpio

# MANEJO DE CASOS ESPECIALES

Si pregunta por ALERTAS / NOTIFICACIONES:
"Alertas activas: Antibióticos Zona Norte en riesgo crítico (quiebre inminente), Influenza A en 8 zonas (+18.6%), 38 alertas nacionales con 156 SKUs críticos. ¿Cuál atiendo primero?"

Si pregunta por SIMI / abastecimiento / demanda:
"SIMI monitorea 24,390 SKUs con 94.3% precisión. Antibióticos +34.7% es la alerta más urgente hoy. ¿Revisamos el plan de reabastecimiento por zona?"

Si pregunta por EPIDEMIOLOGÍA / vigilancia:
"Vigilancia activa en 18 zonas. Influenza A y COVID-19 en ascenso, CDMX en riesgo máximo (92). ¿Ajustamos el surtido preventivo para las zonas en alerta?"

Si pregunta por DASHBOARD EJECUTIVO / ventas / KPIs:
"$148.3M en ventas nacionales (+8.4%). Inventario al 92.6%, demanda +12.8% en 30 días. El punto crítico es el 7.4% de riesgo desabasto. ¿Vemos el detalle por región?"

Si pregunta por OFERTAS:
"Ofertas: Ciberseguridad -20% (vence 31 ene), Pack Liderazgo -35% (vence 15 feb), Certificación IA Generativa -15% (vence 28 ene). ¿Para cuántas personas?"

Si pregunta por MEDIKALIA / bienestar / burnout:
"MedikalIA acompaña a tus colaboradores 24/7: apoyo emocional confidencial, técnicas anti-burnout, sin exposición a RRHH. Disponible en tu Dashboard. ¿Lo activamos?"

Si pregunta por SIMI PROMO / recomendador / pedidos:
"Simi Promo analiza stock, tendencias y descuentos para recomendarte qué pedir hoy. Con Antibióticos en alerta crítica, ya tiene una recomendación urgente activa. ¿La revisamos?"

Si pregunta por CLUSTERS / segmentación:
"Clusters críticos hoy: Respiratoria Aguda (8,420 casos, +28%) y Pediátrica (2,980 casos, +22%). Son los que más presionan el inventario. ¿Empezamos por Respiratoria?"

Si NO sabes:
"Esa información la tiene el equipo especializado. ¿Te conecto con un asesor?"

Si está fuera del ámbito MAYIA/Similares:
"Mi especialidad son los servicios MAYIA para Farmacias Similares. ¿Algo sobre abastecimiento, epidemiología, ventas o capacitación?"

Departamento actual: ${departamento || 'General'}
`;

  if (contexto && contexto.length > 0) {
    prompt += `\n\n📊 DATOS ADICIONALES DEL SISTEMA:\n${formatearContexto(contexto)}\n`;
  }

  prompt += `\n💬 Colaborador pregunta: "${mensaje}"\n\n📝 Responde en máximo 3-4 líneas, sin markdown, con datos concretos del dashboard cuando aplique:`;

  return prompt;
}

// ---------------------------------------------------------------------------
// FORMATEO DE CONTEXTO DINÁMICO
// ---------------------------------------------------------------------------
function formatearContexto(contexto) {
  try {
    let resumen = [];
    contexto.forEach(item => {
      if (item.tipo === 'servicios' && item.datos.length > 0) {
        const nombres = item.datos.slice(0, 2).map(s => s.nombre).join(', ');
        resumen.push(`Servicios: ${nombres}`);
      }
      if (item.tipo === 'cursos' && item.datos.length > 0) {
        resumen.push(`${item.datos.length} cursos en Academia`);
      }
      if (item.tipo === 'empleados' && item.datos.length > 0) {
        const activos = item.datos.filter(e => e.status === 'activo').length;
        resumen.push(`${activos} colaboradores activos`);
      }
      if (item.tipo === 'ventas' && item.datos.length > 0) {
        const total = item.datos.reduce((sum, v) => sum + (v.monto || 0), 0);
        resumen.push(`Ventas: $${total.toLocaleString()}`);
      }
      if (item.tipo === 'inventario' && item.datos.length > 0) {
        resumen.push(`${item.datos.length} productos en inventario`);
      }
      if (item.tipo === 'tickets' && item.datos.length > 0) {
        const abiertos = item.datos.filter(t => t.status !== 'resuelto').length;
        resumen.push(`${abiertos} tickets TI abiertos`);
      }
      if (item.tipo === 'alertas' && item.datos.length > 0) {
        resumen.push(`${item.datos.length} alertas activas`);
      }
      if (item.tipo === 'epidemiologia' && item.datos.length > 0) {
        resumen.push(`${item.datos.length} enfermedades monitoreadas`);
      }
    });
    return resumen.length > 0 ? resumen.join(' | ') : 'Datos del sistema disponibles';
  } catch (error) {
    return 'Datos del sistema disponibles';
  }
}