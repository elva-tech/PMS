import React, { Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Layout from "./containers/Layout";
import LoadingSpinner from "./Components/LoadingSpinner";
import { AuthProvider } from "./Context/AuthContext";
import { ProjectProvider } from "./Context/ProjectContext";
import { ToastProvider } from "./Context/ToastContext";

function App() {
  return (
    <Router basename="/">
      <AuthProvider>
        <ToastProvider>
          <ProjectProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <Layout />
            </Suspense>
          </ProjectProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
