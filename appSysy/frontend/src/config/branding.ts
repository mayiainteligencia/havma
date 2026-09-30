export const brandingConfig = {
  empresa: {
    nombre: "AI Acceleration Lab México",
    eslogan: "",
    logo: "/assets/logosNativos/logohavas.png",
  },

  colores: {
    primario: "#B22222",           // rojo claro — elemento primario activo (sidebar activo)
    primarioOscuro: "#2D2D2D",     // Negro suave — hover
    primarioClaro: "#FFFFFF",      // Blanco — superficies claras

    secundario: "#1A1A1A",
    acento: "#1A1A1A",
    acentoOscuro: "#A0AEC0",

    peligro: "#EF4444",
    advertencia: "#F59E0B",
    exito: "#10B981",

    fondoPrincipal: "#FFFFFF",
    fondoSecundario: "#FFFFFF",
    fondoTerciario: "#FFFFFF",
    fondoClaro: "#FFFFFF",

    textoClaro: "#0A0A0A",
    textoMedio: "#2D2D2D",
    textoOscuro: "#6B7280",
    textoEnOscuro: "#FFFFFF",      // Blanco — texto sobre fondos negros (sidebar activo)

    borde: "#CCCCCC",
    bordeHover: "#888888",

    gradientePrimario: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
    gradienteSecundario: "linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)",
    gradienteAcento: "linear-gradient(135deg, #E8E8E8 0%, #FFFFFF 100%)",

    fondoGlass: "#1C1C1C",

    sombra: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
    sombraMedia: "0 4px 12px rgba(0, 0, 0, 0.10), 0 2px 4px rgba(0, 0, 0, 0.06)",
    sombraGrande: "0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)",
  },

  metricas: {
    empleados: 568,
    departamentos: 9,
    tareasCompletadas: 13,
    progreso: 70,
  },

  ia: {
    nombre: "MAYIA",
    modelo: "Gemini 2.5 Flash",
    habilitado: true,
  }
};

export type BrandingConfig = typeof brandingConfig;