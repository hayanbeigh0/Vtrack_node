const mongoose = require("mongoose");
const { findByIdAndUpdate, findOne } = require("./userModel");

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Bus name cannot be empty!"],
    },
    driver: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    busNumber: {
      type: Number,
      required: [true, "Bus number cannot be empty!"],
    },
    route: {
      type: String,
      required: [true, "Bus route cannot be empty!"],
    },
    // rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
    organisation: {
      type: mongoose.Schema.ObjectId,
      ref: "Organisation",
    },
    users: {
      type: [mongoose.Schema.ObjectId],
      ref: "User",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

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
