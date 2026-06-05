"""Derived features: time + demand + conversion (PRD §4)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import pandas as pd

from training_schema import parse_date

FEATURE_COLUMNS = [
    "days_unsold",
    "interested_buyers",
    "plot_area",
    "price",
    "price_per_sqft",
    "road_facing",
    "nearby_sold_count",
    "price_vs_layout_median_pct",
    "inquiry_conversion_flag",
    "days_since_interaction",
]

CATEGORICAL_FEATURES = ["plot_type", "layout"]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def days_between(start: Optional[datetime], end: Optional[datetime] = None) -> int:
    if not start:
        return 0
    end = end or _utc_now()
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    return max(0, (end - start).days)


def enrich_record(record: dict, *, reference_date: Optional[datetime] = None) -> dict:
    """Add derived numeric/categorical fields used by rules and ML."""
    ref = reference_date or _utc_now()
    listed = parse_date(record.get("listed_date"))
    last_ix = parse_date(record.get("last_interaction_date"))

    area = float(record.get("plot_area") or 0)
    price = float(record.get("price") or 0)
    pps = price / area if area > 0 else 0.0

    layout_median = record.get("layout_median_price_per_sqft")
    try:
        layout_median = float(layout_median) if layout_median not in (None, "") else None
    except (TypeError, ValueError):
        layout_median = None

    price_vs_median_pct = 0.0
    if layout_median and layout_median > 0:
        price_vs_median_pct = round((pps - layout_median) / layout_median * 100, 2)

    interested = int(record.get("interested_buyers") or 0)
    days_unsold = days_between(listed, ref) if record.get("status") != "Sold" else 0
    days_since_ix = days_between(last_ix, ref) if last_ix else days_unsold

    inquiry_conversion_flag = int(
        interested >= 5 and record.get("status") == "Available" and days_unsold >= 45
    )

    out = dict(record)
    out.update(
        {
            "days_unsold": days_unsold,
            "price_per_sqft": round(pps, 2),
            "price_vs_layout_median_pct": price_vs_median_pct,
            "days_since_interaction": days_since_ix,
            "inquiry_conversion_flag": inquiry_conversion_flag,
            "nearby_sold_count": int(record.get("nearby_sold_count") or 0),
        }
    )
    return out


def layout_medians_from_records(records: list[dict]) -> dict[str, float]:
    """Median ₹/sqft per layout from a batch (for single-row API, pass in or use training stats)."""
    by_layout: dict[str, list[float]] = {}
    for r in records:
        if r.get("status") == "Sold":
            area = float(r.get("plot_area") or 0)
            price = float(r.get("price") or 0)
            if area > 0 and price > 0:
                layout = str(r.get("layout") or "")
                by_layout.setdefault(layout, []).append(price / area)
    return {
        layout: float(pd.Series(vals).median())
        for layout, vals in by_layout.items()
        if vals
    }


def apply_project_layout_medians(records: list[dict]) -> list[dict]:
    """
    Set layout_median_price_per_sqft per layout using all priced plots in the batch.
    Prefer sold plots; fall back to full project inventory when none are sold yet.
    """
    by_layout: dict[str, list[float]] = {}
    for r in records:
        area = float(r.get("plot_area") or 0)
        price = float(r.get("price") or 0)
        if area <= 0 or price <= 0:
            continue
        layout = str(r.get("layout") or "")
        by_layout.setdefault(layout, []).append(price / area)

    medians = layout_medians_from_records(records)
    for layout, vals in by_layout.items():
        if layout not in medians and vals:
            medians[layout] = float(pd.Series(vals).median())

    for r in records:
        layout = str(r.get("layout") or "")
        if medians.get(layout):
            r["layout_median_price_per_sqft"] = medians[layout]
    return records


def records_to_feature_frame(records: list[dict]) -> pd.DataFrame:
    rows = []
    for r in records:
        e = enrich_record(r)
        rows.append({col: e.get(col) for col in FEATURE_COLUMNS + CATEGORICAL_FEATURES})
    return pd.DataFrame(rows)
