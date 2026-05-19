import React, { useEffect, useMemo, useState } from "react";
import { Search, MessageSquarePlus } from "lucide-react";
import { useParams } from "react-router-dom";
import { useProjects } from "../hooks/useProjectHooks";
import { usePlot } from "../hooks/usePlotHooks";
import axiosInstance from "../utils/axiosInstance";
import InterestedBuyerForm from "../Components/InterestedBuyerForm";
import SMSPreviewModal from "../Components/SMSPreviewModal";
import LoadingSpinner from "../Components/LoadingSpinner";
import { useToast } from "../Context/ToastContext";
import slnlayout from "../Images/sln-layout.jpg";
import nrlayout from "../Images/nr-layout.jpg";
import balajilayout from "../Images/balaji-layout.jpg";

const ShareQuotePage = () => {
  const { id: routeProjectId } = useParams();
  const { addToast } = useToast();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const projects = useMemo(() => {
    if (Array.isArray(projectsData)) return projectsData;
    if (Array.isArray(projectsData?.projects)) return projectsData.projects;
    return [];
  }, [projectsData]);

  const [selectedProjectId, setSelectedProjectId] = useState(routeProjectId || "");
  const [plotSearchInput, setPlotSearchInput] = useState("");
  const [plotSearchTerm, setPlotSearchTerm] = useState("");
  const [plotDropdownValue, setPlotDropdownValue] = useState("");
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [infoModal, setInfoModal] = useState({ open: false, title: "", message: "" });
  const defaultImages = {
    "In Progress": slnlayout,
    Completed: balajilayout,
    "Not Started": nrlayout,
  };

  const getProjectImageSource = (project) => {
    if (project?.brochure?.data && project?.brochure?.contentType) {
      return `data:${project.brochure.contentType};base64,${project.brochure.data}`;
    }
    if (project?.image?.data && project?.image?.contentType) {
      return `data:${project.image.contentType};base64,${project.image.data}`;
    }
    return defaultImages[project?.status] || balajilayout;
  };


  const selectedProject = useMemo(
    () => projects.find((project) => String(project._id || project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const { data: plotPayload, isLoading: plotsLoading } = usePlot(
    selectedProjectId || undefined,
    1,
    500,
    "plotnumber",
    "asc"
  );
  const projectPlots = useMemo(() => {
    const rows = plotPayload?.data?.plots;
    return Array.isArray(rows) ? rows : [];
  }, [plotPayload]);

  useEffect(() => {
    const timer = setTimeout(
      () => setPlotSearchTerm(plotSearchInput.trim().toLowerCase()),
      300
    );
    return () => clearTimeout(timer);
  }, [plotSearchInput]);

  const filteredPlots = useMemo(() => {
    const statusOrder = { Available: 0, Reserved: 1, Sold: 2 };
    const sorted = [...projectPlots].sort(
      (a, b) =>
        (statusOrder[a.plotstatus] ?? 9) - (statusOrder[b.plotstatus] ?? 9) ||
        Number(a.plotnumber || 0) - Number(b.plotnumber || 0)
    );
    if (!plotSearchTerm) return sorted;
    return sorted.filter((plot) => {
      const number = String(plot.plotnumber || "");
      const direction = String(plot.plotdirection || "").toLowerCase();
      const size = String(plot.plotsize || "");
      return (
        number.includes(plotSearchTerm) ||
        direction.includes(plotSearchTerm) ||
        size.includes(plotSearchTerm)
      );
    });
  }, [projectPlots, plotSearchTerm]);

  useEffect(() => {
    setSelectedPlot(null);
    setPlotDropdownValue("");
    setBuyers([]);
  }, [selectedProjectId]);

  const loadBuyers = async (plot) => {
    if (!plot?._id) return;
    setBuyersLoading(true);
    try {
      const res = await axiosInstance.get("/api/v1/contact/getContacts", {
        params: {
          page: 1,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
          projectId: plot.projectId || selectedProjectId,
          plotid: plot._id,
          interested: 1,
        },
      });
      setBuyers(res?.data?.contacts || []);
    } catch {
      setBuyers([]);
      addToast("error", "Load failed", "Unable to load interested buyers for this plot.");
    } finally {
      setBuyersLoading(false);
    }
  };

  const plotAllowsLead = (plot) => {
    const s = String(plot?.plotstatus || "");
    return s === "Available" || s === "Reserved";
  };

  const handleSelectPlot = async (plot) => {
    setSelectedPlot(plot);
    setPlotDropdownValue(plot?._id || "");
    if (plot?.plotstatus && !plotAllowsLead(plot)) {
      addToast(
        "error",
        "Plot unavailable",
        `This plot has been ${String(plot.plotstatus).toLowerCase()}.`
      );
    }
    await loadBuyers(plot);
  };

  const handlePreview = async (buyer) => {
    if (!selectedPlot?._id) return;
    try {
      const res = await axiosInstance.post("/api/v1/share-quote/preview", {
        plotId: selectedPlot._id,
        buyer: {
          fullName: buyer.fullName,
          phone: buyer.phone,
          email: buyer.email,
        },
      });
      setPreviewMessage(res?.data?.message || "");
      setPreviewOpen(true);
    } catch (err) {
      addToast(
        "error",
        "Preview failed",
        err?.response?.data?.message || "Unable to generate SMS preview."
      );
    }
  };

  const handleAddBuyer = async (values) => {
    if (!selectedPlot?._id) {
      addToast("error", "Select plot", "Choose a plot before adding buyer.");
      return;
    }
    if (!plotAllowsLead(selectedPlot)) {
      addToast(
        "error",
        "Plot unavailable",
        `This plot has been ${String(selectedPlot.plotstatus).toLowerCase()}.`
      );
      return;
    }
    const { fullName, email, phone, description } = values;
    if (!fullName || !email || !phone || !selectedPlot?._id) {
      addToast("error", "Incomplete", "Fill all required fields.");
      return;
    }
    if (phone.length !== 10) {
      addToast("error", "Phone", "Enter a valid 10-digit phone number.");
      return;
    }
    setAddSubmitting(true);
    try {
      await axiosInstance.post("/api/v1/contact", {
        fullName,
        email,
        phone,
        description: (description && description.trim()) || "",
        interested: 1,
        source: "ADMIN",
        projectId: selectedPlot.projectId || selectedProjectId,
        plotid: selectedPlot._id,
      });
      addToast("success", "Buyer added", "Buyer saved successfully.");
      await loadBuyers(selectedPlot);
      await handlePreview({ fullName, email, phone });
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message || err?.message || "Unable to save buyer.";
      const duplicateDetected =
        err?.response?.status === 409 ||
        /already exists|duplicate/i.test(String(backendMessage));
      if (duplicateDetected) {
        setInfoModal({
          open: true,
          title: "Buyer already exists",
          message: backendMessage,
        });
        return;
      }
      addToast(
        "error",
        "Save failed",
        backendMessage
      );
    } finally {
      setAddSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <h1 className="text-xl md:text-2xl font-semibold">Share Quote</h1>
      <p className="text-sm text-gray-500">
        Select project, choose plot, review leads, and preview quotation SMS.
      </p>

      <div className="bg-white border rounded-lg p-4">
        {projectsLoading ? (
          <div className="mt-4 flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Projects</h3>
            {projects.length === 0 ? (
              <div className="border rounded-md p-4 text-sm text-gray-500">
                No projects found.
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[28rem] overflow-y-auto pr-1">
              {projects.map((project) => {
                const projectId = project._id || project.id;
                const active = String(projectId) === String(selectedProjectId);
                return (
                  <button
                    key={projectId}
                    type="button"
                    onClick={() => setSelectedProjectId(projectId)}
                    className={`w-full text-left border rounded-lg overflow-hidden shadow-sm hover:shadow transition ${
                      active ? "ring-2 ring-blue-500" : "bg-white"
                    }`}
                  >
                    <img
                      src={getProjectImageSource(project)}
                      alt={project.name || project.title || "Project"}
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium">{project.name || project.title}</p>
                      <p className="text-xs text-gray-500">{project.location || "No location"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            )}
          </div>
        )}
      </div>

      {selectedProjectId && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Plots - {selectedProject?.name || selectedProject?.title || selectedProjectId}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={plotSearchInput}
              onChange={(e) => setPlotSearchInput(e.target.value)}
              placeholder="Search plot number, direction or size..."
              className="w-full border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={plotDropdownValue}
            onChange={(e) => {
              const found = projectPlots.find((plot) => String(plot._id) === String(e.target.value));
              if (found) handleSelectPlot(found);
            }}
            className="w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select plot</option>
            {filteredPlots.map((plot) => (
              <option key={plot._id} value={plot._id}>
                Plot #{plot.plotnumber} - {plot.plotstatus}
              </option>
            ))}
          </select>
          {plotsLoading ? (
            <div className="py-4 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto border rounded-md">
              {filteredPlots.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">No matching plots.</p>
              ) : (
                filteredPlots.map((plot) => (
                <button
                  type="button"
                  key={plot._id}
                  onClick={() => handleSelectPlot(plot)}
                  className={`w-full text-left px-3 py-2 border-b hover:bg-blue-50 ${
                    selectedPlot?._id === plot._id ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <p className="text-sm font-medium">
                    Plot #{plot.plotnumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {plot.plotsize} sqft | {plot.plotdirection} | {plot.plotstatus}
                  </p>
                </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {selectedPlot && !plotAllowsLead(selectedPlot) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          This plot has been {String(selectedPlot.plotstatus).toLowerCase()}. You cannot add a new buyer for this plot.
          </div>
      )}

      {selectedPlot && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Plot Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>Plot Number: #{selectedPlot.plotnumber}</p>
              <p>Size: {selectedPlot.plotsize} sqft</p>
              <p>Direction: {selectedPlot.plotdirection}</p>
              <p>Price: ₹{Number(selectedPlot.plotprice || 0).toLocaleString("en-IN")}</p>
              <p>Project: {selectedProject?.name || selectedProject?.title || selectedPlot.projectId}</p>
              <p>Status: {selectedPlot.plotstatus}</p>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Add Interested Buyer</h3>
            <InterestedBuyerForm
              plots={[selectedPlot]}
              isSubmitting={addSubmitting}
              submitDisabled={!plotAllowsLead(selectedPlot)}
              submitLabel="Save & Preview SMS"
              initialValues={{ fullName: "", email: "", phone: "", plotid: selectedPlot._id, description: "" }}
              onSubmit={handleAddBuyer}
            />
          </div>
        </div>
      )}

      {selectedPlot && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Interested Buyers for Plot #{selectedPlot.plotnumber}</h3>
          {buyersLoading ? (
            <div className="py-6 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : buyers.length === 0 ? (
            <p className="text-sm text-gray-500">No buyers linked to this plot yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white text-left">
                    <th className="p-3">Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((buyer) => (
                    <tr key={buyer.id} className="border-b">
                      <td className="p-3">{buyer.fullName}</td>
                      <td className="p-3">{buyer.phone}</td>
                      <td className="p-3">{buyer.email}</td>
                      <td className="p-3">{buyer.source || "ADMIN"}</td>
                      <td className="p-3">{buyer.createdAt || "—"}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handlePreview(buyer)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <MessageSquarePlus size={14} />
                          Preview SMS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <SMSPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="SMS Quote Preview"
        message={previewMessage}
      />
      <SMSPreviewModal
        open={infoModal.open}
        onClose={() => setInfoModal({ open: false, title: "", message: "" })}
        title={infoModal.title}
        message={infoModal.message}
      />
    </div>
  );
};

export default ShareQuotePage;
