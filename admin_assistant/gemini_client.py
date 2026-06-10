"""
One Gemini API turn: either a final text reply OR tool calls.

Node runs the tool loop; this file only talks to Google.
"""

from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types

import time

from config import (
    GEMINI_API_KEY,
    GEMINI_FALLBACK_MODEL,
    GEMINI_MODEL,
    MAX_OUTPUT_TOKENS,
)


def _client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set in admin_assistant/.env")
    return genai.Client(api_key=GEMINI_API_KEY)


def _to_function_declarations(tool_defs: list[dict]) -> list[types.FunctionDeclaration]:
    decls: list[types.FunctionDeclaration] = []
    for t in tool_defs:
        decls.append(
            types.FunctionDeclaration(
                name=t["name"],
                description=t.get("description", ""),
                parameters=t.get("parameters") or {"type": "object", "properties": {}},
            )
        )
    return decls


def _contents_from_messages(messages: list[dict]) -> list[types.Content]:
    """Map our simple message list to Gemini Content objects."""
    contents: list[types.Content] = []

    for msg in messages:
        role = msg.get("role")
        if role == "user" and msg.get("content"):
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=str(msg["content"]))],
                )
            )
        elif role == "assistant" and msg.get("toolCalls"):
            parts: list[types.Part] = []
            for call in msg["toolCalls"]:
                parts.append(
                    types.Part.from_function_call(
                        name=call["name"],
                        args=call.get("args") or {},
                    )
                )
            if parts:
                contents.append(types.Content(role="model", parts=parts))
        elif role == "tool" and msg.get("toolResults"):
            parts = []
            for tr in msg["toolResults"]:
                parts.append(
                    types.Part.from_function_response(
                        name=tr["name"],
                        response={"result": tr.get("result")},
                    )
                )
            if parts:
                contents.append(types.Content(role="user", parts=parts))

    return contents


def complete_turn(
    *,
    system: str,
    messages: list[dict],
    tools: list[dict],
) -> dict[str, Any]:
    """
    Returns:
      { "type": "message", "content": "..." }
      or
      { "type": "tool_calls", "calls": [{ "name", "args" }] }
    """
    client = _client()
    declarations = _to_function_declarations(tools)
    gemini_tools = [types.Tool(function_declarations=declarations)] if declarations else None

    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.2,
        max_output_tokens=MAX_OUTPUT_TOKENS,
        tools=gemini_tools,
    )

    models_to_try = [GEMINI_MODEL]
    if GEMINI_FALLBACK_MODEL and GEMINI_FALLBACK_MODEL not in models_to_try:
        models_to_try.append(GEMINI_FALLBACK_MODEL)

    last_err: Exception | None = None
    response = None
    successful_model = GEMINI_MODEL
    for model_name in models_to_try:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=_contents_from_messages(messages),
                    config=config,
                )
                successful_model = model_name
                last_err = None
                break
            except Exception as exc:
                last_err = exc
                msg = str(exc).lower()
                retryable = "503" in msg or "unavailable" in msg or "high demand" in msg
                if retryable and attempt < 2:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                break
        if response is not None:
            break

    if response is None:
        raise last_err or RuntimeError("Gemini request failed")

    if not response.candidates:
        raise RuntimeError("Gemini returned no candidates")

    candidate = response.candidates[0]
    parts = candidate.content.parts if candidate.content else []

    tool_calls: list[dict] = []
    text_chunks: list[str] = []

    for part in parts:
        if part.text:
            text_chunks.append(part.text)
        fc = part.function_call
        if fc and fc.name:
            args = dict(fc.args) if fc.args else {}
            tool_calls.append({"name": fc.name, "args": args})

    if tool_calls:
        return {"type": "tool_calls", "calls": tool_calls, "model": successful_model}

    content = "".join(text_chunks).strip()
    if not content:
        raise RuntimeError("Gemini returned empty response")

    return {"type": "message", "content": content, "model": successful_model}
