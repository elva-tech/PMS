const express = require("express");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/adminAuth");
const paymentValidation = require("../validation/payment.validation");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

router.use(auth);

router.post(
  "/:projectId",
  requireAdmin,
  validate(paymentValidation.createPayment),
  paymentController.createPayment
);

router.get(
  "/:projectId",
  validate(paymentValidation.listPayments),
  paymentController.listPayments
);

router.patch(
  "/:projectId/:paymentId",
  requireAdmin,
  validate(paymentValidation.updatePayment),
  paymentController.updatePayment
);

router.delete(
  "/:projectId/:paymentId",
  requireAdmin,
  validate(paymentValidation.deletePayment),
  paymentController.deletePayment
);

module.exports = router;
