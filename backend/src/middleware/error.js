const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof Error)) {
    error = new Error(err);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = {
  errorConverter,
  errorHandler,
};
