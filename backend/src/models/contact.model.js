const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  interested: {
    type: Number,
    default: 1,
  },
  projectId: {
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
  source: {
    type: String,
    enum: ["ADMIN", "WEBSITE"],
    default: "ADMIN",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

contactSchema.index({ projectId: 1, plotid: 1, phone: 1, source: 1 });

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
