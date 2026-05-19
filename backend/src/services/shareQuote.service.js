const httpStatus = require("http-status");
const Plot = require("../models/plot.model");
const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getPlotWithProject = async (plotId) => {
  const plot = await Plot.findById(plotId).lean();
  if (!plot) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid plot selected");
  }
  const project = await Project.findById(plot.projectid).lean();
  if (!project) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Project not found for selected plot");
  }
  return { plot, project };
};

const buildShareQuoteMessage = ({ buyerName, plot, project }) => {
  const safeName = String(buyerName || "Customer").trim() || "Customer";
  return [
    `Hello ${safeName},`,
    "",
    `Thank you for your interest in ${project?.name || "our project"}.`,
    "",
    `Plot No: ${plot?.plotnumber ?? "-"}`,
    `Size: ${plot?.plotsize ?? "-"} sqft`,
    `Direction: ${plot?.plotdirection || "-"}`,
    `Price: ${formatCurrency(plot?.plotprice)}`,
    "",
    `For more details contact ${project?.name ? `${project.name}` : "SJD Developers"}${project?.contactNumber ? ` (${project.contactNumber})` : ""}.`,
  ].join("\n");
};

const previewShareQuote = async ({ plotId, buyerDetails = {} }) => {
  const { plot, project } = await getPlotWithProject(plotId);
  const message = buildShareQuoteMessage({
    buyerName: buyerDetails?.fullName,
    plot,
    project,
  });
  return {
    message,
    plot: {
      id: String(plot._id),
      plotnumber: plot.plotnumber,
      plotsize: plot.plotsize,
      plotdirection: plot.plotdirection,
      plotprice: plot.plotprice,
      plotstatus: plot.plotstatus,
      projectid: plot.projectid,
    },
    project: {
      id: String(project._id),
      name: project.name,
      contactNumber: project.contactNumber,
      location: project.location,
    },
  };
};

module.exports = {
  previewShareQuote,
  getPlotWithProject,
  buildShareQuoteMessage,
};
