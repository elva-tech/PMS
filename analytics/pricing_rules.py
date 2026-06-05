"""PRD §10–§11: business rules, range, reasoning, price assessment (display layer)."""

from statistics import median
from typing import List, Optional, Tuple

# Explainability vs project baseline (not used for training)
PLOT_TYPE_IMPACT_PCT = {
    "corner": 10,
    "end": 5,
    "road-facing": 8,
    "park-facing": 10,
    "cul-de-sac": -3,
    "middle": 0,
}

APPROVAL_IMPACT_PCT = {
    "bda": 8,
    "dtcp": 5,
    "panchayat": -4,
    "unapproved": -10,
    "other": 0,
}

RANGE_BAND_PCT = {"high": 0.08, "medium": 0.12, "low": 0.18}

MIN_DEVIATION_FROM_MEDIAN = 0.75
MAX_DEVIATION_FROM_MEDIAN = 2.0
MIN_REALISTIC_PPS = 500

DIRECTION_IMPACT_PCT = {
    "NORTH": 8,
    "EAST": 10,
    "NORTH EAST": 12,
    "NORTH WEST": 6,
    "SOUTH EAST": 5,
    "WEST": 2,
    "SOUTH": -2,
    "SOUTH WEST": -3,
}


def _size_matched(comparables: list, plotsize: float) -> list:
    if not plotsize or plotsize <= 0:
        return comparables
    lo, hi = plotsize * 0.5, plotsize * 1.5
    matched = [c for c in comparables if lo <= c.get("plotsize", 0) <= hi]
    return matched if len(matched) >= 2 else comparables


def median_price_per_sqft(
    comparables: list, plotsize: Optional[float] = None
) -> Optional[float]:
    pool = _size_matched(comparables, plotsize) if plotsize else comparables
    rates = [
        c["pricePerSqft"]
        for c in pool
        if c.get("pricePerSqft") and c["pricePerSqft"] > 0
    ]
    if not rates:
        return None
    realistic = [r for r in rates if r >= MIN_REALISTIC_PPS]
    use = realistic if len(realistic) >= 2 else rates
    return float(median(use))


def baseline_price(plotsize: float, comparables: list) -> int:
    pps = median_price_per_sqft(comparables, plotsize)
    if not pps or plotsize <= 0:
        return 0
    return max(0, int(round(plotsize * pps)))


def _feature_multiplier(plot_type: str, approval_status: str, plot_direction: str) -> float:
    mult = 1.0
    mult += PLOT_TYPE_IMPACT_PCT.get(plot_type, 0) / 100.0
    mult += APPROVAL_IMPACT_PCT.get(approval_status, 0) / 100.0
    mult += DIRECTION_IMPACT_PCT.get(plot_direction, 0) / 100.0
    return max(0.5, min(mult, 1.5))


def project_adjusted_price(
    plotsize: float,
    comparables: list,
    plot_type: str,
    approval_status: str,
    plot_direction: str,
) -> int:
    base = baseline_price(plotsize, comparables)
    if base <= 0:
        return 0
    return max(
        0,
        int(round(base * _feature_multiplier(plot_type, approval_status, plot_direction))),
    )


def apply_business_rules(ai_price: int, plotsize: float, comparables: list) -> Tuple[int, List[str]]:
    """Soft clamp vs similar-size plots in this project."""
    notes: List[str] = []
    pps = median_price_per_sqft(comparables, plotsize)
    if not pps or plotsize <= 0:
        return ai_price, notes

    floor_price = int(round(plotsize * pps * MIN_DEVIATION_FROM_MEDIAN))
    ceiling_price = int(round(plotsize * pps * MAX_DEVIATION_FROM_MEDIAN))
    if floor_price <= ai_price <= ceiling_price:
        return ai_price, notes
    final = max(floor_price, min(ai_price, ceiling_price))

    if final < ai_price:
        notes.append(
            f"Capped to project band (max +{int((MAX_DEVIATION_FROM_MEDIAN - 1) * 100)}% vs median ₹/sqft)"
        )
    elif final > ai_price:
        notes.append(
            f"Raised to minimum vs project median (floor {int((1 - MIN_DEVIATION_FROM_MEDIAN) * 100)}%)"
        )
    return final, notes


def price_range(suggested: int, confidence: str) -> Tuple[int, int]:
    band = RANGE_BAND_PCT.get(confidence, 0.12)
    low = max(0, int(round(suggested * (1 - band))))
    high = int(round(suggested * (1 + band)))
    return low, high


def build_reasoning(
    plot_type: str,
    approval_status: str,
    road_width_ft: float,
    comparables: list,
    plot_direction: str = "UNKNOWN",
    plotsize: Optional[float] = None,
) -> List[dict]:
    reasons = []
    dir_pct = DIRECTION_IMPACT_PCT.get(plot_direction, 0)
    if plot_direction and plot_direction != "UNKNOWN" and dir_pct:
        reasons.append(
            {
                "factor": f"Facing {plot_direction.title()}",
                "impactPct": abs(dir_pct),
                "direction": "increase" if dir_pct > 0 else "decrease",
            }
        )
    type_pct = PLOT_TYPE_IMPACT_PCT.get(plot_type, 0)
    if type_pct:
        label = plot_type.replace("-", " ").title()
        reasons.append(
            {
                "factor": f"{label} plot",
                "impactPct": type_pct,
                "direction": "increase" if type_pct > 0 else "decrease",
            }
        )

    appr_pct = APPROVAL_IMPACT_PCT.get(approval_status, 0)
    if appr_pct:
        reasons.append(
            {
                "factor": f"{approval_status.upper()} approval",
                "impactPct": abs(appr_pct),
                "direction": "increase" if appr_pct > 0 else "decrease",
            }
        )

    if road_width_ft >= 40:
        reasons.append(
            {"factor": "Wide road frontage (40+ ft)", "impactPct": 5, "direction": "increase"}
        )
    elif road_width_ft >= 30:
        reasons.append(
            {"factor": "Road width 30+ ft", "impactPct": 3, "direction": "increase"}
        )

    pps = median_price_per_sqft(comparables, plotsize)
    if pps:
        reasons.insert(
            0,
            {
                "factor": f"Similar plots in project ~₹{int(pps):,}/sq.ft",
                "impactPct": None,
                "direction": "baseline",
            },
        )
    return reasons


def assess_current_price(
    current_price: Optional[float], suggested: int, low: int, high: int
) -> Optional[dict]:
    if current_price is None or current_price <= 0:
        return None
    current = int(round(current_price))
    if current > high:
        pct = int(round((current - suggested) / suggested * 100)) if suggested else 0
        return {
            "verdict": "too_high",
            "label": "Likely too high",
            "currentPrice": current,
            "deltaPct": pct,
        }
    if current < low:
        pct = int(round((suggested - current) / suggested * 100)) if suggested else 0
        return {
            "verdict": "too_low",
            "label": "Likely too low",
            "currentPrice": current,
            "deltaPct": pct,
        }
    return {
        "verdict": "reasonable",
        "label": "Within suggested range",
        "currentPrice": current,
        "deltaPct": 0,
    }
