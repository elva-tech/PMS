import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

export const usePayments = (projectId, params = {}, queryOptions = {}) => {
  const {
    page = 1,
    limit = 20,
    status = "all",
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = params;

  return useQuery({
    queryKey: [
      "payments",
      projectId,
      page,
      limit,
      status,
      sortBy,
      sortOrder,
      search || "",
    ],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/payments/${projectId}`, {
        params: {
          page,
          limit,
          status,
          sortBy,
          sortOrder,
          search: search || undefined,
        },
      });
      return res?.data;
    },
    enabled: !!projectId,
    ...queryOptions,
  });
};

const invalidatePaymentAndPlots = (queryClient, projectId) => {
  queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
  queryClient.invalidateQueries({ queryKey: ["plots", projectId] });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, body }) => {
      const res = await axiosInstance.post(
        `/api/v1/payments/${projectId}`,
        body
      );
      return res?.data;
    },
    onSuccess: (_, variables) => {
      invalidatePaymentAndPlots(queryClient, variables.projectId);
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, paymentId, body }) => {
      const res = await axiosInstance.patch(
        `/api/v1/payments/${projectId}/${paymentId}`,
        body
      );
      return res?.data;
    },
    onSuccess: (_, variables) => {
      invalidatePaymentAndPlots(queryClient, variables.projectId);
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, paymentId }) => {
      const res = await axiosInstance.delete(
        `/api/v1/payments/${projectId}/${paymentId}`
      );
      return res?.data;
    },
    onSuccess: (_, variables) => {
      invalidatePaymentAndPlots(queryClient, variables.projectId);
    },
  });
};
