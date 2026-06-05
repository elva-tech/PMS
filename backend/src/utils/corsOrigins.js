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

/** RegExp + strings for the `cors` package static origin list */
const corsOriginList = [
  ...defaultAllowedOrigins,
  ...envAllowedOrigins,
  /^https:\/\/[a-z0-9][a-z0-9-]*\.vercel\.app$/i,
  /^https:\/\/[a-z0-9][a-z0-9-]*-[a-z0-9][a-z0-9-]*\.vercel\.app$/i,
];

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  if (defaultAllowedOrigins.includes(origin)) return true;
  if (envAllowedOrigins.includes(origin)) return true;
  return corsOriginList.some(
    (entry) => entry instanceof RegExp && entry.test(origin)
  );
};

const applyCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
};

module.exports = {
  corsOriginList,
  isAllowedOrigin,
  applyCorsHeaders,
};
