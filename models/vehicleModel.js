const mongoose = require("mongoose");

function transformSchema(doc, ret) {
  // Transform top-level properties
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;

  // Transform nested pickupLocations
  if (ret.pickupLocations && Array.isArray(ret.pickupLocations)) {
    ret.pickupLocations = ret.pickupLocations.map((location) => {
      location.id = location._id;
      delete location._id;
      return location;
    });
  }

  return ret;
}

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vehicle name cannot be empty!"],
      trim: true,
      maxlength: [
        20,
        "A vehicle name must have less or equal to 20 characters",
      ],
    },
    capacity: {
      type: Number,
      required: [true, "Vehicle capacity cannot be empty!"],
    },
    driver: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      unique: true,
      trim: true,
    },
    vehicleNumber: {
      type: Number,
      required: [true, "Vehicle number cannot be empty!"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    route: {
      type: String,
      required: [true, "Vehicle route cannot be empty!"],
    },
    createdAt: { type: Date, default: Date.now },
    organisation: {
      type: mongoose.Schema.ObjectId,
      ref: "Organisation",
    },
    users: {
      type: [mongoose.Schema.ObjectId],
      ref: "User",
    },
    pickupLocations: [
      {
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
    ],
    active: { type: Boolean, default: true, select: false },
  },
  {
    toJSON: {
      virtuals: true,
      transform: transformSchema,
    },
    toObject: {
      virtuals: true,
      transform: transformSchema,
    },
  }
);

vehicleSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

vehicleSchema.index({ organisation: 1 });
vehicleSchema.index({ pickupLocations: 1 });
vehicleSchema.index({ organisation: 1, vehicleNumber: 1 }, { unique: true });
vehicleSchema.index({ name: 1, organisation: 1 }, { unique: true });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
