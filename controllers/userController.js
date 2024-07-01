const User = require("../models/userModel");
// const AppError = require('../utils/appError');
const catchAsync = require("../utils/catchAsync");
const factory = require("../controllers/handlerFactory");

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
exports.getUser = factory.getOne(User, {
  path: "organisations",
  select: "name", // Only include the name field
});
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.searchUser = catchAsync(async (req, res) => {
  const { name, role } = req.query;
  const users = await User.find({
    name: { $regex: new RegExp(name, "i") },
    role: role, // Case insensitive search
  }).populate("organisations");
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
