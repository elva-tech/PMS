const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const resolveAnalyticsUrl = () => {
  const url = (process.env.AI_ANALYTICS_URL || "").trim().replace(/\/$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return "http://127.0.0.1:8000";
};

const AI_ANALYTICS_URL = resolveAnalyticsUrl();

const TIMEOUT_MS = Number(process.env.AI_ANALYTICS_TIMEOUT_MS) || 15000;

/**
 * Plot price prediction is implemented in Python (analytics/), not in Node.
 * This service proxies to the FastAPI regression model.
 */
const estimatePlotPrice = async (projectId, input) => {
  const plotsize = Number(input.plotsize);
  const roadWidthFt = Number(input.roadWidthFt);

  if (!Number.isFinite(plotsize) || plotsize <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Valid plot size is required");
  }
  if (!Number.isFinite(roadWidthFt) || roadWidthFt <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Valid road width (ft) is required");
  }
  if (!input.plotType || !input.approvalStatus) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Plot type and approval status are required for AI prediction"
    );
  }
  const plotdirection = String(input.plotdirection || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
  if (!plotdirection) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Plot direction is required for AI prediction"
    );
  }

  if (!AI_ANALYTICS_URL) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "AI_ANALYTICS_URL is not configured on the server (Python analytics service URL)"
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${AI_ANALYTICS_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: String(projectId),
        plotsize,
        plotType: String(input.plotType).trim().toLowerCase(),
        roadWidthFt,
        approvalStatus: String(input.approvalStatus).trim().toLowerCase(),
        plotdirection,
        ...(input.currentPrice != null && input.currentPrice !== ""
          ? { currentPrice: Number(input.currentPrice) }
          : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      isTimeout
        ? "AI analytics service timed out. Start Python: cd analytics && uvicorn app:app --port 8000"
        : `AI analytics service unreachable at ${AI_ANALYTICS_URL}. ${err.message}`
    );
  } finally {
    clearTimeout(timer);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "AI analytics returned invalid JSON"
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status >= 500 ? httpStatus.SERVICE_UNAVAILABLE : httpStatus.BAD_REQUEST,
      payload?.detail || payload?.message || "AI prediction failed"
    );
  }

  const estimate = payload?.data?.estimate;
  if (!estimate?.suggestedPrice && estimate?.suggestedPrice !== 0) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "AI analytics returned no estimate"
    );
  }

  return {
    ...estimate,
    model: estimate.model || "sklearn_random_forest_regression",
  };
};

module.exports = {
  estimatePlotPrice,
};
