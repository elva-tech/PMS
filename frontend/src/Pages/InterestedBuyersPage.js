import React, { useState } from "react";
import { Search } from "lucide-react";
const InterestedBuyersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const buyersData = [
    {
      name: "Jane Cooper",
      phone: "(225) 555-0118",
      email: "jane@microsoft.com",
      city: "Tumkur",
      status: "Interested",
    },
    {
      name: "Floyd Miles",
      phone: "(205) 555-0100",
      email: "floyd@yahoo.com",
      city: "Bengaluru",
      status: "Not Interested",
    },
    {
      name: "Ronald Richards",
      phone: "(302) 555-0107",
      email: "ronald@adobe.com",
      city: "Tumkur",
      status: "Not Interested",
    },
    {
      name: "Marvin McKinney",
      phone: "(252) 555-0126",
      email: "marvin@tesla.com",
      city: "Tumkur",
      status: "Interested",
    },
    {
      name: "Jerome Bell",
      phone: "(629) 555-0129",
      email: "jerome@google.com",
      city: "Mysuru",
      status: "Interested",
    },
    {
      name: "Jane Cooper",
      phone: "(225) 555-0118",
      email: "jane@microsoft.com",
      city: "Tumkur",
      status: "Interested",
    },
    {
      name: "Floyd Miles",
      phone: "(205) 555-0100",
      email: "floyd@yahoo.com",
      city: "Bengaluru",
      status: "Not Interested",
    },
    {
      name: "Ronald Richards",
      phone: "(302) 555-0107",
      email: "ronald@adobe.com",
      city: "Tumkur",
      status: "Not Interested",
    },
    {
      name: "Marvin McKinney",
      phone: "(252) 555-0126",
      email: "marvin@tesla.com",
      city: "Tumkur",
      status: "Interested",
    },
    {
      name: "Jerome Bell",
      phone: "(629) 555-0129",
      email: "jerome@google.com",
      city: "Mysuru",
      status: "Interested",
    },
  ];
  const filteredBuyers = buyersData.filter((buyer) =>
    buyer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">All Buyers</h1>
          <p className="text-green-500">Interested Members</p>
        </div>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              className="w-full md:w-64 border border-gray-300 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-600 flex items-center">
            Sort by: Newest <i className="fas fa-chevron-down ml-2"></i>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-lg">
          <thead>
            <tr className="w-full bg-blue-600 text-left text-white uppercase text-xs md:text-sm">
              <th className="py-3 px-6">Users Name</th>
              <th className="py-3 px-6">Phone Number</th>
              <th className="py-3 px-6">Email</th>
              <th className="py-3 px-6">City</th>
              <th className="py-3 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-xs md:text-sm font-semibold">
            {filteredBuyers.map((buyer, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-3 px-6">{buyer.name}</td>
                <td className="py-3 px-6">{buyer.phone}</td>
                <td className="py-3 px-6">{buyer.email}</td>
                <td className="py-3 px-6">{buyer.city}</td>
                <td className="py-3 px-6 cursor-pointer">
                  <span
                    className={`py-1 px-3 rounded-full text-xs ${
                      buyer.status === "Interested"
                        ? "bg-green-100 text-green-500"
                        : "bg-red-100 text-red-500"
                    }`}
                  >
                    {buyer.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center mt-4 text-xs md:text-sm">
        <div className="flex space-x-1 mt-2 md:mt-0">
          <button className="py-1 px-3 bg-gray-200 text-gray-600 rounded">
            {" "}
            &lt;{" "}
          </button>
          <button className="py-1 px-3 bg-blue-500 text-white rounded">
            1
          </button>
          <button className="py-1 px-3 bg-gray-200 text-gray-600 rounded">
            2
          </button>
          <button className="py-1 px-3 bg-gray-200 text-gray-600 rounded">
            3
          </button>
          <button className="py-1 px-3 bg-gray-200 text-gray-600 rounded">
            4
          </button>
          <button className="py-1 px-3 bg-gray-200 text-gray-600 rounded">
            ...
          </button>
          <button className="py-1 px-3 bg-gray-200 text-gray-600 rounded">
            40
          </button>
          <button className="py-1 px-3 bg-gray-200 text-gray-600 rounded">
            {" "}
            &gt;{" "}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterestedBuyersPage;
