const assistant = {
  name: (process.env.ASSISTANT_NAME || "Project Assistant").trim(),
  tagline: (process.env.ASSISTANT_TAGLINE || "AI assistant for your project").trim(),
  poweredBy: (process.env.ASSISTANT_POWERED_BY || "Powered by AI").trim(),
  fabLabel: (process.env.ASSISTANT_FAB_LABEL || process.env.ASSISTANT_NAME || "AI Help").trim(),
};

module.exports = assistant;
