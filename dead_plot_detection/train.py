"""Train Random Forest classifier from CSV (PRD §7 Phase 3)."""

import argparse
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from dotenv import load_dotenv
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from config import (
    DEFAULT_MODEL_PATH,
    DEFAULT_SEED_CSV,
    DEFAULT_TRAINING_CSV,
    RULES_VERSION,
)
from features import (
    CATEGORICAL_FEATURES,
    FEATURE_COLUMNS,
    enrich_record,
    layout_medians_from_records,
    records_to_feature_frame,
)
from rules import rule_label_for_training
from training_schema import (
    CLASS_LABELS,
    CSV_REQUIRED_COLUMNS_LOWER,
    row_to_record,
    validate_row,
)

load_dotenv()

MODEL_PATH = Path(os.getenv("DEAD_PLOT_MODEL_PATH", DEFAULT_MODEL_PATH))
TRAINING_CSV = Path(os.getenv("DEAD_PLOT_TRAINING_CSV", DEFAULT_TRAINING_CSV))
MIN_ROWS = int(os.getenv("DEAD_PLOT_MIN_TRAINING_ROWS", "50"))


def _env_flag(name: str, default: bool = True) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def load_csv(path: Path) -> list[dict]:
    if not path.is_file():
        raise FileNotFoundError(f"Training CSV not found: {path}. Run: python generate_seed_csv.py")

    df = pd.read_csv(path)
    cols_lower = {c.lower() for c in df.columns}
    missing = CSV_REQUIRED_COLUMNS_LOWER - cols_lower
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    col_map = {c.lower(): c for c in df.columns}
    records = []
    errors = []

    for idx, row in df.iterrows():
        raw = {str(col_map[k]).strip().lower(): row[col_map[k]] for k in col_map}
        rec = row_to_record(
            {
                "plot_id": raw.get("plot_id"),
                "layout": raw.get("layout"),
                "plot_area": raw.get("plot_area"),
                "plot_type": raw.get("plot_type"),
                "road_facing": raw.get("road_facing"),
                "price": raw.get("price"),
                "status": raw.get("status"),
                "listed_date": raw.get("listed_date"),
                "interested_buyers": raw.get("interested_buyers"),
                "last_interaction_date": raw.get("last_interaction_date"),
                "nearby_sold_count": raw.get("nearby_sold_count"),
                "layout_median_price_per_sqft": raw.get("layout_median_price_per_sqft"),
                "dead_label": raw.get("dead_label"),
            }
        )
        row_errors = validate_row(rec, row_index=int(idx) + 2)
        if row_errors:
            errors.extend(row_errors)
            continue
        records.append(rec)

    if not records:
        raise ValueError(f"No valid rows in {path}. Errors: {errors[:5]}")
    if errors:
        print(f"Warning: skipped {len(errors)} validation messages")

    return records


def prepare_training_set(records: list[dict]) -> tuple[pd.DataFrame, pd.Series]:
    medians = layout_medians_from_records(records)
    enriched = []
    labels = []

    for rec in records:
        if medians.get(rec["layout"]) and not rec.get("layout_median_price_per_sqft"):
            rec = dict(rec)
            rec["layout_median_price_per_sqft"] = medians[rec["layout"]]
        label = rec.get("dead_label") or rule_label_for_training(rec)
        if label not in CLASS_LABELS:
            label = "Active"
        enriched.append(enrich_record(rec))
        labels.append(label)

    # Train only on non-sold (dead detection applies to inventory)
    train_records = [r for r, lbl in zip(enriched, labels) if r.get("status") != "Sold"]
    train_labels = [lbl for r, lbl in zip(enriched, labels) if r.get("status") != "Sold"]

    if len(train_records) < MIN_ROWS:
        raise RuntimeError(
            f"Need at least {MIN_ROWS} non-sold rows; found {len(train_records)}"
        )

    X = records_to_feature_frame(train_records)
    y = pd.Series(train_labels, name="dead_label")
    return X, y


def load_training_records(
    *,
    use_mongo: bool = True,
    use_csv: bool = True,
    csv_path: Path | None = None,
) -> tuple[list[dict], dict]:
    stats = {"csv_rows": 0, "mongo_rows": 0, "merged_rows": 0}
    path = csv_path or TRAINING_CSV
    seed = Path(DEFAULT_SEED_CSV)

    records: list[dict] = []
    if use_csv:
        if path.is_file():
            records.extend(load_csv(path))
            stats["csv_rows"] += len(records)
        elif _env_flag("DEAD_PLOT_USE_SEED_CSV", True) and seed.is_file() and seed != path:
            seed_rows = load_csv(seed)
            records.extend(seed_rows)
            stats["csv_rows"] += len(seed_rows)

    if use_mongo:
        try:
            from mongo_loader import load_all_training_plots

            mongo_rows = load_all_training_plots()
            stats["mongo_rows"] = len(mongo_rows)
            by_id = {str(r["plot_id"]): r for r in records}
            for row in mongo_rows:
                by_id[str(row["plot_id"])] = row
            records = list(by_id.values())
        except RuntimeError as err:
            if not records:
                raise
            stats["mongo_skipped"] = str(err)

    stats["merged_rows"] = len(records)
    return records, stats


def train_and_save(
    csv_path: Path | None = None,
    *,
    use_mongo: bool | None = None,
    use_csv: bool | None = None,
) -> dict:
    use_mongo = (
        use_mongo
        if use_mongo is not None
        else _env_flag("DEAD_PLOT_USE_MONGO", True)
    )
    use_csv = (
        use_csv if use_csv is not None else _env_flag("DEAD_PLOT_USE_CSV", True)
    )

    records, stats = load_training_records(
        use_mongo=use_mongo,
        use_csv=use_csv,
        csv_path=csv_path,
    )
    if not records:
        raise RuntimeError(
            "No training data. Enable DEAD_PLOT_USE_CSV or DEAD_PLOT_USE_MONGO, "
            "or run: python generate_seed_csv.py"
        )

    X, y = prepare_training_set(records)

    pipeline = Pipeline(
        steps=[
            (
                "prep",
                ColumnTransformer(
                    transformers=[
                        ("num", "passthrough", FEATURE_COLUMNS),
                        (
                            "cat",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                            CATEGORICAL_FEATURES,
                        ),
                    ]
                ),
            ),
            (
                "clf",
                RandomForestClassifier(
                    n_estimators=200,
                    max_depth=10,
                    min_samples_leaf=2,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    metrics = {"training_rows": len(y), **stats}
    if len(y) >= 20:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        pipeline.fit(X_train, y_train)
        pred = pipeline.predict(X_test)
        metrics["f1_macro"] = float(f1_score(y_test, pred, average="macro"))
        metrics["report"] = classification_report(y_test, pred, output_dict=True)
    else:
        pipeline.fit(X, y)
        metrics["f1_macro"] = None

    layout_medians = layout_medians_from_records(records)
    trained_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    artifact = {
        "pipeline": pipeline,
        "feature_columns": FEATURE_COLUMNS + CATEGORICAL_FEATURES,
        "class_labels": list(CLASS_LABELS),
        "layout_medians": layout_medians,
        "training_rows": len(y),
        "rules_version": RULES_VERSION,
        "trained_at": trained_at,
        "metrics": metrics,
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)

    return {
        "model_path": str(MODEL_PATH),
        "trained_at": trained_at,
        "training_rows": len(y),
        "f1_macro": metrics.get("f1_macro"),
        "label_distribution": y.value_counts().to_dict(),
        **stats,
    }


def main():
    parser = argparse.ArgumentParser(description="Train dead-plot classifier")
    parser.add_argument("--csv", type=Path, default=None)
    parser.add_argument("--no-mongo", action="store_true")
    parser.add_argument("--no-csv", action="store_true")
    args = parser.parse_args()
    result = train_and_save(
        args.csv,
        use_mongo=not args.no_mongo,
        use_csv=not args.no_csv,
    )
    print("Training complete:", result)


if __name__ == "__main__":
    main()
