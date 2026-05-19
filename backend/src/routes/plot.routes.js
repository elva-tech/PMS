const express = require("express");
const validate = require("../middleware/validate");
const plotValidation = require("../validation/plot.validation");
const plotController = require("../controllers/plot.controller");
const auth = require("../middleware/auth");
const router = express.Router();

router.use(auth);

router.get("/", plotController.getAllPlots);

router.get("/:projectId", plotController.getPlots);

router.post(
  "/:projectId",
  validate(plotValidation.createPlot),
  plotController.createPlot
);

router.put(
  "/:projectId/:plotId",
  validate(plotValidation.updatePlot),
  plotController.updatePlot
);

router.delete("/:projectId/:plotId", plotController.deletePlot);

module.exports = router;
