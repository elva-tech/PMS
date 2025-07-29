import React, { createContext, useState, useContext, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = tokenData.exp * 1000;
      return Date.now() < expirationTime;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.success && isTokenValid(userData.token)) {
          setUser(userData);
          setIsLoggedIn(true);
          // Refresh the token or validate with backend
          try {
            const validationResponse = await axiosInstance.get(
              "/api/v1/auth/validate"
            );
            if (!validationResponse.data.success) {
              throw new Error("Token validation failed");
            }
          } catch (err) {
            console.error("Token validation failed:", {
              message: err.message,
              response: err.response?.data,
              status: err.response?.status,
              headers: err.response?.headers,
            });
            // Only logout if it's an auth error (401) or token is invalid
            if (
              err.response?.status === 401 ||
              err.message === "Token validation failed"
            ) {
              logout();
            }
          }
        } else {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/api/v1/auth/login", {
        username,
        password,
      });
      if (response.data.success && isTokenValid(response.data.token)) {
        setIsLoggedIn(true);
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        return true;
      } else {
        throw new Error("Invalid token received");
      }
    } catch (err) {
      setIsLoggedIn(false);
      setError("Invalid credentials");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, error, isLoggedIn }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
