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

app.use(cors());
app.options("*", cors());

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

app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/auth", authRoutes);

app.use((req, res, next) => {
  next(new Error("Not found"));
});

app.use(errorConverter);

app.use(errorHandler);

module.exports = app;
