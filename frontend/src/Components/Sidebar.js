import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileSpreadsheet,
  Info,
  Users,
  BadgeIndianRupee,
  CircleUserRound,
  Map,
  Power,
  FolderKanban,
  LandPlot,
  CornerDownRight,
  HousePlus,
} from "lucide-react";
import { FaUsers } from "react-icons/fa";
import { PiUsersFour } from "react-icons/pi";
import { useAuth } from "../Context/AuthContext";

const Sidebar = ({ activeMenu, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { id, plot } = useParams();

  const getMenuItems = () => {
    const baseMenuItems = [
      {
        icon: <FolderKanban size={20} className="text-white" />,
        label: "Project",
        id: "project",
        path: `/project`,
      },
    ];

    // If we're viewing a specific project, add plots option
    if (id) {
      baseMenuItems.push({
        icon: (
          <div className="flex items-center gap-4">
            <CornerDownRight size={16} className="text-white mr-1" />
            <LandPlot size={20} className="text-white" />
          </div>
        ),
        label: "Plots",
        id: "plots",
        path: `/project/${id}`,
      });
    }

    // Add other menu items
    baseMenuItems.push(
      {
        icon: <FaUsers size={20} className="text-white" />,
        label: "Users",
        id: "users",
        path: `/project/${id}/users`,
      },
      {
        icon: <FileSpreadsheet size={20} className="text-white" />,
        label: "Documents",
        id: "documents",
        path: `/project/${id}/documents`,
      },
      {
        icon: <HousePlus size={20} className="text-white" />,
        label: "Plot Allotment",
        id: "plotallotment",
        path: `/project/${id}/plotallotment`,
      },
      {
        icon: <PiUsersFour size={20} className="text-white" />,
        label: "Interested Buyers",
        id: "interestedbuyers",
        path: `/project/${id}/interestedbuyers`,
      },
      {
        icon: <BadgeIndianRupee size={20} className="text-white" />,
        label: "Payments",
        id: "payments",
        path: `/project/${id}/payments`,
      }
    );

    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  const handleNavClick = (path) => {
    setIsSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsSidebarOpen(false);
    logout();
    navigate("/home");
  };

  return (
    <div className="flex flex-col h-full p-4">
      <nav className="flex-grow">
        <ul className="space-y-2 font-medium text-sm">
          {menuItems.map((item) => (
            <li
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
              transition-colors duration-200
              hover:bg-white/30 hover:text-white
              ${
                activeMenu === item.id ? "bg-white/30 text-white" : "text-white"
              }`}
            >
              {item.icon}
              <span className="font-medium text-white">{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white mt-auto">
        <div className="flex items-center gap-3 px-4 py-2 text-white">
          <CircleUserRound size={24} />
          <span className="font-medium">{user?.name || "Abhishek"}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded-lg
          transition-colors duration-200 hover:bg-red-600
          flex items-center justify-center gap-2"
        >
          <Power size={20} className="text-white" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
