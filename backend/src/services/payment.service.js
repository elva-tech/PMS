const Payment = require("../models/payment.model");
const Plot = require("../models/plot.model");
const Project = require("../models/project.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const verifyProjectExists = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }
};

const verifyPlotInProject = async (projectId, plotId) => {
  const plot = await Plot.findOne({ _id: plotId, projectid: projectId }).lean();
  if (!plot) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Plot not found in this project"
    );
  }
  return plot;
};

const allowedStatuses = ["Success", "Pending", "Rejected"];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildPaymentScope = ({ role, requestUserId }) => {
  if (role === "user" && requestUserId) {
    return { userid: requestUserId };
  }
  return {};
};

const aggregateSummary = async (projectId, scopeFilter) => {
  const match = { projectid: projectId, ...scopeFilter };
  const rows = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byStatus = {};
  rows.forEach((r) => {
    byStatus[r._id] = {
      totalAmount: r.totalAmount,
      count: r.count,
    };
  });

  let totalSuccessAmount = 0;
  let totalPendingAmount = 0;
  if (byStatus.Success) totalSuccessAmount = byStatus.Success.totalAmount;
  if (byStatus.Pending) totalPendingAmount = byStatus.Pending.totalAmount;

  return {
    totalSuccessAmount,
    totalPendingAmount,
    byStatus,
  };
};

const listPaymentsForProject = async (
  projectId,
  {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    status,
    role,
    requestUserId,
    search,
  }
) => {
  await verifyProjectExists(projectId);

  const scopeFilter = buildPaymentScope({ role, requestUserId });
  const query = { projectid: projectId, ...scopeFilter };

  if (search && String(search).trim()) {
    const term = String(search).trim();
    const or = [{ orderId: { $regex: escapeRegex(term), $options: "i" } }];
    const asNum = Number(term);
    if (Number.isFinite(asNum) && term !== "") {
      or.push({ plotnumber: asNum });
    }
    query.$or = or;
  }

  if (status && status !== "all") {
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid status. Use one of: ${allowedStatuses.join(", ")}`
      );
    }
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const total = await Payment.countDocuments(query);
  const payments = await Payment.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const summary = await aggregateSummary(projectId, scopeFilter);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    payments,
    summary,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords: total,
      hasNextPage: totalPages > 0 && page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const createPayment = async ({
  projectId,
  orderId,
  amount,
  status,
  userid = null,
  plotid,
}) => {
  await verifyProjectExists(projectId);

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid status. Use one of: ${allowedStatuses.join(", ")}`
    );
  }

  const plot = await verifyPlotInProject(projectId, plotid);

  try {
    const payment = await Payment.create({
      projectid: projectId,
      orderId,
      amount,
      status,
      userid: userid || null,
      plotid: String(plotid),
      plotnumber: plot.plotnumber,
    });
    return payment.toObject();
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Payment with this order ID already exists for this project"
      );
    }
    throw err;
  }
};

const updatePayment = async ({
  projectId,
  paymentId,
  orderId,
  amount,
  status,
  userid,
  plotid,
}) => {
  await verifyProjectExists(projectId);

  const existing = await Payment.findOne({
    _id: paymentId,
    projectid: projectId,
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }

  const updates = {};

  if (orderId !== undefined) {
    updates.orderId = String(orderId).trim();
  }
  if (amount !== undefined) {
    updates.amount = amount;
  }
  if (status !== undefined) {
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid status. Use one of: ${allowedStatuses.join(", ")}`
      );
    }
    updates.status = status;
  }
  if (userid !== undefined) {
    updates.userid =
      userid === null || userid === "" ? null : String(userid).trim();
  }
  if (plotid !== undefined) {
    if (plotid === null || plotid === "") {
      updates.plotid = null;
      updates.plotnumber = null;
    } else {
      const plot = await verifyPlotInProject(projectId, plotid);
      updates.plotid = String(plotid);
      updates.plotnumber = plot.plotnumber;
    }
  }

  if (Object.keys(updates).length === 0) {
    return existing.toObject();
  }

  try {
    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, projectid: projectId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    return payment.toObject();
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Payment with this order ID already exists for this project"
      );
    }
    throw err;
  }
};

const deletePayment = async ({ projectId, paymentId }) => {
  await verifyProjectExists(projectId);
  const removed = await Payment.findOneAndDelete({
    _id: paymentId,
    projectid: projectId,
  });
  if (!removed) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }
  return removed.toObject();
};

module.exports = {
  listPaymentsForProject,
  createPayment,
  updatePayment,
  deletePayment,
  allowedStatuses,
};
