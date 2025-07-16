const express = require("express");
const { login, logout } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/validate", (req, res) => {
  // Token validation is handled by middleware
  res.status(200).json({ valid: true });
});

module.exports = router;
