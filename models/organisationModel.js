const mongoose = require("mongoose");
const User = require("./userModel");
const Vehicle = require("./vehicleModel");

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
        "An organisation address must have less or equal to 50 characters",
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
        "An organisation code must have greater or equal to 2 characters",
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
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

organisationSchema.methods.getUserCount = async function () {
  const countResult = await User.aggregate([
    { $match: { organisations: this._id } },
    { $count: "count" },
  ]);
  return countResult.length ? countResult[0].count : 0;
};

organisationSchema.virtual("vehicleCount").get(function () {
  return this.vehicles.length;
});

organisationSchema.index({ name: 1, vehicles: 1 });

organisationSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }); // This will not return any organisation which has "active" set to false.
  next();
});

const Organisation = mongoose.model("Organisation", organisationSchema);

module.exports = Organisation;
