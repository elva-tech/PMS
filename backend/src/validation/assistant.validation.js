const Joi = require("joi");

const chat = {
  body: Joi.object().keys({
    projectId: Joi.string().required(),
    message: Joi.string().trim().min(1).max(2000).required(),
    history: Joi.array()
      .items(
        Joi.object({
          role: Joi.string().valid("user", "assistant").required(),
          content: Joi.string().required(),
        })
      )
      .max(40)
      .default([]),
  }),
};

module.exports = { chat };
