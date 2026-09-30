"""
normalizar/ooh_circuito.py
Normaliza el Excel de circuito exterior medido (formato MOST / proveedor de medición).
Entrada:  uploads/circuito exterior medido ejemplo.xlsx  (hoja HOJA)
Salidas:
  datos/ooh_circuito.json         — soportes normalizados
  datos/ooh_resumen_circuito.json — métricas del sheet RESUMEN
"""
from __future__ import annotations
import json
from pathlib import Path
import pandas as pd
from .base import NormalizadorBase, ahora_iso


class NormalizadorCircuito(NormalizadorBase):

    FUENTE = "circuito_exterior"
    VERSION_SCHEMA = "1.0"

    # Columnas sin información: 'measures' y 'structure' vienen 100% vacías,
    # 'affinity' viene en 0 en los 77 registros.
    COLS_IGNORAR = ["measures", "structure", "affinity"]

    def cargar(self) -> "NormalizadorCircuito":
        self._log(f"Cargando: {self.ruta_excel.name}")
        self.df = pd.read_excel(self.ruta_excel, sheet_name="HOJA")
        self._log(f"  Filas crudas: {len(self.df)} | Columnas: {len(self.df.columns)}")

        # Cargar hoja RESUMEN por separado
        self.df_resumen = pd.read_excel(self.ruta_excel, sheet_name="RESUMEN")
        self.df_filtros = pd.read_excel(self.ruta_excel, sheet_name="FILTROS")
        return self

    def normalizar(self) -> "NormalizadorCircuito":
        df = self.df.copy()

        # 1. Eliminar columnas vacías documentadas
        df = df.drop(columns=[c for c in self.COLS_IGNORAR if c in df.columns])
        self._log(f"  Columnas ignoradas (sin información): {self.COLS_IGNORAR}")

        # 2. Validar coordenadas
        antes = len(df)
        df = df[df["latitude"].between(14, 33) & df["longitude"].between(-120, -86)]
        self._log(f"  Coords válidas México: {len(df)} de {antes}")

        # 3. Normalizar tipo de soporte
        df["tipo"] = df["type"].apply(self.norm_tipo_soporte)
        df["es_digital"] = df["tipo"].isin(["cartelera_digital", "pantalla_digital"])
        sin_mapear = df.loc[df["tipo"] == "otro", "type"].unique().tolist()
        if sin_mapear:
            self._log(f"  ⚠ Tipos sin mapear (quedaron en 'otro'): {sin_mapear}")
        self._log(f"  Tipos: {df['tipo'].value_counts().to_dict()}")

        # 4. Construir registro final
        registros = []
        for _, row in df.iterrows():
            r = {
                # identificación
                "id": f"circ_{row['latitude']:.6f}_{row['longitude']:.6f}".replace("-", "n"),
                "fuente": "circuito_comex",
                # ubicación
                "lat": self.to_float(row["latitude"]),
                "lon": self.to_float(row["longitude"]),
                "direccion": self.norm_str(row.get("name")) or self.norm_str(row.get("address")),
                "ciudad": self.norm_str(row.get("city")),
                "estado": self.norm_str(row.get("province")),
                "zona_metropolitana": self.norm_str(row.get("metropolitan area")),
                # características
                "tipo": row["tipo"],
                "es_digital": bool(row["es_digital"]),
                # disponibilidad desconocida en este formato
                "disponibilidad": {"estado": "desconocido", "fecha": None},
                # audiencia
                "audiencia": {
                    "total": self.to_int(row.get("total_users")),
                    "masculino": self.to_int(row.get("male_users")),
                    "femenino": self.to_int(row.get("female_users")),
                    "edad_18_25": self.to_int(row.get("a18_25_users")),
                    "edad_26_40": self.to_int(row.get("a26_40_users")),
                    "edad_41_55": self.to_int(row.get("a41_55_users")),
                    "edad_55_mas": self.to_int(row.get("a55_users")),
                    "nse_a": self.to_int(row.get("income_a_users")),
                    "nse_b": self.to_int(row.get("income_b_users")),
                    "nse_c": self.to_int(row.get("income_c_users")),
                    "nse_d": self.to_int(row.get("income_d_users")),
                    "nse_e": self.to_int(row.get("income_e_users")),
                },
                # métricas
                "impactos_totales": self.to_int(row.get("total_hits")),
                "alcance_zona_pct": self.to_float(row.get("reach_auf")),   # ya viene en %
                "alcance_nacional_pct": self.to_float(row.get("reach_country")),
            }
            registros.append(r)

        self.df_limpio = pd.DataFrame(registros)
        self._log(f"  Registros normalizados: {len(self.df_limpio)}")
        self._log(f"  DOOH: {int(self.df_limpio['es_digital'].sum())}")

        # 5. Normalizar hoja RESUMEN para segunda salida
        self._normalizar_resumen()
        return self

    def _normalizar_resumen(self):
        """Procesa el sheet RESUMEN y lo guarda en self.resumen_limpio."""
        df = self.df_resumen.copy()
        registros = []
        for _, row in df.iterrows():
            if pd.isna(row.iloc[0]):
                continue
            r = {
                "zona": self.norm_str(row.iloc[0]),
                "poblacion_total": self.to_int(row.iloc[1]),
                "usuarios_unicos": self.to_int(row.iloc[3]),
                "alcance_pct": self.to_float(row.iloc[4]),
                "frecuencia": self.to_float(row.iloc[6]),
                "impactos_totales": self.to_int(row.iloc[7]),
                "grp": self.to_float(row.iloc[8]),
                "trp": self.to_float(row.iloc[9]),
                "soportes": self.to_int(row.iloc[10]) if len(row) > 10 else None,
            }
            registros.append(r)
        self.resumen_limpio = registros
        self._log(f"  Zonas en resumen: {len(registros)}")

    def guardar(self) -> Path:
        # Guardar soportes
        ruta_principal = super().guardar()

        # Guardar resumen por separado
        ruta_resumen = self.ruta_salida.parent / "ooh_resumen_circuito.json"
        meta = {
            "fuente": "circuito_exterior_resumen",
            "generado": ahora_iso(),
            "archivo_origen": self.ruta_excel.name,
            "total_registros": len(self.resumen_limpio),
        }
        with open(ruta_resumen, "w", encoding="utf-8") as f:
            json.dump({"meta": meta, "datos": self.resumen_limpio},
                      f, ensure_ascii=False, indent=2, default=str)
        self._log(f"✓ Resumen guardado: {ruta_resumen}")
        return ruta_principal
