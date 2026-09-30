# Dashboard MAYIA escucha — Frontend

> Informe técnico completo de la arquitectura y de los cambios de la rama: ver [`CLAUDE.md`](./CLAUDE.md).

## Cambios — rama `monitoria`

1. **Limpieza**: se eliminaron 26 archivos de código muerto (departamentos sin menú, `sideBarR`, módulos huérfanos, `types/`, `utils/calendarUtils`, `config/alertasConfig`).
2. **Nueva sección Monitor IA** (`src/components/MonitorIA.tsx`): dashboard de presentación con los 10 módulos adicionales de MVS como "cuadritos" (KPIs + mini-charts recharts). Cada cuadrito es **clickeable** y abre su **detalle en modal** (`src/components/MonitorIADetalles.tsx`): feed comercial, clips con play/descarga, tabla competitiva, roadmap, log de sync, etc. Datos dummy, sin precios.
3. **Nueva sección Inteligencia Electoral** (`src/components/InteligenciaElectoral.tsx`): desglose del anexo electoral 2027 — share of voice, sentimiento (por candidato, estación y programa), narrativas, correlación radio/redes, ranking, **mapa de narrativa**, **mapa de México** (choropleth con SVG real de `src/data/mexicoPaths.ts`) y botón de reporte semanal. El panel *Monitoreo de discurso político* funciona como Monitor de Medios, con chips de partidos predefinidos (Morena, PAN, PRI, MC, PVEM, PT) que filtran el feed en vivo.

Menú actual: **Dashboard General · Monitor de Medios · Monitor IA · Inteligencia Electoral** (+ Ciberseguridad, Playground, Academia).

Monitor IA e Inteligencia Electoral usan datos **dummy**; la lógica y datos reales se conectan después. **Monitor de Medios sí es funcional** (radio en vivo / WebSocket) — no modificar sin pedir.

> Informe técnico completo: [`CLAUDE.md`](./CLAUDE.md).

```bash
npm install
npm run dev      # desarrollo
npm run build    # producción (tsc -b && vite build)
```

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# havma
