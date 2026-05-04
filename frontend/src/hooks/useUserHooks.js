import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

export const useUsers = (options = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    ...queryOptions
  } = options;
  return useQuery({
    queryKey: ["users", page, limit, sortBy, sortOrder],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/users", {
        params: { page, limit, sortBy, sortOrder },
      });
      return {
        users: res?.data?.data || [],
        pagination: res?.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    },
    ...queryOptions,
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/users/${id}`);
      return res?.data?.data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData) => {
      const res = await axiosInstance.post("/api/v1/users", userData);
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userData }) => {
      const res = await axiosInstance.put(`/api/v1/users/${id}`, userData);
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const res = await axiosInstance.delete(`/api/v1/users/${userId}`);
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
    },
  });
};
