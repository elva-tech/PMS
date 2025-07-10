import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
const PaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const payments = [
    {
      id: "#15267",
      date: "Mar 1, 2023",
      amount: "1,30,000",
      status: "Success",
    },
    {
      id: "#153587",
      date: "Jan 26, 2023",
      amount: "1,00,000",
      status: "Success",
    },
    {
      id: "#12436",
      date: "Feb 12, 2033",
      amount: "1,00,000",
      status: "Success",
    },
    {
      id: "#16879",
      date: "Feb 12, 2033",
      amount: "1,00,000",
      status: "Success",
    },
    {
      id: "#15267",
      date: "Mar 1, 2023",
      amount: "1,30,000",
      status: "Success",
    },
    {
      id: "#153587",
      date: "Jan 26, 2023",
      amount: "1,00,000",
      status: "Success",
    },
    {
      id: "#12436",
      date: "Feb 12, 2033",
      amount: "1,00,000",
      status: "Success",
    },
    {
      id: "#16879",
      date: "Feb 12, 2033",
      amount: "1,00,000",
      status: "Success",
    },
  ];
  return (
    <div className="mt-4">
      <div className="mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-gray-600">Total Earnings</p>
            <p className="text-green-600 text-2xl font-semibold">
              ₹4,30,000.00
            </p>
            <p className="text-gray-500 text-sm">as of 01-December 2022</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-600">Pending Payments</p>
            <p className="text-blue-600 text-2xl font-semibold">₹1,00,000.00</p>
            <p className="text-gray-500 text-sm">as of 01-December 2022</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
            {/* Payment History Title */}
            <h2 className="text-xl font-semibold">Payment History</h2>

            {/* Filter and Search Container */}
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
              {/* Filter Dropdown */}
              <div className="relative flex items-center border border-gray-300 rounded-lg px-4 py-2 w-full md:w-auto">
                <Filter className="text-gray-600 mr-2" size={20} />
                <select className="bg-transparent focus:outline-none w-full">
                  <option value="all" className="text-xs">
                    All
                  </option>
                  <option value="completed" className="text-xs">
                    Completed
                  </option>
                  <option value="pending" className="text-xs">
                    Pending
                  </option>
                  <option value="rejected" className="text-xs">
                    Rejected
                  </option>
                </select>
              </div>

              {/* Search Input */}
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-lg">
              <thead>
                <tr className="w-full bg-blue-600 text-left text-white uppercase text-xs md:text-sm">
                  <th className="py-3 px-4 border-b">Order ID</th>
                  <th className="py-3 px-4 border-b">Date</th>
                  <th className="py-3 px-4 border-b">Amount</th>
                  <th className="py-3 px-4 border-b">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-xs md:text-sm font-semibold">
                {payments.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td className="py-3 px-4 border-b">{payment.id}</td>
                    <td className="py-3 px-4 border-b">{payment.date}</td>
                    <td className="py-3 px-4 border-b">{payment.amount}</td>
                    <td className="py-3 px-4 border-b text-green-600">
                      {payment.status}
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
      </div>
    </div>
  );
};

export default PaymentsPage;
