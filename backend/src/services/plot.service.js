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

const getPlots = async (
  projectId,
  { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = {}
) => {
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Create sort object
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get total count of plots for the project
    const total = await Plot.countDocuments({ projectid: projectId });

    // Get paginated and sorted plots
    const plots = await Plot.find({ projectid: projectId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Return paginated result with metadata
    return {
      plots,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    throw error;
  }
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

const getAllPlots = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
} = {}) => {
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Create sort object
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get total count of plots
    const total = await Plot.countDocuments();

    // Get paginated and sorted plots
    const plots = await Plot.find().sort(sort).skip(skip).limit(limit).lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Return paginated result with metadata
    return {
      plots,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  verifyProjectExists,
  getAllPlots,
};
