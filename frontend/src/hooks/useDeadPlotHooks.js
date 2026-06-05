import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

export const usePlotHealthAi = (projectId, { classification, plotId, plotNumber } = {}) => {
  return useQuery({
    queryKey: ["plot-health-ai", projectId, classification, plotId, plotNumber],
    queryFn: async () => {
      const params = {};
      if (classification) params.classification = classification;
      if (plotId) params.plotId = plotId;
      if (plotNumber != null && plotNumber !== "") params.plotNumber = plotNumber;

      const res = await axiosInstance.get(
        `/api/v1/plots/${projectId}/ai/plot-health`,
        { params }
      );
      return res?.data?.data;
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });
};
