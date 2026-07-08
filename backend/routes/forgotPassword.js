// routes/forgotPassword.js
import express    from "express";
import nodemailer from "nodemailer";
import bcrypt     from "bcryptjs";

// In-memory OTP store: { phone: { otp, email, expiresAt } }
const otpStore = {};

function createTransporter() {
 return nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
}

function maskEmail(email) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

        const otp       = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000;
        otpStore[phone] = { otp, email, expiresAt };
        console.log(`OTP for ${phone}: ${otp}`);

        try {
          const transporter = createTransporter();
          await transporter.sendMail({
            from:    `"Typing Website" <${process.env.EMAIL_USER}>`,
            to:      email,
            subject: "Your OTP for Password Reset",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f9f9;border-radius:12px;">
                <h2 style="color:#ff6b3d;">Password Reset OTP</h2>
                <p>Use the OTP below to reset your password. It expires in <strong>5 minutes</strong>.</p>
                <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;
                            padding:24px;background:#fff;border-radius:8px;margin:24px 0;color:#333;">
                  ${otp}
                </div>
                <p style="color:#888;font-size:13px;">If you didn't request this, ignore this email.</p>
              </div>
            `,
          });
          return res.json({ success: true, maskedEmail: maskEmail(email) });
        } catch (mailErr) {
  console.error("Email send error:", mailErr);
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
    if (!phone) return res.status(400).json({ message: "Phone required" });

    const record = otpStore[phone];
    if (!record) {
      return res.status(400).json({ message: "Session expired. Please start again." });
    }

    const otp       = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore[phone] = { otp, email: record.email, expiresAt };
    console.log(`Resend OTP for ${phone}: ${otp}`);

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from:    `"Typing Website" <${process.env.EMAIL_USER}>`,
        to:      record.email,
        subject: "Your New OTP for Password Reset",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f9f9;border-radius:12px;">
            <h2 style="color:#ff6b3d;">New OTP Requested</h2>
            <p>Your new OTP is below. It expires in <strong>5 minutes</strong>.</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;
                        padding:24px;background:#fff;border-radius:8px;margin:24px 0;color:#333;">
              ${otp}
            </div>
          </div>
        `,
      });
      return res.json({ success: true });
    } catch (mailErr) {
      console.error("Resend email error:", mailErr);
      return res.status(500).json({ message: "Failed to resend OTP email" });
    }
  });

  return router;
}
