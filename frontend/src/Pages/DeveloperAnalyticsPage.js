import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import sjdlogo1 from "../Images/sjd-logo1.png";
import { ArrowLeft } from "lucide-react";
import ChartCard from "../Components/analytics/ChartCard";
import BreadcrumbNav from "../Components/BreadcrumbNav";
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsSkeleton,
} from "../Components/analytics/AnalyticsStates";
import { useDeveloperAnalytics } from "../hooks/useAnalyticsHooks";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#6b7280", "#8b5cf6"];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const number = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const DEV_DETAIL_PAGE_SIZE = 10;

const DeveloperAnalyticsPage = () => {
  const navigate = useNavigate();
  const { summary, isLoading, isError, error, ...analytics } = useDeveloperAnalytics();
  const [selectedMetric, setSelectedMetric] = useState("totalProjects");
  const [search, setSearch] = useState("");
  const [detailPage, setDetailPage] = useState(1);

  const metricConfig = useMemo(
    () => [
      {
        key: "totalProjects",
        title: "Total Projects",
        value: number(summary?.totalProjects),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: row.projectName,
        })),
      },
      {
        key: "totalPlots",
        title: "Total Plots",
        value: number(summary?.totalPlots),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: number(row.plots),
        })),
      },
      {
        key: "availablePlots",
        title: "Available Plots",
        value: number(summary?.totalAvailablePlots),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: number(row.availablePlots),
        })),
      },
      {
        key: "soldPlots",
        title: "Sold Plots",
        value: number(summary?.totalSoldPlots),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: number(row.soldPlots),
        })),
      },
      {
        key: "reservedPlots",
        title: "Reserved Plots",
        value: number(summary?.totalReservedPlots),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: number(row.reservedPlots),
        })),
      },
      {
        key: "totalRevenue",
        title: "Payments Received",
        value: money(summary?.totalPaymentsReceived ?? summary?.totalRevenue),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: money(row.paymentsReceived ?? row.revenue),
        })),
      },
      {
        key: "totalPlotValue",
        title: "Total Plot Value",
        value: money(summary?.totalPlotValue),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: money(row.totalPlotValue),
        })),
      },
      {
        key: "outstanding",
        title: "Outstanding Amount",
        value: money(summary?.totalOutstanding),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: money(row.totalOutstanding),
        })),
      },
      {
        key: "pendingRevenue",
        title: "Pending Amount",
        value: money(summary?.totalPendingRevenue),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: money(row.pendingRevenue),
        })),
      },
      {
        key: "paymentsCount",
        title: "Payments Count",
        value: number(summary?.totalPaymentsCount),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: number(row.paymentsCount),
        })),
      },
      {
        key: "interested",
        title: "Interested Buyers",
        value: number(summary?.totalInterestedBuyers),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: number(row.interestedBuyers),
        })),
      },
      {
        key: "registeredUsers",
        title: "Registered Users",
        value: number(summary?.totalRegisteredUsers),
        rows: (analytics.projectStats || []).map((row) => ({
          label: row.projectName,
          value: number(row.assignedUsers),
        })),
      },
    ],
    [analytics.projectStats, summary]
  );

  const selected = metricConfig.find((item) => item.key === selectedMetric) || metricConfig[0];
  const filteredRows = (selected?.rows || []).filter((row) =>
    String(row.label || "").toLowerCase().includes(search.toLowerCase())
  );

  const detailTotalPages = Math.max(1, Math.ceil(filteredRows.length / DEV_DETAIL_PAGE_SIZE));
  const safeDetailPage = Math.min(detailPage, detailTotalPages);
  const pagedDetailRows = filteredRows.slice(
    (safeDetailPage - 1) * DEV_DETAIL_PAGE_SIZE,
    safeDetailPage * DEV_DETAIL_PAGE_SIZE
  );

  useEffect(() => {
    setDetailPage(1);
  }, [selectedMetric, search]);

  return (
    <>
      <nav className="bg-blue-700 border-b border-white shadow-md fixed top-0 left-0 w-full z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <img src={sjdlogo1} alt="SJD Logo" className="h-8" />
            <h1 className="text-lg font-bold text-white">Abhi Developers</h1>
          </div>
        </div>
      </nav>
      <div className="bg-gradient-to-b from-blue-700 to-white pt-4 text-center pb-12 mt-10 min-h-screen">
        <div className="container mx-auto p-6 mt-2 text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Developer Analytics</h1>
              <p className="text-blue-100 text-sm mt-1">Cross-project business insights</p>
            </div>
            <div className="bg-white/90 backdrop-blur border border-blue-100 rounded-xl p-1 shadow-lg w-fit">
              <button
                type="button"
                onClick={() => navigate("/project")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-md transition"
              >
                <ArrowLeft size={18} />
                Back to Projects
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-2xl p-4 md:p-6">
            <BreadcrumbNav
              items={[
                { label: "Projects", to: "/project" },
                { label: "Developer Analytics" },
              ]}
              className="mb-4 pb-3 border-b border-gray-100"
            />
            {isLoading ? (
              <AnalyticsSkeleton cards={8} />
            ) : isError ? (
              <AnalyticsErrorState message={error?.message || "Something went wrong."} />
            ) : !summary?.totalProjects ? (
              <AnalyticsEmptyState
                title="No projects available"
                description="Create at least one project to view developer analytics."
              />
            ) : (
              <div className="space-y-5 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {metricConfig.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedMetric(item.key)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        selectedMetric === item.key
                          ? "border-blue-300 bg-blue-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm"
                      }`}
                    >
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{item.title}</p>
                      <h3 className="text-2xl font-semibold text-gray-900 mt-1">{item.value}</h3>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Documents Uploaded</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {number(summary?.totalDocumentsUploaded)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Payment Documents</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {number(summary?.totalPaymentDocumentsUploaded)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Assigned Users (plots)</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {number(
                        (analytics.projectStats || []).reduce(
                          (acc, row) => acc + (Number(row.assignedUsers) || 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Interested Buyers</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {number(summary?.totalInterestedBuyers)}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {selected?.title} by Project
                    </h3>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search project..."
                      className="border border-blue-100 rounded-lg px-3 py-2 text-sm w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="p-2">Project</th>
                          <th className="p-2">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedDetailRows.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="p-3 text-sm text-gray-500">
                              No rows match your search.
                            </td>
                          </tr>
                        ) : (
                          pagedDetailRows.map((row, index) => (
                            <tr key={`${row.label}-${index}`} className="border-t">
                              <td className="p-2 font-medium text-gray-700">{row.label}</td>
                              <td className="p-2 text-gray-900">{row.value}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredRows.length > 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-blue-100/80">
                      <p className="text-xs text-gray-500">
                        Page {safeDetailPage} of {detailTotalPages}
                        {filteredRows.length > 0
                          ? ` · ${filteredRows.length} row${filteredRows.length !== 1 ? "s" : ""}`
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
                    title="Project-wise Payments Received"
                    subtitle="Successful payments only"
                    data={analytics.projectRevenue}
                  >
                    <BarChart data={analytics.projectRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip formatter={(value) => money(value)} />
                      <Legend />
                      <Bar dataKey="value" name="Payments Received">
                        {analytics.projectRevenue.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartCard>

                  <ChartCard
                    title="Payment Status Breakdown"
                    subtitle="Success vs pending amount per project"
                    data={analytics.projectPaymentStatus}
                  >
                    <BarChart data={analytics.projectPaymentStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip formatter={(value) => money(value)} />
                      <Legend />
                      <Bar dataKey="Success" stackId="a" fill="#16a34a" name="Success Amount" />
                      <Bar dataKey="Pending" stackId="a" fill="#f59e0b" name="Pending Amount" />
                    </BarChart>
                  </ChartCard>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <ChartCard
                    title="Monthly Payments Received Trend"
                    subtitle="Success payments month-over-month"
                    data={analytics.monthlyRevenueTrend}
                  >
                    <LineChart data={analytics.monthlyRevenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => money(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                        name="Payments Received"
                      />
                    </LineChart>
                  </ChartCard>
                  <ChartCard
                    title="Monthly Buyer Interest Trend"
                    subtitle="Lead inflow over time"
                    data={analytics.monthlyBuyerInterestTrend}
                  >
                    <AreaChart data={analytics.monthlyBuyerInterestTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [number(value), name]} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#16a34a"
                        fill="#86efac"
                        name="Interested Buyers"
                      />
                    </AreaChart>
                  </ChartCard>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <ChartCard
                    title="Project-wise Plot Distribution"
                    subtitle="Total plots per project"
                    data={analytics.projectPlotDistribution}
                  >
                    <BarChart data={analytics.projectPlotDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip formatter={(value, name, props) => [number(value), props.payload.name]} />
                      <Legend />
                      <Bar dataKey="total" name="Plots" fill="#8b5cf6" />
                    </BarChart>
                  </ChartCard>
                  <ChartCard
                    title="Project-wise Plot Status"
                    subtitle="Available, sold and reserved by project"
                    data={analytics.projectPlotStatus}
                  >
                    <BarChart data={analytics.projectPlotStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="available" stackId="a" fill="#16a34a" name="Available" />
                      <Bar dataKey="sold" stackId="a" fill="#2563eb" name="Sold" />
                      <Bar dataKey="reserved" stackId="a" fill="#f59e0b" name="Reserved" />
                    </BarChart>
                  </ChartCard>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase">Top Performing Project</p>
                    <p className="text-base font-semibold mt-1">{analytics.topPerformingProject || "N/A"}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase">Highest Payments Received</p>
                    <p className="text-base font-semibold mt-1">{analytics.highestRevenueProject || "N/A"}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase">Most Interested Project</p>
                    <p className="text-base font-semibold mt-1">{analytics.mostInterestedProject || "N/A"}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase">Plot Availability Ratio</p>
                    <p className="text-base font-semibold mt-1">{`${Number(summary?.plotAvailabilityRatio ?? 0).toFixed(1)}%`}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DeveloperAnalyticsPage;
