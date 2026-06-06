"""PRD §5–§9: rule engine, root causes, actionable suggestions."""

from __future__ import annotations

from typing import Any

from config import (
    DEAD_DAYS,
    HIGH_INTEREST_MIN_DAYS,
    HIGH_INTEREST_NO_SALE,
    LOW_INTERESTED_THRESHOLD,
    NEW_LISTING_GRACE_DAYS,
    OVERPRICE_PCT,
    RULES_VERSION,
    SLOW_DAYS,
    STALE_INTERACTION_DAYS,
)
from features import enrich_record
from training_schema import CLASS_LABELS


def _severity(score: int) -> str:
    if score >= 3:
        return "high"
    if score >= 2:
        return "medium"
    return "low"


def classify_by_rules(record: dict, *, reference_date=None) -> dict[str, Any]:
    """
    PRD Phase 1: Time + demand (interested buyers) + conversion.
    Returns status Active | Slow | Dead and structured reasons.
    """
    enriched = enrich_record(record, reference_date=reference_date)
    status = enriched.get("status")

    if status == "Sold":
        return {
            "classification": "Active",
            "ruleStatus": "Active",
            "deadScore": 0.0,
            "reasons": [{"factor": "Plot already sold", "severity": "low", "code": "sold"}],
            "suggestedActions": [],
            "rulesVersion": RULES_VERSION,
            "signals": {
                "days_unsold": 0,
                "interested_buyers": int(enriched.get("interested_buyers") or 0),
                "price_vs_layout_median_pct": float(
                    enriched.get("price_vs_layout_median_pct") or 0
                ),
                "days_since_interaction": int(
                    enriched.get("days_since_interaction") or 0
                ),
            },
        }

    days = int(enriched.get("days_unsold") or 0)
    is_new_listing = days < NEW_LISTING_GRACE_DAYS
    plot_ref = (
        f"Plot #{record.get('plot_number')}"
        if record.get("plot_number") is not None
        else "This plot"
    )
    layout_name = str(record.get("layout") or "this layout").replace("_", " ")
    interested = int(enriched.get("interested_buyers") or 0)
    price_vs = float(enriched.get("price_vs_layout_median_pct") or 0)
    road_facing = bool(enriched.get("road_facing"))
    days_since_ix = int(enriched.get("days_since_interaction") or 0)
    nearby_sold = int(enriched.get("nearby_sold_count") or 0)
    plot_type = str(enriched.get("plot_type") or "normal")
    price_per_sqft = float(enriched.get("price_per_sqft") or 0)

    reasons: list[dict] = []
    actions: list[dict] = []
    dead_points = 0
    slow_points = 0

    # --- Positive signals (precise, plot-specific) ---
    if is_new_listing and interested >= LOW_INTERESTED_THRESHOLD:
        reasons.append(
            {
                "factor": f"{plot_ref}: {interested} interested buyer(s) in first {NEW_LISTING_GRACE_DAYS} days — strong launch",
                "severity": "low",
                "code": "healthy",
            }
        )
    elif is_new_listing:
        reasons.append(
            {
                "factor": f"{plot_ref}: recently listed — allow {NEW_LISTING_GRACE_DAYS} days to build buyer interest",
                "severity": "low",
                "code": "healthy",
            }
        )

    if road_facing:
        reasons.append(
            {
                "factor": f"{plot_ref}: road-facing / high visibility in {layout_name}",
                "severity": "low",
                "code": "healthy",
            }
        )

    if price_vs <= -OVERPRICE_PCT:
        reasons.append(
            {
                "factor": f"{plot_ref}: priced ~{abs(price_vs):.0f}% below {layout_name} median — competitive",
                "severity": "low",
                "code": "healthy",
            }
        )

    if interested == 1 and not is_new_listing:
        slow_points += 1
        reasons.append(
            {
                "factor": f"{plot_ref}: only 1 interested buyer — nurture this lead",
                "severity": "medium",
                "code": "single_buyer",
            }
        )
        actions.append(
            {
                "action": "retarget_buyers",
                "detail": f"{plot_ref}: call the interested buyer within 48 hours; offer site visit",
                "priority": 1,
            }
        )
    elif 2 <= interested < HIGH_INTEREST_NO_SALE and not is_new_listing:
        reasons.append(
            {
                "factor": f"{plot_ref}: {interested} interested buyers — warming demand",
                "severity": "low",
                "code": "healthy",
            }
        )

    # --- Time (PRD §5) ---
    if days >= DEAD_DAYS:
        dead_points += 3
        reasons.append(
            {
                "factor": f"Unsold for {days} days (>= {DEAD_DAYS})",
                "severity": "high",
                "code": "time_dead",
            }
        )
        actions.append(
            {
                "action": "reduce_price",
                "detail": f"{plot_ref}: reduce price 5-10% (₹{price_per_sqft:,.0f}/sqft now) to re-activate demand",
                "priority": 1,
            }
        )
    elif days >= SLOW_DAYS:
        slow_points += 2
        reasons.append(
            {
                "factor": f"Unsold for {days} days (>= {SLOW_DAYS})",
                "severity": "medium",
                "code": "time_slow",
            }
        )
        actions.append(
            {
                "action": "offer_promotion",
                "detail": f"{plot_ref}: limited-time booking offer after {days} days unsold in {layout_name}",
                "priority": 2,
            }
        )

    # --- Demand: interested buyers (maps to PMS contacts) ---
    if interested == 0 and not is_new_listing:
        slow_points += 1
        dead_points += 1 if days >= SLOW_DAYS else 0
        reasons.append(
            {
                "factor": f"Low buyer interest ({interested} interested buyer(s))",
                "severity": _severity(2 if interested == 0 else 1),
                "code": "low_interested_buyers",
            }
        )
        actions.append(
            {
                "action": "improve_visibility",
                "detail": f"{plot_ref}: highlight on layout map and {layout_name} dashboard",
                "priority": 2,
            }
        )
        actions.append(
            {
                "action": "retarget_buyers",
                "detail": f"{plot_ref}: follow up with past inquiries and channel partners",
                "priority": 3,
            }
        )
    elif interested == 0 and is_new_listing:
        actions.append(
            {
                "action": "improve_visibility",
                "detail": f"{plot_ref}: share listing with brokers and past {layout_name} inquiries this week",
                "priority": 2,
            }
        )

    # --- Conversion: interest but no sale (PRD §5) ---
    if (
        interested >= HIGH_INTEREST_NO_SALE
        and days >= HIGH_INTEREST_MIN_DAYS
        and status == "Available"
    ):
        dead_points += 2
        reasons.append(
            {
                "factor": f"{interested} interested buyers but no sale - likely pricing or terms",
                "severity": "high",
                "code": "conversion_failure",
            }
        )
        actions.append(
            {
                "action": "reduce_price",
                "detail": f"{plot_ref}: reduce 5-8% — {interested} buyers interested but not converting",
                "priority": 1,
            }
        )
        actions.append(
            {
                "action": "retarget_buyers",
                "detail": f"{plot_ref}: call all {interested} interested buyers; offer site visit or EMI plan",
                "priority": 2,
            }
        )

    # --- Pricing vs layout (PRD §8–§9) ---
    if price_vs >= OVERPRICE_PCT and not is_new_listing:
        dead_points += 1
        slow_points += 1
        reasons.append(
            {
                "factor": f"Price ~{price_vs:.0f}% above layout median ₹/sqft",
                "severity": "high" if price_vs >= OVERPRICE_PCT * 1.5 else "medium",
                "code": "overpriced",
            }
        )
        pct = min(15, max(5, int(round(price_vs / 2))))
        actions.append(
            {
                "action": "reduce_price",
                "detail": f"{plot_ref}: consider reducing price by {pct}% vs similar plots in {layout_name}",
                "priority": 1,
            }
        )

    # --- Visibility ---
    if not road_facing and not is_new_listing:
        slow_points += 1
        visibility_note = (
            "interior plot — highlight access path"
            if plot_type == "normal"
            else f"{plot_type} plot — highlight unique layout benefits"
        )
        reasons.append(
            {
                "factor": f"{plot_ref}: not road-facing — {visibility_note}",
                "severity": "medium",
                "code": "low_visibility",
            }
        )
        actions.append(
            {
                "action": "improve_visibility",
                "detail": f"{plot_ref}: {visibility_note} in {layout_name} listings",
                "priority": 3,
            }
        )

    # --- Stale interaction ---
    if days_since_ix >= STALE_INTERACTION_DAYS and interested > 0 and not is_new_listing:
        slow_points += 1
        reasons.append(
            {
                "factor": f"No buyer follow-up in {days_since_ix} days",
                "severity": "medium",
                "code": "stale_interaction",
            }
        )
        actions.append(
            {
                "action": "retarget_buyers",
                "detail": f"{plot_ref}: re-contact {interested} interested buyer(s) — no follow-up in {days_since_ix} days",
                "priority": 2,
            }
        )

    # --- Layout demand ---
    if nearby_sold == 0 and days >= SLOW_DAYS and not is_new_listing:
        slow_points += 1
        reasons.append(
            {
                "factor": "No recent sales nearby in this layout",
                "severity": "medium",
                "code": "low_layout_demand",
            }
        )
        actions.append(
            {
                "action": "bundle_offer",
                "detail": "Bundle with faster-moving plots or flexible payment plan",
                "priority": 3,
            }
        )

    # --- Final rule status ---
    if is_new_listing and dead_points < 3:
        rule_status = "Active"
    elif dead_points >= 3:
        rule_status = "Dead"
    elif dead_points >= 1 or slow_points >= 2:
        rule_status = "Slow"
    else:
        rule_status = "Active"

    dead_score = min(1.0, round((dead_points * 0.25 + slow_points * 0.12), 2))

    # Dedupe actions by action key, keep lowest priority number
    seen: dict[str, dict] = {}
    for a in sorted(actions, key=lambda x: x["priority"]):
        seen[a["action"]] = a
    actions = sorted(seen.values(), key=lambda x: x["priority"])

    if not reasons:
        reasons.append(
            {
                "factor": "Healthy time on market and buyer interest",
                "severity": "low",
                "code": "healthy",
            }
        )

    return {
        "classification": rule_status,
        "ruleStatus": rule_status,
        "deadScore": dead_score,
        "reasons": reasons,
        "suggestedActions": actions,
        "rulesVersion": RULES_VERSION,
        "signals": {
            "days_unsold": days,
            "interested_buyers": interested,
            "price_vs_layout_median_pct": price_vs,
            "days_since_interaction": days_since_ix,
        },
    }


def rule_label_for_training(record: dict, *, reference_date=None) -> str:
    """PRD: use rules to label CSV rows for classifier training."""
    result = classify_by_rules(record, reference_date=reference_date)
    label = result["ruleStatus"]
    return label if label in CLASS_LABELS else "Active"
