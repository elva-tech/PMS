import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import {
  detectSiteName,
  formatMonthLabel,
  getMonthKey,
  getSafeRatio,
  normalizeProjects,
  normalizeRows,
  paymentStatusKey,
  sumBy,
} from "../utils/analytics";

const extractRows = (response, key) => {
  const payload = response?.data || {};
  const nested = payload?.data?.[key];
  const direct = payload?.[key];
  if (Array.isArray(nested)) return nested;
  if (Array.isArray(direct)) return direct;
  const fallback = normalizeRows(payload, key);
  return Array.isArray(fallback) ? fallback : [];
};

const fetchPaginated = async (url, params = {}, key = "rows") => {
  const allRows = [];
  let page = 1;
  let hasNext = true;
  const maxIterations = 100;
  let iteration = 0;

  while (hasNext && iteration < maxIterations) {
    // Keep a high limit to reduce requests and avoid N+1 amplification.
    const response = await axiosInstance.get(url, {
      params: { page, limit: 500, ...params },
    });
    const pageRows = extractRows(response, key);
    allRows.push(...pageRows);
    const pagination = response?.data?.pagination || {};
    hasNext = Boolean(pagination.hasNextPage);
    page += 1;
    iteration += 1;
    if (!pagination.hasNextPage && pageRows.length < 500) hasNext = false;
  }

  return allRows;
};

const buildProjectAnalytics = ({
  project,
  plots,
  payments,
  documents,
  contacts,
  users,
  selectedPlotId,
}) => {
  const normalizedPlotId = selectedPlotId || "All Plots";
  const projectId = String(project?._id || project?.id || "");

  const siteScopedPlots = plots;

  const scopedPlots =
    normalizedPlotId === "All Plots"
      ? siteScopedPlots
      : siteScopedPlots.filter((plot) => String(plot._id || "") === String(normalizedPlotId));

  const scopedPlotIds = new Set(scopedPlots.map((plot) => String(plot._id)));

  const scopedPayments =
    normalizedPlotId === "All Plots"
      ? payments
      : payments.filter((payment) => scopedPlotIds.has(String(payment.plotid || "")));
  const scopedDocuments =
    normalizedPlotId === "All Plots"
      ? documents
      : documents.filter(
          (doc) =>
            doc.allPlots ||
            scopedPlotIds.has(String(doc.plotid || ""))
        );

  const scopedContacts =
    normalizedPlotId === "All Plots"
      ? contacts
      : contacts.filter((contact) => {
          const contactPlotId = String(contact?.plotid || "");
          if (contactPlotId && scopedPlotIds.has(contactPlotId)) return true;
          if (!scopedPlots.length) return false;
          const description = String(contact?.description || "").toLowerCase();
          return scopedPlots.some((plot) =>
            description.includes(`plot #${String(plot.plotnumber || "").toLowerCase()}`)
          );
        });

  const plotsByStatus = scopedPlots.reduce(
    (acc, plot) => {
      const key = String(plot.plotstatus || "Unknown");
      if (key === "Available" || key === "Sold" || key === "Reserved") {
        acc[key] += 1;
      } else {
        acc.Unknown += 1;
      }
      return acc;
    },
    { Available: 0, Sold: 0, Reserved: 0, Unknown: 0 }
  );

  const paymentsByStatus = scopedPayments.reduce(
    (acc, payment) => {
      const key = paymentStatusKey(payment.status);
      acc[key] = (acc[key] || 0) + (Number(payment.amount) || 0);
      return acc;
    },
    { Success: 0, Pending: 0, Unknown: 0 }
  );

  const monthlyRevenueMap = {};
  scopedPayments.forEach((payment) => {
    const month = getMonthKey(payment.createdAtISO || payment.createdAt);
    if (!monthlyRevenueMap[month]) monthlyRevenueMap[month] = { revenue: 0, pending: 0 };
    if (paymentStatusKey(payment.status) === "Success") {
      monthlyRevenueMap[month].revenue += Number(payment.amount) || 0;
    } else if (paymentStatusKey(payment.status) === "Pending") {
      monthlyRevenueMap[month].pending += Number(payment.amount) || 0;
    }
  });

  const revenueTrend = Object.entries(monthlyRevenueMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month: formatMonthLabel(month),
      revenue: value.revenue,
      pending: value.pending,
    }));

  const monthlyInterestMap = {};
  scopedContacts.forEach((contact) => {
    const month = getMonthKey(contact.createdAtISO || contact.createdAt);
    monthlyInterestMap[month] = (monthlyInterestMap[month] || 0) + 1;
  });

  const buyerInterestTrend = Object.entries(monthlyInterestMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month: formatMonthLabel(month),
      buyers: value,
    }));

  const directionDistribution = scopedPlots.reduce((acc, plot) => {
    const key = String(plot.plotdirection || "Unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const sizeDistribution = scopedPlots.reduce((acc, plot) => {
    const rawSize = Number(plot.plotsize);
    const key = Number.isFinite(rawSize) ? `${rawSize}` : "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const plotById = {};
  scopedPlots.forEach((plot) => {
    plotById[String(plot._id)] = plot;
  });
  const usernameByUserId = {};
  (users || []).forEach((u) => {
    if (u?.userid) usernameByUserId[String(u.userid)] = u.username || "";
  });

  const plotSales = scopedPlots.map((plot) => {
    const plotId = String(plot._id || "");
    const successful = scopedPayments
      .filter(
        (payment) =>
          String(payment.plotid || "") === plotId &&
          paymentStatusKey(payment.status) === "Success"
      )
      .reduce((acc, payment) => acc + (Number(payment.amount) || 0), 0);
    return {
      name: `Plot #${plot.plotnumber ?? "-"}`,
      revenue: successful,
      status: plot.plotstatus || "Unknown",
    };
  });

  const totalPlotValue = scopedPlots.reduce(
    (sum, plot) => sum + (Number(plot.plotprice) || 0),
    0
  );
  const plotSuccessPaid = {};
  scopedPayments.forEach((payment) => {
    if (paymentStatusKey(payment.status) !== "Success") return;
    const pid = String(payment.plotid || "");
    if (!pid) return;
    plotSuccessPaid[pid] = (plotSuccessPaid[pid] || 0) + (Number(payment.amount) || 0);
  });
  const totalOutstanding = scopedPlots.reduce((sum, plot) => {
    const pid = String(plot._id || "");
    const paid = plotSuccessPaid[pid] || 0;
    const price = Number(plot.plotprice) || 0;
    return sum + Math.max(0, price - paid);
  }, 0);

  const mapSuccessPaymentRow = (payment) => {
    const plot = payment.plotid ? plotById[String(payment.plotid)] : null;
    const plotNo = plot?.plotnumber ?? payment.plotnumber ?? "—";
    const assignedId = plot?.assigneduserid
      ? String(plot.assigneduserid).trim()
      : payment.userid
      ? String(payment.userid).trim()
      : "";
    const customer =
      (assignedId && usernameByUserId[assignedId]) || (assignedId ? assignedId : "—");
    return {
      id: String(payment._id || ""),
      plotNumber: plotNo,
      customer,
      amount: Number(payment.amount) || 0,
      status: payment.status,
      date: payment.createdAtISO || payment.createdAt || "—",
    };
  };

  const successPaymentRowsBase = scopedPayments
    .filter((p) => paymentStatusKey(p.status) === "Success")
    .map(mapSuccessPaymentRow);

  const topSuccessfulPayments = [...successPaymentRowsBase]
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, 10);

  const paymentSuccessDetails = [...successPaymentRowsBase].sort((a, b) => {
    const ta = Date.parse(a.date) || 0;
    const tb = Date.parse(b.date) || 0;
    return tb - ta;
  });

  const plotInventoryRows = scopedPlots.map((plot) => {
    const pid = String(plot._id || "");
    const price = Number(plot.plotprice) || 0;
    const paid = plotSuccessPaid[pid] || 0;
    return {
      id: pid,
      label: `Plot #${plot.plotnumber ?? "-"}`,
      status: plot.plotstatus || "—",
      plotPrice: price,
      paymentsReceived: paid,
      outstanding: Math.max(0, price - paid),
    };
  });

  const siteBreakdownMap = scopedPlots.reduce((acc, plot) => {
    const site = detectSiteName(plot);
    if (!acc[site]) {
      acc[site] = { site, total: 0, sold: 0, available: 0, reserved: 0 };
    }
    acc[site].total += 1;
    const status = String(plot.plotstatus || "");
    if (status === "Sold") acc[site].sold += 1;
    if (status === "Available") acc[site].available += 1;
    if (status === "Reserved") acc[site].reserved += 1;
    return acc;
  }, {});

  const assignedUsersSet = new Set(
    scopedPlots
      .map((plot) => String(plot.assigneduserid || "").trim())
      .filter(Boolean)
  );
  const totalRevenue = sumBy(
    scopedPayments.filter((payment) => paymentStatusKey(payment.status) === "Success"),
    (payment) => payment.amount
  );
  const paymentsReceived = totalRevenue;
  const pendingRevenue = sumBy(
    scopedPayments.filter((payment) => paymentStatusKey(payment.status) === "Pending"),
    (payment) => payment.amount
  );

  const documentsLinkedToPayments = scopedPayments.filter(
    (payment) => payment.documentid || payment.documentName
  ).length;

  return {
    projectId,
    projectName: project?.name || project?.title || "Untitled Project",
    selectedPlotId: normalizedPlotId,
    availablePlots: [
      { id: "All Plots", label: "All Plots", searchText: "all plots" },
      ...siteScopedPlots.map((plot) => ({
        id: String(plot._id || ""),
        label: `Plot #${plot.plotnumber ?? "-"}`,
        searchText: `${plot.plotnumber ?? ""} ${plot.plotdirection ?? ""} ${plot.plotsize ?? ""} ${plot.plotprice ?? ""} ${plot.plotstatus ?? ""}`.toLowerCase(),
      })),
    ],
    selectedPlotDetails:
      normalizedPlotId === "All Plots"
        ? null
        : scopedPlots[0]
        ? {
            plotnumber: scopedPlots[0].plotnumber ?? null,
            plotprice: Number(scopedPlots[0].plotprice) || 0,
            plotdirection: scopedPlots[0].plotdirection || "Unknown",
            plotstatus: scopedPlots[0].plotstatus || "Unknown",
            plotsize: scopedPlots[0].plotsize ?? null,
          }
        : null,
    summary: {
      totalPlots: scopedPlots.length,
      availablePlots: plotsByStatus.Available,
      soldPlots: plotsByStatus.Sold,
      reservedPlots: plotsByStatus.Reserved,
      totalRevenue,
      paymentsReceived,
      pendingRevenue,
      totalPlotValue,
      totalOutstanding,
      interestedBuyers: scopedContacts.length,
      assignedUsers: users.filter((user) => assignedUsersSet.has(String(user.userid))).length,
      uploadedDocuments: scopedDocuments.length,
      paymentDocuments: documentsLinkedToPayments,
    },
    plotsByStatus: [
      { name: "Available", value: plotsByStatus.Available },
      { name: "Sold", value: plotsByStatus.Sold },
      { name: "Reserved", value: plotsByStatus.Reserved },
    ],
    paymentStatusBreakdown: [
      { name: "Success", value: paymentsByStatus.Success },
      { name: "Pending", value: paymentsByStatus.Pending },
    ],
    directionDistribution: Object.entries(directionDistribution).map(([name, value]) => ({
      name,
      value,
    })),
    sizeDistribution: Object.entries(sizeDistribution).map(([name, value]) => ({
      name,
      value,
    })),
    revenueTrend,
    buyerInterestTrend,
    plotSales,
    topSuccessfulPayments,
    paymentSuccessDetails,
    plotInventoryRows,
    siteBreakdown: Object.values(siteBreakdownMap),
    availabilityRatio: getSafeRatio(plotsByStatus.Available, scopedPlots.length),
  };
};

export const useDeveloperAnalytics = () => {
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/projects");
      return normalizeProjects(res?.data?.data);
    },
  });

  const projects = useMemo(
    () => normalizeProjects(projectsQuery.data),
    [projectsQuery.data]
  );

  const projectDetailQueries = useQueries({
    queries: projects.map((project) => {
      const projectId = project?._id || project?.id;
      return {
        queryKey: ["analytics", "project", projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
          const [plots, payments, documents] = await Promise.all([
            fetchPaginated(`/api/v1/plots/${projectId}`, {}, "plots"),
            fetchPaginated(`/api/v1/payments/${projectId}`, { status: "all" }, "payments"),
            fetchPaginated(`/api/v1/documents/${projectId}`, {}, "documents"),
          ]);
          return { projectId, plots, payments, documents };
        },
      };
    }),
  });

  const contactsQuery = useQuery({
    queryKey: ["analytics", "contacts"],
    queryFn: () => fetchPaginated("/api/v1/contact/getContacts", {}, "contacts"),
  });

  const usersQuery = useQuery({
    queryKey: ["analytics", "users"],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/v1/users", {
        params: { page: 1, limit: 500, sortBy: "createdAt", sortOrder: "desc" },
      });
      return Array.isArray(response?.data?.data) ? response.data.data : [];
    },
  });

  const derived = useMemo(() => {
    const projectMetrics = projects.map((project) => {
      const projectId = String(project?._id || project?.id || "");
      const detail = projectDetailQueries.find(
        (query) => String(query.data?.projectId || "") === projectId
      )?.data;
      return {
        projectId,
        projectName: project?.name || project?.title || "Untitled Project",
        plots: detail?.plots || [],
        payments: detail?.payments || [],
        documents: detail?.documents || [],
      };
    });

    const allPlots = projectMetrics.flatMap((item) => item.plots);
    const allPayments = projectMetrics.flatMap((item) => item.payments);
    const allDocuments = projectMetrics.flatMap((item) => item.documents);
    const allContactsRaw = contactsQuery.data || [];
    const allUsers = usersQuery.data || [];
    const knownProjectIds = new Set(projectMetrics.map((item) => String(item.projectId)));
    const allContacts = allContactsRaw.filter((contact) =>
      knownProjectIds.has(String(contact.projectId || ""))
    );

    const plotStatusCounts = allPlots.reduce(
      (acc, plot) => {
        const status = String(plot.plotstatus || "");
        if (status === "Available") acc.available += 1;
        else if (status === "Sold") acc.sold += 1;
        else if (status === "Reserved") acc.reserved += 1;
        return acc;
      },
      { available: 0, sold: 0, reserved: 0 }
    );

    const paymentStatus = allPayments.reduce(
      (acc, payment) => {
        const key = paymentStatusKey(payment.status);
        if (!acc[key]) acc[key] = 0;
        acc[key] += 1;
        return acc;
      },
      { Success: 0, Pending: 0, Unknown: 0 }
    );

    const totalRevenue = sumBy(
      allPayments.filter((payment) => paymentStatusKey(payment.status) === "Success"),
      (payment) => payment.amount
    );
    const totalPendingRevenue = sumBy(
      allPayments.filter((payment) => paymentStatusKey(payment.status) === "Pending"),
      (payment) => payment.amount
    );

    const monthlyRevenueMap = {};
    allPayments.forEach((payment) => {
      const month = getMonthKey(payment.createdAtISO || payment.createdAt);
      if (!monthlyRevenueMap[month]) monthlyRevenueMap[month] = 0;
      if (paymentStatusKey(payment.status) === "Success") {
        monthlyRevenueMap[month] += Number(payment.amount) || 0;
      }
    });

    const monthlyInterestMap = {};
    allContacts.forEach((contact) => {
      const month = getMonthKey(contact.createdAtISO || contact.createdAt);
      monthlyInterestMap[month] = (monthlyInterestMap[month] || 0) + 1;
    });

    const projectRevenue = projectMetrics.map((item) => ({
      name: item.projectName,
      value: sumBy(
        item.payments.filter((payment) => paymentStatusKey(payment.status) === "Success"),
        (payment) => payment.amount
      ),
    }));

    const projectPlotDistribution = projectMetrics.map((item) => ({
      name: item.projectName,
      total: item.plots.length,
    }));

    const projectPlotStatus = projectMetrics.map((item) => {
      const status = item.plots.reduce(
        (acc, plot) => {
          const key = String(plot.plotstatus || "");
          if (key === "Available") acc.available += 1;
          if (key === "Sold") acc.sold += 1;
          if (key === "Reserved") acc.reserved += 1;
          return acc;
        },
        { available: 0, sold: 0, reserved: 0 }
      );
      return {
        name: item.projectName,
        ...status,
      };
    });

    const projectInterestMap = projectMetrics.map((item) => {
      const count = allContacts.filter(
        (contact) => String(contact.projectId || "") === String(item.projectId || "")
      ).length;
      return { name: item.projectName, value: count };
    });

    const projectStats = projectMetrics.map((item) => {
      const plotStatus = item.plots.reduce(
        (acc, plot) => {
          const status = String(plot.plotstatus || "");
          if (status === "Available") acc.available += 1;
          else if (status === "Sold") acc.sold += 1;
          else if (status === "Reserved") acc.reserved += 1;
          return acc;
        },
        { available: 0, sold: 0, reserved: 0 }
      );

      const paymentStatusAmount = item.payments.reduce(
        (acc, payment) => {
          const key = paymentStatusKey(payment.status);
          if (!acc[key]) acc[key] = 0;
          acc[key] += Number(payment.amount) || 0;
          return acc;
        },
        { Success: 0, Pending: 0, Unknown: 0 }
      );

      const assigned = new Set(
        item.plots
          .map((plot) => String(plot.assigneduserid || "").trim())
          .filter(Boolean)
      );

      const interest = allContacts.filter(
        (contact) => String(contact.projectId || "") === String(item.projectId || "")
      );

      const plotSuccessPaidByProject = {};
      item.payments.forEach((payment) => {
        if (paymentStatusKey(payment.status) !== "Success") return;
        const pid = String(payment.plotid || "");
        if (!pid) return;
        plotSuccessPaidByProject[pid] =
          (plotSuccessPaidByProject[pid] || 0) + (Number(payment.amount) || 0);
      });
      const totalPlotValue = item.plots.reduce(
        (sum, plot) => sum + (Number(plot.plotprice) || 0),
        0
      );
      const paymentsReceived = sumBy(
        item.payments.filter((payment) => paymentStatusKey(payment.status) === "Success"),
        (payment) => payment.amount
      );
      const totalOutstanding = item.plots.reduce((sum, plot) => {
        const pid = String(plot._id || "");
        const paid = plotSuccessPaidByProject[pid] || 0;
        const price = Number(plot.plotprice) || 0;
        return sum + Math.max(0, price - paid);
      }, 0);

      return {
        projectId: item.projectId,
        projectName: item.projectName,
        plots: item.plots.length,
        availablePlots: plotStatus.available,
        soldPlots: plotStatus.sold,
        reservedPlots: plotStatus.reserved,
        revenue: paymentsReceived,
        paymentsReceived,
        totalPlotValue,
        totalOutstanding,
        pendingRevenue: sumBy(
          item.payments.filter((payment) => paymentStatusKey(payment.status) === "Pending"),
          (payment) => payment.amount
        ),
        successfulPayments: item.payments.filter(
          (payment) => paymentStatusKey(payment.status) === "Success"
        ).length,
        paymentsCount: item.payments.length,
        interestedBuyers: interest.length,
        registeredUsers: assigned.size,
        documents: item.documents.length,
        paymentDocuments: item.payments.filter(
          (payment) => payment.documentid || payment.documentName
        ).length,
        assignedUsers: allUsers.filter((user) => assigned.has(String(user.userid))).length,
        paymentStatusByProject: {
          success: paymentStatusAmount.Success,
          pending: paymentStatusAmount.Pending,
        },
      };
    });

    const documentsFromPayments = allPayments.filter(
      (payment) => payment.documentid || payment.documentName
    ).length;

    const globalPlotSuccessPaid = {};
    allPayments.forEach((payment) => {
      if (paymentStatusKey(payment.status) !== "Success") return;
      const pid = String(payment.plotid || "");
      if (!pid) return;
      globalPlotSuccessPaid[pid] =
        (globalPlotSuccessPaid[pid] || 0) + (Number(payment.amount) || 0);
    });
    const totalPlotValueAll = allPlots.reduce(
      (sum, plot) => sum + (Number(plot.plotprice) || 0),
      0
    );
    const totalOutstandingAll = allPlots.reduce((sum, plot) => {
      const pid = String(plot._id || "");
      const paid = globalPlotSuccessPaid[pid] || 0;
      const price = Number(plot.plotprice) || 0;
      return sum + Math.max(0, price - paid);
    }, 0);

    return {
      summary: {
        totalProjects: projects.length,
        totalPlots: allPlots.length,
        totalAvailablePlots: plotStatusCounts.available,
        totalSoldPlots: plotStatusCounts.sold,
        totalReservedPlots: plotStatusCounts.reserved,
        totalRevenue,
        totalPaymentsReceived: totalRevenue,
        totalPlotValue: totalPlotValueAll,
        totalOutstanding: totalOutstandingAll,
        totalSuccessfulPayments: paymentStatus.Success,
        totalPendingRevenue,
        totalPaymentsCount: allPayments.length,
        totalInterestedBuyers: allContacts.length,
        totalRegisteredUsers: allUsers.length,
        totalDocumentsUploaded: allDocuments.length,
        totalPaymentDocumentsUploaded: documentsFromPayments,
        plotAvailabilityRatio: getSafeRatio(plotStatusCounts.available, allPlots.length),
      },
      projectRevenue,
      projectPlotDistribution,
      projectPlotStatus,
      monthlyRevenueTrend: Object.entries(monthlyRevenueMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, value]) => ({ month: formatMonthLabel(month), value })),
      monthlyBuyerInterestTrend: Object.entries(monthlyInterestMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, value]) => ({ month: formatMonthLabel(month), value })),
      paymentStatusBreakdown: [
        { name: "Success", value: paymentStatus.Success },
        { name: "Pending", value: paymentStatus.Pending },
      ],
      projectPaymentStatus: projectStats.map((row) => ({
        name: row.projectName,
        Success: row.paymentStatusByProject.success,
        Pending: row.paymentStatusByProject.pending,
      })),
      projectStats,
      topPerformingProject:
        [...projectPlotStatus].sort((a, b) => b.sold - a.sold)[0]?.name || "N/A",
      highestRevenueProject:
        [...projectRevenue].sort((a, b) => b.value - a.value)[0]?.name || "N/A",
      mostInterestedProject:
        [...projectInterestMap].sort((a, b) => b.value - a.value)[0]?.name || "N/A",
    };
  }, [contactsQuery.data, projectDetailQueries, projects, usersQuery.data]);

  const isLoading =
    projectsQuery.isLoading ||
    contactsQuery.isLoading ||
    usersQuery.isLoading ||
    projectDetailQueries.some((query) => query.isLoading);
  const isError =
    projectsQuery.isError ||
    contactsQuery.isError ||
    usersQuery.isError ||
    projectDetailQueries.some((query) => query.isError);
  const error =
    projectsQuery.error ||
    contactsQuery.error ||
    usersQuery.error ||
    projectDetailQueries.find((query) => query.error)?.error;

  return { ...derived, isLoading, isError, error };
};

export const useProjectAnalytics = (projectId, selectedPlotId) => {
  const projectQuery = useQuery({
    queryKey: ["projects", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/projects/${projectId}`);
      return res?.data?.data?.project || null;
    },
  });

  const plotsQuery = useQuery({
    queryKey: ["analytics", "plots", projectId],
    enabled: Boolean(projectId),
    queryFn: () => fetchPaginated(`/api/v1/plots/${projectId}`, {}, "plots"),
  });
  const paymentsQuery = useQuery({
    queryKey: ["analytics", "payments", projectId],
    enabled: Boolean(projectId),
    queryFn: () => fetchPaginated(`/api/v1/payments/${projectId}`, { status: "all" }, "payments"),
  });
  const documentsQuery = useQuery({
    queryKey: ["analytics", "documents", projectId],
    enabled: Boolean(projectId),
    queryFn: () => fetchPaginated(`/api/v1/documents/${projectId}`, {}, "documents"),
  });
  const contactsQuery = useQuery({
    queryKey: ["analytics", "contacts", projectId],
    enabled: Boolean(projectId),
    queryFn: () => fetchPaginated("/api/v1/contact/getContacts", { projectId }, "contacts"),
  });
  const usersQuery = useQuery({
    queryKey: ["analytics", "users", "all"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/users", {
        params: { page: 1, limit: 500, sortBy: "createdAt", sortOrder: "desc" },
      });
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    },
  });

  const analytics = useMemo(
    () =>
      buildProjectAnalytics({
        project: projectQuery.data || {},
        plots: plotsQuery.data || [],
        payments: paymentsQuery.data || [],
        documents: documentsQuery.data || [],
        contacts: contactsQuery.data || [],
        users: usersQuery.data || [],
        selectedPlotId,
      }),
    [
      contactsQuery.data,
      documentsQuery.data,
      paymentsQuery.data,
      plotsQuery.data,
      projectQuery.data,
      selectedPlotId,
      usersQuery.data,
    ]
  );

  return {
    ...analytics,
    isLoading:
      projectQuery.isLoading ||
      plotsQuery.isLoading ||
      paymentsQuery.isLoading ||
      documentsQuery.isLoading ||
      contactsQuery.isLoading ||
      usersQuery.isLoading,
    isError:
      projectQuery.isError ||
      plotsQuery.isError ||
      paymentsQuery.isError ||
      documentsQuery.isError ||
      contactsQuery.isError ||
      usersQuery.isError,
    error:
      projectQuery.error ||
      plotsQuery.error ||
      paymentsQuery.error ||
      documentsQuery.error ||
      contactsQuery.error ||
      usersQuery.error,
  };
};
