const mongoose = require("mongoose");

const pickupLocationSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Location name cannot be empty!"],
    trim: true,
  },
  location: {
    // GeoJSON
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
    required: [true, "Location cannot be empty!"],
  },
  active: { type: Boolean, default: true, select: false },
});

const PickupLocation = mongoose.model("PickupLocation", pickupLocationSchema);

module.exports = PickupLocation;
