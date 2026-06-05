"""
Export real plots from MongoDB to production training CSV.

Run:
  python export_plots_csv.py
  python export_plots_csv.py --project-id 485775 --out data/plots_project_485775.csv
"""

import argparse
import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient

from training_schema import CSV_ALL_COLUMNS, mongo_doc_to_training_row, validate_training_row

load_dotenv()

DEFAULT_OUT = Path(__file__).resolve().parent / "data" / "plots_production_export.csv"


def load_plots_from_mongo(project_id: str | None = None) -> list[dict]:
    url = os.getenv("MONGODB_URL")
    if not url:
        raise RuntimeError("MONGODB_URL is required in analytics/.env")

    query = {"projectid": project_id} if project_id else {}
    client = MongoClient(url)
    db = client.get_default_database()
    cursor = db.plots.find(query).sort([("projectid", 1), ("plotnumber", 1)])
    docs = list(cursor)
    client.close()
    return docs


def export_csv(project_id: str | None, out_path: Path) -> dict:
    docs = load_plots_from_mongo(project_id)
    rows = []
    errors = []

    for i, doc in enumerate(docs, start=1):
        row = mongo_doc_to_training_row(doc)
        row_errors = validate_training_row(row, row_index=i)
        if row_errors:
            errors.extend(row_errors)
            continue
        rows.append(row)

    if errors:
        sample = errors[:10]
        raise RuntimeError(
            f"{len(errors)} row(s) failed validation. First issues: {'; '.join(sample)}"
        )

    if not rows:
        raise RuntimeError("No valid plots to export. Check MONGODB_URL and plot data.")

    df = pd.DataFrame(rows)
    for col in CSV_ALL_COLUMNS:
        if col not in df.columns:
            df[col] = ""
    df = df[list(CSV_ALL_COLUMNS)]

    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)

    sold = (df["plotstatus"] == "Sold").sum()
    return {
        "path": str(out_path),
        "total_rows": len(df),
        "sold_rows": int(sold),
        "projects": sorted(df["projectid"].astype(str).unique().tolist()),
    }


def main():
    parser = argparse.ArgumentParser(description="Export Mongo plots to training CSV")
    parser.add_argument("--project-id", help="Limit export to one project")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    stats = export_csv(args.project_id, args.out)
    print("Export complete:", stats)


if __name__ == "__main__":
    main()
