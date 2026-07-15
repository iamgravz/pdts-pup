/**
 * Types for the PUP OUS PUPOUS Requirement Monitoring System
 */

export type PurposeType = 
  | 'Admission - Graduation'
  | 'Admission - Bachelor'
  | 'Masteral'
  | 'Comprehensive Exam'
  | 'Deficiency';

export type DeliveryMethodType = 
  | 'Walk-in'
  | 'Courier'
  | 'LBC Express'
  | 'J&T Express';

export interface DocumentChecklistItem {
  name: string;
  checked: boolean;
  required: boolean;
}

export interface PUPSubmission {
  id: string; // Unique tracking ID, e.g. PUPOUS-2026-X9K3L
  timestamp: string; // ISO string
  dateString: string; // YYYY-MM-DD
  purpose: PurposeType;
  studentFirstName: string;
  studentMiddleName?: string;
  studentLastName: string;
  studentName?: string;
  studentEmail: string;
  contactNumber: string;
  deliveryMethod: DeliveryMethodType;
  courierTrackingNumber?: string; // e.g. LBC tracking number if provided
  documents: DocumentChecklistItem[];
  remarks?: string;
  notified: boolean;
  notificationTimestamp?: string;
}

export interface SimulatedEmail {
  id: string;
  submissionId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  timestamp: string;
}

export type UserRole = 'Head Admin' | 'Registrar Officer';

export interface UserAccount {
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  avatarUrl?: string;
  password?: string;
}

export type AuditActionType = 'CREATE' | 'DELETE' | 'UPDATE' | 'IMPORT' | 'EXPORT' | 'RESET';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: AuditActionType;
  details: string;
  targetId?: string;
}
