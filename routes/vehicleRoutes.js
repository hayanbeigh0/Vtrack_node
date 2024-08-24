const express = require("express");

const vehicleController = require("../controllers/vehicleController");
const authController = require("../controllers/authController");
const helpers = require("../utils/helper");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .post(
    authController.restrictTo("user", "admin", "org-admin"),
    helpers.checkUserOrganisation,
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
    helpers.checkUserOrganisation,
    vehicleController.updateVehicle
  );

router
  .route("/getPickupLocations/:vehicleId")
  .get(vehicleController.getPickupLocations)
  .post(vehicleController.addPickupLocations);

router
  .route("/addUsersToVehicle/:id")
  .post(vehicleController.addUsersToVehicle);
router
  .route("/removeUserFromVehicle/:id")
  .post(vehicleController.removeUserFromVehicle);

router.route("/getVehicleUsers/:id").get(vehicleController.getVehicleUsers);

module.exports = router;
