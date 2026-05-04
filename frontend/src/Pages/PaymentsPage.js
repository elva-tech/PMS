import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Pencil, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../Components/LoadingSpinner";
import DeleteModal from "../Components/DeleteModal";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from "../hooks/usePaymentHooks";
import { usePlot } from "../hooks/usePlotHooks";

const shortRef = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const orderIdForPlot = (plotnumber) => `PLOT-${plotnumber}-${shortRef()}`;

const EMPTY_PLOTS = [];

const PaymentsPage = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const isAdmin =
    user?.user?.role === "admin" && user?.user?.type === "admin";
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const deletePaymentMutation = useDeletePayment();

  const { data: plotsPayload } = usePlot(projectId, 1, 500, "createdAt", "asc");
  const plotsList = Array.isArray(plotsPayload?.data?.plots)
    ? plotsPayload.data.plots
    : EMPTY_PLOTS;

  const [newPlotId, setNewPlotId] = useState("");
  const [newOrderId, setNewOrderId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newPayStatus, setNewPayStatus] = useState("Pending");
  const [newPayUserId, setNewPayUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    if (!isAdmin || !projectId || plotsList.length === 0) return;
    setNewPlotId((prev) => prev || plotsList[0]._id);
  }, [isAdmin, projectId, plotsList]);

  const selectedPlot = useMemo(
    () => plotsList.find((p) => p._id === newPlotId),
    [plotsList, newPlotId]
  );

  useEffect(() => {
    if (!isAdmin || !selectedPlot) return;
    setNewOrderId((prev) =>
      prev.trim() ? prev : orderIdForPlot(selectedPlot.plotnumber)
    );
  }, [isAdmin, selectedPlot]);

  const { data, isLoading, isError, error, isFetching } = usePayments(
    projectId,
    {
      page,
      limit,
      status: statusFilter,
      search: debouncedSearch || undefined,
    }
  );

  const payments = data?.data?.payments || [];
  const summary = data?.data?.summary || {};
  const pagination = data?.pagination || {
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const formatMoney = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusClass = (status) => {
    if (status === "Success") return "text-green-600";
    if (status === "Pending") return "text-amber-600";
    if (status === "Rejected") return "text-red-600";
    return "text-gray-600";
  };

  const totalSuccessAmount = summary.totalSuccessAmount ?? 0;
  const totalPendingAmount = summary.totalPendingAmount ?? 0;

  const handlePlotSelectChange = (e) => {
    const id = e.target.value;
    setNewPlotId(id);
    const p = plotsList.find((x) => x._id === id);
    if (p) setNewOrderId(orderIdForPlot(p.plotnumber));
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(newAmount, 10);
    if (!newPlotId) {
      addToast("error", "Plot required", "Choose a plot for this payment.");
      return;
    }
    if (!newOrderId.trim() || Number.isNaN(amount) || amount < 0) {
      addToast(
        "error",
        "Invalid",
        "Order reference and a valid amount are required."
      );
      return;
    }
    createPaymentMutation.mutate(
      {
        projectId,
        body: {
          orderId: newOrderId.trim(),
          amount,
          status: newPayStatus,
          userid: newPayUserId.trim() || null,
          plotid: newPlotId,
        },
      },
      {
        onSuccess: () => {
          addToast("success", "Payment", "Payment recorded.");
          const p = plotsList.find((x) => x._id === newPlotId);
          setNewOrderId(p ? orderIdForPlot(p.plotnumber) : "");
          setNewAmount("");
          setNewPayUserId("");
          setNewPayStatus("Pending");
        },
        onError: (err) => {
          addToast(
            "error",
            "Failed",
            err?.response?.data?.message || err.message || "Could not add payment"
          );
        },
      }
    );
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amount = parseFloat(editingPayment.amount, 10);
    if (!editingPayment.orderId?.trim() || Number.isNaN(amount) || amount < 0) {
      addToast("error", "Invalid", "Order reference and a valid amount are required.");
      return;
    }
    if (!editingPayment.plotid) {
      addToast("error", "Plot required", "Choose a plot for this payment.");
      return;
    }
    updatePaymentMutation.mutate(
      {
        projectId,
        paymentId: editingPayment._id,
        body: {
          orderId: editingPayment.orderId.trim(),
          amount,
          status: editingPayment.status,
          userid: editingPayment.userid?.trim() || null,
          plotid: editingPayment.plotid,
        },
      },
      {
        onSuccess: () => {
          addToast("success", "Payment", "Payment updated.");
          setEditingPayment(null);
        },
        onError: (err) => {
          addToast(
            "error",
            "Failed",
            err?.response?.data?.message || err.message || "Could not update payment"
          );
        },
      }
    );
  };

  const confirmDeletePayment = () => {
    if (!paymentToDelete) return;
    deletePaymentMutation.mutate(
      { projectId, paymentId: paymentToDelete._id },
      {
        onSuccess: () => {
          addToast("success", "Payment", "Payment removed.");
          setPaymentToDelete(null);
        },
        onError: (err) => {
          addToast(
            "error",
            "Failed",
            err?.response?.data?.message || err.message || "Could not delete payment"
          );
        },
      }
    );
  };

  const colCount = isAdmin ? 7 : 6;

  return (
    <div className="mt-4">
      <div className="mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-gray-600">Total Success Amount</p>
            <p className="text-green-600 text-2xl font-semibold">
              {formatMoney(totalSuccessAmount)}
            </p>
            <p className="text-gray-500 text-sm">
              Recorded payments with status Success
            </p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-600">Total Pending Amount</p>
            <p className="text-amber-600 text-2xl font-semibold">
              {formatMoney(totalPendingAmount)}
            </p>
            <p className="text-gray-500 text-sm">
              Recorded payments with status Pending
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          {isAdmin && editingPayment && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Edit installment / payment
              </h3>
              <form
                onSubmit={handleSaveEdit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
              >
                <div className="lg:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Plot</label>
                  <select
                    value={editingPayment.plotid || ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      const p = plotsList.find((x) => x._id === id);
                      setEditingPayment((prev) => ({
                        ...prev,
                        plotid: id,
                        plotnumber: p?.plotnumber ?? prev.plotnumber,
                      }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select plot…</option>
                    {plotsList.map((p) => (
                      <option key={p._id} value={p._id}>
                        Plot #{p.plotnumber} — {formatMoney(p.plotprice)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Order reference
                  </label>
                  <input
                    type="text"
                    value={editingPayment.orderId}
                    onChange={(e) =>
                      setEditingPayment((prev) => ({
                        ...prev,
                        orderId: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Unique reference for this payment"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPayment.amount}
                    onChange={(e) =>
                      setEditingPayment((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Status</label>
                  <select
                    value={editingPayment.status}
                    onChange={(e) =>
                      setEditingPayment((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="Success">Success</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Buyer user id (optional)
                  </label>
                  <input
                    type="text"
                    value={editingPayment.userid || ""}
                    onChange={(e) =>
                      setEditingPayment((prev) => ({
                        ...prev,
                        userid: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Link to a user account"
                  />
                </div>
                <div className="flex gap-2 lg:col-span-6">
                  <button
                    type="submit"
                    disabled={updatePaymentMutation.isPending}
                    className="bg-blue-600 text-white rounded-lg py-2 px-4 text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatePaymentMutation.isPending ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPayment(null)}
                    className="border border-gray-300 rounded-lg py-2 px-4 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {isAdmin && (
            <form
              onSubmit={handleAddPayment}
              className="mb-6 pb-6 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
            >
              <div className="lg:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Plot</label>
                {plotsList.length === 0 ? (
                  <p className="text-sm text-amber-700 py-2">
                    Add plots to this project first (Plots tab), then record payments
                    here.
                  </p>
                ) : (
                  <select
                    value={newPlotId}
                    onChange={handlePlotSelectChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {plotsList.map((p) => (
                      <option key={p._id} value={p._id}>
                        Plot #{p.plotnumber} — {formatMoney(p.plotprice)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Order reference
                </label>
                <input
                  type="text"
                  value={newOrderId}
                  onChange={(e) => setNewOrderId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Auto-filled from plot; you can edit"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Status</label>
                <select
                  value={newPayStatus}
                  onChange={(e) => setNewPayStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Success">Success</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Buyer user id (optional)
                </label>
                <input
                  type="text"
                  value={newPayUserId}
                  onChange={(e) => setNewPayUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Link to a user"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={
                    createPaymentMutation.isPending || plotsList.length === 0
                  }
                  className="w-full bg-blue-600 text-white rounded-lg py-2 px-4 text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {createPaymentMutation.isPending ? "Saving…" : "Add payment"}
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-semibold">Payment History</h2>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <div className="relative flex items-center border border-gray-300 rounded-lg px-4 py-2 w-full md:w-auto">
                <Filter className="text-gray-600 mr-2" size={20} />
                <select
                  className="bg-transparent focus:outline-none w-full text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Success">Success</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="relative w-full md:w-auto">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  className="w-full md:w-64 border border-gray-300 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  placeholder="Order reference or plot number…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isFetching && !isLoading && (
            <p className="text-xs text-gray-500 mb-2">Refreshing…</p>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : isError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error?.response?.data?.message ||
                error?.message ||
                "Could not load payments."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-lg overflow-hidden shadow-lg">
                  <thead>
                    <tr className="w-full bg-blue-600 text-left text-white uppercase text-xs md:text-sm">
                      <th className="py-3 px-4 border-b">Plot</th>
                      <th className="py-3 px-4 border-b">Order reference</th>
                      <th className="py-3 px-4 border-b">Date</th>
                      <th className="py-3 px-4 border-b">Amount</th>
                      <th className="py-3 px-4 border-b">Status</th>
                      <th className="py-3 px-4 border-b">User</th>
                      {isAdmin && (
                        <th className="py-3 px-4 border-b text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-xs md:text-sm font-semibold">
                    {payments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={colCount}
                          className="py-8 px-4 text-center text-gray-500 font-normal"
                        >
                          No payments found for this filter.
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr
                          key={payment._id}
                          className="border-b border-gray-200 hover:bg-gray-100"
                        >
                          <td className="py-3 px-4 border-b font-normal">
                            {payment.plotnumber != null
                              ? `#${payment.plotnumber}`
                              : "—"}
                          </td>
                          <td className="py-3 px-4 border-b">
                            {payment.orderId}
                          </td>
                          <td className="py-3 px-4 border-b">
                            {payment.createdAt || "—"}
                          </td>
                          <td className="py-3 px-4 border-b">
                            {formatMoney(payment.amount)}
                          </td>
                          <td
                            className={`py-3 px-4 border-b ${statusClass(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </td>
                          <td className="py-3 px-4 border-b font-normal text-gray-600">
                            {payment.userid || "—"}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 border-b text-right">
                              <div className="inline-flex gap-1">
                                <button
                                  type="button"
                                  className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                                  onClick={() =>
                                    setEditingPayment({
                                      _id: payment._id,
                                      orderId: payment.orderId,
                                      amount: String(payment.amount),
                                      status: payment.status,
                                      userid: payment.userid || "",
                                      plotid: payment.plotid || newPlotId || "",
                                      plotnumber: payment.plotnumber,
                                    })
                                  }
                                  aria-label="Edit payment"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                  onClick={() => setPaymentToDelete(payment)}
                                  aria-label="Delete payment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {pagination.totalRecords > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 border-t rounded-lg shadow-lg mt-4 text-xs md:text-sm">
                  <div className="text-gray-600 mb-2 sm:mb-0">
                    Page {pagination.currentPage}
                    {pagination.totalPages ? ` of ${pagination.totalPages}` : ""}{" "}
                    ({pagination.totalRecords} total)
                  </div>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrevPage}
                      className={`py-1 px-3 rounded ${
                        pagination.hasPrevPage
                          ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      &lt;
                    </button>
                    {[...Array(pagination.totalPages || 0)].map((_, index) => (
                      <button
                        type="button"
                        key={index + 1}
                        onClick={() => setPage(index + 1)}
                        className={`py-1 px-3 rounded ${
                          pagination.currentPage === index + 1
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`py-1 px-3 rounded ${
                        pagination.hasNextPage
                          ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {paymentToDelete && (
        <DeleteModal
          onConfirm={confirmDeletePayment}
          onCancel={() => setPaymentToDelete(null)}
          title="Remove payment"
          message={`Remove payment ${paymentToDelete.orderId} (${formatMoney(
            paymentToDelete.amount
          )})? This cannot be undone.`}
          confirmText="Remove"
          cancelText="Cancel"
          isLoading={deletePaymentMutation.isPending}
        />
      )}
    </div>
  );
};

export default PaymentsPage;
