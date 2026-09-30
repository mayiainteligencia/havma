"""
run.py — Orquestador del DataLab

Uso:
  python run.py                        # procesa todos los Excels en uploads/
  python run.py --solo circuito        # solo circuito exterior
  python run.py --solo inventario      # solo inventario MXM
  python run.py --perfil archivo.xlsx  # solo genera perfil de calidad

El script detecta el tipo de Excel por su nombre.
Si el nombre no coincide con ningún patrón conocido, solo corre el perfilador.
"""
import argparse
import sys
from pathlib import Path

# Rutas base
ROOT = Path(__file__).parent
UPLOADS = ROOT / "uploads"
DATOS = ROOT / "datos"
REPORTES = ROOT / "reportes"

# Patrones de nombre → normalizador
PATRONES = {
    "circuito": "circuito_exterior",    # cualquier nombre que contenga 'circuito'
    "mxm": "mxm_planta",               # cualquier nombre que contenga 'mxm'
    "planta": "mxm_planta",            # o 'planta'
    "inventario": "mxm_planta",        # o 'inventario'
}


def detectar_tipo(archivo: Path) -> str | None:
    nombre = archivo.stem.lower()
    for patron, tipo in PATRONES.items():
        if patron in nombre:
            return tipo
    return None


def procesar_circuito(archivo: Path):
    from pipeline.normalizar.ooh_circuito import NormalizadorCircuito
    norm = NormalizadorCircuito(
        ruta_excel=archivo,
        ruta_salida=DATOS / "ooh_circuito.json",
        ruta_reportes=REPORTES,
    )
    norm.cargar().normalizar().guardar()
    norm.reporte()
    print("✓ Circuito procesado → datos/ooh_circuito.json")


def procesar_inventario(archivo: Path):
    from pipeline.normalizar.ooh_inventario import NormalizadorInventario
    norm = NormalizadorInventario(
        ruta_excel=archivo,
        ruta_salida=DATOS / "ooh_inventario.json",
        ruta_reportes=REPORTES,
    )
    norm.cargar().normalizar().guardar()
    norm.reporte()
    print("✓ Inventario procesado → datos/ooh_inventario.json")


def solo_perfil(archivo: Path):
    """Corre perfilar.py sobre un archivo individual."""
    import subprocess
    resultado = subprocess.run(
        [sys.executable, str(ROOT / "pipeline" / "perfilar.py"), str(archivo)],
        capture_output=True, text=True
    )
    print(resultado.stdout)
    if resultado.returncode != 0:
        print("STDERR:", resultado.stderr)


def main():
    parser = argparse.ArgumentParser(description="DataLab ETL — AI Acceleration Lab México")
    parser.add_argument("--solo", choices=["circuito", "inventario"],
                        help="Procesar solo un tipo de fuente")
    parser.add_argument("--perfil", type=str,
                        help="Solo generar perfil de calidad del archivo indicado")
    args = parser.parse_args()

    if args.perfil:
        archivo = UPLOADS / args.perfil
        if not archivo.exists():
            print(f"ERROR: No se encontró {archivo}")
            sys.exit(1)
        solo_perfil(archivo)
        return

    # Buscar Excels en uploads/ (uploads/archivo/ guarda fuentes archivadas, se ignora)
    excels = sorted(list(UPLOADS.glob("*.xlsx")) + list(UPLOADS.glob("*.xls")))
    if not excels:
        print("No hay archivos Excel en uploads/")
        return

    print(f"Encontrados {len(excels)} archivos en uploads/:\n")
    for e in excels:
        print(f"  {e.name}")
    print()

    DATOS.mkdir(exist_ok=True)
    REPORTES.mkdir(exist_ok=True)

    for archivo in excels:
        tipo = detectar_tipo(archivo)

        # Filtro --solo
        if args.solo == "circuito" and tipo != "circuito_exterior":
            continue
        if args.solo == "inventario" and tipo != "mxm_planta":
            continue

        print(f"─── Procesando: {archivo.name} → tipo detectado: {tipo or 'desconocido'}")

        if tipo == "circuito_exterior":
            procesar_circuito(archivo)
        elif tipo == "mxm_planta":
            procesar_inventario(archivo)
        else:
            print("  Tipo no reconocido — solo generando perfil de calidad")
            solo_perfil(archivo)

    print("\n✓ DataLab completado.")
    print(f"  JSONs en: {DATOS}")
    print(f"  Reportes en: {REPORTES}")


if __name__ == "__main__":
    main()
