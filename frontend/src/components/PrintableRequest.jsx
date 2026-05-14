import React from 'react';

const PrintableRequest = ({ request, logs, parts }) => {
  return (
    <div className="print-form bg-white text-black p-10 font-serif w-[210mm] min-h-[297mm] mx-auto shadow-2xl print:shadow-none print:p-0">
      {/* ISO Header */}
      <div className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Service Request Report</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">ISO 9001:2015 Certified Management System</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase">Document Ref: SRMS-OP-042</p>
          <p className="text-[10px] font-bold uppercase">Revision: 2.1 (2026)</p>
        </div>
      </div>

      {/* Primary Tracking Info */}
      <div className="grid grid-cols-3 gap-8 mb-10">
        <div className="border-l-2 border-black pl-4">
          <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Tracking Number</label>
          <p className="text-xl font-mono font-black">{request.tracking_no}</p>
        </div>
        <div className="border-l-2 border-black pl-4">
          <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Date Generated</label>
          <p className="text-sm font-bold">{new Date().toLocaleString()}</p>
        </div>
        <div className="border-l-2 border-black pl-4">
          <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Security Class</label>
          <p className="text-sm font-bold uppercase">Internal Operations</p>
        </div>
      </div>

      {/* Section 1: Requester Information */}
      <section className="mb-8">
        <h2 className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4">Section 1: Request Origin & Identity</h2>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div><span className="font-bold uppercase text-[10px] text-gray-400 mr-2 w-32 inline-block">Requestor Name:</span> {request.requested_by || 'N/A'}</div>
          <div><span className="font-bold uppercase text-[10px] text-gray-400 mr-2 w-32 inline-block">Department:</span> {request.provider_type} Support</div>
          <div><span className="font-bold uppercase text-[10px] text-gray-400 mr-2 w-32 inline-block">Location:</span> {request.location || 'Not Specified'}</div>
          <div><span className="font-bold uppercase text-[10px] text-gray-400 mr-2 w-32 inline-block">Priority Level:</span> <span className="font-black uppercase">{request.priority}</span></div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="font-bold uppercase text-[10px] text-gray-400 block mb-2">Subject Title:</span>
          <p className="text-lg font-bold italic">{request.title}</p>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{request.description}</p>
        </div>
      </section>

      {/* Section 2: Technical Assessment */}
      <section className="mb-8">
        <h2 className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4">Section 2: Technical Findings & Execution</h2>
        <div className="space-y-4">
          {logs && logs.length > 0 ? logs.map((log, i) => (
            <div key={i} className="border-b border-gray-100 pb-2 flex gap-4">
              <span className="text-[8px] font-mono text-gray-400 w-24 shrink-0">{new Date(log.created_at).toLocaleDateString()}</span>
              <div>
                <p className="text-[10px] font-black uppercase">{log.staff_name}</p>
                <p className="text-sm">{log.notes}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm italic text-gray-400">No technical logs recorded for this instance.</p>
          )}
        </div>
      </section>

      {/* Section 3: Asset & Hardware Details */}
      <section className="mb-8">
        <h2 className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4">Section 3: Asset Inventory & Parts Reconciliation</h2>
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <h4 className="text-[8px] font-black uppercase mb-2">Target Asset Data</h4>
            <p className="text-xs leading-relaxed">
              <strong>Name:</strong> {request.asset_name || 'N/A'}<br/>
              <strong>Model:</strong> {request.asset_model || 'N/A'}<br/>
              <strong>Serial:</strong> {request.asset_serial || 'N/A'}<br/>
              <strong>Property No:</strong> {request.asset_property || 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <h4 className="text-[8px] font-black uppercase mb-2">Hardware Ledger</h4>
            {parts && parts.length > 0 ? (
              <ul className="text-[10px] space-y-1">
                {parts.map((p, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{p.part_name}</span>
                    <span className="font-mono text-gray-400">{p.serial_no}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs italic text-gray-400">No parts replaced.</p>}
          </div>
        </div>
      </section>

      {/* Section 4: Visual Verification */}
      {request.completion_attachment_url && (
        <section className="mb-8">
          <h2 className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4">Section 4: Site Verification Photography</h2>
          <div className="border border-gray-200 p-2 rounded inline-block">
             <img 
                src={`http://${window.location.hostname || 'localhost'}:5001${request.completion_attachment_url}`} 
                alt="Verification Proof"
                className="max-h-48 rounded grayscale contrast-125"
             />
             <p className="text-[8px] text-gray-400 mt-2 font-mono uppercase text-center italic">Authenticity Proof ID: {request.tracking_no}-VER-1</p>
          </div>
        </section>
      )}

      {/* Footer Signatures */}
      <div className="mt-auto pt-10 grid grid-cols-2 gap-16">
        <div className="border-t border-black pt-4">
          <p className="text-[8px] font-black uppercase mb-12">Authorized Technical Signature</p>
          <div className="flex justify-between text-[10px]">
             <span>Date: _________________</span>
          </div>
        </div>
        <div className="border-t border-black pt-4">
          <p className="text-[8px] font-black uppercase mb-12">User Acceptance Certification</p>
          <div className="flex justify-between text-[10px]">
             <span>Date: _________________</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-[8px] text-gray-300 uppercase tracking-[0.5em]">
        End of Official Document - SRMS ISO Control System
      </div>
    </div>
  );
};

export default PrintableRequest;
