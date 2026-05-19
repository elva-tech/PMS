/** Backend API origin — set REACT_APP_BASE_URL in Vercel env (or .env.production at build time). */
const PRODUCTION_API = "https://pms-cdo3.onrender.com";

export const BASE_URL =
  process.env.REACT_APP_BASE_URL ||
  (process.env.NODE_ENV === "production" ? PRODUCTION_API : "http://localhost:5000");
