const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const paymentService = require("../services/payment.service");
const { formatDate } = require("../utils/dateUtils");

const listPayments = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { page, limit, status, sortBy, sortOrder, search } = req.query;

  const role = req.user?.role || req.user?.type;
  const requestUserId = req.user?.userid;

  const { payments, pagination, summary } =
    await paymentService.listPaymentsForProject(projectId, {
      page,
      limit,
      status,
      sortBy,
      sortOrder,
      role,
      requestUserId,
      search: search || undefined,
    });

  res.status(httpStatus.OK).json({
    status: "success",
    pagination,
    data: {
      summary,
      payments: payments.map((p) => ({
        _id: p._id,
        projectid: p.projectid,
        orderId: p.orderId,
        amount: p.amount,
        status: p.status,
        userid: p.userid,
        plotid: p.plotid ?? null,
        plotnumber: p.plotnumber ?? null,
        createdAt: formatDate(p.createdAt),
        updatedAt: formatDate(p.updatedAt),
      })),
    },
  });
});

const createPayment = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { orderId, amount, status, userid, plotid } = req.body;

  const payment = await paymentService.createPayment({
    projectId,
    orderId,
    amount,
    status,
    userid: userid || null,
    plotid,
  });

  res.status(httpStatus.CREATED).json({
    status: "success",
    data: {
      payment: {
        _id: payment._id,
        projectid: payment.projectid,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        userid: payment.userid,
        plotid: payment.plotid ?? null,
        plotnumber: payment.plotnumber ?? null,
        createdAt: formatDate(payment.createdAt),
        updatedAt: formatDate(payment.updatedAt),
      },
    },
  });
});

const updatePayment = catchAsync(async (req, res) => {
  const { projectId, paymentId } = req.params;
  const { orderId, amount, status, userid, plotid } = req.body;

  const payment = await paymentService.updatePayment({
    projectId,
    paymentId,
    orderId,
    amount,
    status,
    userid,
    plotid,
  });

  res.status(httpStatus.OK).json({
    status: "success",
    data: {
      payment: {
        _id: payment._id,
        projectid: payment.projectid,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        userid: payment.userid,
        plotid: payment.plotid ?? null,
        plotnumber: payment.plotnumber ?? null,
        createdAt: formatDate(payment.createdAt),
        updatedAt: formatDate(payment.updatedAt),
      },
    },
  });
});

const deletePayment = catchAsync(async (req, res) => {
  const { projectId, paymentId } = req.params;
  await paymentService.deletePayment({ projectId, paymentId });
  res.status(httpStatus.OK).json({
    status: "success",
    data: null,
  });
});

module.exports = {
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
};
