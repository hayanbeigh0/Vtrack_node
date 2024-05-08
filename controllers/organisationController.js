const Organisation = require("../models/organisationModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
// const AppError = require('../utils/appError');
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const mongoose = require("mongoose");

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
exports.updateOrganisation = (req, res, next) => {
  console.log(`Update organisations body: ${req.body}`)
  if (req.body.organisations) {
    req.body.organisations = {
      $push: { organisations: { $each: req.body.organisations } },
    };
  }
  return factory.updateOne(Organisation);
};

exports.deleteOrganisation = factory.deleteOne(Organisation);

exports.createOrganisation = (userRole) =>
  catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const userId = req.user.id;
      const user = await User.findByIdAndUpdate(
        userId,
        { role: userRole },
        { session }
      );

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user; // Pass the updated user to the next middleware
      req.body.owner = req.user.id;
      req.body.createdBy = req.user.id;
      const doc = await Organisation.create([req.body], { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      // Revert the user role change
      // await User.findByIdAndUpdate(userId, { role: "default" });
      return next(new AppError(e, 400));
    }
  });
