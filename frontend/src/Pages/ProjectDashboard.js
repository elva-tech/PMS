import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import { HousePlus, LandPlot, Pencil, Trash2, FolderOpen } from "lucide-react";
import slnlayout from "../Images/sln-layout.jpg";
import nrlayout from "../Images/nr-layout.jpg";
import balajilayout from "../Images/balaji-layout.jpg";
import dollarcolonylayout from "../Images/dollars-colony.jpg";
import CreateProject from "../Components/CreateProjectModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const project = [
  {
    id: 1,
    title: "Modern Residential Complex",
    description:
      "A luxury residential complex with 200 apartments and premium amenities.",
    status: "In Progress",
    location: "Sira Road",
    image: slnlayout,
  },
  {
    id: 2,
    title: "Commercial Office Tower",
    description:
      "A 30-story office tower with sustainable design features and smart technology.",
    status: "Completed",
    location: "Gubbi Road",
    image: balajilayout,
  },
  {
    id: 3,
    title: "Urban Mixed-Use Development",
    description:
      "A mixed-use development with retail, office, and residential spaces.",
    status: "Completed",
    location: "Nelamangala",
    image: nrlayout,
  },
  {
    id: 4,
    title: "Commercial Office Tower",
    description:
      "A 30-story office tower with sustainable design features and smart technology.",
    status: "Not Started",
    location: "Sondekoppa",
    image: dollarcolonylayout,
  },
];

const fetchProjects = async () => {
  const res = await axiosInstance.get("/plat/management/land-project/filter");
  return res?.data?.data;
};
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProject) =>
      axiosInstance.post("/plat/management/land-project", newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      axiosInstance.put(`/plat/management/land-project/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-200">
      <div className="relative">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button className="bg-white p-2 rounded-full shadow hover:bg-gray-100">
            <Pencil size={20} />
          </button>
          <button className="bg-white p-2 rounded-full shadow hover:bg-gray-100">
            <Trash2 size={20} />
          </button>
          {/* <button className="bg-white p-2 rounded-full shadow hover:bg-gray-100">
            <FolderOpen size={20} />
          </button> */}
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">{project.title}</h2>
        <p className="text-gray-600 mb-2">{project.description}</p>
        <p className="text-gray-800 font-semibold">
          Location: <span className="text-gray-600">{project.location}</span>
        </p>
        <div className="flex justify-between items-center mt-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              project.status === "Completed"
                ? "bg-green-100 text-green-800"
                : project.status === "In Progress"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {project.status}
          </span>
          <button
            className="bg-white border border-gray-300 text-black px-4 py-2 rounded hover:bg-gray-100"
            onClick={() => {
              navigate(`/project/${project.id}`);
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProjectsDashboard() {
  const { user } = useAuth();
  const { data: projects = [], isLoading, isError, error } = useProjects();

  const [loading, setLoading] = useState(true);
  const [addProjectModal, setAddProjectModal] = useState(false);

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-b from-blue-700 to-white pt-4 text-center pb-12 mt-10">
        <div className="container mx-auto p-6 mt-2">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold mb-4 md:mb-0 text-white">
              Projects Dashboard
            </h1>
            <div className="flex gap-3">
              <button
                className="bg-white border border-gray-300 text-black px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 hover:text-white"
                onClick={() => setAddProjectModal(true)}
              >
                <HousePlus size={25} />
                Add Project
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {project.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        {addProjectModal && (
          <CreateProject setAddProjectModal={setAddProjectModal} />
        )}
        {/* {addProjectModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <CreateProject setAddProjectModal={setAddProjectModal} />
            </div>
          </div>
        )} */}
      </div>
    </>
  );
}
