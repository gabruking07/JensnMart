const fs = require("fs");

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
    console.log(`Unable to send email to ${to}. OTP: ${otp}`);
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

const sendNotificationEmail = async ({
  to,
  subject,
  title,
  message,
  imageUrl = "",
  imageAlt = "",
  imagePath = "",
  details = [],
}) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`Email to ${to}: ${subject} | ${message}`);
    return { delivered: false, mode: "dev_console" };
  }

  const fromAddress =
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    "no-reply@jensnmart.local";

  const hasInlineImage = Boolean(imagePath && fs.existsSync(imagePath));
  const inlineCid = hasInlineImage ? `product-image-${Date.now()}@jensnmart` : "";
  const detailRows = Array.isArray(details)
    ? details.filter((detail) => detail?.label && detail?.value !== undefined && detail?.value !== null && detail?.value !== "")
    : [];

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text: `${title}\n\n${message}${detailRows.length
      ? `\n\n${detailRows.map((detail) => `${detail.label}: ${detail.value}`).join("\n")}`
      : ""}`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a;max-width:560px;">
        <p style="margin:0 0 10px;font-size:22px;font-weight:800;">${title}</p>
        <p style="margin:0 0 18px;line-height:1.6;color:#334155;">${message}</p>
        ${(detailRows.length || hasInlineImage || imageUrl)
          ? `<div style="margin-top:8px;">
              ${(hasInlineImage || imageUrl)
                ? `<div style="margin-bottom:${detailRows.length ? "14px" : "0"};padding:10px;border:1px solid #e2e8f0;border-radius:16px;background:linear-gradient(180deg,#ffffff,#f8fafc);text-align:center;">
                    <img src="${hasInlineImage ? `cid:${inlineCid}` : imageUrl}" alt="${imageAlt || title}" style="max-width:220px;width:100%;height:auto;margin:0 auto;border-radius:12px;display:block;" />
                  </div>`
                : ""}
              ${detailRows.length
                ? `<div style="padding:14px 16px;border:1px solid #e2e8f0;border-radius:16px;background:linear-gradient(180deg,#ffffff,#f8fafc);">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Product details</p>
                    ${detailRows
                      .map(
                        (detail) => `
                          <div style="display:flex;justify-content:space-between;gap:14px;padding:8px 0;border-top:${detailRows[0] === detail ? "none" : "1px solid #edf2f7"};">
                            <span style="color:#64748b;font-size:13px;font-weight:700;">${detail.label}</span>
                            <span style="color:#0f172a;font-size:13px;font-weight:800;text-align:right;">${detail.value}</span>
                          </div>`
                      )
                      .join("")}
                  </div>`
                : ""}
            </div>`
          : ""}
      </div>
    `,
    attachments: hasInlineImage
      ? [
          {
            filename: imagePath.split(/[\\/]/).pop(),
            path: imagePath,
            cid: inlineCid,
          },
        ]
      : [],
  });

  return { delivered: true, mode: "smtp" };
};

module.exports = { sendOtpEmail, sendNotificationEmail };
