/**
 * Maps Gemini tool names → functions that read Mongo / call AI services.
 * projectId always comes from the chat request (never from LLM args).
 */

const inventory = require("./inventory.tool");
const payments = require("./payments.tool");
const contacts = require("./contacts.tool");
const plotHealth = require("./plotHealth.tool");
const price = require("./price.tool");

const HANDLERS = {
  get_inventory_summary: (projectId) => inventory.getInventorySummary(projectId),
  list_plots: (projectId, args) => inventory.listPlots(projectId, args),
  get_revenue_summary: (projectId) => payments.getRevenueSummary(projectId),
  list_pending_payments: (projectId, args) =>
    payments.listPendingPayments(projectId, args),
  list_interested_buyers: (projectId, args) =>
    contacts.listInterestedBuyers(projectId, args),
  get_plot_health_summary: (projectId, args) =>
    plotHealth.getPlotHealthSummary(projectId, args),
  get_price_suggestion: (projectId, args) =>
    price.getPriceSuggestion(projectId, args),
};

const executeTool = async (name, projectId, args = {}) => {
  const handler = HANDLERS[name];
  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }
  try {
    return await handler(projectId, args || {});
  } catch (err) {
    return {
      error: err.message || "Tool execution failed",
      tool: name,
    };
  }
};

module.exports = { executeTool, HANDLERS };
