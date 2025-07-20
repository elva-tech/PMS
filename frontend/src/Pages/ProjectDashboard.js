import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import { HousePlus, LandPlot, Pencil, Trash2, FolderOpen } from "lucide-react";
import slnlayout from "../Images/sln-layout.jpg";
import nrlayout from "../Images/nr-layout.jpg";
import balajilayout from "../Images/balaji-layout.jpg";
import dollarcolonylayout from "../Images/dollars-colony.jpg";
import CreateProject from "../Components/CreateProjectModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "../hooks/useProjectHooks";

const defaultImages = {
  "In Progress": slnlayout,
  Completed: balajilayout,
  "Not Started": nrlayout,
};

const ProjectCard = ({ project, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const projectId = project?._id || project?.id;
  const projectName = project?.name || project?.title || "Untitled Project";
  const projectDescription = project?.description || "No description available";
  const projectLocation = project?.location || "No location specified";
  const projectStatus = project?.status || "Not Started";
  const hasImage = project?.hasImage || false;

  const getProjectImageSource = () => {
    if (project?.image?.data && project?.image?.contentType) {
      return `data:${project.image.contentType};base64,${project.image.data}`;
    } else if (hasImage && projectId) {
      return `${axiosInstance.defaults.baseURL}/api/v1/projects/${projectId}/image`;
    }
    return defaultImages[projectStatus] || defaultImages["In Progress"];
  };

  const projectImage = getProjectImageSource();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      setIsDeleting(true);
      onDelete(projectId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-200">
      <div className="relative">
        <img
          src={projectImage}
          alt={projectName}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
            onClick={() => onEdit(project)}
            disabled={isDeleting}
          >
            <Pencil size={20} />
          </button>
          <button
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={20} className={isDeleting ? "text-gray-400" : ""} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">{projectName}</h2>
        <p className="text-gray-600 mb-2">{projectDescription}</p>
        <p className="text-gray-800 font-semibold">
          Location: <span className="text-gray-600">{projectLocation}</span>
        </p>
        <div className="flex justify-between items-center mt-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              projectStatus === "Completed"
                ? "bg-green-100 text-green-800"
                : projectStatus === "In Progress"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {projectStatus}
          </span>
          <button
            className="bg-white border border-gray-300 text-black px-4 py-2 rounded hover:bg-gray-100"
            onClick={() => {
              navigate(`/project/${projectId}`);
            }}
            disabled={isDeleting || !projectId}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProjectsDashboard() {
  const { data: projectsData = [], isLoading, isError, error } = useProjects();
  const deleteProjectMutation = useDeleteProject();
  const updateProjectMutation = useUpdateProject();

  const projects = React.useMemo(() => {
    if (!projectsData) return [];
    if (Array.isArray(projectsData)) return projectsData;
    if (projectsData.projects && Array.isArray(projectsData.projects))
      return projectsData.projects;
    if (typeof projectsData === "object") return [projectsData];
    return [];
  }, [projectsData]);

  const [editProjectData, setEditProjectData] = useState(null);
  const [addProjectModal, setAddProjectModal] = useState(false);

  const handleEditProject = (project) => {
    const projectToEdit = {
      _id: project._id || project.id,
      name: project.name || project.title,
      description: project.description || "",
      location: project.location || "",
      status: project.status || "Not Started",
    };

    setEditProjectData(projectToEdit);
    setAddProjectModal(true);
  };

  const handleDeleteProject = (projectId) => {
    if (!projectId) {
      console.error("Cannot delete project: No project ID provided");
      return;
    }
    console.log("Attempting to delete project with ID:", projectId);
    deleteProjectMutation.mutate(projectId);
  };

  const handleCloseModal = () => {
    setAddProjectModal(false);
    setEditProjectData(null);
  };

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

          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {isError && (
            <div className="text-center p-6 bg-red-100 rounded-lg text-red-700">
              <p>Error loading projects: {error?.message || "Unknown error"}</p>
              <button
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && projects.length === 0 && (
            <div className="text-center p-6 bg-gray-100 rounded-lg">
              <p className="text-lg text-gray-700">
                No projects found. Click "Add Project" to create your first
                project.
              </p>
            </div>
          )}

          {!isLoading && !isError && projects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={
                    project._id ||
                    project.id ||
                    Math.random().toString(36).substring(7)
                  }
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </div>

        {addProjectModal && (
          <CreateProject
            setAddProjectModal={handleCloseModal}
            projectToEdit={editProjectData}
          />
        )}
      </div>
    </>
  );
}
