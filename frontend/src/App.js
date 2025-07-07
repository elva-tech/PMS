import React from "react";
import Landingpage from "./Pages/Landingpage";

// Uncomment the line below if you want to use HashRouter instead of BrowserRouter before uploading to GitHub for GitHub Pages
import { HashRouter as Router } from "react-router-dom";
// import { BrowserRouter as Router } from "react-router-dom";
import Layout from "./containers/Layout";

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
