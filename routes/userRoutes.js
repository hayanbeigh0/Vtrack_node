const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protect all these routes after this middleware
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);

router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

// Restrict to only admin
// router.use(authController.restrictTo('admin'));

router
  .route("/")
  .get(authController.restrictTo("admin"), userController.getAllUsers) // This needs to be restricted to only admin
  .post(userController.createUser);
router.route("/getAllOrgUsers/:organisationId").get(userController.getAllUsers);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
