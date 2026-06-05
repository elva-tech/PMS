const mongoose = require("mongoose");

const plotSchema = new mongoose.Schema({
  projectid: {
    type: String,
    ref: "Project",
    required: true,
  },
  plotnumber: {
    type: Number,
    required: true,
    trim: true,
  },
  plotsize: {
    type: Number,
    required: true,
    trim: true,
  },
  plotprice: {
    type: Number,
    required: true,
    trim: true,
  },
  plotdirection: {
    type: String,
    required: true,
    trim: true,
  },
  plotType: {
    type: String,
    enum: [
      "corner",
      "end",
      "middle",
      "park-facing",
      "road-facing",
      "cul-de-sac",
    ],
    default: "middle",
    trim: true,
  },
  /** Width of the road facing the plot (feet) — key feature for price models */
  roadWidthFt: {
    type: Number,
    min: 1,
    default: null,
  },
  approvalStatus: {
    type: String,
    enum: ["dtcp", "bda", "panchayat", "unapproved", "other"],
    default: "unapproved",
    trim: true,
  },
  plotstatus: {
    type: String,
    required: true,
    enum: ["Available", "Sold", "Reserved"],
    default: "Available",
  },
  assigneduserid: {
    type: String,
    default: null,
    trim: true,
  },
}, { timestamps: true });

plotSchema.index({ projectid: 1, plotnumber: 1 }, { unique: true });

const Plot = mongoose.model("Plot", plotSchema);

module.exports = Plot;
