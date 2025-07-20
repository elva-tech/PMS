const Plot = require("../models/plot.model");
const Project = require("../models/project.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const verifyProjectExists = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }
  return true;
};

const getPlots = async (projectId) => {
  return Plot.find({ projectid: projectId });
};

const createPlot = async (plotData) => {
  await verifyProjectExists(plotData.projectid);
  return Plot.create(plotData);
};

const updatePlot = async (projectId, plotId, plotData) => {
  await verifyProjectExists(projectId);
  return Plot.findByIdAndUpdate(plotId, plotData, { new: true });
};

const deletePlot = async (projectId, plotId) => {
  await verifyProjectExists(projectId);
  return Plot.findByIdAndDelete(plotId);
};

const getAllPlots = async () => {
  return Plot.find();
};

module.exports = {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  verifyProjectExists,
  getAllPlots,
};
