const Plot = require("../../models/plot.model");
const Project = require("../../models/project.model");

const getInventorySummary = async (projectId) => {
  const project = await Project.findById(projectId).select("name").lean();
  if (!project) {
    return { error: "Project not found" };
  }

  const rows = await Plot.aggregate([
    { $match: { projectid: projectId } },
    { $group: { _id: "$plotstatus", count: { $sum: 1 } } },
  ]);

  const byStatus = { Available: 0, Sold: 0, Reserved: 0 };
  rows.forEach((r) => {
    if (r._id in byStatus) byStatus[r._id] = r.count;
  });

  return {
    projectId,
    projectName: project.name,
    total: byStatus.Available + byStatus.Sold + byStatus.Reserved,
    available: byStatus.Available,
    sold: byStatus.Sold,
    reserved: byStatus.Reserved,
    byStatus,
  };
};

const listPlots = async (projectId, args = {}) => {
  const filter = { projectid: projectId };
  if (args.status) filter.plotstatus = args.status;
  if (args.plotType) filter.plotType = args.plotType;
  if (args.plotNumber != null) filter.plotnumber = Number(args.plotNumber);

  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);

  const plots = await Plot.find(filter)
    .sort({ plotnumber: 1 })
    .limit(limit)
    .select(
      "plotnumber plotsize plotprice plotstatus plotType plotdirection approvalStatus roadWidthFt"
    )
    .lean();

  return {
    projectId,
    count: plots.length,
    plots: plots.map((p) => ({
      plotNumber: p.plotnumber,
      sizeSqft: p.plotsize,
      price: p.plotprice,
      status: p.plotstatus,
      plotType: p.plotType,
      direction: p.plotdirection,
      approval: p.approvalStatus,
      roadWidthFt: p.roadWidthFt,
    })),
  };
};

module.exports = { getInventorySummary, listPlots };
