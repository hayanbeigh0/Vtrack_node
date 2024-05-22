const mongoose = require("mongoose");
const { findByIdAndUpdate, findOne } = require("./userModel");
const User = require("./userModel");

const organisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organisation name cannot be empty!"],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "An organisation must have an owner!"],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "An organisation must have a creator!"],
    },
    address: {
      type: String,
      required: [true, "Organisation address cannot be empty!"],
      trim: true,
      maxlength: [
        50,
        "An organisation code must have less or equal to 50 characters",
      ],
    },
    code: {
      type: String,
      required: [true, "Organisation code cannot be empty!"],
      unique: true,
      trim: true,
      maxlength: [
        20,
        "An organisation code must have less or equal to 20 characters",
      ],
      minlength: [
        2,
        "A organisation code must have greater or equal to 4 characters",
      ],
    },
    createdAt: { type: Date, default: Date.now },
    vehicles: {
      type: [mongoose.Schema.ObjectId],
      ref: "Vehicle",
    },
    location: {
      // GeoJSON
      name: {
        type: String,
        trim: true,
      },
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
      address: String,
      description: String,
    },
    active: { type: Boolean, default: true, select: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

organisationSchema.index({ name: 1, buses: 1 });

organisationSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }); // This will not return any organisation which has "active" set to false.
  next();
});

const Organisation = mongoose.model("Organisation", organisationSchema);

module.exports = Organisation;
