"""
Admin Assistant — LLM service (Gemini only).

This service does NOT touch MongoDB. Node Express runs tools and calls this
service for each Gemini turn.

  uvicorn app:app --host 0.0.0.0 --port 8002

Endpoints:
  GET  /health
  POST /v1/complete   — one Gemini turn (text or tool_calls)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import GEMINI_API_KEY, GEMINI_MODEL
from gemini_client import complete_turn
from prompts import build_system_prompt
from schemas import CompleteRequest, CompleteResponse

app = FastAPI(title="PMS Admin Assistant (LLM)", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": GEMINI_MODEL,
        "gemini_configured": bool(GEMINI_API_KEY),
        "note": "LLM layer only — tools run in Node backend",
    }


@app.post("/v1/complete", response_model=CompleteResponse)
def complete(body: CompleteRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured in admin_assistant/.env",
        )

    system = body.system or build_system_prompt(
        project_id=body.projectId,
        project_name=body.projectName,
    )

    try:
        result = complete_turn(
            system=system,
            messages=[m.model_dump(exclude_none=True) for m in body.messages],
            tools=[t.model_dump() for t in body.tools],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if result["type"] == "message":
        return CompleteResponse(
            type="message",
            content=result["content"],
            model=result.get("model"),
        )

    return CompleteResponse(
        type="tool_calls",
        calls=result["calls"],
        model=result.get("model"),
    )
