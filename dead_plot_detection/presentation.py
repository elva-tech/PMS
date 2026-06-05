"""Plain-language output for admins/customers (no technical field names)."""

from __future__ import annotations

from typing import Any

ACTION_LABELS = {
    "reduce_price": "Lower the price",
    "retarget_buyers": "Follow up with interested buyers",
    "improve_visibility": "Improve how the plot is shown in listings",
    "offer_promotion": "Run a limited-time offer or discount",
    "bundle_offer": "Offer a bundle or flexible payment plan",
}

CLASSIFICATION_LABELS = {
    "Active": "Performing well",
    "Slow": "Moving slowly - needs attention",
    "Dead": "Not selling - urgent action needed",
}

RISK_LABELS = {
    "low": "Low risk",
    "medium": "Medium risk",
    "high": "High risk",
}


def format_price_vs_layout(pct: float, layout: str) -> str:
    layout_name = layout.replace("_", " ") if layout else "this layout"
    pct_abs = abs(round(pct))
    if pct >= 10:
        return f"Price is about {pct_abs}% higher than similar plots in {layout_name}"
    if pct <= -10:
        return f"Price is about {pct_abs}% lower than similar plots in {layout_name}"
    return f"Price is roughly in line with similar plots in {layout_name}"


def build_plain_signals(
    signals: dict,
    *,
    layout: str,
    status: str,
) -> list[str]:
    if status == "Sold":
        return ["This plot is already sold."]

    lines: list[str] = []
    days = int(signals.get("days_unsold") or 0)
    interested = int(signals.get("interested_buyers") or 0)
    days_ix = int(signals.get("days_since_interaction") or 0)
    price_pct = float(signals.get("price_vs_layout_median_pct") or 0)

    if days == 0:
        lines.append("Recently listed")
    elif days == 1:
        lines.append("On market for 1 day")
    else:
        lines.append(f"On market for {days} days without a sale")

    if interested == 0:
        lines.append("No interested buyers yet")
    elif interested == 1:
        lines.append("1 interested buyer")
    else:
        lines.append(f"{interested} interested buyers")

    lines.append(format_price_vs_layout(price_pct, layout))

    if interested > 0:
        if days_ix == 0:
            lines.append("Buyer follow-up recorded recently")
        elif days_ix == 1:
            lines.append("Last buyer follow-up was 1 day ago")
        else:
            lines.append(f"Last buyer follow-up was {days_ix} days ago")

    return lines


def build_plain_actions(actions: list[dict]) -> list[str]:
    steps: list[str] = []
    for item in actions:
        label = ACTION_LABELS.get(item.get("action"), item.get("action", "Take action"))
        detail = (item.get("detail") or "").strip()
        steps.append(f"{label}: {detail}" if detail else label)
    return steps


def build_customer_view(
    *,
    classification: str,
    risk_band: str,
    dead_probability: float,
    layout: str,
    status: str,
    signals: dict,
    reasons: list[dict],
    suggested_actions: list[dict],
) -> dict[str, Any]:
    plain_signals = build_plain_signals(signals, layout=layout, status=status)
    plain_actions = build_plain_actions(suggested_actions)

    # Use rule reasons as readable bullets (factor text is already plain English)
    plain_reasons = [r.get("factor", "") for r in reasons if r.get("factor")]

    headline = CLASSIFICATION_LABELS.get(classification, classification)
    if status == "Sold":
        headline = "Already sold"

    dead_pct = round(dead_probability * 100, 1)
    if classification == "Active":
        chance_line = f"Very low chance of being a dead plot ({dead_pct}% model estimate)"
    else:
        chance_line = f"Model estimates {dead_pct}% chance this plot is hard to sell"

    return {
        "headline": headline,
        "riskLabel": RISK_LABELS.get(risk_band, risk_band),
        "chanceLine": chance_line,
        "summaryLines": plain_signals,
        "whyLines": plain_reasons,
        "recommendedSteps": plain_actions,
    }
