import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { storageKey } from "./constants";

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const readStoredMessages = (projectId) => {
  if (!projectId) return [];
  try {
    const raw = sessionStorage.getItem(storageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Chat state lives in the browser (sessionStorage).
 * Each user message is sent to POST /api/v1/assistant/chat — the agent runs on the server.
 */
export const useProjectAssistantChat = (projectId) => {
  const [messages, setMessages] = useState(() => readStoredMessages(projectId));
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMessages(readStoredMessages(projectId));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    sessionStorage.setItem(storageKey(projectId), JSON.stringify(messages));
  }, [messages, projectId]);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      { id: makeId(), timestamp: Date.now(), ...message },
    ]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    if (projectId) sessionStorage.removeItem(storageKey(projectId));
  }, [projectId]);

  const sendUserMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || !projectId) return;

      appendMessage({ role: "user", content: trimmed });
      setIsTyping(true);
      setError(null);

      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await axiosInstance.post(
          "/api/v1/assistant/chat",
          { projectId, message: trimmed, history },
          { timeout: 65000 }
        );

        const data = res?.data?.data || {};
        appendMessage({
          role: "assistant",
          content: data.message || "I could not generate a reply.",
          suggestions: data.suggestions || [],
          relatedLinks: data.relatedLinks || [],
          meta: { toolsUsed: data.toolsUsed, ...data.meta },
        });
      } catch (err) {
        const detail = err?.response?.data?.detail;
        const msg =
          err?.response?.data?.message ||
          (typeof detail === "string" ? detail : null) ||
          (err?.code === "ECONNABORTED" ? "Request timed out — try a shorter question." : null) ||
          "Assistant unavailable. Start: cd admin_assistant && uvicorn app:app --port 8002";
        setError(msg);
        appendMessage({
          role: "assistant",
          content: `**Sorry** — ${msg}`,
          suggestions: [
            "Summarize available inventory",
            "What is the total revenue of this project?",
          ],
        });
      } finally {
        setIsTyping(false);
      }
    },
    [appendMessage, messages, projectId]
  );

  return {
    messages,
    isTyping,
    error,
    sendUserMessage,
    clearChat,
  };
};
