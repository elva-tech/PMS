// Converts any error to a standard format (ApiError)
const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof Error)) {
    error = new Error(err);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = {
  errorConverter,
  errorHandler,
};
