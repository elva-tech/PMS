const Plot = require("../models/plot.model");
const Project = require("../models/project.model");
const Payment = require("../models/payment.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const verifyProjectExists = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }
  return true;
};

const assertPlotNumberAvailable = async (
  projectId,
  plotnumber,
  excludePlotId = null
) => {
  const num = Number(plotnumber);
  if (!Number.isFinite(num)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid plot number");
  }

  const filter = { projectid: projectId, plotnumber: num };
  if (excludePlotId) {
    filter._id = { $ne: excludePlotId };
  }

  const existing = await Plot.findOne(filter).select("_id plotnumber").lean();
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Plot number ${num} already exists in this project`
    );
  }
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

    if (plots.length > 0) {
      const plotIdStrings = plots.map((p) => String(p._id));
      const paymentAgg = await Payment.aggregate([
        {
          $match: {
            projectid: projectId,
            plotid: { $in: plotIdStrings },
          },
        },
        {
          $group: {
            _id: "$plotid",
            totalSuccessAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "Success"] }, "$amount", 0],
              },
            },
            totalPendingAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "Pending"] }, "$amount", 0],
              },
            },
            installmentCount: { $sum: 1 },
          },
        },
      ]);
      const byPlot = {};
      paymentAgg.forEach((row) => {
        byPlot[row._id] = {
          totalSuccessAmount: row.totalSuccessAmount,
          totalPendingAmount: row.totalPendingAmount,
          installmentCount: row.installmentCount,
        };
      });
      plots.forEach((plot) => {
        const key = String(plot._id);
        plot.paymentSummary = byPlot[key] || {
          totalSuccessAmount: 0,
          totalPendingAmount: 0,
          installmentCount: 0,
        };
      });
    }

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
  await assertPlotNumberAvailable(plotData.projectid, plotData.plotnumber);
  try {
    return await Plot.create(plotData);
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Plot number ${plotData.plotnumber} already exists in this project`
      );
    }
    throw err;
  }
};

const updatePlot = async (projectId, plotId, plotData) => {
  await verifyProjectExists(projectId);

  const existing = await Plot.findOne({ _id: plotId, projectid: projectId });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plot not found in this project");
  }

  if (
    Object.prototype.hasOwnProperty.call(plotData, "plotnumber") &&
    plotData.plotnumber != null
  ) {
    await assertPlotNumberAvailable(projectId, plotData.plotnumber, plotId);
  }

  const updateOps = {};
  const setData = { ...plotData };

  if (Object.prototype.hasOwnProperty.call(plotData, "assigneduserid")) {
    if (
      plotData.assigneduserid === null ||
      plotData.assigneduserid === "" ||
      plotData.assigneduserid === undefined
    ) {
      updateOps.$unset = { assigneduserid: "" };
      delete setData.assigneduserid;
    }
  }

  if (Object.keys(setData).length) {
    updateOps.$set = setData;
  }

  if (!updateOps.$set && !updateOps.$unset) {
    return existing;
  }

  const mongoUpdate = {};
  if (updateOps.$set) mongoUpdate.$set = updateOps.$set;
  if (updateOps.$unset) mongoUpdate.$unset = updateOps.$unset;

  try {
    return await Plot.findOneAndUpdate(
      { _id: plotId, projectid: projectId },
      mongoUpdate,
      { new: true }
    );
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Plot number ${plotData.plotnumber} already exists in this project`
      );
    }
    throw err;
  }
};

const deletePlot = async (projectId, plotId) => {
  await verifyProjectExists(projectId);
  const deleted = await Plot.findOneAndDelete({
    _id: plotId,
    projectid: projectId,
  });
  if (!deleted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plot not found in this project");
  }
  return deleted;
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
