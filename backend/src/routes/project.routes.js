const express = require("express");
const multer = require("multer");
const validate = require("../middleware/validate");
const projectValidation = require("../validation/project.validation");
const projectController = require("../controllers/project.controller");
const auth = require("../middleware/auth");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "brochure") {
      const ok =
        file.mimetype.startsWith("image/") ||
        file.mimetype === "application/pdf";
      if (ok) return cb(null, true);
      return cb(
        new Error("Brochure: only image (png, jpg, jpeg) or PDF is allowed."),
        false
      );
    }
    if (file.fieldname === "image") {
      if (file.mimetype.startsWith("image/")) return cb(null, true);
      return cb(
        new Error("Layout image: only image files (png, jpg, jpeg)."),
        false
      );
    }
    return cb(new Error("Unexpected file field."), false);
  },
});

router.use(auth);

router
  .route("/")
  .post(
    upload.fields([
      { name: "brochure", maxCount: 1 },
      { name: "image", maxCount: 1 },
    ]),
    validate(projectValidation.createProject),
    projectController.createProject
  )
  .get(projectController.getProjects);

router
  .route("/:projectId")
  .get(projectController.getProject)
  .put(
    validate(projectValidation.updateProject),
    projectController.updateProject
  )
  .delete(projectController.deleteProject);

router.get("/:projectId/image", projectController.getProjectImage);

module.exports = router;
