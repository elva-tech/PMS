"""
Dead Plot Detection API (PRD-aligned).

  uvicorn app:app --reload --port 8001

Endpoints:
  POST /dead-plot/analyze       — single plot
  POST /dead-plot/batch         — list of plots
  POST /dead-plot/analyze-csv   — analyze rows from server CSV path
  POST /dead-plot/train         — retrain classifier
  GET  /health
"""

from pathlib import Path
from typing import Literal, Optional, Union

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import DEFAULT_TRAINING_CSV, RULES_VERSION
from predict_core import (
    MODEL_PATH,
    analyze_batch,
    analyze_csv,
    analyze_plot,
    analyze_project,
    is_listed_inventory,
    summarize_results,
)
from train import train_and_save

app = FastAPI(title="Dead Plot Detection", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PlotInput(BaseModel):
    plot_id: str = Field(min_length=1)
    layout: str = Field(min_length=1)
    plot_area: float = Field(gt=0)
    plot_type: Literal["corner", "normal", "end", "middle"] = "normal"
    road_facing: Union[bool, str] = False
    price: float = Field(gt=0)
    status: Literal["Available", "Sold", "Reserved"] = "Available"
    listed_date: str = Field(min_length=8, description="ISO date or YYYY-MM-DD")
    interested_buyers: int = Field(ge=0, description="Count from interested-buyers / contacts")
    last_interaction_date: Optional[str] = None
    nearby_sold_count: int = Field(default=0, ge=0)
    layout_median_price_per_sqft: Optional[float] = Field(default=None, gt=0)


class BatchRequest(BaseModel):
    plots: list[PlotInput] = Field(min_length=1)


class CsvAnalyzeRequest(BaseModel):
    csv_path: str = Field(
        default=DEFAULT_TRAINING_CSV,
        description="Path on server to CSV file",
    )
    plot_id: Optional[str] = Field(
        default=None,
        description="If set, analyze only this plot_id from the CSV",
    )
    include_sold: bool = Field(
        default=False,
        description="Include Sold plots in batch (default: inventory only)",
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "dead_plot_detection",
        "model_loaded": MODEL_PATH.is_file(),
        "rules_version": RULES_VERSION,
    }


@app.post("/dead-plot/analyze")
def analyze_one(body: PlotInput):
    try:
        result = analyze_plot(body.model_dump())
        return {"status": "success", "data": result}
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/dead-plot/batch")
def analyze_many(body: BatchRequest):
    try:
        results = analyze_batch([p.model_dump() for p in body.plots])
        inventory = [r for r in results if is_listed_inventory(r.get("status", ""))]
        summary = summarize_results(inventory)
        return {
            "status": "success",
            "data": {
                "summary": summary,
                "plots": inventory,
            },
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/dead-plot/analyze-csv")
def analyze_from_csv(body: CsvAnalyzeRequest):
    path = Path(body.csv_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"CSV not found: {path}")
    try:
        if body.plot_id:
            results = analyze_csv(
                path, plot_id=body.plot_id, inventory_only=False
            )
            return {"status": "success", "data": {"plot": results[0]}}

        from predict_core import load_csv_records

        sold_count = sum(
            1
            for r in load_csv_records(path)
            if str(r.get("status", "")).strip() == "Sold"
        )
        results = analyze_csv(path, inventory_only=not body.include_sold)
        summary = summarize_results(results, include_sold_skipped=sold_count)
        return {
            "status": "success",
            "data": {
                "csvPath": str(path),
                "summary": summary,
                "deadPlots": [r for r in results if r["classification"] == "Dead"][:50],
                "slowPlots": [r for r in results if r["classification"] == "Slow"][:30],
            },
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@app.get("/dead-plot/project/{project_id}")
def analyze_project_plots(
    project_id: str,
    classification: Optional[Literal["Dead", "Slow", "Active"]] = None,
    plot_id: Optional[str] = None,
    plot_number: Optional[int] = None,
):
    try:
        data = analyze_project(
            project_id,
            classification=classification,
            plot_id=plot_id,
            plot_number=plot_number,
        )
        return {"status": "success", "data": data}
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@app.post("/dead-plot/train")
def train():
    try:
        metrics = train_and_save()
        return {"status": "success", "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
