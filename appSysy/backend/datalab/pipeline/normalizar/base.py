"""
normalizar/base.py
Clase base para normalizadores de fuentes OOH.
"""
from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd


def ahora_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class NormalizadorBase:
    """
    Todo normalizador hereda de aquí.
    Implementa: cargar(), normalizar(), guardar(), reporte()
    """

    FUENTE: str = "base"          # override en cada subclase
    VERSION_SCHEMA: str = "1.0"

    def __init__(self, ruta_excel: Path, ruta_salida: Path, ruta_reportes: Path):
        self.ruta_excel = ruta_excel
        self.ruta_salida = ruta_salida
        self.ruta_reportes = ruta_reportes
        self.df: pd.DataFrame | None = None
        self.df_limpio: pd.DataFrame | None = None
        self.log: list[str] = []

    # ── helpers de texto ────────────────────────────────────────────────────

    @staticmethod
    def norm_str(v) -> str | None:
        """Strip. Devuelve None si nulo."""
        if pd.isna(v):
            return None
        return str(v).strip()

    @staticmethod
    def norm_str_lower(v) -> str | None:
        s = NormalizadorBase.norm_str(v)
        return s.lower() if s else None

    @staticmethod
    def to_float(v) -> float | None:
        try:
            if pd.isna(v):
                return None
        except (TypeError, ValueError):
            pass
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def to_int(v) -> int | None:
        try:
            if pd.isna(v):
                return None
        except (TypeError, ValueError):
            pass
        try:
            return int(float(v))
        except (TypeError, ValueError):
            return None

    # ── helpers de disponibilidad ────────────────────────────────────────────

    @staticmethod
    def parse_disponibilidad(v) -> dict:
        """
        Normaliza el campo DISPONIBILIDAD del inventario MXM.
        Devuelve {'estado': str, 'fecha': str | None}
        Estados posibles: 'inmediata', 'ocupado', 'fecha', 'indefinido', 'desconocido'
        """
        if pd.isna(v):
            return {"estado": "desconocido", "fecha": None}
        s = str(v).strip().lower()
        if "inmediata" in s:
            return {"estado": "inmediata", "fecha": None}
        if "ocupado" in s:
            return {"estado": "ocupado", "fecha": None}
        if "indefinido" in s:
            return {"estado": "indefinido", "fecha": None}
        # intenta parsear como fecha
        try:
            dt = pd.to_datetime(v)
            return {"estado": "fecha", "fecha": dt.strftime("%Y-%m-%d")}
        except Exception:
            return {"estado": "desconocido", "fecha": None}

    # ── helpers de normalización de categorías ───────────────────────────────

    MAPA_ESTRUCTURA = {
        # unipolar
        "unipolar": "unipolar",
        "tripolar": "unipolar",
        # muro
        "muro": "muro",
        # cartelera
        "cartelera": "cartelera",
        # azotea
        "azotea": "azotea",
        # puente
        "puente": "puente",
        # piso
        "piso": "piso",
        # valla / otro
        "valla": "otro",
        "pantalla": "otro",
        "unicelosia": "otro",
        "unicelosía": "otro",
        "estructura": "otro",
    }

    MAPA_VISTA = {
        "doble natural": "doble",
        "cruzada doble": "doble",
        "cruzada y natural": "doble",
        "natural y cruzada": "doble",
        "natural": "natural",
        "cruzada": "cruzada",
        "lateral": "lateral",
        "unica": "unica",
        "única": "unica",
    }

    MAPA_TIPO_SOPORTE = {
        "cartelera digital": "cartelera_digital",
        "pantalla digital": "pantalla_digital",
        "cartelera": "cartelera",
        "bajo puente": "puente",
        "puente": "puente",
        "muro": "muro",
        "azotea": "azotea",
        "tunel 54": "tunel",
        "tunel 56": "tunel",
        "túnel": "tunel",
        "tunel": "tunel",
    }

    @classmethod
    def norm_estructura(cls, v) -> str:
        s = cls.norm_str_lower(v)
        if not s:
            return "otro"
        # match exacto primero
        for patron, resultado in cls.MAPA_ESTRUCTURA.items():
            if patron in s:
                return resultado
        return "otro"

    @classmethod
    def norm_vista(cls, v) -> str | None:
        s = cls.norm_str_lower(v)
        if not s:
            return None
        for patron, resultado in cls.MAPA_VISTA.items():
            if patron in s:
                return resultado
        return "otra"

    @classmethod
    def norm_tipo_soporte(cls, v) -> str:
        s = cls.norm_str_lower(v)
        if not s:
            return "otro"
        for patron, resultado in cls.MAPA_TIPO_SOPORTE.items():
            if patron in s:
                return resultado
        return "otro"

    @staticmethod
    def norm_estado(v) -> str | None:
        """Normaliza nombre de estado / ciudad."""
        mapa = {
            "ciudad de méxico": "CDMX",
            "cdmx": "CDMX",
            "estado de méxico": "Estado de México",
            "estado de mexico": "Estado de México",
            "querétaro": "Querétaro",
            "queretaro": "Querétaro",
            "morelos": "Morelos",
            "puebla": "Puebla",
        }
        if pd.isna(v):
            return None
        s = str(v).strip().lower()
        return mapa.get(s, str(v).strip())

    # ── interfaz pública ─────────────────────────────────────────────────────

    def cargar(self) -> "NormalizadorBase":
        raise NotImplementedError

    def normalizar(self) -> "NormalizadorBase":
        raise NotImplementedError

    def guardar(self) -> Path:
        """Escribe el JSON limpio en ruta_salida. Devuelve la ruta."""
        if self.df_limpio is None:
            raise RuntimeError("Llama a normalizar() antes de guardar()")
        # astype(object) + where: pandas convierte los None de una columna
        # numérica en NaN, y json.dump los escribiría como NaN — JSON inválido
        # para el frontend. Los devolvemos a null antes de serializar.
        limpio = self.df_limpio.astype(object)
        registros = limpio.where(pd.notna(limpio), None).to_dict(orient="records")
        meta = {
            "fuente": self.FUENTE,
            "version_schema": self.VERSION_SCHEMA,
            "generado": ahora_iso(),
            "archivo_origen": self.ruta_excel.name,
            "total_registros": len(registros),
        }
        salida = {"meta": meta, "datos": registros}
        self.ruta_salida.parent.mkdir(parents=True, exist_ok=True)
        with open(self.ruta_salida, "w", encoding="utf-8") as f:
            json.dump(salida, f, ensure_ascii=False, indent=2, default=str)
        self._log(f"✓ Guardado: {self.ruta_salida} ({len(registros)} registros)")
        return self.ruta_salida

    def reporte(self) -> Path:
        """Escribe el log de calidad en ruta_reportes."""
        self.ruta_reportes.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        nombre = f"perfil_{self.FUENTE}_{ts}.txt"
        ruta = self.ruta_reportes / nombre
        with open(ruta, "w", encoding="utf-8") as f:
            f.write("\n".join(self.log))
        return ruta

    def _log(self, msg: str):
        print(msg)
        self.log.append(msg)
