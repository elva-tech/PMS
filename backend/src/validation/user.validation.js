const Joi = require("joi");

const createUser = {
  body: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    useremail: Joi.string().email().required(),
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
    userpassword: Joi.string().min(6).optional(),
    userstatus: Joi.number().valid(0, 1).optional(), // 0 - inactive, 1 - active
  }),
};

module.exports = {
  createUser,
  updateUser,
};
