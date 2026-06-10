/**
 * Agent orchestration loop (runs in Node).
 *
 * 1. Send user message + history to Python/Gemini
 * 2. If Gemini returns tool_calls → run tools against Mongo → send results back
 * 3. Repeat until Gemini returns final text (max rounds)
 */

const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const Project = require("../models/project.model");
const { TOOL_DEFINITIONS } = require("../assistant/tools/definitions");
const { executeTool } = require("../assistant/tools/registry");
const adminAssistantClient = require("./adminAssistantClient.service");

const MAX_TOOL_ROUNDS = 6;

const DEFAULT_SUGGESTIONS = [
  "Summarize available inventory",
  "What is the total revenue of this project?",
  "Which plots need urgent attention?",
  "Show pending payments",
];

const buildSystemPrompt = (projectId, projectName) =>
  `You are the Admin Assistant for project "${projectName}" (id: ${projectId}). Use tools for facts. Answer in plain English with ₹ for money.`;

const relatedLinksForTools = (projectId, toolsUsed) => {
  const links = [];
  const add = (path, label) => {
    if (!links.some((l) => l.path === path)) links.push({ path, label });
  };

  if (toolsUsed.some((t) => t.includes("plot_health"))) {
    add(`/project/${projectId}/plot-health`, "Plot Health AI");
  }
  if (toolsUsed.some((t) => t.includes("payment") || t.includes("revenue"))) {
    add(`/project/${projectId}/payments`, "Payments");
  }
  if (toolsUsed.some((t) => t.includes("buyer") || t.includes("interested"))) {
    add(`/project/${projectId}/interested-buyers`, "Interested buyers");
  }
  if (toolsUsed.some((t) => t.includes("plot") || t.includes("inventory"))) {
    add(`/project/${projectId}/plots`, "Plots");
  }
  add(`/project/${projectId}/analytics`, "Analytics");
  return links.slice(0, 4);
};

const runChat = async ({ projectId, message, history = [] }) => {
  const project = await Project.findById(projectId).select("name").lean();
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }

  const projectName = project.name || "Project";
  const messages = [
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const toolsUsed = [];
  let geminiModel = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const turn = await adminAssistantClient.completeTurn({
      projectId,
      projectName,
      system: buildSystemPrompt(projectId, projectName),
      messages,
      tools: TOOL_DEFINITIONS,
    });

    if (turn.model) geminiModel = turn.model;

    if (turn.type === "message" && turn.content) {
      return {
        message: turn.content,
        suggestions: DEFAULT_SUGGESTIONS,
        relatedLinks: relatedLinksForTools(projectId, toolsUsed),
        toolsUsed,
        projectName,
        meta: { provider: "gemini", model: geminiModel || turn.model },
      };
    }

    if (turn.type !== "tool_calls" || !turn.calls?.length) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        "Assistant returned an unexpected response"
      );
    }

    const toolResults = [];
    for (const call of turn.calls) {
      toolsUsed.push(call.name);
      const result = await executeTool(call.name, projectId, call.args || {});
      toolResults.push({ name: call.name, result });
    }

    messages.push({ role: "assistant", toolCalls: turn.calls });
    messages.push({ role: "tool", toolResults });
  }

  throw new ApiError(
    httpStatus.SERVICE_UNAVAILABLE,
    "Assistant needed too many steps — try a simpler question"
  );
};

module.exports = { runChat };
