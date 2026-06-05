# Dead Plot Detection

Standalone service (PRD-aligned). **Not linked to PMS Mongo yet** — CSV only for training/analysis.

## PRD mapping

| PRD | Implementation |
|-----|----------------|
| Time + demand + conversion | `rules.py` — days unsold, `interested_buyers`, conversion flag |
| Active / Slow / Dead | Rule engine + Random Forest classifier |
| Root causes | `reasons[]` in API |
| Actionable suggestions | `suggestedActions[]` (reduce price, retarget buyers, …) |
| Phase 3 ML | `train.py` — Random Forest classifier |

**`interested_buyers`** = count from PMS **Interested Buyers / contacts** (future: `COUNT(contacts per plot)`).

## Setup

```powershell
cd dead_plot_detection
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python generate_seed_csv.py
python train.py
```

## API (port 8001 — separate from price AI on 8000)

```powershell
uvicorn app:app --reload --port 8001
```

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Service status |
| POST | `/dead-plot/analyze` | One plot |
| POST | `/dead-plot/batch` | Many plots |
| POST | `/dead-plot/analyze-csv` | Analyze server CSV |
| POST | `/dead-plot/train` | Retrain |

## Check one plot (TL demo)

```powershell
cd dead_plot_detection
python cli.py analyze-csv --plot-id SYN-Layout_C-0001
```

One JSON object: classification, reasons, suggestedActions.

**Not dead example** (pick an Active row from CSV):
```powershell
python cli.py analyze-csv --plot-id SYN-Layout_A-0010
```

## Batch (inventory only — Sold skipped)

```powershell
python cli.py analyze-csv
python cli.py analyze-csv --classification Dead
```

## Terminal (manual JSON — no CSV)

```powershell
python cli.py analyze --json "{\"plot_id\":\"P1\",\"layout\":\"Layout_A\",\"plot_area\":1200,\"plot_type\":\"corner\",\"road_facing\":true,\"price\":6000000,\"status\":\"Available\",\"listed_date\":\"2025-01-01\",\"interested_buyers\":0}"
```

## CSV schema

Required: `plot_id`, `layout`, `plot_area`, `plot_type`, `road_facing`, `price`, `status`, `listed_date`, `interested_buyers`

Optional: `last_interaction_date`, `nearby_sold_count`, `layout_median_price_per_sqft`, `dead_label`

## Future PMS integration

1. Export/query plots + contact counts from Mongo  
2. Node proxy → `http://localhost:8001/dead-plot/analyze`  
3. Admin dashboard shows `classification`, `reasons`, `suggestedActions`
