const Organisation = require("../models/organisationModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
// const AppError = require('../utils/appError');
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const mongoose = require("mongoose");
const setTransaction = require("../controllers/transactionController");
const Vehicle = require("../models/vehicleModel");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getVehicles = factory.getAll(Vehicle);

exports.getVehicle = factory.getOne(Vehicle);
// exports.getVehicle = factory.getOne(Vehicle, { path: "owner" });
exports.updateVehicle = factory.updateOne(Vehicle);

exports.deleteVehicle = factory.deleteOne(Vehicle);
exports.createVehicle = factory.createOne(Vehicle);

exports.createVehicleForOrganisation = setTransaction(
  async (req, res, next, session) => {
    const userId = req.user.id;
    req.body.owner = req.user.id;
    req.body.createdBy = req.user.id;
    const docs = await Vehicle.create([req.body], { session });
    const doc = docs[0];
    let userUpdateObj = {};
    if (req.body.users) {
      userUpdateObj = {
        $addToSet: { vehicles: doc._id },
      };
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { ...userUpdateObj },
      { session }
    );

    if (!user) {
      throw new Error("User not found!");
    }
    req.user = user; // Pass the updated user to the next middleware

    return res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  }
);
