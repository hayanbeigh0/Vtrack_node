const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const inviteSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    organisation: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Invite = mongoose.model("Invite", inviteSchema);
module.exports = Invite;
