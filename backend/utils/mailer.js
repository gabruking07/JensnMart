const createTransporter = () => {
  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      return null;
    }
    throw err;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER || process.env.MAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (!smtpUser || !smtpPass) {
    return null;
  }

  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

const sendOtpEmail = async ({ to, name, otp }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[OTP DEV MODE] Unable to send email to ${to}. OTP: ${otp}`);
    return { delivered: false, mode: "dev_console" };
  }

  const fromAddress =
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    "no-reply@jensnmart.local";

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "JensnMart Password Reset OTP",
    text: `Hello ${name || "User"}, your OTP for password reset is ${otp}. This code expires in 10 minutes.`,
    html: `
      <p>Hello ${name || "User"},</p>
      <p>Your OTP for password reset is:</p>
      <h2 style="letter-spacing:2px;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `
  });

  return { delivered: true, mode: "smtp" };
};

module.exports = { sendOtpEmail };
