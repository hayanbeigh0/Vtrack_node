const express = require("express");
const router = express.Router({ mergeParams: true });
const authController = require("../controllers/authController");
const notificationController = require("../controllers/notificationController");

router.use(authController.protect);

router.route("/").post(notificationController.getNotifications);

module.exports = router;
