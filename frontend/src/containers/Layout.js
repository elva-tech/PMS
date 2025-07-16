import React, { Suspense } from "react";
import LoadingSpinner from "../Components/LoadingSpinner";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import pageroutes from "../Routes/index";
import ProtectedRoute from "../utils/ProtectedRoute";
import Landingpage from "../Pages/Landingpage";
import ProjectsDashboard from "../Pages/ProjectDashboard";
const Layout = () => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/home" element={<Landingpage />} />
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Protected Routes */}
        {pageroutes.map((page, index) => (
          <Route
            key={index}
            path={page.path}
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <page.component />
                </Suspense>
              </ProtectedRoute>
            }
          />
        ))}

        {/* Catch all route */}
        <Route
          path="*"
          element={
            pathname === "/" ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/home" replace state={{ from: pathname }} />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default Layout;
