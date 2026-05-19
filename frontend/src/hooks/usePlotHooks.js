import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

export const usePlots = (
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc"
) => {
  return useQuery({
    queryKey: ["plots", page, limit, sortBy, sortOrder],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/plots", {
        params: { page, limit, sortBy, sortOrder },
      });
      return res?.data;
    },
  });
};

export const usePlot = (
  projectId,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc"
) => {
  return useQuery({
    queryKey: ["plots", projectId, page, limit, sortBy, sortOrder],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/plots/${projectId}`, {
        params: { page, limit, sortBy, sortOrder },
      });
      return res?.data;
    },
    enabled: !!projectId,
  });
};

export const useCreatePlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, plotData }) => {
      return axiosInstance.post(`/api/v1/plots/${projectId}`, plotData);
    },
    onSuccess: (_, variables) => {
      // Invalidate all plot queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      // Specifically invalidate queries for this project
      queryClient.invalidateQueries({
        queryKey: ["plots", variables.projectId],
      });
    },
    onError: (error) => {
      console.error("Error creating plot:", error);
      console.error("Error response:", error.response?.data);
    },
  });
};

export const useDeletePlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, plotId }) => {
      return axiosInstance.delete(`/api/v1/plots/${projectId}/${plotId}`);
    },
    onSuccess: (_, variables) => {
      // Invalidate all plot queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      // Specifically invalidate queries for this project
      queryClient.invalidateQueries({
        queryKey: ["plots", variables.projectId],
      });
    },
    onError: (error) => {
      console.log("Error deleting plot:", error);
    },
  });
};

export const useUpdatePlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, plotId, plotData }) => {
      if (!projectId) {
        throw new Error("No Project ID provided for update");
      }
      if (!plotId) {
        throw new Error("No Plot ID provide for update");
      }

      try {
        const response = await axiosInstance.put(
          `/api/v1/plots/${projectId}/${plotId}`,
          plotData
        );
        return response.data;
      } catch (error) {
        console.error("Error in update API call:", error);
        console.error("Error response:", error.response?.data);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate all plot queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      // Specifically invalidate queries for this project
      queryClient.invalidateQueries({
        queryKey: ["plots", variables.projectId],
      });
    },
  });
};
