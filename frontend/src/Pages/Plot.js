import React from "react";
import slnlayout from "../Images/sln-layout.jpg";
import BalajiLayoutMap from "../Images/BalajilayoutMap.png";
import { LandPlot, House } from "lucide-react";
import CreatePlot from "../Components/CreatePlotModal";
import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { EyeIcon, Trash2, Edit2, Filter, ZoomIn } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  usePlots,
  usePlot,
  useCreatePlot,
  useUpdatePlot,
  useDeletePlot,
} from "../hooks/usePlotHooks";
import QuoteModal from "../Components/QuoteModal";
import ImageModal from "../Components/ImageModal";

const ProjectDetailsPage = ({
  projectName,
  projectDescription,
  projectStatus,
  projectLocation,
  projectManager,
  projectStartDate,
  projectEndDate,
  projectId,
  contactNumber,
  projectImageData,
}) => {
  const [addProjectModal, setAddProjectModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [plotNo, setPlotNo] = useState("");

  const {
    data: plotData = {},
    isLoading,
    isError,
    error,
  } = usePlot(id, currentPage, itemsPerPage, sortBy, sortOrder);
  const updatePlotMutation = useUpdatePlot();
  const deletePlotMutation = useDeletePlot();

  const plots = useMemo(() => {
    if (!plotData) return [];
    if (
      plotData.data &&
      plotData.data.plots &&
      Array.isArray(plotData.data.plots)
    ) {
      return plotData.data.plots;
    }
    if (Array.isArray(plotData)) return plotData;
    if (
      typeof plotData === "object" &&
      !Array.isArray(plotData) &&
      !plotData.data
    )
      return [plotData];
    return [];
  }, [plotData]);

  const pagination = useMemo(() => {
    return plotData && plotData.pagination
      ? plotData.pagination
      : {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          hasNextPage: false,
          hasPrevPage: false,
        };
  }, [plotData]);

  const [editPlotData, setEditPlotData] = useState(null);
  const handleEditPlot = (plot) => {
    const plotEdit = {
      projectId: id,
      plotId: plot._id,
      plotData: { ...plot },
    };
    setEditPlotData(plotEdit);
    setAddProjectModal(true);
  };
  const handleCloseModal = () => {
    setAddProjectModal(false);
    setEditPlotData(null);
  };

  return (
    <>
      <div className="bg-gradient-to-b from-blue-700 to-white pt-4 text-center pb-12 px-4 rounded-lg border">
        <div className="container mx-auto">
          <div className=" text-white p-4 md:px-4 md:pt-4">
            {/* Project Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-2">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <House size={28} className="mt-1" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                    {projectName}
                  </h1>
                </div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0 justify-center items-center">
                <button
                  className="border bg-white text-blue-600 px-4 py-2 hover:bg-blue-600 hover:text-white rounded flex items-center gap-2"
                  onClick={() => setAddProjectModal(true)}
                >
                  <LandPlot size={25} />
                  Add Plot
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 overflow-hidden mb-8">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-4">
              <div className="flex-1 h-64 lg:h-auto bg-white flex items-center justify-center">
                <img
                  src={
                    projectImageData &&
                    typeof projectImageData === "object" &&
                    projectImageData.data &&
                    projectImageData.contentType
                      ? `data:${projectImageData.contentType};base64,${projectImageData.data}`
                      : projectImageData || ""
                  }
                  alt="Project"
                  className="rounded-lg w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 px-0 lg:px-6 pt-4 lg:pt-0">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-md bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {projectStatus}
                  </span>
                  <span className="text-md text-gray-500">
                    Location:{" "}
                    <span className="text-black">{projectLocation}</span>
                  </span>
                </div>

                <p className="text-sm sm:text-md text-gray-700 mb-6 text-left">
                  {projectDescription}
                </p>

                <div className="text-sm sm:text-md text-left space-y-3">
                  <h2 className="font-semibold mb-4 text-lg">
                    Project Details
                  </h2>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Project ID:</span>
                    {projectId}
                  </p>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Start Date:</span>{" "}
                    {projectStartDate.split(",")[0]}
                  </p>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Expected Completion:</span>
                    {projectEndDate.split(",")[0]}
                  </p>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Project Manager:</span>{" "}
                    {projectManager}
                  </p>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Contact Number:</span>{" "}
                    {contactNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <>
            <div className="flex flex-col md:flex-row justify-between items-center px-6 space-y-4 md:space-y-0 mt-4">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center md:text-left ">
                Balaji Layout Site Map
              </h2>
            </div>
            <div className="relative w-full p-4 md:p-6">
              <div className="max-w-4xl mx-auto">
                <div className="relative group cursor-pointer rounded-lg overflow-hidden border-gray-400 border-2">
                  <img
                    src={BalajiLayoutMap}
                    alt="Balaji Layout Map"
                    className="w-full h-auto rounded-lg shadow-lg transition-transform duration-200"
                  />
                  <div className="absolute inset-0 md:hidden bg-black/20 flex items-center justify-center">
                    <div
                      className="bg-white/20 backdrop-blur-sm p-3 rounded-full active:bg-white/30 transition-all cursor-pointer"
                      onClick={() => setIsImageModalOpen(true)}
                    >
                      <ZoomIn className="text-white" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>

          {/* Plots Table */}
          <div>
            <div className="overflow-x-auto rounded-xl border shadow-lg">
              {!isLoading && !isError && plots.length === 0 ? (
                <div className="text-center p-6 bg-gray-100 rounded-lg">
                  <p className="text-lg text-gray-700">
                    No plots found. Click "Add Plot" to create your first plot.
                  </p>
                </div>
              ) : <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  Available Plots
                </h2> ? (
                <table className="min-w-full text-sm text-left border-collapse rounded-lg overflow-hidden shadow-lg">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th
                        className="text-center px-6 py-4 md:p-4 cursor-pointer"
                        onClick={() => {
                          if (sortBy === "plotnumber") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("plotnumber");
                            setSortOrder("asc");
                          }
                        }}
                      >
                        Plot No{" "}
                        {sortBy === "plotnumber" &&
                          (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-center px-10 py-4 md:p-4 cursor-pointer"
                        onClick={() => {
                          if (sortBy === "plotsize") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("plotsize");
                            setSortOrder("asc");
                          }
                        }}
                      >
                        Plot Size{" "}
                        {sortBy === "plotsize" &&
                          (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-center px-4 py-4 cursor-pointer"
                        onClick={() => {
                          if (sortBy === "plotprice") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("plotprice");
                            setSortOrder("asc");
                          }
                        }}
                      >
                        Plot Price{" "}
                        {sortBy === "plotprice" &&
                          (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-center px-10 py-4 md:p-4 cursor-pointer"
                        onClick={() => {
                          if (sortBy === "plotdirection") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("plotdirection");
                            setSortOrder("asc");
                          }
                        }}
                      >
                        Direction{" "}
                        {sortBy === "plotdirection" &&
                          (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-center px-10 py-4 md:p-4 cursor-pointer"
                        onClick={() => {
                          if (sortBy === "plotstatus") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("plotstatus");
                            setSortOrder("asc");
                          }
                        }}
                      >
                        Status{" "}
                        {sortBy === "plotstatus" &&
                          (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-center px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {plots.map((plot, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gray-100"
                      >
                        <td className="text-center p-4 font-medium text-gray-900">
                          {plot.plotnumber}
                        </td>
                        <td className="text-center p-4">{plot.plotsize}</td>
                        <td className="text-center p-4">{plot.plotprice}</td>
                        <td className="text-center p-4">
                          {plot.plotdirection}
                        </td>
                        <td className="text-center p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              plot.plotstatus === "Available"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {plot.plotstatus}
                          </span>
                        </td>
                        <td className="text-center p-4">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                              onClick={() => {
                                deletePlotMutation.mutate({
                                  projectId: id,
                                  plotId: plot._id,
                                });
                              }}
                              title="Delete Plot"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 transition-colors"
                              onClick={() => {
                                handleEditPlot(plot);
                              }}
                              title="Update Plot"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
            {/* Pagination Controls */}
            {!isLoading && !isError && plots.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 border-t rounded-lg shadow-lg text-xs md:text-sm">
                <div className="flex items-center mb-3 sm:mb-0">
                  <span className="text-sm text-gray-700 mr-3">
                    Showing <span className="font-medium">{plots.length}</span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {pagination.totalRecords}
                    </span>{" "}
                    plots
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={!pagination.hasPrevPage}
                  >
                    &lt;
                  </button>

                  <div className="flex space-x-1">
                    {pagination.currentPage > 2 && (
                      <button
                        className="px-3 py-1 bg-white border rounded-md text-sm"
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </button>
                    )}

                    {pagination.currentPage > 3 && (
                      <span className="px-2 py-1 text-sm">...</span>
                    )}

                    {pagination.currentPage > 1 && (
                      <button
                        className="px-3 py-1 bg-white border rounded-md text-sm"
                        onClick={() =>
                          setCurrentPage(pagination.currentPage - 1)
                        }
                      >
                        {pagination.currentPage - 1}
                      </button>
                    )}

                    <button className="px-3 py-1 bg-blue-600 text-white border rounded-md text-sm">
                      {pagination.currentPage}
                    </button>

                    {pagination.currentPage < pagination.totalPages && (
                      <button
                        className="px-3 py-1 bg-white border rounded-md text-sm"
                        onClick={() =>
                          setCurrentPage(pagination.currentPage + 1)
                        }
                      >
                        {pagination.currentPage + 1}
                      </button>
                    )}

                    {pagination.currentPage < pagination.totalPages - 2 && (
                      <span className="px-2 py-1 text-sm">...</span>
                    )}

                    {pagination.currentPage < pagination.totalPages - 1 &&
                      pagination.totalPages > 1 && (
                        <button
                          className="px-3 py-1 bg-white border rounded-md text-sm"
                          onClick={() => setCurrentPage(pagination.totalPages)}
                        >
                          {pagination.totalPages}
                        </button>
                      )}
                  </div>

                  <button
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, pagination.totalPages)
                      )
                    }
                    disabled={!pagination.hasNextPage}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {addProjectModal && (
        <CreatePlot
          setAddProjectModal={handleCloseModal}
          editPlotData={editPlotData}
        />
      )}

      {isQuoteOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 bg-gray-700 z-50">
          <QuoteModal onClose={() => setIsQuoteOpen(false)} plotNo={plotNo} />
        </div>
      )}

      {isImageModalOpen && (
        <ImageModal
          imageUrl={BalajiLayoutMap}
          altText="Balaji Layout Map"
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProjectDetailsPage;
