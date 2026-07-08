import axios from "axios";

function getSenderEmail() {
  return process.env.EMAIL_USER || process.env.BREVO_SENDER_EMAIL;
}

function checkEmailConfig() {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is missing in Render Environment");
  }

  if (!getSenderEmail()) {
    throw new Error("EMAIL_USER is missing in Render Environment");
  }
}

export async function sendOtpEmail(toEmail, subject, otp, options = {}) {
  checkEmailConfig();

  const senderName = options.senderName || "Typing Website";
  const heading = options.heading || "Password Reset OTP";
  const message = options.message || "Use this OTP to reset your password.";
  const validity = options.validity || "5 minutes";
  const greeting = options.greeting || "";

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: senderName,
          email: getSenderEmail(),
        },
        to: [{ email: toEmail }],
        subject,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e5e5e5; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #ff6b3d; margin-bottom: 8px;">${heading}</h2>
            ${greeting ? `<p style="color:#555;font-size:15px;">${greeting}</p>` : ""}
            <p style="color: #555; font-size: 15px;">${message} It expires in <strong>${validity}</strong>.</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center; padding: 22px; background: #f5f5f5; border-radius: 8px; margin: 24px 0; color: #222;">
              ${otp}
            </div>
            <p style="color: #888; font-size: 13px;">If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #bbb; font-size: 12px; text-align: center;">&copy; Typing Website</p>
          </div>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 20000,
      }
    );
  } catch (error) {
    const brevoMessage = error.response?.data?.message || error.response?.data?.code;
    const status = error.response?.status;
    console.error("Brevo email error:", error.response?.data || error.message);
    throw new Error(
      brevoMessage
        ? `Brevo email failed${status ? ` (${status})` : ""}: ${brevoMessage}`
        : error.message || "Failed to send OTP email"
    );
  }
}
