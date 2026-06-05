/** Plot attributes used for AI price estimation (keep in sync with plot.model enums). */

const PLOT_TYPES = [
  "corner",
  "end",
  "middle",
  "park-facing",
  "road-facing",
  "cul-de-sac",
];

const APPROVAL_STATUSES = ["dtcp", "bda", "panchayat", "unapproved", "other"];

const PLOT_TYPE_LABELS = {
  corner: "Corner",
  end: "End",
  middle: "Middle",
  "park-facing": "Park-facing",
  "road-facing": "Road-facing",
  "cul-de-sac": "Cul-de-sac",
};

const APPROVAL_LABELS = {
  dtcp: "DTCP approved",
  bda: "BDA approved",
  panchayat: "Panchayat",
  unapproved: "Unapproved",
  other: "Other",
};

module.exports = {
  PLOT_TYPES,
  APPROVAL_STATUSES,
  PLOT_TYPE_LABELS,
  APPROVAL_LABELS,
};
