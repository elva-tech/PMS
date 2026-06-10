/**
 * Tool definitions sent to Gemini.
 * Each "name" must match a handler in registry.js.
 *
 * projectId is NOT a parameter — Node injects it from the authenticated chat request
 * so the LLM cannot query another project.
 */

const TOOL_DEFINITIONS = [
  {
    name: "get_inventory_summary",
    description:
      "Get plot counts for the current project: available, sold, reserved, and total.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "list_plots",
    description:
      "List plots in the current project. Filter by status (Available, Sold, Reserved), plot type (corner, road-facing, etc.), or a specific plot number.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["Available", "Sold", "Reserved"],
          description: "Plot sale status filter",
        },
        plotType: {
          type: "string",
          description:
            "corner, end, middle, park-facing, road-facing, or cul-de-sac",
        },
        plotNumber: {
          type: "number",
          description: "Single plot number to look up",
        },
        limit: {
          type: "number",
          description: "Max rows to return (default 20, max 50)",
        },
      },
    },
  },
  {
    name: "get_revenue_summary",
    description:
      "Revenue summary for the current project: successful payments total, pending amount, payment counts.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "list_pending_payments",
    description:
      "List payments with Pending status for the current project.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max rows (default 15)" },
      },
    },
  },
  {
    name: "list_interested_buyers",
    description:
      "List interested buyers (contacts with interested=1) for the current project.",
    parameters: {
      type: "object",
      properties: {
        plotNumber: { type: "number", description: "Filter by plot number" },
        limit: { type: "number", description: "Max rows (default 15)" },
      },
    },
  },
  {
    name: "get_plot_health_summary",
    description:
      "AI plot health: counts of Active, Slow, and Dead plots, plus urgent plots needing attention.",
    parameters: {
      type: "object",
      properties: {
        classification: {
          type: "string",
          enum: ["Active", "Slow", "Dead"],
          description: "Filter to one classification",
        },
        plotNumber: {
          type: "number",
          description: "Health detail for one plot number",
        },
      },
    },
  },
  {
    name: "get_price_suggestion",
    description:
      "AI suggested price for a plot by plot number in the current project.",
    parameters: {
      type: "object",
      properties: {
        plotNumber: {
          type: "number",
          description: "Plot number (required)",
        },
      },
      required: ["plotNumber"],
    },
  },
];

module.exports = { TOOL_DEFINITIONS };
