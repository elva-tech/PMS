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
const { isAllowedOrigin, applyCorsHeaders } = require("./utils/corsOrigins");

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const corsAllowHeaders =
  "Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept";

app.use((req, res, next) => {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", corsAllowHeaders);
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const isDev =
        config.env === "development" || process.env.NODE_ENV === "development";
      if (isDev || isAllowedOrigin(origin)) {
        return callback(null, origin);
      }
      console.warn("CORS rejected origin:", origin);
      return callback(new Error(`CORS not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: corsAllowHeaders.split(", "),
    exposedHeaders: ["Content-Length", "X-Requested-With", "Authorization"],
  })
);

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
