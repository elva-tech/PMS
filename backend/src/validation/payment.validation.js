const Joi = require("joi");

const listPayments = {
  params: Joi.object({
    projectId: Joi.string().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(10),
    status: Joi.string()
      .valid("all", "Success", "Pending", "Rejected")
      .default("all"),
    sortBy: Joi.string().valid("createdAt", "amount").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null),
  }),
};

const createPayment = {
  params: Joi.object({
    projectId: Joi.string().required(),
  }),
  body: Joi.object({
    orderId: Joi.string().trim().required(),
    amount: Joi.number().min(0).required(),
    status: Joi.string().valid("Success", "Pending", "Rejected").required(),
    userid: Joi.string().trim().allow(null, ""),
    plotid: Joi.string().trim().required(),
  }),
};

const updatePayment = {
  params: Joi.object({
    projectId: Joi.string().required(),
    paymentId: Joi.string().required(),
  }),
  body: Joi.object({
    orderId: Joi.string().trim(),
    amount: Joi.number().min(0),
    status: Joi.string().valid("Success", "Pending", "Rejected"),
    userid: Joi.string().trim().allow(null, ""),
    plotid: Joi.string().trim().allow(null, ""),
  })
    .or("orderId", "amount", "status", "userid", "plotid")
    .messages({
      "object.missing":
        "Provide at least one of: orderId, amount, status, userid, plotid",
    }),
};

const deletePayment = {
  params: Joi.object({
    projectId: Joi.string().required(),
    paymentId: Joi.string().required(),
  }),
};

module.exports = {
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
};
