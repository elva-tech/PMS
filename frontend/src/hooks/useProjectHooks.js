import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/projects");
      return res?.data?.data;
    },
  });
};

export const useProject = (id) => {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/projects/${id}`);
      return res?.data?.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProject) => {
      const headers =
        newProject instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : { "Content-Type": "application/json" };
      return axiosInstance.post("/api/v1/projects", newProject, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const projectId = id || data?._id;
      if (!projectId) {
        throw new Error("No project ID provided for update");
      }

      try {
        const headers =
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : { "Content-Type": "application/json" };
        const response = await axiosInstance.put(
          `/api/v1/projects/${projectId}`,
          data,
          { headers }
        );
        return response.data;
      } catch (error) {
        console.error("Error in update API call:", error);
        console.error("Error response:", error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      console.error("Error updating project:", error);
      console.error("Error details:", error.response?.data);
      alert(
        "Failed to update project: " +
          (error.response?.data?.message || error.message)
      );
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => {
      return axiosInstance.delete(`/api/v1/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
    },
  });
};
