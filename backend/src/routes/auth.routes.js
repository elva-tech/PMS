const express = require("express");
const { login, logout, validate } = require("../controllers/auth.controller");
const { login: loginValidation } = require("../validation/auth.validation");
const validateMiddleware = require("../middleware/validate");

const router = express.Router();

router.post("/login", validateMiddleware(loginValidation), login);
router.post("/logout", logout);
router.get("/validate", validate);

module.exports = router;
