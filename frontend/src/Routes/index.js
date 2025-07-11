import { lazy } from "react";

const Landingpage = lazy(() => import("../Pages/Landingpage"));
const Login = lazy(() => import("../Pages/Login"));
const balajilayout = lazy(() => import("../Pages/LayoutPages/BalajiLayout"));
const main = lazy(() => import("../Pages/Main"));
const ProjectDashboard = lazy(() => import("../Pages/ProjectDashboard"));
const Plot = lazy(() => import("../Pages/Plot"));

const pageroutes = [
  {
    path: "/Balaji-Layout",
    component: balajilayout,
  },
  {
    path: "/project",
    component: ProjectDashboard,
  },
  {
    path: "/project/:id",
    component: Plot,
  },
  {
    path: "/project/:id/:plot",
    component: main,
  },
  {
    path: "/project/:id/:plot/documents",
    component: main,
  },
  {
    path: "/project/:id/:plot/generalinfo",
    component: main,
  },
  {
    path: "/project/:id/:plot/interestedbuyers",
    component: main,
  },
  {
    path: "/project/:id/:plot/payments",
    component: main,
  },
  {
    path: "/project/:id/:plot/layout",
    component: main,
  },
];

export default pageroutes;
