const Joi = require("joi");

const plotTypeValues = [
  "corner",
  "end",
  "middle",
  "park-facing",
  "road-facing",
  "cul-de-sac",
];

const approvalStatusValues = ["dtcp", "bda", "panchayat", "unapproved", "other"];

const plotDirectionValues = [
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTH EAST",
  "NORTH WEST",
  "SOUTH EAST",
  "SOUTH WEST",
];

const plotTypeSchema = Joi.string().valid(...plotTypeValues).required();

const approvalStatusSchema = Joi.string().valid(...approvalStatusValues).required();

const roadWidthFtSchema = Joi.number().min(1).max(200).required();

const aiFeatureFields = {
  plotType: plotTypeSchema,
  roadWidthFt: roadWidthFtSchema,
  approvalStatus: approvalStatusSchema,
};

const createPlot = {
  params: Joi.object().keys({
    projectId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    plotnumber: Joi.number().required(),
    plotsize: Joi.number().required(),
    plotprice: Joi.number().required(),
    plotdirection: Joi.string().required(),
    ...aiFeatureFields,
    plotstatus: Joi.string()
      .valid("Available", "Sold", "Reserved")
      .default("Available"),
    assigneduserid: Joi.string().trim().allow(null, ""),
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
    plotType: Joi.string().valid(...plotTypeValues),
    roadWidthFt: Joi.number().min(1).max(200),
    approvalStatus: Joi.string().valid(...approvalStatusValues),
    plotstatus: Joi.string().valid("Available", "Sold", "Reserved"),
    assigneduserid: Joi.string().trim().allow(null, ""),
  }),
};

const estimatePlotPrice = {
  params: Joi.object().keys({
    projectId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    plotsize: Joi.number().positive().required(),
    plotType: plotTypeSchema,
    roadWidthFt: roadWidthFtSchema,
    approvalStatus: approvalStatusSchema,
    plotdirection: Joi.string()
      .valid(...plotDirectionValues)
      .required(),
    currentPrice: Joi.number().min(0).optional(),
  }),
};

const deadPlotHealth = {
  params: Joi.object().keys({
    projectId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    classification: Joi.string().valid("Dead", "Slow", "Active").optional(),
    plotId: Joi.string().optional(),
    plotNumber: Joi.number().integer().optional(),
  }),
};

module.exports = {
  createPlot,
  updatePlot,
  estimatePlotPrice,
  deadPlotHealth,
};
