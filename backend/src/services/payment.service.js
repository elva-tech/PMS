const Payment = require("../models/payment.model");
const Plot = require("../models/plot.model");
const Project = require("../models/project.model");
const User = require("../models/user.model");
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
const buildOrderRef = (plotNo, seq) =>
  `PLOT-${plotNo}-${String(seq).padStart(3, "0")}`;

const resolveUserIdentifiers = async (requestUserId) => {
  const ids = new Set();
  if (requestUserId) ids.add(String(requestUserId));
  const byUserId = requestUserId
    ? await User.findOne({ userid: String(requestUserId) })
        .select("_id userid")
        .lean()
    : null;
  if (byUserId?._id) ids.add(String(byUserId._id));
  if (byUserId?.userid) ids.add(String(byUserId.userid));
  return [...ids];
};

const buildPaymentScope = async ({ projectId, role, requestUserId }) => {
  if (role === "user" && requestUserId) {
    const requesterIds = await resolveUserIdentifiers(requestUserId);
    const assignedPlots = await Plot.find({
      projectid: projectId,
      assigneduserid: { $in: requesterIds },
    })
      .select("_id")
      .lean();
    const plotIds = assignedPlots.map((p) => String(p._id));
    if (!plotIds.length) {
      return { _id: { $in: [] } };
    }
    return { plotid: { $in: plotIds } };
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

  const scopeFilter = await buildPaymentScope({ projectId, role, requestUserId });
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
  // #region agent log
  try {
    typeof fetch === "function" &&
      fetch("http://127.0.0.1:7337/ingest/f2e6f75b-2838-4947-b561-fbd2af5d0e3c", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "d4c373",
        },
        body: JSON.stringify({
          sessionId: "d4c373",
          runId: "pre-fix",
          hypothesisId: "H3",
          location: "backend/src/services/payment.service.js:listPaymentsForProject",
          message: "Payment rows returned by DB",
          data: {
            projectId,
            count: payments.length,
            sample: payments[0]
              ? {
                  paymentId: String(payments[0]._id),
                  useridType: typeof payments[0].userid,
                  userid: payments[0].userid || null,
                  plotid: payments[0].plotid || null,
                  orderId: payments[0].orderId || null,
                  hasDocField: Object.prototype.hasOwnProperty.call(
                    payments[0],
                    "documentId"
                  ),
                }
              : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
  } catch {}
  // #endregion

  // #region agent log
  try {
    typeof fetch === "function" &&
      fetch(
        "http://127.0.0.1:7337/ingest/f2e6f75b-2838-4947-b561-fbd2af5d0e3c",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "b36e33",
          },
          body: JSON.stringify({
            sessionId: "b36e33",
            runId: "pre-fix",
            hypothesisId: "H1",
            location: "backend/src/services/payment.service.js:listPaymentsForProject",
            message: "Payments list payload before enrichment",
            data: {
              projectId,
              paymentCount: payments.length,
              firstPayment: payments[0]
                ? {
                    paymentId: String(payments[0]._id),
                    userid: payments[0].userid,
                    plotid: payments[0].plotid,
                    plotnumber: payments[0].plotnumber,
                    hasOrderId: Boolean(payments[0].orderId),
                  }
                : null,
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
  } catch {}
  // #endregion

  const plotIds = [
    ...new Set(payments.map((p) => p.plotid).filter((id) => Boolean(id))),
  ];
  const plotRows = plotIds.length
    ? await Plot.find({ _id: { $in: plotIds }, projectid: projectId })
        .select("_id assigneduserid")
        .lean()
    : [];
  const assignedIds = [
    ...new Set(plotRows.map((p) => p.assigneduserid).filter((id) => Boolean(id))),
  ];
  const users = assignedIds.length
    ? await User.find({ userid: { $in: assignedIds } })
        .select("userid username")
        .lean()
    : [];
  const usernameByUserId = {};
  users.forEach((u) => {
    usernameByUserId[u.userid] = u.username;
  });
  const plotById = {};
  plotRows.forEach((p) => {
    plotById[String(p._id)] = p;
  });
  const enrichedPayments = payments.map((p) => {
    const plot = p.plotid ? plotById[String(p.plotid)] : null;
    const assignedUserId = plot?.assigneduserid || null;
    return {
      ...p,
      userid: assignedUserId || null,
      assignedUserName: assignedUserId ? usernameByUserId[assignedUserId] || null : null,
    };
  });
  const relevantPlotIds = [
    ...new Set(enrichedPayments.map((p) => String(p.plotid || "")).filter(Boolean)),
  ];
  const normalizedByPaymentId = {};
  if (relevantPlotIds.length) {
    const forNormalization = await Payment.find({
      projectid: projectId,
      ...(scopeFilter || {}),
      plotid: { $in: relevantPlotIds },
    })
      .select("_id plotid plotnumber createdAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean();
    const seqByPlot = {};
    forNormalization.forEach((row) => {
      const plotKey = String(row.plotid || "");
      if (!plotKey) return;
      seqByPlot[plotKey] = (seqByPlot[plotKey] || 0) + 1;
      normalizedByPaymentId[String(row._id)] = buildOrderRef(
        row.plotnumber,
        seqByPlot[plotKey]
      );
    });
  }
  const paymentsWithNormalizedOrder = enrichedPayments.map((p) => ({
    ...p,
    orderId: normalizedByPaymentId[String(p._id)] || p.orderId,
  }));

  const summary = await aggregateSummary(projectId, scopeFilter);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    payments: paymentsWithNormalizedOrder,
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
  documentid = null,
  documentName = null,
}) => {
  if (documentid) {
    const Document = require("../models/document.model");
  
    const doc = await Document.findById(documentid).select("projectid");
  
    if (!doc) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid document");
    }
  
    if (String(doc.projectid) !== String(projectId)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Document does not belong to this project"
      );
    }
  }

  // #region agent log
  try {
    typeof fetch === "function" &&
      fetch(
        "http://127.0.0.1:7337/ingest/f2e6f75b-2838-4947-b561-fbd2af5d0e3c",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "b36e33",
          },
          body: JSON.stringify({
            sessionId: "b36e33",
            runId: "pre-fix",
            hypothesisId: "H2",
            location: "backend/src/services/payment.service.js:createPayment",
            message: "Create payment request",
            data: {
              projectId,
              hasOrderId: Boolean(orderId),
              status,
              userid: userid || null,
              plotid: plotid || null,
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
  } catch {}
  // #endregion

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid status. Use one of: ${allowedStatuses.join(", ")}`
    );
  }

  const plot = await verifyPlotInProject(projectId, plotid);
  const computedOrderId = String(orderId || "").trim();
  if (!computedOrderId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Order reference is required");
  }
  const expectedPrefix = `PLOT-${plot.plotnumber}-`;
  if (!computedOrderId.startsWith(expectedPrefix)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Order reference must match selected plot"
    );
  }

  try {
    const payment = await Payment.create({
      projectid: projectId,
      orderId: computedOrderId,
      amount,
      status,
      userid: plot.assigneduserid || userid || null,
      plotid: String(plotid),
      plotnumber: plot.plotnumber,
      documentid: documentid || null,
      documentName: documentName || null,
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
  amount,
  status,
  userid,
  plotid,
  documentid,
  documentName,
}) => {
  await verifyProjectExists(projectId);

  // #region agent log
  try {
    typeof fetch === "function" &&
      fetch(
        "http://127.0.0.1:7337/ingest/f2e6f75b-2838-4947-b561-fbd2af5d0e3c",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "b36e33",
          },
          body: JSON.stringify({
            sessionId: "b36e33",
            runId: "pre-fix",
            hypothesisId: "H3",
            location: "backend/src/services/payment.service.js:updatePayment",
            message: "Update payment request",
            data: {
              projectId,
              paymentId,
              hasOrderId: false,
              hasAmount: amount !== undefined,
              hasStatus: status !== undefined,
              hasUserId: userid !== undefined,
              hasPlotId: plotid !== undefined,
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
  } catch {}
  // #endregion

  const existing = await Payment.findOne({
    _id: paymentId,
    projectid: projectId,
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }

  const updates = {};

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
      updates.userid = plot.assigneduserid || updates.userid || existing.userid || null;
    }
  }
  if (documentid !== undefined) {
    updates.documentid =
      documentid === null || documentid === "" ? null : String(documentid).trim();
  }
  if (documentName !== undefined) {
    updates.documentName =
      documentName === null || documentName === "" ? null : String(documentName).trim();
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
