const Joi = require("joi");
const { getProjectById } = require("../services/project.service");

const createPlot = {
  params: Joi.object().keys({
    projectId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    plotnumber: Joi.number().required(),
    plotsize: Joi.number().required(),
    plotprice: Joi.number().required(),
    plotdirection: Joi.string().required(),
    plotstatus: Joi.string()
      .valid("Available", "Sold", "Reserved")
      .default("Available"),
  }),
};

const updatePlot = {
  params: Joi.object().keys({
    projectId: Joi.string().required(),
    plotId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    plotnumber: Joi.number(),
    plotsize: Joi.number(),
    plotprice: Joi.number(),
    plotdirection: Joi.string(),
    plotstatus: Joi.string()
      .valid("Available", "Sold", "Reserved")
      .default("Available"),
  }),
};

module.exports = {
  createPlot,
  updatePlot,
};
