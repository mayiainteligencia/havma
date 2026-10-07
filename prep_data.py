#!/usr/bin/env python3
"""Arma mock.json para el frontend de havasData a partir de ./canonical y ./rules.

Uso:
    python prep_data.py [--out ruta/mock.json]

Todo lo que trae `origen: "real"` sale de los JSON ya generados por
parse_optimizer.py / extract_flow.py (y, para los totales por medio del Flow,
de una relectura puntual del Excel — esa hoja no quedó en rules.json). Lo
`"simulado"` se inventa con factores fijos y una semilla constante sobre ese
mix real: mismo resultado en cada corrida, nunca aleatorio de verdad.
"""
import argparse
import datetime as dt
import hashlib
import json
import logging
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent
CANONICAL_DIR = ROOT / "canonical"
RULES_DIR = ROOT / "rules"
DATA_DIR = ROOT / "dataEx"
OUT_DEFAULT = ROOT / "appSysy" / "frontend" / "src" / "data" / "mock.json"

FLOW_ANUAL_FILE = "Flow_Anonimizado_1.xlsx"  # única fuente de calendario/flighting real
MAX_CAMPANAS_FLOW = 8  # ponytail: grid de demo manejable; el Flow real trae ~60 filas de campaña

log = logging.getLogger("prep_data")


def slug(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def seeded(*parts: str) -> float:
    """Factor determinista en [0, 1) a partir de texto — misma entrada, mismo factor, siempre."""
    h = hashlib.sha256("|".join(parts).encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def load_canonical(name: str) -> dict:
    return json.loads((CANONICAL_DIR / f"{name}.canonical.json").read_text(encoding="utf-8"))


def load_rules(name: str) -> dict:
    return json.loads((RULES_DIR / f"{name}.rules.json").read_text(encoding="utf-8"))


# ---------------------------------------------------------------- ejercicios

def build_ejercicios() -> list[dict]:
    sp1 = load_canonical("Ejemplo de output smart planner.xlsx")
    sp2 = load_canonical("Ejemplo output smart planner v2.xlsx")
    alcance = load_canonical("alcance spectrum.xlsx")
    asignacion = load_canonical("asignación de presupuesto spectrum.xlsx")

    # Los dos Spectrum son el mismo plan (mismo "Plan 1 Net Reach"): uno trae
    # inversión por touchpoint, el otro alcance. Se combinan por nombre.
    alcance_por_tp = {t["nombre"]: t["alcance"] for t in alcance["touchpoints"] or []}
    spectrum_tp = [{**t, "alcance": alcance_por_tp.get(t["nombre"])} for t in asignacion["touchpoints"] or []]
    spectrum_ex = dict(asignacion["exercise"])
    spectrum_ex.update(anunciante=alcance["exercise"]["anunciante"], target=alcance["exercise"]["target"],
                       edad_min=alcance["exercise"]["edad_min"], edad_max=alcance["exercise"]["edad_max"],
                       semanas=alcance["exercise"]["semanas"])

    def ejercicio(id_, fuente, canonical, touchpoints=None, exercise=None):
        return {
            "id": id_, "origen": "real", "fuente_archivo": fuente,
            "herramienta": canonical["source"]["herramienta"], "subtipo": canonical["source"].get("subtipo"),
            "exercise": exercise if exercise is not None else canonical["exercise"],
            "touchpoints": touchpoints if touchpoints is not None else canonical["touchpoints"],
            "totales": canonical["totales"],
            "alcance_por_frecuencia": canonical.get("alcance_por_frecuencia"),
            "duplicaciones": canonical.get("duplicaciones"),
            "escenarios": canonical.get("escenarios"),
            "validaciones": canonical.get("validaciones"),
        }

    return [
        ejercicio("sp-v1", "Ejemplo de output smart planner.xlsx", sp1),
        ejercicio("sp-v2", "Ejemplo output smart planner v2.xlsx", sp2),
        ejercicio("spectrum-1", "alcance spectrum.xlsx + asignación de presupuesto spectrum.xlsx",
                  asignacion, touchpoints=spectrum_tp, exercise=spectrum_ex),
    ]


# ---------------------------------------------------------------- flow (calendario + campañas reales)

def medio_totales_por_campana(path: Path) -> dict[tuple, dict[str, float]]:
    """{(categoria, campana): {medio: inversion_total}} leyendo la columna F de la hoja FLOW.

    rules.json no guarda este número (extract_flow.py se enfocó en TRPs/flighting,
    no en $); se relee aquí puntualmente porque el Flowchart lo necesita como
    "total real" a repartir entre semanas.
    """
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb["FLOW"]
    out: dict[tuple, dict[str, float]] = {}
    cat = camp = None
    for row in ws.iter_rows(min_row=48, values_only=True):
        c0, c1, medio, inv = row[0], row[1], row[4], row[5]
        if isinstance(c1, str) and c1.strip().startswith("TOTAL"):
            break  # fin de la sección de campañas activas de este bloque
        if isinstance(c0, str) and c0.strip():
            cat = c0.strip()
        if isinstance(c1, str) and c1.strip():
            camp = c1.strip()
        if isinstance(medio, str) and isinstance(inv, (int, float)) and camp:
            out.setdefault((cat, camp), {})[medio.strip()] = float(inv)
        if len(out) > MAX_CAMPANAS_FLOW * 3:  # tope de seguridad; ya sobra para MAX_CAMPANAS_FLOW campañas
            break
    wb.close()
    return out


def build_flow() -> dict:
    rules = load_rules(FLOW_ANUAL_FILE)
    cal = rules["calendario"]
    medios_totales = medio_totales_por_campana(DATA_DIR / FLOW_ANUAL_FILE)

    niveles_por_campana = {n["campana"]: n for n in rules["flighting"]["niveles_por_campana"]}
    patron_por_campana_medio = {}
    for r in rules["flighting"]["registros"]:
        if r["patron_normalizado"]:
            patron_por_campana_medio[(r["campana"], r["medio"])] = r["patron_normalizado"]

    campanas = []
    for (categoria, campana), medios in medios_totales.items():
        if campana.strip().upper() == "TBD" or sum(medios.values()) <= 0:
            continue
        niv = niveles_por_campana.get(campana)
        campanas.append({
            "id": slug(campana),
            "categoria": categoria, "campana": " ".join(campana.split()),
            "medios": [
                {
                    "medio": medio, "inversion_total": inv,
                    "patron_normalizado": patron_por_campana_medio.get((campana, medio)),
                    "niveles": {"lanzamiento": niv["lanzamiento"], "mantenimiento": niv["mantenimiento"],
                               "minimo": niv["minimo"]} if niv else None,
                }
                for medio, inv in medios.items() if inv > 0
            ],
        })
        if len(campanas) >= MAX_CAMPANAS_FLOW:
            break

    return {
        "origen": "real", "fuente_archivo": FLOW_ANUAL_FILE,
        "calendario": cal["semanas"],
        "medios": sorted({m["medio"] for c in campanas for m in c["medios"]}),
        "campanas": campanas,
    }


# ---------------------------------------------------------------- marcas (reales + simuladas)

def build_marcas(ejercicios: list[dict], flow: dict) -> list[dict]:
    marcas = [
        {"id": "marca-streaming", "nombre": "Cuenta Streaming (Smart Planner v2)", "origen": "real",
         "ejercicio_id": "sp-v2", "presupuesto": ejercicios[1]["exercise"]["presupuesto"]},
        {"id": "marca-multimedia", "nombre": "Cuenta Multimedia (Smart Planner v1)", "origen": "real",
         "ejercicio_id": "sp-v1", "presupuesto": ejercicios[0]["exercise"]["presupuesto"]},
        {"id": "marca-department-stores", "nombre": "Department Stores (Spectrum)", "origen": "real",
         "ejercicio_id": "spectrum-1",
         "presupuesto": sum(t["inversion"] for t in ejercicios[2]["touchpoints"] if t["inversion"])},
    ]
    base = ejercicios[1]  # el mix más completo (7 touchpoints), base de las marcas simuladas
    extra = [("marca-sim-aliada", "Cuenta Aliada"), ("marca-sim-norte", "Cuenta Norte"), ("marca-sim-sur", "Cuenta Sur")]
    for id_, nombre in extra:
        factor = round(0.25 + seeded(id_) * 0.45, 3)  # entre 0.25x y 0.70x del presupuesto base, fijo
        marcas.append({
            "id": id_, "nombre": nombre, "origen": "simulado", "basado_en_ejercicio_id": base["id"],
            "factor_vs_base": factor, "presupuesto": round(base["exercise"]["presupuesto"] * factor),
        })
    return marcas


# ---------------------------------------------------------------- interpolación de escenarios (Python, para sembrar versiones)

def interpolar_escenario(escenarios: list[dict], factor: float) -> dict | None:
    """Misma lógica que corre en vivo en src/data/interpolate.ts — ver ese archivo
    para la versión que usa el slider de Escenarios. Aquí solo siembra 'cambio A/B'."""
    if not escenarios:
        return None
    ordenados = sorted(escenarios, key=lambda e: e["factor_presupuesto"])
    if factor <= ordenados[0]["factor_presupuesto"]:
        a = b = ordenados[0]
    elif factor >= ordenados[-1]["factor_presupuesto"]:
        a = b = ordenados[-1]
    else:
        a = max((e for e in ordenados if e["factor_presupuesto"] <= factor), key=lambda e: e["factor_presupuesto"])
        b = min((e for e in ordenados if e["factor_presupuesto"] >= factor), key=lambda e: e["factor_presupuesto"])
    t = 0.0 if a["factor_presupuesto"] == b["factor_presupuesto"] else \
        (factor - a["factor_presupuesto"]) / (b["factor_presupuesto"] - a["factor_presupuesto"])
    lerp = lambda x, y: x + (y - x) * t
    por_tp = []
    for ta, tb in zip(a["por_touchpoint"], b["por_touchpoint"]):
        por_tp.append({"touchpoint": ta["touchpoint"], "inversion": lerp(ta["inversion"], tb["inversion"]),
                      "grps": lerp(ta["grps"], tb["grps"]), "impactos_miles": lerp(ta["impactos_miles"], tb["impactos_miles"]),
                      "alcance": lerp(ta["alcance"], tb["alcance"])})
    return {"factor_presupuesto": factor, "presupuesto_total": lerp(a["presupuesto_total"], b["presupuesto_total"]),
            "por_touchpoint": por_tp,
            "totales": {k: lerp(a["totales"][k], b["totales"][k]) for k in a["totales"]}}


# ---------------------------------------------------------------- versiones simuladas (cambio A / cambio B)

def build_versiones(ejercicios: list[dict]) -> list[dict]:
    base = ejercicios[1]
    hoy = dt.date(2026, 9, 29)
    out = []
    for id_, etiqueta, motivo, factor, dias_atras, autor, estado in [
        ("v-base", "Base aprobada", "Plan original enviado a cliente", 1.0, 30, "Planeación", "aprobada"),
        ("v-cambio-a", "Cambio A · +15% presupuesto", "Cliente pidió reforzar alcance en el cierre de mes", 1.15, 6, "Planeación", "pendiente"),
        ("v-cambio-b", "Cambio B · -10% presupuesto", "Recorte de presupuesto por ajuste corporativo", 0.9, 3, "Planeación", "pendiente"),
    ]:
        interp = interpolar_escenario(base["escenarios"], factor)
        fecha_hora = dt.datetime.combine(hoy - dt.timedelta(days=dias_atras), dt.time(9 + dias_atras % 8, 15 * (dias_atras % 4)))
        out.append({
            "id": id_, "origen": "simulado", "ejercicio_base_id": base["id"], "etiqueta": etiqueta, "motivo": motivo,
            "autor": autor, "rol": "planner", "fecha": fecha_hora.date().isoformat(), "hora": fecha_hora.strftime("%H:%M"),
            "estado": estado, "factor_presupuesto": factor,
            "delta_inversion": (interp["presupuesto_total"] - base["exercise"]["presupuesto"]) if interp else 0,
            "snapshot_touchpoints": [{"nombre": t["touchpoint"], "inversion": t["inversion"]} for t in interp["por_touchpoint"]] if interp else None,
            "interpolado": interp,
        })
    return out


# ---------------------------------------------------------------- bloques simulados (desviaciones, presupuesto, resultados)

def build_simulado(marcas: list[dict], flow: dict) -> dict:
    desviaciones = []
    for c in flow["campanas"]:
        total = sum(m["inversion_total"] for m in c["medios"])
        factor = 0.85 + seeded("desv", c["id"]) * 0.3  # real entre 85% y 115% del planeado
        desviaciones.append({"campana": c["campana"], "categoria": c["categoria"], "origen": "simulado",
                             "planeado": total, "real": round(total * factor), "delta_pct": round((factor - 1) * 100, 1)})

    presupuesto = []
    for m in marcas:
        autorizado = m["presupuesto"]
        f_comp = 0.55 + seeded("comp", m["id"]) * 0.35
        f_ejec = f_comp * (0.6 + seeded("ejec", m["id"]) * 0.35)
        presupuesto.append({"marca_id": m["id"], "origen": "simulado", "autorizado_origen": m["origen"],
                            "autorizado": autorizado, "comprometido": round(autorizado * f_comp),
                            "ejecutado": round(autorizado * f_ejec)})

    proveedores = ["Proveedor Norte", "Grupo Medios Centro", "Radio Aliada", "Digital Plus", "OOH Nacional"]
    compromisos = []
    for c in flow["campanas"][:6]:
        for m in c["medios"][:2]:
            prov = proveedores[int(seeded("prov", c["id"], m["medio"]) * len(proveedores))]
            compromisos.append({"campana": c["campana"], "medio": m["medio"], "proveedor": prov, "origen": "simulado",
                                "monto": round(m["inversion_total"] * (0.3 + seeded("cm", c["id"], m["medio"]) * 0.5)),
                                "facturado": seeded("fact", c["id"], m["medio"]) > 0.4})

    resultados = []
    for m in marcas:
        for canal in ["TV", "Digital", "OOH", "Radio"]:
            planeado = round(m["presupuesto"] * (0.15 + seeded("can", m["id"], canal) * 0.35))
            factor = 0.8 + seeded("res", m["id"], canal) * 0.4
            resultados.append({"marca_id": m["id"], "canal": canal, "origen": "simulado",
                               "planeado": planeado, "real": round(planeado * factor)})

    return {"desviaciones": desviaciones, "presupuesto": presupuesto, "compromisos": compromisos, "resultados": resultados}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=str(OUT_DEFAULT))
    args = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")

    ejercicios = build_ejercicios()
    log.info("ejercicios: %s", [e["id"] for e in ejercicios])
    flow = build_flow()
    log.info("flow: %d semanas, %d campañas, medios %s", len(flow["calendario"]), len(flow["campanas"]), flow["medios"])
    marcas = build_marcas(ejercicios, flow)
    log.info("marcas: %s", [(m["id"], m["origen"]) for m in marcas])
    versiones = build_versiones(ejercicios)
    simulado = build_simulado(marcas, flow)

    mock = {
        "meta": {"generado_en": dt.datetime.now().isoformat(timespec="seconds"),
                "fuentes": ["canonical/*.canonical.json", "rules/Flow_Anonimizado_1.xlsx.rules.json",
                           f"dataEx/{FLOW_ANUAL_FILE} (columna INVERSIÓN, releída directo)"]},
        "ejercicios": ejercicios, "flow": flow, "marcas": marcas, "versiones": versiones, "simulado": simulado,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(mock, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    log.info("Escrito %s (%d KB)", out, out.stat().st_size // 1024)
    return 0


if __name__ == "__main__":
    sys.exit(main())
