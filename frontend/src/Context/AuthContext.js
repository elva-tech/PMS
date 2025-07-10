import React, { createContext, useState, useContext, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const FALLBACK_CREDENTIALS = {
    username: "admin",
    password: "1234",
  };
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
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.success && isTokenValid(userData.data)) {
        setUser(userData);
        setIsLoggedIn(true);
      } else {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/auth/login", {
        username,
        password,
      });

      if (response.data.success && isTokenValid(response.data.data)) {
        setIsLoggedIn(true);
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      } else {
        throw new Error("Invalid token received");
      }
    } catch (err) {
      // Fallback credentials for development purposes TO BE REMOVED IN PRODUCTION
      if (
        username === FALLBACK_CREDENTIALS.username &&
        password === FALLBACK_CREDENTIALS.password
      ) {
        const mockUserData = {
          success: true,
          data: "mockToken",
          user: {
            id: 1,
            username: "admin",
            role: "admin",
          },
        };
        setIsLoggedIn(true);
        setUser(mockUserData);
        localStorage.setItem("user", JSON.stringify(mockUserData));
      } else {
        setIsLoggedIn(false);
        setError("Invalid credentials");
      }
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
