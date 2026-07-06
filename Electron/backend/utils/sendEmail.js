const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // your Gmail address
    pass: process.env.EMAIL_PASS,   // your Gmail App Password
  },
});

/**
 * Sends an OTP email to the given address.
 * @param {string} toEmail  - recipient email
 * @param {string} otp      - 6-digit OTP code
 */
async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: `"Typing Website" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px;
                  border: 1px solid #e5e5e5; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #ff6b3d; margin-bottom: 8px;">Password Reset</h2>
        <p style="color: #555; font-size: 15px;">
          Use the OTP below to reset your password. It is valid for <strong>5 minutes</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 10px;
                       color: #111; background: #f5f5f5; padding: 16px 28px;
                       border-radius: 10px; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="color: #999; font-size: 13px;">
          If you did not request this, please ignore this email.
          Your account is safe.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">
          &copy; Typing Website
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
