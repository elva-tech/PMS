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
    component: main,
  },
  {
    path: "/project/:id/plots",
    component: main,
  },
  {
    path: "/project/:id/documents",
    component: main,
  },
  {
    path: "/project/:id/plotallotment",
    component: main,
  },
  {
    path: "/project/:id/interestedbuyers",
    component: main,
  },
  {
    path: "/project/:id/payments",
    component: main,
  },
  {
    path: "/project/:id/users",
    component: main,
  },
];

export default pageroutes;
