import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus, UserPlus, FileDiff } from "lucide-react";
import LoadingSpinner from "../Components/LoadingSpinner";
import { usePlot, useDeletePlot, useUpdatePlot } from "../hooks/usePlotHooks";
import DeleteModal from "../Components/DeleteModal";
import CreatePlotModal from "../Components/CreatePlotModal";

const GeneralInfoPage = ({ projectId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [plotToEdit, setPlotToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [plotToDelete, setPlotToDelete] = useState(null);

  const deletePlotMutation = useDeletePlot();
  const updatePlotMutation = useUpdatePlot();

  const {
    data: plotsResponse,
    isLoading,
    isError,
    error,
  } = usePlot(
    projectId,
    pagination.currentPage,
    10,
    sortConfig.sortBy,
    sortConfig.sortOrder
  );

  const plotsData = plotsResponse?.data?.plots || [];

  useEffect(() => {
    if (plotsResponse?.pagination) {
      setPagination(plotsResponse.pagination);
    }
  }, [plotsResponse?.pagination]);

  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "available":
        return "Available";
      case "sold":
        return "Sold";
      case "reserved":
        return "Reserved";
      default:
        return status || "Unknown";
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "available":
        return "bg-green-100 text-green-700";
      case "sold":
        return "bg-red-100 text-red-700";
      case "reserved":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const handleEditPlot = (plot) => {
    setPlotToEdit(plot);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setPlotToEdit(null);
  };

  const handleDeletePlot = (plot) => {
    setPlotToDelete(plot);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (plotToDelete) {
      deletePlotMutation.mutate(
        { projectId, plotId: plotToDelete._id },
        {
          onSuccess: () => {
            setIsDeleteModalOpen(false);
            setPlotToDelete(null);
          },
        }
      );
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setPlotToDelete(null);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 text-center sm:text-left w-full lg:w-auto">
          Plots [{pagination.totalRecords}]
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto sm:min-w-[250px]">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Search plots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-row space-x-2 w-full sm:w-auto">
            <button
              onClick={() =>
                setSortConfig((prev) => ({
                  sortBy: "createdAt",
                  sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
                }))
              }
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-center transition-all duration-200 h-[42px]"
            >
              <span className="hidden sm:inline">Sort by: </span>
              {sortConfig.sortOrder === "desc" ? "Newest" : "Oldest"}
              <i
                className={`fas fa-chevron-${
                  sortConfig.sortOrder === "desc" ? "down" : "up"
                } ml-2`}
              ></i>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error?.message || "Failed to fetch plots"}
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto shadow-lg">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-lg mt-4">
              <thead>
                <tr className="w-full bg-blue-600 text-left text-white uppercase text-xs md:text-sm mt-4">
                  <th className="py-3 px-4">Plot Number</th>
                  <th className="py-3 px-4">Plot Size</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-xs md:text-sm font-semibold">
                {plotsData
                  .filter(
                    (plot) =>
                      plot.plotnumber
                        ?.toString()
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      plot.plotsize
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      plot.plotdirection
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                  )
                  .map((plot) => (
                    <tr
                      key={plot._id}
                      className="border-b border-gray-200 hover:bg-gray-100"
                    >
                      <td className="py-3 px-4">{plot.plotnumber}</td>
                      <td className="py-3 px-4">{plot.plotsize}</td>
                      <td className="py-3 px-4">
                        {plot.plotprice
                          ? `₹${Number(plot.plotprice).toLocaleString("en-IN")}`
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {plot.plotdirection || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            plot.plotstatus
                          )}`}
                        >
                          {getStatusText(plot.plotstatus)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {plot.createdAt?.split(",")[0] || "N/A"}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          className="flex items-center gap-1 px-2 py-1 text-gray-700 hover:bg-gray-100 text-sm"
                          onClick={() => handleEditPlot(plot)}
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 text-sm"
                          onClick={() => handleDeletePlot(plot)}
                        >
                          <FileDiff className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 text-xs md:text-sm rounded-lg shadow-lg">
            <div className="text-gray-600 mb-2 md:mb-0">
              Showing {plotsData.length} of {pagination.totalRecords} plots
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

      {isCreateModalOpen && (
        <CreatePlotModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          projectId={projectId}
          plotToEdit={plotToEdit}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          title="Delete Plot"
          message={`Are you sure you want to delete Plot ${plotToDelete?.plotnumber}?`}
          confirmText="Delete Plot"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default GeneralInfoPage;
