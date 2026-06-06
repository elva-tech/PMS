import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

const DEFAULT_CONFIG = {
  name: "Project Assistant",
  tagline: "AI assistant for your project",
  poweredBy: "Powered by AI",
  fabLabel: "Ask AI",
};

export const useAssistantConfig = () => {
  return useQuery({
    queryKey: ["assistant-config"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/assistant/config");
      return { ...DEFAULT_CONFIG, ...(res?.data?.data || {}) };
    },
    staleTime: 5 * 60_000,
    retry: 1,
    placeholderData: DEFAULT_CONFIG,
  });
};
