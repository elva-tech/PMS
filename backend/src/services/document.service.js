const mongoose = require("mongoose");
const Document = require("../models/document.model");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const verifyProjectExists = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }
};

const resolveUserSummaries = async (userIds = []) => {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return [];
  const users = await User.find({ userid: { $in: unique } })
    .select("userid username useremail")
    .lean();
  return users.map((u) => ({
    userid: u.userid,
    username: u.username,
    useremail: u.useremail,
  }));
};

const buildListFilter = async ({
  projectId,
  role,
  requestUserId,
  filterUserId,
  search,
  searchBy,
}) => {
  const clauses = [{ projectid: projectId }];

  if (role === "user" && requestUserId) {
    clauses.push({ assignedUserIds: requestUserId });
  } else if (role !== "user" && filterUserId) {
    clauses.push({ assignedUserIds: filterUserId });
  }

  if (search && String(search).trim()) {
    const term = String(search).trim();
    if (searchBy === "user") {
      const matchedUsers = await User.find({
        $or: [
          { username: { $regex: term, $options: "i" } },
          { useremail: { $regex: term, $options: "i" } },
          { userid: term },
        ],
      })
        .select("userid")
        .lean();
      const ids = matchedUsers.map((u) => u.userid);
      if (!ids.length) {
        return { query: { _id: { $in: [] } }, empty: true };
      }
      clauses.push({ assignedUserIds: { $in: ids } });
    } else {
      clauses.push({ originalName: { $regex: term, $options: "i" } });
    }
  }

  const query = clauses.length === 1 ? clauses[0] : { $and: clauses };
  return { query, empty: false };
};

const listDocumentsForProject = async (
  projectId,
  {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    role,
    requestUserId,
    filterUserId,
    search,
    searchBy = "document",
  }
) => {
  await verifyProjectExists(projectId);

  const { query, empty } = await buildListFilter({
    projectId,
    role,
    requestUserId,
    filterUserId,
    search,
    searchBy,
  });

  if (empty) {
    return {
      documents: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const total = await Document.countDocuments(query);
  const docs = await Document.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-data")
    .lean();

  const allAssignedIds = docs.flatMap((d) => d.assignedUserIds || []);
  const usersById = {};
  (await resolveUserSummaries(allAssignedIds)).forEach((u) => {
    usersById[u.userid] = u;
  });

  const documents = docs.map((d) => ({
    _id: d._id,
    projectid: d.projectid,
    originalName: d.originalName,
    contentType: d.contentType,
    assignedUserIds: d.assignedUserIds || [],
    assignedUsers: (d.assignedUserIds || [])
      .map((id) => usersById[id])
      .filter(Boolean),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    documents,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords: total,
      hasNextPage: totalPages > 0 && page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const createDocument = async ({
  projectId,
  originalName,
  contentType,
  data,
  assignedUserIds = [],
}) => {
  await verifyProjectExists(projectId);

  const ids = [...new Set((assignedUserIds || []).filter(Boolean))];
  if (ids.length) {
    const count = await User.countDocuments({ userid: { $in: ids } });
    if (count !== ids.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid assigned user id(s)");
    }
  }

  const doc = await Document.create({
    projectid: projectId,
    originalName,
    contentType,
    data,
    assignedUserIds: ids,
  });

  return Document.findById(doc._id).select("-data").lean();
};

const getDocumentFileMeta = async (projectId, documentId) => {
  await verifyProjectExists(projectId);
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid document id");
  }
  const doc = await Document.findOne({
    _id: documentId,
    projectid: projectId,
  }).lean();
  if (!doc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  }
  return doc;
};

const deleteDocument = async (projectId, documentId) => {
  await verifyProjectExists(projectId);
  const deleted = await Document.findOneAndDelete({
    _id: documentId,
    projectid: projectId,
  });
  if (!deleted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  }
  return deleted;
};

const assignUsersToDocument = async (projectId, documentId, userIds) => {
  await verifyProjectExists(projectId);
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No users specified");
  }
  const count = await User.countDocuments({ userid: { $in: ids } });
  if (count !== ids.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid assigned user id(s)");
  }

  const updated = await Document.findOneAndUpdate(
    { _id: documentId, projectid: projectId },
    { $addToSet: { assignedUserIds: { $each: ids } } },
    { new: true }
  )
    .select("-data")
    .lean();

  if (!updated) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  }

  const assignedUsers = await resolveUserSummaries(updated.assignedUserIds);
  return { ...updated, assignedUsers };
};

const bulkAssignDocumentsToUser = async (projectId, userId, documentIds) => {
  await verifyProjectExists(projectId);
  const user = await User.findOne({ userid: userId }).select("userid").lean();
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const ids = [...new Set((documentIds || []).filter(Boolean))];
  if (!ids.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No documents specified");
  }

  await Document.updateMany(
    {
      _id: { $in: ids },
      projectid: projectId,
    },
    { $addToSet: { assignedUserIds: userId } }
  );

  return { modified: ids.length };
};

module.exports = {
  listDocumentsForProject,
  createDocument,
  getDocumentFileMeta,
  deleteDocument,
  assignUsersToDocument,
  bulkAssignDocumentsToUser,
  resolveUserSummaries,
};
