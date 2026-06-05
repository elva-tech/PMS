"""
Canonical training CSV schema — aligned with backend plot.model.js.

Use for: export_plots_csv.py, generate_seed_csv.py, train.py validation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from features import APPROVAL_STATUSES, PLOT_DIRECTIONS, PLOT_TYPES

# Backend plot.model.js
PLOT_STATUSES = ("Available", "Sold", "Reserved")

DATA_SOURCES = ("mongodb_export", "synthetic", "manual")

CSV_REQUIRED_COLUMNS = (
    "projectid",
    "plotnumber",
    "plotsize",
    "roadWidthFt",
    "plotType",
    "approvalStatus",
    "plotdirection",
    "plotprice",
    "plotstatus",
)

CSV_OPTIONAL_COLUMNS = ("createdAt", "dataSource")

CSV_ALL_COLUMNS = CSV_REQUIRED_COLUMNS + CSV_OPTIONAL_COLUMNS

CSV_REQUIRED_COLUMNS_LOWER = {c.lower() for c in CSV_REQUIRED_COLUMNS}

SYNTHETIC_PROJECT_PREFIX = "seed_proj_"


def normalize_plot_status(value: Any) -> Optional[str]:
    if value is None or str(value).strip() == "":
        return None
    key = str(value).strip().lower()
    mapping = {
        "available": "Available",
        "sold": "Sold",
        "reserved": "Reserved",
        "booked": "Reserved",  # legacy CSV typo
    }
    return mapping.get(key)


def normalize_data_source(value: Any) -> str:
    v = (value or "manual").strip().lower()
    if v in DATA_SOURCES:
        return v
    if v == "mongo" or v == "mongodb":
        return "mongodb_export"
    return "manual"


def is_synthetic_project(project_id: str) -> bool:
    pid = str(project_id or "").strip()
    return pid.startswith(SYNTHETIC_PROJECT_PREFIX) or pid.startswith("synthetic_")


def validate_training_row(row: dict, *, row_index: int | None = None) -> list[str]:
    """Return list of validation errors (empty = ok)."""
    errors: list[str] = []
    prefix = f"Row {row_index}: " if row_index is not None else ""

    try:
        size = float(row.get("plotsize") or 0)
        if size <= 0:
            errors.append(f"{prefix}plotsize must be > 0")
    except (TypeError, ValueError):
        errors.append(f"{prefix}plotsize must be numeric")

    try:
        price = float(row.get("plotprice") or 0)
        if price <= 0:
            errors.append(f"{prefix}plotprice must be > 0")
    except (TypeError, ValueError):
        errors.append(f"{prefix}plotprice must be numeric")

    try:
        road = float(row.get("roadWidthFt") or 0)
        if road <= 0:
            errors.append(f"{prefix}roadWidthFt must be > 0")
    except (TypeError, ValueError):
        errors.append(f"{prefix}roadWidthFt must be numeric")

    plot_type = (row.get("plotType") or "").strip().lower()
    if plot_type not in PLOT_TYPES:
        errors.append(f"{prefix}invalid plotType '{row.get('plotType')}'")

    approval = (row.get("approvalStatus") or "").strip().lower()
    if approval not in APPROVAL_STATUSES:
        errors.append(f"{prefix}invalid approvalStatus '{row.get('approvalStatus')}'")

    direction = " ".join(str(row.get("plotdirection") or "").strip().upper().split())
    if direction not in PLOT_DIRECTIONS:
        errors.append(f"{prefix}invalid plotdirection '{row.get('plotdirection')}'")

    status = normalize_plot_status(row.get("plotstatus"))
    if not status:
        errors.append(
            f"{prefix}plotstatus must be Available, Sold, or Reserved (not '{row.get('plotstatus')}')"
        )

    if not str(row.get("projectid") or "").strip():
        errors.append(f"{prefix}projectid is required")

    plot_num = row.get("plotnumber")
    if plot_num is None or str(plot_num).strip() == "":
        errors.append(f"{prefix}plotnumber is required")

    return errors


def mongo_doc_to_training_row(doc: dict) -> dict:
    created = doc.get("createdAt")
    if isinstance(created, datetime):
        created_str = created.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    else:
        created_str = ""

    status = normalize_plot_status(doc.get("plotstatus")) or "Available"

    road = doc.get("roadWidthFt")
    try:
        road_val = float(road) if road is not None else 0
    except (TypeError, ValueError):
        road_val = 0
    if road_val <= 0:
        road_val = 30.0  # legacy default (matches train.py)

    return {
        "projectid": str(doc.get("projectid") or ""),
        "plotnumber": doc.get("plotnumber"),
        "plotsize": doc.get("plotsize"),
        "roadWidthFt": road_val,
        "plotType": doc.get("plotType") or "middle",
        "approvalStatus": doc.get("approvalStatus") or "unapproved",
        "plotdirection": doc.get("plotdirection") or "",
        "plotprice": doc.get("plotprice"),
        "plotstatus": status,
        "createdAt": created_str,
        "dataSource": "mongodb_export",
    }


def csv_dict_to_plot(doc: dict) -> dict:
    """Normalize a CSV row into internal plot dict for training."""
    status = normalize_plot_status(doc.get("plotstatus")) or "Sold"
    project_id = str(doc.get("projectid") or "").strip()
    source = normalize_data_source(doc.get("dataSource"))
    if is_synthetic_project(project_id):
        source = "synthetic"

    return {
        "plotsize": doc.get("plotsize"),
        "roadWidthFt": doc.get("roadWidthFt"),
        "plotType": doc.get("plotType"),
        "approvalStatus": doc.get("approvalStatus"),
        "plotdirection": doc.get("plotdirection"),
        "plotprice": doc.get("plotprice"),
        "projectid": project_id,
        "plotstatus": status,
        "plotnumber": doc.get("plotnumber"),
        "createdAt": doc.get("createdAt"),
        "dataSource": source,
        "_source": "csv",
    }
