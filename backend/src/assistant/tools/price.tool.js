const Plot = require("../../models/plot.model");
const plotPricePrediction = require("../../services/plotPricePrediction.service");

const getPriceSuggestion = async (projectId, args = {}) => {
  const plotNumber = Number(args.plotNumber);
  if (!Number.isFinite(plotNumber)) {
    return { error: "plotNumber is required" };
  }

  const plot = await Plot.findOne({ projectid: projectId, plotnumber: plotNumber }).lean();
  if (!plot) {
    return { error: `Plot #${plotNumber} not found in this project` };
  }

  const estimate = await plotPricePrediction.estimatePlotPrice(projectId, {
    plotsize: plot.plotsize,
    plotType: plot.plotType,
    roadWidthFt: plot.roadWidthFt,
    approvalStatus: plot.approvalStatus,
    plotdirection: plot.plotdirection,
    currentPrice: plot.plotprice,
  });

  return {
    plotNumber,
    currentPrice: plot.plotprice,
    plotSizeSqft: plot.plotsize,
    plotType: plot.plotType,
    suggestion: estimate,
  };
};

module.exports = { getPriceSuggestion };
