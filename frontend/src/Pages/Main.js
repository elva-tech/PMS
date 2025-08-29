import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import sjdlogo1 from "../Images/sjd-logo1.png";
import { Menu, ChevronRight } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useProject } from "../Context/ProjectContext";
import DocumentDetailsPage from "./DocumentDetailsPage";
import InterestedBuyersPage from "./InterestedBuyersPage";
import PaymentsPage from "./PaymentsPage";
import LayoutPageDetails from "./LayoutPageDetails";
import GeneralInfoPage from "./GeneralInfoPage";
import ProjectsDashboard from "./ProjectDashboard";
import Plot from "./Plot";
import Sidebar from "../Components/Sidebar";
import axiosInstance from "../utils/axiosInstance";

const PropertyDetailsPage = () => {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  const { user } = useAuth();
  const { id, plot } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, setProjectId, plotId, setPlotId } = useProject();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isLoggedIn, loading } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectImageData, setProjectImageData] = useState(null);
  const [projectManager, setProjectManager] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate("/home");
      return;
    }

    if (id && plot) {
      setProjectId(id);
      setPlotId(plot);
    }
  }, [id, plot, isLoggedIn, loading, navigate, setProjectId, setPlotId]);

  const getActiveMenu = () => {
    const path = location.pathname;
    // Check the most specific routes first
    if (path.includes("/users")) return "users";
    if (path.includes("/documents")) return "documents";
    if (path.includes("/plotallotment")) return "plotallotment";
    if (path.includes("/interestedbuyers")) return "interestedbuyers";
    if (path.includes("/payments")) return "payments";

    // Check for plots last (least specific condition)
    if (
      path.includes("/project") &&
      path.split("/").length > 2 &&
      id &&
      !path.includes("/users") &&
      !path.includes("/documents") &&
      !path.includes("/plotallotment") &&
      !path.includes("/interestedbuyers") &&
      !path.includes("/payments")
    )
      return "plots";
    // if (path.includes("/project")) return "project";
    return "layout";
  };

  const [activeMenu, setActiveMenu] = useState(getActiveMenu());
  useEffect(() => {
    if (id) setProjectId(id);
    if (plot) setPlotId(plot);
    setActiveMenu(getActiveMenu());
  }, [id, plot, setProjectId, setPlotId, location]);

  useMemo(() => {
    if (id && activeMenu === "plots") {
      // Fetch project name based on ID
      const fetchProjectDetails = async () => {
        try {
          const response = await axiosInstance.get(`/api/v1/projects/${id}`);
          console.log("Project Name:", response?.data?.data);
          setProjectName(
            response?.data?.data?.project?.name || "Unknown Project"
          );
          setProjectDescription(
            response?.data?.data?.project?.description || "No Description"
          );
          setProjectStatus(
            response?.data?.data?.project?.status || "Unknown Status"
          );
          setProjectLocation(
            response?.data?.data?.project?.location || "Unknown Location"
          );
          setProjectManager(
            response?.data?.data?.project?.projectManager || "Unknown Manager"
          );
          setProjectStartDate(
            response?.data?.data?.project?.startDate || "Unknown Start Date"
          );
          setProjectEndDate(
            response?.data?.data?.project?.endDate || "Unknown End Date"
          );
          setContactNumber(
            response?.data?.data?.project?.contactNumber || "Unknown Contact"
          );
          if (
            response?.data?.data?.project?.image?.data &&
            response?.data?.data?.project?.image?.contentType
          ) {
            setProjectImageData({
              data: response?.data?.data?.project?.image?.data,
              contentType: response?.data?.data?.project?.image?.contentType,
            });
          } else {
            setProjectImageData(null);
          }
        } catch (error) {
          console.error("Failed to fetch project name", error);
          setProjectName("Unknown Project");
        }
      };
      fetchProjectDetails();
    }
    // We only want to re-run this when id or activeMenu changes
  }, [id, activeMenu]);

  const getCurrentPageTitle = () => {
    switch (activeMenu) {
      case "project":
        return "Project Dashboard";
      case "plots":
        return `${projectName} > Plots`;
      case "documents":
        return "Documents";
      case "plotallotment":
        return "Plot Allotment";
      case "interestedbuyers":
        return "Interested Buyers";
      case "payments":
        return "Payments Made";
      case "users":
        return "Users";
      default:
        return "Users";
    }
  };

  const getCurrentPageComponent = () => {
    switch (activeMenu) {
      case "project":
        return <ProjectsDashboard />;
      case "plots":
        return (
          <Plot
            projectName={projectName}
            projectDescription={projectDescription}
            projectStatus={projectStatus}
            projectLocation={projectLocation}
            projectManager={projectManager}
            projectStartDate={projectStartDate}
            projectEndDate={projectEndDate}
            projectId={id}
            contactNumber={contactNumber}
            projectImageData={projectImageData}
          />
        );
      case "documents":
        return <DocumentDetailsPage />;
      case "plotallotment":
        return <GeneralInfoPage />;
      case "interestedbuyers":
        return <InterestedBuyersPage />;
      case "payments":
        return <PaymentsPage />;
      case "layout":
        return <LayoutPageDetails />;
      default:
        return <LayoutPageDetails />;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-blue-700 to-white overflow-hidden">
      <nav className="bg-blue-700 border-b border-white shadow-md fixed top-0 left-0 w-full z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <img src={sjdlogo1} alt="SJD Logo" className="h-8" />
            <h1 className="text-lg font-bold text-white">Abhi Developers</h1>
          </div>
          <button
            className="absolute right-4 md:hidden text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={30} />
          </button>
        </div>
      </nav>

      <div className="flex pt-16 h-screen">
        <aside
          className={`fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-blue-700 shadow-lg transition-transform duration-300 ease-in-out z-40 md:z-[1]
            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
        >
          <Sidebar
            activeMenu={activeMenu}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {activeMenu !== "plots" ? (
            <div className="bg-white rounded-lg shadow-2xl p-6 min-h-full">
              <h2 className="flex flex-row text-xl font-semibold text-gray-800 pb-2 border-b items-center gap-2">
                {getCurrentPageTitle()}
              </h2>
              {getCurrentPageComponent()}
            </div>
          ) : (
            <div>{getCurrentPageComponent()}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
