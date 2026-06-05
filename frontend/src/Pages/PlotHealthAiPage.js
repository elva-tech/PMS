import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Sparkles, AlertTriangle, Clock, CheckCircle2, Search } from "lucide-react";
import { usePlotHealthAi } from "../hooks/useDeadPlotHooks";
import MetricCard from "../Components/analytics/MetricCard";
import {
  AnalyticsErrorState,
  AnalyticsSkeleton,
} from "../Components/analytics/AnalyticsStates";

const TABS = [
  { id: "all", label: "All inventory" },
  { id: "Dead", label: "Dead" },
  { id: "Slow", label: "Slow" },
  { id: "Active", label: "Active" },
];

const badgeClass = (classification) => {
  if (classification === "Dead") return "bg-red-100 text-red-800 border-red-200";
  if (classification === "Slow") return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
};

const badgeIcon = (classification) => {
  if (classification === "Dead") return <AlertTriangle className="w-4 h-4" />;
  if (classification === "Slow") return <Clock className="w-4 h-4" />;
  return <CheckCircle2 className="w-4 h-4" />;
};

const money = (n) =>
  Number(n) > 0 ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

export default function PlotHealthAiPage() {
  const { id: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const urlPlotNumber = searchParams.get("plotNumber");

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState(urlPlotNumber || "");
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [focusPlotNumber, setFocusPlotNumber] = useState(
    urlPlotNumber && /^\d+$/.test(urlPlotNumber) ? Number(urlPlotNumber) : null
  );

  const classification = tab === "all" ? undefined : tab;
  const { data, isLoading, isError, error, refetch, isFetching } = usePlotHealthAi(
    projectId,
    { classification, plotNumber: focusPlotNumber ?? undefined }
  );

  const summary = data?.summary || {};
  const plots = focusPlotNumber && data?.plot ? [data.plot] : data?.plots || [];

  useEffect(() => {
    if (focusPlotNumber && data?.plot?.plotId) {
      setSelectedPlotId(data.plot.plotId);
    }
  }, [focusPlotNumber, data?.plot?.plotId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plots;
    return plots.filter((p) => {
      const num = String(p.plotNumber ?? "");
      const id = String(p.plotId ?? "");
      return num.includes(q) || id.toLowerCase().includes(q);
    });
  }, [plots, search]);

  const selected =
    filtered.find((p) => p.plotId === selectedPlotId) ||
    plots.find((p) => p.plotId === selectedPlotId) ||
    null;

  if (isLoading) return <AnalyticsSkeleton cards={4} />;
  if (isError) {
    return (
      <AnalyticsErrorState
        message={
          error?.response?.data?.message ||
          error?.message ||
          "Plot Health AI unavailable. Start dead_plot_detection on port 8001."
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-700 to-violet-700 text-white p-6 shadow-lg border border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              AI Plot Health
            </div>
            <h1 className="text-2xl font-semibold mt-3">Dead plot detection</h1>
            <p className="text-sm text-blue-100 mt-1 max-w-2xl">
              Live analysis from your project plots and interested buyers. Rules + ML
              classify inventory as Active, Slow, or Dead with recommended actions.
            </p>
          </div>
          {isFetching ? (
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Refreshing…</span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Inventory analyzed" value={summary.inventoryAnalyzed ?? 0} />
        <MetricCard
          title="Dead plots"
          value={summary.dead ?? 0}
          helper="Urgent action"
        />
        <MetricCard title="Slow plots" value={summary.slow ?? 0} helper="Needs attention" />
        <MetricCard title="Active plots" value={summary.active ?? 0} helper="Healthy" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSelectedPlotId(null);
                setFocusPlotNumber(null);
                setSearch("");
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                tab === t.id
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plot number (Enter for one plot)…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value.trim()) setFocusPlotNumber(null);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const q = search.trim();
              if (/^\d+$/.test(q)) {
                setFocusPlotNumber(Number(q));
                setTab("all");
              } else {
                setFocusPlotNumber(null);
              }
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800">
            Plots ({filtered.length})
          </div>
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              {tab === "Dead"
                ? "No dead plots in this project right now — good sign."
                : "No plots match this filter."}
            </p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
              {filtered.map((plot) => (
                <button
                  key={plot.plotId}
                  type="button"
                  onClick={() => setSelectedPlotId(plot.plotId)}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center justify-between gap-3 ${
                    selectedPlotId === plot.plotId ? "bg-blue-50" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Plot #{plot.plotNumber ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {money(plot.features?.price)} · {plot.features?.interestedBuyers ?? 0}{" "}
                      interested buyers · {plot.features?.daysUnsold ?? 0} days listed
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass(
                      plot.classification
                    )}`}
                  >
                    {badgeIcon(plot.classification)}
                    {plot.customerView?.headline || plot.classification}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 min-h-[320px]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 text-sm px-4">
              <Sparkles className="w-8 h-8 text-blue-400 mb-3" />
              Select a plot to see AI insights and recommended steps.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Plot detail</p>
                <h2 className="text-lg font-semibold text-gray-900 mt-1">
                  Plot #{selected.plotNumber ?? "—"}
                </h2>
                <span
                  className={`inline-flex mt-2 items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass(
                    selected.classification
                  )}`}
                >
                  {selected.customerView?.headline || selected.classification}
                </span>
                <p className="text-sm text-gray-600 mt-2">
                  {selected.customerView?.chanceLine}
                </p>
                {selected.customerView?.riskLabel ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Risk: {selected.customerView.riskLabel}
                    {selected.deadProbability != null
                      ? ` · Dead probability ${(selected.deadProbability * 100).toFixed(1)}%`
                      : ""}
                  </p>
                ) : null}
              </div>

              {selected.probabilities ? (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {["Active", "Slow", "Dead"].map((label) => (
                    <div
                      key={label}
                      className={`rounded-lg border px-2 py-2 ${
                        selected.classification === label
                          ? "border-blue-300 bg-blue-50 font-semibold text-blue-900"
                          : "border-gray-100 bg-gray-50 text-gray-600"
                      }`}
                    >
                      <p>{label}</p>
                      <p className="text-sm mt-0.5">
                        {((selected.probabilities[label] || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="rounded border border-gray-100 px-2 py-1.5">
                  ₹/sqft: {Number(selected.features?.pricePerSqft || 0).toLocaleString("en-IN")}
                </div>
                <div className="rounded border border-gray-100 px-2 py-1.5">
                  Area: {selected.features?.plotArea ?? "—"} sqft
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Summary</p>
                <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-4">
                  {(selected.customerView?.summaryLines || []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              {(selected.customerView?.whyLines || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Why</p>
                  <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-4">
                    {selected.customerView.whyLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(selected.customerView?.recommendedSteps || []).length > 0 && (
                <div
                  className={`rounded-lg border p-3 ${
                    selected.classification === "Dead"
                      ? "bg-red-50 border-red-100"
                      : "bg-amber-50 border-amber-100"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase mb-2 ${
                      selected.classification === "Dead" ? "text-red-900" : "text-amber-900"
                    }`}
                  >
                    Recommended steps
                  </p>
                  <ol
                    className={`text-sm space-y-2 list-decimal pl-4 ${
                      selected.classification === "Dead" ? "text-red-950" : "text-amber-950"
                    }`}
                  >
                    {selected.customerView.recommendedSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
