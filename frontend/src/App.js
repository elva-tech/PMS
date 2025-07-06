import React from "react";
import Landingpage from "./Pages/Landingpage";
import { HashRouter as Router } from "react-router-dom";
import Layout from "./containers/Layout";

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
