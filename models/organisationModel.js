const mongoose = require("mongoose");
const { findByIdAndUpdate, findOne } = require("./userModel");

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
