"""
Generate synthetic dead-plot training CSV (standalone — not linked to PMS Mongo).

Run: python generate_seed_csv.py
"""

import argparse
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from config import DEFAULT_TRAINING_CSV
from features import layout_medians_from_records
from rules import rule_label_for_training
from training_schema import CSV_ALL_COLUMNS, validate_row, row_to_record

LAYOUTS = ["Layout_A", "Layout_B", "Layout_C"]
PLOT_TYPES = ["corner", "normal"]


def _rand_date(days_ago_min: int, days_ago_max: int) -> str:
    days = random.randint(days_ago_min, days_ago_max)
    dt = datetime.now(timezone.utc) - timedelta(days=days)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _scenario_row(scenario: str, plot_num: int) -> dict:
    layout = random.choice(LAYOUTS)
    area = float(random.choice(range(800, 2801, 50)))
    base_pps = random.randint(2500, 6500)
    price = int(round(area * base_pps * random.uniform(0.85, 1.25)))

    if scenario == "dead_time":
        days_listed = random.randint(130, 400)
        listed = _rand_date(days_listed, days_listed)
        interested = random.randint(0, 1)
        status = "Available"
    elif scenario == "dead_conversion":
        days_listed = random.randint(60, 150)
        listed = _rand_date(days_listed, days_listed)
        interested = random.randint(5, 12)
        status = "Available"
    elif scenario == "slow":
        days_listed = random.randint(65, 110)
        listed = _rand_date(days_listed, days_listed)
        interested = random.randint(1, 3)
        status = "Available"
    elif scenario == "active":
        days_listed = random.randint(5, 45)
        listed = _rand_date(days_listed, days_listed)
        interested = random.randint(2, 8)
        status = "Available"
    elif scenario == "sold":
        days_listed = random.randint(30, 200)
        listed = _rand_date(days_listed, days_listed)
        interested = random.randint(3, 15)
        status = "Sold"
    else:
        days_listed = random.randint(20, 90)
        listed = _rand_date(days_listed, days_listed)
        interested = random.randint(0, 4)
        status = "Available"

    last_ix = (
        _rand_date(1, min(45, max(1, days_listed - 1)))
        if interested > 0
        else ""
    )

    return {
        "plot_id": f"SYN-{layout}-{plot_num:04d}",
        "layout": layout,
        "plot_area": area,
        "plot_type": random.choice(PLOT_TYPES),
        "road_facing": random.choice([True, False]),
        "price": price,
        "status": status,
        "listed_date": listed,
        "interested_buyers": interested,
        "last_interaction_date": last_ix if interested > 0 else "",
        "nearby_sold_count": random.randint(0, 8),
        "layout_median_price_per_sqft": "",
    }


def generate(rows: int = 500, seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    scenarios = (
        ["dead_time"] * 80
        + ["dead_conversion"] * 60
        + ["slow"] * 120
        + ["active"] * 180
        + ["sold"] * 60
    )
    raw_rows = []
    for i in range(rows):
        scenario = scenarios[i % len(scenarios)] if i < len(scenarios) else random.choice(scenarios)
        raw_rows.append(_scenario_row(scenario, i + 1))

    medians = layout_medians_from_records(raw_rows)
    for r in raw_rows:
        layout = r["layout"]
        if medians.get(layout):
            r["layout_median_price_per_sqft"] = round(medians[layout], 2)

    labeled = []
    for i, raw in enumerate(raw_rows, start=1):
        rec = row_to_record(raw)
        errs = validate_row(rec, row_index=i)
        if errs:
            raise RuntimeError(errs[0])
        rec["dead_label"] = rule_label_for_training(rec)
        labeled.append(rec)

    df = pd.DataFrame(labeled)
    for col in CSV_ALL_COLUMNS:
        if col not in df.columns:
            df[col] = ""
    return df[list(CSV_ALL_COLUMNS)]


def main():
    parser = argparse.ArgumentParser(description="Generate dead-plot training CSV")
    parser.add_argument("--rows", type=int, default=500)
    parser.add_argument("--out", type=Path, default=Path(DEFAULT_TRAINING_CSV))
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    df = generate(args.rows, seed=args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)
    print(f"Wrote {len(df)} rows -> {args.out}")
    print(df["dead_label"].value_counts().to_string())


if __name__ == "__main__":
    main()
