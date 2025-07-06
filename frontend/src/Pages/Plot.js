import React from "react";
import slnlayout from "../Images/sln-layout.jpg";
import Navbar from "../Components/Navbar";
import { LandPlot } from "lucide-react";
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
      <div className="bg-gradient-to-b from-blue-700 to-white pt-4 text-center pb-12 mt-10">
        <div className="container mx-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2 mb-6">
            <h1 className="text-2xl font-semibold text-white">
              Modern Residential Complex
            </h1>
            <div className="flex gap-3 justify-center">
              <button
                className="mt-2 md:mt-0 bg-white border border-gray-300 text-black px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 hover:text-white justify-center"
                onClick={() => setAddProjectModal(true)}
              >
                <LandPlot size={25} />
                Add Plot
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 overflow-hidden mb-8">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 h-64 lg:h-auto bg-white flex items-center justify-center">
                <img
                  src={slnlayout}
                  alt="Project"
                  className="rounded-lg w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 px-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-md bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    In Progress
                  </span>
                  <span className="text-md text-gray-500">
                    Location: <span className="text-black">New York, NY</span>
                  </span>
                </div>

                <p className="text-md text-gray-700 mb-4 text-left">
                  A luxury residential complex with 200 apartments and premium
                  amenities. The project features sustainable design elements,
                  energy-efficient systems, and smart home technology. The
                  complex includes a swimming pool, fitness center, community
                  garden, and playground. The architecture emphasizes open
                  spaces, natural light, and a connection to the surrounding
                  environment.
                </p>

                <div className="text-md text-left">
                  <h2 className="font-semibold mb-2">Project Details</h2>
                  <p>
                    <span className="font-medium">Project ID:</span> 1
                  </p>
                  <p>
                    <span className="font-medium">Start Date:</span> January 15,
                    2023
                  </p>
                  <p>
                    <span className="font-medium">Expected Completion:</span>{" "}
                    December 30, 2024
                  </p>
                  <p>
                    <span className="font-medium">Project Manager:</span> Sarah
                    Johnson
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Available Plots</h2>
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm text-left border-collapse rounded-lg overflow-hidden shadow-lg">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="p-4">Plot No</th>
                    <th className="p-4">Plot Size</th>
                    <th className="p-4">Plot Price</th>
                    <th className="p-4">Direction</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {[
                    ["A-101", "1,200 sq ft", "$250,000", "North-East"],
                    ["A-102", "1,500 sq ft", "$320,000", "South"],
                    ["A-103", "1,800 sq ft", "$380,000", "North-West"],
                    ["B-201", "2,200 sq ft", "$450,000", "East"],
                    ["B-202", "1,350 sq ft", "$290,000", "South-East"],
                    ["B-203", "1,650 sq ft", "$340,000", "West"],
                    ["C-301", "2,500 sq ft", "$520,000", "North"],
                    ["C-302", "1,900 sq ft", "$400,000", "South-West"],
                    ["C-303", "2,100 sq ft", "$430,000", "East"],
                    ["D-401", "3,000 sq ft", "$650,000", "North-East"],
                  ].map(([no, size, price, dir]) => (
                    <tr key={no} className="border-t">
                      <td className="p-4 font-medium text-gray-900">{no}</td>
                      <td className="p-4">{size}</td>
                      <td className="p-4">{price}</td>
                      <td className="p-4">{dir}</td>
                      <td
                        className="p-4 text-black hover:underline cursor-pointer"
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

            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <div>Showing 1-10 of 24 plots</div>
              <div className="flex gap-2">
                <button className="px-2 py-1 border rounded">
                  &lt; Previous
                </button>
                <button className="px-3 py-1 bg-black text-white rounded">
                  1
                </button>
                <button className="px-3 py-1 border rounded">2</button>
                <button className="px-3 py-1 border rounded">3</button>
                <button className="px-2 py-1 border rounded">Next &gt;</button>
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
