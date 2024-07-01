const User = require("../models/userModel");
// const AppError = require('../utils/appError');
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
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
exports.getOrganisationVehicles = factory.getAll(Vehicle);

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
exports.getPickupLocations = catchAsync(async (req, res, next) => {
  const pickupLocations = await Vehicle.findById(req.params.vehicleId).select(
    "pickupLocations"
  );
  // const pickupLocations = vehicle.pickupLocations;
  res.status(200).json({
    status: "success",
    data: {
      pickupLocations,
    },
  });
});

exports.addPickupLocations = catchAsync(async (req, res, next) => {
  const vehicle = await Vehicle.findByIdAndUpdate(
    req.params.vehicleId,
    {
      $push: { pickupLocations: { $each: req.body.pickupLocations } },
    },
    { new: true }
  );
  const newPickupLocations = vehicle.pickupLocations;
  res.status(201).json({
    status: "success",
    data: {
      newPickupLocations,
    },
  });
});

exports.addUsersToVehicle = setTransaction(async (req, res, next, session) => {
  // Add users to vehicle's users list
  await addUsersToVehicle(req.params.id, req.body.userIds, session);
  res.status(201).json({
    status: "success",
    message: "Users added successfully",
  });
});

const addUsersToVehicle = async (vehicleId, userIds, session) => {
  // Add users to vehicle's users list
  const vehicle = await Vehicle.findByIdAndUpdate(
    vehicleId,
    { $addToSet: { users: { $each: userIds } } },
    { new: true, runValidators: true },
    { session }
  );

  // Bulk update user documents to add the vehicle to their vehicles list
  const bulkOps = userIds.map((userId) => ({
    updateOne: {
      filter: { _id: userId },
      update: { $addToSet: { vehicles: vehicleId } },
    },
  }));

  await User.bulkWrite(bulkOps, { session });

  return vehicle;
};
