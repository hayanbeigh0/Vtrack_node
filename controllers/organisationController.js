const Organisation = require("../models/organisationModel");
const factory = require("../controllers/handlerFactory");
const setTransaction = require("../controllers/transactionController");
const helpers = require("../utils/helper");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getOrganisations = factory.getAll(Organisation);

exports.getOrganisation = factory.getOne(Organisation);
// exports.getOrganisation = factory.getOne(Organisation, { path: "owner" });
exports.updateOrganisation = factory.updateOne(Organisation);

exports.deleteOrganisation = factory.deleteOne(Organisation);

exports.createOrganisation = (userRole) =>
  setTransaction(async (req, res, next, session) => {
    const userId = req.user.id;
    req.body.owner = req.user.id;
    req.body.createdBy = req.user.id;

    console.log("reached here...");
    const docs = await Organisation.create([req.body], { session });
    const doc = docs[0];
    if (req.body.vehicles) {
      req.user = await helpers.updateVehiclesAndUser(
        doc,
        userId,
        userRole,
        req.body.vehicles,
        session
      ); // Pass the updated user to the next middleware
    }

    return res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
