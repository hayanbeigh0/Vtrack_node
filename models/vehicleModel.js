const mongoose = require("mongoose");
const { findByIdAndUpdate, findOne } = require("./userModel");

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vehicle name cannot be empty!"],
      unique: true,
      trim: true,
      maxlength: [
        20,
        "A vehicle name must have less or equal to 20 characters",
      ],
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
      unique: true,
      trim: true,
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
    active: { type: Boolean, default: true, select: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

vehicleSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
// vehicleSchema.index({ tour: 1, user: 1 }, { unique: true });

// vehicleSchema.pre(/^find/, function (next) {
//   // this.populate({
//   //   path: 'tour',
//   //   select: 'name',
//   // }).populate({
//   //   path: 'user',
//   //   select: 'name photo',
//   // });
//   this.populate({
//     path: "user",
//     select: "name photo",
//   });
//   next();
// });

// vehicleSchema.statics.calcAverageRatings = async function (tourId) {
//   const stats = await this.aggregate([
//     {
//       $match: { tour: tourId },
//     },
//     {
//       $group: {
//         _id: "$tour",
//         nRating: { $sum: 1 },
//         avgRating: { $avg: "$rating" },
//       },
//     },
//   ]);

//   if (stats.length > 0) {
//     await Tour.findByIdAndUpdate(tourId, {
//       ratingsQuantity: stats[0].nRating,
//       ratingsAverage: stats[0].avgRating,
//     });
//   } else {
//     await Tour.findByIdAndUpdate(tourId, {
//       ratingsQuantity: 0,
//       ratingsAverage: 4.5,
//     });
//   }
// };

// vehicleSchema.post("save", function () {
//   this.constructor.calcAverageRatings(this.tour);
// });

// vehicleSchema.pre(/findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   next();
// });

// vehicleSchema.post(/findOneAnd/, async function () {
//   // this.findOne() does not work here as the query has already executed.
//   await this.r.constructor.calcAverageRatings(this.r.tour);
// });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
