const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
  console.log(`📧 Email sent to: ${to}`);
};

// ── Email Templates ───────────────────────────────────────────────────────────

const verificationEmailHtml = (name, url) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,.3)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:24px">🧠 StudySync AI</h1>
    </div>
    <div style="padding:36px">
      <h2 style="color:#f1f5f9;margin:0 0 12px">Hi ${name}! 👋</h2>
      <p style="color:#94a3b8;line-height:1.7">Welcome to StudySync AI. Please verify your email to start connecting with study partners.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${url}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
          Verify Email Address
        </a>
      </div>
      <p style="color:#64748b;font-size:13px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

const passwordResetHtml = (name, url) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,.3)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:24px">🔐 Password Reset</h1>
    </div>
    <div style="padding:36px">
      <h2 style="color:#f1f5f9;margin:0 0 12px">Hi ${name}</h2>
      <p style="color:#94a3b8;line-height:1.7">You requested a password reset. Click below to set a new password.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${url}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
          Reset Password
        </a>
      </div>
      <p style="color:#64748b;font-size:13px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

const connectionRequestHtml = (fromName, toName) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,.3)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:24px">🤝 New Connection Request</h1>
    </div>
    <div style="padding:36px">
      <h2 style="color:#f1f5f9;margin:0 0 12px">Hi ${toName}!</h2>
      <p style="color:#94a3b8;line-height:1.7"><strong style="color:#818cf8">${fromName}</strong> sent you a study partner connection request on StudySync AI.</p>
      <p style="color:#94a3b8;line-height:1.7">Log in to accept and unlock 1-on-1 chat!</p>
    </div>
  </div>
</body>
</html>`;

module.exports = { sendEmail, verificationEmailHtml, passwordResetHtml, connectionRequestHtml };
