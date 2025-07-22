const httpStatus = require("http-status");
const plotService = require("../services/plot.service");
const catchAsync = require("../utils/catchAsync");
const { formatDate } = require("../utils/dateUtils");

const getPlots = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  // Convert page and limit to numbers if they exist
  const paginationOptions = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    sortBy: sortBy || "createdAt",
    sortOrder: sortOrder || "desc",
  };

  const { plots, pagination } = await plotService.getPlots(
    projectId,
    paginationOptions
  );

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

  const newPlot = await plotService.createPlot(plotData);

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
  const updatedPlot = await plotService.updatePlot(projectId, plotId, plotData);
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
  await plotService.deletePlot(projectId, plotId);
  res.status(httpStatus.OK).json({
    status: "success",
    data: null,
  });
});

const getAllPlots = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;

  // Convert page and limit to numbers if they exist
  const paginationOptions = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    sortBy: sortBy || "createdAt",
    sortOrder: sortOrder || "desc",
  };

  const { plots, pagination } = await plotService.getAllPlots(
    paginationOptions
  );

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
