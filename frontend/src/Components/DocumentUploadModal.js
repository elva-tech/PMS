import { useState } from "react";
import { Upload } from "lucide-react";

const UploadDocument = ({
  setDocumentUploadModal,
  sendFiles,
  users = [],
  isAdmin = false,
}) => {
  const [files, setFiles] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
  };

  const toggleUser = (userid) => {
    setSelectedUserIds((prev) =>
      prev.includes(userid)
        ? prev.filter((id) => id !== userid)
        : [...prev, userid]
    );
  };

  const handleSendFiles = () => {
    sendFiles(files, isAdmin ? selectedUserIds : []);
    setFiles([]);
    setSelectedUserIds([]);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 min-h-screen px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setDocumentUploadModal(false)}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-4">
          <div
            className="border-2 border-dashed border-blue-500 rounded-lg p-6 text-center bg-blue-50 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <i className="fas fa-file-alt text-3xl text-blue-500 mb-4"></i>
            <p className="text-gray-600">Drag and Drop Files here or</p>
            <label className="mt-2 px-4 py-2 bg-white border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white cursor-pointer inline-block">
              Browse Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-700 font-medium">Selected Files:</p>
              <ul className="text-sm text-gray-600 mt-2">
                {files.map((file, index) => (
                  <li key={index} className="truncate">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isAdmin && users.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="text-gray-700 font-medium text-sm mb-2">
                Assign users (optional)
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                {users.map((u) => (
                  <label
                    key={u.userid}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(u.userid)}
                      onChange={() => toggleUser(u.userid)}
                    />
                    <span>
                      {u.username}{" "}
                      <span className="text-gray-500 font-normal">
                        ({u.useremail})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center border-t p-4">
          <button
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
            type="button"
            onClick={() => setDocumentUploadModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center disabled:opacity-50"
            onClick={handleSendFiles}
            disabled={files.length === 0}
          >
            <Upload size={18} />
            <span className="ml-2">Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;
