const mongoose = require("mongoose");
const { findByIdAndUpdate, findOne } = require("./userModel");

const organisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organisation name cannot be empty!"],
    },
    createdAt: { type: Date, default: Date.now },
    buses: {
      type: [mongoose.Schema.ObjectId],
      ref: "Bus",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

organisationSchema.index({ name: 1, buses: 1 });

// organisationSchema.index({ tour: 1, user: 1 }, { unique: true });

// organisationSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "user",
//     select: "name photo",
//   });
//   next();
// });

// organisationSchema.statics.calcAverageRatings = async function (tourId) {
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

// organisationSchema.post("save", function () {
//   this.constructor.calcAverageRatings(this.tour);
// });

// organisationSchema.pre(/findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   next();
// });

// organisationSchema.post(/findOneAnd/, async function () {
//   // this.findOne() does not work here as the query has already executed.
//   await this.r.constructor.calcAverageRatings(this.r.tour);
// });

const Organisation = mongoose.model("Organisation", organisationSchema);

module.exports = Organisation;
