const Invite = require("../models/inviteModel");
const { generateInviteToken } = require("../utils/token");
const { sendEmail } = require("../utils/email");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const Notification = require("../models/notificationModel");

exports.inviteUser = catchAsync(async (req, res) => {
  const { userId, organisationId, email } = req.body;

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

  const inviteLink = `http://localhost:${process.env.PORT}/invite/accept?token=${token}&organisationId=${organisationId}`;
  const message = `You have been invited to join our organisation. Click the link to accept the invitation: ${inviteLink}`;
  const subject = "Invitation to join our Organisation";

  // Create a notification for the user
  await Notification.create({
    user: userId,
    content: `${message}`,
    type: "invite",
  });

  // Send the invitation email
  // await sendEmail(email, subject, message); // This should be done when the configuration is properly done

  res.status(200).json({
    status: "success",
    message: "Invitation sent successfully",
  });
});

exports.acceptInvite = catchAsync(async (req, res) => {
  const { token, organisationId } = req.query;

  // Find the invite
  const invite = await Invite.findOne({
    token,
    organisation: organisationId,
    status: "pending",
  });

  if (!invite || invite.expiresAt < Date.now()) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid or expired invite token",
    });
  }

  // Create a new user or update existing user to join the organisation
  const user = await User.findOneAndUpdate(
    { email: invite.email },
    { $addToSet: { organisations: organisationId } },
    { new: true, upsert: true }
  );

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
