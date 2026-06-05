export const PLOT_TYPES = [
  { value: "corner", label: "Corner" },
  { value: "end", label: "End" },
  { value: "middle", label: "Middle" },
  { value: "park-facing", label: "Park-facing" },
  { value: "road-facing", label: "Road-facing" },
  { value: "cul-de-sac", label: "Cul-de-sac" },
];

export const APPROVAL_STATUSES = [
  { value: "dtcp", label: "DTCP approved" },
  { value: "bda", label: "BDA approved" },
  { value: "panchayat", label: "Panchayat" },
  { value: "unapproved", label: "Unapproved" },
  { value: "other", label: "Other" },
];

export const plotTypeLabel = (value) =>
  PLOT_TYPES.find((t) => t.value === value)?.label || value || "—";

export const approvalStatusLabel = (value) =>
  APPROVAL_STATUSES.find((a) => a.value === value)?.label || value || "—";
