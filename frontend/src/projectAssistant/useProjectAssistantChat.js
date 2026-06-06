import { useCallback, useEffect, useState } from "react";
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

export const useProjectAssistantChat = (projectId) => {
  const [messages, setMessages] = useState(() => readStoredMessages(projectId));
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMessages(readStoredMessages(projectId));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    sessionStorage.setItem(storageKey(projectId), JSON.stringify(messages));
  }, [messages, projectId]);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, { id: makeId(), timestamp: Date.now(), ...message }]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    if (projectId) sessionStorage.removeItem(storageKey(projectId));
  }, [projectId]);

  const simulateReply = useCallback(
    async (replyFactory) => {
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 650 + Math.random() * 350));
      const reply = replyFactory();
      appendMessage({
        role: "assistant",
        content: reply.message,
        suggestions: reply.suggestions || [],
        relatedLinks: reply.relatedLinks || [],
        meta: { type: reply.type, confidence: reply.confidence },
      });
      setIsTyping(false);
    },
    [appendMessage]
  );

  const sendUserMessage = useCallback(
    (text, replyFactory) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      appendMessage({ role: "user", content: trimmed });
      simulateReply(replyFactory);
    },
    [appendMessage, simulateReply]
  );

  return {
    messages,
    isTyping,
    sendUserMessage,
    clearChat,
  };
};
