import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { UserPlus, Search } from "lucide-react";
import { usePlot, useUpdatePlot } from "../hooks/usePlotHooks";
import { useUsers } from "../hooks/useUserHooks";
import { useToast } from "../Context/ToastContext";
import AddUserModal from "../Components/AddUserModal";

const AddSalePage = () => {
  const { id: projectId } = useParams();
  const { addToast } = useToast();
  const [plotNumberInput, setPlotNumberInput] = useState("");
  const [resolvedPlot, setResolvedPlot] = useState(null);
  const [plotAmount, setPlotAmount] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [addUserOpen, setAddUserOpen] = useState(false);

  const { data: plotsPayload, isLoading: plotsLoading } = usePlot(
    projectId,
    1,
    500,
    "plotnumber",
    "asc"
  );
  const plots = useMemo(
    () =>
      Array.isArray(plotsPayload?.data?.plots) ? plotsPayload.data.plots : [],
    [plotsPayload]
  );

  const { data: usersResponse, isLoading: usersLoading, refetch: refetchUsers } =
    useUsers({
      page: 1,
      limit: 500,
      sortBy: "username",
      sortOrder: "asc",
    });

  const updatePlotMutation = useUpdatePlot();

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(usersResponse?.users) ? usersResponse.users : [];
    const q = userSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      const name = String(u.username || "").toLowerCase();
      const email = String(u.useremail || "").toLowerCase();
      const phone = String(u.userphone || "").replace(/\D/g, "");
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q.replace(/\D/g, ""))
      );
    });
  }, [usersResponse?.users, userSearch]);

  const resolvePlotByNumber = () => {
    const n = Number(String(plotNumberInput).trim());
    if (!Number.isFinite(n) || n <= 0) {
      setResolvedPlot(null);
      addToast("error", "Plot number", "Enter a valid plot number.");
      return;
    }
    const found = plots.find((p) => Number(p.plotnumber) === n);
    if (!found) {
      setResolvedPlot(null);
      setPlotAmount("");
      addToast("error", "Not found", `No plot #${n} in this project.`);
      return;
    }
    setResolvedPlot(found);
    setPlotAmount(String(found.plotprice ?? ""));
    if (String(found.plotstatus) === "Sold") {
      addToast("warning", "Already sold", "This plot is already marked as sold.");
    }
  };

  useEffect(() => {
    setResolvedPlot(null);
    setPlotAmount("");
    setSelectedUserId("");
  }, [projectId]);

  const canSubmit = useMemo(() => {
    if (!resolvedPlot || String(resolvedPlot.plotstatus) === "Sold") return false;
    if (!selectedUserId) return false;
    const amt = Number(plotAmount);
    if (!Number.isFinite(amt) || amt < 0) return false;
    return true;
  }, [resolvedPlot, selectedUserId, plotAmount]);

  const handleAddSale = async (e) => {
    e.preventDefault();
    if (!canSubmit || !resolvedPlot) return;
    try {
      await updatePlotMutation.mutateAsync({
        projectId,
        plotId: resolvedPlot._id,
        plotData: {
          plotstatus: "Sold",
          assigneduserid: selectedUserId,
          plotprice: Number(plotAmount),
        },
      });
      addToast("success", "Sale recorded", "Plot marked sold, buyer assigned, and price updated.");
      setPlotNumberInput("");
      setResolvedPlot(null);
      setPlotAmount("");
      setSelectedUserId("");
    } catch (err) {
      addToast(
        "error",
        "Sale failed",
        err?.response?.data?.message || err?.message || "Could not complete sale."
      );
    }
  };

  if (plotsLoading && !plots.length) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <p className="text-sm text-gray-600">
        Record a sale: mark the plot as sold, assign the buyer (existing user), and set the final plot amount.
      </p>

      <form onSubmit={handleAddSale} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Plot number</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={plotNumberInput}
              onChange={(e) => setPlotNumberInput(e.target.value)}
              placeholder="e.g. 12"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={resolvePlotByNumber}
              className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200"
            >
              Load plot
            </button>
          </div>
          {resolvedPlot ? (
            <p className="text-xs text-gray-600 mt-1">
              Plot #{resolvedPlot.plotnumber} — status:{" "}
              <span className="font-medium">{resolvedPlot.plotstatus}</span>
              {String(resolvedPlot.plotstatus) === "Sold" ? (
                <span className="text-red-600"> (cannot sell again)</span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Plot amount (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={plotAmount}
            onChange={(e) => setPlotAmount(e.target.value)}
            disabled={!resolvedPlot || String(resolvedPlot.plotstatus) === "Sold"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
            placeholder="Loaded from plot; editable"
          />
          <p className="text-xs text-gray-500 mt-1">Defaults to the plot&apos;s current price; change if the sale amount differs.</p>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <label className="block text-xs font-medium text-gray-700">user </label>
            <button
              type="button"
              onClick={() => setAddUserOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 w-fit"
            >
              <UserPlus size={16} />
              Add new user
            </button>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email, or phone…"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto bg-gray-50/50">
            {usersLoading ? (
              <div className="p-4 flex justify-center">
                <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">No users match your search.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const buyerUserId = u.userid;
                  const active = String(selectedUserId) === String(buyerUserId);
                  return (
                    <li key={buyerUserId}>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(buyerUserId)}
                        className={`w-full text-left px-3 py-2.5 text-sm transition ${
                          active ? "bg-blue-50 ring-inset ring-1 ring-blue-200" : "hover:bg-white"
                        }`}
                      >
                        <span className="font-medium text-gray-900">{u.username}</span>
                        <span className="text-gray-500 block text-xs">
                          {u.useremail} · {u.userphone || "—"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <button
            type="submit"
            disabled={!canSubmit || updatePlotMutation.isPending}
            className="w-full sm:w-auto min-w-[10rem] bg-blue-600 text-white rounded-lg py-2.5 px-6 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updatePlotMutation.isPending ? "Saving…" : "Add sale"}
          </button>
        </div>
      </form>

      <AddUserModal
        isOpen={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onSave={() => {
          refetchUsers();
          setAddUserOpen(false);
        }}
      />
    </div>
  );
};

export default AddSalePage;
