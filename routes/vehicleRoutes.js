const express = require("express");

const reviewController = require("../controllers/reviewController");
const vehicleController = require("../controllers/vehicleController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .post(
    authController.restrictTo("user", "admin", "org-admin"),
    vehicleController.createVehicleForOrganisation
  );
router
  .route("/:organisationId")
  .post(
    authController.restrictTo("admin", "org-admin"),
    vehicleController.createVehicleForOrganisation
  );
router
  .route("/getOrgVehicles/:organisationId")
  .get(
    authController.restrictTo("admin", "org-admin"),
    vehicleController.getVehicles
  );
router
  .route("/:id")
  .get(vehicleController.getVehicle)
  .delete(
    authController.restrictTo("org-admin", "admin"),
    vehicleController.deleteVehicle
  )
  .patch(
    authController.restrictTo("org-admin", "admin"),
    vehicleController.updateVehicle
  );

module.exports = router;
