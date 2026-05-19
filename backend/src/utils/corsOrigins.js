const defaultAllowedOrigins = [
  "https://pms-phi-nine.vercel.app",
  "http://localhost:3000",
  "http://localhost:2025",
];

const envAllowedOrigins = (
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  process.env.CORS_ORIGINS ||
  ""
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
};

const applyCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  const isDev = process.env.NODE_ENV !== "production";

  if (origin && (isDev || isAllowedOrigin(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
};

module.exports = {
  isAllowedOrigin,
  applyCorsHeaders,
};
