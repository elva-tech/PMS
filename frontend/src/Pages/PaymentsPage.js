import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Pencil, Trash2, Eye } from "lucide-react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../Components/LoadingSpinner";
import DeleteModal from "../Components/DeleteModal";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import axiosInstance from "../utils/axiosInstance";
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from "../hooks/usePaymentHooks";
import { usePlot } from "../hooks/usePlotHooks";

const EMPTY_PLOTS = [];
const API_BASE_URL = axiosInstance.defaults.baseURL || "";

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
  const selectablePlots = useMemo(
    () =>
      plotsList.filter((plot) => {
        const status = String(plot?.plotstatus || "").trim().toLowerCase();
        return status === "available" || status === "reserved";
      }),
    [plotsList]
  );

  const [newPlotId, setNewPlotId] = useState("");
  const [newPlotSearch, setNewPlotSearch] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newPayStatus, setNewPayStatus] = useState("Pending");
  const [newDocumentFile, setNewDocumentFile] = useState(null);
  const [editDocumentFile, setEditDocumentFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editPlotSearch, setEditPlotSearch] = useState("");
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [viewingDocId, setViewingDocId] = useState(null);
  /** "" = project-wide totals; otherwise plot _id for per-plot finance cards */
  const [financePlotId, setFinancePlotId] = useState("");
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    setFinancePlotId("");
  }, [projectId]);

  useEffect(() => {
    if (!isAdmin || !projectId || selectablePlots.length === 0) return;
    setNewPlotId((prev) => prev || selectablePlots[0]._id);
  }, [isAdmin, projectId, selectablePlots]);

  const selectedPlot = useMemo(
    () => selectablePlots.find((p) => p._id === newPlotId),
    [selectablePlots, newPlotId]
  );
  const filteredNewPlots = useMemo(() => {
    const term = newPlotSearch.trim().toLowerCase();
    if (!term) return selectablePlots;
    return selectablePlots.filter((plot) => {
      const number = String(plot.plotnumber || "").toLowerCase();
      const direction = String(plot.plotdirection || "").toLowerCase();
      const size = String(plot.plotsize || "").toLowerCase();
      return number.includes(term) || direction.includes(term) || size.includes(term);
    });
  }, [newPlotSearch, selectablePlots]);
  const filteredEditPlots = useMemo(() => {
    const term = editPlotSearch.trim().toLowerCase();
    if (!term) return selectablePlots;
    return selectablePlots.filter((plot) => {
      const number = String(plot.plotnumber || "").toLowerCase();
      const direction = String(plot.plotdirection || "").toLowerCase();
      const size = String(plot.plotsize || "").toLowerCase();
      return number.includes(term) || direction.includes(term) || size.includes(term);
    });
  }, [editPlotSearch, selectablePlots]);
  const isNewPlotValid = useMemo(
    () =>
      Boolean(newPlotId) &&
      selectablePlots.some((plot) => String(plot._id) === String(newPlotId)),
    [newPlotId, selectablePlots]
  );

  const { data, isLoading, isError, error, isFetching } = usePayments(
    projectId,
    {
      page,
      limit,
      status: statusFilter,
      search: debouncedSearch || undefined,
    }
  );

  const { data: paymentsTotalsPayload } = usePayments(projectId, {
    page: 1,
    limit: 500,
    status: "all",
  });

  const allPaymentsForFinance = Array.isArray(paymentsTotalsPayload?.data?.payments)
    ? paymentsTotalsPayload.data.payments
    : [];

  const paidByPlotSuccess = useMemo(() => {
    const m = {};
    allPaymentsForFinance.forEach((p) => {
      if (String(p?.status || "") !== "Success") return;
      const pid = String(p.plotid || "");
      if (!pid) return;
      m[pid] = (m[pid] || 0) + (Number(p.amount) || 0);
    });
    return m;
  }, [allPaymentsForFinance]);

  const financeRollupProject = useMemo(() => {
    const totalPlotValue = plotsList.reduce(
      (sum, plot) => sum + (Number(plot.plotprice) || 0),
      0
    );
    const totalPaymentsReceived = Object.values(paidByPlotSuccess).reduce((a, b) => a + b, 0);
    const outstandingAmount = plotsList.reduce((sum, plot) => {
      const pid = String(plot._id || "");
      const price = Number(plot.plotprice) || 0;
      const paid = paidByPlotSuccess[pid] || 0;
      return sum + Math.max(0, price - paid);
    }, 0);
    return { totalPlotValue, totalPaymentsReceived, outstandingAmount };
  }, [plotsList, paidByPlotSuccess]);

  const financePlotsSorted = useMemo(
    () =>
      [...plotsList].sort(
        (a, b) => Number(a.plotnumber || 0) - Number(b.plotnumber || 0)
      ),
    [plotsList]
  );

  const financeDisplay = useMemo(() => {
    if (!financePlotId) {
      return {
        scope: "project",
        plotLabel: null,
        ...financeRollupProject,
      };
    }
    const plot = plotsList.find((p) => String(p._id) === String(financePlotId));
    if (!plot) {
      return { scope: "project", plotLabel: null, ...financeRollupProject };
    }
    const pid = String(plot._id);
    const totalPlotValue = Number(plot.plotprice) || 0;
    const totalPaymentsReceived = paidByPlotSuccess[pid] || 0;
    const outstandingAmount = Math.max(0, totalPlotValue - totalPaymentsReceived);
    return {
      scope: "plot",
      plotLabel: String(plot.plotnumber ?? ""),
      totalPlotValue,
      totalPaymentsReceived,
      outstandingAmount,
    };
  }, [financePlotId, plotsList, paidByPlotSuccess, financeRollupProject]);

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
    setFinancePlotId(id);
  };

  const latestOrderId = useMemo(() => {
    if (!selectedPlot?.plotnumber) return "";
    const plotNo = String(selectedPlot.plotnumber);
    const existingForPlot = allPaymentsForFinance.filter(
      (p) => String(p.plotnumber) === plotNo || String(p.plotid) === String(newPlotId)
    ).length;
    return `PLOT-${plotNo}-${String(Math.max(existingForPlot, 1)).padStart(
      3,
      "0"
    )}`;
  }, [selectedPlot, allPaymentsForFinance, newPlotId]);

  const uploadPaymentDocument = async (file, plotId) => {
    if (!file) return null;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const isValidType =
      allowedTypes.includes(file.type) ||
      file.type.startsWith("image/");
    if (!isValidType) {
      addToast("error", "Upload failed", "Invalid file type.");
      return null;
    }
    if (!file.size) {
      addToast("error", "Upload failed", "Empty document.");
      return null;
    }
    try {
      const token = JSON.parse(localStorage.getItem("user") || "null")?.token || "";
      const fd = new FormData();
      fd.append("files", file);
      if (plotId) fd.append("plotid", plotId);
      fd.append("documentType", "other");
      fd.append("otherLabel", "Payment document");
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/${projectId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        addToast("error", "Upload failed", "Upload failed.");
        return null;
      }
      const data = await res.json();
      return data?.data?.documents?.[0] || null;
    } catch {
      addToast("error", "Upload failed", "Upload failed.");
      return null;
    }
  };

  const handleViewDocument = async (payment) => {
    const docId = payment?.documentid || payment?.documentId;
    if (!docId) {
      addToast("error", "Unable to load document", "Missing file.");
      return;
    }
    try {
      setViewingDocId(payment._id);
      const token = JSON.parse(localStorage.getItem("user") || "null")?.token || "";
      const docProjectId = payment.projectid || projectId;
      const res = await fetch(
        `${API_BASE_URL}/api/v1/documents/${docProjectId}/${docId}/file`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("doc");
      const blob = await res.blob();
      if (!blob.size) {
        addToast("error", "Unable to load document", "Empty document.");
        return;
      }
      
      const url = URL.createObjectURL(blob);
      
      const newWin = window.open(url, "_blank");
      
      if (!newWin) {
        const a = document.createElement("a");
        a.href = url;
        a.download = payment.documentName || "document";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 60000);

    } catch {
      addToast("error", "Unable to load document", "Unable to load document.");
    } finally {
      setViewingDocId(null);
    }
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(newAmount, 10);
    if (!newPlotId || !isNewPlotValid) {
      addToast("error", "Plot required", "Choose a plot for this payment.");
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      addToast(
        "error",
        "Invalid",
        "A valid amount is required."
      );
      return;
    }
    const plotNo = String(selectedPlot?.plotnumber || "");
    const existingForPlot = payments.filter(
      (p) => String(p.plotnumber) === plotNo
    ).length;
    const nextOrderId = `PLOT-${plotNo}-${String(existingForPlot + 1).padStart(
      3,
      "0"
    )}`;
    const submit = async () => {
      const uploadedDoc = await uploadPaymentDocument(newDocumentFile, newPlotId);
      if (newDocumentFile && !uploadedDoc) return;
      createPaymentMutation.mutate(
      {
        projectId,
        body: {
          orderId: nextOrderId,
          amount,
          status: newPayStatus,
          userid: null,
          plotid: newPlotId,
          documentid: uploadedDoc?._id || null,
          documentName: uploadedDoc?.originalName || null,
        },
      },
      {
        onSuccess: () => {
          addToast("success", "Payment", "Payment recorded.");
          setNewAmount("");
          setNewPayStatus("Pending");
          setNewDocumentFile(null);
        },
        onError: () => {
          addToast("error", "Something went wrong", "Could not add payment.");
        },
      }
    );
    };
    submit();
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amount = parseFloat(editingPayment.amount, 10);
    if (Number.isNaN(amount) || amount < 0) {
      addToast("error", "Invalid", "A valid amount is required.");
      return;
    }
    const isEditPlotValid = selectablePlots.some(
      (plot) => String(plot._id) === String(editingPayment.plotid || "")
    );
    if (!editingPayment.plotid || !isEditPlotValid) {
      addToast("error", "Plot required", "Choose a plot for this payment.");
      return;
    }
    const submit = async () => {
      const uploadedDoc = await uploadPaymentDocument(
        editDocumentFile,
        editingPayment.plotid
      );
      if (editDocumentFile && !uploadedDoc) return;
      updatePaymentMutation.mutate(
      {
        projectId,
        paymentId: editingPayment._id,
        body: {
          amount,
          status: editingPayment.status,
          userid: editingPayment.userid?.trim() || null,
          plotid: editingPayment.plotid,
          documentid: uploadedDoc?._id || editingPayment.documentid || null,
          documentName:
            uploadedDoc?.originalName || editingPayment.documentName || null,
        },
      },
      {
        onSuccess: () => {
          addToast("success", "Payment", "Payment updated.");
          setEditingPayment(null);
          setEditDocumentFile(null);
        },
        onError: () => {
          addToast("error", "Something went wrong", "Could not update payment.");
        },
      }
    );
    };
    submit();
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
        onError: () => {
          addToast("error", "Something went wrong", "Could not delete payment.");
        },
      }
    );
  };

  const colCount = isAdmin ? 8 : 7;

  return (
    <div className="mt-4">
      <div className="mx-auto">
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Show plot value, payments received &amp; outstanding for
          </label>
          <select
            value={financePlotId}
            onChange={(e) => setFinancePlotId(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All plots (whole project)</option>
            {financePlotsSorted.map((p) => (
              <option key={p._id} value={p._id}>
                Plot #{p.plotnumber} — {p.plotstatus} — {formatMoney(p.plotprice)}
              </option>
            ))}
          </select>
          {financeDisplay.scope === "plot" ? (
            <p className="text-xs text-gray-500 mt-1">
              Plot #{financeDisplay.plotLabel} — successful payments only count toward &quot;Payments
              received&quot;.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Totals aggregate every plot in this project (plot price − successful payments per plot).
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">
              {financeDisplay.scope === "plot" ? "Plot price (listed)" : "Total Plot Value"}
            </p>
            <p className="text-slate-800 text-xl font-semibold">
              {formatMoney(financeDisplay.totalPlotValue)}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {financeDisplay.scope === "plot"
                ? "Listed price for this plot"
                : "Sum of all plot prices in this project"}
            </p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">Payments Received</p>
            <p className="text-green-600 text-2xl font-semibold">
              {formatMoney(financeDisplay.totalPaymentsReceived)}
            </p>
            <p className="text-gray-500 text-sm">
              {financeDisplay.scope === "plot"
                ? "Successful payments recorded for this plot"
                : "All successful payments in this project"}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">Outstanding Amount</p>
            <p className="text-amber-800 text-2xl font-semibold">
              {formatMoney(financeDisplay.outstandingAmount)}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {financeDisplay.scope === "plot"
                ? "Plot price minus successful payments for this plot"
                : "Per-plot outstanding summed for the project"}
            </p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg lg:col-span-1">
            <p className="text-gray-600">Total Pending Amount</p>
            <p className="text-amber-600 text-2xl font-semibold">
              {formatMoney(totalPendingAmount)}
            </p>
            <p className="text-gray-500 text-sm">
              Recorded payments with status Pending (current list filter)
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
              >
                <div className="lg:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Plot</label>
                  <input
                    type="text"
                    value={editPlotSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditPlotSearch(val);
                      const exact = selectablePlots.find(
                        (plot) => String(plot.plotnumber) === val.trim()
                      );
                      if (exact) {
                        setEditingPayment((prev) => ({
                          ...prev,
                          plotid: exact._id,
                          plotnumber: exact.plotnumber,
                        }));
                      }
                    }}
                    placeholder="Search plot number / direction / size"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                  />
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
                    {filteredEditPlots.map((p) => (
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
                    readOnly
                    className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600"
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
                <div className="flex gap-2 lg:col-span-5">
                  <button
                    type="submit"
                    disabled={updatePaymentMutation.isPending}
                    className="bg-blue-600 text-white rounded-lg py-2 px-4 text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatePaymentMutation.isPending ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPayment(null);
                      setEditDocumentFile(null);
                      setEditPlotSearch("");
                    }}
                    className="border border-gray-300 rounded-lg py-2 px-4 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <div className="lg:col-span-5">
                  <label className="block text-xs text-gray-600 mb-1">
                    Replace document (optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setEditDocumentFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    accept=".pdf,.doc,.docx,image/*"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {editingPayment.documentName || "No document"}
                  </p>
                </div>
              </form>
            </div>
          )}

          {isAdmin && !editingPayment && (
            <form
              onSubmit={handleAddPayment}
              className="mb-6 pb-6 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
            >
              <div className="lg:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Plot</label>
                {selectablePlots.length === 0 ? (
                  <p className="text-sm text-amber-700 py-2">
                    Add available or reserved plots to this project first (Plots tab), then record payments
                    here.
                  </p>
                ) : (
                  <>
                    <input
                      type="text"
                      value={newPlotSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewPlotSearch(val);
                        const exact = selectablePlots.find(
                          (plot) => String(plot.plotnumber) === val.trim()
                        );
                        if (exact) setNewPlotId(exact._id);
                      }}
                      placeholder="Search plot number / direction / size"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                    />
                    <select
                      value={newPlotId}
                      onChange={handlePlotSelectChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select plot…</option>
                      {filteredNewPlots.map((p) => (
                        <option key={p._id} value={p._id}>
                          Plot #{p.plotnumber} — {formatMoney(p.plotprice)}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Order reference</label>
                <input
                  type="text"
                  value={latestOrderId}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600"
                  placeholder="Order reference"
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
                <button
                  type="submit"
                  disabled={
                    createPaymentMutation.isPending ||
                    selectablePlots.length === 0 ||
                    !isNewPlotValid
                  }
                  className="w-full bg-blue-600 text-white rounded-lg py-2 px-4 text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {createPaymentMutation.isPending ? "Saving…" : "Add payment"}
                </button>
              </div>
              <div className="sm:col-span-2 lg:col-span-5">
                <label className="block text-xs text-gray-600 mb-1">
                  Upload document (optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewDocumentFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  accept=".pdf,.doc,.docx,image/*"
                />
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
              Something went wrong
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
                      <th className="py-3 px-4 border-b">Document</th>
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
                            {payment.assignedUserName || "—"}
                          </td>
                          <td className="py-3 px-4 border-b font-normal">
                            {payment.documentid || payment.documentId ? (
                              <button
                                type="button"
                                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                                onClick={() => handleViewDocument(payment)}
                                disabled={viewingDocId === payment._id}
                                aria-label="View document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              "—"
                            )}
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
                                      documentid: payment.documentid || null,
                                      documentName: payment.documentName || null,
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
