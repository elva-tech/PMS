/**
 * One-off seed: insert demo plots for a project layout.
 * Usage: node scripts/seedPlots.js [projectId]
 * Default project: Balaji Layout (467278)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Plot = require("../src/models/plot.model");
const Project = require("../src/models/project.model");

const DEFAULT_PROJECT_ID = "467278";

const DIRECTIONS = [
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTH EAST",
  "NORTH WEST",
  "SOUTH EAST",
  "SOUTH WEST",
];

const PLOT_TYPES = [
  "corner",
  "end",
  "middle",
  "park-facing",
  "road-facing",
  "cul-de-sac",
];

const APPROVALS = ["dtcp", "bda", "panchayat", "unapproved", "other"];

const STATUSES = ["Available", "Available", "Available", "Available", "Reserved", "Sold"];

const SPECS = [
  { size: 1200, price: 5000000, type: "middle", road: 30, approval: "panchayat", dir: 0, status: 0 },
  { size: 1350, price: 5400000, type: "road-facing", road: 40, approval: "dtcp", dir: 1, status: 0 },
  { size: 1500, price: 5850000, type: "corner", road: 45, approval: "bda", dir: 2, status: 0 },
  { size: 1600, price: 6200000, type: "end", road: 35, approval: "dtcp", dir: 3, status: 0 },
  { size: 1650, price: 6500000, type: "park-facing", road: 30, approval: "bda", dir: 4, status: 0 },
  { size: 1700, price: 6800000, type: "cul-de-sac", road: 25, approval: "panchayat", dir: 5, status: 0 },
  { size: 1750, price: 7000000, type: "road-facing", road: 50, approval: "dtcp", dir: 6, status: 1 },
  { size: 1800, price: 7200000, type: "corner", road: 40, approval: "bda", dir: 7, status: 0 },
  { size: 1850, price: 7400000, type: "middle", road: 30, approval: "other", dir: 0, status: 0 },
  { size: 1900, price: 7600000, type: "end", road: 35, approval: "unapproved", dir: 1, status: 0 },
  { size: 1950, price: 7800000, type: "park-facing", road: 30, approval: "dtcp", dir: 2, status: 0 },
  { size: 2000, price: 8000000, type: "road-facing", road: 45, approval: "bda", dir: 3, status: 4 },
  { size: 2050, price: 8200000, type: "corner", road: 40, approval: "panchayat", dir: 4, status: 0 },
  { size: 2100, price: 8400000, type: "cul-de-sac", road: 25, approval: "dtcp", dir: 5, status: 0 },
  { size: 2150, price: 8600000, type: "middle", road: 30, approval: "bda", dir: 6, status: 0 },
  { size: 2200, price: 8800000, type: "end", road: 35, approval: "other", dir: 7, status: 0 },
  { size: 2250, price: 9000000, type: "park-facing", road: 30, approval: "dtcp", dir: 0, status: 0 },
  { size: 2300, price: 9150000, type: "road-facing", road: 50, approval: "bda", dir: 1, status: 5 },
  { size: 2350, price: 9300000, type: "corner", road: 45, approval: "panchayat", dir: 2, status: 0 },
  { size: 2400, price: 9450000, type: "middle", road: 30, approval: "dtcp", dir: 3, status: 0 },
  { size: 2450, price: 9600000, type: "end", road: 35, approval: "unapproved", dir: 4, status: 0 },
  { size: 2500, price: 9750000, type: "cul-de-sac", road: 25, approval: "bda", dir: 5, status: 0 },
  { size: 2550, price: 9850000, type: "road-facing", road: 40, approval: "dtcp", dir: 6, status: 0 },
  { size: 2600, price: 9950000, type: "park-facing", road: 30, approval: "panchayat", dir: 7, status: 0 },
  { size: 2650, price: 10000000, type: "corner", road: 45, approval: "bda", dir: 0, status: 0 },
  { size: 2700, price: 10000000, type: "road-facing", road: 50, approval: "dtcp", dir: 1, status: 0 },
  { size: 2750, price: 9990000, type: "middle", road: 30, approval: "other", dir: 2, status: 0 },
  { size: 2800, price: 9900000, type: "end", road: 35, approval: "bda", dir: 3, status: 0 },
  { size: 3000, price: 10000000, type: "park-facing", road: 40, approval: "dtcp", dir: 4, status: 0 },
];

function buildPlots(projectId, startNumber = 1) {
  return SPECS.map((s, i) => ({
    projectid: projectId,
    plotnumber: startNumber + i,
    plotsize: s.size,
    plotprice: s.price,
    plotdirection: DIRECTIONS[s.dir % DIRECTIONS.length],
    plotType: s.type,
    roadWidthFt: s.road,
    approvalStatus: s.approval,
    plotstatus: STATUSES[s.status % STATUSES.length],
    assigneduserid: null,
  }));
}

async function main() {
  const projectId = process.argv[2] || DEFAULT_PROJECT_ID;
  const count = Number(process.argv[3]) || SPECS.length;

  await mongoose.connect(process.env.MONGODB_URL);

  const project = await Project.findById(projectId);
  if (!project) {
    console.error(`Project not found: ${projectId}`);
    process.exit(1);
  }

  const existing = await Plot.find({ projectid: projectId })
    .sort({ plotnumber: -1 })
    .limit(1)
    .lean();
  const startNumber = existing.length ? existing[0].plotnumber + 1 : 1;

  const plots = buildPlots(projectId, startNumber).slice(0, count);

  const conflicts = await Plot.find({
    projectid: projectId,
    plotnumber: { $in: plots.map((p) => p.plotnumber) },
  }).lean();
  if (conflicts.length) {
    console.error(
      `Plot numbers already exist: ${conflicts.map((c) => c.plotnumber).join(", ")}`
    );
    process.exit(1);
  }

  const inserted = await Plot.insertMany(plots);
  console.log(
    `Inserted ${inserted.length} plots into "${project.name}" (${projectId}), numbers ${startNumber}–${startNumber + inserted.length - 1}`
  );
  console.log(
    `Price range: ₹${(plots[0].plotprice / 100000).toFixed(1)}L – ₹${(plots[plots.length - 1].plotprice / 10000000).toFixed(2)}Cr`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
