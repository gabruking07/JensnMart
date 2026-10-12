<<<<<<< HEAD
/** Express API endpoints for contact routes; handlers connect HTTP requests to authorization, database operations, and JSON responses. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const express = require("express");
const router = express.Router();

const ContactMessage = require("../models/ContactMessage");
const { notifyAdmins } = require("../utils/notificationService");
const { sendNotificationEmail } = require("../utils/mailer");

<<<<<<< HEAD
// POST /: Validates and saves a customer message from the public contact form.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const savedMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    const title = `Contact form: ${subject || "General enquiry"}`;
    const adminMessage = `${name} (${email}) submitted a new contact request.${subject ? ` Subject: ${subject}.` : ""}`;

    await notifyAdmins({
      type: "system",
      title,
      message: adminMessage,
      meta: {
        status: "contact-message",
      },
      sendEmail: true,
    });

    try {
      await sendNotificationEmail({
        to: email,
        subject: "JensnMart: We received your message",
        title: "Thanks for contacting JensnMart",
        message: "Your message has been received by our team. We will review it and get back to you soon.",
        details: [
          { label: "Name", value: name },
          { label: "Email", value: email },
          { label: "Subject", value: subject || "General enquiry" },
          { label: "Message", value: message },
        ],
      });
    } catch (err) {
      console.error("CONTACT ACK EMAIL ERROR:", err.message);
    }

    res.status(201).json({
      message: "Your message has been sent successfully.",
      id: savedMessage._id,
    });
  } catch (err) {
    console.error("CONTACT FORM ERROR:", err);
    res.status(500).json({ message: "Failed to send your message" });
  }
});

module.exports = router;
