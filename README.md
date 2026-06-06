# PMS
Plot Management Software


Commands to run analytics and dead plot detection are below


Setup (once each)
Analytics (analytics/)	Dead plot (dead_plot_detection/)
cd analytics	cd dead_plot_detection
python -m venv .venv	python -m venv .venv
.\.venv\Scripts\activate	.\.venv\Scripts\activate
pip install -r requirements.txt	pip install -r requirements.txt
copy .env.example .env	copy .env.example .env



Train (CSV only — no Mongo)
Analytics — price model	Dead plot — classifier
python generate_seed_csv.py — create price seed CSV	python generate_seed_csv.py — create dead-plot CSV
python train.py --no-mongo — train from seed CSV only	python train.py — train from data/dead_plot_training.csv
(no Mongo needed)	(CSV only by design)




Train (Mongo + CSV)
Analytics	Dead plot
Set MONGODB_URL in analytics/.env	Set MONGODB_URL in dead_plot_detection/.env
python train.py — seed CSV + Mongo merged	python train.py — seed CSV + Mongo merged
python train.py --mongo-only — Mongo only	python train.py --no-mongo — CSV only
python export_plots_csv.py — export real plots to CSV	—
python train.py --production — real data, no seed	—




Run API server
Analytics — port 8000	Dead plot — port 8001
uvicorn app:app --reload --port 8000	uvicorn app:app --reload --port 8001
Price AI for create-plot button	Plot Health AI dashboard (sidebar → Plot Health AI)
Check: http://127.0.0.1:8000/health	Check: http://127.0.0.1:8001/health




Dead plot — CLI (JSON)
Command	What you get
python cli.py train	Retrain model; prints training metrics JSON
python cli.py analyze-csv	Summary only: dead/slow/active counts + IDs (sold skipped)
python cli.py analyze-csv --classification Dead	Only Dead plots JSON list
python cli.py analyze-csv --classification Slow	Only Slow plots
python cli.py analyze-csv --classification Active	Only Active plots
python cli.py analyze-csv --plot-id SYN-Layout_C-0001	One Dead plot — full JSON + reasons + actions
python cli.py analyze-csv --plot-id SYN-Layout_C-0263	One Active plot — full JSON
python cli.py analyze-csv --full	All inventory plots JSON (big file)
python cli.py analyze-csv --include-sold	Include Sold rows in batch
python cli.py analyze --json "{...}"	One plot from manual JSON (no CSV)



Analytics — CLI (no separate CLI; use train + API)
Command	What you get
python train.py --no-mongo	Train price model from CSV only
python train.py	Train CSV + Mongo
uvicorn app:app --port 8000	Start price predict API
POST http://127.0.0.1:8000/train	Retrain via HTTP
POST http://127.0.0.1:8000/predict	Price estimate (needs running server)
(Price AI is used from the React app → backend :5000 → analytics :8000.)


Backend + frontend (both features)
Step	Command
Backend	cd backend → npm run dev (:5000)
Frontend	cd frontend → npm start
Price AI env	AI_ANALYTICS_URL=https://pms-price-ai.onrender.com (backend/.env + Render pms-api)
Dead plot env	DEAD_PLOT_AI_URL=http://127.0.0.1:8001 in backend/.env
UI	Project sidebar → Plot Health AI (/project/:id/plot-health)


demo — copy/paste -- this is enough to run main things
Dead plot	Analytics price
python cli.py analyze-csv --plot-id SYN-Layout_C-0001	Start uvicorn on 8000 + backend + click AI suggest on plot
python cli.py analyze-csv --plot-id SYN-Layout_C-0263	
python cli.py analyze-csv	python train.py --no-mongo then train if model missing
