import React from 'react';

const PrintableRequest = ({ request, logs, parts }) => {
  return (
    <div className="print-form bg-white text-black p-10 font-serif w-[210mm] h-[297mm] mx-auto print:shadow-none print:p-0 flex flex-col justify-between overflow-hidden relative">
      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print-form { margin: 0 !important; width: 100% !important; height: 100vh !important; position: relative; }
          .watermark { display: block !important; }
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          color: rgba(0,0,0,0.03);
          font-weight: 900;
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
        }
      `}</style>
      
      <div className="watermark uppercase tracking-[0.2em]">Controlled Copy</div>
      
      <div>
        {/* ISO Header */}
        <div className="border-b border-gray-300 pb-2 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tighter">Service Request Report</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">ISO 9001:2015 Certified Management System</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold uppercase">Ref: SRMS-OP-042</p>
            <p className="text-[8px] font-bold uppercase">Rev: 2.1 (2026)</p>
          </div>
        </div>

        {/* Primary Tracking Info */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="border-l border-gray-300 pl-3">
            <label className="text-[7px] font-bold uppercase text-gray-400 block mb-1">Tracking Number</label>
            <p className="text-base font-mono font-bold">{request.tracking_no}</p>
          </div>
          <div className="border-l border-gray-300 pl-3">
            <label className="text-[7px] font-bold uppercase text-gray-400 block mb-1">Date Generated</label>
            <p className="text-xs font-bold">{new Date().toLocaleString()}</p>
          </div>
          <div className="border-l border-gray-300 pl-3">
            <label className="text-[7px] font-bold uppercase text-gray-400 block mb-1">Security Class</label>
            <p className="text-xs font-bold uppercase">Internal Operations</p>
          </div>
        </div>

        {/* Section 1: Requester Information */}
        <section className="mb-6">
          <h2 className="border-b border-gray-300 text-black px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest mb-3">Section 1: Request Origin & Identity</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
            <div><span className="font-bold uppercase text-[9px] text-gray-400 mr-2 w-24 inline-block">Requestor:</span> {request.requested_by || 'N/A'}</div>
            <div><span className="font-bold uppercase text-[9px] text-gray-400 mr-2 w-24 inline-block">Dept:</span> {request.provider_type} Support</div>
            <div><span className="font-bold uppercase text-[9px] text-gray-400 mr-2 w-24 inline-block">Location:</span> {request.location || 'Not Specified'}</div>
            <div><span className="font-bold uppercase text-[9px] text-gray-400 mr-2 w-24 inline-block">Priority:</span> <span className="font-bold uppercase">{request.priority}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="font-bold uppercase text-[9px] text-gray-400 block mb-1">Subject Title:</span>
            <p className="text-base font-bold italic">{request.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-tight line-clamp-2">{request.description}</p>
          </div>
        </section>

        {/* Section 2: Technical Assessment */}
        <section className="mb-6">
          <h2 className="border-b border-gray-300 text-black px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest mb-3">Section 2: Technical Findings</h2>
          <div className="space-y-2 max-h-32 overflow-hidden">
            {logs && logs.length > 0 ? logs.slice(0, 3).map((log, i) => (
              <div key={i} className="border-b border-gray-50 pb-1 flex gap-3 items-start">
                <span className="text-[7px] font-mono text-gray-400 w-16 shrink-0 mt-0.5">{new Date(log.created_at).toLocaleDateString()}</span>
                <div>
                  <p className="text-[9px] font-bold uppercase">{log.staff_name}</p>
                  <p className="text-xs line-clamp-1">{log.notes}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs italic text-gray-400">No technical logs recorded.</p>
            )}
          </div>
        </section>

        {/* Section 3: Asset & Hardware Details */}
        <section className="mb-6">
          <h2 className="border-b border-gray-300 text-black px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest mb-3">Section 3: Asset & Parts Reconciliation</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-2 rounded border border-gray-100">
              <h4 className="text-[7px] font-bold uppercase mb-1">Target Asset Data</h4>
              <p className="text-[9px] leading-tight">
                <strong>Name:</strong> {request.asset_name || 'N/A'}<br/>
                <strong>Model:</strong> {request.asset_model || 'N/A'}<br/>
                <strong>Serial:</strong> {request.asset_serial || 'N/A'}<br/>
                <strong>Property No:</strong> {request.asset_property || 'N/A'}
              </p>
            </div>
            <div className="p-2 rounded border border-gray-100">
              <h4 className="text-[7px] font-bold uppercase mb-1">Hardware Ledger</h4>
              {parts && parts.length > 0 ? (
                <ul className="text-[9px] space-y-0.5">
                  {parts.slice(0, 4).map((p, i) => (
                    <li key={i} className="flex justify-between border-b border-gray-100 pb-0.5">
                      <span>{p.part_name}</span>
                      <span className="font-mono text-gray-400">{p.serial_no}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[10px] italic text-gray-400">No parts replaced.</p>}
            </div>
          </div>
        </section>

        {/* Section 4: Visual Verification */}
        {request.completion_attachment_url && (
          <section className="mb-6">
            <h2 className="border-b border-gray-300 text-black px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest mb-3">Section 4: Site Verification Photography</h2>
            <div className="flex justify-between items-start">
               <div className="border border-gray-200 p-1.5 rounded flex items-center gap-4">
                 <img 
                     src={`http://${window.location.hostname || 'localhost'}:5001${request.completion_attachment_url}`} 
                     alt="Verification"
                     className="h-24 rounded grayscale contrast-125"
                 />
                 <div>
                   <p className="text-[8px] font-bold uppercase text-gray-400 mb-1">Authenticity ID</p>
                   <p className="text-[10px] font-mono uppercase font-bold">{request.tracking_no}-VER-1</p>
                 </div>
               </div>
               
               <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center text-center p-2">
                  <p className="text-[7px] font-bold uppercase text-gray-200 leading-tight">QA / QC<br/>OFFICIAL<br/>STAMP</p>
               </div>
            </div>
          </section>
        )}
      </div>

      <div>
        {/* Footer Signatures */}
        <div className="grid grid-cols-2 gap-12 mb-6">
          <div className="border-t border-gray-300 pt-2">
            <p className="text-[8px] font-bold uppercase mb-8 text-gray-500 text-center italic opacity-30">Authorized Technical Signature</p>
            <div className="flex justify-between text-[9px] font-bold">
               <span>NAME: _________________</span>
               <span>DATE: ____________</span>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-2">
            <p className="text-[8px] font-bold uppercase mb-8 text-gray-500 text-center italic opacity-30">User Acceptance Certification</p>
            <div className="flex justify-between text-[9px] font-bold">
               <span>NAME: _________________</span>
               <span>DATE: ____________</span>
            </div>
          </div>
        </div>

        <div className="text-center text-[7px] text-gray-300 uppercase tracking-[0.5em] border-t border-gray-50 pt-2">
          End of Official Document - SRMS ISO Control System - Page 1 of 1
        </div>
      </div>
    </div>
  );
};

export default PrintableRequest;
