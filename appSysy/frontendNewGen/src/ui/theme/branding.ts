// ÚNICO archivo de marca: cambia colores y tipografía aquí y toda la UI se actualiza.
// El ítem activo del sidebar usa el color de fondo de la página (bg) para fundirse con ella.
// Havas = rojo, negro y blanco; mantenerlos como base en cualquier ajuste.
// Si cambias la tipografía, importa su @fontsource en app/main.tsx.
export const branding = {
  nombre: 'Havas Data',
  fuentes: {
    titulo: "'Poppins', sans-serif",
    cuerpo: "'Poppins', 'Inter', sans-serif",
  },
  marca: { rojo: '#96122E', rojoHover: '#C41E3D', negro: '#0B0B0C', blanco: '#FFFFFF' },
  temas: {
    // Claro: sidebar negra, fondo blanco, acentos guinda.
    claro: {
      bg: '#FFFFFF', surface: '#F5F5F6', surface2: '#E9E9EC',
      text: '#121214', textMuted: '#6B6B70', title: '#96122E', border: 'rgba(0,0,0,0.12)',
      accent: '#96122E', accentHover: '#7A0E25', onAccent: '#FFFFFF',
      sidebarBg: '#000000', sidebarText: 'rgba(255,255,255,0.8)', sidebarActiveText: '#96122E',
      // Paleta de gráficas: un acento en varios tonos + neutros.
      serie1: '#96122E', serie2: '#C23B55', serie3: '#E58A9B', serie4: '#6B6B70', serie5: '#A9A9AF', serie6: '#121214',
    },
    // Oscuro: sidebar guinda, fondo oscuro, letras blancas.
    oscuro: {
      bg: '#0E0E10', surface: '#1A1A1E', surface2: '#26262B',
      text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.62)', title: '#FFFFFF', border: 'rgba(255,255,255,0.14)',
      accent: '#A8152F', accentHover: '#C41E3D', onAccent: '#FFFFFF',
      sidebarBg: '#7D0F28', sidebarText: 'rgba(255,255,255,0.88)', sidebarActiveText: '#FFFFFF',
      serie1: '#E0243F', serie2: '#F2788B', serie3: '#FFFFFF', serie4: '#9A9AA2', serie5: '#C41E3D', serie6: '#5C5C64',
    },
  },
} as const;

const kebab = (k: string) => k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
const bloque = (sel: string, t: Record<string, string>) =>
  `${sel}{${Object.entries(t).map(([k, v]) => `--${kebab(k)}:${v};`).join('')}}`;

/** Inyecta la marca como variables CSS. [data-theme] en cualquier elemento fuerza ese tema localmente. */
export function aplicarBranding() {
  const { fuentes, temas } = branding;
  const css =
    `:root{--font-title:${fuentes.titulo};--font-body:${fuentes.cuerpo};}` +
    bloque(':root, [data-theme="claro"]', temas.claro) +
    bloque('[data-theme="oscuro"]', temas.oscuro);
  let el = document.getElementById('branding') as HTMLStyleElement | null;
  if (!el) { el = document.createElement('style'); el.id = 'branding'; document.head.appendChild(el); }
  el.textContent = css;
}
