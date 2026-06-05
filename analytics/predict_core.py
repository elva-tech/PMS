"""Load regression model and predict plot price."""

import os
from pathlib import Path

import joblib
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient

from features import row_to_features, NUMERIC_FEATURES, CATEGORICAL_FEATURES
from pricing_rules import (
    apply_business_rules,
    assess_current_price,
    baseline_price,
    build_reasoning,
    price_range,
    project_adjusted_price,
)

load_dotenv()

MODEL_PATH = Path(
    os.getenv("MODEL_PATH", Path(__file__).resolve().parent / "models" / "plot_price_model.joblib")
)


def load_artifact():
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run: python train.py"
        )
    return joblib.load(MODEL_PATH)


def fetch_comparables(project_id: str, limit: int = 200) -> list:
    url = os.getenv("MONGODB_URL")
    if not url:
        return []
    client = MongoClient(url)
    db = client.get_default_database()
    cursor = db.plots.find({"projectid": project_id}).sort("plotnumber", 1).limit(200)
    rows = []
    for p in cursor:
        size = float(p.get("plotsize") or 0)
        price = float(p.get("plotprice") or 0)
        if size <= 0 or price <= 0:
            continue
        rows.append(
            {
                "plotnumber": p.get("plotnumber"),
                "plotsize": size,
                "plotprice": price,
                "pricePerSqft": int(round(price / size)),
                "plotType": p.get("plotType") or "middle",
                "roadWidthFt": p.get("roadWidthFt"),
                "approvalStatus": p.get("approvalStatus") or "unapproved",
                "plotstatus": p.get("plotstatus"),
                "plotdirection": p.get("plotdirection"),
            }
        )
    client.close()
    return rows if limit <= 0 else rows[:limit]


def predict_price(project_id: str, payload: dict) -> dict:
    if not payload.get("plotdirection"):
        raise ValueError("plotdirection is required for price prediction")

    feats = row_to_features(
        {
            "plotsize": payload["plotsize"],
            "roadWidthFt": payload["roadWidthFt"],
            "plotType": payload.get("plotType"),
            "approvalStatus": payload.get("approvalStatus"),
            "plotdirection": payload.get("plotdirection"),
            "projectid": project_id,
        }
    )
    plotsize = float(feats["plotsize"])
    comparables = fetch_comparables(project_id, 0)
    project_plot_count = len(comparables)
    comparables = sorted(
        comparables,
        key=lambda c: abs(c["plotsize"] - plotsize),
    )

    project_anchor = project_adjusted_price(
        plotsize,
        comparables,
        feats["plotType"],
        feats["approvalStatus"],
        feats["plotdirection"],
    )

    training_rows = 0
    sold_rows = 0
    training_mode = None
    trained_at = None
    label_policy = None
    real_training_rows = 0
    synthetic_training_rows = 0
    model_name = "baseline_fallback"
    ml_price = 0

    try:
        artifact = load_artifact()
        pipeline = artifact["pipeline"]
        X = pd.DataFrame([{**feats}])[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
        ml_price = float(pipeline.predict(X)[0])
        training_rows = artifact.get("training_rows", 0)
        sold_rows = artifact.get("label_meta", {}).get("sold_usable") or artifact.get(
            "sold_rows", 0
        )
        training_mode = artifact.get("training_mode")
        trained_at = artifact.get("trained_at")
        label_policy = artifact.get("label_policy")
        real_training_rows = artifact.get("real_training_rows", 0)
        synthetic_training_rows = artifact.get("synthetic_training_rows", 0)
        model_name = "sklearn_random_forest_regression"
    except FileNotFoundError:
        ml_price = float(project_anchor or baseline_price(plotsize, comparables))
        if ml_price <= 0:
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH} and no comparable plots. Run: python train.py"
            )

    ml_price = max(0, int(round(ml_price)))
    if project_plot_count >= 2 and project_anchor > 0:
        weight = 0.85 if project_plot_count >= 4 else 0.65
        raw_price = int(round((1 - weight) * ml_price + weight * project_anchor))
        pricing_method = "project_comparables"
    else:
        raw_price = ml_price
        pricing_method = "global_model"

    suggested_price, rule_notes = apply_business_rules(raw_price, plotsize, comparables)
    suggested_price_per_sqft = (
        int(round(suggested_price / plotsize)) if plotsize > 0 else 0
    )

    if project_plot_count >= 5:
        confidence = "high"
    elif project_plot_count >= 2:
        confidence = "medium"
    else:
        confidence = "low"

    low_price, high_price = price_range(suggested_price, confidence)
    reasoning = build_reasoning(
        feats["plotType"],
        feats["approvalStatus"],
        feats["roadWidthFt"],
        comparables,
        feats["plotdirection"],
        plotsize,
    )

    current = payload.get("currentPrice")
    if current is not None:
        try:
            current = float(current)
        except (TypeError, ValueError):
            current = None

    return {
        "suggestedPrice": suggested_price,
        "suggestedPricePerSqft": suggested_price_per_sqft,
        "priceRange": {"low": low_price, "high": high_price},
        "currency": "INR",
        "confidence": confidence,
        "model": model_name,
        "trainingSource": pricing_method,
        "sampleSize": project_plot_count,
        "projectPlotCount": project_plot_count,
        "globalTrainingPlots": training_rows,
        "soldSampleSize": sold_rows,
        "trainingMode": training_mode,
        "trainedAt": trained_at,
        "labelPolicy": label_policy,
        "realTrainingRows": real_training_rows,
        "syntheticTrainingRows": synthetic_training_rows,
        "factors": {
            "plotsize": plotsize,
            "roadWidthFt": feats["roadWidthFt"],
            "plotType": feats["plotType"],
            "approvalStatus": feats["approvalStatus"],
            "plotdirection": feats["plotdirection"],
        },
        "reasoning": reasoning,
        "businessRuleNotes": rule_notes,
        "priceAssessment": assess_current_price(current, suggested_price, low_price, high_price),
        "comparables": comparables[:5],
    }
