const express = require("express");
const auth = require("../middleware/auth");
const assistantController = require("../controllers/assistant.controller");

const router = express.Router();

router.use(auth);
router.get("/config", assistantController.getAssistantConfig);

module.exports = router;
