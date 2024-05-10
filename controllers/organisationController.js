const Organisation = require("../models/organisationModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
// const AppError = require('../utils/appError');
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const mongoose = require("mongoose");
const setTransaction = require("../controllers/transactionController");

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
    // req.user = user; // Pass the updated user to the next middleware
    req.body.owner = req.user.id;
    req.body.createdBy = req.user.id;
    const docs = await Organisation.create([req.body], { session });
    const doc = docs[0];
    let orgUpdateObj = {};
    let vehicleUpdateObj = {};
    if (doc._id) {
      orgUpdateObj = {
        $addToSet: { organisations: doc._id },
      };
    }
    if (req.body.vehicles) {
      vehicleUpdateObj = {
        $addToSet: { vehicles: { $each: req.body.vehicles } },
      };
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { role: userRole, ...orgUpdateObj, ...vehicleUpdateObj },
      { session }
    );

    if (!user) {
      throw new Error("User not found!");
    }

    return res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
