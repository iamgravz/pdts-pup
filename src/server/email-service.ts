import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from?: string;
}

export interface SendEmailParams {
  to: string | string[]; // Dynamic Receiver(s)
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
  smtpConfig?: SmtpConfig; // Dynamic Sender Settings (Optional)
}

/**
 * Dynamic Email Sender
 * Pwedeng gumamit ng iba't ibang sender email (Gmail, Yahoo, etc.) at iba't ibang receivers.
 */
export const sendEmail = async ({ to, subject, text, html, attachments, smtpConfig }: SendEmailParams) => {
  try {
    // 1. Determine SMTP Credentials (Dynamic param OR Fallback sa process.env settings)
    let host = smtpConfig?.host || process.env.SMTP_HOST;
    let port = smtpConfig?.port || Number(process.env.SMTP_PORT) || 587;
    const user = smtpConfig?.user || process.env.SMTP_USER;
    const pass = smtpConfig?.pass || process.env.SMTP_PASS;
    const from = smtpConfig?.from || process.env.SMTP_FROM || user;

    if (!host || !user || !pass) {
      throw new Error("Missing SMTP credentials. Please configure the SMTP settings.");
    }

    // Auto-correct standard Gmail settings if user inputs local host by mistake
    if ((host === '127.0.0.1' || host === 'localhost' || port === 456) && user.endsWith('@gmail.com')) {
      console.log(`Email Service: Auto-correcting Gmail host configuration.`);
      host = 'smtp.gmail.com';
      port = 465;
    }

    // 2. Create Transporter dynamically per request
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true kapag port 465, false kapag 587
      auth: { user, pass },
      tls: { rejectUnauthorized: false } // Para maiwasan ang self-signed certificate errors
    });

    // 3. Setup Sender and Receiver
    const mailOptions = {
      from: `"${process.env.BUSINESS_NAME || 'PUP OUS'}" <${from}>`,
      to: Array.isArray(to) ? to.join(", ") : to, // Dynamic ang makakatanggap
      subject,
      text,
      html,
      attachments
    };

    // 4. I-send ang email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} via sender ${user}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

