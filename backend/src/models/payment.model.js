const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    projectid: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["Success", "Pending", "Rejected"],
    },
    userid: {
      type: String,
      default: null,
      trim: true,
    },
    plotid: {
      type: String,
      default: null,
      trim: true,
    },
    plotnumber: {
      type: Number,
      default: null,
    },
    documentid: {
      type: String,
      default: null,
      trim: true,
    },
    documentName: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ projectid: 1, createdAt: -1 });
paymentSchema.index({ projectid: 1, orderId: 1 }, { unique: true });
paymentSchema.index({ projectid: 1, plotid: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
