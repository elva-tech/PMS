"""
FastAPI service for plot price regression (Python ML — not Node, not LLM).

  uvicorn app:app --reload --port 8000

Endpoints:
  POST /predict   — price estimate for one plot
  POST /train     — retrain model (CSV seed + MongoDB)
  GET  /health
"""

from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from predict_core import predict_price, MODEL_PATH
from train import run_training

app = FastAPI(title="PMS Plot Price AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    projectId: str
    plotsize: float = Field(gt=0)
    plotType: Literal[
        "corner", "end", "middle", "park-facing", "road-facing", "cul-de-sac"
    ]
    roadWidthFt: float = Field(gt=0, le=200)
    approvalStatus: Literal["dtcp", "bda", "panchayat", "unapproved", "other"]
    plotdirection: str = Field(min_length=1)
    currentPrice: Optional[float] = Field(default=None, ge=0)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "sklearn_random_forest_regression",
        "model_loaded": MODEL_PATH.is_file(),
        "note": "Numeric regression — not an LLM",
    }


@app.post("/predict")
def predict(body: PredictRequest):
    try:
        estimate = predict_price(
            body.projectId,
            {
                "plotsize": body.plotsize,
                "plotType": body.plotType,
                "roadWidthFt": body.roadWidthFt,
                "approvalStatus": body.approvalStatus,
                "plotdirection": body.plotdirection,
                "currentPrice": body.currentPrice,
            },
        )
        return {"status": "success", "data": {"estimate": estimate}}
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/train")
def train():
    try:
        metrics = run_training()
        return {"status": "success", "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
