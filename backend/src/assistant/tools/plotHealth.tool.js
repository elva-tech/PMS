const deadPlotDetection = require("../../services/deadPlotDetection.service");

const getPlotHealthSummary = async (projectId, args = {}) => {
  const query = {};
  if (args.classification) query.classification = args.classification;
  if (args.plotNumber != null) query.plotNumber = args.plotNumber;

  const data = await deadPlotDetection.getProjectPlotHealth(projectId, query);

  const summary = data?.summary || {};
  const plots = data?.plots || (data?.plot ? [data.plot] : []);

  return {
    projectId,
    analyzed: summary.analyzed ?? plots.length,
    active: summary.active ?? 0,
    slow: summary.slow ?? 0,
    dead: summary.dead ?? 0,
    plots: plots.slice(0, 15).map((p) => ({
      plotNumber: p.plotNumber,
      classification: p.classification,
      headline: p.customerView?.headline,
      interestedBuyers: p.features?.interestedBuyers,
      pricePerSqft: p.features?.pricePerSqft,
    })),
  };
};

module.exports = { getPlotHealthSummary };
