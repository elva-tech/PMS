const httpStatus = require("http-status");

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin" || req.user?.type !== "admin") {
    return res.status(httpStatus.FORBIDDEN).json({
      status: "error",
      message: "Admin access required",
    });
  }
  next();
};

module.exports = requireAdmin;
