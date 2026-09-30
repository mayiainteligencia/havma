# DataLab — Pipeline ETL de Medios

Laboratorio de procesamiento de datos de inventario OOH, audiencias y
circuitos publicitarios para la plataforma AI Acceleration Lab México.

## Flujo

```
uploads/ → perfilar → normalizar → datos/ → frontend consume datos/
```

## Uso rápido

```bash
source venv/bin/activate
python run.py                        # procesa todo lo que esté en uploads/
python run.py --solo circuito        # solo el normalizador de circuito exterior
python run.py --solo inventario      # solo el normalizador de inventario OOH
python run.py --perfil archivo.xlsx  # solo genera el perfil de calidad
```

## Agregar un Excel nuevo

1. Copiarlo a `uploads/`
2. Correr: `python run.py`
3. El JSON limpio aparece en `datos/`
4. El frontend lo consume desde `src/data/ooh.ts` (import directo del JSON)

El tipo de fuente se detecta por el nombre del archivo (`circuito`, `mxm`,
`planta`, `inventario`). Si no coincide con ningún patrón, solo se corre el
perfilador de calidad — nunca se inventa una normalización.

## Estructura

```
pipeline/perfilar.py       — data profiling genérico (conservado del v1)
pipeline/extraer.py        — extracción por receta JSON (conservado del v1)
pipeline/normalizar/       — reglas de limpieza por tipo de fuente
recetas/                   — configuración de columnas por proveedor
uploads/                   — Excels de entrada (no versionar datos de cliente)
datos/                     — JSONs de salida (sí versionar, son el contrato con el frontend)
reportes/                  — perfiles de calidad generados automáticamente
```

## Fuentes soportadas

| Fuente | Entrada | Salida | Registros |
|---|---|---|---|
| Circuito Exterior Medido | `*circuito*.xlsx` (hojas HOJA/RESUMEN/FILTROS) | `datos/ooh_circuito.json` + `datos/ooh_resumen_circuito.json` | 77 soportes + 9 zonas |
| Inventario MXM-Planta | `*mxm*` / `*planta*` / `*inventario*` | `datos/ooh_inventario.json` | 698 soportes |

Cada receta en `recetas/` documenta el esquema y los problemas de calidad
conocidos de esa fuente.

## Reglas de datos

1. Los vacíos se quedan como `null`. Nunca se rellenan ni se inventan.
2. Se limpia forma (categorías, espacios, tipos), no fondo (no se corrigen
   tarifas ni coordenadas).
3. Un soporte sin coordenadas no se descarta: entra con `mapeable: false`.
4. Toda corrida deja su reporte de calidad con timestamp en `reportes/`.
