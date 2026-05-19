import React from "react";

const SMSPreviewModal = ({ open, onClose, title = "SMS Preview", message = "" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 border rounded-md p-3">
            {message || "No preview available."}
          </pre>
          <div className="mt-4 text-right">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSPreviewModal;
