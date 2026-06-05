const httpStatus = require("http-status");
const plotService = require("../services/plot.service");
const plotPricePredictionService = require("../services/plotPricePrediction.service");
const deadPlotDetectionService = require("../services/deadPlotDetection.service");
const userService = require("../services/user.service");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { formatDate } = require("../utils/dateUtils");
const { logger } = require("../utils/logger");
const {
  PLOT_TYPE_LABELS,
  APPROVAL_LABELS,
} = require("../constants/plotAiFeatures");

const formatPlot = (plot) => ({
  _id: plot._id,
  projectId: plot.projectid,
  plotnumber: plot.plotnumber,
  plotsize: plot.plotsize,
  plotprice: plot.plotprice,
  plotdirection: plot.plotdirection,
  plotType: plot.plotType || "middle",
  plotTypeLabel: PLOT_TYPE_LABELS[plot.plotType] || plot.plotType || "Middle",
  roadWidthFt: plot.roadWidthFt ?? null,
  approvalStatus: plot.approvalStatus || "unapproved",
  approvalStatusLabel:
    APPROVAL_LABELS[plot.approvalStatus] || plot.approvalStatus || "Unapproved",
  plotstatus: plot.plotstatus,
  assigneduserid: plot.assigneduserid ?? null,
  paymentSummary: plot.paymentSummary || {
    totalSuccessAmount: 0,
    totalPendingAmount: 0,
    installmentCount: 0,
  },
  createdAt: plot.createdAt ? formatDate(plot.createdAt) : null,
  updatedAt: plot.updatedAt ? formatDate(plot.updatedAt) : null,
});

const assertAssignedUserExists = async (assigneduserid) => {
  if (!assigneduserid) return;
  const u = await userService.getUserById(assigneduserid);
  if (!u) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Assigned user not found");
  }
};

const getPlots = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  logger.info("Fetching plots for project", {
    projectId,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  // Convert page and limit to numbers if they exist
  const paginationOptions = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    sortBy: sortBy || "createdAt",
    sortOrder: sortOrder || "desc",
  };

  logger.debug("Pagination options processed", {
    projectId,
    paginationOptions,
  });

  const { plots, pagination } = await plotService.getPlots(
    projectId,
    paginationOptions
  );

  logger.info("Plots fetched successfully", {
    projectId,
    plotCount: plots.length,
    totalPages: pagination.totalPages,
    currentPage: pagination.currentPage,
  });

  res.status(httpStatus.OK).json({
    status: "success",
    pagination,
    data: {
      plots: plots.map(formatPlot),
    },
  });
});

const getDeadPlotHealth = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const data = await deadPlotDetectionService.getProjectPlotHealth(
    projectId,
    req.query
  );

  res.status(httpStatus.OK).json({
    status: "success",
    data,
  });
});

const estimatePlotPrice = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const estimate = await plotPricePredictionService.estimatePlotPrice(
    projectId,
    req.query
  );

  res.status(httpStatus.OK).json({
    status: "success",
    data: { estimate },
  });
});

const createPlot = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const plotData = {
    ...req.body,
    projectid: projectId,
  };

  logger.info("Creating new plot", {
    projectId,
    plotData: {
      plotnumber: plotData.plotnumber,
      plotsize: plotData.plotsize,
      plotprice: plotData.plotprice,
      plotdirection: plotData.plotdirection,
      plotstatus: plotData.plotstatus,
    },
  });

  logger.debug("Plot creation data processed", { projectId, plotData });

  if (plotData.assigneduserid) {
    await assertAssignedUserExists(plotData.assigneduserid);
  }

  const newPlot = await plotService.createPlot(plotData);

  logger.info("Plot created successfully", {
    projectId,
    plotId: newPlot._id,
    plotnumber: newPlot.plotnumber,
  });

  res.status(httpStatus.CREATED).json({
    status: "success",
    data: {
      plot: formatPlot(newPlot),
    },
  });
});

const updatePlot = catchAsync(async (req, res) => {
  const { projectId, plotId } = req.params;
  const plotData = req.body;

  logger.info("Updating plot", {
    projectId,
    plotId,
    updateData: {
      ...plotData,
      // Don't log sensitive data, just the keys being updated
      fields: Object.keys(plotData),
    },
  });

  logger.debug("Plot update request details", { projectId, plotId, plotData });

  if (
    Object.prototype.hasOwnProperty.call(plotData, "assigneduserid") &&
    plotData.assigneduserid
  ) {
    await assertAssignedUserExists(plotData.assigneduserid);
  }

  const updatedPlot = await plotService.updatePlot(projectId, plotId, plotData);

  logger.info("Plot updated successfully", {
    projectId,
    plotId,
    plotnumber: updatedPlot.plotnumber,
  });

  res.status(httpStatus.OK).json({
    status: "success",
    data: {
      plot: formatPlot(updatedPlot),
    },
  });
});

const deletePlot = catchAsync(async (req, res) => {
  const { projectId, plotId } = req.params;

  logger.info("Deleting plot", { projectId, plotId });

  await plotService.deletePlot(projectId, plotId);

  logger.info("Plot deleted successfully", { projectId, plotId });

  res.status(httpStatus.OK).json({
    status: "success",
    data: null,
  });
});

const getAllPlots = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;

  logger.info("Fetching all plots", {
    page,
    limit,
    sortBy,
    sortOrder,
  });

  // Convert page and limit to numbers if they exist
  const paginationOptions = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    sortBy: sortBy || "createdAt",
    sortOrder: sortOrder || "desc",
  };

  logger.debug("Pagination options for all plots", { paginationOptions });

  const { plots, pagination } = await plotService.getAllPlots(
    paginationOptions
  );

  logger.info("All plots fetched successfully", {
    plotCount: plots.length,
    totalPages: pagination.totalPages,
    currentPage: pagination.currentPage,
    totalPlots: pagination.total,
  });

  res.status(httpStatus.OK).json({
    status: "success",
    pagination,
    data: {
      plots: plots.map(formatPlot),
    },
  });
});

module.exports = {
  getPlots,
  getDeadPlotHealth,
  estimatePlotPrice,
  createPlot,
  updatePlot,
  deletePlot,
  getAllPlots,
};
