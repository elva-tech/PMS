import React, { useMemo, useState } from "react";
import { Link2, LandPlot, UserCircle } from "lucide-react";
import LoadingSpinner from "../Components/LoadingSpinner";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import { useUsers } from "../hooks/useUserHooks";
import { usePlot, useUpdatePlot } from "../hooks/usePlotHooks";
import {
  useDocuments,
  useBulkAssignDocuments,
} from "../hooks/useDocumentHooks";

const PlotAllotmentPage = ({ projectId }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isAdmin =
    user?.user?.role === "admin" && user?.user?.type === "admin";
  const sessionUserId = user?.user?.userid;

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  const { data: usersPayload } = useUsers({
    page: 1,
    limit: 500,
    sortBy: "username",
    sortOrder: "asc",
  });
  const users = usersPayload?.users || [];

  const {
    data: plotsResponse,
    isLoading: plotsLoading,
    isError: plotsError,
    error: plotsErr,
  } = usePlot(projectId, 1, 500, "plotnumber", "asc");

  const plotsData = plotsResponse?.data?.plots || [];

  const {
    data: documentsResponse,
    isLoading: docsLoading,
    isError: docsError,
    error: docsErr,
  } = useDocuments(projectId, {
    page: 1,
    limit: 500,
    sortBy: "originalName",
    sortOrder: "asc",
  });

  const documentsList = documentsResponse?.data?.documents || [];

  const updatePlotMutation = useUpdatePlot();
  const bulkAssignMutation = useBulkAssignDocuments();

  const userById = useMemo(() => {
    const m = {};
    users.forEach((u) => {
      m[u.userid] = u;
      if (u._id) m[u._id] = u;
    });
    return m;
  }, [users]);

  const handleAssignPlot = () => {
    if (!selectedUserId || !selectedPlotId) {
      addToast("error", "Missing selection", "Select both a user and a plot.");
      return;
    }
    updatePlotMutation.mutate(
      {
        projectId,
        plotId: selectedPlotId,
        plotData: { assigneduserid: selectedUserId },
      },
      {
        onSuccess: () => {
          addToast("success", "Plot assignment", "Plot assigned successfully.");
          setSelectedPlotId("");
        },
        onError: (err) => {
          addToast(
            "error",
            "Assignment failed",
            err?.response?.data?.message ||
              err.message ||
              "Could not assign plot"
          );
        },
      }
    );
  };

  const handleClearPlotAssignment = () => {
    if (!selectedPlotId) {
      addToast("error", "Missing selection", "Select a plot to clear.");
      return;
    }
    updatePlotMutation.mutate(
      {
        projectId,
        plotId: selectedPlotId,
        plotData: { assigneduserid: null },
      },
      {
        onSuccess: () => {
          addToast("success", "Plot assignment", "Plot assignment cleared.");
          setSelectedPlotId("");
        },
        onError: (err) => {
          addToast(
            "error",
            "Update failed",
            err?.response?.data?.message ||
              err.message ||
              "Could not update plot"
          );
        },
      }
    );
  };

  const toggleDoc = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleLinkDocuments = () => {
    if (!selectedUserId) {
      addToast("error", "Missing user", "Select a user first.");
      return;
    }
    if (!selectedDocIds.length) {
      addToast(
        "error",
        "Missing documents",
        "Select at least one document."
      );
      return;
    }
    bulkAssignMutation.mutate(
      {
        projectId,
        userId: selectedUserId,
        documentIds: selectedDocIds,
      },
      {
        onSuccess: () => {
          addToast(
            "success",
            "Documents",
            "Documents linked to user."
          );
          setSelectedDocIds([]);
        },
        onError: (err) => {
          addToast(
            "error",
            "Link failed",
            err?.response?.data?.message ||
              err.message ||
              "Could not link documents"
          );
        },
      }
    );
  };

  if (!isAdmin) {
    const assigned = plotsData.filter(
      (p) => p.assigneduserid && p.assigneduserid === sessionUserId
    );

    if (plotsLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      );
    }

    if (plotsError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {plotsErr?.message || "Failed to load plots"}
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-4">
        <p className="text-gray-600 text-sm">
          Your allotted plot(s) for this project appear below. Contact an
          administrator for assignment changes.
        </p>
        {assigned.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
            No plot has been allotted to your account yet.
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-blue-600 text-white text-left uppercase">
                  <th className="py-3 px-4">Plot Number</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 font-semibold">
                {assigned.map((plot) => (
                  <tr key={plot._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{plot.plotnumber}</td>
                    <td className="py-3 px-4">{plot.plotsize}</td>
                    <td className="py-3 px-4">
                      {plot.plotprice != null
                        ? `₹${Number(plot.plotprice).toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">{plot.plotdirection || "—"}</td>
                    <td className="py-3 px-4">{plot.plotstatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <UserCircle className="text-blue-600" size={22} />
            Select user
          </h3>
          <select
            className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Choose a user…</option>
            {users.map((u) => (
              <option key={u.userid} value={u.userid}>
                {u.username} ({u.useremail})
              </option>
            ))}
          </select>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <LandPlot className="text-blue-600" size={22} />
            Assign plot to user
          </h3>
          <select
            className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
          >
            <option value="">Choose a plot…</option>
            {plotsData.map((p) => (
              <option key={p._id} value={p._id}>
                #{p.plotnumber} — {p.plotstatus}
                {p.assigneduserid
                  ? ` — assigned: ${
                      userById[p.assigneduserid]?.username || "Assigned user"
                    }`
                  : ""}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAssignPlot}
              disabled={updatePlotMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {updatePlotMutation.isPending ? "Saving…" : "Save assignment"}
            </button>
            <button
              type="button"
              onClick={handleClearPlotAssignment}
              disabled={updatePlotMutation.isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Clear assignment
            </button>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Link2 className="text-blue-600" size={22} />
          Link documents to selected user
        </h3>
        {docsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : docsError ? (
          <div className="text-red-600 text-sm">
            {docsErr?.message || "Failed to load documents"}
          </div>
        ) : documentsList.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
        ) : (
          <>
            <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
              {documentsList.map((doc) => (
                <label
                  key={doc._id}
                  className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocIds.includes(doc._id)}
                    onChange={() => toggleDoc(doc._id)}
                  />
                  <span className="flex-1 truncate">{doc.originalName}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={handleLinkDocuments}
              disabled={bulkAssignMutation.isPending}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkAssignMutation.isPending ? "Linking…" : "Link selected"}
            </button>
          </>
        )}
      </div>

      {plotsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : plotsError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {plotsErr?.message || "Failed to load plots"}
        </div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="w-full border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-blue-600 text-white text-left uppercase">
                <th className="py-3 px-4">Plot</th>
                <th className="py-3 px-4">Assigned user</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 font-semibold">
              {plotsData.map((plot) => (
                <tr key={plot._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{plot.plotnumber}</td>
                  <td className="py-3 px-4">
                    {plot.assigneduserid
                      ? userById[plot.assigneduserid]?.username ||
                        "Assigned user"
                      : "—"}
                  </td>
                  <td className="py-3 px-4">{plot.plotstatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlotAllotmentPage;
