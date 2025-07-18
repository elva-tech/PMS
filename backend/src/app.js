const express = require("express");
const cors = require("cors");
const httpStatus = require("http-status");
const config = require("./config");
const morgan = require("morgan");
const contactRoutes = require("./routes/contact.routes");
const authRoutes = require("./routes/auth.routes");
const { errorConverter, errorHandler } = require("./middleware/error");

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  optionsSuccessStatus: 200,
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
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/auth", authRoutes);

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
