import React, { useState } from "react";
import sjdlogo1 from "../Images/sjd-logo1.png";
import { Menu, X, Star } from "lucide-react";
import Login from "../Pages/Login";
const Navbar = ({
  onProjectsClick,
  onLocationsClick,
  onContactUsClick,
  onOurStoryClick,
}) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <nav className="bg-blue-700 border-b border-white shadow-md fixed top-0 w-full z-50">
        <div className="container mx-auto flex justify-between items-center p-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img src={sjdlogo1} alt="SJD Logo" className="h-8" />
            <h1 className="text-lg font-bold text-white">Abhi Developers</h1>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6 text-white">
            <li className="cursor-pointer" onClick={onProjectsClick}>
              Projects
            </li>
            <li className="cursor-pointer" onClick={onOurStoryClick}>
              Our Story
            </li>
            <li className="cursor-pointer" onClick={onLocationsClick}>
              Locations
            </li>
            <li className="cursor-pointer" onClick={onContactUsClick}>
              Contact
            </li>
            <li
              className="cursor-pointer"
              onClick={() => {
                setIsLoginOpen(true);
              }}
            >
              LOGIN
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <ul className="md:hidden flex flex-col bg-blue-700 text-white space-y-2 p-4 border-t border-white">
            <li className="cursor-pointer" onClick={onProjectsClick}>
              Projects
            </li>
            <li className="cursor-pointer" onClick={onOurStoryClick}>
              Our Story
            </li>
            <li className="cursor-pointer" onClick={onLocationsClick}>
              Locations
            </li>
            <li className="cursor-pointer" onClick={onContactUsClick}>
              Contact
            </li>
            <li
              className="cursor-pointer"
              onClick={() => {
                setIsLoginOpen(true);
                setIsOpen(false);
              }}
            >
              LOGIN
            </li>
          </ul>
        )}
      </nav>
      {isLoginOpen && (
        <div className="fixed inset-0 flex items-center justify-center  bg-opacity-50 bg-gray-700 z-50">
          <Login setIsLoginOpen={setIsLoginOpen} isLoginOpen={isLoginOpen} />
        </div>
      )}
    </>
  );
};

export default Navbar;
