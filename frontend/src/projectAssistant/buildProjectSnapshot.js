import { money } from "./constants";

export const buildProjectSnapshot = (analytics, plotHealth) => {
  const summary = analytics?.summary || {};
  const plots = analytics?.plotInventoryRows || [];
  const contacts = Number(summary.interestedBuyers) || 0;

  const healthPlots = plotHealth?.plots || [];
  const deadPlots = healthPlots.filter((p) => p.classification === "Dead");
  const slowPlots = healthPlots.filter((p) => p.classification === "Slow");
  const activePlots = healthPlots.filter((p) => p.classification === "Active");

  const availablePlots = plots.filter((p) => p.status === "Available");
  const soldPlots = plots.filter((p) => p.status === "Sold");

  const contactsByPlot = {};
  (plotHealth?.plots || []).forEach((p) => {
    const key = String(p.plotNumber ?? "");
    if (key) contactsByPlot[key] = p.features?.interestedBuyers ?? 0;
  });

  const plotNumberFromLabel = (label) =>
    String(label || "").replace(/^Plot #/i, "").trim();

  const interestedNoSale = availablePlots
    .filter((p) => (contactsByPlot[plotNumberFromLabel(p.label)] || 0) > 0)
    .map((p) => ({
      label: p.label,
      buyers: contactsByPlot[plotNumberFromLabel(p.label)] || 0,
      price: p.plotPrice,
    }));

  return {
    projectId: analytics?.projectId,
    projectName: analytics?.projectName || "This project",
    summary: {
      totalPlots: summary.totalPlots ?? plots.length,
      available: summary.availablePlots ?? 0,
      sold: summary.soldPlots ?? 0,
      reserved: summary.reservedPlots ?? 0,
      totalRevenue: summary.totalRevenue ?? 0,
      pendingRevenue: summary.pendingRevenue ?? 0,
      totalOutstanding: summary.totalOutstanding ?? 0,
      interestedBuyers: contacts,
      availabilityRatio: analytics?.availabilityRatio ?? 0,
    },
    health: {
      analyzed: healthPlots.length,
      dead: deadPlots.length,
      slow: slowPlots.length,
      active: activePlots.length,
      deadList: deadPlots.slice(0, 5).map((p) => ({
        plotNumber: p.plotNumber,
        headline: p.customerView?.headline,
      })),
      slowList: slowPlots.slice(0, 5).map((p) => ({
        plotNumber: p.plotNumber,
        headline: p.customerView?.headline,
      })),
    },
    interestedNoSale,
    availablePlots: availablePlots.slice(0, 8),
    soldPlots: soldPlots.length,
    topPayments: (analytics?.topSuccessfulPayments || []).slice(0, 3),
    formatMoney: money,
  };
};
