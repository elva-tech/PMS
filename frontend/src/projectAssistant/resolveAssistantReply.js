import { FALLBACK_SUGGESTIONS, PRESET_QUESTIONS } from "./constants";

const links = (projectId) => ({
  analytics: {
    label: "Open Analytics",
    path: `/project/${projectId}/analytics`,
  },
  plotHealth: {
    label: "Open Plot Health AI",
    path: `/project/${projectId}/plot-health`,
  },
  buyers: {
    label: "View Interested Buyers",
    path: `/project/${projectId}/interestedbuyers`,
  },
  payments: {
    label: "View Payments",
    path: `/project/${projectId}/payments`,
  },
  plots: {
    label: "View Plots",
    path: `/project/${projectId}`,
  },
});

const bulletLines = (lines) => lines.filter(Boolean).join("\n");

const presetHandlers = {
  "urgent-attention": (snap, projectId) => {
    const { health, projectName } = snap;
    if (health.analyzed === 0) {
      return {
        message: `I could not run Plot Health AI for **${projectName}** yet. Based on inventory alone, review available plots with no buyer interest in Interested Buyers.`,
        suggestions: FALLBACK_SUGGESTIONS,
        relatedLinks: [links(projectId).plotHealth, links(projectId).buyers],
      };
    }
    if (health.dead === 0 && health.slow === 0) {
      return {
        message: bulletLines([
          `Good news for **${projectName}** — no Dead or Slow plots flagged right now.`,
          `**${health.active}** plot(s) look healthy in Plot Health AI.`,
          `**${snap.summary.available}** plot(s) still available for sale.`,
        ]),
        suggestions: ["Summarize available inventory", "What is the total revenue of this project?"],
        relatedLinks: [links(projectId).plotHealth],
      };
    }
    const urgent = [
      ...health.deadList.map((p) => `• Plot #${p.plotNumber} — **${p.headline || "Dead"}** (urgent)`),
      ...health.slowList.map((p) => `• Plot #${p.plotNumber} — ${p.headline || "Slow"}`),
    ];
    return {
      message: bulletLines([
        `**${health.dead}** dead and **${health.slow}** slow plot(s) in **${projectName}**:`,
        urgent.join("\n"),
        "",
        "Open Plot Health AI for recommended actions per plot.",
      ]),
      suggestions: [
        "Which plots have interested buyers but no sale?",
        "Summarize available inventory",
      ],
      relatedLinks: [links(projectId).plotHealth, links(projectId).plots],
    };
  },

  "sales-performance": (snap, projectId) => {
    const s = snap.summary;
    const ratio = Math.round((snap.summary.availabilityRatio || 0) * 100);
    return {
      message: bulletLines([
        `**Sales snapshot — ${snap.projectName}**`,
        `• Sold: **${s.sold}** / **${s.totalPlots}** plots`,
        `• Available: **${s.available}** · Reserved: **${s.reserved}**`,
        `• Availability ratio: **${ratio}%**`,
        `• Collected revenue: **${snap.formatMoney(s.totalRevenue)}**`,
        `• Pending payments: **${snap.formatMoney(s.pendingRevenue)}**`,
        `• Outstanding on books: **${snap.formatMoney(s.totalOutstanding)}**`,
      ]),
      suggestions: [
        "What is the total revenue of this project?",
        "Which plots need urgent attention?",
      ],
      relatedLinks: [links(projectId).analytics, links(projectId).payments],
    };
  },

  "interested-no-sale": (snap, projectId) => {
    if (!snap.interestedNoSale.length) {
      return {
        message: bulletLines([
          `No available plots with recorded interested buyers in **${snap.projectName}** right now.`,
          `Total interested buyer records: **${snap.summary.interestedBuyers}**.`,
          "Add or link contacts on plots to track conversion.",
        ]),
        suggestions: ["Which plots need urgent attention?", "Summarize available inventory"],
        relatedLinks: [links(projectId).buyers],
      };
    }
    const lines = snap.interestedNoSale.map(
      (p) => `• ${p.label} — **${p.buyers}** buyer(s), listed at **${snap.formatMoney(p.price)}**, still Available`
    );
    return {
      message: bulletLines([
        `**${snap.interestedNoSale.length}** available plot(s) with buyer interest but no sale:`,
        lines.join("\n"),
        "",
        "Follow up via Interested Buyers or Plot Health AI recommended steps.",
      ]),
      suggestions: ["Which plots need urgent attention?", "How is sales performance in this project?"],
      relatedLinks: [links(projectId).buyers, links(projectId).plotHealth],
    };
  },

  "total-revenue": (snap, projectId) => {
    const s = snap.summary;
    const top = snap.topPayments
      .map((p) => `• Plot #${p.plotNumber} — **${snap.formatMoney(p.amount)}** (${p.customer})`)
      .join("\n");
    return {
      message: bulletLines([
        `**Total collected revenue** for **${snap.projectName}**: **${snap.formatMoney(s.totalRevenue)}**`,
        `Pending: **${snap.formatMoney(s.pendingRevenue)}** · Outstanding: **${snap.formatMoney(s.totalOutstanding)}**`,
        top ? `\nLargest recent payments:\n${top}` : "",
      ]),
      suggestions: ["How is sales performance in this project?", "Summarize available inventory"],
      relatedLinks: [links(projectId).payments, links(projectId).analytics],
    };
  },

  "inventory-summary": (snap, projectId) => {
    const lines = snap.availablePlots.map(
      (p) =>
        `• ${p.label} — **${snap.formatMoney(p.plotPrice)}** (${p.status})`
    );
    return {
      message: bulletLines([
        `**${snap.projectName} inventory**`,
        `• Total plots: **${snap.summary.totalPlots}**`,
        `• Available: **${snap.summary.available}** · Sold: **${snap.summary.sold}** · Reserved: **${snap.summary.reserved}**`,
        snap.availablePlots.length
          ? `\nAvailable plots (sample):\n${lines.join("\n")}`
          : "\nNo available plots listed.",
      ]),
      suggestions: [
        "Which plots need urgent attention?",
        "What is the total revenue of this project?",
      ],
      relatedLinks: [links(projectId).plots, links(projectId).analytics],
    };
  },
};

const matchPresetId = (text) => {
  const normalized = text.trim().toLowerCase();
  const preset = PRESET_QUESTIONS.find(
    (q) =>
      q.id === normalized ||
      q.label.toLowerCase() === normalized ||
      q.shortLabel.toLowerCase() === normalized
  );
  return preset?.id || null;
};

const matchKeywords = (text) => {
  const q = text.toLowerCase();
  if (/urgent|dead|slow|attention|health|stuck/.test(q)) return "urgent-attention";
  if (/revenue|payment|collected|earned|money|sales amount/.test(q)) return "total-revenue";
  if (/performance|sold|sale|conversion|how.*sales/.test(q)) return "sales-performance";
  if (/buyer|interest|inquir|lead|contact/.test(q)) return "interested-no-sale";
  if (/inventory|available|summary|plots|stock/.test(q)) return "inventory-summary";
  if (/outstanding|pending/.test(q)) return "sales-performance";
  if (/document/.test(q)) return null;
  return null;
};

export const resolveAssistantReply = ({ question, snapshot, projectId, brand }) => {
  const presetId = matchPresetId(question) || matchKeywords(question);
  const assistantName = brand?.name || "Project Assistant";

  if (presetId && presetHandlers[presetId]) {
    return {
      type: "answer",
      ...presetHandlers[presetId](snapshot, projectId),
      confidence: "mock-data",
    };
  }

  return {
    type: "fallback",
    message: bulletLines([
      `I'm **${assistantName}** — I help with **${snapshot.projectName}** only.`,
      "I can answer questions about plot inventory, revenue, payments, interested buyers, and plot health.",
      "Your question is outside my current scope. Try one of the suggestions below.",
    ]),
    suggestions: FALLBACK_SUGGESTIONS,
    relatedLinks: [
      links(projectId).analytics,
      links(projectId).plotHealth,
      links(projectId).buyers,
    ],
    confidence: "fallback",
  };
};
