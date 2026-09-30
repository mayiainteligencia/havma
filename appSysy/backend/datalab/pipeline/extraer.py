"""
===============================================================================
extraer.py  -  Extractor de datos limpios desde los Excel del cliente
===============================================================================

Autor : Martin Cortes

Hermano de perfilar.py. Mientras perfilar.py DIAGNOSTICA (solo observa),
extraer.py EXTRAE: toma una hoja fuente, limpia lo minimo indispensable y la
guarda como JSON para que el sistema (frontend/src/data) la consuma directo.

Reglas de oro (igual que perfilar.py):
  1. No relleno vacios ni invento datos. Un valor vacio se queda como null.
  2. Limpio solo forma, no fondo: nombres de columna, espacios de sobra y
     columnas 100% vacias. NUNCA cambio el contenido de un dato (no corrijo
     mayusculas ni redondeo numeros: eso es decision del negocio, no mia).

Uso:
  python extraer.py <archivo.xlsx> <NombreHoja>
  python extraer.py uploads/ANALISIS.xlsx COMPILADO
  python extraer.py uploads/ANALISIS.xlsx COMPILADO --header 0

Salida:
  datos/<Hoja>.json     -> lista de filas [{columna: valor, ...}]
  datos/<Hoja>.meta.json-> metadata (fuente, filas, columnas, fecha, avisos)
===============================================================================
"""

import sys
import os
import re
import json
import math
import warnings
from datetime import datetime

import pandas as pd

warnings.filterwarnings("ignore")

AUTOR = "Martin Cortes"
FILAS_A_ESCANEAR_HEADER = 15   # cuantas filas de arriba reviso buscando el header


def limpiar_nombre_columna(col):
    """
    Arreglo la FORMA del nombre de columna, no el fondo:
      - quito saltos de linea:            'Lista\\nNominal' -> 'Lista Nominal'
      - colapso espacios repetidos
      - junto letras espaciadas (truco de titulo en Excel):
        'M  u  n  i  c  i  p  i  o'      -> 'Municipio'
    """
    s = str(col).replace("\n", " ").replace("\r", " ")
    s = re.sub(r"\s+", " ", s).strip()
    toks = s.split(" ")
    if len(toks) > 1 and all(len(t) == 1 for t in toks):
        return "".join(toks)   # eran letras sueltas separadas por espacios
    return s


def deduplicar(nombres):
    """Si tras limpiar quedan nombres repetidos, les pongo sufijo _2, _3..."""
    vistos = {}
    salida = []
    for n in nombres:
        if n in vistos:
            vistos[n] += 1
            salida.append(f"{n}_{vistos[n]}")
        else:
            vistos[n] = 1
            salida.append(n)
    return salida


def detectar_fila_header(ruta, hoja):
    """
    Busco la fila donde de verdad empieza la tabla. Muchos Excel traen titulo,
    logo y celdas combinadas arriba, asi que la fila 1 no es el encabezado.

    Heuristica: entre las primeras filas, elijo la que tenga MAS celdas de texto
    no vacias (un header suele ser toda texto) y que este seguida de filas con
    datos. Devuelvo el indice (0-based).
    """
    crudo = pd.read_excel(ruta, sheet_name=hoja, header=None, nrows=FILAS_A_ESCANEAR_HEADER)
    mejor_fila, mejor_score = 0, -1
    for i in range(len(crudo)):
        fila = crudo.iloc[i]
        no_vacias = fila.notna().sum()
        # cuento cuantas de esas celdas son texto (los headers son texto)
        textos = sum(1 for v in fila if isinstance(v, str) and v.strip())
        score = no_vacias + textos  # premio filas llenas y de texto
        if score > mejor_score:
            mejor_score, mejor_fila = score, i
    return mejor_fila


def a_valor_json(v):
    """NaN/NaT -> None. Float entero (1998.0) -> int. Texto -> strip."""
    if v is None:
        return None
    if isinstance(v, float):
        if math.isnan(v):
            return None
        if v.is_integer():
            return int(v)
        return v
    if isinstance(v, str):
        limpio = v.strip()
        return limpio if limpio != "" else None
    return v


def col_a_indice(ref):
    """'A'->0, 'F'->5, 'AA'->26. Tambien acepto numeros ('3'->3)."""
    ref = str(ref).strip().upper()
    if ref.isdigit():
        return int(ref)
    n = 0
    for ch in ref:
        n = n * 26 + (ord(ch) - ord("A") + 1)
    return n - 1


def parse_cols(rango):
    """'A:F' -> (0, 6) para usar en iloc[:, 0:6]. Fin inclusivo."""
    a, b = rango.split(":")
    return col_a_indice(a), col_a_indice(b) + 1


def extraer_hoja(ruta, hoja, header_row=None, cols=None, nombres=None, desde=None, hasta=None,
                 out=None, descartar_si_vacio=None, descartar_si_contiene=None):
    """
    Modo simple  : una tabla que ocupa toda la hoja (header auto o --header).
    Modo region  : para hojas irregulares (2 tablas lado a lado, titulos arriba).
                   Le digo el rango de columnas (--cols A:F), donde empiezan los
                   datos (--desde), donde terminan (--hasta) y opcionalmente los
                   nombres (--nombres), util cuando el header esta partido en 2
                   renglones o con celdas combinadas y sale como 'Unnamed'.
    """
    if not os.path.exists(ruta):
        print(f"ERROR: no encuentro el archivo '{ruta}'")
        sys.exit(1)

    avisos = []
    region = cols is not None or nombres is not None or desde is not None

    if region:
        # Leo crudo y recorto la region rectangular que me interesa.
        crudo = pd.read_excel(ruta, sheet_name=hoja, header=None)
        if cols:
            c0, c1 = parse_cols(cols)
            crudo = crudo.iloc[:, c0:c1]
        if nombres:
            columnas = nombres
            data_ini = desde if desde is not None else (header_row + 1 if header_row is not None else 0)
        else:
            hr = header_row if header_row is not None else 0
            columnas = [limpiar_nombre_columna(x) for x in crudo.iloc[hr]]
            data_ini = desde if desde is not None else hr + 1
        if len(columnas) != crudo.shape[1]:
            print(f"ERROR: diste {len(columnas)} nombres pero la region tiene {crudo.shape[1]} columnas")
            sys.exit(1)
        fin = hasta if hasta is not None else len(crudo)
        df = crudo.iloc[data_ini:fin].copy()
        df.columns = columnas
        header_row = f"region {cols or ''} filas {data_ini}..{fin - 1}"
    else:
        if header_row is None:
            header_row = detectar_fila_header(ruta, hoja)
        df = pd.read_excel(ruta, sheet_name=hoja, header=header_row)

    # 1) Nombres de columna limpios (forma, no fondo).
    df.columns = deduplicar([limpiar_nombre_columna(c) for c in df.columns])

    # 2) Tiro columnas 100% vacias (no aportan; el vacio total no es dato).
    vacias = [c for c in df.columns if df[c].isnull().all()]
    if vacias:
        df = df.drop(columns=vacias)
        avisos.append(f"columnas 100% vacias eliminadas: {vacias}")

    # 3) Tiro filas completamente vacias.
    antes = len(df)
    df = df.dropna(how="all")
    if len(df) < antes:
        avisos.append(f"filas totalmente vacias eliminadas: {antes - len(df)}")

    # 3.5) Filtros OPCIONALES de filas de ruido (totales, bandas de seccion).
    # Esto SI es decision de negocio, por eso solo actua si me lo pides tu.
    if descartar_si_vacio:
        cols_v = [c for c in descartar_si_vacio if c in df.columns]
        antes = len(df)
        for c in cols_v:
            df = df[df[c].notna()]
        if len(df) < antes:
            avisos.append(f"descartadas {antes - len(df)} filas con vacio en {cols_v}")

    if descartar_si_contiene:
        antes = len(df)
        for col, subs in descartar_si_contiene.items():
            if col in df.columns:
                mask = df[col].apply(
                    lambda x: any(str(s).lower() in str(x).lower() for s in subs)
                )
                df = df[~mask]
        if len(df) < antes:
            avisos.append(f"descartadas {antes - len(df)} filas por texto {descartar_si_contiene}")

    # 4) A registros JSON, respetando los null (no relleno nada).
    registros = [
        {col: a_valor_json(fila[col]) for col in df.columns}
        for _, fila in df.iterrows()
    ]

    # Guardado.
    base = os.path.dirname(os.path.abspath(__file__))
    carpeta = os.path.join(base, "datos")
    os.makedirs(carpeta, exist_ok=True)

    nombre_salida = out or hoja
    ruta_json = os.path.join(carpeta, f"{nombre_salida}.json")
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(registros, f, ensure_ascii=False, indent=2)

    meta = {
        "fuente": os.path.basename(ruta),
        "hoja": hoja,
        "header": header_row,
        "filas": len(registros),
        "columnas": list(df.columns),
        "n_columnas": len(df.columns),
        "generado": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "autor": AUTOR,
        "avisos": avisos,
        "nota": "Los vacios se conservan como null. No se rellenan ni se corrigen datos.",
    }
    ruta_meta = os.path.join(carpeta, f"{nombre_salida}.meta.json")
    with open(ruta_meta, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"OK  '{hoja}' -> {nombre_salida}: {len(registros)} filas x {len(df.columns)} columnas")
    print(f"    {header_row}")
    for a in avisos:
        print(f"    aviso: {a}")
    print(f"    -> datos/{nombre_salida}.json")
    print(f"    -> datos/{nombre_salida}.meta.json")


def _flag(nombre, defecto=None):
    """Lee --flag valor de sys.argv."""
    return sys.argv[sys.argv.index(nombre) + 1] if nombre in sys.argv else defecto


def correr_receta(ruta_receta):
    """
    Corre TODAS las extracciones de un archivo desde una receta JSON. Ideal para
    hojas con varias tablas/listas distintas: las declaras una vez y no repites
    comandos largos. Formato:

    {
      "archivo": "uploads/ANALISIS.xlsx",
      "extracciones": [
        { "hoja": "COMPILADO", "out": "COMPILADO" },
        { "hoja": "COMITÉ", "cols": "A:F", "desde": 6, "hasta": 626,
          "nombres": ["distrito","municipio","rep_casilla","importe_casilla",
                      "rep_generales","importe_generales"],
          "out": "COMITE_representantes",
          "descartar_si_vacio": ["distrito","municipio"] }
      ]
    }
    """
    with open(ruta_receta, encoding="utf-8") as f:
        receta = json.load(f)
    archivo = receta["archivo"]
    print(f"RECETA: {os.path.basename(ruta_receta)} sobre {archivo}\n")
    for ex in receta["extracciones"]:
        extraer_hoja(
            archivo, ex["hoja"],
            header_row=ex.get("header"), cols=ex.get("cols"),
            nombres=ex.get("nombres"), desde=ex.get("desde"), hasta=ex.get("hasta"),
            out=ex.get("out"),
            descartar_si_vacio=ex.get("descartar_si_vacio"),
            descartar_si_contiene=ex.get("descartar_si_contiene"),
        )
        print()


if __name__ == "__main__":
    # Modo receta: python extraer.py --receta receta.json
    if "--receta" in sys.argv:
        correr_receta(_flag("--receta"))
        sys.exit(0)

    if len(sys.argv) < 3:
        print("USO 1 (una hoja): python extraer.py <archivo.xlsx> <NombreHoja> [opciones]")
        print("USO 2 (varias):   python extraer.py --receta receta.json")
        print("Opciones:")
        print("  --header N         fila del encabezado (0-based). Sin esto, se detecta solo.")
        print("  --cols A:F         rango de columnas a extraer (modo region).")
        print("  --desde N          fila (0-based) donde empiezan los datos.")
        print("  --hasta N          fila (0-based, exclusiva) donde terminan los datos.")
        print("  --nombres a,b,c    nombres de columna explicitos (para headers partidos).")
        print("  --out nombre       nombre del archivo de salida (sin .json).")
        print("Ejemplos:")
        print("  python extraer.py uploads/ANALISIS.xlsx COMPILADO")
        print('  python extraer.py uploads/ANALISIS.xlsx COMITÉ --cols A:F --desde 6 --hasta 626 \\')
        print('     --nombres "distrito,municipio,rep_casilla,importe_casilla,rep_generales,importe_generales" \\')
        print("     --out COMITE_representantes")
        sys.exit(1)

    ruta, hoja = sys.argv[1], sys.argv[2]
    header = int(_flag("--header")) if _flag("--header") else None
    desde = int(_flag("--desde")) if _flag("--desde") else None
    hasta = int(_flag("--hasta")) if _flag("--hasta") else None
    cols = _flag("--cols")
    out = _flag("--out")
    nombres_raw = _flag("--nombres")
    nombres = [n.strip() for n in nombres_raw.split(",")] if nombres_raw else None

    extraer_hoja(ruta, hoja, header_row=header, cols=cols, nombres=nombres,
                 desde=desde, hasta=hasta, out=out)
