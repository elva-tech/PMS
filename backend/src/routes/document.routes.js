const express = require("express");
const multer = require("multer");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/adminAuth");
const documentValidation = require("../validation/document.validation");
const documentController = require("../controllers/document.controller");

const router = express.Router();

const storage = multer.memoryStorage();
const allowedMimes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Accept PDFs, common images, and doc/docx. Reject everything else.
    const mime = file?.mimetype || "";
    if (mime === "application/pdf" || mime.startsWith("image/")) {
      return cb(null, true);
    }
    if (allowedMimes.has(mime)) {
      return cb(null, true);
    }
    return cb(new Error("Unsupported file type"), false);
  },
});

router.use(auth);

router.post(
  "/:projectId",
  requireAdmin,
  upload.array("files", 15),
  documentController.uploadDocument
);

router.patch(
  "/:projectId/bulk-assign",
  requireAdmin,
  validate(documentValidation.bulkAssignDocuments),
  documentController.bulkAssignToUser
);

router.patch(
  "/:projectId/:documentId/assign",
  requireAdmin,
  validate(documentValidation.assignDocumentUsers),
  documentController.assignUsers
);

router.delete(
  "/:projectId/:documentId",
  requireAdmin,
  validate(documentValidation.documentIdParams),
  documentController.deleteDocument
);

router.get(
  "/:projectId/:documentId/file",
  validate(documentValidation.documentIdParams),
  documentController.downloadDocumentFile
);

router.get(
  "/:projectId",
  validate(documentValidation.listDocuments),
  documentController.listDocuments
);

module.exports = router;
