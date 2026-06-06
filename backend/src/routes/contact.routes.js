const express = require("express");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const contactValidation = require("../validation/contact.validation");
const contactController = require("../controllers/contact.controller");

const router = express.Router();

router.post(
  "/",
  validate(contactValidation.createContact),
  contactController.createContact
);

router.get(
  "/getContacts",
  auth,
  validate(contactValidation.getContacts.query),
  contactController.getContacts
);

router.patch(
  "/:contactId/status",
  auth,
  validate(contactValidation.updateContactStatus),
  contactController.updateContactStatus
);

router.delete(
  "/:contactId",
  auth,
  validate(contactValidation.deleteContact),
  contactController.deleteContact
);

module.exports = router;
