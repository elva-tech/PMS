"""Feature engineering for plot price regression (tabular ML, not LLM)."""

PLOT_TYPES = [
    "corner",
    "end",
    "middle",
    "park-facing",
    "road-facing",
    "cul-de-sac",
]

APPROVAL_STATUSES = ["dtcp", "bda", "panchayat", "unapproved", "other"]

PLOT_DIRECTIONS = [
    "NORTH",
    "SOUTH",
    "EAST",
    "WEST",
    "NORTH EAST",
    "NORTH WEST",
    "SOUTH EAST",
    "SOUTH WEST",
]

NUMERIC_FEATURES = ["plotsize", "roadWidthFt"]

CATEGORICAL_FEATURES = [
    "plotType",
    "approvalStatus",
    "plotdirection",
    "projectid",
]


def normalize_plot_type(value: str) -> str:
    v = (value or "middle").strip().lower()
    return v if v in PLOT_TYPES else "middle"


def normalize_approval(value: str) -> str:
    v = (value or "unapproved").strip().lower()
    return v if v in APPROVAL_STATUSES else "other"


def normalize_plot_direction(value: str) -> str:
    v = " ".join((value or "").strip().upper().split())
    return v if v in PLOT_DIRECTIONS else "UNKNOWN"


def row_to_features(row: dict) -> dict:
    return {
        "plotsize": float(row.get("plotsize") or 0),
        "roadWidthFt": float(row.get("roadWidthFt") or 0),
        "plotType": normalize_plot_type(row.get("plotType")),
        "approvalStatus": normalize_approval(row.get("approvalStatus")),
        "plotdirection": normalize_plot_direction(
            row.get("plotdirection") or row.get("plotDirection")
        ),
        "projectid": str(row.get("projectid") or row.get("projectId") or ""),
    }
