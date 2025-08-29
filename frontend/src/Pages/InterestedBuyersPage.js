import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import axiosInstance from "../utils/axiosInstance";

const InterestedBuyersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const tooltipRef = useRef(null);
  const modalRef = useRef(null);

  const fetchContacts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/api/v1/contact/getContacts", {
        params: {
          page: pagination.currentPage,
          limit: 10,
          sortBy: sortConfig.sortBy,
          sortOrder: sortConfig.sortOrder,
        },
      });
      setContacts(response.data.contacts);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [pagination.currentPage, sortConfig.sortBy, sortConfig.sortOrder]);

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

  return (
    <div className="mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">All Buyers</h1>
          <p className="text-green-500">Interested Members</p>
        </div>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
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
            onClick={() =>
              setSortConfig((prev) => ({
                sortBy: "createdAt",
                sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
              }))
            }
            className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-600 flex items-center"
          >
            Sort by: {sortConfig.sortOrder === "desc" ? "Newest" : "Oldest"}
            <i
              className={`fas fa-chevron-${
                sortConfig.sortOrder === "desc" ? "down" : "up"
              } ml-2`}
            ></i>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto shoadow-lg">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-lg">
              <thead>
                <tr className="w-full bg-blue-600 text-left text-white uppercase text-xs md:text-sm">
                  <th className="py-3 px-6">Users Name</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-xs md:text-sm font-semibold">
                {contacts
                  .filter(
                    (contact) =>
                      contact.fullName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      contact.email
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      contact.phone.includes(searchTerm)
                  )
                  .map((contact, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-gray-100"
                    >
                      <td className="py-3 px-6">{contact.fullName}</td>
                      <td className="py-3 px-6">{contact.phone}</td>
                      <td className="py-3 px-6">{contact.email}</td>
                      <td
                        ref={tooltipRef}
                        className="py-3 px-6 relative cursor-pointer"
                        onClick={() => {
                          if (contact.description.length > 20) {
                            setActiveTooltip(
                              activeTooltip === index ? null : index
                            );
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <span>
                            {contact.description.length > 20
                              ? `${contact.description.substring(0, 20)}...`
                              : contact.description}
                          </span>
                        </div>
                        {contact.description.length > 20 &&
                          activeTooltip === index && (
                            <>
                              {/* Mobile View Modal */}
                              <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                                <div
                                  ref={modalRef}
                                  className="bg-white rounded-lg p-4 max-w-sm w-full relative"
                                >
                                  <button
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
                              {/* Desktop View Tooltip */}
                              <div className="hidden md:block absolute left-0 top-full mt-1 z-50 bg-gray-800 text-white text-sm rounded-md py-2 px-3 shadow-lg min-w-[200px] max-w-[300px]">
                                <p>{contact.description}</p>
                              </div>
                            </>
                          )}
                      </td>
                      <td className="py-3 px-6 cursor-pointer">
                        <span
                          className={`py-1 px-3 rounded-full text-xs ${
                            contact.interested === 1
                              ? "bg-green-100 text-green-500"
                              : "bg-red-100 text-red-500"
                          }`}
                        >
                          {contact.interested === 1
                            ? "Interested"
                            : "Not Interested"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between bg-white  px-4 py-3 border-t text-xs md:text-sm rounded-lg shadow-lg">
            <div className="text-gray-600 mb-2 md:mb-0">
              Showing {contacts.length} of {pagination.totalRecords} contacts
            </div>
            <div className="flex space-x-1">
              <button
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
                  key={index + 1}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: index + 1,
                    }))
                  }
                  className={`py-1 px-3 rounded   ${
                    pagination.currentPage === index + 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
                disabled={!pagination.hasNextPage}
                className={`py-1 px-3 rounded \${
                  pagination.hasNextPage 
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestedBuyersPage;
