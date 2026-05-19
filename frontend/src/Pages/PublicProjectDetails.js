import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, Phone, User, Calendar } from "lucide-react";
import Navbar from "../Components/Navbar";
import FooterSection from "../Components/FooterSection";
import SMSPreviewModal from "../Components/SMSPreviewModal";

const PublicProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [availablePlots, setAvailablePlots] = useState([]);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [smsPreview, setSmsPreview] = useState("");
  const [smsOpen, setSmsOpen] = useState(false);
  const [infoModal, setInfoModal] = useState({ open: false, title: "", message: "" });
  const [leadForm, setLeadForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    plotid: "",
    description: "",
  });
  const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  const selectedPlot = availablePlots.find(
    (plot) => String(plot._id) === String(leadForm.plotid)
  );
  const hasPlots = availablePlots.length > 0;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/api/v1/public/projects/${id}`,
        );
        if (response.data?.data?.project) {
          setProject(response.data.data.project);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/v1/public/projects/${id}/plots`);
        const rows = response?.data?.data?.plots || [];
        setAvailablePlots(rows);
      } catch {
        setAvailablePlots([]);
      }
    };
    fetchPlots();
  }, [baseUrl, id]);

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    const fullName = leadForm.fullName.trim();
    const email = leadForm.email.trim();
    const phone = leadForm.phone.trim().replace(/\D/g, "");
    const description = leadForm.description.trim();
    if (!fullName || !email || !phone || !leadForm.plotid) {
      setError("Please fill all required details.");
      return;
    }
    if (!hasPlots) {
      setError("No plots are available for inquiry right now.");
      return;
    }
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    const st = String(selectedPlot?.plotstatus || "");
    if (st === "Sold") {
      setError("This plot is sold and cannot accept new inquiries.");
      return;
    }
    if (st && st !== "Available" && st !== "Reserved") {
      setError(`This plot status (${st}) does not allow inquiries.`);
      return;
    }
    setSubmittingLead(true);
    try {
      const response = await axios.post(`${baseUrl}/api/v1/public/interested-buyers`, {
        fullName,
        email,
        phone,
        description: description || "",
        projectId: id,
        plotid: leadForm.plotid,
      });
      setLeadModalOpen(false);
      setLeadForm({
        fullName: "",
        email: "",
        phone: "",
        plotid: "",
        description: "",
      });
      setError(null);
      setSmsPreview(response?.data?.data?.smsPreview || "");
      setSmsOpen(true);
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message || "Unable to submit your interest right now.";
      const duplicateDetected =
        err?.response?.status === 409 ||
        /already exists|duplicate/i.test(String(backendMessage));
      if (duplicateDetected) {
        setLeadModalOpen(false);
        setInfoModal({
          open: true,
          title: "Buyer already exists",
          message: "Buyer already exists for this phone and selected plot.",
        });
      } else {
        setError(backendMessage);
      }
    } finally {
      setSubmittingLead(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || "Project not found"}</p>
        <button
          onClick={() => navigate("/home")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-white">
      {/* Navigation */}
      <Navbar />

      {/* Back Button */}
      <div className="pt-20 px-6 md:px-10">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center text-white hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>
      </div>

      {/* Project Details */}
      <div className="px-6 md:px-10 pb-10">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto">
          {/* Project Image */}
          <div className="w-full bg-gray-100 flex items-center justify-center p-4">
            {project.brochure || project.image ? (
              <img
                src={
                  project.brochure
                    ? `data:${project.brochure.contentType};base64,${project.brochure.data}`
                    : `data:${project.image.contentType};base64,${project.image.data}`
                }
                alt={project.name}
                className="max-w-full max-h-[400px] object-contain rounded-lg shadow-md"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
                {project.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === "active"
                    ? "bg-green-100 text-green-800"
                    : project.status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {project.status?.charAt(0).toUpperCase() +
                  project.status?.slice(1)}
              </span>
            </div>

            {project.description && (
              <p className="text-gray-600 mb-6">{project.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.location && (
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-800 font-medium">
                      {project.location}
                    </p>
                  </div>
                </div>
              )}

              {project.projectManager && (
                <div className="flex items-start">
                  <User className="w-5 h-5 text-blue-600 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Project Manager</p>
                    <p className="text-gray-800 font-medium">
                      {project.projectManager}
                    </p>
                  </div>
                </div>
              )}

              {project.contactNumber && (
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-blue-600 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="text-gray-800 font-medium">
                      {project.contactNumber}
                    </p>
                  </div>
                </div>
              )}

              {(project.startDate || project.endDate) && (
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-600 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Timeline</p>
                    <p className="text-gray-800 font-medium">
                      {project.startDate && `Start: ${project.startDate}`}
                      {project.startDate && project.endDate && " | "}
                      {project.endDate && `End: ${project.endDate}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {project.amenities && project.amenities.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Button */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setLeadModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Interested to Buy?
              </button>
            </div>
          </div>
        </div>
      </div>

      {leadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Interested to Buy?</h3>
              <button
                type="button"
                onClick={() => setLeadModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLeadSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Full name"
                value={leadForm.fullName}
                onChange={(e) => setLeadForm((s) => ({ ...s, fullName: e.target.value }))}
              />
              <input
                className="border rounded-md px-3 py-2 text-sm"
                type="email"
                placeholder="Email"
                value={leadForm.email}
                onChange={(e) => setLeadForm((s) => ({ ...s, email: e.target.value }))}
              />
              <input
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Phone"
                maxLength={10}
                value={leadForm.phone}
                onChange={(e) => setLeadForm((s) => ({ ...s, phone: e.target.value }))}
              />
              <select
                className="border rounded-md px-3 py-2 text-sm md:col-span-2"
                value={leadForm.plotid}
                onChange={(e) => setLeadForm((s) => ({ ...s, plotid: e.target.value }))}
              >
                <option value="">
                  {hasPlots ? "Select plot *" : "No plots available"}
                </option>
                {availablePlots.map((plot) => (
                  <option key={plot._id} value={plot._id}>
                    Plot #{plot.plotnumber} - {plot.plotstatus}
                  </option>
                ))}
              </select>
              {selectedPlot?.plotstatus === "Sold" ? (
                <p className="md:col-span-2 text-sm text-red-600">
                  This plot is sold — inquiry submission is not available.
                </p>
              ) : null}
              {selectedPlot?.plotstatus === "Reserved" ? (
                <p className="md:col-span-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                  This plot is reserved — you can still register interest. Message is optional.
                </p>
              ) : null}
              <input
                className="border rounded-md px-3 py-2 text-sm md:col-span-2"
                placeholder="Message / requirement (optional)"
                value={leadForm.description}
                onChange={(e) => setLeadForm((s) => ({ ...s, description: e.target.value }))}
              />
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setLeadModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingLead ||
                    !hasPlots ||
                    selectedPlot?.plotstatus === "Sold" ||
                    !selectedPlot
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                >
                  {submittingLead ? "Submitting..." : "Submit Inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SMSPreviewModal
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        title="Thanks for your interest"
        message={smsPreview}
      />
      <SMSPreviewModal
        open={infoModal.open}
        onClose={() => setInfoModal({ open: false, title: "", message: "" })}
        title={infoModal.title}
        message={infoModal.message}
      />

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default PublicProjectDetails;
