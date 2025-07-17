export const BASE_URL =
  process.env.REACT_APP_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_BASE_URL // Replace this with your actual backend URL from step 1
    : "http://localhost:5000");
