const Joi = require("joi");

const createProject = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    location: Joi.string().required(),
    status: Joi.string()
      .valid("Not Started", "In Progress", "Completed")
      .required(),
    description: Joi.string().required(),
  }),
};

const updateProject = {
  params: Joi.object().keys({
    projectId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    location: Joi.string(),
    status: Joi.string().valid("Not Started", "In Progress", "Completed"),
    description: Joi.string(),
  }),
};

module.exports = {
  createProject,
  updateProject,
};
