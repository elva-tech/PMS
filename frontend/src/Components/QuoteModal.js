import React, { useState } from "react";
import { Quote } from "lucide-react";
const QuoteModal = ({ onClose, plotNo }) => {
  const [mobileNumber, setMobileNumber] = useState("");

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <div className="flex justify-between items-center mb-4">
          <Quote size={30} />
          <button onClick={onClose} className="text-gray-500">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Project - Balaji Layout</h2>
          <p className="text-gray-500">Plot Number - {plotNo}</p>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Interested to Buy?</h3>
          <p className="text-gray-500">Get Quote on WhatsApp.</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="mobile-number">
            Mobile Number
          </label>
          <div className="flex items-center border rounded-lg overflow-hidden mt-1">
            <span className="px-3 text-gray-500">+91</span>
            <input
              className="flex-1 p-2 border-l outline-none"
              id="mobile-number"
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Get Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;
