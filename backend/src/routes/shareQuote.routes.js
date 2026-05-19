const express = require("express");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const shareQuoteValidation = require("../validation/shareQuote.validation");
const shareQuoteController = require("../controllers/shareQuote.controller");

const router = express.Router();

router.use(auth);

router.post(
  "/preview",
  validate(shareQuoteValidation.previewShareQuote),
  shareQuoteController.previewShareQuote
);

module.exports = router;
