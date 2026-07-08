// routes/adminForgotPassword.js
import express from "express";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "../utils/sendEmail.js";

// In-memory OTP store: { username: { otp, expiry, verified, table } }
const adminOtpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

export default function (db) {
  const router = express.Router();

  // STEP 1 — POST /api/admin-forgot-password/send-otp
  router.post("/send-otp", async (req, res) => {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    try {
      db.query(
        "SELECT username, email FROM boss WHERE username = ?",
        [username],
        (err, bossRows) => {
          if (err) {
            console.error("Boss lookup error:", err);
            return res.status(500).json({ message: "Database error" });
          }

          if (bossRows.length > 0) {
            const admin = bossRows[0];
            if (!admin.email) {
              return res.status(400).json({
                message: "No email found for this admin. Please contact system owner.",
              });
            }
            return sendAdminOtp(admin.username, admin.email, "boss", res);
          }

          db.query(
            "SELECT username, email FROM admins WHERE username = ?",
            [username],
            (err2, adminRows) => {
              if (err2) {
                console.error("Admin lookup error:", err2);
                return res.status(500).json({ message: "Database error" });
              }

              if (adminRows.length === 0) {
                return res.status(404).json({ message: "Admin username not found" });
              }

              const admin = adminRows[0];
              if (!admin.email) {
                return res.status(400).json({
                  message: "No email found for this admin. Please contact system owner.",
                });
              }

              return sendAdminOtp(admin.username, admin.email, "admins", res);
            }
          );
        }
      );
    } catch (err) {
      console.error("Admin send-otp error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // STEP 2 — POST /api/admin-forgot-password/verify-otp
  router.post("/verify-otp", (req, res) => {
    const { username, otp } = req.body;

    if (!username || !otp) {
      return res.status(400).json({ message: "Username and OTP are required" });
    }

    const record = adminOtpStore[username];
    if (!record) {
      return res.status(400).json({ message: "OTP not requested or already used" });
    }

    if (Date.now() > record.expiry) {
      delete adminOtpStore[username];
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    adminOtpStore[username].verified = true;
    return res.json({ success: true, message: "OTP verified successfully" });
  });

  // STEP 3 — POST /api/admin-forgot-password/reset-password
  router.post("/reset-password", async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ message: "Username and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const record = adminOtpStore[username];
    if (!record || !record.verified) {
      return res.status(400).json({
        message: "OTP not verified. Please complete OTP verification first.",
      });
    }

    if (Date.now() > record.expiry) {
      delete adminOtpStore[username];
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    try {
      const hashed = await bcrypt.hash(newPassword, 10);
      const table = record.table === "boss" ? "boss" : "admins";

      db.query(
        `UPDATE ${table} SET password = ? WHERE username = ?`,
        [hashed, username],
        (err, result) => {
          if (err) {
            console.error("Admin password reset DB error:", err);
            return res.status(500).json({ message: "Database error during password reset" });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Admin not found" });
          }

          delete adminOtpStore[username];
          return res.json({ success: true, message: "Password reset successfully! You can now login." });
        }
      );
    } catch (err) {
      console.error("Admin reset-password error:", err);
      return res.status(500).json({ message: "Server error during password reset" });
    }
  });

  async function sendAdminOtp(username, email, table, res) {
    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000;
    adminOtpStore[username] = { otp, expiry, verified: false, table };

    console.log(`Admin OTP for ${username}: ${otp}`);

    try {
      await sendOtpEmail(email, "Admin Password Reset OTP", otp, {
        senderName: "Typing Website Admin",
        heading: "Admin Password Reset OTP",
        message: "Use this OTP to reset your admin password.",
        validity: "10 minutes",
        greeting: `Hello <strong>${username}</strong>,`,
      });

      return res.json({ success: true, message: `OTP sent to ${maskEmail(email)}`, maskedEmail: maskEmail(email) });
    } catch (mailErr) {
      console.error("Admin OTP email error:", mailErr.message || mailErr);
      delete adminOtpStore[username];
      return res.status(500).json({ message: mailErr.message || "Failed to send OTP email" });
    }
  }

  return router;
}
