import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaHome,
} from "react-icons/fa";

const FooterSection = () => {
  return (
    <footer className="bg-blue-700 text-white pt-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FaHome className="text-white text-xl" />
            <h2 className="text-lg text-white font-semibold">
              Abhi Developers
            </h2>
          </div>
          <p className="text-base text-white mb-4">
            Your trusted partner in finding the perfect home. With over 23 years
            of experience, we're committed to making your real estate dreams a
            reality.
          </p>
          <div className="flex gap-4 text-white text-lg mt-4">
            <FaFacebookF className="cursor-pointer hover:text-blue-300 transition-colors duration-200" />
            <FaTwitter className="cursor-pointer hover:text-blue-300 transition-colors duration-200" />
            <FaInstagram className="cursor-pointer hover:text-blue-300 transition-colors duration-200" />
            <FaLinkedinIn className="cursor-pointer hover:text-blue-300 transition-colors duration-200" />
            <FaYoutube className="cursor-pointer hover:text-blue-300 transition-colors duration-200" />
          </div>
        </div>

        <div>
          <h3 className="text-lg text-white font-semibold mb-4">
            Our Services
          </h3>
          <ul className="text-white space-y-2 text-base">
            <li>Residential Sales</li>
            <li>Commercial Real Estate</li>
            <li>Property Valuation</li>
            <li>Mortgage Assistance</li>
            <li>Legal Support</li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-lg text-white font-semibold mb-4">
            Get In Touch
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
            <div className="flex items-start gap-3">
              <FaPhoneAlt className="mt-1 text-white" />
              <div>
                <p className=" text-white">Call Us</p>
                <p>+91 8217091188</p>
                <p>+91 9632026532</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaEnvelope className="mt-1 text-white" />
              <div>
                <p className=" text-white">Email Us</p>
                <p>info@abhidevelopers.com</p>
                <p>sales@abhidevelopers.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="mt-1 text-white" />
              <div>
                <p className=" text-white">Visit Us</p>
                <p>Vijayanagar 3rd Cross</p>
                <p>Bangalore, KA 560040</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaClock className="mt-1 text-white" />
              <div>
                <p className=" text-white">Office Hours</p>
                <p>Mon–Fri: 9:00 AM – 7:00 PM</p>
                <p>Sat–Sun: 10:00 AM – 5:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-700 text-white text-sm border-t border-white px-4 py-4 mt-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-center sm:text-left">
          {/* Left side */}
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
            <p>© 2025 Abhi Developers. All rights reserved.</p>
            <p className="hover:text-white transition">Privacy Policy</p>
            <p className="hover:text-white transition">Terms of Service</p>
            <p className="hover:text-white transition">Cookie Policy</p>
          </div>

          {/* Right side */}
          <div className="flex gap-3 justify-center sm:justify-end">
            <p className="hover:text-white transition">
              Licensed Real Estate Broker
            </p>
            <span className="hidden sm:inline">•</span>
            <p className="hover:text-white transition">
              Equal Housing Opportunity
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
