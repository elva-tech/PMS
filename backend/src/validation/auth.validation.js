const Joi = require("joi");

const login = {
  body: Joi.object({
    username: Joi.string().required().messages({
      "string.empty": "Phone number is required",
      "any.required": "Phone number is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  }),
};

module.exports = {
  login,
};
