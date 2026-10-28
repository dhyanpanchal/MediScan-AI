const nodemailer = require('nodemailer');

/**
 * Mask an email address for safe logging without exposing personal data.
 * Example: 'panchaldhyan007@gmail.com' -> 'pa***07@gmail.com'
 */
const maskEmail = (email = '') => {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${domain}`;
  return `${user.substring(0, 2)}***${user.substring(user.length - 2)}@${domain}`;
};

/**
 * Verify whether SMTP credentials are valid and present in environment variables.
 */
const isSmtpConfigured = () => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();
  return Boolean(
    user &&
    pass &&
    user !== 'your-email@gmail.com' &&
    pass !== 'your-smtp-app-password'
  );
};

/**
 * Create and configure the Nodemailer transporter using environment variables.
 * Strips embedded spaces from Gmail App Passwords (e.g. 'abcd efgh ijkl mnop' -> 'abcdefghijklmnop').
 */
const createTransporter = () => {
  if (!isSmtpConfigured()) {
    throw new Error('Email service is not configured. Missing valid EMAIL_USER or EMAIL_PASS in backend/.env.');
  }

  const user = process.env.EMAIL_USER.trim();
  // Strip any spaces from the password (Google App Passwords typically have 4-character spaced chunks)
  const pass = process.env.EMAIL_PASS.replace(/\s+/g, '');
  const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);

  // If host is smtp.gmail.com or sender is a gmail account, use service: 'gmail' for best reliability
  if (host === 'smtp.gmail.com' || user.toLowerCase().endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Diagnostic utility to verify SMTP server connection.
 */
const verifySmtpConnection = async () => {
  if (!isSmtpConfigured()) {
    return { configured: false, connected: false, error: 'EMAIL_USER or EMAIL_PASS not configured' };
  }
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { configured: true, connected: true };
  } catch (err) {
    console.error('[SMTP Verification Error]:', err.message || err);
    return { configured: true, connected: false, error: err.message || String(err) };
  }
};

/**
 * Send 6-digit OTP verification email to registered user.
 * Throws an error if sending fails so calling controllers can handle delivery failure accurately.
 * Never prints OTP code or credentials in logs.
 *
 * @param {string} email Destination email address
 * @param {string} otp 6-digit verification code
 * @returns {Promise<boolean>} Resolves to true when the SMTP provider accepts the message
 */
const sendOTPEmail = async (email, otp) => {
  if (!email) {
    throw new Error('Destination email is required to send security code.');
  }
  if (!otp || typeof otp !== 'string' || otp.length !== 6) {
    throw new Error('Valid 6-digit OTP is required.');
  }

  const transporter = createTransporter();
  const fromAddress = process.env.EMAIL_FROM || `"MediScan AI Security" <${process.env.EMAIL_USER.trim()}>`;

  const mailOptions = {
    from: fromAddress,
    to: email.trim(),
    subject: 'MediScan AI - Login Verification Security Code',
    text: `MediScan AI Login Verification\n\nYour security code is: ${otp}\n\nThis code expires in 5 minutes. Do not share this code with anyone.\nIf you did not request this code, please secure your account.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #121829; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <tr>
                  <td style="padding: 36px 36px 20px 36px; text-align: center;">
                    <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 12px; color: #ffffff; font-weight: 800; font-size: 22px; text-align: center; margin-bottom: 16px;">
                      M
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                      Login Verification Code
                    </h1>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">
                      Use the 6-digit security code below to complete sign-in to your MediScan AI dashboard.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 36px 20px 36px; text-align: center;">
                    <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 12px; padding: 20px; text-align: center;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #a78bfa; padding-left: 10px; display: inline-block;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 36px 30px 36px;">
                    <p style="color: #cbd5e1; font-size: 13px; margin: 0 0 12px 0; line-height: 1.6;">
                      ⏱ This security code expires in <strong>5 minutes</strong>.
                    </p>
                    <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                      🔒 <strong>Security Notice:</strong> MediScan AI will never ask for your security code via phone, chat, or social media. If you did not attempt to log in, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 36px; background-color: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                    <p style="color: #475569; font-size: 11px; margin: 0;">
                      MediScan AI &bull; Clinical OCR & Diagnostics &bull; Automated Security Service
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Auth Diagnostic] Stage: SMTP Provider Accepted | Purpose: Login OTP | Target: ${maskEmail(email)} | Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Auth Diagnostic] Stage: SMTP Delivery Rejected | Purpose: Login OTP | Target: ${maskEmail(email)} | Error:`, error.message || error);
    throw new Error(`Email delivery service failed: ${error.message || 'SMTP connection error'}`);
  }
};

/**
 * Send Password Reset recovery email with security code.
 * Throws an error if sending fails.
 */
const sendPasswordResetEmail = async (email, resetCode) => {
  if (!email) {
    throw new Error('Destination email is required for password recovery.');
  }

  const transporter = createTransporter();
  const fromAddress = process.env.EMAIL_FROM || `"MediScan AI Security" <${process.env.EMAIL_USER.trim()}>`;

  const mailOptions = {
    from: fromAddress,
    to: email.trim(),
    subject: 'MediScan AI - Password Reset Request',
    text: `MediScan AI Password Reset\n\nA password reset request was made for your account.\nYour password recovery verification code is: ${resetCode}\n\nThis code expires in 15 minutes. If you did not request this, please ignore this email.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #121829; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <tr>
                  <td style="padding: 36px 36px 20px 36px; text-align: center;">
                    <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 12px; color: #ffffff; font-weight: 800; font-size: 22px; text-align: center; margin-bottom: 16px;">
                      M
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                      Password Recovery
                    </h1>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">
                      We received a request to reset the password for your MediScan AI account.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 36px 20px 36px; text-align: center;">
                    <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 12px; padding: 20px; text-align: center;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #a78bfa; padding-left: 10px; display: inline-block;">
                        ${resetCode}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 36px 30px 36px;">
                    <p style="color: #cbd5e1; font-size: 13px; margin: 0 0 12px 0; line-height: 1.6;">
                      ⏱ This recovery code is valid for <strong>15 minutes</strong>.
                    </p>
                    <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                      🔒 If you did not request a password reset, you can safely ignore this email or contact support if you suspect unauthorized access.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 36px; background-color: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                    <p style="color: #475569; font-size: 11px; margin: 0;">
                      MediScan AI &bull; Clinical OCR & Diagnostics &bull; Automated Security Service
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Auth Diagnostic] Stage: SMTP Provider Accepted | Purpose: Password Reset | Target: ${maskEmail(email)} | Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Auth Diagnostic] Stage: SMTP Delivery Rejected | Purpose: Password Reset | Target: ${maskEmail(email)} | Error:`, error.message || error);
    throw new Error(`Email delivery service failed: ${error.message || 'SMTP connection error'}`);
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  verifySmtpConnection,
  isSmtpConfigured,
  maskEmail
};
