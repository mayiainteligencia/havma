// config/empresaConfig.js
// Configuración de la empresa cliente actual de la plataforma MAYIA

export const EMPRESA_CONFIG = {
  // Información básica
  nombre: 'Farmacias Similares',
  nombreCompleto: 'Farmacias Similares - Dr. Simi',
  industria: 'Retail Farmacéutico y Servicios de Salud',
  fundacion: 1997,
  pais: 'México',
  slogan: 'Lo mismo pero más barato',

  // Descripción corporativa
  descripcion: 'Cadena líder en México y América Latina especializada en medicamentos genéricos a precios accesibles, con servicios integrados de consultorios médicos y análisis clínicos.',

  // Datos operativos
  operaciones: {
    sucursales: '7,000+ en México y Latinoamérica',
    mercados: 'México, Chile, Perú, Guatemala, Costa Rica, El Salvador',
    empleados: '20,000+',
    lineasNegocio: [
      'Venta de medicamentos genéricos',
      'Productos de cuidado personal',
      'Consultorios médicos',
      'Análisis clínicos',
      'Servicio a domicilio',
      'MedikalIA - Acompañamiento emocional 24/7',
      'Simi Promo - Recomendador inteligente de compras'
    ]
  },

  // Marcas del portafolio
  marcas: [
    'Dr. Simi (mascota corporativa)',
    'Farmacias Similares',
    'Consultorios Adyacentes',
    'Análisis Clínicos del Dr. Simi',
    'MedikalIA - Bienestar emocional para colaboradores',
    'Simi Promo - Asistente inteligente de compras'
  ],

  // Servicios principales
  serviciosPrincipales: [
    'Venta de medicamentos genéricos',
    'Productos de belleza y cuidado personal',
    'Consultas médicas accesibles',
    'Laboratorio de análisis clínicos',
    'Entrega a domicilio',
    'Servicio por WhatsApp',
    'MedikalIA - Acompañamiento emocional 24/7 para colaboradores',
    'Simi Promo - Recomendaciones inteligentes de surtido para tiendas'
  ],

  // Contactos corporativos
  contacto: {
    sitioWeb: 'https://www.farmaciasdesimilares.com',
    simitel: '800 911 6666',
    whatsapp: '55 2595 1595',
    analisisClinicos: 'https://www.ssdrsimi.com.mx',
    appEntrega: 'Rappi, sitio web'
  },

  // Enfoque estratégico
  enfoqueEstrategico: [
    'Accesibilidad en salud',
    'Precios económicos',
    'Cobertura nacional',
    'Servicio integral (farmacia + consultorio + laboratorio)',
    'Digitalización y e-commerce'
  ],

  // Servicios MAYIA prioritarios (según industria retail farmacéutica)
  serviciosPrioritarios: {
    ventas: [
      'Recomendador de Productos',
      'WhatsApp Automatizado',
      'Analytics de Ventas',
      'Compras Personalizadas'
    ],
    operaciones: [
      'Control de Inventario inteligente',
      'Análisis de Demanda',
      'Logística optimizada (entregas a domicilio)',
      'Control de CEDIS y Sucursales'
    ],
    rh: [
      'Reclutamiento Inteligente',
      'Evaluación de Desempeño',
      'Capacitación de personal (7,000+ sucursales)'
    ],
    atencionCliente: [
      'Agentes de Atención 24/7',
      'WhatsApp Automatizado',
      'Chatbots especializados en salud'
    ],
    ti: [
      'Ciberseguridad (datos médicos sensibles)',
      'Infraestructura Cloud para sucursales',
      'Gestión de Bases de Datos de pacientes'
    ],
    administracion: [
      'Analytics de Negocios',
      'Optimización de Procesos',
      'Control de múltiples sucursales'
    ]
  },

  // Cursos recomendados (según perfil retail farmacéutico)
  cursosRecomendados: {
    gerentes: [
      'IA para Gerentes',
      'Analytics de Negocios',
      'Optimización de Procesos',
      'Toma de Decisiones Estratégicas'
    ],
    ventas: [
      'IA para Trabajo Inteligente',
      'Comunicación Efectiva',
      'Fundamentos del Prompting'
    ],
    ti: [
      'Ciberseguridad',
      'Python Fundamentos',
      'SQL Básico',
      'ML para Negocios'
    ],
    operaciones: [
      'Series Temporales (pronósticos de demanda)',
      'Análisis Estadístico',
      'Data Wrangling',
      'Tableau Visualización'
    ]
  },

  // Casos de uso específicos de IA para retail farmacéutico
  casosDeUsoIA: {
    inventario: 'Predecir demanda de medicamentos por temporada (gripe, alergias)',
    recomendacion: 'Sugerir productos complementarios (vitaminas + suplementos)',
    atencion: 'Chatbot médico para preguntas frecuentes y agendar consultas',
    logistica: 'Optimizar rutas de entrega a domicilio',
    fraude: 'Detectar patrones de compra sospechosos',
    precios: 'Análisis competitivo de precios en tiempo real'
  },

  // Servicios propios de la plataforma MAYIA activos para Farmacias Similares
  serviciosMayiaActivos: {
    medikalIA: {
      nombre: 'MedikalIA',
      nombreAlternativo: 'Medical IA / Medikal-IA',
      tipo: 'Bienestar emocional para colaboradores',
      descripcion: 'Agente de acompañamiento emocional disponible 24/7 para los colaboradores de Farmacias Similares. Ofrece apoyo emocional personalizado mediante inteligencia artificial especializada en bienestar mental y prevención del burnout.',
      beneficios: [
        'Acompañamiento confidencial',
        'Disponibilidad inmediata 24/7',
        'Técnicas de bienestar emocional',
        'Prevención de burnout',
        'Apoyo especializado en salud mental'
      ],
      audiencia: 'Colaboradores internos (20,000+ empleados)',
      casoDeUso: 'Personal de mostrador, supervisores de zona y gerentes con alta carga operativa en las 7,000 sucursales',
      modulo: 'Dashboard MAYIA - columna derecha'
    },
    simiPromo: {
      nombre: 'Simi Promo',
      nombreAlternativo: 'Recomendador Simi / SimiPromo',
      tipo: 'Recomendador inteligente de compras para tiendas',
      descripcion: 'Asistente inteligente de compras diseñado para optimizar el surtido de cada tienda Similares. Analiza tendencias de ventas, stock disponible y promociones activas para recomendar qué conviene pedir hoy.',
      beneficios: [
        'Recomendaciones de surtido personalizadas por zona geográfica',
        'Alertas de productos en oferta y con descuento',
        'Programación inteligente de pedidos a tienda',
        'Maximiza el ahorro con descuentos Simi',
        'Reduce faltantes y sobre-stock',
        'Análisis de tendencias semanales por categoría'
      ],
      audiencia: 'Encargados y gerentes de tienda / sucursal',
      casoDeUso: 'Optimizar pedidos a CEDIS, aprovechar promociones activas, reducir merma por caducidad y garantizar stock de productos de alta rotación',
      modulo: 'Dashboard MAYIA - columna izquierda'
    }
  },

  // Métricas clave del negocio
  metricasClave: [
    'Ticket promedio por venta',
    'Rotación de inventario de medicamentos',
    'Tasa de conversión en consultorios',
    'Tiempo de entrega a domicilio',
    'NPS (satisfacción del cliente)',
    'Ventas por sucursal'
  ]
};

// Función helper para obtener información de la empresa
export function getEmpresaInfo(campo) {
  return EMPRESA_CONFIG[campo] || null;
}

// Función para generar descripción contextual
export function getDescripcionContextual() {
  const { nombreCompleto, slogan, fundacion, operaciones } = EMPRESA_CONFIG;
  
  return `${nombreCompleto} ("${slogan}") es una cadena líder fundada en ${fundacion}, 
con ${operaciones.sucursales} especializadas en medicamentos genéricos accesibles, 
consultorios médicos y análisis clínicos.`;
}

export default EMPRESA_CONFIG;