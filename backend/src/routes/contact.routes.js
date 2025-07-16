const express = require("express");
const validate = require("../middleware/validate");
const contactValidation = require("../validation/contact.validation");
const contactController = require("../controllers/contact.controller");

const router = express.Router();

router.post(
  "/",
  validate(contactValidation.createContact.body),
  contactController.createContact
);

module.exports = router;
