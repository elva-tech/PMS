import React, { useState, useEffect } from "react";
import sjdlogo1 from "../Images/sjd-logo1.png";
import {
  FileSpreadsheet,
  Info,
  Users,
  BadgeIndianRupee,
  CircleUserRound,
  Menu,
  X,
  ChevronRight,
  Files,
  FileUp,
  FileText,
  CalendarDays,
  FileBox,
  Eye,
  Trash2,
  SendHorizontal,
  Map,
  Search,
  Filter,
  Power,
} from "lucide-react";
import UploadDocument from "../Components/DocumentUploadModal";
import ReactPaginate from "react-paginate";
import BalajiLayoutMap from "../Images/BalajilayoutMap.png";
import QuoteModal from "../Components/QuoteModal";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useProject } from "../Context/ProjectContext";
import DocumentDetailsPage from "./DocumentDetailsPage";
import InterestedBuyersPage from "./InterestedBuyersPage";
import PaymentsPage from "./PaymentsPage";
import LayoutPageDetails from "./LayoutPageDetails";
import GeneralInfoPage from "./GeneralInfoPage";

const PropertyDetailsPage = () => {
  const { user, logout } = useAuth();
  const { id, plot } = useParams();
  const navigate = useNavigate();
  const { projectId, setProjectId, plotId, setPlotId } = useProject();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [documentspage, setDocumentsPage] = useState(false);
  const [generalinfopage, setGeneralInfoPage] = useState(false);
  const [interestedbuyerspage, setInterestedBuyersPage] = useState(false);
  const [paymentmadepage, setPaymentMadePage] = useState(false);
  const [layoutpage, setLayoutPage] = useState(false);
  const [documentUploadModal, setDocumentUploadModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState("documents");

  useEffect(() => {
    if (id) setProjectId(id);
    if (plot) setPlotId(plot);
  }, [id, plot, setProjectId, setPlotId]);

  const handleNavClick = (page) => {
    setIsSidebarOpen(false);
    setActiveMenu(page);

    setDocumentsPage(false);
    setGeneralInfoPage(false);
    setInterestedBuyersPage(false);
    setPaymentMadePage(false);
    setLayoutPage(false);

    if (page === "documents") setDocumentsPage(true);
    if (page === "generalInfo") setGeneralInfoPage(true);
    if (page === "interestedBuyers") setInterestedBuyersPage(true);
    if (page === "paymentsMade") setPaymentMadePage(true);
    if (page === "layout") setLayoutPage(true);
  };

  const [searchTerm, setSearchTerm] = useState("");

  // const location = useLocation();
  //  const [isLoginOpen, setIsLoginOpen] = useState(false);
  //  const [isOpen, setIsOpen] = useState(false);

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
          <div className="flex flex-col h-full p-4">
            <nav className="flex-grow">
              <ul className="space-y-2 text-lg font-medium">
                {[
                  {
                    icon: <FileSpreadsheet size={20} className="text-white" />,
                    label: "Documents",
                    id: "documents",
                  },
                  {
                    icon: <Info size={20} className="text-white" />,
                    label: "General Info",
                    id: "generalInfo",
                  },
                  {
                    icon: <Users size={20} className="text-white" />,
                    label: "Interested Buyers",
                    id: "interestedBuyers",
                  },
                  {
                    icon: <BadgeIndianRupee size={20} className="text-white" />,
                    label: "Payments",
                    id: "paymentsMade",
                  },
                  {
                    icon: <Map size={20} className="text-white" />,
                    label: "Layout",
                    id: "layout",
                  },
                ].map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
                transition-colors duration-200
                hover:bg-white/30 hover:text-white
                ${
                  activeMenu === item.id
                    ? "bg-white/30 text-white"
                    : "text-white"
                }`}
                  >
                    {item.icon}
                    <span className="font-medium text-white">{item.label}</span>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-white pt-4 mt-auto">
              <div className="flex items-center gap-3 px-4 py-2 text-white">
                <CircleUserRound size={24} />
                <span className="font-medium">{user?.name || "Abhishek"}</span>
              </div>
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  logout();
                  navigate("/home");
                }}
                className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded-lg
            transition-colors duration-200 hover:bg-red-600
            flex items-center justify-center gap-2"
              >
                <Power size={20} className="text-white" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-6 min-h-full">
            <h2 className="flex flex-row text-xl font-semibold text-gray-800 pb-2 border-b items-center gap-2">
              {documentspage
                ? "Documents"
                : generalinfopage
                ? "General Information"
                : interestedbuyerspage
                ? "Interested Buyers"
                : paymentmadepage
                ? "Payments Made"
                : layoutpage
                ? "Layout"
                : null}
              <ChevronRight size={25} />
              Balaji Layout - Plot 51
            </h2>

            {generalinfopage && <GeneralInfoPage />}

            {documentspage && <DocumentDetailsPage />}

            {interestedbuyerspage && <InterestedBuyersPage />}

            {paymentmadepage && <PaymentsPage />}

            {layoutpage && <LayoutPageDetails />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
