export const PRESET_QUESTIONS = [
  {
    id: "urgent-attention",
    label: "Which plots need urgent attention?",
    shortLabel: "Urgent plots",
  },
  {
    id: "sales-performance",
    label: "How is sales performance in this project?",
    shortLabel: "Sales performance",
  },
  {
    id: "interested-no-sale",
    label: "Which plots have interested buyers but no sale?",
    shortLabel: "Buyers, no sale",
  },
  {
    id: "total-revenue",
    label: "What is the total revenue of this project?",
    shortLabel: "Total revenue",
  },
  {
    id: "inventory-summary",
    label: "Summarize available inventory",
    shortLabel: "Inventory summary",
  },
];

export const FALLBACK_SUGGESTIONS = [
  "Which plots need urgent attention?",
  "What is the total revenue of this project?",
  "Summarize available inventory",
];

export const storageKey = (projectId) =>
  `project-assistant-chat-${String(projectId)}`;

export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
