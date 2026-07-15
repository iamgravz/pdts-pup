import { PurposeType, DocumentChecklistItem, PUPSubmission, SimulatedEmail, UserAccount } from './types';

export const DEFAULT_CHECKLISTS: Record<PurposeType, DocumentChecklistItem[]> = {
  'Admission - Graduation': [
    { name: 'Application for Graduation-Admission Form', checked: false, required: true },
    { name: 'Academic Record Evaluation / Curriculum Sheet', checked: false, required: true },
    { name: 'PSA Birth Certificate (Original & Copy)', checked: false, required: true },
    { name: 'University Clearance Form', checked: false, required: true },
    { name: '2x2 ID Pictures with White Background (3pcs)', checked: false, required: true }
  ],
  'Admission - Bachelor': [
    { name: 'Application for Graduation (Bachelors)', checked: false, required: true },
    { name: 'Official Transcript of Records (TOR for Graduation)', checked: false, required: true },
    { name: 'PSA Birth Certificate (Original & Copy)', checked: false, required: true },
    { name: 'University Clearance Form (All Cleared)', checked: false, required: true },
    { name: 'Graduation & Picture Fee Receipts', checked: false, required: true },
    { name: 'Completed Academic Evaluation Sheet', checked: false, required: true }
  ],
  'Masteral': [
    { name: 'Transcript of Records (TOR) - Original', checked: false, required: true },
    { name: 'Honorable Dismissal / Transfer Credentials', checked: false, required: true },
    { name: 'PSA Birth Certificate (Original & Copy)', checked: false, required: true },
    { name: 'PSA Marriage Certificate (For Married Female)', checked: false, required: false },
    { name: 'Certificate of Employment (Min 2 years)', checked: false, required: true },
    { name: 'NBI / Police Clearance', checked: false, required: false },
    { name: '2x2 ID Pictures with White Background (3pcs)', checked: false, required: true },
    { name: 'Completed OUS Application Form with Photo', checked: false, required: true }
  ],
  'Comprehensive Exam': [
    { name: 'Certificate of Grades (Coursework Completed)', checked: false, required: true },
    { name: 'Comprehensive Exam Application Form', checked: false, required: true },
    { name: 'Proof of Tuition & Exam Payment Receipt', checked: false, required: true },
    { name: '2x2 ID Pictures with Name Tag (2pcs)', checked: false, required: true }
  ],
  'Deficiency': [
    { name: 'Deficiency Cover Sheet / Log Form', checked: false, required: true },
    { name: 'Specifically Flagged Missing Document', checked: false, required: true },
    { name: 'Letter of Explanation for Late Submission', checked: false, required: false }
  ]
};

// Generates a sequence of tracking numbers
export function generateTrackingNumber(index: number, year: number = new Date().getFullYear()): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PUPOUS-${year}-${randomStr}`;
}

export const INITIAL_SAMPLE_SUBMISSIONS: PUPSubmission[] = [
  {
    id: 'PUPOUS-2026-M8K3A',
    timestamp: '2026-07-01T09:15:00Z',
    dateString: '2026-07-01',
    purpose: 'Masteral',
    studentFirstName: 'Maria Leonora Teresa G.',
    studentLastName: 'Santos',
    studentName: 'Maria Leonora Teresa G. Santos',
    studentEmail: 'marialeonora.santos@gmail.com',
    contactNumber: '09171234567',
    deliveryMethod: 'LBC Express',
    courierTrackingNumber: 'LBC1002349051',
    documents: [
      { name: 'Transcript of Records (TOR) - Original', checked: true, required: true },
      { name: 'Honorable Dismissal / Transfer Credentials', checked: true, required: true },
      { name: 'PSA Birth Certificate (Original & Copy)', checked: true, required: true },
      { name: 'PSA Marriage Certificate (For Married Female)', checked: false, required: false },
      { name: 'Certificate of Employment (Min 2 years)', checked: true, required: true },
      { name: 'NBI / Police Clearance', checked: false, required: false },
      { name: '2x2 ID Pictures with White Background (3pcs)', checked: true, required: true },
      { name: 'Completed OUS Application Form with Photo', checked: true, required: true }
    ],
    remarks: 'Graduate admission docs received via LBC. TOR has a clear Copy for Evaluation remark.',
    notified: true,
    notificationTimestamp: '2026-07-01T09:16:12Z'
  },
  {
    id: 'PUPOUS-2026-J1D7B',
    timestamp: '2026-07-01T10:30:00Z',
    dateString: '2026-07-01',
    purpose: 'Admission - Bachelor',
    studentFirstName: 'Juan',
    studentLastName: 'Dela Cruz Jr.',
    studentName: 'Juan Dela Cruz Jr.',
    studentEmail: 'juandelacruz.jr@yahoo.com',
    contactNumber: '09228765432',
    deliveryMethod: 'Walk-in',
    documents: [
      { name: 'Grade 12 Report Card (Form 138) / SF10', checked: true, required: true },
      { name: 'Certificate of Good Moral Character', checked: true, required: true },
      { name: 'PSA Birth Certificate (Original & Copy)', checked: true, required: true },
      { name: '2x2 ID Pictures with White Background (3pcs)', checked: true, required: true },
      { name: 'Signed PUP OUS Undertaking Form', checked: true, required: true },
      { name: 'PUPCET OUS Application Slip', checked: true, required: false }
    ],
    remarks: 'Personal walk-in submission. Complete set of bachelors documents.',
    notified: true,
    notificationTimestamp: '2026-07-01T10:31:05Z'
  },
  {
    id: 'PUPOUS-2026-H4V9C',
    timestamp: '2026-07-01T11:45:00Z',
    dateString: '2026-07-01',
    purpose: 'Deficiency',
    studentFirstName: 'Hazel Joyce V.',
    studentLastName: 'Reyes',
    studentName: 'Hazel Joyce V. Reyes',
    studentEmail: 'hazeljoycereyes@outlook.com',
    contactNumber: '09355551234',
    deliveryMethod: 'J&T Express',
    courierTrackingNumber: 'JT9982310459',
    documents: [
      { name: 'Deficiency Cover Sheet / Log Form', checked: true, required: true },
      { name: 'Specifically Flagged Missing Document', checked: true, required: true },
      { name: 'Letter of Explanation for Late Submission', checked: false, required: false }
    ],
    remarks: 'Submitted missing Grade 12 Form 137 deficiency via J&T Express.',
    notified: true,
    notificationTimestamp: '2026-07-01T11:46:50Z'
  },
  {
    id: 'PUPOUS-2026-R2A5D',
    timestamp: '2026-07-01T14:20:00Z',
    dateString: '2026-07-01',
    purpose: 'Comprehensive Exam',
    studentFirstName: 'Ramon S.',
    studentLastName: 'Aquino',
    studentName: 'Ramon S. Aquino',
    studentEmail: 'raquino.mba@pup.edu.ph',
    contactNumber: '09088889900',
    deliveryMethod: 'Walk-in',
    documents: [
      { name: 'Certificate of Grades (Coursework Completed)', checked: true, required: true },
      { name: 'Comprehensive Exam Application Form', checked: true, required: true },
      { name: 'Proof of Tuition & Exam Payment Receipt', checked: false, required: true },
      { name: '2x2 ID Pictures with Name Tag (2pcs)', checked: true, required: true }
    ],
    remarks: 'Lacks Proof of Payment. Will email student that the receipt must be submitted prior to the exam weekend.',
    notified: true,
    notificationTimestamp: '2026-07-01T14:21:40Z'
  }
];

export const INITIAL_SAMPLE_EMAILS: SimulatedEmail[] = [
  {
    id: 'EML-2026-0001',
    submissionId: 'PUPOUS-2026-M8K3A',
    recipientEmail: 'marialeonora.santos@gmail.com',
    recipientName: 'Maria Leonora Teresa G. Santos',
    subject: '[PUP OUS] Admission Requirements Received - PUPOUS-2026-M8K3A',
    timestamp: '2026-07-01T09:16:12Z',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #800000; padding: 15px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">PUP OPEN UNIVERSITY SYSTEM</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Document Admission & Requirement Monitoring</p>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <p>Hello, <strong>Maria Leonora Teresa G. Santos</strong>!</p>
          <p>This is to confirm that the PUP OUS Office has received your academic documents for <strong>Masteral</strong>.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #800000; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #666; font-weight: bold;">Tracking Details</p>
            <p style="margin: 0 0 4px 0;"><strong>Process/Tracking No:</strong> <span style="font-family: monospace; font-size: 16px; color: #800000; font-weight: bold;">PUPOUS-2026-M8K3A</span></p>
            <p style="margin: 0 0 4px 0;"><strong>Received via:</strong> LBC Express (Courier Tracking: LBC1002349051)</p>
            <p style="margin: 0;"><strong>Received Date:</strong> July 1, 2026</p>
          </div>

          <h3 style="color: #800000; border-bottom: 1px solid #eeeeee; padding-bottom: 8px;">Documents Received:</h3>
          <ul style="padding-left: 20px;">
            <li>✓ Transcript of Records (TOR) - Original</li>
            <li>✓ Honorable Dismissal / Transfer Credentials</li>
            <li>✓ PSA Birth Certificate (Original & Copy)</li>
            <li>✓ Certificate of Employment (Min 2 years)</li>
            <li>✓ 2x2 ID Pictures with White Background (3pcs)</li>
            <li>✓ Completed OUS Application Form with Photo</li>
          </ul>
          
          <p style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px; border-radius: 6px; font-size: 14px; margin-top: 20px;">
            <strong>Important:</strong> Please keep this Process Number for your reference. It has been printed and attached to your physical folder/envelope. Your documents are now scheduled for SIS verification and evaluation.
          </p>

          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #777777; text-align: center; margin: 0;">
            This is an automated system notification. Please DO NOT reply directly to this email.<br />
            &copy; 2026 Polytechnic University of the Philippines - Open University System.
          </p>
        </div>
      </div>
    `
  },
  {
    id: 'EML-2026-0002',
    submissionId: 'PUPOUS-2026-J1D7B',
    recipientEmail: 'juandelacruz.jr@yahoo.com',
    recipientName: 'Juan Dela Cruz Jr.',
    subject: '[PUP OUS] Admission Requirements Received - PUPOUS-2026-J1D7B',
    timestamp: '2026-07-01T10:31:05Z',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #800000; padding: 15px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">PUP OPEN UNIVERSITY SYSTEM</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Document Admission & Requirement Monitoring</p>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <p>Hello, <strong>Juan Dela Cruz Jr.</strong>!</p>
          <p>This is to confirm that the PUP OUS Office has received your academic documents for <strong>Admission - Bachelor</strong>.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #800000; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #666; font-weight: bold;">Tracking Details</p>
            <p style="margin: 0 0 4px 0;"><strong>Process/Tracking No:</strong> <span style="font-family: monospace; font-size: 16px; color: #800000; font-weight: bold;">PUPOUS-2026-J1D7B</span></p>
            <p style="margin: 0 0 4px 0;"><strong>Received via:</strong> Walk-in (Personal Delivery)</p>
            <p style="margin: 0;"><strong>Received Date:</strong> July 1, 2026</p>
          </div>

          <h3 style="color: #800000; border-bottom: 1px solid #eeeeee; padding-bottom: 8px;">Documents Received:</h3>
          <ul style="padding-left: 20px;">
            <li>✓ Grade 12 Report Card (Form 138) / SF10</li>
            <li>✓ Certificate of Good Moral Character</li>
            <li>✓ PSA Birth Certificate (Original & Copy)</li>
            <li>✓ 2x2 ID Pictures with White Background (3pcs)</li>
            <li>✓ Signed PUP OUS Undertaking Form</li>
            <li>✓ PUPCET OUS Application Slip</li>
          </ul>
          
          <p style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px; border-radius: 6px; font-size: 14px; margin-top: 20px;">
            <strong>Important:</strong> Please keep this Process Number for your reference. It has been printed and attached to your physical folder/envelope. Your documents are now scheduled for SIS verification and evaluation.
          </p>

          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #777777; text-align: center; margin: 0;">
            This is an automated system notification. Please DO NOT reply directly to this email.<br />
            &copy; 2026 Polytechnic University of the Philippines - Open University System.
          </p>
        </div>
      </div>
    `
  }
];


