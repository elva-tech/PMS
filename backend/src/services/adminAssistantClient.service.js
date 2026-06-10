const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const resolveAdminAssistantUrl = () => {
  const url = (process.env.ADMIN_ASSISTANT_URL || "").trim().replace(/\/$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return "http://127.0.0.1:8002";
};

const ADMIN_ASSISTANT_URL = resolveAdminAssistantUrl();
const TIMEOUT_MS = Number(process.env.ADMIN_ASSISTANT_TIMEOUT_MS) || 60000;

/**
 * One Gemini turn via the Python admin_assistant service.
 */
const completeTurn = async ({ projectId, projectName, messages, tools, system }) => {
  if (!ADMIN_ASSISTANT_URL) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "ADMIN_ASSISTANT_URL is not configured"
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${ADMIN_ASSISTANT_URL}/v1/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        projectName,
        system,
        messages,
        tools,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      isTimeout
        ? "Admin Assistant AI timed out"
        : `Admin Assistant unreachable at ${ADMIN_ASSISTANT_URL}. ${err.message}`
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
      "Admin Assistant returned invalid JSON"
    );
  }

  if (!response.ok) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      payload?.detail || payload?.message || "Admin Assistant request failed"
    );
  }

  return payload;
};

module.exports = { completeTurn, ADMIN_ASSISTANT_URL };
