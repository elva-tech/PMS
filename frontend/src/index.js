import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./Context/AuthContext";
import { ProjectProvider } from "./Context/ProjectContext";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ProjectProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ProjectProvider>
    </AuthProvider>
  </React.StrictMode>
);
