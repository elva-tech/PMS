"""Environment config for the Admin Assistant LLM service."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
GEMINI_MODEL = (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash").strip()
GEMINI_FALLBACK_MODEL = (
    os.getenv("GEMINI_FALLBACK_MODEL") or "gemini-2.5-flash-lite"
).strip()
PORT = int(os.getenv("PORT") or "8002")
MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS") or "1024")
