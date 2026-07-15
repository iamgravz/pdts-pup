import React from 'react';
import { PUPSubmission } from '../types';
import { Mail, Check, AlertCircle, Info } from 'lucide-react';
import PUPLogo from './PUPLogo';

interface EmailTemplateViewProps {
  submission: PUPSubmission;
}

export default function EmailTemplateView({ submission }: EmailTemplateViewProps) {
  const formattedDate = new Date(submission.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const checkedDocs = submission.documents.filter(d => d.checked);
  const missingDocs = submission.documents.filter(d => !d.checked && d.required);

  const studentDisplayName = submission.studentLastName
    ? `${submission.studentLastName}, ${submission.studentFirstName}`
    : (submission.studentName || '');

  return (
    <div className="bg-white text-gray-800 rounded-xl overflow-hidden border border-gray-200 shadow-xl max-w-2xl mx-auto">
      {/* Email Header Metadata */}
      <div className="bg-gray-50 p-4 border-b border-gray-200 text-xs text-gray-500 space-y-1.5 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-16 font-bold text-gray-400">FROM:</span>
          <span className="text-amber-600">PUP OUS Admission Records &lt;pupous_admission@pup.edu.ph&gt;</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 font-bold text-gray-400">TO:</span>
          <span className="text-emerald-600 font-semibold">{studentDisplayName} &lt;{submission.studentEmail}&gt;</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 font-bold text-gray-400">SUBJECT:</span>
          <span className="text-gray-900 font-medium">[PUP OUS] Document Requirements Received - {submission.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 font-bold text-gray-400">DATE:</span>
          <span>{new Date(submission.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-gray-200 text-[11px] text-red-600 font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>Disclaimer: This is an auto-generated system notification. Do not reply.</span>
        </div>
      </div>

      {/* Simulated Email Body Container */}
      <div className="p-6 bg-gray-100 text-gray-800">
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-lg mx-auto border border-gray-200">
          {/* Email Branding Banner */}
          <div className="bg-pup-maroon p-6 flex items-center justify-center gap-4 text-white">
           {/* Logo Container - Dito mo i-adjust ang laki gamit ang size prop */}
           <div className="shrink-0">
         <PUPLogo size={48} />
        </div>
  
       {/* Text Container - Nakalinya nang maayos sa tabi ng logo */}
     <div className="text-left">
     <h2 className="font-display font-extrabold text-sm tracking-wider m-0">
      POLYTECHNIC UNIVERSITY OF THE PHILIPPINES
    </h2>
    <p className="text-[10px] opacity-90 font-medium tracking-wide mt-0.5">
      OPEN UNIVERSITY SYSTEM • ADMISSION RECORD MONITORING
    </p>
  </div>
</div>

          {/* Email Body Content */}
          <div className="p-5 text-sm text-gray-700 space-y-4">
            <p className="font-medium text-gray-900">Hello, <strong className="text-gray-900">{studentDisplayName}</strong>!</p>
            <p className="leading-relaxed">
              This is an official verification that the PUP OUS Admission Office has received your academic documents for <strong>{submission.purpose}</strong>.
            </p>

            {/* Quick Process Reference Box */}
            <div className="bg-gray-50 border-l-4 border-pup-maroon p-4 rounded-r-lg space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Tracking Details</span>
              <p className="text-xs m-0">
                <strong>Reference / Process Code:</strong>{' '}
                <span className="font-mono text-sm text-pup-maroon font-bold">{submission.id}</span>
              </p>
              <p className="text-xs m-0">
                <strong>Delivery Method:</strong> {submission.deliveryMethod}
                {submission.courierTrackingNumber && (
                  <span className="font-mono text-[11px] text-gray-600 block mt-0.5 bg-gray-200/60 px-1.5 py-0.5 rounded w-fit">
                    Courier Ref: {submission.courierTrackingNumber}
                  </span>
                )}
              </p>
              <p className="text-xs m-0">
                <strong>Received Date:</strong> {formattedDate}
              </p>
            </div>

            {/* Submitted Documents Checklist */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-b border-gray-100 pb-1 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-600" />
                Received Documents:
              </h4>
              <ul className="space-y-1 pl-1">
                {checkedDocs.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-green-600 font-bold shrink-0">✓</span>
                    <span>{doc.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Essential Documents */}
            {missingDocs.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg space-y-1">
                <h4 className="font-bold text-rose-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Pending Essential Requirements (Deficiencies):
                </h4>
                <ul className="space-y-1 pl-1">
                  {missingDocs.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-rose-700">
                      <span className="text-rose-600 font-extrabold shrink-0">•</span>
                      <span>{doc.name}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-rose-800 italic mt-2 font-medium leading-normal">
                  Please submit the pending requirements as soon as possible to proceed with the processing of your application in the SIS.
                </p>
              </div>
            )}

            {/* Admin Remarks */}
            {submission.remarks && (
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider mb-1">Office Remarks / Instructions:</span>
                <p className="text-xs text-amber-900 leading-normal italic m-0">"{submission.remarks}"</p>
              </div>
            )}

            {/* Official Guidance Text */}
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs text-gray-600 space-y-1">
              <span className="font-bold text-gray-700">Guidelines and Next Steps:</span>
              <p className="m-0 leading-normal">
                1. Your documents are now scheduled for physical folder verification.
              </p>
              <p className="m-0 leading-normal">
                2. The OUS Admin will now input your submission status into the **PUP Student Information System (SIS)**. Please monitor your official portal evaluation.
              </p>
            </div>

            {/* Divider and Footer */}
            <hr className="border-0 border-t border-gray-100 my-4" />
            <div className="text-center text-[10px] text-gray-400 space-y-1 font-medium">
              <p className="text-gray-500 uppercase font-semibold">POLYTECHNIC UNIVERSITY OF THE PHILIPPINES</p>
              <p>Anonas Street, Sta. Mesa, Manila, Philippines</p>
              <p className="text-pup-maroon font-bold mt-2 font-mono">PLEASE DO NOT REPLY TO THIS EMAIL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
