"""Canonical CSV schema for dead-plot detection (standalone, not price model)."""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Optional

PLOT_STATUSES = ("Available", "Sold", "Reserved")
CLASS_LABELS = ("Active", "Slow", "Dead")
PLOT_TYPES = ("corner", "normal", "end", "middle")

CSV_REQUIRED_COLUMNS = (
    "plot_id",
    "layout",
    "plot_area",
    "plot_type",
    "road_facing",
    "price",
    "status",
    "listed_date",
    "interested_buyers",
)

CSV_OPTIONAL_COLUMNS = (
    "last_interaction_date",
    "nearby_sold_count",
    "layout_median_price_per_sqft",
)

CSV_ALL_COLUMNS = CSV_REQUIRED_COLUMNS + CSV_OPTIONAL_COLUMNS + ("dead_label",)

CSV_REQUIRED_COLUMNS_LOWER = {c.lower() for c in CSV_REQUIRED_COLUMNS}


def is_missing(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    if isinstance(value, str) and value.strip().lower() in ("", "nan", "none"):
        return True
    return False


def normalize_status(value: Any) -> Optional[str]:
    if is_missing(value):
        return None
    key = str(value).strip().lower()
    mapping = {
        "available": "Available",
        "sold": "Sold",
        "reserved": "Reserved",
    }
    return mapping.get(key)


def normalize_plot_type(value: Any) -> str:
    if is_missing(value):
        return "normal"
    v = str(value).strip().lower()
    if v in ("corner",):
        return "corner"
    if v in ("end", "middle", "road-facing", "park-facing", "cul-de-sac"):
        return "normal"
    return "normal" if v not in PLOT_TYPES else v


def parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if is_missing(value):
        return False
    s = str(value).strip().lower()
    return s in ("1", "true", "yes", "y")


def parse_date(value: Any) -> Optional[datetime]:
    if is_missing(value):
        return None
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
    s = str(value).strip()
    if not s:
        return None
    for fmt in (
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
        "%d-%m-%Y",
    ):
        try:
            dt = datetime.strptime(s[:19].replace("Z", ""), fmt.replace("Z", ""))
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def row_to_record(raw: dict) -> dict:
    return {
        "plot_id": str(raw.get("plot_id") or "").strip(),
        "layout": str(raw.get("layout") or "").strip(),
        "plot_area": float(raw.get("plot_area") or 0),
        "plot_type": normalize_plot_type(raw.get("plot_type")),
        "road_facing": parse_bool(raw.get("road_facing")),
        "price": float(raw.get("price") or 0),
        "status": normalize_status(raw.get("status")) or "Available",
        "listed_date": raw.get("listed_date"),
        "interested_buyers": int(float(raw.get("interested_buyers") or 0)),
        "last_interaction_date": (
            None if is_missing(raw.get("last_interaction_date"))
            else raw.get("last_interaction_date")
        ),
        "nearby_sold_count": int(float(raw.get("nearby_sold_count") or 0)),
        "layout_median_price_per_sqft": (
            None
            if is_missing(raw.get("layout_median_price_per_sqft"))
            else raw.get("layout_median_price_per_sqft")
        ),
        "dead_label": (
            None if is_missing(raw.get("dead_label")) else raw.get("dead_label")
        ),
    }


def validate_row(row: dict, *, row_index: int | None = None) -> list[str]:
    prefix = f"Row {row_index}: " if row_index is not None else ""
    errors: list[str] = []

    if not row.get("plot_id") or str(row.get("plot_id")).strip().lower() == "nan":
        errors.append(f"{prefix}plot_id is required")
    if not row.get("layout") or str(row.get("layout")).strip().lower() == "nan":
        errors.append(f"{prefix}layout is required")

    try:
        if float(row.get("plot_area") or 0) <= 0:
            errors.append(f"{prefix}plot_area must be > 0")
    except (TypeError, ValueError):
        errors.append(f"{prefix}plot_area must be numeric")

    try:
        if float(row.get("price") or 0) <= 0:
            errors.append(f"{prefix}price must be > 0")
    except (TypeError, ValueError):
        errors.append(f"{prefix}price must be numeric")

    if normalize_status(row.get("status")) is None:
        errors.append(f"{prefix}status must be Available, Sold, or Reserved")

    if parse_date(row.get("listed_date")) is None:
        errors.append(f"{prefix}listed_date is required (ISO or YYYY-MM-DD)")

    try:
        ib = int(float(row.get("interested_buyers") or 0))
        if ib < 0:
            errors.append(f"{prefix}interested_buyers must be >= 0")
    except (TypeError, ValueError):
        errors.append(f"{prefix}interested_buyers must be an integer")

    return errors
