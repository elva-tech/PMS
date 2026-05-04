const httpStatus = require("http-status");
const Joi = require("joi");
const catchAsync = require("../utils/catchAsync");
const documentService = require("../services/document.service");
const { formatDate } = require("../utils/dateUtils");

const formatDoc = (doc) => ({
  _id: doc._id,
  projectid: doc.projectid,
  originalName: doc.originalName,
  contentType: doc.contentType,
  assignedUserIds: doc.assignedUserIds || [],
  assignedUsers: doc.assignedUsers || [],
  createdAt: doc.createdAt ? formatDate(doc.createdAt) : null,
  updatedAt: doc.updatedAt ? formatDate(doc.updatedAt) : null,
});

const listDocuments = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const {
    page,
    limit,
    filterUserId,
    search,
    searchBy,
    sortBy,
    sortOrder,
  } = req.query;

  const role = req.user?.role || req.user?.type;
  const requestUserId = req.user?.userid;

  const { documents, pagination } = await documentService.listDocumentsForProject(
    projectId,
    {
      page,
      limit,
      sortBy,
      sortOrder,
      role,
      requestUserId,
      filterUserId: filterUserId || undefined,
      search: search || undefined,
      searchBy,
    }
  );

  res.status(httpStatus.OK).json({
    status: "success",
    pagination,
    data: {
      documents: documents.map(formatDoc),
    },
  });
});

const uploadSchema = Joi.object({
  assignedUserIds: Joi.array().items(Joi.string().trim()).default([]),
});

const uploadDocument = catchAsync(async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: "error",
      message: "At least one file is required",
    });
  }

  let assignedUserIds = [];
  const raw = req.body?.assignedUserIds;
  if (raw !== undefined && raw !== null && raw !== "") {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const { value, error } = uploadSchema.validate({
        assignedUserIds: parsed,
      });
      if (error) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "error",
          message: error.details.map((d) => d.message).join(", "),
        });
      }
      assignedUserIds = value.assignedUserIds;
    } catch {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: "error",
        message: "assignedUserIds must be a JSON array of user ids",
      });
    }
  }

  const created = [];
  for (const file of files) {
    const doc = await documentService.createDocument({
      projectId: req.params.projectId,
      originalName: file.originalname,
      contentType: file.mimetype,
      data: file.buffer,
      assignedUserIds,
    });
    const assignedUsers = await documentService.resolveUserSummaries(
      doc.assignedUserIds || []
    );
    created.push(formatDoc({ ...doc, assignedUsers }));
  }

  res.status(httpStatus.CREATED).json({
    status: "success",
    data: {
      documents: created,
    },
  });
});

const downloadDocumentFile = catchAsync(async (req, res) => {
  const { projectId, documentId } = req.params;
  const doc = await documentService.getDocumentFileMeta(projectId, documentId);

  const role = req.user?.role || req.user?.type;
  const requestUserId = req.user?.userid;
  if (
    role === "user" &&
    requestUserId &&
    !(doc.assignedUserIds || []).includes(requestUserId)
  ) {
    return res.status(httpStatus.FORBIDDEN).json({
      status: "error",
      message: "You do not have access to this document",
    });
  }

  let buffer;

  if (doc.data?.type === "Buffer" && Array.isArray(doc.data.data)) {
    buffer = Buffer.from(doc.data.data);
  } else if (Buffer.isBuffer(doc.data)) {
    buffer = doc.data;
  } else {
    buffer = Buffer.from(doc.data);
  }
  
  res.setHeader("Content-Type", doc.contentType || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
     `inline; filename="${encodeURIComponent(doc.originalName)}"`
  );
  res.setHeader("Content-Length", buffer.length);
  
  res.end(buffer);

}); 

const deleteDocument = catchAsync(async (req, res) => {
  await documentService.deleteDocument(req.params.projectId, req.params.documentId);
  res.status(httpStatus.OK).json({
    status: "success",
    data: null,
  });
});

const assignUsers = catchAsync(async (req, res) => {
  const { projectId, documentId } = req.params;
  const { userIds } = req.body;

  const updated = await documentService.assignUsersToDocument(
    projectId,
    documentId,
    userIds
  );

  res.status(httpStatus.OK).json({
    status: "success",
    data: {
      document: formatDoc(updated),
    },
  });
});

const bulkAssignToUser = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { userId, documentIds } = req.body;

  await documentService.bulkAssignDocumentsToUser(
    projectId,
    userId,
    documentIds
  );

  res.status(httpStatus.OK).json({
    status: "success",
    data: { ok: true },
  });
});

module.exports = {
  listDocuments,
  uploadDocument,
  downloadDocumentFile,
  deleteDocument,
  assignUsers,
  bulkAssignToUser,
};
