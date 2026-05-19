const Joi = require("joi");

const previewShareQuote = {
  body: Joi.object().keys({
    plotId: Joi.string().required(),
    buyer: Joi.object()
      .keys({
        fullName: Joi.string().required(),
        phone: Joi.string().required(),
        email: Joi.string().email().required(),
      })
      .required(),
  }),
};

const createPublicInterestedBuyer = {
  body: Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    description: Joi.string().trim().allow("").optional().default(""),
    projectId: Joi.string().required(),
    plotid: Joi.string().required(),
  }),
};

module.exports = {
  previewShareQuote,
  createPublicInterestedBuyer,
};
