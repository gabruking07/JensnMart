/** Shared backend helpers for notification service; keeps reusable service behavior outside the route handlers. */

const Notification = require("../models/Notification");
const Admin = require("../models/Admin");
const Vendor = require("../models/Vendor");
const { sendNotificationEmail } = require("./mailer");

/** Stores an in-app notification addressed to one admin or vendor. */
const createNotification = async ({
  recipientModel,
  recipient,
  type = "system",
  title,
  message,
  meta = {},
}) => {
  if (!recipientModel || !recipient || !title || !message) return null;

  return Notification.create({
    recipientModel,
    recipient,
    type,
    title,
    message,
    meta,
  });
};

/** Creates a vendor notification and optionally emails the vendor about the same event. */
const notifyVendor = async ({ vendorId, type, title, message, meta = {}, sendEmail = true }) => {
  if (!vendorId) return;

  await createNotification({
    recipientModel: "Vendor",
    recipient: vendorId,
    type,
    title,
    message,
    meta,
  });

  if (!sendEmail) return;

  const vendor = await Vendor.findById(vendorId).select("email name");
  if (!vendor?.email) return;

  try {
    await sendNotificationEmail({
      to: vendor.email,
      subject: `JensnMart: ${title}`,
      title,
      message,
    });
  } catch (err) {
    console.error("VENDOR NOTIFICATION EMAIL ERROR:", err.message);
  }
};

/** Creates a notification for approved administrators and optionally emails them. */
const notifyAdmins = async ({ type, title, message, meta = {}, sendEmail = false }) => {
  const admins = await Admin.find({
    role: { $in: ["admin", "manager"] },
    approved: true,
  }).select("_id email");

  if (!admins.length) return;

  await Notification.insertMany(
    admins.map((admin) => ({
      recipientModel: "Admin",
      recipient: admin._id,
      type,
      title,
      message,
      meta,
    }))
  );

  if (!sendEmail) return;

  await Promise.all(
    admins
      .filter((admin) => admin.email)
      .map(async (admin) => {
        try {
          await sendNotificationEmail({
            to: admin.email,
            subject: `JensnMart: ${title}`,
            title,
            message,
          });
        } catch (err) {
          console.error("ADMIN NOTIFICATION EMAIL ERROR:", err.message);
        }
      })
  );
};

module.exports = {
  createNotification,
  notifyVendor,
  notifyAdmins,
};