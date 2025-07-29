import axios from "axios";
import { BASE_URL } from "./constant.js";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // in milliseconds
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const token = user?.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Error in request interceptor:", error);
      localStorage.removeItem("user"); // Clear invalid user data
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    config.__retryCount = config.__retryCount || 0;

    const shouldRetry =
      (!response || response.status >= 500) &&
      config.__retryCount < MAX_RETRIES;

    if (shouldRetry) {
      config.__retryCount += 1;
      await delay(RETRY_DELAY * config.__retryCount);
      return axiosInstance(config);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("user"); // Remove token on auth error
      window.location.href = "/login"; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
