import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Search } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsSkeleton,
} from "../Components/analytics/AnalyticsStates";
import ChartCard from "../Components/analytics/ChartCard";
import { useProjectAnalytics } from "../hooks/useAnalyticsHooks";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const DETAIL_PAGE_SIZE = 10;

const ProjectAnalyticsPage = () => {
  const { id: projectId } = useParams();
  const [plotFilter, setPlotFilter] = useState("All Plots");
  const [plotSearchInput, setPlotSearchInput] = useState("");
  const [debouncedPlotSearch, setDebouncedPlotSearch] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("totalPlots");
  const [metricSearch, setMetricSearch] = useState("");
  const [detailPage, setDetailPage] = useState(1);

  const { summary, isLoading, isError, error, ...analytics } = useProjectAnalytics(
    projectId,
    plotFilter
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPlotSearch(plotSearchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [plotSearchInput]);

  const availablePlots = analytics.availablePlots || [{ id: "All Plots", label: "All Plots", searchText: "" }];

  const filteredPlotDropdownOptions = useMemo(() => {
    const q = debouncedPlotSearch;
    if (!q) return availablePlots;
    return availablePlots.filter((opt) => {
      if (opt.id === "All Plots") return true;
      return String(opt.searchText || "").includes(q);
    });
  }, [availablePlots, debouncedPlotSearch]);

  const plotSearchNoMatch = useMemo(() => {
    const q = debouncedPlotSearch;
    if (!q) return false;
    const plotOnly = filteredPlotDropdownOptions.filter((o) => o.id !== "All Plots");
    return plotOnly.length === 0;
  }, [debouncedPlotSearch, filteredPlotDropdownOptions]);

  useEffect(() => {
    const q = debouncedPlotSearch;
    const plotOnly = availablePlots.filter((o) => o.id !== "All Plots");
    if (!q || plotOnly.length === 0) return;
    const matches = plotOnly.filter((o) => String(o.searchText || "").includes(q));
    if (matches.length === 1) setPlotFilter(matches[0].id);
  }, [debouncedPlotSearch, availablePlots]);

  useEffect(() => {
    if (!availablePlots.some((plot) => plot.id === plotFilter)) {
      setPlotFilter("All Plots");
    }
  }, [availablePlots, plotFilter]);

  useEffect(() => {
    setDetailPage(1);
  }, [selectedMetric, plotFilter, metricSearch]);

  const plotInventoryRows = analytics.plotInventoryRows || [];
  const paymentSuccessDetails = analytics.paymentSuccessDetails || [];

  const metricConfig = useMemo(() => {
    const inv = plotInventoryRows;
    return [
      {
        key: "totalPlots",
        title: "Total Plots",
        value: summary.totalPlots,
        rows: inv.map((row) => ({
          label: row.label,
          value: `${row.status} · ${money(row.plotPrice)} · paid ${money(row.paymentsReceived)} · out ${money(row.outstanding)}`,
        })),
      },
      {
        key: "availablePlots",
        title: "Available Plots",
        value: summary.availablePlots,
        rows: inv
          .filter((row) => row.status === "Available")
          .map((row) => ({
            label: row.label,
            value: `${money(row.plotPrice)} · paid ${money(row.paymentsReceived)}`,
          })),
      },
      {
        key: "soldPlots",
        title: "Sold Plots",
        value: summary.soldPlots,
        rows: inv
          .filter((row) => row.status === "Sold")
          .map((row) => ({
            label: row.label,
            value: `${money(row.plotPrice)} · paid ${money(row.paymentsReceived)} · out ${money(row.outstanding)}`,
          })),
      },
      {
        key: "reservedPlots",
        title: "Reserved Plots",
        value: summary.reservedPlots,
        rows: inv
          .filter((row) => row.status === "Reserved")
          .map((row) => ({
            label: row.label,
            value: `${money(row.plotPrice)} · paid ${money(row.paymentsReceived)}`,
          })),
      },
      {
        key: "paymentsReceived",
        title: "Payments Received",
        value: money(summary.paymentsReceived ?? summary.totalRevenue),
        rows: paymentSuccessDetails.map((row) => ({
          label: `Plot #${row.plotNumber} · ${row.customer}`,
          value: `${money(row.amount)} · ${row.status} · ${row.date}`,
        })),
      },
      {
        key: "totalPlotValue",
        title: "Total Plot Value",
        value: money(summary.totalPlotValue),
        rows: inv.map((row) => ({
          label: row.label,
          value: `${row.status} · ${money(row.plotPrice)}`,
        })),
      },
      {
        key: "outstanding",
        title: "Outstanding Amount",
        value: money(summary.totalOutstanding),
        rows: inv
          .filter((row) => row.outstanding > 0)
          .map((row) => ({
            label: row.label,
            value: `${money(row.outstanding)} (price ${money(row.plotPrice)}, paid ${money(row.paymentsReceived)})`,
          })),
      },
    ];
  }, [plotInventoryRows, paymentSuccessDetails, summary]);

  const selectedMetricCard =
    metricConfig.find((metric) => metric.key === selectedMetric) || metricConfig[0];
  const filteredMetricRows = (selectedMetricCard?.rows || []).filter((row) =>
    String(row.label || "").toLowerCase().includes(metricSearch.toLowerCase())
  );

  const detailTotalPages = Math.max(1, Math.ceil(filteredMetricRows.length / DETAIL_PAGE_SIZE));
  const safeDetailPage = Math.min(detailPage, detailTotalPages);
  const pagedDetailRows = filteredMetricRows.slice(
    (safeDetailPage - 1) * DETAIL_PAGE_SIZE,
    safeDetailPage * DETAIL_PAGE_SIZE
  );

  const hasMeaningfulData =
    (summary?.totalPlots ?? 0) > 0 ||
    (summary?.uploadedDocuments ?? 0) > 0 ||
    (summary?.interestedBuyers ?? 0) > 0 ||
    (summary?.paymentsReceived ?? summary?.totalRevenue ?? 0) > 0 ||
    (summary?.pendingRevenue ?? 0) > 0;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Project Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            {analytics.projectName || "Project"} performance overview
          </p>
        </div>
        <div className="w-full lg:max-w-xl space-y-2">
          <label className="text-xs text-gray-600 block">Search & select plot</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={plotSearchInput}
              onChange={(e) => setPlotSearchInput(e.target.value)}
              placeholder="Plot number, direction, size, price, status…"
              className="w-full border border-blue-100 bg-blue-50/60 rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <select
            value={plotFilter}
            onChange={(e) => setPlotFilter(e.target.value)}
            className="w-full border border-blue-100 bg-blue-50/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            {filteredPlotDropdownOptions.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.label}
              </option>
            ))}
          </select>
          {plotSearchNoMatch ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
              No plot matched your search. Try another term or choose &quot;All Plots&quot;.
            </p>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <AnalyticsSkeleton cards={8} />
      ) : isError ? (
        <AnalyticsErrorState message={error?.message || "Unable to load project analytics."} />
      ) : !hasMeaningfulData ? (
        <AnalyticsEmptyState
          title="No analytics data yet"
          description="Add plots, payments, buyers or documents to populate this analytics section."
        />
      ) : (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {metricConfig.map((metric) => (
              <button
                key={metric.key}
                type="button"
                onClick={() => setSelectedMetric(metric.key)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  selectedMetric === metric.key
                    ? "border-blue-300 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm"
                }`}
              >
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide leading-tight">
                  {metric.title}
                </p>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-0.5 break-words">
                  {metric.value}
                </h3>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Documents Uploaded</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{summary.uploadedDocuments}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Payment Documents</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{summary.paymentDocuments}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Assigned Users</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{summary.assignedUsers}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Interested Buyers</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{summary.interestedBuyers}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Pending Amount</p>
              <p className="text-base font-semibold text-amber-700">{money(summary.pendingRevenue)}</p>
            </div>
          </div>

          {plotFilter !== "All Plots" && analytics.selectedPlotDetails ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
              <h3 className="text-base font-semibold text-gray-900">
                Plot #{analytics.selectedPlotDetails.plotnumber} Insights
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Price: {money(analytics.selectedPlotDetails.plotprice)} | Direction:{" "}
                {analytics.selectedPlotDetails.plotdirection} | Status:{" "}
                {analytics.selectedPlotDetails.plotstatus} | Interested Buyers:{" "}
                {summary.interestedBuyers}
              </p>
            </div>
          ) : null}

          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                {selectedMetricCard?.title} Details
              </h3>
              <input
                value={metricSearch}
                onChange={(e) => setMetricSearch(e.target.value)}
                placeholder="Filter rows…"
                className="border border-blue-100 rounded-lg px-3 py-2 text-sm w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="p-2">Item</th>
                    <th className="p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedDetailRows.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-3 text-gray-500 text-sm">
                        No rows for this filter.
                      </td>
                    </tr>
                  ) : (
                    pagedDetailRows.map((row, index) => (
                      <tr key={`${row.label}-${index}`} className="border-t">
                        <td className="p-2 align-top max-w-[12rem] break-words">{row.label}</td>
                        <td className="p-2 align-top break-words">{row.value}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredMetricRows.length > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-blue-100/80">
                <p className="text-xs text-gray-500">
                  Page {safeDetailPage} of {detailTotalPages}
                  {filteredMetricRows.length > 0
                    ? ` · ${filteredMetricRows.length} row${filteredMetricRows.length !== 1 ? "s" : ""}`
                    : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={safeDetailPage <= 1}
                    onClick={() => setDetailPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-xs rounded-md border bg-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={safeDetailPage >= detailTotalPages}
                    onClick={() => setDetailPage((p) => Math.min(detailTotalPages, p + 1))}
                    className="px-3 py-1.5 text-xs rounded-md border bg-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard
              title="Plot Status Breakdown"
              subtitle="Available vs sold vs reserved"
              data={analytics.plotsByStatus}
            >
              <PieChart>
                <Pie data={analytics.plotsByStatus} dataKey="value" nameKey="name" outerRadius={95} label>
                  {analytics.plotsByStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ChartCard>

            <ChartCard
              title="Payment Status Breakdown"
              subtitle="Success and pending amount"
              data={analytics.paymentStatusBreakdown}
            >
              <BarChart data={analytics.paymentStatusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
                <Bar dataKey="value" fill="#2563eb" name="Amount" />
              </BarChart>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard
              title="Payments Received Trend"
              subtitle="Monthly success vs pending"
              data={analytics.revenueTrend}
            >
              <AreaChart data={analytics.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  fill="#93c5fd"
                  name="Payments Received"
                />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" fill="#fde68a" name="Pending" />
              </AreaChart>
            </ChartCard>

            <ChartCard
              title="Plot Direction Distribution"
              subtitle="Direction-wise inventory"
              data={analytics.directionDistribution}
            >
              <BarChart data={analytics.directionDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#14b8a6" name="Plots" />
              </BarChart>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard
              title="Buyer Interest Trend"
              subtitle="Buyer inflow by month"
              data={analytics.buyerInterestTrend}
            >
              <AreaChart data={analytics.buyerInterestTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="buyers" stroke="#16a34a" fill="#86efac" />
              </AreaChart>
            </ChartCard>

            <ChartCard
              title="Plot Size Distribution"
              subtitle="Size bucket counts"
              data={analytics.sizeDistribution}
            >
              <BarChart data={analytics.sizeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8b5cf6" name="Count" />
              </BarChart>
            </ChartCard>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Top Successful Payments Received</h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              Top 10 by amount — successful payments only
            </p>
            {(analytics.topSuccessfulPayments || []).length === 0 ? (
              <p className="text-sm text-gray-500">No successful payments in this scope.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white text-left">
                      <th className="p-2">Plot</th>
                      <th className="p-2">Customer</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics.topSuccessfulPayments || []).map((row) => (
                      <tr key={row.id} className="border-b">
                        <td className="p-2">#{row.plotNumber}</td>
                        <td className="p-2">{row.customer}</td>
                        <td className="p-2">{money(row.amount)}</td>
                        <td className="p-2">{row.status}</td>
                        <td className="p-2 whitespace-nowrap">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-900">Site-wise Breakdown</h3>
              <p className="text-xs text-gray-500 mt-0.5">Per-site plot status split (if site data exists)</p>
            </div>
            {analytics.siteBreakdown?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white text-left">
                      <th className="p-3">Total</th>
                      <th className="p-3">Available</th>
                      <th className="p-3">Sold</th>
                      <th className="p-3">Reserved</th>
                      <th className="p-3">Availability %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.siteBreakdown.map((row) => (
                      <tr key={row.site} className="border-b">
                        <td className="p-3">{row.total}</td>
                        <td className="p-3">{row.available}</td>
                        <td className="p-3">{row.sold}</td>
                        <td className="p-3">{row.reserved}</td>
                        <td className="p-3">
                          {row.total ? ((row.available / row.total) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <AnalyticsEmptyState
                title="Site data not available"
                description="No explicit site/layout fields found for this project's plots."
              />
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Plot Availability Ratio</h3>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              {analytics.availabilityRatio?.toFixed(1) || "0.0"}% of plots are currently available.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, analytics.availabilityRatio || 0)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAnalyticsPage;
