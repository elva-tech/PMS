"""Request/response models for the FastAPI service."""

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "tool"]
    content: Optional[str] = None
    toolCalls: Optional[list[dict[str, Any]]] = None
    toolResults: Optional[list[dict[str, Any]]] = None


class ToolDefinition(BaseModel):
    name: str
    description: str = ""
    parameters: dict[str, Any] = Field(default_factory=dict)


class CompleteRequest(BaseModel):
    projectId: str
    projectName: str = ""
    system: Optional[str] = None
    messages: list[ChatMessage] = Field(default_factory=list)
    tools: list[ToolDefinition] = Field(default_factory=list)


class CompleteResponse(BaseModel):
    type: Literal["message", "tool_calls"]
    content: Optional[str] = None
    calls: Optional[list[dict[str, Any]]] = None
    model: Optional[str] = None
    provider: str = "gemini"
