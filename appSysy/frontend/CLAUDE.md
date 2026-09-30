# Dashboard MAYIA escucha — Frontend

Stack: React 19 + Vite 7 + TypeScript · recharts · lucide-react · estilos inline con tokens de `src/config/branding.ts`.

Routing: `src/App.tsx` con `useState('activeSection')` + `switch` (sin react-router). El menú vive en `src/components/Sidebar.tsx` (desktop) y `src/components/ResponsiveLayout.tsx` (bottom nav móvil) — **ambas listas se mantienen sincronizadas a mano**.

Backends vía proxy de Vite (`vite.config.ts`): `/api/monitor` → Python `:8001`, `/api` → `:3001`.

---

## Informe de cambios — rama `monitoria`

### 1. Limpieza de código muerto (26 archivos eliminados)
Se borraron componentes y módulos que no eran alcanzables desde ningún menú:
- **Departamentos**: RecursosHumanos, FinanzasContabilidad, Operaciones, VentasMarketing, TecnologiasInformacion, Administracion, Analiticos.
- **sideBarR** + sus módulos: ReclutamientoList, CapacitacionStatus.
- **Módulos huérfanos**: DashboardEjecutivo, DashboardEpidemiologico, DashboardAbastecimiento, MapaCalorEstados, PanelKPIs, ClustersSegmentacion, AbastecimientoModule, Alertaempresa, ClusterModule, DashboardejecutivoModule, EpidemologiaModule, MapaCalorModule, Minicalendarcard.
- **Sin importadores**: carpeta `types/`, `utils/calendarUtils.ts`, `config/alertasConfig.ts`.

Quedó vivo: Dashboard + sus 9 cards, MonitorMedios, Ciberseguridad/Playground/Academia, Header (con AsistenteIAChat), Sidebar/ResponsiveLayout, branding.

### 2. Nueva sección: **Monitor IA** (`src/components/MonitorIA.tsx`)
Dashboard de presentación (datos **dummy**, la lógica/datos reales van después) con los 10 módulos adicionales solicitados para MVS, cada uno como "cuadrito":
1. Comercial — activación automática de campañas (Meta/Google)
2. Centros de procesos automatizados
3. Talento y programación (análisis de parrillas)
4. Inteligencia competitiva (share of voice)
5. Trending topics (radio + redes)
6. Hipersegmentación de audiencias
7. Portal para clientes (Brand Portal)
8. Integración con INRA y audiencia
9. Estrategia hacia 2027
10. Integración Web Services INRA

Cada card: icono numerado, badge de estado, 3 KPIs con tendencia, mini-visualización (área / barras / donut / gauge con recharts) y tiempo de desarrollo. **Sin precios** (indicación de Vero/CEO). Hero con 4 KPIs globales. Responsive (grid → 1 columna en móvil), animaciones de entrada/hover.

**Detalle por módulo (`src/components/MonitorIADetalles.tsx`)** — cada cuadrito es **clickeable** (clic / Enter / Espacio) y abre su detalle en **modal** (cierra con X, backdrop o Escape; bloquea scroll de fondo). El registro `META` mapea num → componente de detalle; `ModuloDetalleModal` lo renderiza. Artefacto por módulo:
1. Comercial → feed *marca → evento → pauta (Meta/Google)* con hora exacta de transmisión.
2. Procesos → lista de clips con waveform, play/descargar, chip "verificable", botón generar reporte.
3. Talento → menciones por programa + barra de diarización por locutor.
4. Competitiva → tabla comparativa de competidores + lista de oportunidades.
5. Trending → temas con chips X/IG/TikTok + cruce radio↔redes por tema.
6. Hipersegmentación → demográfico (edad/género) + scatter de clusters (recharts).
7. Brand Portal → preview tipo ventana de navegador con el panel del anunciante.
8. INRA → scatter menciones↔rating de audiencia + ranking de impacto + valor de pauta.
9. Estrategia 2027 → roadmap de 4 fases con estado/avance/hitos.
10. Web Services → log de sincronización estilo terminal.

Los botones (play/descargar/generar reporte) responden con un toast (sin lógica real).

### 3. Nueva sección: **Inteligencia Electoral** (`src/components/InteligenciaElectoral.tsx`)
Desglose del anexo "Plataforma de Inteligencia Electoral 2027". Tema claro, datos **dummy**. Paneles:
- **Share of Voice** por candidato + **presencia por partido** (donut) + **evolución semanal** (multi-línea).
- **Sentimiento por candidato** (barras apiladas pos/neutral/neg) + **agenda temática**.
- **Sentimiento por estación** y **por programa** (componente `SentList` reutilizable).
- **Narrativas emergentes** (con tendencia) + **correlación radio vs redes** (área comparada).
- **Monitoreo de discurso político** + **ranking de presencia mediática** por estación.
- **Mapa de narrativa** (red SVG actores↔temas) + **Mapa de México** (choropleth con SVG real).
- Botón **Reporte semanal** en el hero (toast).

El panel **Monitoreo de discurso político** replica la mecánica de Monitor de Medios:
chips de **partidos predefinidos** (Morena, PAN, PRI, MC, PVEM, PT) que se encienden/apagan
para filtrar el feed en vivo ("escuchar sobre…"), con tarjetas estilo "testigos"
(borde de color por partido, badge, estación, hora, sentimiento, transcripción, chips de
candidato/tema). Datos en el array `FEED`; al conectar el backend real se reemplaza ese array.

**Mapa de México**: usa la geometría SVG real de los 32 estados, extraída a
`src/data/mexicoPaths.ts` (`estadosPaths`, viewBox `0 0 959 593`) desde el viejo `MapaCalor.tsx`
(componente epidemiológico **huérfano**, ahora refactorizado para importar de ese data file).
El electoral pinta cada estado en verde MAYIA según `MENCIONES_ESTADO` con hover + tooltip.

### Mapa de archivos clave (rama)
- `App.tsx` — routing + títulos + casos del switch.
- `components/MonitorIA.tsx` — grid de 10 tiles + hero + estado del modal.
- `components/MonitorIADetalles.tsx` — detalles por módulo, `META`, `ModuloDetalleModal`.
- `components/InteligenciaElectoral.tsx` — dashboard electoral completo.
- `components/MonitorMedios.tsx` — **funcional de verdad** (radio en vivo, WS, testigos). **No tocar sin pedir.**
- `data/mexicoPaths.ts` — geometría SVG de estados (compartida).

### Menú resultante
Dashboard General · Monitor de Medios · Monitor IA · Inteligencia Electoral
(+ secciones extra: Ciberseguridad, Playground, Academia).

### Estado de cobertura vs documento MVS
A nivel **visual/dummy** está cubierto prácticamente todo el doc (10 módulos + 7 capacidades del
anexo electoral). Lo que NO está: la **lógica/datos reales** (NLP, APIs Meta/Google, INRA,
diarización, ingestión de redes — fase 2, se cotiza con "Poncho"), y un par de conceptos sin
cuadrito propio (clones IA de audiencia, knowledge graph / coaliciones-instituciones).

### Pendientes / notas
- Todo Monitor IA e Inteligencia Electoral es **dummy**; falta cablear datos/lógica reales.
- `MonitorMedios` SÍ funciona (no es dummy) — no modificar sin pedir.
- WebSocket de MonitorMedios sigue hardcoded a `ws://localhost:8001` (se rompe en prod).
- `menuItems` está duplicado entre Sidebar y ResponsiveLayout.
- `MapaCalor.tsx` quedó huérfano (epidemiológico); ya solo aporta nada salvo que se reuse.
- Bundle ~740 kB (recharts); se puede lazy-load si hace falta.
- Mapa de México es choropleth real; mapa de narrativa es SVG con posiciones fijas (no force-graph).
