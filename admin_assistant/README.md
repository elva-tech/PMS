# Admin Assistant (LLM service)

Gemini-only microservice. **Does not read MongoDB** — Node Express runs tools and calls this service for each LLM turn.

## Architecture (learn this)

```
React chat  →  Node POST /api/v1/assistant/chat  →  admin_assistant POST /v1/complete  →  Gemini
                      ↑                                      |
                      └──────── tool results (Mongo) ────────┘
```

| File | Purpose |
|------|---------|
| `app.py` | FastAPI routes (`/health`, `/v1/complete`) |
| `gemini_client.py` | One Gemini API call per turn |
| `prompts.py` | System instructions (scope, style) |
| `schemas.py` | Request/response shapes |
| `config.py` | `GEMINI_API_KEY`, model name |

## Local run

```powershell
cd admin_assistant
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
# copy .env.example → .env and set GEMINI_API_KEY
uvicorn app:app --host 0.0.0.0 --port 8002
```

Backend `.env`:

```
ADMIN_ASSISTANT_URL=http://127.0.0.1:8002
```

## Render

- Root directory: `admin_assistant`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Env: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash`

Set `ADMIN_ASSISTANT_URL` on the Node `pms-api` service.

## Health check

`GET http://127.0.0.1:8002/health`
