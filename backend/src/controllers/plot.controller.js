const httpStatus = require("http-status");
const plotService = require("../services/plot.service");
const catchAsync = require("../utils/catchAsync");
const { formatDate } = require("../utils/dateUtils");
const { logger } = require("../utils/logger");

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
      plots: plots.map((plot) => ({
        _id: plot._id,
        projectId: plot.projectid,
        plotnumber: plot.plotnumber,
        plotsize: plot.plotsize,
        plotprice: plot.plotprice,
        plotdirection: plot.plotdirection,
        plotstatus: plot.plotstatus,
        createdAt: formatDate(plot.createdAt),
        updatedAt: formatDate(plot.updatedAt),
      })),
    },
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

  const newPlot = await plotService.createPlot(plotData);

  logger.info("Plot created successfully", {
    projectId,
    plotId: newPlot._id,
    plotnumber: newPlot.plotnumber,
  });

  res.status(httpStatus.CREATED).json({
    status: "success",
    data: {
      plot: {
        _id: newPlot._id,
        projectId: newPlot.projectid,
        plotnumber: newPlot.plotnumber,
        plotsize: newPlot.plotsize,
        plotprice: newPlot.plotprice,
        plotdirection: newPlot.plotdirection,
        plotstatus: newPlot.plotstatus,
        createdAt: formatDate(newPlot.createdAt),
        updatedAt: formatDate(newPlot.updatedAt),
      },
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

  const updatedPlot = await plotService.updatePlot(projectId, plotId, plotData);

  logger.info("Plot updated successfully", {
    projectId,
    plotId,
    plotnumber: updatedPlot.plotnumber,
  });

  res.status(httpStatus.OK).json({
    status: "success",
    data: {
      plot: {
        _id: updatedPlot._id,
        projectId: updatedPlot.projectid,
        plotnumber: updatedPlot.plotnumber,
        plotsize: updatedPlot.plotsize,
        plotprice: updatedPlot.plotprice,
        plotdirection: updatedPlot.plotdirection,
        plotstatus: updatedPlot.plotstatus,
        createdAt: formatDate(updatedPlot.createdAt),
        updatedAt: formatDate(updatedPlot.updatedAt),
      },
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
      plots: plots.map((plot) => ({
        _id: plot._id,
        projectId: plot.projectid,
        plotnumber: plot.plotnumber,
        plotsize: plot.plotsize,
        plotprice: plot.plotprice,
        plotdirection: plot.plotdirection,
        plotstatus: plot.plotstatus,
        createdAt: formatDate(plot.createdAt),
        updatedAt: formatDate(plot.updatedAt),
      })),
    },
  });
});

module.exports = {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  getAllPlots,
};
