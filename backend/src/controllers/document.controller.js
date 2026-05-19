const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const documentService = require("../services/document.service");
const Plot = require("../models/plot.model");
const { formatDate } = require("../utils/dateUtils");

const formatDoc = (doc) => ({
  _id: doc._id,
  projectid: doc.projectid,
  plotid: doc.plotid || null,
  allPlots: Boolean(doc.allPlots),
  originalName: doc.originalName,
  contentType: doc.contentType,
  documentType: doc.documentType || null,
  otherLabel: doc.otherLabel || "",
  remarks: doc.remarks || "",
  documentTypeLabel:
    doc.documentTypeLabel || documentService.documentTypeLabel(doc),
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
    filterPlotId,
    search,
    searchBy,
    sortBy,
    sortOrder,
  } = req.query;

  const role = req.user?.role || req.user?.type;
  const requestUserId = req.user?.userid || req.user?.usermongoid;

  const { documents, pagination } = await documentService.listDocumentsForProject(
    projectId,
    {
      page,
      limit,
      sortBy,
      sortOrder,
      role,
      requestUserId,
      filterPlotId: filterPlotId || undefined,
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

const uploadDocument = catchAsync(async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: "error",
      message: "At least one file is required",
    });
  }

  const rawPlotId = req.body?.plotid;
  const allPlots =
    req.body?.allPlots === true ||
    req.body?.allPlots === "true" ||
    req.body?.allPlots === "1";

  let documentType = (req.body?.documentType || "").trim();
  let otherLabel = (req.body?.otherLabel || "").trim();
  const remarks = (req.body?.remarks || "").trim();

  if (!documentType) {
    documentType = "other";
    if (!otherLabel) otherLabel = "Payment document";
  }

  if (!documentService.DOCUMENT_TYPES.includes(documentType)) {
    documentType = "other";
  }

  if (documentType === "other" && !otherLabel.trim()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: "error",
      message: "Enter a document name when type is Other",
    });
  }

  const created = [];
  for (const file of files) {
    const batch = await documentService.createDocumentsFromUpload({
      projectId: req.params.projectId,
      originalName: file.originalname,
      contentType: file.mimetype,
      data: file.buffer,
      plotid: allPlots ? null : rawPlotId || null,
      allPlots,
      documentType,
      otherLabel,
      remarks,
    });
    for (const doc of batch) {
      const assignedUsers = await documentService.resolveUserSummaries(
        doc.assignedUserIds || []
      );
      created.push(
        formatDoc({
          ...doc,
          documentTypeLabel: documentService.documentTypeLabel(doc),
          assignedUsers,
        })
      );
    }
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
  const requestUserId = req.user?.userid || req.user?.usermongoid;
  const requestMongoId = req.user?.usermongoid;
  const allowedIds = new Set(
    [requestUserId, requestMongoId].filter(Boolean).map((id) => String(id))
  );
  let hasPlotAccess = false;
  if (role === "user" && allowedIds.size > 0) {
    if (doc.allPlots) {
      const anyAssigned = await Plot.findOne({
        projectid: projectId,
        assigneduserid: { $in: [...allowedIds] },
      })
        .select("_id")
        .lean();
      hasPlotAccess = Boolean(anyAssigned);
    } else if (doc.plotid) {
      const linkedPlot = await Plot.findOne({
        _id: doc.plotid,
        projectid: projectId,
        assigneduserid: { $in: [...allowedIds] },
      })
        .select("_id")
        .lean();
      hasPlotAccess = Boolean(linkedPlot);
    }
  }
  if (
    role === "user" &&
    allowedIds.size > 0 &&
    !(doc.assignedUserIds || []).some((id) => allowedIds.has(String(id))) &&
    !hasPlotAccess
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
