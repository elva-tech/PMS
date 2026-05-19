const express = require("express");
const cors = require("cors");
const httpStatus = require("http-status");
const config = require("./config");
const morgan = require("morgan");
const contactRoutes = require("./routes/contact.routes");
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const plotRoutes = require("./routes/plot.routes");
const userRoutes = require("./routes/user.routes");
const documentRoutes = require("./routes/document.routes");
const paymentRoutes = require("./routes/payment.routes");
const publicRoutes = require("./routes/public.routes");
const shareQuoteRoutes = require("./routes/shareQuote.routes");
const { errorConverter, errorHandler } = require("./middleware/error");

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// CORS — browser blocks responses without Access-Control-Allow-Origin for cross-origin XHR.
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
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  // Vercel production + preview URLs (e.g. pms-phi-nine.vercel.app, pms-xxx-team.vercel.app)
  if (/^https:\/\/[\w.-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (config.env === "development" || process.env.NODE_ENV === "development") {
      return callback(null, true);
    }
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn("CORS rejected origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-HTTP-Method-Override",
    "Accept",
  ],
  exposedHeaders: ["Content-Length", "X-Requested-With", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Development logging
if (config.env !== "test") {
  app.use(morgan("dev"));
}

// Production logging
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${res.statusCode}`);
    next();
  });
}

// API Health Check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Root route for API information
app.get(["/", "/api"], (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Real Estate Management System API",
    version: "1.0.0",
    documentation: {
      description: "Available API Endpoints",
      endpoints: {
        health: "/api/health",
        auth: "/api/v1/auth",
        contact: "/api/v1/contact",
      },
    },
    serverTime: new Date().toISOString(),
  });
});

// API routes
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/plots", plotRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/share-quote", shareQuoteRoutes);

// Handle undefined routes
app.all("*", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 404;
  err.statusCode = 404;
  next(err);
});

app.use(errorConverter);

app.use(errorHandler);

module.exports = app;
