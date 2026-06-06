import React from "react";
import { Link } from "react-router-dom";
import { Bot, User } from "lucide-react";

const renderInline = (text) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export default function AssistantMessage({ message, onSuggestionClick }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 min-w-0 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-600 text-white" : "bg-violet-100 text-violet-700"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={`min-w-0 max-w-[85%] space-y-2 overflow-hidden ${
          isUser ? "items-end flex flex-col" : ""
        }`}
      >
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-gray-50 text-gray-700 border border-gray-100 rounded-tl-sm"
          }`}
        >
          {isUser ? message.content : renderInline(message.content)}
        </div>

        {!isUser && message.relatedLinks?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-w-full">
            {message.relatedLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}

        {!isUser && message.suggestions?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-w-full">
            {message.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestionClick(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-700"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
