const mongoose = require("mongoose");
const Document = require("../models/document.model");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const Plot = require("../models/plot.model");
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

const resolveRequestUserIds = async (requestUserId) => {
  const ids = new Set();
  if (!requestUserId) return [];
  ids.add(String(requestUserId));
  const byUserId = await User.findOne({ userid: String(requestUserId) })
    .select("_id userid")
    .lean();
  if (byUserId?._id) ids.add(String(byUserId._id));
  if (byUserId?.userid) ids.add(String(byUserId.userid));
  return [...ids];
};

const DOCUMENT_TYPES = [
  "sketch",
  "form_2",
  "form_1",
  "form_11",
  "sale_deed",
  "property_tax_receipts",
  "other",
];

const DOCUMENT_TYPE_LABELS = {
  sketch: "Sketch",
  form_2: "Form 2",
  form_1: "Form 1",
  form_11: "Form 11",
  sale_deed: "Sale deed",
  property_tax_receipts: "Property tax paid receipts",
  other: "Other",
};

const documentTypeLabel = (d) => {
  const t = d.documentType;
  if (!t) return "—";
  if (t === "other" && (d.otherLabel || "").trim()) {
    return String(d.otherLabel).trim();
  }
  return DOCUMENT_TYPE_LABELS[t] || t || "—";
};

const buildListFilter = async ({
  projectId,
  role,
  requestUserId,
  filterPlotId,
  search,
  searchBy,
}) => {
  const clauses = [{ projectid: projectId }];

  if (role === "user" && requestUserId) {
    const requesterIds = await resolveRequestUserIds(requestUserId);
    const assignedPlots = await Plot.find({
      projectid: projectId,
      assigneduserid: { $in: requesterIds },
    })
      .select("_id")
      .lean();
    const assignedPlotIds = assignedPlots.map((p) => String(p._id));
    const userScopeOr = [{ assignedUserIds: { $in: requesterIds } }];
    if (assignedPlotIds.length) {
      userScopeOr.push({ plotid: { $in: assignedPlotIds } });
      userScopeOr.push({ allPlots: true });
    }
    clauses.push({ $or: userScopeOr });
  }

  if (filterPlotId && String(filterPlotId).trim()) {
    const fid = String(filterPlotId).trim();
    clauses.push({
      $or: [{ plotid: fid }, { allPlots: true }],
    });
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
    } else if (searchBy === "plot") {
      const matchedPlots = await Plot.find({
        projectid: projectId,
        $or: [
          { plotnumber: Number.isFinite(Number(term)) ? Number(term) : -1 },
          { plotdirection: { $regex: term, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();
      const plotIds = matchedPlots.map((p) => String(p._id));
      if (!plotIds.length) {
        return { query: { _id: { $in: [] } }, empty: true };
      }
      clauses.push({
        $or: [{ plotid: { $in: plotIds } }, { allPlots: true }],
      });
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
    filterPlotId,
    search,
    searchBy = "document",
  }
) => {
  await verifyProjectExists(projectId);

  const { query, empty } = await buildListFilter({
    projectId,
    role,
    requestUserId,
    filterPlotId,
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
    plotid: d.plotid || null,
    allPlots: Boolean(d.allPlots),
    originalName: d.originalName,
    contentType: d.contentType,
    documentType: d.documentType || null,
    otherLabel: d.otherLabel || "",
    remarks: d.remarks || "",
    documentTypeLabel: documentTypeLabel(d),
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

const normalizeUploadMeta = (documentType, otherLabel, remarks) => {
  const type = DOCUMENT_TYPES.includes(documentType) ? documentType : "other";
  const ol = type === "other" ? String(otherLabel || "").trim() : "";
  if (type === "other" && !ol) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Enter a document name when type is Other"
    );
  }
  return {
    documentType: type,
    otherLabel: ol,
    remarks: String(remarks || "").trim(),
  };
};

/**
 * One DB row per upload. Project-wide files use allPlots=true and a single buffer.
 * Per-plot files set plotid and allPlots=false.
 */
const createDocumentsFromUpload = async ({
  projectId,
  originalName,
  contentType,
  data,
  plotid = null,
  allPlots = false,
  documentType = "other",
  otherLabel = "",
  remarks = "",
}) => {
  await verifyProjectExists(projectId);
  const meta = normalizeUploadMeta(documentType, otherLabel, remarks);
  const baseBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (allPlots) {
    const count = await Plot.countDocuments({ projectid: projectId });
    if (!count) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No plots in this project to attach documents to"
      );
    }
    const doc = await Document.create({
      projectid: projectId,
      originalName,
      contentType,
      data: baseBuffer,
      assignedUserIds: [],
      plotid: null,
      allPlots: true,
      documentType: meta.documentType,
      otherLabel: meta.otherLabel,
      remarks: meta.remarks,
    });
    return [await Document.findById(doc._id).select("-data").lean()];
  }

  if (!plotid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Select a plot or choose All plots"
    );
  }
  const plot = await Plot.findOne({ _id: plotid, projectid: projectId })
    .select("_id")
    .lean();
  if (!plot) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid plot for this project");
  }

  const doc = await Document.create({
    projectid: projectId,
    originalName,
    contentType,
    data: baseBuffer,
    assignedUserIds: [],
    plotid: String(plot._id),
    allPlots: false,
    documentType: meta.documentType,
    otherLabel: meta.otherLabel,
    remarks: meta.remarks,
  });
  return [await Document.findById(doc._id).select("-data").lean()];
};

const getDocumentFileMeta = async (projectId, documentId) => {
  await verifyProjectExists(projectId);
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid document id");
  }
  const doc = await Document.findOne({
    _id: documentId,
    projectid: projectId,
  }).select("data contentType originalName assignedUserIds plotid allPlots");
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
  createDocumentsFromUpload,
  getDocumentFileMeta,
  deleteDocument,
  assignUsersToDocument,
  bulkAssignDocumentsToUser,
  resolveUserSummaries,
  DOCUMENT_TYPES,
  documentTypeLabel,
};
