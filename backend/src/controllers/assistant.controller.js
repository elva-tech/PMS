const httpStatus = require("http-status");
const config = require("../config");
const catchAsync = require("../utils/catchAsync");

const getAssistantConfig = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json({
    status: "success",
    data: config.assistant,
  });
});

module.exports = {
  getAssistantConfig,
};
