import React, { useState, useEffect } from "react";
import sjdlogo1 from "../Images/sjd-logo1.png";
import {
  FileSpreadsheet,
  Info,
  Users,
  BadgeIndianRupee,
  CircleUserRound,
  Menu,
  X,
  ChevronRight,
  Files,
  FileUp,
  FileText,
  CalendarDays,
  FileBox,
  Eye,
  Trash2,
  SendHorizontal,
  Map,
  Search,
  Filter,
} from "lucide-react";
import UploadDocument from "../Components/DocumentUploadModal";
import ReactPaginate from "react-paginate";
import BalajiLayoutMap from "../Images/BalajilayoutMap.png";
import QuoteModal from "../Components/QuoteModal";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useProject } from "../Context/ProjectContext";
const PropertyDetailsPage = () => {
  const { user, logout } = useAuth();
  const { id, plot } = useParams();
  const navigate = useNavigate();
  const { projectId, setProjectId, plotId, setPlotId } = useProject();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [documentspage, setDocumentsPage] = useState(false);
  const [generalinfopage, setGeneralInfoPage] = useState(false);
  const [interestedbuyerspage, setInterestedBuyersPage] = useState(false);
  const [paymentmadepage, setPaymentMadePage] = useState(false);
  const [layoutpage, setLayoutPage] = useState(false);
  const [documentUploadModal, setDocumentUploadModal] = useState(false);

  useEffect(() => {
    if (id) setProjectId(id);
    if (plot) setPlotId(plot);
  }, [id, plot, setProjectId, setPlotId]);

  const documents = [
    { name: "Allotment Letter", size: "28.50 KB", date: "16/11/2022" },
    { name: "Khata Certificate", size: "28.50 KB", date: "16/11/2022" },
    { name: "Sale Deed", size: "28.50 KB", date: "16/11/2022" },
    { name: "Property Tax Receipts", size: "28.50 KB", date: "16/11/2022" },
    { name: "NOC", size: "28.50 KB", date: "16/11/2022" },
    { name: "Payment Receipts", size: "28.50 KB", date: "16/11/2022" },
    { name: "Allotment Letter", size: "28.50 KB", date: "16/11/2022" },
    { name: "Khata Certificate", size: "28.50 KB", date: "16/11/2022" },
    { name: "Sale Deed", size: "28.50 KB", date: "16/11/2022" },
    { name: "Property Tax Receipts", size: "28.50 KB", date: "16/11/2022" },
    { name: "NOC", size: "28.50 KB", date: "16/11/2022" },
    { name: "Payment Receipts", size: "28.50 KB", date: "16/11/2022" },
  ];

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

  // Function to close sidebar and set a page
  const handleNavClick = (page) => {
    setIsSidebarOpen(false);

    // Reset all pages
    setDocumentsPage(false);
    setGeneralInfoPage(false);
    setInterestedBuyersPage(false);
    setPaymentMadePage(false);
    setLayoutPage(false);

    if (page === "documents") setDocumentsPage(true);
    if (page === "generalInfo") setGeneralInfoPage(true);
    if (page === "interestedBuyers") setInterestedBuyersPage(true);
    if (page === "paymentsMade") setPaymentMadePage(true);
    if (page === "layout") setLayoutPage(true);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const filteredBuyers = buyersData.filter((buyer) =>
    buyer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const layoutdocuments = [
    { plotNo: "1", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "2", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "3", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "4", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "5", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "6", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "7", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "8", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "9", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "10", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "11", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "12", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "13", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "14", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "15", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "16", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "17", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "18", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "19", dimension: "30x40", facing: "East", status: "X" },
    { plotNo: "20", dimension: "30x40", facing: "East", status: "Y" },
    { plotNo: "21", dimension: "30x40", facing: "East", status: "X" },
  ];
  //  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const pageCount = Math.ceil(layoutdocuments.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentData = layoutdocuments.slice(offset, offset + itemsPerPage);
  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };
  // const location = useLocation();
  //  const [isLoginOpen, setIsLoginOpen] = useState(false);
  //  const [isOpen, setIsOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [plotNo, setPlotNo] = useState("");

  return (
    <div className="h-screen bg-gradient-to-b from-blue-700 to-white overflow-hidden">
      <nav className="bg-blue-700 border-b border-white shadow-md fixed top-0 left-0 w-full z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <img src={sjdlogo1} alt="SJD Logo" className="h-8" />
            <h1 className="text-lg font-bold text-white">Abhi Developers</h1>
          </div>
          <button
            className="absolute right-4 md:hidden text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={30} />
          </button>
        </div>
      </nav>

      {/* Main content wrapper */}
      <div className="flex pt-16 h-screen">
        {/* Sticky Sidebar with added padding */}
        <aside
          className={`bg-white shadow-md p-4  overflow-y-auto
          fixed md:sticky top-16 h-[calc(100vh-4rem)] 
          flex flex-col justify-between transition-transform duration-300 ease-in-out z-50
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
          // style={{
          //   transition: "none",
          //   width: "230px",
          //   height: "580px",
          //   transform: "translate(5px, 15px)",
          // }}
        >
          <button
            className="absolute top-4 right-4 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={25} />
          </button>
          <nav className="mt-4">
            <ul className="space-y-3">
              <li
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 hover:font-semibold rounded cursor-pointer"
                onClick={() => handleNavClick("documents")}
              >
                <FileSpreadsheet size={25} />
                <span className="text-gray-700">Documents</span>
              </li>
              <li
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 hover:font-semibold rounded cursor-pointer"
                onClick={() => handleNavClick("generalInfo")}
              >
                <Info size={25} />
                <span className="text-gray-700">General Info</span>
              </li>
              <li
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 hover:font-semibold rounded cursor-pointer"
                onClick={() => handleNavClick("interestedBuyers")}
              >
                <Users size={25} />
                <span className="text-gray-700">Interested Buyers</span>
              </li>
              <li
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 hover:font-semibold rounded cursor-pointer"
                onClick={() => handleNavClick("paymentsMade")}
              >
                <BadgeIndianRupee size={25} />
                <span className="text-gray-700">Payments</span>
              </li>
              <li
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 hover:font-semibold rounded cursor-pointer"
                onClick={() => handleNavClick("layout")}
              >
                <Map size={25} />
                <span className="text-gray-700">Layout</span>
              </li>
            </ul>
          </nav>
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center space-x-2 p-2">
              <CircleUserRound size={25} />
              <span className="text-gray-700 font-medium">Abhishek</span>
            </div>
            <button
              className="w-full bg-red-500 text-white p-2 rounded mt-2 hover:bg-red-600"
              onClick={() => {
                setTimeout(() => {
                  logout();
                  navigate("/login");
                }, 500);
              }}
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Scrollable Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-6 min-h-full">
            <h2 className="flex flex-row text-xl font-semibold text-gray-800 pb-2 border-b items-center gap-2">
              {documentspage
                ? "Documents"
                : generalinfopage
                ? "General Information"
                : interestedbuyerspage
                ? "Interested Buyers"
                : paymentmadepage
                ? "Payments Made"
                : layoutpage
                ? "Layout"
                : null}
              <ChevronRight size={25} />
              Balaji Layout - Plot 51
            </h2>

            {generalinfopage && (
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
            )}

            {documentspage && (
              <div className="mt-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Files className="text-blue-600 mr-2" /> Documents
                  </h2>
                  <div className="flex flex-row items-center gap-4 w-full md:w-auto">
                    <button className="bg-blue-600 text-white px-2 py-2 rounded flex items-center hover:bg-blue-700">
                      <SendHorizontal className="mr-2" /> Share Documents
                    </button>
                    <button
                      className="bg-blue-600 text-white px-2 py-2 rounded flex items-center hover:bg-blue-700"
                      onClick={() => setDocumentUploadModal(true)}
                    >
                      <FileUp className="mr-2" /> Upload Documents
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse rounded-lg overflow-hidden shadow-lg">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-3 text-left">File Name</th>
                        <th className="p-3 text-left">File Size</th>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-xs md:text-sm font-semibold">
                      {documents.map((doc, index) => (
                        <tr
                          key={index}
                          className="border-b hover:bg-gray-100 text-sm md:text-base cursor-pointer"
                        >
                          <td className="p-2 flex flex-row items-center">
                            <FileText className="text-blue-500 mr-2" />{" "}
                            {doc.name}
                          </td>
                          <td className="p-2">
                            <FileBox className="text-gray-500 mr-2 inline" />{" "}
                            {doc.size}
                          </td>
                          <td className="p-2">
                            <CalendarDays className="text-gray-500 mr-2 inline" />{" "}
                            {doc.date}
                          </td>
                          <td className="p-2">
                            <button className="text-blue-500 hover:text-blue-700 mr-6">
                              <Eye size={18} />
                            </button>
                            <button className="text-red-500 hover:text-red-700">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {documentUploadModal && (
                  <UploadDocument
                    setDocumentUploadModal={setDocumentUploadModal}
                  />
                )}
              </div>
            )}

            {interestedbuyerspage && (
              <div className="mt-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <div>
                    <h1 className="text-xl md:text-2xl font-semibold">
                      All Buyers
                    </h1>
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
                      Sort by: Newest{" "}
                      <i className="fas fa-chevron-down ml-2"></i>
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
            )}

            {paymentmadepage && (
              <div className="mt-4">
                <div className="mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-100 p-4 rounded-lg">
                      <p className="text-gray-600">Total Earnings</p>
                      <p className="text-green-600 text-2xl font-semibold">
                        ₹4,30,000.00
                      </p>
                      <p className="text-gray-500 text-sm">
                        as of 01-December 2022
                      </p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="text-gray-600">Pending Payments</p>
                      <p className="text-blue-600 text-2xl font-semibold">
                        ₹1,00,000.00
                      </p>
                      <p className="text-gray-500 text-sm">
                        as of 01-December 2022
                      </p>
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
                              <td className="py-3 px-4 border-b">
                                {payment.id}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {payment.date}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {payment.amount}
                              </td>
                              <td className="py-3 px-4 border-b text-green-600">
                                {payment.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* <div className="flex flex-col md:flex-row items-center justify-between mt-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <label htmlFor="perPage" className="text-gray-600">
                          10
                        </label>
                        <select
                          id="perPage"
                          className="border rounded px-2 py-1"
                        >
                          <option>per page</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 mt-2 md:mt-0">
                        <button className="border rounded px-2 py-1">
                          &lt;
                        </button>
                        <span className="text-gray-600">1</span>
                        <span className="text-gray-600">of 1 pages</span>
                        <button className="border rounded px-2 py-1">
                          &gt;
                        </button>
                      </div>
                    </div> */}
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
            )}

            {layoutpage && (
              <>
                <div className="flex flex-col md:flex-row justify-between items-center px-6 space-y-4 md:space-y-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white text-center md:text-left px-6">
                    Balaji Layout Site Map
                  </h2>
                  {/* <div className=" flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto px-6">
            <input
              type="text"
              placeholder="Search by Plot Number"
              className="border px-6 py-2 flex-1 rounded-md sm:w-64"
            />
            <Search className="absolute  top-1/2 transform -translate-y-1/2 text-gray-400" />
            <div className="bg-black text-white px-6 py-2 rounded-md  sm:w-auto cursor-pointer">
              Search
            </div>
          </div> */}
                </div>
                <div className="flex justify-center aspect-[4/3] p-6">
                  <img
                    src={BalajiLayoutMap}
                    alt="Balaji Layout Map"
                    className="rounded-md border-black border-1 shadow-md"
                  />
                </div>
                <div className="border-t border-gray-300 mt-6 p-2"></div>
                <div className="p-4 md:p-8  flex justify-center items-center">
                  <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                      <h2 className="text-xl md:text-xl font-semibold flex items-center gap-2 mb-4 md:mb-0">
                        Plot Details
                      </h2>
                      <div className="flex flex-row md:flex-row items-center gap-4 w-full md:w-auto">
                        <button className=" bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm md:text-base">
                          <Filter size={25} />
                        </button>

                        <div className=" w-full md:w-auto">
                          <input
                            type="text"
                            className="border rounded-md px-4 py-2 w-full md:w-auto"
                            placeholder="Plot Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {/* <Search className=" absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 " /> */}
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-blue-500 text-white text-left">
                            <th className="p-3 text-left">Plot No</th>
                            <th className="p-3 text-left">Dimension</th>
                            <th className="p-3 text-left">Facing</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.map((doc, index) => (
                            <tr
                              key={index}
                              className="border-b hover:bg-gray-100 text-sm md:text-base cursor-pointer"
                              onClick={() => {
                                setIsQuoteOpen(true);
                                setPlotNo(doc.plotNo);
                              }}
                            >
                              <td className="p-3 text-left">{doc.plotNo}</td>
                              <td className="p-3 text-left">{doc.dimension}</td>
                              <td className="p-3 text-left">{doc.facing}</td>
                              <td className="p-3 text-center">{doc.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="flex justify-center mt-4">
                        <ReactPaginate
                          previousLabel={"Previous"}
                          nextLabel={"Next"}
                          breakLabel={"..."}
                          pageCount={pageCount}
                          marginPagesDisplayed={2}
                          pageRangeDisplayed={3}
                          onPageChange={handlePageClick}
                          containerClassName={"flex space-x-2"}
                          activeClassName={
                            "bg-blue-500 text-blue-600 px-3 py-1 rounded"
                          }
                          pageClassName={
                            "px-3 py-1 bg-gray-200 rounded cursor-pointer"
                          }
                          previousClassName={
                            "px-3 py-1 bg-gray-300 rounded cursor-pointer"
                          }
                          nextClassName={
                            "px-3 py-1 bg-gray-300 rounded cursor-pointer"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {isQuoteOpen && (
                  <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 bg-gray-700 z-50">
                    <QuoteModal
                      onClose={() => setIsQuoteOpen(false)}
                      plotNo={plotNo}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
