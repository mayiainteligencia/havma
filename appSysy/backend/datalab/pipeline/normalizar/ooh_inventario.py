"""
normalizar/ooh_inventario.py
Normaliza el Excel de inventario OOH del operador MXM.
Problemas documentados en el data profiling:
  - Fila 0 tiene un header fantasma '|' → leer con header=1
  - Filas duplicadas exactas al final del archivo → eliminar (ver NOTA_DEDUP)
  - ESTRUCTURA: 24 variantes para 6 tipos → normalizar
  - VISTA: 16 variantes para 5 valores → normalizar
  - ESTADO: 2 formas de CDMX → normalizar
  - DISPONIBILIDAD: 4 categorías mezcladas (texto, fecha, nulo) → normalizar
  - TARIFA: 1 fila con #VALUE! (clave 01.062B) → None
  - 20 soportes sin coordenadas → incluir con lat=0, lon=0, mapeable=False
  - 101 NaN en disponibilidad → estado 'desconocido'
  - 'Reproduce spot' en TIPO DE LONA → es_digital=True (DOOH)

NOTA_DEDUP (desviación documentada respecto a la especificación original):
  La especificación pedía truncar en la fila 655 asumiendo que las últimas ~50
  filas eran un copy-paste de Morelos + Querétaro. Se verificó contra el archivo
  y es falso: las filas 655-704 son 50 soportes REALES de Querétaro (24),
  Morelos (20) y Puebla (6) — ninguna de sus CLAVEs aparece antes de la fila
  655, y esos tres estados no existen en el bloque 0-654. Truncar ahí borraría
  inventario legítimo.
  Los duplicados reales son 7 filas idénticas (índices 682, 683, 686, 687, 689,
  690, 704), que sí se eliminan con drop_duplicates().
"""
from __future__ import annotations
import pandas as pd
from .base import NormalizadorBase


class NormalizadorInventario(NormalizadorBase):

    FUENTE = "mxm_planta"
    VERSION_SCHEMA = "1.0"

    def cargar(self) -> "NormalizadorInventario":
        self._log(f"Cargando: {self.ruta_excel.name}")
        # header=1 porque la fila 0 tiene el carácter '|' como header basura
        self.df = pd.read_excel(self.ruta_excel, header=1)
        self._log(f"  Filas crudas: {len(self.df)} | Columnas: {list(self.df.columns)}")
        return self

    def normalizar(self) -> "NormalizadorInventario":
        df = self.df.copy()

        # 1. Eliminar filas duplicadas exactas (ver NOTA_DEDUP en el docstring)
        antes = len(df)
        dups = df[df.duplicated()]
        df = df.drop_duplicates().copy()
        self._log(f"  Filas tras eliminar duplicados exactos: {len(df)} (eran {antes})")
        if len(dups):
            self._log(f"    claves duplicadas: {sorted(dups['CLAVE'].dropna().unique().tolist())}")

        # 2. Eliminar filas completamente vacías
        df = df.dropna(how="all")
        self._log(f"  Filas tras drop vacías: {len(df)}")

        # 3. Normalizar TARIFA (1 fila tiene #VALUE! → viene como NaN)
        df["tarifa_mxn"] = pd.to_numeric(df["TARIFA PUBLICADA"], errors="coerce")
        n_tarifa_nula = int(df["tarifa_mxn"].isna().sum())
        if n_tarifa_nula:
            claves = df.loc[df["tarifa_mxn"].isna(), "CLAVE"].tolist()
            self._log(f"  ⚠ Tarifas inválidas (#VALUE! o nulas): {n_tarifa_nula} → None {claves}")

        # 4. Normalizar coordenadas
        df["lat"] = pd.to_numeric(df["LATITUD"], errors="coerce")
        df["lon"] = pd.to_numeric(df["LONGITUD"], errors="coerce")
        df["mapeable"] = df["lat"].between(14, 33) & df["lon"].between(-120, -86)
        n_sin_coords = int((~df["mapeable"]).sum())
        self._log(f"  Soportes sin coordenadas válidas (no mapeables): {n_sin_coords}")
        # Soportes sin coords se incluyen en la lista pero con lat=0, lon=0
        df.loc[~df["mapeable"], "lat"] = 0.0
        df.loc[~df["mapeable"], "lon"] = 0.0

        # 5. Normalizar ESTADO
        df["estado_norm"] = df["ESTADO"].apply(self.norm_estado)
        self._log(f"  Estados: {df['estado_norm'].value_counts().to_dict()}")

        # 6. Normalizar ESTRUCTURA
        df["estructura_norm"] = df["ESTRUCTURA"].apply(self.norm_estructura)
        self._log(f"  Estructuras: {df['estructura_norm'].value_counts().to_dict()}")

        # 7. Normalizar VISTA
        df["vista_norm"] = df["VISTA"].apply(self.norm_vista)
        self._log(f"  Vistas: {df['vista_norm'].value_counts(dropna=False).to_dict()}")

        # 8. Detectar DOOH por TIPO DE LONA
        df["es_digital"] = df["TIPO DE LONA"].apply(
            lambda v: "reproduce spot" in str(v).lower() if pd.notna(v) else False
        )

        # 9. Normalizar DISPONIBILIDAD
        disp_parsed = df["DISPONIBILIDAD"].apply(self.parse_disponibilidad)
        df["disp_estado"] = disp_parsed.apply(lambda x: x["estado"])
        df["disp_fecha"] = disp_parsed.apply(lambda x: x["fecha"])

        # Log de distribución de disponibilidad
        dist = df["disp_estado"].value_counts()
        self._log(f"  Disponibilidad: {dist.to_dict()}")

        # 10. Construir registros finales
        registros = []
        for _, row in df.iterrows():
            clave = self.norm_str(row.get("CLAVE"))
            if not clave:
                continue

            r = {
                # identificación
                "id": f"mxm_{clave}",
                "id_operador": clave,
                "fuente": "mxm",
                # ubicación
                "lat": float(row["lat"]),
                "lon": float(row["lon"]),
                "mapeable": bool(row["mapeable"]),
                "direccion": self.norm_str(row.get("UBICACIÓN")),
                "municipio": self.norm_str(row.get("ALCALDIA O MUNICIPIO")),
                "estado": row["estado_norm"],
                "ciudad": row["estado_norm"],   # en MXM no hay ciudad separada
                # características
                "tipo": self.norm_tipo_soporte(row.get("ESTRUCTURA")),
                "estructura": row["estructura_norm"],
                "vista": row["vista_norm"],
                "base_m": self.to_float(row.get("BASE")),
                "altura_m": self.to_float(row.get("ALTURA")),
                "mts2": self.to_float(row.get("TOTAL MTS2")),
                "es_digital": bool(row["es_digital"]),
                # comercial
                "tarifa_publicada_mxn": (
                    float(row["tarifa_mxn"]) if pd.notna(row["tarifa_mxn"]) else None
                ),
                "disponibilidad": {
                    "estado": row["disp_estado"],
                    # norm_str: el None de la columna vuelve NaN al pasar por
                    # pandas, y dentro de un dict anidado json.dump lo escribiría
                    # como NaN — JSON inválido.
                    "fecha": self.norm_str(row["disp_fecha"]),
                },
                # sin audiencia medida
                "audiencia": None,
                "impactos_totales": None,
                "alcance_zona_pct": None,
            }
            registros.append(r)

        self.df_limpio = pd.DataFrame(registros)

        # Log de resumen final
        estados = self.df_limpio["disponibilidad"].apply(lambda x: x["estado"])
        self._log(f"  Registros normalizados: {len(self.df_limpio)}")
        self._log(f"  Mapeables (con coords): {int(self.df_limpio['mapeable'].sum())}")
        self._log(f"  DOOH: {int(self.df_limpio['es_digital'].sum())}")
        self._log(f"  Con tarifa: {int(self.df_limpio['tarifa_publicada_mxn'].notna().sum())}")
        self._log(f"  Disponibles inmediato: {int((estados == 'inmediata').sum())}")
        self._log(f"  Ocupados: {int((estados == 'ocupado').sum())}")
        return self
