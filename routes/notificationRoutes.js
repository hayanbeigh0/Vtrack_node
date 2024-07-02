const express = require("express");
const router = express.Router({ mergeParams: true });
const authController = require("../controllers/authController");
const notificationController = require("../controllers/notificationController");

router.use(authController.protect);

router.route("/").get(notificationController.getNotifications);

module.exports = router;
