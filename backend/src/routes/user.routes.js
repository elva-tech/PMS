const express = require("express");
const validate = require("../middleware/validate");
const userValidation = require("../validation/user.validation");
const userController = require("../controllers/user.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router
  .route("/")
  .post(validate(userValidation.createUser), userController.createUser)
  .get(validate(userValidation.getUsers), userController.getUsers);

router
  .route("/:userId")
  .get(userController.getUser)
  .put(validate(userValidation.updateUser), userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
