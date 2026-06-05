"""
Train plot price regression model from MongoDB and/or validated CSV.

Modes (TRAINING_MODE in .env):
  development — Mongo + optional synthetic seed CSV (local bootstrap)
  production  — Mongo and/or production export CSV only; synthetic seed rejected

Run:
  python export_plots_csv.py              # real data export (production)
  python train.py                         # per .env mode
  python train.py --production            # force production rules
  python train.py --mongo-only            # Mongo only
"""

import argparse
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from features import CATEGORICAL_FEATURES, NUMERIC_FEATURES, row_to_features
from training_schema import (
    CSV_REQUIRED_COLUMNS_LOWER,
    csv_dict_to_plot,
    is_synthetic_project,
    mongo_doc_to_training_row,
    normalize_plot_status,
    validate_training_row,
)

load_dotenv()

MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = Path(os.getenv("MODEL_PATH", MODEL_DIR / "plot_price_model.joblib"))
DEFAULT_SEED_CSV = Path(__file__).resolve().parent / "data" / "plots_training_seed.csv"
DEFAULT_PRODUCTION_CSV = (
    Path(__file__).resolve().parent / "data" / "plots_production_export.csv"
)

LEGACY_DEFAULT_ROAD_WIDTH_FT = 30.0
MIN_TRAINING_ROWS = int(os.getenv("TRAINING_MIN_ROWS", "5"))
MIN_SOLD_ROWS = int(os.getenv("TRAINING_MIN_SOLD_ROWS", "5"))


def _env_flag(name: str, default: bool = True) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def resolve_training_mode(force_production: bool = False) -> str:
    if force_production:
        return "production"
    mode = (os.getenv("TRAINING_MODE") or "development").strip().lower()
    return mode if mode in ("development", "production") else "development"


def resolve_training_csv_paths(
    extra_paths: list[Path] | None = None,
    *,
    use_seed_csv: bool,
    mode: str,
) -> list[Path]:
    paths: list[Path] = []
    if extra_paths:
        paths.extend(extra_paths)

    env_csv = (os.getenv("TRAINING_CSV") or "").strip()
    if env_csv:
        for part in env_csv.replace(";", ",").split(","):
            part = part.strip()
            if part:
                paths.append(Path(part))

    if mode == "production" and DEFAULT_PRODUCTION_CSV.is_file():
        if DEFAULT_PRODUCTION_CSV not in paths:
            paths.append(DEFAULT_PRODUCTION_CSV)

    if use_seed_csv and mode == "development" and DEFAULT_SEED_CSV.is_file():
        if DEFAULT_SEED_CSV not in paths:
            paths.append(DEFAULT_SEED_CSV)

    seen = set()
    unique: list[Path] = []
    for p in paths:
        key = str(p.resolve()) if p.exists() else str(p)
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def load_plots_from_csv(path: Path, *, mode: str) -> list[dict]:
    if not path.is_file():
        raise FileNotFoundError(f"Training CSV not found: {path}")

    if mode == "production" and path.resolve() == DEFAULT_SEED_CSV.resolve():
        raise RuntimeError(
            "Production training cannot use plots_training_seed.csv. "
            "Run: python export_plots_csv.py and set TRAINING_USE_SEED_CSV=false"
        )

    df = pd.read_csv(path)
    cols_lower = {c.lower() for c in df.columns}
    missing = CSV_REQUIRED_COLUMNS_LOWER - cols_lower
    if missing:
        raise ValueError(
            f"{path.name} missing columns: {sorted(missing)}. "
            f"Required: {', '.join(CSV_REQUIRED_COLUMNS_LOWER)}"
        )

    col_map = {c.lower(): c for c in df.columns}
    plots = []
    errors = []

    for idx, row in df.iterrows():
        raw = {
            str(col_map[k]).strip().lower(): row[col_map[k]]
            for k in col_map
        }
        plot = csv_dict_to_plot(
            {
                "projectid": raw.get("projectid"),
                "plotnumber": raw.get("plotnumber"),
                "plotsize": raw.get("plotsize"),
                "roadWidthFt": raw.get("roadwidthft"),
                "plotType": raw.get("plottype"),
                "approvalStatus": raw.get("approvalstatus"),
                "plotdirection": raw.get("plotdirection"),
                "plotprice": raw.get("plotprice"),
                "plotstatus": raw.get("plotstatus"),
                "createdAt": raw.get("createdat"),
                "dataSource": raw.get("datasource"),
            }
        )

        row_errors = validate_training_row(plot, row_index=int(idx) + 2)
        if row_errors:
            errors.extend(row_errors)
            continue

        if mode == "production" and (
            plot.get("dataSource") == "synthetic" or is_synthetic_project(plot["projectid"])
        ):
            errors.append(
                f"Row {int(idx) + 2}: synthetic data not allowed in production mode"
            )
            continue

        plots.append(plot)

    if errors and not plots:
        raise ValueError(f"{path.name}: all rows invalid. {'; '.join(errors[:5])}")
    if errors:
        print(f"Warning: skipped {len(errors)} invalid row(s) in {path.name}")

    return plots


def load_plots_from_mongo() -> list[dict]:
    url = os.getenv("MONGODB_URL")
    if not url:
        raise RuntimeError("MONGODB_URL is required in analytics/.env for Mongo training")

    client = MongoClient(url)
    db = client.get_default_database()
    plots = []
    for p in db.plots.find({}):
        row = mongo_doc_to_training_row(dict(p))
        row["_source"] = "mongo"
        plots.append(row)
    client.close()
    return plots


def _dedupe_key(plot: dict) -> tuple | None:
    project_id = str(plot.get("projectid") or "").strip()
    plot_number = plot.get("plotnumber")
    if not project_id or plot_number is None or str(plot_number).strip() == "":
        return None
    return (project_id, str(plot_number))


def merge_training_plots(csv_plots: list, mongo_plots: list) -> list:
    """Mongo overrides CSV for the same projectid + plotnumber."""
    merged: dict[tuple, dict] = {}
    order: list[tuple] = []

    for p in csv_plots:
        key = _dedupe_key(p)
        slot = key if key else (id(p),)
        if slot not in merged:
            order.append(slot)
        merged[slot] = p

    for p in mongo_plots:
        key = _dedupe_key(p)
        slot = key if key else (id(p),)
        if slot not in merged:
            order.append(slot)
        merged[slot] = p

    return [merged[k] for k in order]


def load_training_plots(
    *,
    use_mongo: bool,
    csv_paths: list[Path] | None,
    use_seed_csv: bool,
    mode: str,
) -> tuple[list, dict]:
    stats: dict = {
        "trainingMode": mode,
        "csv_files": [],
        "csv_raw_rows": 0,
        "mongo_raw_rows": 0,
        "synthetic_rows_skipped": 0,
    }

    if mode == "production" and use_seed_csv:
        raise RuntimeError(
            "TRAINING_USE_SEED_CSV must be false in production. "
            "Use: python export_plots_csv.py && TRAINING_MODE=production python train.py"
        )

    paths = resolve_training_csv_paths(
        csv_paths, use_seed_csv=use_seed_csv, mode=mode
    )

    csv_plots: list = []
    for path in paths:
        if not path.is_file():
            continue
        batch = load_plots_from_csv(path, mode=mode)
        csv_plots.extend(batch)
        stats["csv_files"].append(str(path))
        stats["csv_raw_rows"] += len(batch)

    mongo_plots: list = []
    if use_mongo:
        try:
            mongo_plots = load_plots_from_mongo()
            stats["mongo_raw_rows"] = len(mongo_plots)
        except RuntimeError as err:
            if mode == "production" or not csv_plots:
                raise
            stats["mongo_skipped"] = str(err)

    merged = merge_training_plots(csv_plots, mongo_plots)
    stats["merged_rows"] = len(merged)
    stats["synthetic_rows"] = sum(
        1
        for p in merged
        if p.get("dataSource") == "synthetic" or is_synthetic_project(p.get("projectid", ""))
    )
    stats["real_rows"] = len(merged) - stats["synthetic_rows"]
    return merged, stats


def build_dataframe(plots: list) -> pd.DataFrame:
    rows = []
    for p in plots:
        size = float(p.get("plotsize") or 0)
        price = float(p.get("plotprice") or 0)
        road = float(p.get("roadWidthFt") or 0)
        if road <= 0:
            road = LEGACY_DEFAULT_ROAD_WIDTH_FT
        if size <= 0 or price <= 0:
            continue

        feats = row_to_features(
            {
                "plotsize": size,
                "roadWidthFt": road,
                "plotType": p.get("plotType"),
                "approvalStatus": p.get("approvalStatus"),
                "plotdirection": p.get("plotdirection"),
                "projectid": p.get("projectid"),
            }
        )
        feats["plotprice"] = price
        feats["plotstatus"] = normalize_plot_status(p.get("plotstatus")) or "Available"
        feats["plotnumber"] = p.get("plotnumber")
        feats["createdAt"] = p.get("createdAt")
        feats["dataSource"] = p.get("dataSource", "manual")
        feats["_source"] = p.get("_source", "unknown")
        rows.append(feats)

    return pd.DataFrame(rows)


def select_training_rows(df: pd.DataFrame, mode: str) -> tuple[pd.DataFrame, dict]:
    """Train on Sold plots only when enough sold labels exist."""
    sold = df[df["plotstatus"] == "Sold"]
    meta = {
        "total_usable": len(df),
        "sold_usable": len(sold),
        "available_usable": int((df["plotstatus"] == "Available").sum()),
        "reserved_usable": int((df["plotstatus"] == "Reserved").sum()),
    }

    if len(sold) >= MIN_SOLD_ROWS:
        train_df = sold
        meta["label_policy"] = "sold_only"
    else:
        train_df = df
        meta["label_policy"] = "all_statuses_fallback"
        meta["warning"] = (
            f"Fewer than {MIN_SOLD_ROWS} Sold plots; training used all statuses. "
            "Export more sold plots from Mongo for production-quality labels."
        )

    if mode == "production" and meta["label_policy"] != "sold_only":
        raise RuntimeError(
            f"Production training requires at least {MIN_SOLD_ROWS} Sold plots; "
            f"found {len(sold)}. Mark sold plots in Mongo or lower TRAINING_MIN_SOLD_ROWS."
        )

    return train_df, meta


def train_and_save(
    df: pd.DataFrame,
    source_stats: dict,
    label_meta: dict,
    mode: str,
) -> dict:
    if len(df) < MIN_TRAINING_ROWS:
        raise RuntimeError(
            f"Need at least {MIN_TRAINING_ROWS} training rows; found {len(df)}"
        )

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["plotprice"]

    pipeline = Pipeline(
        steps=[
            (
                "prep",
                ColumnTransformer(
                    transformers=[
                        ("num", "passthrough", NUMERIC_FEATURES),
                        (
                            "cat",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                            CATEGORICAL_FEATURES,
                        ),
                    ]
                ),
            ),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=120,
                    max_depth=12,
                    min_samples_leaf=2,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    if len(df) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        pipeline.fit(X_train, y_train)
        pred = pipeline.predict(X_test)
        mae = float(mean_absolute_error(y_test, pred))
        r2 = float(r2_score(y_test, pred))
    else:
        pipeline.fit(X, y)
        mae = None
        r2 = None

    csv_used = int((df["_source"] == "csv").sum())
    mongo_used = int((df["_source"] == "mongo").sum())
    real_used = int((df["dataSource"] != "synthetic").sum())
    synthetic_used = int((df["dataSource"] == "synthetic").sum())

    trained_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    artifact = {
        "pipeline": pipeline,
        "feature_columns": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "training_rows": len(df),
        "csv_training_rows": csv_used,
        "mongo_training_rows": mongo_used,
        "real_training_rows": real_used,
        "synthetic_training_rows": synthetic_used,
        "training_mode": mode,
        "trained_at": trained_at,
        "label_policy": label_meta.get("label_policy"),
        "training_sources": source_stats,
        "label_meta": label_meta,
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)

    return {
        "model_path": str(MODEL_PATH),
        "training_mode": mode,
        "trained_at": trained_at,
        "training_rows": len(df),
        "csv_training_rows": csv_used,
        "mongo_training_rows": mongo_used,
        "real_training_rows": real_used,
        "synthetic_training_rows": synthetic_used,
        "label_policy": label_meta.get("label_policy"),
        "sold_rows": label_meta.get("sold_usable"),
        "mae": mae,
        "r2": r2,
        "warning": label_meta.get("warning"),
        **source_stats,
    }


def run_training(
    *,
    use_mongo: bool = True,
    csv_paths: list[Path] | None = None,
    use_seed_csv: bool = True,
    mode: str = "development",
) -> dict:
    plots, stats = load_training_plots(
        use_mongo=use_mongo,
        csv_paths=csv_paths,
        use_seed_csv=use_seed_csv,
        mode=mode,
    )
    df = build_dataframe(plots)

    if len(df) < MIN_TRAINING_ROWS:
        hint = "Run: python export_plots_csv.py (production) or generate_seed_csv.py (dev only)"
        raise RuntimeError(
            f"Need at least {MIN_TRAINING_ROWS} usable plots; found {len(df)}. {hint}"
        )

    train_df, label_meta = select_training_rows(df, mode)
    metrics = train_and_save(train_df, stats, label_meta, mode)
    metrics["usable_rows"] = len(df)
    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train plot price model")
    parser.add_argument("--csv", action="append", default=[])
    parser.add_argument("--no-seed", action="store_true")
    parser.add_argument("--mongo-only", action="store_true")
    parser.add_argument("--no-mongo", action="store_true")
    parser.add_argument(
        "--production",
        action="store_true",
        help="Production rules: no synthetic seed, Sold labels required",
    )
    args = parser.parse_args()

    mode = resolve_training_mode(force_production=args.production)
    use_mongo = not args.no_mongo and _env_flag("TRAINING_USE_MONGO", True)

    if args.mongo_only:
        metrics = run_training(
            use_mongo=True, csv_paths=[], use_seed_csv=False, mode=mode
        )
    else:
        use_seed = (
            not args.no_seed
            and mode == "development"
            and _env_flag("TRAINING_USE_SEED_CSV", mode == "development")
        )
        csv_paths = [Path(p) for p in args.csv] if args.csv else None
        metrics = run_training(
            use_mongo=use_mongo,
            csv_paths=csv_paths,
            use_seed_csv=use_seed,
            mode=mode,
        )

    print("Training complete:", metrics)
    if metrics.get("warning"):
        print("WARNING:", metrics["warning"])


if __name__ == "__main__":
    main()
