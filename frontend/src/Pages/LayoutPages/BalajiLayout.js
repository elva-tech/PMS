import React, { useState } from "react";
import sjdlogo1 from "../../Images/sjd-logo1.png";
import { Menu, X, Star, Search, Filter } from "lucide-react";
import Login from "../Login";
import { useLocation } from "react-router-dom";
import ReactPaginate from "react-paginate";
import BalajiLayoutMap from "../../Images/BalajilayoutMap.png";
import { set } from "lodash-es";
import QuoteModal from "../../Components/QuoteModal";
import Navbar from "../../Components/Navbar";

const BalajiLayout = () => {
  const documents = [
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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const pageCount = Math.ceil(documents.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentData = documents.slice(offset, offset + itemsPerPage);
  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };
  const location = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [plotNo, setPlotNo] = useState("");

  return (
    <div className="w-full font-sans">
      <Navbar setIsLoginOpen={setIsLoginOpen} />
      {isLoginOpen && (
        <div className="fixed inset-0 flex items-center justify-center  bg-opacity-50 bg-gray-700 z-50">
          <Login setIsLoginOpen={setIsLoginOpen} isLoginOpen={isLoginOpen} />
        </div>
      )}
      <div className="bg-gradient-to-b from-blue-700 to-white pt-16 text-center pb-12 mt-6">
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
                  pageClassName={"px-3 py-1 bg-gray-200 rounded cursor-pointer"}
                  previousClassName={
                    "px-3 py-1 bg-gray-300 rounded cursor-pointer"
                  }
                  nextClassName={"px-3 py-1 bg-gray-300 rounded cursor-pointer"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {isQuoteOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 bg-gray-700 z-50">
          <QuoteModal onClose={() => setIsQuoteOpen(false)} plotNo={plotNo} />
        </div>
      )}
    </div>
  );
};

export default BalajiLayout;
