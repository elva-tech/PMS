const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const resolveDeadPlotUrl = () => {
  const url = (process.env.DEAD_PLOT_AI_URL || "").trim().replace(/\/$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return "http://127.0.0.1:8001";
};

const DEAD_PLOT_AI_URL = resolveDeadPlotUrl();
const TIMEOUT_MS = Number(process.env.DEAD_PLOT_AI_TIMEOUT_MS) || 20000;

const getProjectPlotHealth = async (projectId, query = {}) => {
  if (!DEAD_PLOT_AI_URL) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "DEAD_PLOT_AI_URL is not configured (dead plot Python service URL)"
    );
  }

  const params = new URLSearchParams();
  if (query.classification) params.set("classification", String(query.classification));
  if (query.plotId) params.set("plot_id", String(query.plotId));
  if (query.plotNumber != null && query.plotNumber !== "") {
    params.set("plot_number", String(query.plotNumber));
  }

  const qs = params.toString();
  const url = `${DEAD_PLOT_AI_URL}/dead-plot/project/${encodeURIComponent(projectId)}${qs ? `?${qs}` : ""}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { method: "GET", signal: controller.signal });
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      isTimeout
        ? "Dead plot AI service timed out. Start: cd dead_plot_detection && uvicorn app:app --port 8001"
        : `Dead plot AI unreachable at ${DEAD_PLOT_AI_URL}. ${err.message}`
    );
  } finally {
    clearTimeout(timer);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Dead plot AI returned invalid JSON");
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || "Dead plot analysis failed";
    const isNotFound =
      response.status === 404 ||
      /not found|no analyzable plots/i.test(String(detail));
    throw new ApiError(
      response.status >= 500
        ? httpStatus.SERVICE_UNAVAILABLE
        : isNotFound
          ? httpStatus.NOT_FOUND
          : httpStatus.BAD_REQUEST,
      detail
    );
  }

  return payload?.data || payload;
};

module.exports = {
  getProjectPlotHealth,
};
