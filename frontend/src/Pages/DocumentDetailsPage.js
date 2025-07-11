import React, { useState, useEffect, useTransition } from "react";
import UploadDocument from "../Components/DocumentUploadModal";
import {
  Files,
  FileText,
  FileBox,
  CalendarDays,
  Eye,
  Trash2,
  SendHorizontal,
  FileUp,
} from "lucide-react";

const DocumentDetailsPage = () => {
  const [documentUploadModal, setDocumentUploadModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
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

  const handleFileUploadModal = () => {
    startTransition(() => {
      setDocumentUploadModal(true);
    });
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }
  return (
    <div className="mt-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Files className="text-blue-600 mr-2" /> Documents
        </h2>
        <div className="flex flex-row items-center justify-center gap-4 w-full md:w-auto">
          <button
            className="bg-blue-600 text-white px-2 py-2 rounded flex items-center hover:bg-blue-700"
            onClick={handleFileUploadModal}
            disabled={isPending}
          >
            <FileUp className="mr-2" />{" "}
            {isPending ? "Uploading..." : "Upload Document"}
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
                  <FileText className="text-blue-500 mr-2" /> {doc.name}
                </td>
                <td className="p-2">
                  <FileBox className="text-gray-500 mr-2 inline" /> {doc.size}
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
          setDocumentUploadModal={(value) => {
            startTransition(() => {
              setDocumentUploadModal(value);
            });
          }}
        />
      )}
    </div>
  );
};

export default DocumentDetailsPage;
