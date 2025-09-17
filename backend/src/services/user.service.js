const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Helper function to check if a string is a valid ObjectId
const isValidObjectId = (id) => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
};

// Helper function to build user query
const buildUserQuery = (userId) => {
  if (isValidObjectId(userId)) {
    return { $or: [{ _id: userId }, { userid: userId }] };
  } else {
    return { userid: userId };
  }
};

const createUser = async (userData) => {
  // Hash the password before saving
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.userpassword, saltRounds);

  const user = new User({
    ...userData,
    userpassword: hashedPassword,
    updatedAt: new Date(),
  });

  return user.save();
};

const getUsers = async () => {
  return User.find().select("-userpassword"); // Exclude password from response
};

const getUsersWithPasswords = async () => {
  return User.find(); // Include password for authentication purposes
};

const getUserById = async (userId) => {
  return User.findOne(buildUserQuery(userId)).select("-userpassword"); // Exclude password from response
};

const updateUser = async (userId, updateData) => {
  // If password is being updated, hash it
  if (updateData.userpassword) {
    const saltRounds = 10;
    updateData.userpassword = await bcrypt.hash(
      updateData.userpassword,
      saltRounds
    );
  }

  // Update the updatedAt timestamp
  updateData.updatedAt = new Date();

  return User.findOneAndUpdate(buildUserQuery(userId), updateData, {
    new: true,
  }).select("-userpassword"); // Exclude password from response
};

const deleteUser = async (userId) => {
  return User.findOneAndDelete(buildUserQuery(userId)).select("-userpassword"); // Exclude password from response
};

const getUserByEmail = async (email) => {
  return User.findOne({ useremail: email });
};

const validatePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  createUser,
  getUsers,
  getUsersWithPasswords,
  getUserById,
  updateUser,
  deleteUser,
  getUserByEmail,
  validatePassword,
};
