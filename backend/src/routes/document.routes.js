const express = require("express");
const multer = require("multer");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/adminAuth");
const documentValidation = require("../validation/document.validation");
const documentController = require("../controllers/document.controller");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    fileFilter: (req, file, cb) => {
      // allow everything except dangerous executables
      const blocked = ["application/x-msdownload"]; // .exe etc
    
      if (blocked.includes(file.mimetype)) {
        cb(new Error("Unsupported file type"), false);
      } else {
        cb(null, true);
      }
    }
    if (allowed.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
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
