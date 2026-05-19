const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeProjects = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.projects)) return payload.projects;
  return [];
};

export const normalizeRows = (payload, key) => {
  const rows = payload?.data?.[key];
  return Array.isArray(rows) ? rows : [];
};

export const paymentStatusKey = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success" || normalized === "successful") return "Success";
  if (normalized === "pending") return "Pending";
  if (normalized === "rejected") return "Rejected";
  return "Unknown";
};

export const getMonthKey = (dateValue) => {
  if (!dateValue) return "Unknown";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const formatMonthLabel = (monthKey) => {
  if (!monthKey || monthKey === "Unknown") return "Unknown";
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

export const detectSiteName = (plot) => {
  if (!plot || typeof plot !== "object") return "Unspecified";
  const candidates = [
    plot.siteName,
    plot.site,
    plot.layout,
    plot.layoutName,
    plot.layoutSection,
    plot.section,
    plot.phase,
    plot.block,
    plot.zone,
  ];
  const match = candidates.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== ""
  );
  return match ? String(match).trim() : "Unspecified";
};

export const getSafeRatio = (part, total) => {
  const totalNumber = toNumber(total);
  if (totalNumber <= 0) return 0;
  return (toNumber(part) / totalNumber) * 100;
};

export const sumBy = (rows, getter) =>
  rows.reduce((acc, row) => acc + toNumber(getter(row)), 0);

export const statusClassFromPayment = (status) => {
  const key = paymentStatusKey(status);
  if (key === "Success") return "success";
  if (key === "Pending") return "pending";
  if (key === "Rejected") return "rejected";
  return "unknown";
};
