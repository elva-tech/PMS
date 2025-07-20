const ApiError = require("../utils/ApiError");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof Error)) {
    error = new Error(err);
  }

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, false);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (err.stack) {
    console.error(err.stack);
  }
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: err.message || "Internal Server Error",
  });
};

module.exports = {
  errorConverter,
  errorHandler,
};
