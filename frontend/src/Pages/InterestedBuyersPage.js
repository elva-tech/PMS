import React, { useState, useEffect, useRef } from "react";
import { Search, X, UserPlus, Trash2 } from "lucide-react";
import axiosInstance from "../utils/axiosInstance";
import LoadingSpinner from "../Components/LoadingSpinner";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import { usePlot } from "../hooks/usePlotHooks";
import InterestedBuyerForm from "../Components/InterestedBuyerForm";
import DeleteModal from "../Components/DeleteModal";

/** Plot # from persisted fields if present, else a conservative parse of the interest note (no new API). */
const plotLabelFromContact = (contact) => {
  const explicit = contact.plotNumber ?? contact.plotnumber;
  if (
    explicit !== undefined &&
    explicit !== null &&
    String(explicit).trim() !== ""
  ) {
    return `#${String(explicit).trim()}`;
  }
  const desc = (contact.description || "").trim();
  const m =
    desc.match(/\bplot\s*(?:number|no\.?)?\s*[:#]?\s*(\d{1,6})\b/i) ||
    desc.match(/\b#\s*(\d{1,6})\b/);
  return m ? `#${m[1]}` : "—";
};

const InterestedBuyersPage = ({ projectId }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isAdmin =
    user?.user?.role === "admin" && user?.user?.type === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [sortConfig, setSortConfig] = useState({
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [sourceFilter, setSourceFilter] = useState("ALL");

  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [newBuyer, setNewBuyer] = useState({
    fullName: "",
    email: "",
    phone: "",
    plotid: "",
    description: "",
  });
  const { data: plotPayload } = usePlot(projectId, 1, 500, "createdAt", "asc");
  const plotsList = Array.isArray(plotPayload?.data?.plots)
    ? plotPayload.data.plots
    : [];

  const tooltipRef = useRef(null);
  const modalRef = useRef(null);

  const fetchContacts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: pagination.currentPage,
        limit: 10,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };
      if (projectId) params.projectId = projectId;
      if (sourceFilter !== "ALL") params.source = sourceFilter;

      const response = await axiosInstance.get("/api/v1/contact/getContacts", {
        params,
      });
      setContacts(response.data.contacts || []);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  const toggleContactStatus = async (contactId, currentStatus) => {
    const id = String(contactId);
    setStatusUpdateLoading(id);
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await axiosInstance.patch(`/api/v1/contact/${id}/status`, {
        interested: newStatus,
      });
      setContacts((prev) =>
        prev.map((contact) =>
          String(contact.id) === id
            ? { ...contact, interested: newStatus }
            : contact
        )
      );
      addToast("success", "Status updated", "");
    } catch (err) {
      addToast(
        "error",
        "Update failed",
        err.response?.data?.message || "Failed to update contact status"
      );
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setContactToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    const id = String(contactToDelete.id);
    setDeleteLoading(id);
    try {
      await axiosInstance.delete(`/api/v1/contact/${id}`);
      setContacts((prev) => prev.filter((c) => String(c.id) !== id));
      setPagination((prev) => ({
        ...prev,
        totalRecords: Math.max(0, (prev.totalRecords || 1) - 1),
      }));
      addToast("success", "Deleted", "Interested buyer removed.");
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    } catch (err) {
      addToast(
        "error",
        "Delete failed",
        err.response?.data?.message || "Failed to delete contact"
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleAddBuyer = async (buyerPayload = newBuyer) => {
    const fullName = buyerPayload.fullName.trim();
    const email = buyerPayload.email.trim();
    const phone = buyerPayload.phone.trim().replace(/\D/g, "");
    const description = buyerPayload.description.trim();
    const selectedPlot = plotsList.find((p) => p._id === buyerPayload.plotid);

    if (!fullName || !email || !phone) {
      addToast("error", "Incomplete", "Fill name, email, and phone.");
      return;
    }
    if (phone.length !== 10) {
      addToast("error", "Phone", "Enter a 10-digit phone number.");
      return;
    }
    if (!buyerPayload.plotid) {
      addToast("error", "Plot required", "Select a plot.");
      return;
    }
    const plotStatus = String(selectedPlot?.plotstatus || "");
    if (plotStatus === "Sold") {
      addToast("error", "Plot unavailable", "Cannot add buyers to sold plots.");
      return;
    }
    if (plotStatus && plotStatus !== "Available" && plotStatus !== "Reserved") {
      addToast("error", "Plot unavailable", "This plot status does not allow new leads.");
      return;
    }
    setAddSubmitting(true);
    try {
      const descBody = description.trim();
      const descriptionPayload = selectedPlot
        ? `Plot #${selectedPlot.plotnumber}${descBody ? ` — ${descBody}` : " — interest registered"}`
        : descBody || "Interest registered";
      await axiosInstance.post("/api/v1/contact", {
        fullName,
        email,
        phone,
        description: descriptionPayload,
        interested: 1,
        projectId: projectId || null,
        plotid: buyerPayload.plotid,
        source: "ADMIN",
      });
      addToast("success", "Buyer added", "Contact saved.");
      setNewBuyer({
        fullName: "",
        email: "",
        phone: "",
        plotid: "",
        description: "",
      });
      setAddOpen(false);
      await fetchContacts();
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message || err?.message || "Could not add buyer.";
      if (
        err?.response?.status === 409 ||
        /already exists|duplicate/i.test(String(backendMessage))
      ) {
        addToast(
          "error",
          "Buyer already exists",
          "Buyer already exists for this phone and selected plot."
        );
      } else {
        addToast("error", "Something went wrong", backendMessage);
      }
    } finally {
      setAddSubmitting(false);
    }
  };

  useEffect(() => {
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, [projectId]);

  useEffect(() => {
    fetchContacts();
  }, [
    pagination.currentPage,
    sortConfig.sortBy,
    sortConfig.sortOrder,
    projectId,
    sourceFilter,
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        if (modalRef.current && modalRef.current.contains(event.target)) {
          return;
        }
        setActiveTooltip(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const term = searchTerm.toLowerCase();
  const filtered = contacts.filter((contact) => {
    const name = (contact.fullName || "").toLowerCase();
    const email = (contact.email || "").toLowerCase();
    const phone = (contact.phone || "").toString();
    const plotHint = plotLabelFromContact(contact).toLowerCase();
    return (
      name.includes(term) ||
      email.includes(term) ||
      phone.includes(searchTerm) ||
      plotHint.includes(term.replace(/^#/, ""))
    );
  });

  return (
    <div className="mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Interested buyers</h1>
          {projectId && (
            <p className="text-sm text-gray-500 mt-1">
              Scoped to this project (project id: {projectId}).
            </p>
          )}
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:space-x-4 w-full md:w-auto">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {["ALL", "ADMIN", "WEBSITE"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setPagination((p) => ({ ...p, currentPage: 1 }));
                  setSourceFilter(item);
                }}
                className={`px-3 py-2 text-xs md:text-sm ${
                  sourceFilter === item
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item === "ALL"
                  ? "All"
                  : item === "ADMIN"
                  ? "Admin Leads"
                  : "Website Leads"}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAddOpen((o) => !o)}
              className="inline-flex items-center justify-center gap-2 border border-blue-600 text-blue-700 rounded-lg py-2 px-4 text-sm font-medium hover:bg-blue-50"
            >
              <UserPlus size={18} />
              {addOpen ? "Close form" : "Add interested buyer"}
            </button>
          )}
          <div className="relative w-full md:w-auto">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              className="w-full md:w-64 border border-gray-300 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              setSortConfig((prev) => ({
                sortBy: "createdAt",
                sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
              }))
            }
            className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-600 flex items-center justify-center"
          >
            Sort by: {sortConfig.sortOrder === "desc" ? "Newest" : "Oldest"}
            <i
              className={`fas fa-chevron-${
                sortConfig.sortOrder === "desc" ? "down" : "up"
              } ml-2`}
            />
          </button>
        </div>
      </div>

      {isAdmin && addOpen && (
        <div className="mb-6">
          <InterestedBuyerForm
            plots={plotsList}
            initialValues={newBuyer}
            isSubmitting={addSubmitting}
            submitLabel="Save buyer"
            onSubmit={async (values) => {
              setNewBuyer(values);
              await handleAddBuyer(values);
            }}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto shadow-lg">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-lg">
              <thead>
                <tr className="w-full bg-blue-600 text-left text-white uppercase text-xs md:text-sm">
                  <th className="py-3 px-6">Users Name</th>
                  <th className="py-3 px-6">Plot #</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Source</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Status</th>
                  {isAdmin ? <th className="py-3 px-6">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="text-gray-600 text-xs md:text-sm font-semibold">
                {filtered.map((contact, index) => (
                  <tr
                    key={contact.id || index}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td className="py-3 px-6">{contact.fullName}</td>
                    <td className="py-3 px-6">{plotLabelFromContact(contact)}</td>
                    <td className="py-3 px-6">{contact.phone}</td>
                    <td className="py-3 px-6">{contact.email}</td>
                    <td className="py-3 px-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          contact.source === "WEBSITE"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {contact.source || "ADMIN"}
                      </span>
                    </td>
                    <td
                      ref={tooltipRef}
                      className="py-3 px-6 relative cursor-pointer"
                      onClick={() => {
                        if ((contact.description || "").length > 20) {
                          setActiveTooltip(
                            activeTooltip === index ? null : index
                          );
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <span>
                          {(contact.description || "").length > 20
                            ? `${(contact.description || "").substring(0, 20)}...`
                            : contact.description || "—"}
                        </span>
                      </div>
                      {(contact.description || "").length > 20 &&
                        activeTooltip === index && (
                          <>
                            <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                              <div
                                ref={modalRef}
                                className="bg-white rounded-lg p-4 max-w-sm w-full relative"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip(null);
                                  }}
                                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                >
                                  <X size={16} />
                                </button>
                                <p className="text-sm text-gray-600 mt-2">
                                  {contact.description}
                                </p>
                              </div>
                            </div>
                            <div className="hidden md:block absolute left-0 top-full mt-1 z-50 bg-gray-800 text-white text-sm rounded-md py-2 px-3 shadow-lg min-w-[200px] max-w-[300px]">
                              <p>{contact.description}</p>
                            </div>
                          </>
                        )}
                    </td>
                    <td className="py-3 px-6">
                      <button
                        type="button"
                        onClick={() =>
                          toggleContactStatus(contact.id, contact.interested)
                        }
                        disabled={statusUpdateLoading === String(contact.id)}
                        className={`py-1 px-3 rounded-full text-xs ${
                          contact.interested === 1
                            ? "bg-green-100 text-green-500 hover:bg-green-200"
                            : "bg-red-100 text-red-500 hover:bg-red-200"
                        } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          contact.interested === 1
                            ? "focus:ring-green-500"
                            : "focus:ring-red-500"
                        }`}
                      >
                        {statusUpdateLoading === String(contact.id) ? (
                          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : contact.interested === 1 ? (
                          "Interested"
                        ) : (
                          "Not Interested"
                        )}
                      </button>
                    </td>
                    {isAdmin ? (
                      <td className="py-3 px-6">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(contact)}
                          disabled={deleteLoading === String(contact.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          {deleteLoading === String(contact.id) ? (
                            <span className="inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 border-t text-xs md:text-sm rounded-lg shadow-lg">
            <div className="text-gray-600 mb-2 md:mb-0">
              Showing {filtered.length} of {pagination.totalRecords} contacts
            </div>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage - 1,
                  }))
                }
                disabled={!pagination.hasPrevPage}
                className={`py-1 px-3 rounded ${
                  pagination.hasPrevPage
                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                &lt;
              </button>
              {[...Array(pagination.totalPages)].map((_, index) => (
                <button
                  type="button"
                  key={index + 1}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: index + 1,
                    }))
                  }
                  className={`py-1 px-3 rounded ${
                    pagination.currentPage === index + 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
                disabled={!pagination.hasNextPage}
                className={`py-1 px-3 rounded ${
                  pagination.hasNextPage
                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && contactToDelete && (
        <DeleteModal
          title="Delete interested buyer"
          message={`Remove ${
            contactToDelete.fullName?.trim() || "this buyer"
          } from the list?`}
          confirmText="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isLoading={deleteLoading === String(contactToDelete.id)}
        />
      )}
    </div>
  );
};

export default InterestedBuyersPage;
