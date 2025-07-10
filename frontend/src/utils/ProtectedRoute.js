import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const ProtectedRoute = ({ element }) => {
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) return null;

  // Check if user exists, is logged in, and has a valid token
  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = tokenData.exp * 1000;
      console.log("Token expiration time:", expirationTime);
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  };
  // Uncomment the line below if you want to check token validity in production level
  // const isAuthenticated = user?.success && isLoggedIn && isTokenValid(user.data);
  const isAuthenticated = user?.success && isLoggedIn;
  return isAuthenticated ? element : <Navigate to="/home" replace />;
};

export default ProtectedRoute;
