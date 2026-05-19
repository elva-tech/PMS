import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import LoadingSpinner from "../Components/LoadingSpinner";

const ProtectedRoute = ({ children }) => {
  const { user, isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = tokenData.exp * 1000;
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  };

  const isAuthenticated =
    user?.success && isLoggedIn && isTokenValid(user.token);

  if (!isAuthenticated) {
    // Redirect them to the /home page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
