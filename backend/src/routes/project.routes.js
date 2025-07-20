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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

router.use(auth);

router
  .route("/")
  .post(
    upload.single("image"),
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
