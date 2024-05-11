const express = require("express");

const organisationController = require("../controllers/organisationController");
const authController = require("../controllers/authController");
const factory = require("../controllers/handlerFactory");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .post(
    organisationController.createOrganisation("org-admin")
  )
  .get(organisationController.getOrganisations);
router
  .route("/:id")
  .get(organisationController.getOrganisation)
  .delete(
    authController.restrictTo("org-admin"),
    organisationController.deleteOrganisation
  )
  .patch(
    authController.restrictTo("org-admin"),
    organisationController.updateOrganisation
  );

module.exports = router;
