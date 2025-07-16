const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof Error)) {
    error = new Error(err);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  // Use error.status, or res.statusCode, or default to 500
  const statusCode =
    err.status || res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  errorConverter,
  errorHandler,
};
