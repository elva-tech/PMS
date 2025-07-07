import React from "react";
import slnlayout from "../Images/sln-layout.jpg";
import Navbar from "../Components/Navbar";
import { LandPlot, House } from "lucide-react";
import CreatePlot from "../Components/CreatePlotModal";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchPlots = async () => {
  const res = await axiosInstance.get("/plat/management/plot/filter");
  return res?.data?.data;
};
export const usePlots = () => {
  return useQuery({
    queryKey: ["plots"],
    queryFn: fetchPlots,
  });
};
const ProjectDetailsPage = () => {
  const [addProjectModal, setAddProjectModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: plots = [], isLoading, isError, error } = usePlots();

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-b from-blue-700 to-white pt-4 text-center pb-12 mt-10 px-4">
        <div className="container mx-auto">
          <div className=" text-white p-4  md:px-4 md:pt-4 mt-4 md:mt-4">
            {/* Project Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-2">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <House size={28} className="mt-1" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                    Modern Residential Complex
                  </h1>
                  <p className="text-sm sm:text-base text-white/90">
                    Premium Living Experience
                  </p>
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
                  src={slnlayout}
                  alt="Project"
                  className="rounded-lg w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 px-0 lg:px-6 pt-4 lg:pt-0">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-md bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    In Progress
                  </span>
                  <span className="text-md text-gray-500">
                    Location: <span className="text-black">Sira, Tumkur</span>
                  </span>
                </div>

                <p className="text-sm sm:text-md text-gray-700 mb-6 text-left">
                  A luxury residential complex featuring 200 premium apartments
                  designed with sustainable architecture and cutting-edge
                  technology. The project emphasizes energy efficiency, smart
                  home integration, and connection to nature. The complex
                  includes comprehensive amenities such as a resort-style
                  swimming pool, state-of-the-art fitness center, landscaped
                  community gardens, and dedicated children's playground areas.
                </p>

                <div className="text-sm sm:text-md text-left space-y-3">
                  <h2 className="font-semibold mb-4 text-lg">
                    Project Details
                  </h2>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Project ID:</span> 1
                  </p>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Start Date:</span> January 15,
                    2023
                  </p>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Expected Completion:</span>
                    December 30, 2024
                  </p>
                  <p className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Project Manager:</span> Sarah
                    Johnson
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Plots Table */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Available Plots
            </h2>

            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm text-left border-collapse rounded-lg overflow-hidden shadow-lg">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="text-center px-6 py-4 md:p-4">Plot No</th>
                    <th className="text-center px-10 py-4 md:p-4">Plot Size</th>
                    <th className="text-center px-4 py-4">Plot Price</th>
                    <th className="text-center px-10 py-4 md:p-4">Direction</th>
                    <th className="text-center px-10 py-4 md:p-4">Status</th>
                    <th className="text-center px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {[
                    [
                      "A-101",
                      "1,200 sq ft",
                      "₹250,000",
                      "North-East",
                      "Available",
                    ],
                    [
                      "A-102",
                      "1,500 sq ft",
                      "₹320,000",
                      "South-East",
                      "Not Available",
                    ],
                    [
                      "A-103",
                      "1,800 sq ft",
                      "₹380,000",
                      "North-West",
                      "Available",
                    ],
                    ["B-201", "2,200 sq ft", "₹450,000", "East", "Available"],
                    [
                      "B-202",
                      "1,350 sq ft",
                      "₹290,000",
                      "South-East",
                      "Not Available",
                    ],
                    [
                      "B-203",
                      "1,650 sq ft",
                      "₹340,000",
                      "West",
                      "Not Available",
                    ],
                    [
                      "C-301",
                      "2,500 sq ft",
                      "₹520,000",
                      "North",
                      "Not Available",
                    ],
                    [
                      "C-302",
                      "1,900 sq ft",
                      "₹400,000",
                      "South-West",
                      "Available",
                    ],
                    [
                      "C-303",
                      "2,100 sq ft",
                      "₹430,000",
                      "East",
                      "Not Available",
                    ],
                    [
                      "D-401",
                      "3,000 sq ft",
                      "₹650,000",
                      "North-East",
                      "Available",
                    ],
                  ].map(([no, size, price, dir, status]) => (
                    <tr key={no} className="border-t">
                      <td className="text-center p-4 font-medium text-gray-900">
                        {no}
                      </td>
                      <td className="text-center p-4">{size}</td>
                      <td className="text-center p-4">{price}</td>
                      <td className="text-center p-4">{dir}</td>
                      <td className="text-center p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            status === "Available"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td
                        className="text-center p-3 sm:p-4 text-blue-600 hover:underline cursor-pointer"
                        onClick={() => {
                          navigate(`/project/${id}/${no}`);
                        }}
                      >
                        View
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center items-center mt-4 text-sm text-gray-600">
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-100">
                  &lt; Previous
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded">
                  1
                </button>
                <button className="px-3 py-1 border rounded hover:bg-gray-100">
                  2
                </button>
                <button className="px-3 py-1 border rounded hover:bg-gray-100">
                  3
                </button>
                <button className="px-3 py-1 border rounded hover:bg-gray-100">
                  Next &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {addProjectModal && (
        <CreatePlot setAddProjectModal={setAddProjectModal} />
      )}
    </>
  );
};

export default ProjectDetailsPage;
