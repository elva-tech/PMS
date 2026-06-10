const express = require("express");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/adminAuth");
const validate = require("../middleware/validate");
const assistantValidation = require("../validation/assistant.validation");
const assistantController = require("../controllers/assistant.controller");

const router = express.Router();

router.get("/config", auth, assistantController.getAssistantConfig);

router.post(
  "/chat",
  auth,
  requireAdmin,
  validate(assistantValidation.chat),
  assistantController.postChat
);

module.exports = router;
