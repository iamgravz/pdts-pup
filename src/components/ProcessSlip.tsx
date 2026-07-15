import React from 'react';
import { PUPSubmission } from '../types';
import { Calendar, User, FileText, Check, Tag } from 'lucide-react';
import PUPLogo from './PUPLogo';

interface ProcessSlipProps {
  submission: PUPSubmission;
}

export default function ProcessSlip({ submission }: ProcessSlipProps) {
  const formattedDate = new Date(submission.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const checkedCount = submission.documents.filter(d => d.checked).length;
  const totalCount = submission.documents.length;

  return (
    <div className="bg-white text-gray-900 border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm w-full max-w-md mx-auto" id="printable-slip">
      {/* Printable Header */}
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        <div className="flex justify-center items-center gap-2 mb-1">
          <PUPLogo size={32} />
          <span className="font-display font-bold text-sm tracking-widest text-pup-maroon">PUP OPEN UNIVERSITY SYSTEM</span>
        </div>
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Admission Requirement Monitoring</p>
        <div className="mt-3 inline-block bg-gray-100 px-3 py-1 rounded-md">
          <span className="font-mono font-bold text-base text-pup-maroon tracking-wider">{submission.id}</span>
        </div>
      </div>

      {/* Basic Student Info */}
      <div className="space-y-2 text-xs border-b border-gray-100 pb-4 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">STUDENT NAME:</span>
          <span className="font-bold text-right text-gray-900">
            {(submission.studentLastName 
              ? `${submission.studentLastName}, ${submission.studentFirstName}` 
              : (submission.studentName || '')
            ).toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">PURPOSE:</span>
          <span className="font-bold text-pup-maroon text-right">{submission.purpose}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">DELIVERY METHOD:</span>
          <span className="font-bold text-right">
            {submission.deliveryMethod}
            {submission.courierTrackingNumber && (
              <span className="block text-[10px] text-gray-500 font-mono">({submission.courierTrackingNumber})</span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">RECEIVED DATE:</span>
          <span className="font-mono text-right">{formattedDate}</span>
        </div>
        {submission.contactNumber && (
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">CONTACT NUMBER:</span>
            <span className="font-mono text-right">{submission.contactNumber}</span>
          </div>
        )}
      </div>

      {/* Submitted Requirements */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-display font-semibold text-xs text-gray-700 uppercase tracking-wider">Received Documents ({checkedCount}/{totalCount})</h4>
          <span className="text-[10px] font-semibold text-white bg-green-600 px-2 py-0.5 rounded-full uppercase">Logged</span>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          {submission.documents.map((doc, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              {doc.checked ? (
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <span className="w-3.5 h-3.5 border border-gray-300 rounded shrink-0 mt-0.5" />
              )}
              <span className={`text-[11px] ${doc.checked ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}`}>
                {doc.name}
                {doc.required && <span className="text-red-500 ml-1 font-bold">*</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Remarks Section */}
      {submission.remarks && (
        <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg text-xs mb-4">
          <span className="font-semibold text-amber-800 block mb-0.5">ADMIN REMARKS:</span>
          <p className="text-amber-900 text-[11px] leading-relaxed italic">"{submission.remarks}"</p>
        </div>
      )}

      {/* Footer / Cut Here */}
      <div className="pt-3 border-t-2 border-dashed border-gray-300 text-center text-[10px] text-gray-500 space-y-2">
        <p className="font-semibold">STAPLE / STICK THIS SLIP SECURELY TO THE DOCUMENT PACKAGE ENVELOPE</p>
        <div className="flex items-center justify-center gap-1 font-mono text-[9px] bg-gray-100 py-1 rounded text-gray-600">
          <span>* {submission.id} *</span>
        </div>
      </div>
    </div>
  );
}
