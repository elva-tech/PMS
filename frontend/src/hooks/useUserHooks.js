import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/users");
      return res?.data?.data;
    },
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
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users"], (oldData) =>
        oldData.map((user) =>
          user.userid === updatedUser.userid ? updatedUser : user
        )
      );
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
