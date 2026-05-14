import React, { useState } from 'react';
import { 
  PlusIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CameraIcon,
  PaperClipIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  InformationCircleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import CommentSection from './CommentSection';
import PrintableRequest from './PrintableRequest';

const RequesterDashboard = ({ notify }) => {
  const [showForm, setShowForm] = useState(false);
  const [providerType, setProviderType] = useState('IT');
  const [priority, setPriority] = useState('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [location, setLocation] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeComment, setDisputeComment] = useState('');
  
  const [requests, setRequests] = useState([
    { id: 1, tracking_no: 'SR-2026-001', title: 'Network Outage in HR', status: 'Pending Review', priority: 'High', date: '2026-05-13' },
    { id: 2, tracking_no: 'SR-2026-002', title: 'Printer Repair - Finance', status: 'Accepted', priority: 'Medium', date: '2026-05-12' },
  ]);

  const fetchRequests = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests`);
      const data = await res.json();
      setRequests(data.map(r => ({
        ...r,
        date: new Date(r.created_at).toISOString().split('T')[0]
      })));
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!requestedBy.trim()) {
      notify('Full Name is required for accountability', 'error');
      return;
    }
    if (!title.trim()) {
      notify('Please provide a descriptive subject/title', 'error');
      return;
    }
    if (description.trim().length < 10) {
      notify('Description is too short. Please provide at least 10 characters for better diagnostics.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const host = window.location.hostname || 'localhost';
      const url = `http://${host}:5001/api/requests`;
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('location', location);
      formData.append('requested_by', requestedBy);
      formData.append('provider_type', providerType);
      formData.append('requester_id', 1);
      if (attachment) {
        formData.append('attachment', attachment);
      }
      
      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setShowForm(false);
        fetchRequests();
        // Reset form
        setTitle('');
        setDescription('');
        setRequestedBy('');
        setLocation('');
      } else {
        const error = await res.json();
        notify('Submission failed: ' + error.message, 'error');
      }
    } catch (err) {
      console.error('Submit error:', err);
      notify('Could not connect to the server. Please check if the backend is running.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestLogs, setRequestLogs] = useState([]);
  const [requestParts, setRequestParts] = useState([]);

  const handleAcknowledge = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Closed',
          rating,
          feedback: feedbackComment
        })
      });
      fetchRequests();
      setSelectedRequest(null);
      setIsRatingOpen(false);
      setRating(0);
      setFeedbackComment('');
      notify('Thank you for your feedback! Request closed.');
    } catch (err) {
      console.error('Acknowledge error:', err);
    }
  };

  const handleDispute = async () => {
    if (!disputeComment.trim()) {
      alert('Please provide a reason for the dispute.');
      return;
    }
    try {
      const host = window.location.hostname || 'localhost';
      // 1. Add Dispute Log
      await fetch(`http://${host}:5001/api/requests/${selectedRequest.id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staff_id: 1, 
          notes: `JOB DISPUTED: ${disputeComment}`
        })
      });

      // 2. Move status back to Assigned
      await fetch(`http://${host}:5001/api/requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Assigned' })
      });
      // 3. Move workflow back to Step 3 (Resolution)
      await fetch(`http://${host}:5001/api/requests/${selectedRequest.id}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 3, notes: 'REOPENED DUE TO DISPUTE' })
      });
      
      fetchRequests();
      setSelectedRequest(null);
      setIsDisputeOpen(false);
      setDisputeComment('');
      notify('Job disputed. Returned to technician.', 'error');
    } catch (err) {
      console.error('Dispute error:', err);
    }
  };

  const fetchDetails = async (reqId) => {
    try {
      const host = window.location.hostname || 'localhost';
      const [logsRes, partsRes] = await Promise.all([
        fetch(`http://${host}:5001/api/requests/${reqId}/logs`),
        fetch(`http://${host}:5001/api/requests/${reqId}/parts`)
      ]);
      const logsData = await logsRes.json();
      const partsData = await partsRes.json();
      setRequestLogs(Array.isArray(logsData) ? logsData : []);
      setRequestParts(Array.isArray(partsData) ? partsData : []);
    } catch (err) {
      console.error('Fetch details error:', err);
    }
  };

  const handleSelectRequest = (req) => {
    setSelectedRequest(req);
    setIsRatingOpen(false);
    setIsDisputeOpen(false);
    setRating(0);
    setFeedbackComment('');
    setDisputeComment('');
    fetchDetails(req.id);
  };

  const handleFollowUp = async (id) => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${id}/nudge`, { method: 'POST' });
      fetchRequests();
      notify('Follow-up alert sent to department!');
    } catch (err) {
      console.error('Follow-up error:', err);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredRequests = requests.filter(req => {
    const trackingNo = req.tracking_no || '';
    const title = req.title || '';
    const matchesSearch = trackingNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || req.provider_type === filterType;
    const matchesStatus = filterStatus === 'All' || 
                          (filterStatus === 'Pending' && req.status === 'Pending Review') ||
                          (filterStatus === 'Active' && ['Accepted', 'Assigned'].includes(req.status)) ||
                          (filterStatus === 'Closed' && ['Closed', 'Completed'].includes(req.status));
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = [
    { id: 'All', label: 'All Requests', value: requests.length, color: 'text-white' },
    { id: 'Pending', label: 'Pending Review', value: requests.filter(r => r.status === 'Pending Review').length, color: 'text-yellow-400' },
    { id: 'Active', label: 'In Progress', value: requests.filter(r => ['Accepted', 'Assigned'].includes(r.status)).length, color: 'text-it-cyan' },
    { id: 'Closed', label: 'Closed / Finalized', value: requests.filter(r => ['Closed', 'Completed'].includes(r.status)).length, color: 'text-green-400' },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8">
      <div className="no-print">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Service Portal</h1>
            <p className="text-white/40 text-sm mt-1">Manage and track your department's service requests</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 px-8 py-4 shadow-lg shadow-it-cyan/10"
          >
            <PlusIcon className="w-5 h-5" /> New Service Request
          </button>
        </div>

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <button 
              key={s.label} 
              onClick={() => setFilterStatus(s.id)}
              className={`glass-card p-6 border-white/5 relative overflow-hidden group text-left transition-all ${
                filterStatus === s.id ? 'ring-2 ring-it-cyan/50 bg-white/[0.08]' : 'hover:bg-white/5'
              }`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-current ${s.color} opacity-20`}></div>
              <span className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-black mb-3 block">{s.label}</span>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-black ${s.color}`}>{s.value}</span>
              </div>
            </button>
          ))}
        </div>
      
        {/* Control Bar */}
        <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center border-white/5">
          <div className="relative flex-1 w-full">
            <input 
              type="text" 
              placeholder="Search by Tracking No or Title..." 
              className="input-field pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <PlusIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/20 rotate-45" />
          </div>
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5 w-full md:w-auto">
            {['All', 'IT', 'Engineering'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  filterType === t ? 'bg-it-cyan text-black shadow-lg shadow-it-cyan/20' : 'text-white/40 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
        </div>
      </div>
      
      <div className="grid gap-4">
        {filteredRequests.map((req) => (
          <motion.div 
            whileHover={{ x: 10 }}
            key={req.id} 
            onClick={() => handleSelectRequest(req)}
            className={`glass-card p-6 cursor-pointer group flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 transition-all hover:bg-white/[0.04] relative overflow-hidden ${
              req.status === 'Rejected' ? 'border-l-red-500 shadow-[0_10px_30px_rgba(239,68,68,0.1)]' :
              req.status === 'Completed' ? 'border-l-green-500 shadow-[0_10px_30px_rgba(34,197,94,0.1)]' :
              'border-l-it-cyan shadow-[0_10px_30px_rgba(0,255,255,0.05)]'
            }`}
          >
            {/* Background Status Stamp */}
            <div className={`absolute right-1/4 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.08] text-5xl font-black uppercase tracking-[0.2em] transition-all group-hover:opacity-20 group-hover:scale-110 ${
              req.status === 'Rejected' ? 'text-red-500' :
              req.status === 'Completed' ? 'text-green-500' :
              req.status === 'Pending Review' ? 'text-yellow-500' :
              'text-it-cyan'
            }`}>
              {req.status}
            </div>

            <div className="flex items-center gap-6 flex-1 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                req.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                req.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                'bg-it-cyan/10 text-it-cyan border border-it-cyan/20'
              }`}>
                {req.status === 'Rejected' ? <XCircleIcon className="w-8 h-8" /> : 
                 req.status === 'Completed' ? <CheckCircleIcon className="w-8 h-8" /> :
                 <ClockIcon className="w-8 h-8" />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded uppercase tracking-widest">{req.tracking_no}</span>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-black tracking-widest ${
                    req.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/20' : 
                    req.priority === 'High' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' :
                    req.priority === 'Medium' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                    'bg-white/5 text-white/40 border border-white/10'
                  }`}>
                    {req.priority}
                  </span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight italic">{req.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-bold">
                    {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Date TBD'} • {req.location || 'Site TBD'}
                  </p>
                  {req.status === 'Rejected' && (
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-400/5 px-2 py-0.5 rounded border border-red-400/10 animate-pulse">Action Required</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex items-center gap-4 relative z-10">
              <span className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-black">Details</span>
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-it-cyan transition-all group-hover:bg-it-cyan group-hover:text-black">
                <PlusIcon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="glass-card p-20 text-center border-dashed border-white/5">
            <InformationCircleIcon className="w-12 h-12 text-white/5 mx-auto mb-4" />
            <p className="text-white/20 uppercase tracking-widest text-sm font-bold">No matching requests found</p>
            <button onClick={() => {setSearchQuery(''); setFilterType('All');}} className="text-it-cyan text-xs mt-4 hover:underline">Clear all filters</button>
          </div>
        )}
      </div>

      {/* Mock Modal for Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-2xl p-8 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl">Submit New Request</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setProviderType('IT')}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                    providerType === 'IT' ? 'border-it-cyan bg-it-cyan/10 text-it-cyan' : 'border-white/10 text-white/40'
                  }`}
                >
                  <CpuChipIcon className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">IT Service</span>
                </button>
                <button 
                  onClick={() => setProviderType('Engineering')}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                    providerType === 'Engineering' ? 'border-eng-orange bg-eng-orange/10 text-eng-orange' : 'border-white/10 text-white/40'
                  }`}
                >
                  <WrenchScrewdriverIcon className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Engineering</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Requesting Personnel (Manual Entry)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Full Name of Requestor..." 
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Location (Optional)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Ward 7, Room 102..." 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Request Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Brief summary of the issue..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Priority Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Low', color: 'border-white/10 text-white/40' },
                    { id: 'Medium', color: 'border-green-400 bg-green-400/20 text-green-400' },
                    { id: 'High', color: 'border-purple-400 bg-purple-400/20 text-purple-400' },
                    { id: 'Urgent', color: 'border-red-500 bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPriority(p.id)}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                        priority === p.id 
                        ? p.color
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Issue Description</label>
                <textarea 
                  className="input-field h-32 resize-none" 
                  placeholder="Describe the problem in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Supporting Attachment (Optional)</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex-1">
                    <div className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3 transition-all ${
                      attachment ? 'border-it-cyan bg-it-cyan/10' : 'border-white/10 hover:border-white/20'
                    }`}>
                      <CameraIcon className={`w-8 h-8 ${attachment ? 'text-it-cyan' : 'text-white/20'}`} />
                      <span className="text-xs text-white/40">
                        {attachment ? attachment.name : 'Click to upload photo or document'}
                      </span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => setAttachment(e.target.files[0])}
                    />
                  </label>
                  {attachment && (
                    <button 
                      onClick={() => setAttachment(null)}
                      className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-4">Cancel</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex-1 py-4">
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detailed Request Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedRequest(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          {/* Drawer Content */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="glass-card w-full max-w-xl h-full relative z-10 rounded-none border-l border-white/10 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <span className="text-[10px] font-mono text-it-cyan uppercase tracking-widest block mb-1">Request Control Panel</span>
                <h3 className="text-xl font-bold">{selectedRequest.tracking_no}</h3>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleFollowUp(selectedRequest.id)}
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/10"
                >
                  <HandThumbUpIcon className="w-4 h-4" /> Follow Up
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-it-cyan/10 border border-it-cyan/30 text-it-cyan text-[10px] font-black uppercase tracking-widest hover:bg-it-cyan hover:text-black transition-all flex items-center gap-2"
                >
                  <PrinterIcon className="w-4 h-4" /> Print ISO Form
                </button>
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6 text-white/40" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Status Banner */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-bold leading-tight">{selectedRequest.title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-6 py-4">
                  <div className={`px-10 py-4 rounded-2xl border-[3px] font-black uppercase tracking-[0.4em] text-xl shadow-[0_15px_30px_rgba(0,0,0,0.4)] transform -rotate-2 -translate-y-1 ${
                    selectedRequest.status === 'Rejected' ? 'bg-red-500/10 border-red-500/60 text-red-500 shadow-red-500/20' :
                    selectedRequest.status === 'Completed' ? 'bg-green-500/10 border-green-500/60 text-green-400 shadow-green-500/20' :
                    selectedRequest.status === 'Pending Review' ? 'bg-yellow-500/10 border-yellow-500/60 text-yellow-500 shadow-yellow-500/20' :
                    'bg-it-cyan/10 border-it-cyan/60 text-it-cyan shadow-it-cyan/20'
                  }`}>
                    {selectedRequest.status}
                  </div>
                  <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-xs font-black uppercase tracking-[0.3em]">
                    {selectedRequest.priority} Priority
                  </div>
                </div>
              </div>

              {/* Asset Information (If Tagged) */}
              {(selectedRequest.asset_name || selectedRequest.asset_serial) && (
                <section className="p-6 rounded-2xl bg-it-cyan/5 border border-it-cyan/20">
                  <div className="flex items-center gap-2 mb-4">
                    <CpuChipIcon className="w-4 h-4 text-it-cyan" />
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-it-cyan font-black">Registered Equipment Metadata</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-[10px] text-white/20 uppercase block mb-1">Asset Name</span>
                      <p className="text-sm font-bold">{selectedRequest.asset_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/20 uppercase block mb-1">Model / SN</span>
                      <p className="text-sm font-mono">{selectedRequest.asset_model} <span className="opacity-40">/</span> {selectedRequest.asset_serial}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Resolution Timeline (Technical Logs) */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <ClockIcon className="w-4 h-4 text-white/20" />
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black">Technical Progress Timeline</h4>
                </div>
                <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                  {/* Initial Submission (Oldest Event - Top) */}
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-4 border-black bg-white/20" />
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-white/60">Initial Request</span>
                      <span className="text-[10px] text-white/20">{new Date(selectedRequest.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-white/20">Ticket opened by {selectedRequest.requested_by || 'Requester'}.</p>
                  </div>

                  {requestLogs.length > 0 ? (
                    [...requestLogs].reverse().map((log, idx, arr) => (
                      <div key={log.id} className="relative pl-8">
                        <div className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-4 border-black ${idx === arr.length - 1 && selectedRequest.status !== 'Completed' ? 'bg-it-cyan shadow-[0_0_10px_rgba(0,242,255,0.8)]' : 'bg-white/10'}`} />
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs font-bold uppercase tracking-widest ${!log.staff_name ? 'text-it-cyan' : 'text-white/80'}`}>
                            {log.staff_name || 'Administrative Adjustment'}
                          </span>
                          <span className="text-[10px] text-white/20">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <div className={`p-4 rounded-xl text-sm leading-relaxed ${!log.staff_name ? 'bg-it-cyan/5 border border-it-cyan/10 text-white/80 italic' : 'text-white/40'}`}>
                          {log.notes}
                        </div>
                      </div>
                    ))
                  ) : (
                    selectedRequest.status !== 'Completed' && (
                      <div className="pl-8 text-sm text-white/20 italic opacity-40">Awaiting technical assessment findings...</div>
                    )
                  )}

                  {/* Completed Status (Newest Event - Bottom) */}
                  {selectedRequest.status === 'Completed' && (
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-4 border-black bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Job Concluded</span>
                        <span className="text-[10px] text-white/20">{selectedRequest.updated_at ? new Date(selectedRequest.updated_at).toLocaleString() : 'Done'}</span>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed italic mb-4">The service process is complete and awaiting your validation.</p>
                      
                      {selectedRequest.completion_attachment_url && (
                        <div className="mt-4 group relative inline-block">
                           <img 
                              src={`http://${window.location.hostname || 'localhost'}:5001${selectedRequest.completion_attachment_url}`} 
                              alt="Proof of Work"
                              className="w-48 h-32 object-cover rounded-xl border border-white/10 hover:border-green-500/50 transition-all cursor-pointer shadow-lg"
                              onClick={() => window.open(`http://${window.location.hostname || 'localhost'}:5001${selectedRequest.completion_attachment_url}`, '_blank')}
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl pointer-events-none">
                              <span className="text-[8px] font-black uppercase tracking-widest text-white">View Full Res</span>
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Parts Replacement List */}
              {requestParts.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <WrenchScrewdriverIcon className="w-4 h-4 text-it-cyan" />
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black">Hardware Components Replaced</h4>
                  </div>
                  <div className="grid gap-3">
                    {requestParts.map(part => (
                      <div key={part.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-white/80">{part.part_name}</p>
                          <p className="text-[10px] font-mono text-white/20 uppercase">Serial: {part.serial_no}</p>
                        </div>
                        <CheckCircleIcon className="w-5 h-5 text-green-400 opacity-20" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Original Description Summary */}
              <section className="pt-8 border-t border-white/5 pb-8">
                <h4 className="text-[10px] uppercase tracking-widest text-white/20 mb-4 font-bold">Request Summary</h4>
                <div className="p-6 rounded-2xl bg-black/40 text-sm text-white/60 leading-relaxed border border-white/5 mb-8">
                  {selectedRequest.description}
                </div>

                <CommentSection 
                  requestId={selectedRequest.id} 
                  userName={selectedRequest.requested_by || 'Requester'} 
                  userRole="Requester"
                />
              </section>
            </div>

            {/* Drawer Footer / Actions */}
            {selectedRequest.status === 'Completed' && (
              <div className="p-8 border-t border-white/10 bg-white/[0.02] space-y-6">
                {isRatingOpen ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex items-center gap-2 text-it-cyan">
                      <StarIcon className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Rate our Service</h4>
                    </div>
                    
                    <div className="flex justify-center gap-4 py-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setRating(s)}
                          className="transition-all hover:scale-125"
                        >
                          <StarIcon className={`w-10 h-10 ${rating >= s ? 'text-it-cyan fill-it-cyan' : 'text-white/10'}`} />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 opacity-40">
                        <ChatBubbleLeftEllipsisIcon className="w-3 h-3" />
                        <label className="text-[10px] uppercase tracking-widest font-bold">Additional Comments (Optional)</label>
                      </div>
                      <textarea 
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        className="input-field min-h-[100px] text-xs pt-3"
                        placeholder="Tell us how we did..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setIsRatingOpen(false)} className="btn-secondary px-6 text-[10px] uppercase tracking-widest">Back</button>
                      <button 
                        onClick={handleAcknowledge}
                        disabled={rating === 0}
                        className="btn-primary flex-1 bg-it-cyan text-black py-4 font-black uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:grayscale"
                      >
                        Submit Feedback & Finalize
                      </button>
                    </div>
                  </motion.div>
                ) : isDisputeOpen ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex items-center gap-2 text-eng-orange">
                      <XCircleIcon className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Dispute Service Repair</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 opacity-40 text-eng-orange">
                        <ChatBubbleLeftEllipsisIcon className="w-3 h-3" />
                        <label className="text-[10px] uppercase tracking-widest font-bold">Reason for Dispute</label>
                      </div>
                      <textarea 
                        value={disputeComment}
                        onChange={(e) => setDisputeComment(e.target.value)}
                        className="input-field min-h-[120px] text-xs pt-3 border-eng-orange/20"
                        placeholder="Please explain why the repair was unsuccessful..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setIsDisputeOpen(false)} className="btn-secondary px-6 text-[10px] uppercase tracking-widest">Back</button>
                      <button 
                        onClick={handleDispute}
                        disabled={!disputeComment.trim()}
                        className="btn-primary flex-1 bg-eng-orange text-black py-4 font-black uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:grayscale"
                      >
                        Submit Dispute & Return to Tech
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2 text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Validation Required</h4>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      The technical team has finalized this request. Please acknowledge the completion or dispute if issues persist.
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsRatingOpen(true)}
                        className="btn-primary flex-1 bg-green-500 text-black py-4 font-black uppercase tracking-widest text-[10px]"
                      >
                        Acknowledge & Close
                      </button>
                      <button 
                        onClick={() => setIsDisputeOpen(true)}
                        className="btn-secondary flex-1 border-red-400/20 text-red-400 py-4 font-black uppercase tracking-widest text-[10px]"
                      >
                        Dispute Repair
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
      </div>

      <div className="print-only">
        {selectedRequest && (
          <PrintableRequest 
            request={selectedRequest} 
            logs={requestLogs} 
            parts={requestParts} 
          />
        )}
      </div>
    </div>
    </>
  );
};

export default RequesterDashboard;
