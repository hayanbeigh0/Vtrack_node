const User = require("../models/userModel");
// const AppError = require('../utils/appError');
const catchAsync = require("../utils/catchAsync");
const factory = require("../controllers/handlerFactory");
const Organisation = require("../models/organisationModel");
const Notification = require("../models/notificationModel");

const filterObj = (obj, ...unAllowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (!unAllowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user posts passwords data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates! Please use /updatePassword to update your password.",
        400
      )
    );
  }
  let orgUpdateObj = {};
  let vehicleUpdateObj = {};
  if (req.body.organisations) {
    orgUpdateObj = {
      $addToSet: { organisations: { $each: req.body.organisations } },
    };
  }
  if (req.body.vehicles) {
    vehicleUpdateObj = {
      $addToSet: { organisations: { $each: req.body.organisations } },
    };
  }
  // 2) Filter out the properties that are not allowed to update
  const filteredBody = filterObj(
    req.body,
    "name",
    "email",
    "accessToken",
    "organisations",
    "vehicles"
  );
  // 3) Update the user data
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { ...filteredBody, ...orgUpdateObj, ...vehicleUpdateObj },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "fail",
    message: "This route is not yet defined! Please use /signup instead.",
  });
};

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = catchAsync(async (req, res, next) => {
  // 1) Get the user document with populated organisations
  let user = await User.findById(req.user.id).populate({
    path: "organisations",
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  // 2) Calculate userCount and vehicleCount for each organisation
  const populatedOrganisations = await Promise.all(
    user.organisations.map(async (org) => {
      const userCount = await User.countDocuments({ organisations: org._id });
      const vehicleCount = org.vehicles.length;

      return {
        ...org.toObject(),
        userCount,
        vehicleCount,
      };
    })
  );

  // 3) Replace organisations in user object with populated organisations
  user.organisations = populatedOrganisations;

  // Convert the Mongoose document to a plain JavaScript object
  let userObj = user.toObject({ virtuals: true });

  // Manually set the populated organisations in the serialized user object
  userObj.organisations = populatedOrganisations;
  userObj._id = user.id;

  // 4) Get unread notifications count
  const unreadNotificationsCount = await Notification.countDocuments({
    user: req.user.id,
    readStatus: false,
  });

  // 5) Add unreadNotificationsCount to the user object
  userObj.unreadNotificationsCount = unreadNotificationsCount;

  // 6) Return the user object
  res.status(200).json({
    status: "success",
    data: {
      data: userObj, // Include the modified user object
    },
  });
});

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.searchUser = catchAsync(async (req, res) => {
  const { name, role, organisationId } = req.query;
  console.log(name, role, organisationId);

  const searchCriteria = {
    ...(name && { name: { $regex: new RegExp(name, "i") } }),
    // ...(role && { role: role }),
    ...(organisationId && { organisations: organisationId }),
  };

  const users = await User.find(searchCriteria).populate("organisations");
  if (users) {
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } else {
    res.status(200).json({
      status: "fail",
      results: 0,
      data: {
        users: [],
      },
    });
  }
});

exports.removeUserOrganisation = catchAsync(async (req, res, next) => {
  const { organisationId, userId } = req.params;

  if (!organisationId || !userId) {
    return res.status(400).json({
      status: "fail",
      message: "No user/organisation id provided!",
    });
  }

  // Find the organisation and populate the owner field to check ownership
  const organisation =
    await Organisation.findById(organisationId).populate("owner");
  if (!organisation) {
    return res.status(404).json({
      status: "fail",
      message: "Organisation not found!",
    });
  }

  // Check if the user is the owner of the organisation
  if (organisation.owner._id.toString() === userId) {
    return res.status(403).json({
      status: "fail",
      errorCode: "0001", // This code suggests that the user is the owner of the organisation and can't be removed.
      message: "You cannot remove yourself from the organisation that you own!",
    });
  }

  // Remove the organisation from the user's organisations array
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { organisations: organisationId } },
    { new: true } // Return the updated document
  );

  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "User not found!",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Organisation removed from user!",
  });
});
