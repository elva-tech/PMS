import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, Phone, User, Calendar } from "lucide-react";
import Navbar from "../Components/Navbar";
import FooterSection from "../Components/FooterSection";

const PublicProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/v1/public/projects/${id}`,
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
            {project.image ? (
              <img
                src={`data:${project.image.contentType};base64,${project.image.data}`}
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
                onClick={() => navigate("/home")}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Contact Us for More Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default PublicProjectDetails;
