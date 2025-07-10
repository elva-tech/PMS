import React from "react";

const GeneralInfoPage = () => {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center space-x-2">
        <h3 className="font-medium text-gray-700">Project</h3>
        <p className="text-gray-900">:- Balaji Layout</p>
      </div>

      <div className="flex items-center space-x-2">
        <h3 className="font-medium text-gray-700">Plot No.</h3>
        <p className="text-gray-900">:- 51</p>
      </div>

      <div className="flex items-center space-x-2">
        <h3 className="font-medium text-gray-700">Plot Size</h3>
        <p className="text-gray-900">:- 30 × 50</p>
      </div>

      <div className="flex items-center space-x-2">
        <h3 className="font-medium text-gray-700">Owner</h3>
        <p className="text-gray-900">:- NA</p>
      </div>

      <div className="mt-6 pt-4 border-t">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition duration-200">
          Download Details
        </button>
      </div>
    </div>
  );
};

export default GeneralInfoPage;
