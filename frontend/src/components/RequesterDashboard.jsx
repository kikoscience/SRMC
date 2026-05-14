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
  PrinterIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import CommentSection from './CommentSection';
import PrintableRequest from './PrintableRequest';
import API_BASE_URL from '../config';

const RequesterDashboard = ({ notify, onPrint }) => {
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
      const res = await fetch(`${API_BASE_URL}/api/requests`);
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
      const url = `${API_BASE_URL}/api/requests`;
      
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

      // 2. Move status to Disputed
      await fetch(`http://${host}:5001/api/requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Disputed' })
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
    <div className="max-w-6xl mx-auto space-y-10 pb-20 no-print">
      {/* Hero Service Portal Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-12 shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-4">
              Service <span className="text-blue-400 underline decoration-blue-400/30 underline-offset-8">Portal</span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl leading-relaxed">
              Submit maintenance requests, track technical support progress, and manage your department's operational health in one unified command center.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { setProviderType('IT'); setShowForm(true); }}
              className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-it-cyan/50 hover:bg-it-cyan/5 transition-all text-center flex flex-col items-center gap-4 w-40"
            >
              <div className="w-16 h-16 rounded-2xl bg-it-cyan/10 flex items-center justify-center text-it-cyan group-hover:scale-110 transition-transform shadow-lg shadow-it-cyan/5">
                <CpuChipIcon className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">IT Support</span>
            </button>
            <button 
              onClick={() => { setProviderType('Engineering'); setShowForm(true); }}
              className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-eng-orange/50 hover:bg-eng-orange/5 transition-all text-center flex flex-col items-center gap-4 w-40"
            >
              <div className="w-16 h-16 rounded-2xl bg-eng-orange/10 flex items-center justify-center text-eng-orange group-hover:scale-110 transition-transform shadow-lg shadow-eng-orange/5">
                <WrenchScrewdriverIcon className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">Engineering</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterStatus(s.id)}
            className={`glass-card p-6 text-left border-white/5 relative overflow-hidden group hover:border-white/20 transition-all ${filterStatus === s.id ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}
          >
            <p className="text-[10px] uppercase tracking-widest text-white/20 font-black mb-1">{s.label}</p>
            <h4 className={`text-4xl font-black italic ${s.color}`}>{s.value}</h4>
          </button>
        ))}
      </div>
      
      <div className="flex flex-col lg:flex-row gap-10 mt-12">
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Service <span className="text-blue-400">Inventory</span></h2>
            <div className="relative group">
               <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search tracking no or subject..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-xs text-white focus:border-blue-500/50 outline-none w-80 transition-all focus:bg-white/[0.08]"
               />
            </div>
          </div>
      
          <div className="grid gap-4">
            {filteredRequests.length === 0 ? (
              <div className="glass-card p-20 text-center border-dashed border-2 border-white/5 opacity-40">
                <InformationCircleIcon className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <p className="uppercase tracking-[0.3em] font-black">No Records Match Query</p>
                <button onClick={() => {setSearchQuery(''); setFilterType('All');}} className="text-blue-400 text-xs mt-4 hover:underline uppercase tracking-widest font-black">Reset Console</button>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`glass-card group p-8 border-l-4 hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden ${
                    req.status === 'Disputed' ? 'animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.4)] border-red-500 bg-red-500/5' : ''
                  }`}
                  style={{ borderLeftColor: req.status === 'Disputed' ? '#ef4444' : (req.provider_type === 'IT' ? '#00f2ff' : '#ff8c00') }}
                  onClick={() => handleSelectRequest(req)}
                >
                  {req.status === 'Disputed' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
                  )}
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/[0.01] rounded-full -mr-16 -mt-16 group-hover:bg-white/[0.03] transition-colors" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-[10px] font-mono bg-white/5 text-white/60 px-3 py-1 rounded-lg tracking-widest border border-white/10 uppercase font-black">{req.tracking_no}</span>
                        <div className="flex items-center gap-1.5">
                           <div className={`w-1.5 h-1.5 rounded-full ${req.provider_type === 'IT' ? 'bg-it-cyan' : 'bg-eng-orange'}`} />
                           <span className="text-[10px] uppercase font-black tracking-widest text-white/40">{req.provider_type} DEPT</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mb-4 group-hover:text-blue-400 transition-colors leading-tight">{req.title}</h3>
                      <div className="flex items-center gap-6 opacity-30 group-hover:opacity-60 transition-opacity">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                          <ClockIcon className="w-4 h-4" />
                          {req.date}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                          <MapPinIcon className="w-4 h-4" />
                          {req.location || 'WARD_LOCATION_PENDING'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                         <p className="text-[8px] uppercase tracking-[0.3em] text-white/20 font-black mb-2">Protocol Status</p>
                         <span className={`text-[10px] font-black uppercase italic tracking-widest px-4 py-2 rounded-xl border ${
                           req.status === 'Completed' ? 'text-green-400 border-green-400/20 bg-green-400/5' :
                           req.status === 'Rejected' ? 'text-red-400 border-red-400/20 bg-red-400/5' :
                           req.status === 'Disputed' ? 'text-red-500 border-red-500/50 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
                           'text-blue-400 border-blue-400/20 bg-blue-400/5'
                         }`}>
                           {req.status}
                         </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onPrint({ request: req }); }}
                          className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/20 hover:text-white rounded-2xl transition-all border border-white/10"
                        >
                           <PrinterIcon className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center bg-white/5 group-hover:bg-blue-500 text-white/20 group-hover:text-black rounded-2xl transition-all border border-white/10 group-hover:border-blue-500 shadow-lg group-hover:shadow-blue-500/20">
                          <ChevronRightIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6 shrink-0">
          <div className="glass-card p-8 border-blue-500/20 bg-blue-500/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <HandThumbUpIcon className="w-20 h-20 text-blue-500" />
             </div>
             <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2 italic">Support Desk</h3>
             <p className="text-xs text-white/40 leading-relaxed mb-8">
                Need immediate technical intervention? Our command center technicians are available 24/7.
             </p>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-it-cyan/30 transition-colors">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20">IT EXTENSION</span>
                   <span className="text-lg font-mono text-it-cyan font-black">#404</span>
                </div>
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-eng-orange/30 transition-colors">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20">ENGINEERING</span>
                   <span className="text-lg font-mono text-eng-orange font-black">#911</span>
                </div>
             </div>
          </div>

          <div className="glass-card p-8 border-white/5 bg-white/[0.01]">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                   <InformationCircleIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white italic">Filing Guide</h3>
             </div>
             <ul className="space-y-5">
                {[
                  { t: 'Clarity', t_col: 'text-blue-400', d: 'Include photos for faster diagnosis' },
                  { t: 'Precision', t_col: 'text-it-cyan', d: 'Specify exact ward/room number' },
                  { t: 'Efficiency', t_col: 'text-eng-orange', d: 'Check for duplicates before filing' }
                ].map((tip, i) => (
                  <li key={i} className="space-y-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${tip.t_col}`}>{tip.t}</p>
                    <p className="text-xs text-white/30 leading-relaxed">{tip.d}</p>
                  </li>
                ))}
             </ul>
          </div>
        </div>
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
                  onClick={() => onPrint({ request: selectedRequest, logs: requestLogs, parts: requestParts })}
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
                  <div className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.3em] border transition-all ${
                    selectedRequest.priority === 'Urgent' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                    selectedRequest.priority === 'High' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' :
                    selectedRequest.priority === 'Medium' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' :
                    'bg-white/5 border-white/10 text-white/40'
                  }`}>
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
                    selectedRequest.status === 'Rejected' ? (
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-4 border-black bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Request Declined</span>
                        </div>
                        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                          <p className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-black">Official Rejection Reason</p>
                          <p className="text-sm text-white/60 italic leading-relaxed">
                            "{selectedRequest.rejection_reason || 'The request was declined during the review process.'}"
                          </p>
                        </div>
                      </div>
                    ) : selectedRequest.status !== 'Completed' && (
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
                              src={`${API_BASE_URL}${selectedRequest.completion_attachment_url}`} 
                              alt="Proof of Work"
                              className="w-48 h-32 object-cover rounded-xl border border-white/10 hover:border-green-500/50 transition-all cursor-pointer shadow-lg"
                              onClick={() => window.open(`${API_BASE_URL}${selectedRequest.completion_attachment_url}`, '_blank')}
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



    </>
  );
};

export default RequesterDashboard;
