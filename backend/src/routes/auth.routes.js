const express = require("express");
const { login, logout, validate } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/validate", validate);

module.exports = router;
