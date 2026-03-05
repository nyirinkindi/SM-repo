/**
 * controllers/email_sender.js
 * Centralized email sending service using nodemailer
 * Used by: applications.js, profile.js
 */

const nodemailer = require('nodemailer');
const FailedMail = require('../models/FailedMail');

// ---------------------------------------------------------------------------
// Transporter (configured from environment variables)
// Set in your .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// ---------------------------------------------------------------------------
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM_ADDRESS = `"eShuri Platform" <${process.env.SMTP_USER || 'no-reply@eshuri.rw'}>`;

// ---------------------------------------------------------------------------
// Helper: persist failed mail to DB for retry later
// ---------------------------------------------------------------------------
async function saveFailedMail(content, error) {
  try {
    await new FailedMail({
      content: JSON.stringify(content),
      error: error instanceof Error ? error.message : String(error),
    }).save();
  } catch (dbErr) {
    console.error('[email_sender] Could not save failed mail to DB:', dbErr.message);
  }
}

// ---------------------------------------------------------------------------
// Helper: human-readable status label
// ---------------------------------------------------------------------------
function getStatusLabel(status) {
  const labels = { P: 'Pending', A: 'Admitted', F: 'Incomplete', R: 'Rejected' };
  return labels[status] || status;
}

// ---------------------------------------------------------------------------
// sendApplicationEmailStatus
// Called from controllers/applications.js with:
//   { email, token, status, username, comment, school_name }
// ---------------------------------------------------------------------------
exports.sendApplicationEmailStatus = async function (infos) {
  const { email, token, status, username, comment, school_name } = infos;
  const schoolUpper = (school_name || 'eShuri').toUpperCase();

  let subject = '';
  let bodyMessage = '';

  switch (status) {
    case 'P':
      subject = `Application Pending - ${schoolUpper}`;
      bodyMessage = `Your registration on <strong>${schoolUpper}</strong> is currently pending review.`;
      break;
    case 'A':
      subject = `Congratulations! You are Admitted - ${schoolUpper}`;
      bodyMessage = `
        You have been <strong>admitted</strong> to <strong>${schoolUpper}</strong>.<br><br>
        Please visit <a href="https://eshuri.rw/">eshuri.rw</a> and use the token below
        to complete your registration:<br><br>
        <strong style="font-size:18px;letter-spacing:2px;">${token}</strong>
      `;
      break;
    case 'F':
      subject = `Action Required - ${schoolUpper}`;
      bodyMessage = `
        Something is missing in your application to <strong>${schoolUpper}</strong>.<br><br>
        <strong>Reason:</strong> ${comment || 'Please check your application details.'}
      `;
      break;
    case 'R':
      subject = `Application Update - ${schoolUpper}`;
      bodyMessage = `
        We regret to inform you that your registration on <strong>${schoolUpper}</strong>
        has been <strong>rejected</strong>.
        ${comment ? `<br><br><strong>Reason:</strong> ${comment}` : ''}
      `;
      break;
    default:
      subject = `Application Update - ${schoolUpper}`;
      bodyMessage = `There is an update on your application to <strong>${schoolUpper}</strong>.`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;color:#333}
      .container{max-width:600px;margin:0 auto;padding:24px}
      .header{background:#4CAF50;color:#fff;padding:16px 24px;border-radius:4px 4px 0 0}
      .content{background:#fafafa;padding:24px;border:1px solid #e0e0e0}
      .status{display:inline-block;padding:4px 12px;border-radius:3px;font-weight:bold;background:#e8f5e9;color:#2e7d32}
      .footer{font-size:12px;color:#888;padding:16px 0;text-align:center}
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2 style="margin:0">eShuri Platform</h2></div>
        <div class="content">
          <p>Dear <strong>${username || 'Applicant'}</strong>,</p>
          <p>Application status: <span class="status">${getStatusLabel(status)}</span></p>
          <p>${bodyMessage}</p>
          <p>If you have questions, please contact the school administration.</p>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} eShuri Platform - Future AI Limited</div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = { from: FROM_ADDRESS, to: email, subject, html };

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`[email_sender] Sent to ${email}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[email_sender] Failed to send to ${email}:`, err.message);
    await saveFailedMail(mailOptions, err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// sendPasswordResetEmail
// Used by controllers/profile.js for password reset flow
//   { email, token, username }
// ---------------------------------------------------------------------------
exports.sendPasswordResetEmail = async function (infos) {
  const { email, token, username } = infos;
  const resetUrl = `${process.env.APP_URL || 'https://eshuri.rw'}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;color:#333}
      .container{max-width:600px;margin:0 auto;padding:24px}
      .header{background:#4CAF50;color:#fff;padding:16px 24px;border-radius:4px 4px 0 0}
      .content{background:#fafafa;padding:24px;border:1px solid #e0e0e0}
      .btn{display:inline-block;padding:12px 24px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold}
      .footer{font-size:12px;color:#888;padding:16px 0;text-align:center}
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2 style="margin:0">eShuri - Password Reset</h2></div>
        <div class="content">
          <p>Dear <strong>${username || 'User'}</strong>,</p>
          <p>We received a request to reset your password. Click the button below:</p>
          <p style="text-align:center"><a class="btn" href="${resetUrl}">Reset My Password</a></p>
          <p>Or copy this link:<br><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link expires in <strong>1 hour</strong>. If you did not request a reset, ignore this email.</p>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} eShuri Platform - Future AI Limited</div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: FROM_ADDRESS,
    to: email,
    subject: 'eShuri - Password Reset Request',
    html,
  };

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`[email_sender] Password reset sent to ${email}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[email_sender] Failed to send reset email to ${email}:`, err.message);
    await saveFailedMail(mailOptions, err);
    throw err;
  }
};