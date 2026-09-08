/**
 * sendEmail — nodemailer wrapper with Ethereal dev fallback
 * Gracefully no-ops if nodemailer is not yet installed.
 * Run:  npm install  to enable real email sending.
 */

let nodemailer = null;

try {
  const mod = await import('nodemailer');
  nodemailer = mod.default;
} catch {
  // nodemailer not installed yet — emails will be skipped in dev
}

const createTransporter = async () => {
  if (!nodemailer) return null;

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }

  // Dev fallback: Ethereal fake SMTP
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
};

/**
 * @param {{ to: string, subject: string, html: string }} opts
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!nodemailer) {
    console.warn(`📧 [sendEmail SKIPPED — nodemailer not installed]\n   To: ${to}\n   Subject: ${subject}`);
    return { success: false, reason: 'nodemailer not installed' };
  }

  try {
    const transporter = await createTransporter();
    if (!transporter) return { success: false, reason: 'no transporter' };

    const info = await transporter.sendMail({
      from: `"Midnight Sanctuary" <${process.env.EMAIL_FROM || 'noreply@midnightsanctuary.app'}>`,
      to,
      subject,
      html,
    });

    if (process.env.NODE_ENV !== 'production') {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log(`📧 Email preview: ${preview}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('sendEmail error:', err.message);
    return { success: false, error: err.message };
  }
};

export default sendEmail;
