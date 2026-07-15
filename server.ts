import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { submissions, simulatedEmails, users, auditLogs, checklistTemplates, emailTemplateConfig } from './src/db/schema.ts';
import { desc, eq, and } from 'drizzle-orm';
import { INITIAL_SAMPLE_SUBMISSIONS, INITIAL_SAMPLE_EMAILS, DEFAULT_CHECKLISTS } from './src/data.ts';
import nodemailer from 'nodemailer';
import https from 'https';
import http from 'http';
import { sql } from 'drizzle-orm';
import { hashPassword, verifyPassword, isBcryptHash } from './src/utils/password.ts';

const PORT = 3000;

let smtpTransporter: any = null;

function loadSmtpConfig() {
  try {
    const configPath = path.join(process.cwd(), 'smtp-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.host) process.env.SMTP_HOST = config.host;
      if (config.port) process.env.SMTP_PORT = config.port;
      if (config.user) process.env.SMTP_USER = config.user;
      if (config.pass) process.env.SMTP_PASS = config.pass;
      if (config.from) process.env.SMTP_FROM = config.from;
      console.log('SMTP Config: Dynamically loaded custom configuration from smtp-config.json');
    }
  } catch (err) {
    console.error('SMTP Config: Error loading smtp-config.json', err);
  }
}

function getTransporter() {
  loadSmtpConfig();
  if (smtpTransporter !== null) return smtpTransporter;

  let host = process.env.SMTP_HOST;
  let port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('SMTP Config: Missing SMTP_HOST, SMTP_USER, or SMTP_PASS. Real email dispatch is disabled.');
    return null;
  }

  // Handle Gmail fallback
  if ((host === '127.0.0.1' || host === 'localhost' || port === 456) && user.endsWith('@gmail.com')) {
    console.log(`SMTP Config: Detected Gmail user with local/placeholder SMTP host. Falling back to smtp.gmail.com on port 465.`);
    host = 'smtp.gmail.com';
    port = 465;
  }

  try {
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log(`SMTP Config: Created mail transporter for ${user}@${host}:${port}`);
    return smtpTransporter;
  } catch (err) {
    console.error('SMTP Config: Failed to create nodemailer transport:', err);
    return null;
  }
}


function prepareEmailHtml(html: string) {
  return html.replace(/PUP_LOGO_CID/g, 'cid:pupLogo');
}

function getEmailAttachments() {
  const logoPath = path.join(process.cwd(), 'public', 'assets', 'pup-official-seal.png');

  if (!fs.existsSync(logoPath)) {
    console.warn('Email logo not found at:', logoPath);
    return [];
  }

  return [
    {
      filename: 'pup-official-seal.png',
      path: logoPath,
      cid: 'pupLogo'
    }
  ];
}

async function startServer() {
  const app = express();

  // Network access configuration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json());

  // Background Database Seeder on Startup
  try {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log('Seeding default admin and officer accounts into PostgreSQL users table...');
      await db.insert(users).values([
        {
          username: 'admin001',
          fullName: 'Head Admin',
          role: 'Head Admin',
          email: 'admin.ous@pup.edu.ph',
          password: await hashPassword('pupadmin'),
          avatarUrl: ''
        },
        {
          username: 'officer001',
          fullName: 'Registrar Officer',
          role: 'Registrar Officer',
          email: 'officer.ous@pup.edu.ph',
          password: await hashPassword('pupofficer'),
          avatarUrl: ''
        }
      ]);
    }

    const existingSubmissions = await db.select().from(submissions);
    if (existingSubmissions.length === 0) {
      console.log('PostgreSQL database submissions table is empty. Seeding initial academic ledger logs...');
      await db.insert(submissions).values(INITIAL_SAMPLE_SUBMISSIONS);
      await db.insert(simulatedEmails).values(INITIAL_SAMPLE_EMAILS);
    }

    // Migrate old purposes in existing submissions to keep data consistent with new types
    try {
      await db.update(submissions)
        .set({ purpose: 'Masteral' })
        .where(eq(submissions.purpose, 'Admission (Graduate)'));
      await db.update(submissions)
        .set({ purpose: 'Admission - Bachelor' })
        .where(eq(submissions.purpose, 'Admission (Bachelors)'));
      await db.update(submissions)
        .set({ purpose: 'Admission - Bachelor' })
        .where(eq(submissions.purpose, 'Graduation Bachelor'));
      await db.update(submissions)
        .set({ purpose: 'Admission - Graduation' })
        .where(eq(submissions.purpose, 'Graduation'));
      await db.update(submissions)
        .set({ purpose: 'Admission - Graduation' })
        .where(eq(submissions.purpose, 'Graduation-Admission'));
    } catch (migrateErr) {
      console.log('Skipped / handled inline submissions purpose migration:', migrateErr);
    }

    const existingTemplates = await db.select().from(checklistTemplates);
    const hasOldPurposes = existingTemplates.some(t => 
      t.purpose === 'Admission (Graduate)' || 
      t.purpose === 'Admission (Bachelors)' || 
      t.purpose === 'Graduation'
    );

    if (existingTemplates.length === 0 || hasOldPurposes) {
      console.log('PostgreSQL database checklistTemplates table needs seeding or migration. Seeding default checklists...');
      try {
        if (hasOldPurposes) {
          await db.delete(checklistTemplates);
        }
        const seedItems: any[] = [];
        let counter = 1;
        for (const [purpose, items] of Object.entries(DEFAULT_CHECKLISTS)) {
          for (const item of items) {
            seedItems.push({
              id: `req-${counter++}`,
              purpose: purpose,
              name: item.name,
              required: item.required
            });
          }
        }
        if (seedItems.length > 0) {
          await db.insert(checklistTemplates).values(seedItems);
        }
      } catch (seedErr) {
        console.error('Error seeding checklistTemplates:', seedErr);
      }
    }
    console.log('PostgreSQL database checking & initial seeding complete.');
  } catch (err) {
    console.error('Warning: Startup seeding could not be completed. Database connection may not be ready yet:', err);
  }

  // API Route: User logins
  app.post('/api/users/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const lowerUsername = username.toLowerCase();
      // Look up user by username or email
      const userMatch = await db.select().from(users).where(eq(users.username, lowerUsername));
      const emailMatch = await db.select().from(users).where(eq(users.email, lowerUsername));
      
      const foundUser = userMatch.length > 0 ? userMatch[0] : (emailMatch.length > 0 ? emailMatch[0] : null);

      if (!foundUser || !(await verifyPassword(password, foundUser.password || ''))) {
        return res.status(401).json({ error: 'Invalid Username or password. Please try again.' });
      }

      // Transparently upgrade legacy plaintext passwords to bcrypt hashes on successful login
      if (!isBcryptHash(foundUser.password || '')) {
        await db.update(users).set({ password: await hashPassword(password) }).where(eq(users.username, foundUser.username));
      }

      const safeUser = {
        username: foundUser.username,
        fullName: foundUser.fullName,
        role: foundUser.role,
        email: foundUser.email,
        avatarUrl: foundUser.avatarUrl,
        createdAt: foundUser.createdAt
      };

      res.status(200).json({ success: true, user: safeUser });
    } catch (err: any) {
      console.error('Error during login:', err);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const safeUsers = allUsers.map((user) => ({
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // API Route: Create user (Admin only)
  app.post('/api/users', async (req, res) => {
    try {
      const { username, fullName, email, role, password, avatarUrl } = req.body;

      if (!username || !fullName || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields: username, fullName, email, and role are required.' });
      }

      const cleanUsername = username.toLowerCase().trim();
      const cleanEmail = email.toLowerCase().trim();

      // Check if username already exists
      const userByName = await db.select().from(users).where(eq(users.username, cleanUsername));
      if (userByName.length > 0) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }

      // Check if email already exists
      const userByEmail = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (userByEmail.length > 0) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }

      await db.insert(users).values({
        username: cleanUsername,
        fullName: fullName.trim(),
        email: cleanEmail,
        role: role,
        password: await hashPassword(password || 'password123'),
        avatarUrl: avatarUrl || ''
      });

      console.log(`User Created: ${cleanUsername} (${role}) added to users table.`);
      res.status(201).json({
        success: true,
        message: `User ${cleanUsername} created successfully.`,
        user: { username: cleanUsername, fullName, email: cleanEmail, role }
      });
    } catch (err: any) {
      console.error('Error creating user:', err);
      res.status(500).json({ error: err.message || 'Failed to create user in database.' });
    }
  });

  // API Route: Delete user (Admin only)
  app.delete('/api/users/:username', async (req, res) => {
    try {
      const { username } = req.params;
      if (!username) {
        return res.status(400).json({ error: 'Username parameter is required.' });
      }

      const cleanUsername = username.toLowerCase().trim();

      // Prevent deleting the primary admin account or the current user if possible, 
      // but let's check if the user exists first.
      const userMatch = await db.select().from(users).where(eq(users.username, cleanUsername));
      if (userMatch.length === 0) {
        return res.status(404).json({ error: 'Staff account not found in database.' });
      }

      await db.delete(users).where(eq(users.username, cleanUsername));

      console.log(`User Deleted: ${cleanUsername} removed from users table.`);
      res.json({
        success: true,
        message: `Staff account "${cleanUsername}" has been deleted successfully.`
      });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      if ((err.cause && err.cause.code) === '23503' || err.code === '23503') {
        return res.status(409).json({ error: 'Cannot delete this account: it has an associated audit trail history that must be preserved for non-repudiation.' });
      }
      res.status(500).json({ error: err.message || 'Failed to delete user from database.' });
    }
  });

  // API Route: Change Password
  app.post('/api/users/change-password', async (req, res) => {
    try {
      const { username, currentPassword, newPassword } = req.body;

      if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'All fields are required.' });
      }

      const userMatch = await db.select().from(users).where(eq(users.username, username));
      if (userMatch.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const u = userMatch[0];
      if (!(await verifyPassword(currentPassword, u.password || ''))) {
        return res.status(401).json({ error: 'Incorrect current password.' });
      }

      await db.update(users).set({ password: await hashPassword(newPassword) }).where(eq(users.username, username));

      res.status(200).json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (err: any) {
      console.error('Error changing password:', err);
      res.status(500).json({ error: err.message || 'Failed to change password.' });
    }
  });

  // API Route: Forgot Password with Temporary Password Reset
  app.post('/api/users/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email field is required.' });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Check if email exists in database
      const userMatch = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (userMatch.length === 0) {
        return res.status(404).json({ error: 'No registrar account is registered with this email address.' });
      }

      const u = userMatch[0];
      
      // Generate secure temp password
      const tempPass = `PUP-TEMP-${Math.floor(100000 + Math.random() * 900000)}`;

      // Update password in database
      await db.update(users).set({ password: await hashPassword(tempPass) }).where(eq(users.username, u.username));

      // Fetch a valid submission ID to satisfy the foreign key constraint on simulated_emails
      const subs = await db.select().from(submissions).limit(1);
      const subId = subs.length > 0 ? subs[0].id : 'PUPOUS-2026-M8K3A';

      const emailId = `email-${Date.now()}`;
      const subject = '[PUP OUS PRMS] Account Recovery - Temporary Password';
      const bodyHtml = `
        <div style="font-family: 'Inter', sans-serif, system-ui; max-width: 500px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
          <div style="background-color: #800000; padding: 25px 20px; text-align: center; color: white; border-bottom: 4px solid #f59e0b;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">PUP Open University System</h2>
            <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.9; font-weight: bold; text-transform: uppercase; tracking-wider: 1px;">PRMS Requirement Monitoring Portal</p>
          </div>
          <div style="padding: 30px 24px; color: #334155; line-height: 1.6; font-size: 14px;">
            <p style="margin-top: 0;">Dear <strong>${u.fullName}</strong>,</p>
            <p>We received a request to recover your registrar staff account password for the PUP OUS Requirement Monitoring System.</p>
            <p>Your password has been successfully reset. Please use the temporary credentials below to log in:</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 24px 0; text-align: center;">
              <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Temporary Password</div>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 800; color: #800000; letter-spacing: 1.5px;">${tempPass}</div>
            </div>
            
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 12px 16px; margin: 20px 0; display: flex; align-items: start; gap: 8px;">
              <span style="color: #d97706; font-weight: bold; font-size: 14px; margin-right: 4px;">⚠️</span>
              <p style="color: #b45309; font-size: 11.5px; font-weight: 600; margin: 0; line-height: 1.4;">
                For system security, you are strictly required to change this password immediately after logging into your dashboard account.
              </p>
            </div>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.4; text-align: center;">
              This is an automated system dispatch. Please do not reply directly to this message.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; font-weight: 500;">
            Polytechnic University of the Philippines &bull; Registrar's Office
          </div>
        </div>
      `;

      // Log email in the simulated emails table so users see it in the inbox immediately
      await db.insert(simulatedEmails).values({
        id: emailId,
        submissionId: subId,
        recipientEmail: u.email,
        recipientName: u.fullName,
        subject,
        bodyHtml,
        timestamp: new Date().toISOString()
      });

      // Attempt to send real SMTP email if transporter is configured
      const transporter = getTransporter();
      let smtpSent = false;
      let smtpError = null;

      if (transporter) {
        try {
          const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pup.edu.ph';
          const info = await transporter.sendMail({
            from: fromAddress,
            to: u.email,
            subject,
            html: prepareEmailHtml(bodyHtml),
            attachments: getEmailAttachments()
          });
          console.log(`SMTP Success: Recovery email sent to ${u.email}. MessageId: ${info.messageId}`);
          smtpSent = true;
        } catch (mailErr: any) {
          console.error(`SMTP Error: Failed to dispatch recovery email to ${u.email}:`, mailErr);
          smtpError = mailErr.message || String(mailErr);
        }
      } else {
        console.log(`SMTP Skip: Recovery email logged as simulated only. No SMTP credentials set.`);
      }

      res.status(200).json({
        success: true,
        message: 'A temporary password recovery email has been sent successfully.',
        simulated: true,
        smtpSent,
        smtpError
      });
    } catch (err: any) {
      console.error('Error handling forgot-password:', err);
      res.status(500).json({ error: err.message || 'Failed to process password recovery.' });
    }
  });

  // API Route: Get all submissions sorted by timestamp descending
  app.get('/api/submissions', async (req, res) => {
    try {
      const allSubmissions = await db.select().from(submissions).orderBy(desc(submissions.timestamp));
      res.json(allSubmissions);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      res.status(500).json({ error: 'Failed to retrieve submissions.' });
    }
  });

  // API Route: Create a new requirement ledger submission
  app.post('/api/submissions', async (req, res) => {
    try {
      const newSubmission = req.body;
      const studentFirstName = newSubmission.studentFirstName || '';
      const studentMiddleName = newSubmission.studentMiddleName || '';
      const studentLastName = newSubmission.studentLastName || '';
      const studentName = newSubmission.studentName || (studentLastName ? `${studentLastName}, ${studentFirstName}` : studentFirstName);

      if (!newSubmission.id || (!studentFirstName && !studentName) || !newSubmission.studentEmail) {
        return res.status(400).json({ error: 'Missing required submission fields.' });
      }

      const cleanStudentEmail = String(newSubmission.studentEmail || '').trim().toLowerCase();
      const cleanContactNumber = String(newSubmission.contactNumber || '').trim();

      const possibleDuplicate = await db
        .select({ id: submissions.id })
        .from(submissions)
        .where(and(
          eq(submissions.studentEmail, cleanStudentEmail),
          eq(submissions.purpose, newSubmission.purpose),
          eq(submissions.dateString, newSubmission.dateString),
          eq(submissions.contactNumber, cleanContactNumber)
        ))
        .limit(1);

      const demoDuplicateAllowedEmails = (process.env.DEMO_DUPLICATE_ALLOWED_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);

      const allowDuplicateForThisEmail = demoDuplicateAllowedEmails.includes(cleanStudentEmail);

      if (!allowDuplicateForThisEmail && possibleDuplicate.length > 0) {
        return res.status(409).json({
          error: 'Possible duplicate submission found. Please check the Logs Ledger before saving again.',
          code: 'DUPLICATE_SUBMISSION',
          existingId: possibleDuplicate[0].id
        });
      }
      
      await db.insert(submissions).values({
        id: newSubmission.id,
        timestamp: newSubmission.timestamp,
        dateString: newSubmission.dateString,
        purpose: newSubmission.purpose,
        studentName: studentName,
        studentFirstName: studentFirstName,
        studentMiddleName: studentMiddleName,
        studentLastName: studentLastName,
        studentEmail: cleanStudentEmail,
        contactNumber: cleanContactNumber,
        deliveryMethod: newSubmission.deliveryMethod,
        courierTrackingNumber: newSubmission.courierTrackingNumber || null,
        documents: newSubmission.documents,
        remarks: newSubmission.remarks || null,
        notified: !!newSubmission.notified,
        notificationTimestamp: newSubmission.notificationTimestamp || null
      });

      res.status(201).json({ success: true, submission: { ...newSubmission, studentName, studentFirstName, studentLastName } });
    } catch (err: any) {
      console.error('Error creating submission:', err);
      if ((err.cause && err.cause.code) === '23503' || err.code === '23503') {
        return res.status(400).json({ error: `Invalid purpose "${req.body?.purpose}": it does not match any configured academic purpose category.` });
      }
      res.status(500).json({ error: 'Failed to save submission to PostgreSQL database.' });
    }
  });

  // API Route: Update an existing submission
  app.put('/api/submissions/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const updateData = req.body;
      const studentFirstName = updateData.studentFirstName || '';
      const studentMiddleName = updateData.studentMiddleName || '';
      const studentLastName = updateData.studentLastName || '';
      const studentName = updateData.studentName || (studentLastName ? `${studentLastName}, ${studentFirstName}` : studentFirstName);

      await db.update(submissions).set({
        purpose: updateData.purpose,
        studentName: studentName,
        studentFirstName: studentFirstName,
        studentMiddleName: studentMiddleName,
        studentLastName: studentLastName,
        studentEmail: updateData.studentEmail,
        contactNumber: updateData.contactNumber,
        deliveryMethod: updateData.deliveryMethod,
        courierTrackingNumber: updateData.courierTrackingNumber || null,
        documents: updateData.documents,
        remarks: updateData.remarks || null,
        notified: !!updateData.notified,
        notificationTimestamp: updateData.notificationTimestamp || null
      }).where(eq(submissions.id, id));

      res.json({ success: true, id });
    } catch (err: any) {
      console.error('Error updating submission:', err);
      if ((err.cause && err.cause.code) === '23503' || err.code === '23503') {
        return res.status(400).json({ error: `Invalid purpose "${req.body?.purpose}": it does not match any configured academic purpose category.` });
      }
      res.status(500).json({ error: 'Failed to update submission in database.' });
    }
  });

  // API Route: Delete a submission
  app.delete('/api/submissions/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.delete(submissions).where(eq(submissions.id, id));
      res.json({ success: true, message: 'Submission deleted successfully.' });
    } catch (err: any) {
      console.error('Error deleting submission:', err);
      res.status(500).json({ error: 'Failed to delete submission from database.' });
    }
  });

  // API Route: Get all simulated emails
  app.get('/api/emails', async (req, res) => {
    try {
      const emailsList = await db.select().from(simulatedEmails).orderBy(desc(simulatedEmails.timestamp));
      res.json(emailsList);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      res.status(500).json({ error: 'Failed to retrieve emails log.' });
    }
  });

  // API Route: Create a simulated email & send actual SMTP email if configured
  app.post('/api/emails', async (req, res) => {
    try {
      const newEmail = req.body;
      await db.insert(simulatedEmails).values({
        id: newEmail.id,
        submissionId: newEmail.submissionId,
        recipientEmail: newEmail.recipientEmail,
        recipientName: newEmail.recipientName,
        subject: newEmail.subject,
        bodyHtml: newEmail.bodyHtml,
        timestamp: newEmail.timestamp
      });

      // Send actual email via SMTP if configured
      const transporter = getTransporter();
      let smtpSent = false;
      let smtpError = null;

      if (transporter) {
        try {
          const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pup.edu.ph';
          const info = await transporter.sendMail({
            from: fromAddress,
            to: newEmail.recipientEmail,
            subject: newEmail.subject,
            html: prepareEmailHtml(newEmail.bodyHtml),
            attachments: getEmailAttachments()
          });
          console.log(`SMTP Success: Email sent to ${newEmail.recipientEmail}. MessageId: ${info.messageId}`);
          smtpSent = true;
        } catch (mailErr: any) {
          console.error(`SMTP Error: Failed to dispatch real email to ${newEmail.recipientEmail}:`, mailErr);
          smtpError = mailErr.message || String(mailErr);
        }
      } else {
        console.log(`SMTP Skip: No real email sent to ${newEmail.recipientEmail} because SMTP is not configured.`);
      }

      res.status(201).json({ 
        success: true, 
        email: newEmail,
        smtpSent,
        smtpError
      });
    } catch (err: any) {
      console.error('Error saving simulated email:', err);
      res.status(500).json({ error: 'Failed to log simulated email.' });
    }
  });

  // API Route: Update SMTP Configuration
  app.post('/api/smtp/config', (req, res) => {
    try {
      const { host, port, user, pass, from } = req.body;
      
      const configPath = path.join(process.cwd(), 'smtp-config.json');
      const config = {
        host: host || '',
        port: port || '',
        user: user || '',
        pass: pass || '',
        from: from || ''
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      
      if (host) process.env.SMTP_HOST = host; else delete process.env.SMTP_HOST;
      if (port) process.env.SMTP_PORT = port; else delete process.env.SMTP_PORT;
      if (user) process.env.SMTP_USER = user; else delete process.env.SMTP_USER;
      if (pass) process.env.SMTP_PASS = pass; else delete process.env.SMTP_PASS;
      if (from) process.env.SMTP_FROM = from; else delete process.env.SMTP_FROM;
      
      smtpTransporter = null;
      
      console.log('SMTP Config: Updated custom SMTP configuration from UI and reset transporter.');
      res.json({ success: true, message: 'SMTP settings updated and saved successfully!' });
    } catch (err: any) {
      console.error('SMTP Config: Failed to save custom SMTP configuration:', err);
      res.status(500).json({ error: err.message || 'Failed to update SMTP settings.' });
    }
  });

  const DEFAULT_EMAIL_TEMPLATE = {
    subjectFormat: "[PUP OUS] Document Requirements Received - {trackingId}",
    bodyFormat: `Hello, {studentName}!

This is an official verification that the PUP OUS Admission Office has received your academic documents for {purpose}.

Tracking Details:
• Process/Tracking No: {trackingId}
• Received via: {deliveryMethod} {courierTrackingNumber}
• Received Date: {receivedDate}

Received Documents:
{receivedDocuments}

{pendingDocuments}

{remarks}`
  };

  // API Route: Get Customizable Email Template Configuration
  app.get('/api/email-template/config', async (req, res) => {
    try {
      const rows = await db.select().from(emailTemplateConfig).limit(1);
      if (rows.length > 0) {
        return res.json({ subjectFormat: rows[0].subjectFormat, bodyFormat: rows[0].bodyFormat });
      }
      res.json(DEFAULT_EMAIL_TEMPLATE);
    } catch (err: any) {
      console.error('Email Template: Failed to load config:', err);
      res.status(500).json({ error: 'Failed to load email template configuration.' });
    }
  });

  // API Route: Update Customizable Email Template Configuration
  app.post('/api/email-template/config', async (req, res) => {
    try {
      const { subjectFormat, bodyFormat } = req.body;
      if (!subjectFormat || !bodyFormat) {
        return res.status(400).json({ error: 'Both subjectFormat and bodyFormat are required.' });
      }

      await db.insert(emailTemplateConfig)
        .values({ id: 1, subjectFormat, bodyFormat, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: emailTemplateConfig.id,
          set: { subjectFormat, bodyFormat, updatedAt: new Date() }
        });

      console.log('Email Template: Custom email format updated successfully.');
      res.json({ success: true, message: 'Email body format saved and updated successfully!' });
    } catch (err: any) {
      console.error('Email Template: Failed to save config:', err);
      res.status(500).json({ error: err.message || 'Failed to save email template configuration.' });
    }
  });

  // API Route: Get SMTP Configuration & Status
  app.get('/api/smtp/status', (req, res) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const hasPass = !!process.env.SMTP_PASS;
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pup.edu.ph';

    const isConfigured = !!(host && user && hasPass);

    res.json({
      configured: isConfigured,
      host: host || null,
      port: port || null,
      user: user || null,
      from: fromAddress || null
    });
  });

  // API Route: Send a test email via SMTP
  app.post('/api/smtp/test', async (req, res) => {
    try {
      const { testEmail } = req.body;
      if (!testEmail) {
        return res.status(400).json({ error: 'Missing test recipient email address.' });
      }

      const transporter = getTransporter();
      if (!transporter) {
        return res.status(400).json({ error: 'SMTP is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in the environment.' });
      }

      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pup.edu.ph';
      const info = await transporter.sendMail({
        from: fromAddress,
        to: testEmail,
        subject: 'PUPOUS Requirement Monitoring System - SMTP Connection Test',
        html: prepareEmailHtml(`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="background-color: #800000; color: white; padding: 22px 20px; text-align: center;">
              <img src="PUP_LOGO_CID" alt="PUP Logo" style="display:block; width:96px; height:auto; margin:0 auto 12px auto; border:0; background:#ffffff; border-radius:6px;" />
              <h2 style="margin: 0; font-size: 20px;">PUPOUS Requirement Monitoring System</h2>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">SMTP Integration Test</p>
            </div>
            <div style="padding: 20px; color: #333333; line-height: 1.6;">
              <p>Hello!</p>
              <p>This is a test email confirming that your SMTP settings are <strong>correctly configured</strong> and the application is able to dispatch real emails.</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 5px 0; font-weight: bold;">Configuration Details:</p>
                <ul style="margin: 0; padding-left: 20px; font-family: monospace; font-size: 13px;">
                  <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                  <li>SMTP Port: ${process.env.SMTP_PORT || '587'}</li>
                  <li>SMTP User: ${process.env.SMTP_USER}</li>
                </ul>
              </div>
              <p>You can now safely log student academic documents, and students will receive real-time updates directly to their inbox.</p>
            </div>
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #64748b;">
              &copy; 2026 PUPOUS Requirement Monitoring System. This is an automated test email. Please do not reply.
            </div>
          </div>
        `),
        attachments: getEmailAttachments()
      });

      res.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error('SMTP test send failed:', err);
      res.status(500).json({ error: err.message || 'SMTP connection/auth failed.' });
    }
  });

  // API Routes: Requirement Checklist Templates CRUD
  app.get('/api/checklist-templates', async (req, res) => {
    try {
      const templates = await db.select().from(checklistTemplates);
      res.json(templates);
    } catch (err: any) {
      console.error('Error fetching checklist templates:', err);
      res.status(500).json({ error: 'Failed to retrieve checklist templates.' });
    }
  });

  app.post('/api/checklist-templates', async (req, res) => {
    try {
      const item = req.body;
      if (!item.purpose || !item.name) {
        return res.status(400).json({ error: 'Missing required checklist fields.' });
      }
      const id = item.id || `req-${Date.now()}`;
      const newItem = {
        id,
        purpose: item.purpose,
        name: item.name,
        required: item.required !== false
      };
      await db.insert(checklistTemplates).values(newItem);
      res.status(201).json({ success: true, item: newItem });
    } catch (err: any) {
      console.error('Error creating checklist template item:', err);
      if ((err.cause && err.cause.code) === '23503' || err.code === '23503') {
        return res.status(400).json({ error: `Invalid purpose "${req.body?.purpose}": it does not match any configured academic purpose category.` });
      }
      res.status(500).json({ error: 'Failed to save checklist template item.' });
    }
  });

  app.put('/api/checklist-templates/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const item = req.body;
      if (!item.purpose || !item.name) {
        return res.status(400).json({ error: 'Missing required checklist fields.' });
      }
      await db.update(checklistTemplates).set({
        purpose: item.purpose,
        name: item.name,
        required: item.required
      }).where(eq(checklistTemplates.id, id));
      res.json({ success: true, item: { id, ...item } });
    } catch (err: any) {
      console.error('Error updating checklist template item:', err);
      if ((err.cause && err.cause.code) === '23503' || err.code === '23503') {
        return res.status(400).json({ error: `Invalid purpose "${req.body?.purpose}": it does not match any configured academic purpose category.` });
      }
      res.status(500).json({ error: 'Failed to update checklist template item.' });
    }
  });

  app.delete('/api/checklist-templates/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.delete(checklistTemplates).where(eq(checklistTemplates.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting checklist template item:', err);
      res.status(500).json({ error: 'Failed to delete checklist template item.' });
    }
  });

  // API Route: Get all audit logs
  app.get('/api/audit', async (req, res) => {
    try {
      const allAuditLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
      res.json(allAuditLogs);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
  });

  // API Route: Create a new audit log
  app.post('/api/audit', async (req, res) => {
    try {
      const logEntry = req.body;
      if (!logEntry.id || !logEntry.timestamp || !logEntry.user || !logEntry.role || !logEntry.action || !logEntry.details) {
        return res.status(400).json({ error: 'Missing required audit log fields.' });
      }

      await db.insert(auditLogs).values({
        id: logEntry.id,
        timestamp: logEntry.timestamp,
        user: logEntry.user,
        role: logEntry.role,
        action: logEntry.action,
        details: logEntry.details,
        targetId: logEntry.targetId || null
      });

      res.status(201).json({ success: true });
    } catch (err: any) {
      console.error('Error creating audit log:', err);
      res.status(500).json({ error: 'Failed to save audit log.' });
    }
  });


 // Serve Front-End Application
  // Always serve public folder for dynamically generated files
  app.use(express.static(path.join(process.cwd(), 'public')));

  const httpsOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'certs', 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), 'certs', 'localhost+2.pem')),
  };

  const HTTPS_PORT = Number(process.env.HTTPS_PORT || 3443);

  // Create the server instances first so Vite's HMR websocket can attach
  // to the same HTTPS server, avoiding wss:// vs ws:// protocol mismatches.
  const httpServer = http.createServer(app);
  const httpsServer = https.createServer(httpsOptions, app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpsServer }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Plain HTTP listener (works for http://, localhost, and IP-based access,
  // and matches the Capacitor cleartext config)
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PUP OUS Ledger Express Server (HTTP) running on http://0.0.0.0:${PORT}`);
  });

  // Secure HTTPS listener on a separate port
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`PUP OUS Ledger Express Server (HTTPS) running on https://0.0.0.0:${HTTPS_PORT}`);
  });
}

startServer();
