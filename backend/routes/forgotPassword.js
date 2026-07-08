// routes/forgotPassword.js
import express from "express";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "../utils/sendEmail.js";

// In-memory OTP store: { phone: { otp, email, expiresAt, verified } }
const otpStore = {};

function maskEmail(email) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOtp(phone, email) {
  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore[phone] = { otp, email, expiresAt, verified: false };
  return otp;
}

export default function (db) {
  const router = express.Router();

  // POST /api/forgot-password/send-otp
  router.post("/send-otp", async (req, res) => {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit phone number" });
    }

    db.query(
      "SELECT id, email FROM students WHERE phone = ?",
      [phone],
      async (err, rows) => {
        if (err) {
          console.error("DB error on send-otp:", err);
          return res.status(500).json({ message: "Database error" });
        }

        if (!rows.length) {
          return res.status(404).json({ message: "No account found with this phone number" });
        }

        const email = rows[0].email;
        if (!email) {
          return res.status(400).json({ message: "No email linked to this account" });
        }

        const otp = storeOtp(phone, email);
        console.log(`Student OTP for ${phone}: ${otp}`);

        try {
          await sendOtpEmail(email, "Your OTP for Password Reset", otp, {
            senderName: "Typing Website",
            heading: "Password Reset OTP",
            message: "Use this OTP to reset your password.",
            validity: "5 minutes",
          });

          return res.json({ success: true, maskedEmail: maskEmail(email) });
        } catch (mailErr) {
          console.error("Student OTP email error:", mailErr.message || mailErr);
          delete otpStore[phone];
          return res.status(500).json({
            message: mailErr.message || "Failed to send OTP email",
          });
        }
      }
    );
  });

  // POST /api/forgot-password/verify-otp
  router.post("/verify-otp", (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const record = otpStore[phone];
    if (!record) {
      return res.status(400).json({ message: "No OTP found for this phone. Request a new one." });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[phone];
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    otpStore[phone].verified = true;
    return res.json({ success: true });
  });

  // POST /api/forgot-password/reset
  router.post("/reset", async (req, res) => {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const record = otpStore[phone];
    if (!record || !record.verified) {
      return res.status(400).json({ message: "OTP not verified. Please verify first." });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[phone];
      return res.status(400).json({ message: "OTP expired. Start over." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE students SET password = ? WHERE phone = ?",
        [hashedPassword, phone],
        (err, result) => {
          if (err) {
            console.error("DB error on reset:", err);
            return res.status(500).json({ message: "Database error while resetting password" });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found" });
          }

          delete otpStore[phone];
          return res.json({ success: true, message: "Password reset successfully" });
        }
      );
    } catch (err) {
      console.error("Bcrypt error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // POST /api/forgot-password/resend-otp
  router.post("/resend-otp", async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone required" });
    }

    const record = otpStore[phone];
    if (!record) {
      return res.status(400).json({ message: "Session expired. Please start again." });
    }

    const otp = storeOtp(phone, record.email);
    console.log(`Student resend OTP for ${phone}: ${otp}`);

    try {
      await sendOtpEmail(record.email, "Your New OTP for Password Reset", otp, {
        senderName: "Typing Website",
        heading: "New OTP Requested",
        message: "Use this new OTP to reset your password.",
        validity: "5 minutes",
      });

      return res.json({ success: true, maskedEmail: maskEmail(record.email) });
    } catch (mailErr) {
      console.error("Student resend OTP email error:", mailErr.message || mailErr);
      return res.status(500).json({ message: mailErr.message || "Failed to resend OTP email" });
    }
  });

  return router;
}
