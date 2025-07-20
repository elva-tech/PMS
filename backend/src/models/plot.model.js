const mongoose = require("mongoose");

const plotSchema = new mongoose.Schema({
  projectid: {
    type: mongoose.Schema.Types.ObjectId,
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
  plotstatus: {
    type: String,
    required: true,
    enum: ["Available", "Sold", "Reserved"],
    default: "Available",
  },
});

const Plot = mongoose.model("Plot", plotSchema);

module.exports = Plot;
