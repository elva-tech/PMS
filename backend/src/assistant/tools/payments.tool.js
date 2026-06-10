const Payment = require("../../models/payment.model");

const getRevenueSummary = async (projectId) => {
  const rows = await Payment.aggregate([
    { $match: { projectid: projectId } },
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    Success: { totalAmount: 0, count: 0 },
    Pending: { totalAmount: 0, count: 0 },
    Rejected: { totalAmount: 0, count: 0 },
  };
  rows.forEach((r) => {
    if (summary[r._id]) {
      summary[r._id] = { totalAmount: r.totalAmount, count: r.count };
    }
  });

  return {
    projectId,
    successfulPayments: summary.Success.count,
    successfulRevenue: summary.Success.totalAmount,
    pendingPayments: summary.Pending.count,
    pendingAmount: summary.Pending.totalAmount,
    rejectedPayments: summary.Rejected.count,
  };
};

const listPendingPayments = async (projectId, args = {}) => {
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 30);

  const payments = await Payment.find({
    projectid: projectId,
    status: "Pending",
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("orderId amount plotnumber status createdAt")
    .lean();

  return {
    projectId,
    count: payments.length,
    payments: payments.map((p) => ({
      orderId: p.orderId,
      amount: p.amount,
      plotNumber: p.plotnumber,
      status: p.status,
    })),
  };
};

module.exports = { getRevenueSummary, listPendingPayments };
