import React, { useState, useEffect } from "react";
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
import Sidebar from "../Components/Sidebar";

const PropertyDetailsPage = () => {
  // Add loading state
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
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
    if (path.includes("/layout")) return "layout";
    if (path.includes("/documents")) return "documents";
    if (path.includes("/generalinfo")) return "generalinfo";
    if (path.includes("/interestedbuyers")) return "interestedbuyers";
    if (path.includes("/payments")) return "payments";
    return "layout";
  };

  const [activeMenu, setActiveMenu] = useState(getActiveMenu());

  useEffect(() => {
    if (id) setProjectId(id);
    if (plot) setPlotId(plot);
    setActiveMenu(getActiveMenu());
  }, [id, plot, setProjectId, setPlotId, location]);

  const getCurrentPageTitle = () => {
    switch (activeMenu) {
      case "documents":
        return "Documents";
      case "generalinfo":
        return "General Information";
      case "interestedbuyers":
        return "Interested Buyers";
      case "payments":
        return "Payments Made";
      case "layout":
        return "Layout";
      default:
        return "Layout";
    }
  };

  const getCurrentPageComponent = () => {
    switch (activeMenu) {
      case "documents":
        return <DocumentDetailsPage />;
      case "generalinfo":
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
          <div className="bg-white rounded-lg shadow-2xl p-6 min-h-full">
            <h2 className="flex flex-row text-xl font-semibold text-gray-800 pb-2 border-b items-center gap-2">
              {getCurrentPageTitle()}
              <ChevronRight size={25} />
              Balaji Layout - Plot 51
            </h2>

            {getCurrentPageComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
