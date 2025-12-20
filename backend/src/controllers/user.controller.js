const httpStatus = require("http-status");
const userService = require("../services/user.service");
const catchAsync = require("../utils/catchAsync");
const { formatDate } = require("../utils/dateUtils");
const { logger } = require("../utils/logger");

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);

  res.status(httpStatus.CREATED).json({
    status: "success",
    message: "User created successfully",
    data: {
      userid: user.userid,
      username: user.username,
      useremail: user.useremail,
      userstatus: user.userstatus,
      createdAt: formatDate(user.createdAt),
      updatedAt: formatDate(user.updatedAt),
    },
  });
});

const getUsers = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;

  const result = await userService.getUsers({
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    sortBy: sortBy || "createdAt",
    sortOrder: sortOrder || "desc",
  });

  const formattedUsers = result.users.map((user) => ({
    userid: user.userid,
    username: user.username,
    useremail: user.useremail,
    userstatus: user.userstatus,
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
  }));

  res.status(httpStatus.OK).json({
    status: "success",
    message: "Users retrieved successfully",
    data: formattedUsers,
    pagination: result.pagination,
  });
});

const getUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await userService.getUserById(userId);

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: "error",
      message: "User not found",
    });
  }

  res.status(httpStatus.OK).json({
    status: "success",
    message: "User retrieved successfully",
    data: {
      userid: user.userid,
      username: user.username,
      useremail: user.useremail,
      userstatus: user.userstatus,
      createdAt: formatDate(user.createdAt),
      updatedAt: formatDate(user.updatedAt),
    },
  });
});

const updateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await userService.updateUser(userId, req.body);

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: "error",
      message: "User not found",
    });
  }

  res.status(httpStatus.OK).json({
    status: "success",
    message: "User updated successfully",
    data: {
      userid: user.userid,
      username: user.username,
      useremail: user.useremail,
      userstatus: user.userstatus,
      createdAt: formatDate(user.createdAt),
      updatedAt: formatDate(user.updatedAt),
    },
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await userService.deleteUser(userId);

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: "error",
      message: "User not found",
    });
  }

  res.status(httpStatus.OK).json({
    status: "success",
    message: "User deleted successfully",
    data: {
      userid: user.userid,
      username: user.username,
      useremail: user.useremail,
    },
  });
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
