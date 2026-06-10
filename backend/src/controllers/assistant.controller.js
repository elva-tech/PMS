const httpStatus = require("http-status");
const config = require("../config");
const catchAsync = require("../utils/catchAsync");
const assistantChatService = require("../services/assistantChat.service");

const getAssistantConfig = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json({
    status: "success",
    data: config.assistant,
  });
});

const postChat = catchAsync(async (req, res) => {
  const { projectId, message, history } = req.body;
  const result = await assistantChatService.runChat({
    projectId,
    message,
    history,
  });

  res.status(httpStatus.OK).json({
    status: "success",
    data: {
      message: result.message,
      suggestions: result.suggestions,
      relatedLinks: result.relatedLinks,
      toolsUsed: result.toolsUsed,
      projectName: result.projectName,
      meta: result.meta,
    },
  });
});

module.exports = {
  getAssistantConfig,
  postChat,
};
