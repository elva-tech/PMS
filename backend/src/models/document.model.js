const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    projectid: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    assignedUserIds: {
      type: [String],
      default: [],
    },
    plotid: {
      type: String,
      default: null,
      trim: true,
    },
    /** One file for every plot in the project; plotid is null when true. */
    allPlots: {
      type: Boolean,
      default: false,
    },
    documentType: {
      type: String,
      trim: true,
      default: "other",
    },
    otherLabel: {
      type: String,
      default: "",
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

documentSchema.index({ projectid: 1, createdAt: -1 });
documentSchema.index({ projectid: 1, plotid: 1 });
documentSchema.index({ projectid: 1, allPlots: 1 });
documentSchema.index({ projectid: 1, documentType: 1 });

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
