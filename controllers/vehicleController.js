const User = require("../models/userModel");
// const AppError = require('../utils/appError');
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const setTransaction = require("../controllers/transactionController");
const Vehicle = require("../models/vehicleModel");
const Organisation = require("../models/organisationModel");
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

exports.getVehicles = factory.getAll(Vehicle);
// exports.getOrganisationVehicles = factory.getAll(Vehicle);

exports.getVehicle = factory.getOne(Vehicle);
// exports.getVehicle = factory.getOne(Vehicle, { path: "owner" });
exports.updateVehicle = factory.updateOne(Vehicle);

exports.deleteVehicle = factory.deleteOne(Vehicle);
exports.createVehicle = factory.createOne(Vehicle);

exports.createVehicleForOrganisation = setTransaction(
  async (req, res, next, session) => {
    console.log(req.body);
    const userId = req.user.id;
    req.body.owner = req.user.id;
    req.body.createdBy = req.user.id;

    // Create the vehicle document
    const docs = await Vehicle.create([req.body], { session });
    const doc = docs[0];

    // Update the Organisation with the new vehicle
    if (doc.organisation) {
      await Organisation.findByIdAndUpdate(
        doc.organisation,
        { $addToSet: { vehicles: doc._id } },
        { session }
      );
    }

    let userUpdateObj = {};
    if (req.body.users) {
      userUpdateObj = {
        $addToSet: { vehicles: doc._id },
      };
    }

    // Update the user with the new vehicle ID
    let user = await User.findByIdAndUpdate(
      userId,
      { ...userUpdateObj },
      { session }
    );

    if (!user) {
      throw new Error("User not found!");
    }

    // Populate the 'users' field in the Vehicle document
    const populatedDoc = await doc
      .populate({
        path: "users",
        populate: { path: "organisations" }, // Deep populate organisations in each User
      })
      .execPopulate();

    req.user = user; // Pass the updated user to the next middleware

    return res.status(201).json({
      status: "success",
      data: {
        data: populatedDoc,
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
  try {
    // Add users to vehicle's users list
    await addUsersToVehicle(req.params.id, req.body.userIds, session);
    res.status(201).json({
      status: "success",
      message: "Users added successfully",
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
});

const addUsersToVehicle = async (vehicleId, userIds, session) => {
  // Add users to vehicle's users list
  const vehicle = await Vehicle.findByIdAndUpdate(
    vehicleId,
    { $addToSet: { users: { $each: userIds } } },
    { new: true, runValidators: true, session } // <-- session included here
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

exports.removeUserFromVehicle = setTransaction(
  async (req, res, next, session) => {
    try {
      // Remove a user from vehicle's users list
      await removeUserFromVehicle(req.params.id, req.body.userId, session);
      res.status(200).json({
        status: "success",
        message: "User removed successfully",
      });
    } catch (err) {
      next(new AppError(err.message, 400));
    }
  }
);

const removeUserFromVehicle = async (vehicleId, userId, session) => {
  // Remove the user from the vehicle's users list
  const vehicle = await Vehicle.findByIdAndUpdate(
    vehicleId,
    { $pull: { users: userId } },
    { new: true, runValidators: true, session } // <-- Correct session inclusion
  );

  // Update the user document to remove the vehicle from their vehicles list
  await User.findByIdAndUpdate(
    userId,
    { $pull: { vehicles: vehicleId } },
    { session }
  );

  return vehicle;
};

exports.getVehicleUsers = catchAsync(async (req, res, next) => {
  // Find the vehicle by ID and populate only the users field
  const vehicle = await Vehicle.findById(req.params.id)
    .select("users") // Select only the 'users' field
    .populate({
      path: "users",
      select: "id name email", // Select only 'id', 'name', and 'email' fields from users
    });

  // Send the response
  res.status(200).json({
    status: "success",
    data: {
      users: vehicle.users, // Send only the users in the response
    },
  });
});

async function getVehiclesByOrganisation(organisationId) {
  const vehicles = await Vehicle.aggregate([
    {
      $match: {
        organisation: mongoose.Types.ObjectId(organisationId), // Match vehicles by organisation ID
      },
    },
    {
      $lookup: {
        from: "users", // The name of the User collection
        localField: "driver", // The field in the Vehicle collection
        foreignField: "_id", // The field in the User collection
        as: "driverDetails", // The name of the new array field
      },
    },
    {
      $unwind: {
        path: "$driverDetails", // Unwind the driverDetails array to get a single document
        preserveNullAndEmptyArrays: true, // Keep vehicles even if they don't have a driver
      },
    },
    {
      $project: {
        id: "$_id", // Transform _id to id
        _id: 0, // Exclude the original _id
        name: 1,
        capacity: 1,
        driver: {
          id: "$driverDetails._id", // Populate the driver's _id
          name: "$driverDetails.name", // Populate the driver's name
          email: "$driverDetails.email", // Populate the driver's email
        },
        vehicleNumber: 1,
        owner: 1,
        createdBy: 1,
        route: 1,
        createdAt: 1,
        organisation: 1,
        pickupLocations: 1,
        userCount: { $size: "$users" }, // Count the number of users
      },
    },
  ]);

  return vehicles;
}

exports.getOrganisationVehicles = catchAsync(async (req, res, next) => {
  const organisationId = req.params.organisationId;
  const vehicles = await getVehiclesByOrganisation(organisationId);

  if (!vehicles || vehicles.length === 0) {
    return next(new AppError("No vehicles found for this organisation", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      vehicles,
    },
  });
});
