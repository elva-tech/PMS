import React from "react";
import { useState, useEffect } from "react";
import { Search, X, Edit, Trash2 } from "lucide-react";
import { RiUserAddLine } from "react-icons/ri";
import LoadingSpinner from "../Components/LoadingSpinner";
import AddUserModal from "../Components/AddUserModal";
import { useUsers, useDeleteUser, useUpdateUser } from "../hooks/useUserHooks";
import DeleteModal from "../Components/DeleteModal";

const LayoutPageDetails = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const getStatusText = (status) => {
    return status === 1 ? "Active" : "Inactive";
  };
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      status: "Active",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      status: "Active",
      createdAt: "2024-01-20",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      status: "Inactive",
      createdAt: "2024-01-10",
    },
  ]);
  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
  } = useUsers({
    page: pagination.currentPage,
    limit: 10,
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
  });

  const usersData = usersResponse?.users || [];

  useEffect(() => {
    if (usersResponse?.pagination) {
      setPagination(usersResponse.pagination);
    }
  }, [usersResponse?.pagination]);

  console.log("Users data from hook:", usersData);
  const handleAddUser = (user) => {
    setUsers([
      ...users,
      { ...user, createdAt: new Date().toISOString().split("T")[0] },
    ]);
  };

  const handleEditUser = (user) => {
    setUserToEdit(user);
    setIsAddUserModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddUserModalOpen(false);
    setUserToEdit(null);
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const newStatus = user.userstatus === 1 ? 0 : 1;
      await updateUserMutation.mutateAsync({
        id: user.userid,
        userData: {
          username: user.username,
          useremail: user.useremail,
          userstatus: newStatus,
        },
      });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        },
      });
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-4 sm:px-6 space-y-4 lg:space-y-0">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 text-center sm:text-left w-full lg:w-auto">
          Users [{pagination.totalRecords}]
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto sm:min-w-[250px]">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-row space-x-2 w-full sm:w-auto">
            <button
              onClick={() =>
                setSortConfig((prev) => ({
                  sortBy: "createdAt",
                  sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
                }))
              }
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-center transition-all duration-200 h-[42px]"
            >
              <span className="hidden sm:inline">Sort by: </span>
              {sortConfig.sortOrder === "desc" ? "Newest" : "Oldest"}
              <i
                className={`fas fa-chevron-${
                  sortConfig.sortOrder === "desc" ? "down" : "up"
                } ml-2`}
              ></i>
            </button>
            <button
              onClick={() => {
                setUserToEdit(null);
                setIsAddUserModalOpen(true);
              }}
              className="flex-1 sm:flex-none bg-blue-600 text-white rounded-lg py-2.5 px-4 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center transition-all duration-200 shadow-sm h-[42px]"
            >
              <RiUserAddLine className="mr-2" size={16} />
              Add User
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto shadow-lg">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-lg mt-4">
              <thead>
                <tr className="w-full bg-blue-600 text-left text-white uppercase text-xs md:text-sm mt-4">
                  <th className="py-3 px-4">Users Name</th>
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Creation Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-xs md:text-sm font-semibold">
                {console.log("user Data:-", usersData)}
                {usersData
                  .filter(
                    (user) =>
                      user.username
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      user.useremail
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                  )
                  .map((user, index) => (
                    <tr
                      key={user.userid}
                      className="border-b border-gray-200 hover:bg-gray-100"
                    >
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4">{user.useremail}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.userstatus === 1
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {getStatusText(user.userstatus)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.createdAt.split(",")[0]}
                      </td>
                      <td className="py-3 px-4">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={user.userstatus === 1}
                            onChange={() => handleToggleUserStatus(user)}
                            disabled={updateUserMutation.isPending}
                          />
                          <div
                            className={`w-10 h-5 rounded-full transition relative ${
                              user.userstatus === 1
                                ? "bg-green-500"
                                : "bg-gray-300"
                            } ${
                              updateUserMutation.isPending
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition ${
                                user.userstatus === 1
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            ></div>
                          </div>
                        </label>
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button className="flex items-center gap-1 px-2 py-1  text-gray-700 hover:bg-gray-100 text-sm">
                          <Edit
                            className="w-4 h-4"
                            onClick={() => handleEditUser(user)}
                          />
                        </button>
                        <button className="flex items-center gap-1 px-2 py-1  text-red-600 hover:bg-red-50 text-sm">
                          <Trash2
                            className="w-4 h-4"
                            onClick={() => handleDeleteUser(user.userid)}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 text-xs md:text-sm rounded-lg shadow-lg">
            <div className="text-gray-600 mb-2 md:mb-0">
              Showing {usersData.length} of {pagination.totalRecords} users
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage - 1,
                  }))
                }
                disabled={!pagination.hasPrevPage}
                className={`py-1 px-3 rounded ${
                  pagination.hasPrevPage
                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                &lt;
              </button>
              {[...Array(pagination.totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: index + 1,
                    }))
                  }
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
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
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
        </div>
      )}
      {isAddUserModalOpen && (
        <AddUserModal
          isOpen={isAddUserModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddUser}
          userToEdit={userToEdit}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          title="Delete User"
          message={`Are you sure you want to delete this ${userToDelete?.username} user?`}
          confirmText="Delete User"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default LayoutPageDetails;
