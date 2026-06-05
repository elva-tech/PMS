"""
Generate synthetic plot training rows (DEV/BOOTSTRAP ONLY — not production data).

Run: python generate_seed_csv.py
Output: data/plots_training_seed.csv (dataSource=synthetic, seed_proj_* IDs)
"""

import argparse
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from features import APPROVAL_STATUSES, PLOT_DIRECTIONS, PLOT_TYPES
from pricing_rules import project_adjusted_price
from training_schema import CSV_ALL_COLUMNS, PLOT_STATUSES, validate_training_row

DEFAULT_OUT = Path(__file__).resolve().parent / "data" / "plots_training_seed.csv"

PROJECT_BASE_PPS = {
    "seed_proj_01": 3200,
    "seed_proj_02": 4500,
    "seed_proj_03": 2800,
    "seed_proj_04": 6100,
    "seed_proj_05": 3900,
    "seed_proj_06": 5200,
    "seed_proj_07": 2400,
    "seed_proj_08": 7200,
    "seed_proj_09": 3600,
    "seed_proj_10": 4800,
    "seed_proj_11": 5500,
    "seed_proj_12": 4100,
}

ROAD_WIDTHS = [20.0, 25.0, 30.0, 35.0, 40.0, 50.0]
# Weight toward Sold — training prefers sold labels
PLOT_STATUS_WEIGHTS = ["Sold", "Sold", "Sold", "Available", "Reserved"]


def _comparables_for_project(base_pps: float, n: int = 8) -> list:
    rows = []
    for i in range(n):
        size = random.randint(800, 2400)
        price = int(round(size * base_pps * random.uniform(0.92, 1.08)))
        rows.append(
            {
                "plotsize": float(size),
                "plotprice": float(price),
                "pricePerSqft": int(round(price / size)),
            }
        )
    return rows


def _random_created_at() -> str:
    days_ago = random.randint(30, 730)
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_row(project_id: str, plot_num: int, base_pps: float) -> dict:
    plotsize = float(random.choice(range(600, 3201, 50)))
    road_width = random.choice(ROAD_WIDTHS)
    plot_type = random.choice(PLOT_TYPES)
    approval = random.choice(APPROVAL_STATUSES)
    direction = random.choice(PLOT_DIRECTIONS)
    status = random.choice(PLOT_STATUS_WEIGHTS)

    comparables = _comparables_for_project(base_pps)
    anchor = project_adjusted_price(
        plotsize, comparables, plot_type, approval, direction
    )
    if anchor <= 0:
        anchor = int(round(plotsize * base_pps))
    noise = random.uniform(0.94, 1.06)
    plotprice = max(1, int(round(anchor * noise)))

    return {
        "projectid": project_id,
        "plotnumber": plot_num,
        "plotsize": plotsize,
        "roadWidthFt": road_width,
        "plotType": plot_type,
        "approvalStatus": approval,
        "plotdirection": direction,
        "plotprice": plotprice,
        "plotstatus": status,
        "createdAt": _random_created_at(),
        "dataSource": "synthetic",
    }


def generate_dataset(rows: int, seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    projects = list(PROJECT_BASE_PPS.keys())
    per_project = max(1, rows // len(projects))
    data = []
    for project_id in projects:
        base_pps = PROJECT_BASE_PPS[project_id]
        for i in range(1, per_project + 1):
            data.append(generate_row(project_id, i, base_pps))
    while len(data) < rows:
        project_id = random.choice(projects)
        data.append(
            generate_row(
                project_id,
                len(data) + 1,
                PROJECT_BASE_PPS[project_id],
            )
        )

    for i, row in enumerate(data[:rows], start=1):
        errs = validate_training_row(row, row_index=i)
        if errs:
            raise RuntimeError(f"Synthetic row validation failed: {errs[0]}")

    df = pd.DataFrame(data[:rows])
    return df[list(CSV_ALL_COLUMNS)]


def main():
    parser = argparse.ArgumentParser(
        description="Generate DEV-ONLY synthetic plot training CSV"
    )
    parser.add_argument("--rows", type=int, default=400)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    df = generate_dataset(args.rows, seed=args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)
    sold = (df["plotstatus"] == "Sold").sum()
    print(
        f"Wrote {len(df)} SYNTHETIC rows to {args.out} "
        f"({sold} Sold, dataSource=synthetic — not for production training)"
    )


if __name__ == "__main__":
    main()
