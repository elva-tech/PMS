const Joi = require("joi");

const createContact = {
  body: Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    description: Joi.string().required(),
  }),
};

module.exports = {
  createContact,
};
