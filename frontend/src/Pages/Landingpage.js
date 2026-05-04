import React, { useState, useRef, useEffect, useMemo } from "react";
import Spline from "@splinetool/react-spline";
import LocationsPage from "./LocationsPage";
import slnlayout from "../Images/sln-layout.jpg";
import nrlayout from "../Images/nr-layout.jpg";
import balajilayout from "../Images/balaji-layout.jpg";
import dollarcolonylayout from "../Images/dollars-colony.jpg";
import tudalayout from "../Images/tuda-layout.jpg";
import tvslayout from "../Images/tvs-layout.jpg";
import { Menu, X, Star, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import Navbar from "../Components/Navbar";
import CountUp from "react-countup";
import StatsSection from "../Components/StatsSection";
import Testimonials from "../Components/Testimonials";
import ContactSection from "../Components/ContactSection";
import WhyChooseUs from "../Components/WhyChooseUs";
import OurStory from "../Components/OurStory";
import FooterSection from "../Components/FooterSection";
import axios from "axios";

const Landingpage = () => {
  const projectsRef = useRef(null);
  const locationsRef = useRef(null);
  const contactusRef = useRef(null);
  const ourStoryRef = useRef(null);
  const navigate = useNavigate();
  const layoutImages = [
    nrlayout,
    balajilayout,
    slnlayout,
    tvslayout,
    dollarcolonylayout,
  ];
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const loc = (p.location || "").toLowerCase();
      return name.includes(q) || loc.includes(q);
    });
  }, [projects, projectSearch]);

  const scrollToProjectsSection = () => {
    projectsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/v1/public/projects`
        );
        if (response.data?.data?.projects) {
          setProjects(response.data.data.projects);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const scrollToProjects = () => {
    projectsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToLocations = () => {
    locationsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    contactusRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToOurStory = () => {
    ourStoryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full font-sans">
      {/* Navigation Bar */}
      <Navbar
        onProjectsClick={scrollToProjects}
        onLocationsClick={scrollToLocations}
        onContactUsClick={scrollToContact}
        onOurStoryClick={scrollToOurStory}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-700 to-white pt-20 text-center pb-12 mt-6">
        <h2 className="text-3xl md:text-5xl font-bold text-white">
          Find Real Estate and Get Your Dream Space
        </h2>
        <p className="text-white italic mt-2">
          Renowned for Residential Plots, Trusted by Thousands.
        </p>

        <form
          className="bg-white shadow-lg rounded-lg mx-auto mt-6 p-4 flex flex-col sm:flex-row w-3/4 md:w-2/3 gap-3 max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            scrollToProjectsSection();
          }}
        >
          <input
            type="search"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            placeholder="Search by project name or location..."
            className="border border-gray-200 px-4 py-2 flex-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search projects by name or location"
          />
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-md font-medium shrink-0"
          >
            Search
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <div className="w-full md:w-1/2 h-[400px] md:h-[500px] relative">
            <Spline
              scene="https://prod.spline.design/zVsGaUxvH5vT76UB/scene.splinecode"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div
        ref={projectsRef}
        className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 py-16 md:py-20 px-4 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-2">
                Portfolio
              </p>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Our Projects
              </h3>
              <p className="mt-2 text-slate-600 max-w-xl text-sm md:text-base">
                Explore layouts and communities we manage — tap a project for
                details and availability.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="h-12 w-12 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
            </div>
          ) : projects.length > 0 ? (
            filteredProjects.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-white/80 text-slate-600">
                <p className="mb-3">No projects match your search.</p>
                <button
                  type="button"
                  className="text-blue-600 font-medium hover:underline"
                  onClick={() => setProjectSearch("")}
                >
                  Clear search
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredProjects.map((project, index) => (
                <button
                  type="button"
                  key={project._id || index}
                  className="group text-left rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-200/80 hover:-translate-y-1 transition-all duration-300 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  onClick={() => navigate(`/home/project/${project._id}`)}
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {project.image ? (
                      <img
                        src={`data:${project.image.contentType};base64,${project.image.data}`}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                        No image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-5">
                    <h4 className="font-semibold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">
                      {project.name}
                    </h4>
                    {project.location && (
                      <p className="mt-2 flex items-center gap-1.5 text-slate-500 text-sm">
                        <MapPin className="w-4 h-4 shrink-0 text-blue-500" />
                        <span className="line-clamp-2">{project.location}</span>
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                      View project
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
            )
          ) : (
            <div className="text-center text-slate-500 py-16 rounded-2xl border border-dashed border-slate-200 bg-white/60">
              No projects available right now.
            </div>
          )}
        </div>
      </div>

      {/* Our Story Section */}
      <div
        ref={ourStoryRef}
        className="bg-gradient-to-b from-blue-200 to-white px-10 pt-10 pb-6"
      >
        <OurStory />
      </div>
      {/* Featured Properties Section */}
      <div ref={locationsRef} className="bg-white p-10">
        <LocationsPage projects={filteredProjects} />
      </div>

      {/* Stats Section */}
      <StatsSection />

      {/* Testimonials Section */}
      <div className="bg-white p-6 md:p-10">
        <h3 className="text-xl md:text-3xl font-bold mb-4 text-center">
          What People Say About Us
        </h3>
        <p className="text-gray-600 mb-6 text-center max-w-lg mx-auto">
          Discover heartfelt joy and fulfillment as our valued clients embark on
          the quest for their dream home.
        </p>
        <Testimonials />
      </div>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Contact Section */}
      <div ref={contactusRef} className="bg-gray-100">
        <ContactSection />
      </div>

      {/* Footer Section */}
      <FooterSection />
    </div>
  );
};

export default Landingpage;
