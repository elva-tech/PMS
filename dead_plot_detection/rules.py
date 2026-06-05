"""PRD §5–§9: rule engine, root causes, actionable suggestions."""

from __future__ import annotations

from typing import Any

from config import (
    DEAD_DAYS,
    HIGH_INTEREST_MIN_DAYS,
    HIGH_INTEREST_NO_SALE,
    LOW_INTERESTED_THRESHOLD,
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
    interested = int(enriched.get("interested_buyers") or 0)
    price_vs = float(enriched.get("price_vs_layout_median_pct") or 0)
    road_facing = bool(enriched.get("road_facing"))
    days_since_ix = int(enriched.get("days_since_interaction") or 0)
    nearby_sold = int(enriched.get("nearby_sold_count") or 0)

    reasons: list[dict] = []
    actions: list[dict] = []
    dead_points = 0
    slow_points = 0

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
                "detail": "Reduce price by 5-10% to re-activate demand",
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
                "detail": "Run a limited-time discount or booking incentive",
                "priority": 2,
            }
        )

    # --- Demand: interested buyers (maps to PMS contacts) ---
    if interested < LOW_INTERESTED_THRESHOLD:
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
                "detail": "Highlight plot on layout map and project dashboard",
                "priority": 2,
            }
        )
        actions.append(
            {
                "action": "retarget_buyers",
                "detail": "Follow up with past project inquiries and channel partners",
                "priority": 3,
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
                "detail": "Reduce price by 5-8%; buyers are interested but not converting",
                "priority": 1,
            }
        )
        actions.append(
            {
                "action": "retarget_buyers",
                "detail": "Call/message interested buyers; offer site visit or payment plan",
                "priority": 2,
            }
        )

    # --- Pricing vs layout (PRD §8–§9) ---
    if price_vs >= OVERPRICE_PCT:
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
                "detail": f"Consider reducing price by {pct}% to align with similar plots",
                "priority": 1,
            }
        )

    # --- Visibility ---
    if not road_facing:
        slow_points += 1
        reasons.append(
            {
                "factor": "Not road-facing - lower visibility in layout",
                "severity": "medium",
                "code": "low_visibility",
            }
        )
        actions.append(
            {
                "action": "improve_visibility",
                "detail": "Emphasize access route, corner benefits, or proximity in listing",
                "priority": 3,
            }
        )

    # --- Stale interaction ---
    if days_since_ix >= STALE_INTERACTION_DAYS and interested > 0:
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
                "detail": "Re-contact interested buyers from CRM",
                "priority": 2,
            }
        )

    # --- Layout demand ---
    if nearby_sold == 0 and days >= SLOW_DAYS:
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
    if dead_points >= 3:
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
