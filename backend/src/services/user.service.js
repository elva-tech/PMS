const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const normalizePhoneDigits = (phone) =>
  String(phone || "").replace(/\D/g, "");

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
  const normalizedPhone = normalizePhoneDigits(userData.userphone);
  const dup = await User.findOne({ userphone: normalizedPhone });
  if (dup) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "This phone number is already registered"
    );
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.userpassword, saltRounds);

  const user = new User({
    ...userData,
    userphone: normalizedPhone,
    userpassword: hashedPassword,
    updatedAt: new Date(),
  });

  return user.save();
};

const getUsers = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Create sort object
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get total count of users
    const total = await User.countDocuments();

    // Get paginated and sorted users (excluding password)
    const users = await User.find({})
      .select("-userpassword")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Return paginated result with metadata
    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    throw error;
  }
};

const getUsersWithPasswords = async () => {
  return User.find(); // Include password for authentication purposes
};

const getUserById = async (userId) => {
  return User.findOne(buildUserQuery(userId)).select("-userpassword"); // Exclude password from response
};

const updateUser = async (userId, updateData) => {
  const patch = { ...updateData };

  if (patch.userphone !== undefined) {
    const normalizedPhone = normalizePhoneDigits(patch.userphone);
    patch.userphone = normalizedPhone;
    const target = await User.findOne(buildUserQuery(userId))
      .select("userid")
      .lean();
    if (!target) {
      return null;
    }
    const conflict = await User.findOne({ userphone: normalizedPhone })
      .select("userid")
      .lean();
    if (conflict && conflict.userid !== target.userid) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "This phone number is already registered"
      );
    }
  }

  if (patch.userpassword) {
    const saltRounds = 10;
    patch.userpassword = await bcrypt.hash(patch.userpassword, saltRounds);
  }

  patch.updatedAt = new Date();

  return User.findOneAndUpdate(buildUserQuery(userId), patch, {
    new: true,
  }).select("-userpassword"); // Exclude password from response
};

const deleteUser = async (userId) => {
  return User.findOneAndDelete(buildUserQuery(userId)).select("-userpassword"); // Exclude password from response
};

const getUserByEmail = async (email) => {
  return User.findOne({ useremail: email });
};

const getUserByPhone = async (phoneDigits) => {
  const normalized = normalizePhoneDigits(phoneDigits);
  if (!normalized) return null;
  return User.findOne({ userphone: normalized });
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
  getUserByPhone,
  normalizePhoneDigits,
  validatePassword,
};
