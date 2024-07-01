const express = require("express");
const router = express.Router({ mergeParams: true });
const authController = require("../controllers/authController");
const inviteController = require("../controllers/inviteController");

router.use(authController.protect);

router.route("/").post(inviteController.inviteUser);
router.route("/accept").post(inviteController.inviteUser);

module.exports = router;
