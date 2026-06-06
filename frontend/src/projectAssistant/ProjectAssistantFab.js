import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Bot } from "lucide-react";
import ProjectAssistantModal from "./ProjectAssistantModal";
import { useAssistantConfig } from "./useAssistantConfig";

export default function ProjectAssistantFab({ projectId, projectName }) {
  const [open, setOpen] = useState(false);
  const { data: brand } = useAssistantConfig();

  if (!projectId) return null;

  const fab = (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 sm:bottom-20 sm:right-8 z-[9999] flex flex-col items-end gap-2 pointer-events-auto"
        aria-label={`Open ${brand?.name || "Project Assistant"}`}
      >
        <span className="px-3 py-1.5 rounded-full bg-white text-gray-900 text-xs font-semibold shadow-lg border-2 border-violet-200">
          {brand?.fabLabel || "Ask AI"}
        </span>
        <span className="relative flex items-center justify-center w-[4.25rem] h-[4.25rem] rounded-full bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-[0_8px_30px_rgba(79,70,229,0.55)] ring-4 ring-white hover:scale-105 active:scale-95 transition-transform">
          <span className="absolute -inset-1 rounded-full bg-violet-400/40 animate-pulse" />
          <Bot className="w-8 h-8 relative drop-shadow-sm" strokeWidth={2.25} />
        </span>
      </button>

      {open ? (
        <ProjectAssistantModal
          projectId={projectId}
          projectName={projectName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );

  return createPortal(fab, document.body);
}
