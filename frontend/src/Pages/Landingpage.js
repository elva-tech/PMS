import React, { useState, useRef } from "react";
import herobg from "../Images/hero-bg.png";
import herobg1 from "../Images/hero-bg1.jpg";
import sjdlogo from "../Images/sjd-logo.png";
import sjdlogo1 from "../Images/sjd-logo1.png";
import elvalogo from "../Images/elva-logo.jpeg";
import logo1 from "../Images/logo1.png";
import LocationsPage from "./LocationsPage";
import house1 from "../Images/house1.png";
import house2 from "../Images/house2.png";
import slnlayout from "../Images/sln-layout.jpg";
import nrlayout from "../Images/nr-layout.jpg";
import balajilayout from "../Images/balaji-layout.jpg";
import dollarcolonylayout from "../Images/dollars-colony.jpg";
import tudalayout from "../Images/tuda-layout.jpg";
import tvslayout from "../Images/tvs-layout.jpg";
import { Menu, X, Star } from "lucide-react";
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

        {/* Search Bar */}
        <div className="bg-white shadow-lg rounded-lg mx-auto mt-6 p-4 flex flex-col md:flex-row w-4/5 md:w-2/3 gap-4">
          <button className="bg-gray-200 px-4 py-2 rounded-md">Buy</button>
          <select className="bg-gray-100 px-4 py-2 mx-2 rounded-md flex-1">
            <option>Property Type</option>
          </select>
          <input
            type="text"
            placeholder="Search by location or Project Name..."
            className="border px-4 py-2 flex-1 rounded-md"
          />
          <div className="bg-black text-white px-6 py-2 rounded-md">Search</div>
        </div>

        <div className="mt-6 flex justify-center">
          <img src={herobg} alt="Real Estate" className="w-3/4 md:w-1/2" />
        </div>
      </div>

      {/* Projects Section */}
      <div ref={projectsRef} className="bg-black text-white p-10">
        <h3 className="text-xl md:text-3xl font-bold mb-6">Our Projects</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            "N R Layout",
            "Balaji Layout",
            "SLN Layout",
            "TVS Layout",
            "Dollars Colony",
          ].map((project, index) => (
            <div
              key={index}
              className="text-center"
              // onClick={() => navigate(`/${project.replace(/\s+/g, "-")}`)}
            >
              <div className="w-full aspect-[4/3] bg-gray-700 border-4 border-gray-200 rounded-lg">
                <img
                  src={layoutImages[index]}
                  alt={project}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h4 className="font-semibold">{project}</h4>
              {/* <p className="text-gray-400">Location</p> */}
            </div>
          ))}
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
        <LocationsPage />
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
