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
const { corsOriginList, applyCorsHeaders } = require("./utils/corsOrigins");

const app = express();

const corsAllowHeaders =
  "Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept";

const corsOptions = {
  origin: corsOriginList,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: corsAllowHeaders.split(", "),
  exposedHeaders: ["Content-Length", "X-Requested-With", "Authorization"],
  optionsSuccessStatus: 204,
};

// Manual CORS first (always sets Access-Control-Allow-Origin when allowed)
app.use((req, res, next) => {
  applyCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", corsAllowHeaders);
    return res.status(204).end();
  }
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env !== "test") {
  app.use(morgan("dev"));
}

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.get("/api/health", (req, res) => {
  applyCorsHeaders(req, res);
  res.status(200).json({
    status: "success",
    message: "API is running",
    cors: Boolean(req.headers.origin && res.getHeader("Access-Control-Allow-Origin")),
    timestamp: new Date().toISOString(),
  });
});

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

app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/plots", plotRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/share-quote", shareQuoteRoutes);

app.all("*", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 404;
  err.statusCode = 404;
  next(err);
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
