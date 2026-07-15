import { pgTable, text, timestamp, boolean, jsonb, check, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { DocumentChecklistItem } from '../types';

// Lookup table for the fixed set of academic purpose categories.
// Shared by SUBMISSIONS and CHECKLIST_TEMPLATES so both stay in sync
// (previously two disconnected free-text columns that could drift apart).
export const purposes = pgTable('purposes', {
  name: text('name').primaryKey(), // 'Admission - Graduation', 'Admission - Bachelor', 'Masteral', 'Comprehensive Exam', 'Deficiency'
});

// Users table for persistent Role-Based Access Control
export const users = pgTable('users', {
  username: text('username').primaryKey(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // 'Head Admin' | 'Registrar Officer'
  email: text('email').notNull().unique(),
  avatarUrl: text('avatar_url'),
  password: text('password'), // for basic credentials login
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  check('chk_users_role', sql`${table.role} IN ('Head Admin', 'Registrar Officer')`),
]);

// Submissions / Ledger Entries table
export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(), // PUPOUS-YYYY-XXXXX
  timestamp: text('timestamp').notNull(), // ISO Date String
  dateString: text('date_string').notNull(), // YYYY-MM-DD
  purpose: text('purpose').notNull().references(() => purposes.name),
  studentName: text('student_name').default('').notNull(),
  studentFirstName: text('student_first_name').default('').notNull(),
  studentMiddleName: text('student_middle_name').default('').notNull(),
  studentLastName: text('student_last_name').default('').notNull(),
  studentEmail: text('student_email').notNull(),
  contactNumber: text('contact_number').notNull(),
  deliveryMethod: text('delivery_method').notNull(),
  courierTrackingNumber: text('courier_tracking_number'),
  documents: jsonb('documents').$type<DocumentChecklistItem[]>().notNull(),
  remarks: text('remarks'),
  notified: boolean('notified').default(false).notNull(),
  notificationTimestamp: text('notification_timestamp'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Simulated Emails log table
export const simulatedEmails = pgTable('simulated_emails', {
  id: text('id').primaryKey(),
  submissionId: text('submission_id')
    .references(() => submissions.id, { onDelete: 'cascade' })
    .notNull(),
  recipientEmail: text('recipient_email').notNull(),
  recipientName: text('recipient_name').notNull(),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  timestamp: text('timestamp').notNull(), // ISO Date String
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  user: text('user').notNull().references(() => users.username), // stores username, not full_name
  role: text('role').notNull(),
  action: text('action').notNull(), // AuditActionType
  details: text('details').notNull(),
  targetId: text('target_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  check('chk_audit_logs_action', sql`${table.action} IN ('CREATE', 'DELETE', 'UPDATE', 'IMPORT', 'EXPORT', 'RESET')`),
]);

// Checklist templates table for dynamic requirement checklists
export const checklistTemplates = pgTable('checklist_templates', {
  id: text('id').primaryKey(),
  purpose: text('purpose').notNull().references(() => purposes.name),
  name: text('name').notNull(),
  required: boolean('required').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Singleton config row for the admin-customizable email subject/body template.
// Always accessed/written as id = 1 (enforced by chk_email_template_config_singleton).
export const emailTemplateConfig = pgTable('email_template_config', {
  id: serial('id').primaryKey(),
  subjectFormat: text('subject_format').notNull(),
  bodyFormat: text('body_format'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  check('chk_email_template_config_singleton', sql`${table.id} = 1`),
]);
