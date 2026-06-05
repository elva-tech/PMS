"""Analyze plots: rules (PRD §5–§9) + ML classifier (PRD §7)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional

import joblib
import pandas as pd
from dotenv import load_dotenv

from config import DEFAULT_MODEL_PATH, RULES_VERSION
from features import apply_project_layout_medians, enrich_record, records_to_feature_frame
from presentation import build_customer_view
from rules import classify_by_rules
from training_schema import CLASS_LABELS, row_to_record, validate_row

load_dotenv()

MODEL_PATH = Path(os.getenv("DEAD_PLOT_MODEL_PATH", DEFAULT_MODEL_PATH))

_SEVERITY_ORDER = {"Active": 0, "Slow": 1, "Dead": 2}


def load_artifact() -> dict:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run: python train.py"
        )
    return joblib.load(MODEL_PATH)


def _merge_status(rule_status: str, ml_status: str) -> str:
    """Conservative: take the more severe of rule vs ML."""
    if _SEVERITY_ORDER.get(ml_status, 0) >= _SEVERITY_ORDER.get(rule_status, 0):
        return ml_status
    return rule_status


def is_listed_inventory(status: str) -> bool:
    """Dead/slow detection applies to unsold inventory only (not Sold)."""
    return str(status or "").strip() not in ("Sold",)


def _risk_band(prob_dead: float, classification: str) -> str:
    if classification == "Dead" or prob_dead >= 0.7:
        return "high"
    if classification == "Slow" or prob_dead >= 0.4:
        return "medium"
    return "low"


def _insights_for_response(rule_result: dict, classification: str) -> tuple[list, list]:
    """Active plots: no alarmist tips. Slow/Dead: full PRD guidance."""
    if classification == "Active":
        healthy = [r for r in rule_result["reasons"] if r.get("code") == "healthy"]
        if not healthy:
            healthy = [
                {
                    "factor": "Healthy time on market and buyer interest",
                    "severity": "low",
                    "code": "healthy",
                }
            ]
        return healthy, []
    return rule_result["reasons"], rule_result["suggestedActions"]


def analyze_plot(raw: dict, *, artifact: dict | None = None) -> dict[str, Any]:
    """
    Full analysis for one plot.
    `interested_buyers` = count from PMS interested-buyers / contacts feature.
    """
    rec = row_to_record(raw)
    errors = validate_row(rec)
    if errors:
        raise ValueError(errors[0])

    art = artifact or load_artifact()
    layout_medians = art.get("layout_medians") or {}
    if not rec.get("layout_median_price_per_sqft") and layout_medians.get(rec["layout"]):
        rec["layout_median_price_per_sqft"] = layout_medians[rec["layout"]]

    rule_result = classify_by_rules(rec)
    enriched = enrich_record(rec)

    ml_status = rule_result["ruleStatus"]
    prob_dead = rule_result["deadScore"]
    prob_by_class: dict[str, float] = {c: 0.0 for c in CLASS_LABELS}

    if rec["status"] == "Sold":
        ml_status = "Active"
        prob_dead = 0.0
        prob_by_class = {c: (1.0 if c == "Active" else 0.0) for c in CLASS_LABELS}
        final_status = "Active"
    else:
        try:
            pipeline = art["pipeline"]
            classes = list(pipeline.named_steps["clf"].classes_)
            X = records_to_feature_frame([enriched])
            proba = pipeline.predict_proba(X)[0]
            prob_by_class = {str(c): float(round(p, 4)) for c, p in zip(classes, proba)}
            ml_status = max(prob_by_class, key=prob_by_class.get)
            prob_dead = prob_by_class.get("Dead", prob_dead)
        except Exception:
            pass
        final_status = _merge_status(rule_result["ruleStatus"], ml_status)

    reasons, actions = _insights_for_response(rule_result, final_status)
    risk_band = _risk_band(float(prob_dead), final_status)

    customer_view = build_customer_view(
        classification=final_status,
        risk_band=risk_band,
        dead_probability=float(prob_dead),
        layout=rec["layout"],
        status=rec["status"],
        signals=rule_result["signals"],
        reasons=reasons,
        suggested_actions=actions,
    )

    out = {
        "plotId": rec["plot_id"],
        "layout": rec["layout"],
        "status": rec["status"],
        "classification": final_status,
        "ruleStatus": rule_result["ruleStatus"],
        "mlStatus": ml_status,
        "deadProbability": round(float(prob_dead), 4),
        "probabilities": prob_by_class,
        "riskBand": risk_band,
        "customerView": customer_view,
        "reasons": reasons,
        "suggestedActions": actions,
        "signals": rule_result["signals"],
        "features": {
            "plotArea": enriched["plot_area"],
            "price": enriched["price"],
            "pricePerSqft": enriched["price_per_sqft"],
            "interestedBuyers": enriched["interested_buyers"],
            "daysUnsold": enriched["days_unsold"],
            "roadFacing": enriched["road_facing"],
            "plotType": enriched["plot_type"],
        },
        "model": "random_forest_classifier",
        "rulesVersion": RULES_VERSION,
        "trainedAt": art.get("trained_at"),
    }
    if raw.get("plot_number") is not None:
        out["plotNumber"] = raw.get("plot_number")
    return out


def analyze_batch(records: list[dict]) -> list[dict]:
    art = load_artifact()
    return [analyze_plot(r, artifact=art) for r in records]


def load_csv_records(path: Path) -> list[dict]:
    df = pd.read_csv(path)
    col_map = {c.lower(): c for c in df.columns}
    rows = []
    for _, row in df.iterrows():
        raw = {k: row[col_map[k]] for k in col_map}
        rows.append(
            row_to_record(
                {
                    "plot_id": raw.get("plot_id"),
                    "layout": raw.get("layout"),
                    "plot_area": raw.get("plot_area"),
                    "plot_type": raw.get("plot_type"),
                    "road_facing": raw.get("road_facing"),
                    "price": raw.get("price"),
                    "status": raw.get("status"),
                    "listed_date": raw.get("listed_date"),
                    "interested_buyers": raw.get("interested_buyers"),
                    "last_interaction_date": raw.get("last_interaction_date"),
                    "nearby_sold_count": raw.get("nearby_sold_count"),
                    "layout_median_price_per_sqft": raw.get(
                        "layout_median_price_per_sqft"
                    ),
                    "dead_label": raw.get("dead_label"),
                }
            )
        )
    return rows


def _plot_not_found_message(plot_id: str, path: Path) -> str:
    try:
        df = pd.read_csv(path, usecols=["plot_id"])
        sample = df["plot_id"].astype(str).head(5).tolist()
        return (
            f"Plot not found in CSV: {plot_id}. "
            f"Example IDs: {', '.join(sample)}"
        )
    except Exception:
        return f"Plot not found in CSV: {plot_id}"


def analyze_csv(
    path: Path,
    *,
    plot_id: str | None = None,
    inventory_only: bool = True,
) -> list[dict]:
    rows = load_csv_records(path)
    if plot_id:
        pid = str(plot_id).strip()
        rows = [r for r in rows if str(r.get("plot_id", "")).strip() == pid]
        if not rows:
            raise ValueError(_plot_not_found_message(pid, path))
    results = analyze_batch(rows)
    if inventory_only and not plot_id:
        results = [r for r in results if is_listed_inventory(r.get("status", ""))]
    return results


def analyze_project(
    project_id: str,
    *,
    classification: str | None = None,
    plot_id: str | None = None,
    plot_number: int | None = None,
) -> dict:
    from mongo_loader import load_project_plots

    records = load_project_plots(project_id)
    if not records:
        raise ValueError(
            f"No analyzable plots for project {project_id}. "
            "Add plots with price and size in this project."
        )

    records = apply_project_layout_medians(records)

    if plot_id:
        records = [r for r in records if str(r.get("plot_id")) == str(plot_id).strip()]
    elif plot_number is not None:
        records = [
            r for r in records if int(r.get("plot_number") or -1) == int(plot_number)
        ]

    if plot_id or plot_number is not None:
        if not records:
            raise ValueError("Plot not found in this project")
        return {"plot": analyze_plot(records[0])}

    art = load_artifact()
    results = [analyze_plot(r, artifact=art) for r in records]
    inventory = [r for r in results if is_listed_inventory(r.get("status", ""))]
    sold_skipped = len(results) - len(inventory)

    if classification:
        inventory = [r for r in inventory if r["classification"] == classification]

    summary = summarize_results(
        [r for r in results if is_listed_inventory(r.get("status", ""))],
        include_sold_skipped=sold_skipped,
    )
    return {
        "projectId": project_id,
        "summary": summary,
        "plots": inventory,
        "deadPlots": [r for r in inventory if r["classification"] == "Dead"],
        "slowPlots": [r for r in inventory if r["classification"] == "Slow"],
        "activePlots": [r for r in inventory if r["classification"] == "Active"],
    }


def summarize_results(results: list[dict], *, include_sold_skipped: int = 0) -> dict:
    dead = [r for r in results if r["classification"] == "Dead"]
    slow = [r for r in results if r["classification"] == "Slow"]
    active = [r for r in results if r["classification"] == "Active"]
    return {
        "inventoryAnalyzed": len(results),
        "soldSkipped": include_sold_skipped,
        "dead": len(dead),
        "slow": len(slow),
        "active": len(active),
        "deadPlotIds": [r["plotId"] for r in dead],
        "slowPlotIds": [r["plotId"] for r in slow[:50]],
    }
