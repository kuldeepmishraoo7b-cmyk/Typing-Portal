// ================= ADMIN FORGOT PASSWORD ROUTES =================
// File: routes/adminForgotPassword.js
import express    from "express";
import nodemailer from "nodemailer";
import bcrypt     from "bcryptjs";

// In-memory OTP store: { username: { otp, expiry, verified, table } }
const adminOtpStore = {};

export default function (db) {
  const router = express.Router();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

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
          if (err) return res.status(500).json({ message: "Database error" });
          if (bossRows.length > 0) {
            const admin = bossRows[0];
            if (!admin.email) {
              return res.status(400).json({
                message: "No email found for this admin. Please contact system owner.",
              });
            }
            return sendOtp(admin.username, admin.email, "boss", res);
          }
          db.query(
            "SELECT username, email FROM admins WHERE username = ?",
            [username],
            (err2, adminRows) => {
              if (err2) return res.status(500).json({ message: "Database error" });
              if (adminRows.length === 0) {
                return res.status(404).json({ message: "Admin username not found" });
              }
              const admin = adminRows[0];
              if (!admin.email) {
                return res.status(400).json({
                  message: "No email found for this admin. Please contact system owner.",
                });
              }
              return sendOtp(admin.username, admin.email, "admins", res);
            }
          );
        }
      );
    } catch (err) {
      console.error("send-otp error:", err);
      res.status(500).json({ message: "Server error" });
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
    res.json({ message: "OTP verified successfully" });
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
    try {
      const hashed = await bcrypt.hash(newPassword, 10);
      const table  = record.table; // "boss" or "admins"
      db.query(
        `UPDATE ${table} SET password = ? WHERE username = ?`,
        [hashed, username],
        (err, result) => {
          if (err) {
            console.error("Password reset DB error:", err);
            return res.status(500).json({ message: "Database error during password reset" });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Admin not found" });
          }
          delete adminOtpStore[username];
          res.json({ success: true, message: "Password reset successfully! You can now login." });
        }
      );
    } catch (err) {
      console.error("reset-password error:", err);
      res.status(500).json({ message: "Server error during password reset" });
    }
  });

  // HELPER — Generate OTP, store it, send email
  async function sendOtp(username, email, table, res) {
    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;
    adminOtpStore[username] = { otp, expiry, verified: false, table };

    const [local, domain] = email.split("@");
    const maskedEmail = local.slice(0, 2) + "***@" + domain;

    try {
      await transporter.sendMail({
        from: `"Typing Website Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Admin Password Reset OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px;
                      border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333;">🔐 Admin Password Reset</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>Your OTP for password reset is:</p>
            <div style="font-size: 36px; font-weight: bold; color: #4CAF50;
                        letter-spacing: 8px; text-align: center; padding: 20px;
                        background: #f0f0f0; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p>⏳ This OTP is valid for <strong>10 minutes</strong>.</p>
            <p style="color: #888; font-size: 13px;">
              If you did not request this, please ignore this email.
            </p>
          </div>
        `,
      });
      res.json({ message: `OTP sent to ${maskedEmail}`, maskedEmail });
    } catch (mailErr) {
      console.error("Email send error:", mailErr);
      delete adminOtpStore[username];
      res.status(500).json({ message: "Failed to send OTP email. Check email config." });
    }
  }

  return router;
}
