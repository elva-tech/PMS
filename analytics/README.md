# PMS AI Analytics (Python)

Plot **price prediction** — regression in Python, proxied by Node.

## TL summary (production vs dev)

| | **Development** | **Production** |
|--|-----------------|----------------|
| **Purpose** | Bootstrap when few real plots | Real sold plots only |
| **Data** | Mongo + optional `plots_training_seed.csv` (synthetic) | Mongo + `export_plots_csv.py` output |
| **Env** | `TRAINING_MODE=development` | `TRAINING_MODE=production`, `TRAINING_USE_SEED_CSV=false` |
| **Labels** | Prefers **Sold** rows; fallback if &lt;5 sold | **Requires ≥5 Sold** plots |
| **Predict** | Same API — uses saved `.joblib` + Mongo comparables | Same |

**Synthetic seed is not production data.** IDs are `seed_proj_*`, prices are rule-generated. Use only for local dev until enough real plots exist.

## Layout

```
analytics/
  training_schema.py     # CSV schema + validation (matches plot.model.js)
  export_plots_csv.py    # Mongo → production CSV
  generate_seed_csv.py   # DEV-ONLY synthetic CSV
  train.py               # Train + save model
  predict_core.py        # Load model + predict
  app.py                 # FastAPI /predict, /train
  data/
    plots_training_seed.csv      # synthetic (dev)
    plots_production_export.csv  # generated from Mongo (gitignored)
```

## Setup

```powershell
cd analytics
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Training commands

**Production (explain this to TL):**

```powershell
python export_plots_csv.py
# .env: TRAINING_MODE=production, TRAINING_USE_SEED_CSV=false
python train.py --production
uvicorn app:app --reload --port 8000
```

**Development (local bootstrap):**

```powershell
python generate_seed_csv.py
python train.py
uvicorn app:app --reload --port 8000
```

**Mongo only:**

```powershell
python train.py --mongo-only --production
```

## CSV schema (aligned with Mongo)

Required: `projectid`, `plotnumber`, `plotsize`, `roadWidthFt`, `plotType`, `approvalStatus`, `plotdirection`, `plotprice`, `plotstatus`

Optional: `createdAt` (ISO UTC), `dataSource` (`mongodb_export` | `synthetic` | `manual`)

`plotstatus`: **Available** | **Sold** | **Reserved**

Training uses **Sold** rows as price labels when ≥5 exist. Available/Reserved are kept in CSV but not used as labels.

## Node backend

```
AI_ANALYTICS_URL=http://127.0.0.1:8000
```

`GET /api/v1/plots/:projectId/ai/price-estimate` → Python `POST /predict`

See `data/README.md` for file-level details.
