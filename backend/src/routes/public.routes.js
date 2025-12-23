const express = require("express");
const projectController = require("../controllers/project.controller");

const router = express.Router();

// Public routes - no authentication required
router.get("/projects", projectController.getProjects);
router.get("/projects/:projectId", projectController.getProject);
router.get("/projects/:projectId/image", projectController.getProjectImage);

module.exports = router;
