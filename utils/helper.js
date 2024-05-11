const User = require("../models/userModel");
const Vehicle = require("../models/vehicleModel");

exports.updateVehiclesAndUser = async (
  doc,
  userId,
  userRole,
  vehicleIds,
  session
) => {
  let updateObj = {};
  console.log(doc);
  if (doc._id) {
    updateObj = {
      $addToSet: { organisations: doc._id },
    };
    if (vehicleIds) {
      Object.assign(updateObj.$addToSet, {
        vehicles: { $each: vehicleIds },
      });

      const vehicleOrganisationUpdateObj = {
        $set: { organisation: doc._id },
      };
      const vehicles = await Vehicle.updateMany(
        { _id: { $in: vehicleIds } },
        vehicleOrganisationUpdateObj,
        { session }
      );

      // if (vehicles.nModified !== vehicleIds.length) {
      //   throw new Error("Invalid vehicle Id!");
      // }
    }
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { ...updateObj, role: userRole },
    { session }
  );

  if (!user) {
    throw new Error("User not found!");
  }

  return user;
};
