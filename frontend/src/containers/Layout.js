import React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import pageroutes from "../Routes/index";
import ProtectedRoute from "../utils/ProtectedRoute";
import Landingpage from "../Pages/Landingpage";
import ProjectsDashboard from "../Pages/ProjectDashboard";
const Layout = ({ children }) => {
  const location = useLocation();
  return (
    <div>
      <Routes>
        {pageroutes.map((page, index) => (
          <Route
            key={index}
            path={page.path}
            element={<ProtectedRoute element={<page.component />} />}
          />
        ))}
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="*" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Landingpage />} />
        {/* <Route path="/projects" element={<Navigate to="/home" />} /> */}
        {/* <Route path="/project" element={<ProjectsDashboard />} /> */}
      </Routes>
      {children}
    </div>
  );
};

export default Layout;
