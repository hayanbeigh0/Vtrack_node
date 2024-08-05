const Invite = require("../models/inviteModel");
const { generateInviteToken } = require("../utils/token");
const { sendEmail } = require("../utils/email");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const Notification = require("../models/notificationModel");
const Organisation = require("../models/organisationModel");

exports.inviteUser = catchAsync(async (req, res) => {
  const { userId, organisationId, email } = req.body;

  // Fetch the organization details
  const organisation = await Organisation.findById(organisationId);
  if (!organisation) {
    return res.status(404).json({
      status: "fail",
      message: "Organisation not found",
    });
  }

  // Extract the organization name
  const organisationName = organisation.name;

  // Generate a token and expiration date
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expires in 24 hours

  // Create an invite document
  const invite = await Invite.create({
    email,
    organisation: organisationId,
    token,
    expiresAt,
  });

  const message = `You have been invited to join ${organisationName}.`;
  const subject = "Invitation to join our Organisation";

  // Create a notification for the user
  await Notification.create({
    user: userId,
    token: token,
    organisationId: organisationId,
    content: `${message}`,
    type: "invite",
    status: "active",
  });

  // Send the invitation email
  // await sendEmail(email, subject, message); // This should be done when the configuration is properly done

  res.status(200).json({
    status: "success",
    message: "Invitation sent successfully",
  });
});

exports.acceptInvite = catchAsync(async (req, res) => {
  const { token, organisationId, notificationId } = req.query;

  // Find the invite
  const invite = await Invite.findOne({
    token,
    organisation: organisationId,
    status: "pending",
  });

  if (!invite || invite.expiresAt < Date.now()) {
    return res.status(400).json({
      code: 100,
      status: "fail",
      message: "Invalid or expired invite token",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $addToSet: { organisations: organisationId } },
    { new: true, upsert: true }
  );

  await Notification.findByIdAndUpdate(notificationId, {
    status: "expired",
    readStatus: true,
  });

  // Update invite status
  invite.status = "accepted";
  await invite.save();

  res.status(200).json({
    status: "success",
    message: "Invitation accepted successfully",
    data: {
      user,
    },
  });
});
