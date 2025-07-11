import React from "react";
import { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import QuoteModal from "../Components/QuoteModal";
import ImageModal from "../Components/ImageModal";
import BalajiLayoutMap from "../Images/BalajilayoutMap.png";
import { Filter, ZoomIn } from "lucide-react";

const LayoutPageDetails = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [plotNo, setPlotNo] = useState("");

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

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const pageCount = Math.ceil(layoutdocuments.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentData = layoutdocuments.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center px-6 space-y-4 md:space-y-0 mt-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 text-center md:text-left ">
          Balaji Layout Site Map
        </h2>
      </div>

      <div className="relative w-full p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative group cursor-pointer rounded-lg overflow-hidden">
            <img
              src={BalajiLayoutMap}
              alt="Balaji Layout Map"
              className="w-full h-auto rounded-lg shadow-lg transition-transform duration-200"
            />
            <div className="absolute inset-0 md:hidden bg-black/20 flex items-center justify-center">
              <div
                className="bg-white/20 backdrop-blur-sm p-3 rounded-full active:bg-white/30 transition-all cursor-pointer"
                onClick={() => setIsImageModalOpen(true)}
              >
                <ZoomIn className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 flex justify-center items-center">
        <div className="w-full max-w-4xl bg-white">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-xl md:text-xl font-semibold flex items-center gap-2 mb-4 md:mb-0">
              Plot Details
            </h2>
            <div className="flex flex-row md:flex-row items-center gap-4 w-full md:w-auto">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm md:text-base">
                <Filter size={25} />
              </button>

              <div className="w-full md:w-auto">
                <input
                  type="text"
                  className="border rounded-md px-4 py-2 w-full md:w-auto"
                  placeholder="Plot Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full text-sm text-left border-collapse rounded-lg overflow-hidden shadow-lg">
              <thead className="bg-blue-600 text-white">
                <tr className="bg-blue-500 text-white text-left">
                  <th className="text-center px-4 py-2 md:p-4">Plot No</th>
                  <th className="text-center px-4 py-2 md:p-4">Dimension</th>
                  <th className="text-center px-4 py-2 md:p-4">Facing</th>
                  <th className="text-center px-4 py-2 md:p-4">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((doc, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-100 text-sm md:text-base cursor-pointer"
                    onClick={() => {
                      setIsQuoteOpen(true);
                      setPlotNo(doc.plotNo);
                    }}
                  >
                    <td className="text-center py-2">{doc.plotNo}</td>
                    <td className="text-center py-2">{doc.dimension}</td>
                    <td className="text-center py-2">{doc.facing}</td>
                    <td className="text-center py-2">{doc.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              activeClassName={"px-3 py-1 bg-blue-500 text-white rounded"}
              pageClassName={"px-3 py-1 bg-blue-200 rounded cursor-pointer"}
              previousClassName={"px-3 py-1 bg-gray-300 rounded cursor-pointer"}
              nextClassName={"px-3 py-1 bg-gray-300 rounded cursor-pointer"}
            />
          </div>
        </div>
      </div>

      {isQuoteOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 bg-gray-700 z-50">
          <QuoteModal onClose={() => setIsQuoteOpen(false)} plotNo={plotNo} />
        </div>
      )}

      {isImageModalOpen && (
        <ImageModal
          imageUrl={BalajiLayoutMap}
          altText="Balaji Layout Map"
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </>
  );
};

export default LayoutPageDetails;
