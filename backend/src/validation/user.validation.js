const Joi = require("joi");

const createUser = {
  body: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    useremail: Joi.string().email().required(),
    userphone: Joi.string()
      .trim()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone must be exactly 10 digits",
      }),
    userpassword: Joi.string().min(6).required(),
    userstatus: Joi.number().valid(0, 1).default(1), // 0 - inactive, 1 - active
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    username: Joi.string().min(3).max(30).optional(),
    useremail: Joi.string().email().optional(),
    userphone: Joi.string()
      .trim()
      .pattern(/^[0-9]{10}$/)
      .optional()
      .messages({
        "string.pattern.base": "Phone must be exactly 10 digits",
      }),
    userpassword: Joi.string().min(6).optional(),
    userstatus: Joi.number().valid(0, 1).optional(), // 0 - inactive, 1 - active
  }),
};

const getUsers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(10),
    sortBy: Joi.string()
      .valid("createdAt", "updatedAt", "username", "useremail", "userphone")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = {
  createUser,
  updateUser,
  getUsers,
};
