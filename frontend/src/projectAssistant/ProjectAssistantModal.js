import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Bot, Send, Trash2, X } from "lucide-react";
import { PRESET_QUESTIONS } from "./constants";
import { useProjectAssistantChat } from "./useProjectAssistantChat";
import { useAssistantConfig } from "./useAssistantConfig";
import AssistantMessage from "./AssistantMessage";

export default function ProjectAssistantModal({ projectId, projectName, onClose }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { data: brand } = useAssistantConfig();

  const { messages, isTyping, sendUserMessage, clearChat } =
    useProjectAssistantChat(projectId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleSend = (text) => {
    const value = (text ?? input).trim();
    if (!value || isTyping) return;
    if (text == null) setInput("");
    sendUserMessage(value);
  };

  const showWelcome = messages.length === 0;
  const assistantName = brand?.name || "Project Assistant";

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close assistant"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md h-[92vh] sm:h-[640px] max-w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
        role="dialog"
        aria-modal="true"
        aria-label={assistantName}
      >
        <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-violet-700 text-white px-4 py-3.5 shrink-0 min-w-0">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-base truncate">{assistantName}</h2>
                <p className="text-xs text-blue-100 truncate">
                  {projectName || "This project"} · {brand?.tagline}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-white/10 text-blue-100"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-blue-200/90 mt-2 uppercase tracking-wider truncate">
            {brand?.poweredBy}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 bg-gradient-to-b from-slate-50 to-white min-w-0">
          {showWelcome ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-700 break-words">
              <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                <Bot className="w-4 h-4 shrink-0" />
                Ask anything about this project
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Plots, revenue, payments, buyers, and plot health — powered by Gemini.
              </p>
            </div>
          ) : null}

          {messages.map((msg) => (
            <AssistantMessage
              key={msg.id}
              message={msg}
              onSuggestionClick={handleSend}
            />
          ))}

          {isTyping ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 pl-10">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:240ms]" />
              </span>
              Thinking…
            </div>
          ) : null}

          {showWelcome ? (
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Suggested questions
              </p>
              <div className="flex flex-col gap-2">
                {PRESET_QUESTIONS.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    disabled={isTyping}
                    onClick={() => handleSend(q.label)}
                    className="text-left text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 disabled:opacity-50 transition break-words"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-gray-100 p-3 bg-white min-w-0">
          <form
            className="flex gap-2 min-w-0"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about revenue, plots, buyers…"
              disabled={isTyping}
              className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="shrink-0 w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-2 text-center truncate">
            Admin only · Scoped to this project ·{" "}
            <Link
              to={`/project/${projectId}/plot-health`}
              className="text-blue-600 hover:underline"
            >
              Plot Health AI
            </Link>
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
