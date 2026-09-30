# AI Acceleration Lab México · plataforma de inteligencia de medios

Tablero de inteligencia de medios y marketing para **Havas Media México**.
Convierte el monitoreo de radio en vivo, la inversión publicitaria y las señales
digitales en una vista de mando por cuenta: Share of Voice por plaza, valor de
la inversión, alertas accionables y un asistente que conoce toda la plataforma.

**Cuenta activa del tablero:** Liverpool. **Único módulo con datos reales:**
Testigos IA (servicio Python de monitoreo on-air). Todo lo demás corre con datos
mock deterministas y está marcado como tal en la interfaz.

---

## Secciones

Cada una lleva en el menú un punto de estado: 🟢 activo (datos reales) ·
🟡 demo (datos estructurados) · ⚪ en activación (maqueta).

| Sección | id | Componente | Estado | Qué muestra |
|---|---|---|---|---|
| War Room de Cliente | `warroom` | `WarRoom.tsx` | 🟡 | Bienvenida + MAYIA, cartera de 12 cuentas, mapa de SOV por plaza, resumen y accesos |
| Testigos IA | `testigos` | `TestigosIA.tsx` | 🟢 | Radio en vivo: transcripción y verificación de pauta on-air |
| Cerebro Orquestador | `cerebro` | `CerebroOrquestador.tsx` | ⚪ | 10 módulos con detalle en modal (ver jerarquía abajo) |
| Comando de Campaña | `comando` | `ComandoCampana.tsx` | 🟡 | KPIs, alertas del sistema, actividad, inversión por marca, pauta por franja |
| Investment Value IA | `investment` | `InvestmentValue.tsx` | 🟡 | Selector de periodo, plazas lideradas, tendencia de SOV, top plazas |
| Alertas de Marca | `alertas` | `AlertasMarca.tsx` | 🟡 | Alertas en vivo, discrepancias de pauta, riesgo de cobertura, competencia |
| Monitor Digital & E-Commerce | `digital` | `MonitorDigital.tsx` | ⚪ | Embudo, marketplaces, GEO/AEO, conexión de cuentas y su feedback |
| Journey Intelligence | `journey` | `JourneyIntelligence.tsx` | ⚪ | Etapas del journey, fricciones, touchpoints por canal, drop-off |
| Ad Fraud & Brand Safety | `adfraud` | `departamentos/AdFraudBrandSafety.tsx` | ⚪ | Tráfico inválido, viewability, adyacencia riesgosa, presupuesto recuperable |
| Studio Creativo | `studio` | `departamentos/StudioCreativo.tsx` | ⚪ | Brief → variantes por formato → prueba A/B |
| Academia | `academia` | `departamentos/Academia.tsx` | ⚪ | 3 rutas de capacitación, 12 cursos |

Navegación sin router: `src/App.tsx` con `useState` + `switch`.

**Fuente única del menú:** [`src/config/menu.ts`](frontend/src/config/menu.ts).
De ahí leen `Sidebar.tsx`, `ResponsiveLayout.tsx`, el título del header, el
buscador y el asistente. Para agregar una sección: entrada en `menu.ts` + `case`
en el `switch`. Nada más se mantiene a mano.

---

## Datos

Todo lo que no viene del monitor Python sale de **mocks deterministas** — misma
salida en cada carga, con las cifras derivadas unas de otras para que sean
coherentes entre paneles.

```
frontend/src/data/
├── media.ts        marcas, 32 plazas, 3 periodos, alertas, cartera de clientes
├── plataforma.ts   catálogo de los 10 módulos del Cerebro Orquestador
├── asistente.ts    cerebro de MAYIA (navegación + conocimiento + respuestas)
└── mexicoPaths.ts  geometría SVG de los 32 estados (no editar)
```

**`media.ts`** es la capa central. Las plazas son las 32 entidades de
`mexicoPaths.ts` leídas como mercados. Reglas que respeta:

- El SOV por plaza **siempre suma 100%**.
- La inversión sale del peso de la plaza; los GRPs, de la inversión.
- La inversión crece periodo a periodo (2023 → 2025).

Cuenta activa: **Liverpool**, contra su set competitivo real (El Palacio de
Hierro, Sears, Coppel). Suburbia no entra como competidor: es del mismo grupo.
Cambiar de cuenta hoy es editar `MARCAS` en `media.ts` — no hay selector en la UI.

### Chequeos ejecutables

```bash
cd frontend
node --experimental-strip-types scripts/media.check.ts     # coherencia de los datos
npx esbuild scripts/asistente.check.ts --bundle --platform=node --format=esm \
  --outfile=/tmp/ck.mjs && node /tmp/ck.mjs                # conocimiento del asistente
```

El de `media` verifica que el SOV cierre en 100, que inversión y GRPs
correlacionen y que la tendencia sea creciente. El del asistente verifica que
navegue, que conozca las 11 secciones y los 10 módulos. Si agregas una sección o
un módulo y el asistente se queda atrás, ese check falla.

---

## Cerebro Orquestador

Nomenclatura fija — **"agente" no se usa como término genérico**:

| Capa | Cuántos | Qué hacen | Módulos |
|---|---|---|---|
| **Operadores** | 4 | Ejecutan | Testigos (🟢 en vivo), Pauta, Contenido, E-Commerce |
| **Modelos** | 3 | Predicen | Mix de Medios (MMM), Predictivo de Alcance, Elasticidad de Precio |
| **Agentes de Insights** | 3 | Generan hallazgos | Consumidor, Competencia, Anomalías |

El catálogo vive en `data/plataforma.ts`; la grid y los modales lo consumen y le
suman lo visual (icono, métricas, gráfica). El asistente lo lee de ahí también.

---

## Piezas interactivas

- **MAYIA (asistente)** — `Herocard.tsx` + `data/asistente.ts`. **Front-only, sin
  LLM**: reconocimiento de patrones sobre los datos reales de la plataforma. Se
  abre a pantalla completa con el núcleo (`BrainCanvas.tsx`) girando al centro y
  el fondo desenfocado. Sabe navegar ("ve a Alertas"), explicar cualquier sección
  o módulo, y responder por plazas, inversión, alcance, competencia, cartera y
  alertas. Escucha por voz (Web Speech API); di **"MAYIA"** para enviar. El mismo
  núcleo está en el header como mini-jarvis (evento `jarvis:open`).
- **Buscador de secciones** — en el header; filtra por título/alias y navega.
- **Toasts en vivo** — `components/shared/toast.tsx`. Simulan detecciones on-air.
- **Confirmar plan** — `components/shared/confirm.tsx`. Todo botón "Activar plan"
  pide confirmación antes de aplicar.
- **Mapa por plaza** — `MapaMexicoDashboard.tsx`. La intensidad es el SOV del
  cliente; hover/click abre inversión, GRPs, alcance y señales por canal.

---

## Correr el proyecto

Detalle de los 3 procesos en [`COMO_CORRER.md`](./COMO_CORRER.md).

Todo el tablero **menos Testigos IA** funciona solo con el frontend:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
```

**Testigos IA** requiere el servicio Python en `:8001`:

```bash
cd backend/monitorsol
./venv/bin/uvicorn main:app --port 8001    # sin --reload
```

El backend Node (`:3001`) solo sirve `/api/chat/message`, que consume
`AsistenteIAChat.tsx`. El resto del tablero no lo necesita.

### Variables de entorno

| Archivo | Variable | Para qué |
|---|---|---|
| `frontend/.env` (de `.env.example`) | `VITE_MONITOR_WS_URL` | WebSocket del monitor. Default `ws://localhost:8001` |
| `backend/.env` (de `.env.example`) | `GEMINI_API_KEY` | Chat del backend Node |
| `backend/.env` | `PORT` | Puerto del Node, default 3001 |

El REST del monitor va por el proxy de Vite (`/api/monitor` → `:8001`); el
WebSocket no puede, por eso su URL es configurable.

---

## Branding

`src/config/branding.ts` centraliza nombre, logo y colores:
**AI Acceleration Lab México**, logo `assets/logosNativos/logohavas.png`,
primario morado `#8B5CF6` sobre fondo claro.

El logo de Havas es blanco sobre transparente: donde se pinta va sobre el negro
`colores.secundario`. Los favicons se generaron desde ese mismo PNG.

## Stack

React 19 · Vite 7 · TypeScript · recharts · lucide-react · estilos inline con
tokens de `branding.ts`. Sin router, sin Tailwind, sin design system externo.
Backend Node/Express (`:3001`) + monitor Python FastAPI (`:8001`).

---

## Deuda conocida

- **`backend/monitorsol` solo existe como `.pyc`** (Python 3.12), sin código
  fuente. Es el único componente realmente funcional y no se puede editar ni
  recompilar. Recuperar el `.py` es la prioridad técnica del proyecto.
- Las cifras son demo con **nombres de marcas reales**: cuidado con leerlas como
  datos de negocio en una presentación.
- No hay selector de cuenta en la UI; cambiar de cliente es editar `media.ts`.
- Bundle 936 kB (279 kB gzip), recharts sin code-splitting.
- 23 errores de lint preexistentes, concentrados en `Herocard.tsx`,
  `TestigosIA.tsx` y las cards del dashboard.
