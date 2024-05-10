const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const Organisation = require("../models/organisationModel");
const { setTransaction } = require("./transactionController");

exports.deleteOne = (Model) => {
  return setTransaction(async (req, res, next, session) => {
    if (Model === Organisation) {
      await User.updateMany(
        {},
        { $pull: { organisations: req.params.id } },
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
  catchAsync(async (req, res, next) => {
    console.log(req.body);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // BUILD THE QUERY
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // EXECUTE THE QUERY
    const data = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: data.length,
      data: {
        data,
      },
    });
  });

exports.startSessionMiddleware = async (req, res, next) => {
  req.locals = req.locals || {};
  req.locals.session = await mongoose.startSession();
  req.locals.session.startTransaction();
  next();
};

exports.getSessionMiddleware = (req, res, next) => {
  if (!req.locals || !req.locals.session) {
    return res.status(500).json({ message: "Session not found" });
  }
  req.session = req.locals.session;
  next();
};
