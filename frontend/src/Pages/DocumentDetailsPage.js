import React, { useState, useEffect, useTransition } from "react";
import UploadDocument from "../Components/DocumentUploadModal";
import {
  Files,
  FileText,
  CalendarDays,
  Eye,
  Trash2,
  FileUp,
  Search,
  Filter,
} from "lucide-react";
import LoadingSpinner from "../Components/LoadingSpinner";
import DeleteModal from "../Components/DeleteModal";
import { useParams } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import axiosInstance from "../utils/axiosInstance";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "../hooks/useDocumentHooks";
import { useUsers } from "../hooks/useUserHooks";

const DocumentDetailsPage = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const isAdmin =
    user?.user?.role === "admin" && user?.user?.type === "admin";

  const [documentUploadModal, setDocumentUploadModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [page, setPage] = useState(1);
  const limit = isAdmin ? 10 : 100;
  const viewerScope = isAdmin
    ? `admin:${user?.user?.username || ""}`
    : `user:${user?.user?.userid || ""}`;

  const [filterUserId, setFilterUserId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchBy, setSearchBy] = useState("document");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filterUserId, debouncedSearch, searchBy, viewerScope]);

  const { data: usersPayload } = useUsers({
    page: 1,
    limit: 300,
    sortBy: "username",
    sortOrder: "asc",
    enabled: isAdmin,
  });
  const usersList = usersPayload?.users || [];

  const {
    data: docResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useDocuments(projectId, {
    page,
    limit,
    viewerScope,
    filterUserId: isAdmin ? filterUserId || undefined : undefined,
    search: debouncedSearch || undefined,
    searchBy: isAdmin ? searchBy : "document",
  });

  const documents = docResponse?.data?.documents || [];
  const pagination = docResponse?.pagination || {
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const handleFileUploadModal = () => {
    startTransition(() => {
      setDocumentUploadModal(true);
    });
  };

  const handleUploadFiles = async (files, assignedUserIds) => {
    if (!files?.length) return;
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append(
      "assignedUserIds",
      JSON.stringify(assignedUserIds || [])
    );
    try {
      await uploadMutation.mutateAsync({ projectId, formData });
      addToast("success", "Upload complete", "Document(s) uploaded.");
      startTransition(() => {
        setDocumentUploadModal(false);
      });
    } catch (err) {
      addToast(
        "error",
        "Upload failed",
        err?.response?.data?.message || err.message || "Could not upload"
      );
    }
  };

  const mimeFromFilename = (name) => {
    const ext = (name || "").split(".").pop()?.toLowerCase();
    const map = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      doc: "application/msword",
      docx:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    return map[ext] || "";
  };

  const handleView = async (documentId, originalName, docContentType) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/documents/${projectId}/${documentId}/file`,
        {
          responseType: "blob",
          headers: { Accept: "*/*" },
        }
      );

      const raw = res.data;
      const buf =
        raw instanceof Blob ? await raw.arrayBuffer() : new Uint8Array(raw);

      const headerType = (
        res.headers?.["content-type"] ||
        res.headers?.["Content-Type"] ||
        ""
      )
        .split(";")[0]
        .trim();

      let mime =
        headerType && !headerType.includes("application/json")
          ? headerType
          : docContentType || "";

      if (!mime || mime === "application/octet-stream") {
        mime = mimeFromFilename(originalName) || mime || "application/octet-stream";
      }

      const head = new TextDecoder().decode(buf.slice(0, 1));
      if (head === "{" || head === "[") {
        try {
          const t = new TextDecoder().decode(buf);
          const j = JSON.parse(t);
          if (j?.status === "error" || j?.message) {
            addToast("error", "View failed", j.message || "Could not open file");
            return;
          }
        } catch {
          /* not JSON — treat as binary */
        }
      }

      const blob = new Blob([buf], { type: mime });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, "_blank", "noopener,noreferrer");
      if (!newWin) {
        const a = document.createElement("a");
        a.href = url;
        a.download = originalName || "download";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch (err) {
      let msg =
        err?.response?.data?.message || err.message || "Could not open file";
      const data = err?.response?.data;
      if (data instanceof Blob) {
        try {
          const t = await data.text();
          const j = JSON.parse(t);
          if (j?.message) msg = j.message;
        } catch {
          /* keep default msg */
        }
      }
      addToast("error", "View failed", msg);
    }
  };

  const handleConfirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      await deleteMutation.mutateAsync({
        projectId,
        documentId: documentToDelete,
      });
      addToast("success", "Deleted", "Document removed.");
      setDocumentToDelete(null);
    } catch (err) {
      addToast(
        "error",
        "Delete failed",
        err?.response?.data?.message || err.message || "Could not delete"
      );
    }
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Files className="text-blue-600 mr-2" /> Documents
        </h2>
        <div className="flex flex-row items-center justify-center gap-4 w-full md:w-auto">
          {isAdmin && (
            <button
              className="bg-blue-600 text-white px-2 py-2 rounded flex items-center hover:bg-blue-700 disabled:opacity-50"
              onClick={handleFileUploadModal}
              disabled={isPending || uploadMutation.isPending}
            >
              <FileUp className="mr-2" />{" "}
              {uploadMutation.isPending ? "Uploading…" : "Upload Document"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-wrap gap-3 mb-4">
        {isAdmin && (
          <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Filter className="text-gray-600 mr-2 shrink-0" size={18} />
            <select
              className="bg-transparent focus:outline-none w-full text-sm"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            >
              <option value="">Filter by user — All</option>
              {usersList.map((u) => (
                <option key={u.userid} value={u.userid}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          {isAdmin && (
            <>
              <span className="text-gray-600 text-xs shrink-0 mr-2 whitespace-nowrap">
                Search by
              </span>
              <select
                className="bg-transparent focus:outline-none text-sm border-r border-gray-200 pr-2 mr-2"
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="document">Document</option>
                <option value="user">User</option>
              </select>
            </>
          )}
          <Search className="text-gray-400 mr-2 shrink-0" size={18} />
          <input
            type="search"
            className="flex-1 min-w-0 bg-transparent focus:outline-none text-sm py-1"
            placeholder={
              isAdmin && searchBy === "user"
                ? "Name, email, or user id…"
                : "File name…"
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error?.message ||
            error?.response?.data?.message ||
            "Could not load documents."}
        </div>
      ) : (
        <>
          {isFetching && !isLoading && (
            <p className="text-xs text-gray-500 mb-2">Updating results…</p>
          )}
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm text-left border-collapse rounded-lg overflow-hidden shadow-lg">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 text-center md:text-left">File Name</th>
                  <th className="p-4 text-center md:text-left">
                    Assigned Users
                  </th>
                  <th className="p-4 text-center md:text-left">Date</th>
                  <th className="p-4 text-center md:text-left">Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-900 text-xs md:text-sm font-semibold">
                {documents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center text-gray-500 font-normal"
                    >
                      No documents found for these filters.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr
                      key={doc._id}
                      className="border-b hover:bg-gray-100 text-sm md:text-base "
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-5">
                            <FileText className="text-blue-500 w-full h-full" />
                          </div>
                          <span className="break-words">{doc.originalName}</span>
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <span className="break-words font-normal text-gray-700">
                          {(doc.assignedUsers || []).length
                            ? (doc.assignedUsers || [])
                                .map((u) => u.username)
                                .join(", ")
                            : "—"}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center">
                          <CalendarDays className="text-gray-500 mr-2 inline text-center" />{" "}
                          {doc.createdAt || "—"}
                        </div>
                      </td>
                      <td className="p-4 flex items-center">
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700 mr-6"
                          onClick={() =>
                            handleView(
                              doc._id,
                              doc.originalName,
                              doc.contentType
                            )
                          }
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            onClick={() => setDocumentToDelete(doc._id)}
                            disabled={deleteMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalRecords > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 text-xs md:text-sm rounded-lg shadow-lg mt-4">
              <div className="text-gray-600 mb-2 sm:mb-0">
                Showing {documents.length} of {pagination.totalRecords}{" "}
                documents — page {pagination.currentPage}
                {pagination.totalPages ? ` of ${pagination.totalPages}` : ""}
              </div>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className={`py-1 px-3 rounded ${
                    pagination.hasPrevPage
                      ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  &lt;
                </button>
                {[...Array(pagination.totalPages || 0)].map((_, index) => (
                  <button
                    type="button"
                    key={index + 1}
                    onClick={() => setPage(index + 1)}
                    className={`py-1 px-3 rounded ${
                      pagination.currentPage === index + 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`py-1 px-3 rounded ${
                    pagination.hasNextPage
                      ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {documentToDelete && (
        <DeleteModal
          onConfirm={handleConfirmDeleteDocument}
          onCancel={() => setDocumentToDelete(null)}
          title="Delete document"
          message="Delete this document? This cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={deleteMutation.isPending}
        />
      )}

      {documentUploadModal && (
        <UploadDocument
          users={usersList}
          isAdmin={isAdmin}
          setDocumentUploadModal={(value) => {
            startTransition(() => {
              setDocumentUploadModal(value);
            });
          }}
          sendFiles={handleUploadFiles}
        />
      )}
    </div>
  );
};

export default DocumentDetailsPage;
