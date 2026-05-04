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
  },
  { timestamps: true }
);

documentSchema.index({ projectid: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
