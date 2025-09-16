const mongoose = require("mongoose");
const crypto = require("crypto");

const generateUUID = () => {
  return crypto.randomUUID();
};

const userSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    default: generateUUID,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  useremail: {
    type: String,
    required: true,
    trim: true,
  },
  userpassword: {
    type: String,
    required: true,
    trim: true,
  },
  userstatus: {
    type: Number,
    required: true,
    enum: [0, 1], // 0 - inactive, 1 - active
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
