import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

export const useDocuments = (projectId, params = {}, queryOptions = {}) => {
  const {
    page = 1,
    limit = 10,
    filterUserId,
    search,
    searchBy = "document",
    sortBy = "createdAt",
    sortOrder = "desc",
    /** Include in queryKey so lists refresh per logged-in user (fixes stale cache for end users). */
    viewerScope = "",
  } = params;

  return useQuery({
    queryKey: [
      "documents",
      projectId,
      viewerScope,
      page,
      limit,
      filterUserId || "",
      search || "",
      searchBy,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/documents/${projectId}`, {
        params: {
          page,
          limit,
          filterUserId: filterUserId || undefined,
          search: search || undefined,
          searchBy,
          sortBy,
          sortOrder,
        },
      });
      return res?.data;
    },
    enabled: !!projectId,
    ...queryOptions,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, formData }) => {
      return axiosInstance.post(`/api/v1/documents/${projectId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", variables.projectId],
      });
    },
  });
};

export const useBulkAssignDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId, documentIds }) => {
      return axiosInstance.patch(
        `/api/v1/documents/${projectId}/bulk-assign`,
        { userId, documentIds }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", variables.projectId],
      });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, documentId }) => {
      return axiosInstance.delete(
        `/api/v1/documents/${projectId}/${documentId}`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", variables.projectId],
      });
    },
  });
};
