const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const Organisation = require("../models/organisationModel");
const setTransaction = require("./transactionController");
// const organisationController = require("./organisationController");
const Vehicle = require("../models/vehicleModel");
const helpers = require("../utils/helper");

exports.fn = function () {
  console.log("this is the export functionx");
};

exports.deleteOne = (Model) => {
  // On each delete, if the references of the document also needs to be deleted,
  // then we will have to check if the document has a model/schema type which can have references of
  // its documents in the other models / schema's.
  return setTransaction(async (req, res, next, session) => {
    if (Model === Organisation) {
      // Here we know that the document of the Organisation model/schema can have references in the User model/schema also.
      await User.updateMany(
        {},
        { $pull: { organisations: req.params.id } },
        { session }
      );
      await Vehicle.updateMany(
        { organisation: req.params.id },
        { $unset: { organisation: "" } },
        { session }
      );
    }
    if (Model === Vehicle) {
      // Here we know that the document of the Vehicle model/schema can have references in the User model/schema also.
      await User.updateMany(
        {},
        { $pull: { vehicles: req.params.id } },
        { session }
      );
      await Organisation.updateMany(
        {},
        { $pull: { vehicles: req.params.id } },
        { session }
      );
    }
    if (Model === User) {
      // Here we know that the document of the User model/schema can have references in the User model/schema also.
      await Vehicle.updateMany(
        {},
        { $pull: { users: req.params.id } },
        { session }
      );
      await Organisation.updateMany(
        {},
        { $pull: { users: req.params.id } },
        { session }
      );
    }
    const doc = await Model.findByIdAndDelete(req.params.id, { session });
    if (!doc) {
      throw new Error("No document found with that ID");
    }
    res.status(204).json({
      data: null,
    });
  });
};

exports.updateOne = (Model) =>
  setTransaction(async (req, res, next, session) => {
    console.log(req.params.id);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    console.log(doc);
    if (Model === Organisation) {
      await helpers.updateVehiclesAndUser(
        doc,
        req.user.id,
        "org-admin",
        req.body.vehicles,
        session
      );
    }

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query; // doc.find({ _id: req.params.id });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on Tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { ...filter, tour: req.params.tourId };
    if (req.params.organisationId) {
      if (Model === User) {
        filter = {
          organisations: {
            $in: [mongoose.Types.ObjectId(req.params.organisationId)],
          },
        };
      }
      if (Model === Vehicle) {
        filter = {
          organisation: req.params.organisationId,
        };
      }
    }
    if (req.params.userId)
      filter = { ...filter, users: { $in: [req.params.userId] } };

    console.log("filter", filter);

    // BUILD THE QUERY
    let features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    console.log(features);

    // EXECUTE THE QUERY
    const data = await features.query;
    // console.log(data);

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: data.length,
      data: {
        data,
      },
    });
  });
