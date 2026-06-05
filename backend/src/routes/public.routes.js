const express = require("express");
const projectController = require("../controllers/project.controller");
const contactController = require("../controllers/contact.controller");
const shareQuoteValidation = require("../validation/shareQuote.validation");
const validate = require("../middleware/validate");
const Plot = require("../models/plot.model");

const router = express.Router();

// Public routes - no authentication required
router.get("/projects", projectController.getProjects);
router.get("/projects/:projectId", projectController.getProject);
router.get("/projects/:projectId/image", projectController.getProjectImage);
router.get("/projects/:projectId/plots", async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const plots = await Plot.find({ projectid: projectId })
      .sort({ plotnumber: 1 })
      .select(
        "_id plotnumber plotsize plotdirection plotprice plotstatus projectid plotType roadWidthFt approvalStatus"
      )
      .lean();
    res.status(200).send({
      status: "success",
      data: { plots },
    });
  } catch (error) {
    next(error);
  }
});
router.post(
  "/interested-buyers",
  validate(shareQuoteValidation.createPublicInterestedBuyer),
  contactController.createPublicInterestedBuyer
);

module.exports = router;
