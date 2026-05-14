import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentCheckIcon,
  WrenchIcon,
  ArchiveBoxIcon,
  ClockIcon,
  PhotoIcon,
  CheckCircleIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  CpuChipIcon,
  PencilIcon,
  PlusCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const ProviderStaffView = ({ type, onBack, notify }) => {
  // Selection States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [allAssignedRequests, setAllAssignedRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  
  // Dashboard States (Cloned from StaffDashboard)
  const [activeJob, setActiveJob] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [assetData, setAssetData] = useState({ name: '', model: '', serialNo: '', propertyNo: '', locationTag: '' });
  const [isAssetSaved, setIsAssetSaved] = useState(false);
  const [isAssetEditing, setIsAssetEditing] = useState(false);
  const [partName, setPartName] = useState('');
  const [partSerial, setPartSerial] = useState('');
  const [stagedParts, setStagedParts] = useState([]);
  const [partsList, setPartsList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [finalReport, setFinalReport] = useState('');

  const steps = [
    { id: 1, name: 'Job Accepted', desc: 'Confirm you are heading to the site' },
    { id: 2, name: 'Arrival', desc: 'Tag the asset and perform inspection' },
    { id: 3, name: 'Resolution', desc: 'Perform repair and log spare parts' },
    { id: 4, name: 'Review', desc: 'Finalize technical report' },
    { id: 5, name: 'Completed', desc: 'Pending user acknowledgment' }
  ];

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests?provider_type=${type}`);
      const data = await res.json();
      setAllAssignedRequests(data.filter(r => r.status === 'Assigned'));
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffForRequest = async (reqId) => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests/${reqId}/staff`);
      const data = await res.json();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Staff fetch error:', err);
    }
  };

  const fetchJobs = async (staffId) => {
    setLoading(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests?staff_id=${staffId}`);
      const data = await res.json();
      const activeJobs = Array.isArray(data) ? data.filter(r => r.status === 'Assigned') : [];
      setMyJobs(activeJobs);
      
      if (activeJob) {
        const updated = activeJobs.find(j => j.id === activeJob.id);
        if (updated) setActiveJob(updated);
      }
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async (reqId) => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests/${reqId}/parts`);
      const data = await res.json();
      setPartsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch parts error:', err);
    }
  };

  const fetchLogs = async (reqId) => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests/${reqId}/logs`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch logs error:', err);
    }
  };

  const handleAddToQueue = () => {
    if (!partName.trim()) return;
    setStagedParts([...stagedParts, { name: partName, sn: partSerial, id: Date.now() }]);
    setPartName('');
    setPartSerial('');
  };

  const handleRemoveFromQueue = (id) => {
    setStagedParts(stagedParts.filter(p => p.id !== id));
  };

  const handleSaveQueue = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      for (const part of stagedParts) {
        await fetch(`http://${host}:5001/api/requests/${activeJob.id}/parts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ part_name: part.name, serial_no: part.sn })
        });
      }
      setStagedParts([]);
      fetchParts(activeJob.id);
    } catch (err) {
      console.error('Save queue error:', err);
    }
  };

  const handleDeletePart = async (partId) => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${activeJob.id}/parts/${partId}`, {
        method: 'DELETE'
      });
      fetchParts(activeJob.id);
    } catch (err) {
      console.error('Delete part error:', err);
    }
  };

  const handleAddLog = async () => {
    if (!technicalNotes.trim()) return;
    setIsLogging(true);
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${activeJob.id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: selectedStaff.id, notes: technicalNotes })
      });
      setTechnicalNotes('');
      fetchLogs(activeJob.id);
    } catch (err) {
      console.error('Log error:', err);
    } finally {
      setIsLogging(false);
    }
  };

  const handleTagAsset = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${activeJob.id}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_name: assetData.name,
          model: assetData.model,
          serial_no: assetData.serialNo,
          property_no: assetData.propertyNo,
          location_tag: assetData.locationTag
        })
      });
    } catch (err) {
      console.error('Tag asset error:', err);
    }
  };

  const handleSaveStep = async (nextStep) => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${activeJob.id}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: nextStep, notes: technicalNotes })
      });
      fetchJobs(selectedStaff.id);
      setActiveJob({ ...activeJob, workflow_step: nextStep });
    } catch (err) {
      console.error('Save step error:', err);
    }
  };

  const handleFinalizeJob = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      
      if (finalReport.trim()) {
        await fetch(`http://${host}:5001/api/requests/${activeJob.id}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff_id: selectedStaff.id, notes: `FINAL REPORT: ${finalReport}` })
        });
      }

      await fetch(`http://${host}:5001/api/requests/${activeJob.id}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 5, notes: finalReport })
      });
      
      const res = await fetch(`http://${host}:5001/api/requests/${activeJob.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' })
      });

      if (res.ok) {
        notify('Job Completed Successfully!');
        setActiveJob(null);
        setAssetData({ name: '', model: '', serialNo: '', propertyNo: '', locationTag: '' });
        setFinalReport('');
        setPartName('');
        setPartSerial('');
        setStagedParts([]);
        setIsAssetSaved(false);
        setIsAssetEditing(false);
        fetchJobs(selectedStaff.id);
      }
    } catch (err) {
      console.error('Finalize error:', err);
      notify('Failed to finalize job', 'error');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      fetchStaffForRequest(selectedRequest.id);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (selectedStaff) {
      fetchJobs(selectedStaff.id);
      // Automatically activate the selected request in the dashboard view
      const targetJob = myJobs.find(j => j.id === selectedRequest.id);
      if (targetJob) setActiveJob(targetJob);
      else setActiveJob(selectedRequest);
    }
  }, [selectedStaff, myJobs.length]);

  useEffect(() => {
    if (activeJob) {
      setTechnicalNotes('');
      fetchLogs(activeJob.id);
      fetchParts(activeJob.id);
      setAssetData({
        name: activeJob.asset_name || '',
        model: activeJob.model || '',
        serialNo: activeJob.serial_no || '',
        propertyNo: activeJob.property_no || '',
        locationTag: activeJob.location_tag || ''
      });
      setIsAssetSaved(!!activeJob.property_no);
    }
  }, [activeJob?.id]);

  // Phase 1: Request Selection
  if (!selectedRequest) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
             <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-it-cyan" />
            </button>
            <h1 className="text-3xl font-bold italic uppercase tracking-tight">Active Work <span className="text-it-cyan">Queue</span></h1>
          </div>
          <p className="text-white/20 text-xs uppercase tracking-[0.3em] mb-6 font-black">Select a request to manage technical staff</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allAssignedRequests.map(r => (
              <button 
                key={r.id}
                onClick={() => setSelectedRequest(r)}
                className="glass-card p-8 group hover:border-it-cyan/50 hover:bg-it-cyan/5 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded mb-2 inline-block">{r.tracking_no}</span>
                  <h3 className="text-xl font-bold mb-1 group-hover:text-it-cyan transition-colors">{r.title}</h3>
                  <p className="text-xs text-white/40">{r.location}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl text-white/20 group-hover:bg-it-cyan/20 group-hover:text-it-cyan transition-all">
                  <ChevronRightIcon className="w-6 h-6" />
                </div>
              </button>
            ))}
            {allAssignedRequests.length === 0 && !loading && (
               <div className="col-span-full py-20 text-center glass-card border-dashed border-white/10 text-white/20 uppercase tracking-widest text-xs">
                No active assignments found
               </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: Staff Selection (for selected request)
  if (!selectedStaff) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
             <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-it-cyan" />
            </button>
            <div>
              <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded mb-1 inline-block">{selectedRequest.tracking_no}</span>
              <h1 className="text-3xl font-bold italic uppercase tracking-tight">Select <span className="text-it-cyan">Technician</span></h1>
            </div>
          </div>
          <p className="text-white/20 text-xs uppercase tracking-[0.3em] mb-6 font-black">Choose an assigned staff member for this request</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList.map(s => (
              <button 
                key={s.id}
                onClick={() => setSelectedStaff(s)}
                className="glass-card p-8 group hover:border-it-cyan/50 hover:bg-it-cyan/5 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xl font-bold mb-1 group-hover:text-it-cyan transition-colors">{s.first_name} {s.last_name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-white/20 font-black">{s.position}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl text-white/20 group-hover:bg-it-cyan/20 group-hover:text-it-cyan transition-all">
                  <ChevronRightIcon className="w-6 h-6" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white font-sans p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Unified Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-6">
            <button onClick={() => setSelectedStaff(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
              <ArrowLeftIcon className="w-5 h-5 text-white/40 group-hover:text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-black italic tracking-tight uppercase">
                SRMC <span className={type === 'IT' ? 'text-it-cyan' : 'text-eng-orange'}>Technician</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-it-cyan animate-pulse"></div>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-black">Logged in as {selectedStaff.first_name} {selectedStaff.last_name}</p>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
             <button 
                onClick={() => {
                  setSelectedStaff(null);
                  setActiveJob(null);
                }}
                className="btn-secondary px-6 py-2 text-[10px] font-bold uppercase tracking-widest border-white/10"
              >
                Switch Account
              </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <h2 className={`text-xl mb-4 font-bold tracking-widest uppercase ${type === 'IT' ? 'text-it-cyan' : 'text-eng-orange'}`}>My Work Queue</h2>
            {loading ? (
              <div className="p-12 text-center text-white/20 animate-pulse font-mono text-xs uppercase tracking-widest">Loading technical queue...</div>
            ) : myJobs.length === 0 ? (
              <div className="glass-card p-12 text-center text-white/20 uppercase tracking-widest text-xs border-dashed border-white/10">
                No pending assignments
              </div>
            ) : (
              myJobs.map((job) => (
                <button 
                  key={job.id}
                  onClick={() => setActiveJob(job)}
                  className={`w-full text-left glass-card p-6 border-l-4 transition-all ${
                    activeJob?.id === job.id 
                    ? `border-l-${type === 'IT' ? 'it-cyan' : 'eng-orange'} bg-${type === 'IT' ? 'it-cyan' : 'eng-orange'}/[0.05]` 
                    : 'border-l-transparent hover:border-l-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-mono ${type === 'IT' ? 'text-it-cyan' : 'text-eng-orange'}`}>{job.tracking_no}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${
                      job.priority === 'Urgent' ? 'bg-red-400/20 text-red-400' : 'bg-white/5 text-white/40'
                    }`}>
                      {job.priority}
                    </span>
                  </div>
                  <h3 className="text-lg mb-1 font-bold">{job.title}</h3>
                  <p className="text-sm text-white/40">Location: {job.location}</p>
                </button>
              ))
            )}
          </div>

          {/* Main Action Area */}
          <div className="col-span-12 lg:col-span-8">
            {!activeJob ? (
              <div className="h-[400px] glass-card flex flex-col items-center justify-center text-white/20 border-dashed border-white/5">
                <WrenchIcon className="w-16 h-16 mb-4 opacity-5" />
                <p className="uppercase tracking-widest text-xs font-bold">Select a job from the queue to begin operations</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Guided Workflow Header */}
                <div className="glass-card p-6 border-it-cyan/10 bg-[#1a1a2e]/50 backdrop-blur-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded">{activeJob.tracking_no}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black">Authorized Workflow Step {(activeJob.workflow_step || 1)}</span>
                        </div>
                        <h3 className="text-3xl font-bold italic uppercase tracking-tighter">{activeJob.title}</h3>
                      </div>
                      <div className={`px-6 py-2 rounded-xl border-2 font-black uppercase tracking-[0.3em] text-xs shadow-lg transform -rotate-1 ${
                        activeJob.status === 'Completed' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                        'bg-it-cyan/10 border-it-cyan/50 text-it-cyan shadow-it-cyan/10'
                      }`}>
                        {activeJob.status}
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowHints(!showHints)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        showHints ? (type === 'IT' ? 'bg-it-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'bg-eng-orange text-black shadow-[0_0_20px_rgba(255,165,0,0.2)]') : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {showHints ? 'Guided Mode: ON' : 'Guided Mode: OFF'}
                    </button>
                  </div>

                  {/* Visual Stepper */}
                  <div className="flex items-center justify-between relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 z-0"></div>
                    {steps.map((s) => {
                      const isDone = (activeJob.workflow_step || 1) > s.id;
                      const isCurrent = (activeJob.workflow_step || 1) === s.id;
                      const themeColor = type === 'IT' ? 'it-cyan' : 'eng-orange';
                      return (
                        <div key={s.id} className="relative z-10 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isDone ? 'bg-green-500 border-green-500' : 
                            isCurrent ? `bg-[#1a1a2e] border-${themeColor} shadow-[0_0_15px_rgba(0,255,255,0.3)]` : 
                            'bg-[#1a1a2e] border-white/10'
                          }`}>
                            {isDone ? <CheckBadgeIcon className="w-5 h-5 text-black" /> : 
                             <span className={`text-xs font-bold ${isCurrent ? `text-${themeColor}` : 'text-white/20'}`}>{s.id}</span>}
                          </div>
                          <span className={`text-[8px] uppercase tracking-widest font-black mt-2 hidden md:block ${
                            isCurrent ? `text-${themeColor}` : 'text-white/20'
                          }`}>{s.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step Content Area */}
                <div className="glass-card p-8 min-h-[500px] border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-it-cyan/5 blur-[100px] pointer-events-none"></div>
                  
                  {showHints && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-8 p-4 rounded-xl flex gap-4 items-start ${type === 'IT' ? 'bg-it-cyan/10 border-it-cyan/20' : 'bg-eng-orange/10 border-eng-orange/20'}`}
                    >
                      <InformationCircleIcon className={`w-6 h-6 shrink-0 mt-1 ${type === 'IT' ? 'text-it-cyan' : 'text-eng-orange'}`} />
                      <div>
                        <h5 className={`text-xs font-bold uppercase tracking-widest mb-1 ${type === 'IT' ? 'text-it-cyan' : 'text-eng-orange'}`}>Step {(activeJob.workflow_step || 1)}: {steps.find(s => s.id === (activeJob.workflow_step || 1))?.name}</h5>
                        <p className="text-xs text-white/60 leading-relaxed italic">
                          "{(steps.find(s => s.id === (activeJob.workflow_step || 1))?.desc)}"
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {(activeJob.workflow_step || 1) === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="w-20 h-20 rounded-full bg-it-cyan/10 flex items-center justify-center mb-6">
                        <MapPinIcon className="w-10 h-10 text-it-cyan animate-bounce" />
                      </div>
                      <h4 className="text-2xl font-bold mb-2">Heading to Location?</h4>
                      <p className="text-white/40 text-sm mb-8 max-w-md">Once you arrive at the job site, click the button below to notify the requester and start the assessment.</p>
                      <button 
                        onClick={() => handleSaveStep(2)}
                        className="btn-primary py-4 px-12"
                      >
                        Confirm Arrival & Start Assessment
                      </button>
                    </motion.div>
                  )}

                  {(activeJob.workflow_step || 1) === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold">Step 2: Technical Assessment</h4>
                        {isAssetSaved && !isAssetEditing && (
                          <button 
                            onClick={() => setIsAssetEditing(true)}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-it-cyan hover:text-white transition-colors"
                          >
                            <PencilIcon className="w-3 h-3" /> Edit Metadata
                          </button>
                        )}
                      </div>
                      
                      {/* Pre-Inspection Asset Tagging */}
                      <div className={`transition-all duration-500 rounded-2xl p-6 mb-8 space-y-4 border ${
                        isAssetSaved && !isAssetEditing 
                        ? 'bg-green-500/5 border-green-500/20 opacity-60' 
                        : 'bg-white/[0.02] border-white/5'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <CpuChipIcon className={`w-4 h-4 ${isAssetSaved ? 'text-green-400' : 'text-it-cyan'}`} />
                            <h5 className={`text-[10px] uppercase tracking-widest font-bold ${isAssetSaved ? 'text-green-400' : 'text-it-cyan'}`}>
                              {isAssetSaved ? 'Asset Verified' : 'Asset Metadata (Pre-Inspection)'}
                            </h5>
                          </div>
                          {!isAssetSaved || isAssetEditing ? (
                            <button 
                              onClick={async () => {
                                if (assetData.propertyNo) {
                                  await handleTagAsset();
                                  setIsAssetSaved(true);
                                  setIsAssetEditing(false);
                                }
                              }}
                              disabled={!assetData.propertyNo}
                              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-it-cyan text-black rounded hover:bg-white transition-colors disabled:opacity-30"
                            >
                              Save Asset
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
                              <CheckCircleIcon className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/20 block mb-1">Asset Name</label>
                            <input 
                              type="text" 
                              disabled={isAssetSaved && !isAssetEditing}
                              className="input-field text-xs disabled:bg-transparent disabled:border-transparent"
                              value={assetData.name}
                              onChange={(e) => setAssetData({...assetData, name: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/20 block mb-1">Property Number</label>
                            <input 
                              type="text" 
                              disabled={isAssetSaved && !isAssetEditing}
                              className="input-field text-xs border-it-cyan/30 disabled:bg-transparent disabled:border-transparent"
                              value={assetData.propertyNo}
                              onChange={(e) => setAssetData({...assetData, propertyNo: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/20 block mb-1">Model / Specs</label>
                            <input 
                              type="text" 
                              disabled={isAssetSaved && !isAssetEditing}
                              className="input-field text-xs disabled:bg-transparent disabled:border-transparent"
                              value={assetData.model}
                              onChange={(e) => setAssetData({...assetData, model: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/20 block mb-1">Serial Number</label>
                            <input 
                              type="text" 
                              disabled={isAssetSaved && !isAssetEditing}
                              className="input-field text-xs disabled:bg-transparent disabled:border-transparent"
                              value={assetData.serialNo}
                              onChange={(e) => setAssetData({...assetData, serialNo: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Log History */}
                      {logs.length > 0 && (
                        <div className="mb-6 space-y-3">
                          <h5 className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Previous Findings</h5>
                          {logs.map(log => (
                            <div key={log.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                              <div className="flex justify-between mb-2 opacity-40">
                                <span className="font-bold">{log.staff_name}</span>
                                <span>{new Date(log.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-white/60 leading-relaxed">{log.notes}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-4 mb-8">
                        <label className="text-[10px] uppercase tracking-widest text-white/20">Add New Entry / Diagnostic Update</label>
                        <textarea 
                          value={technicalNotes}
                          onChange={(e) => setTechnicalNotes(e.target.value)}
                          className="input-field min-h-[120px] pt-4"
                          placeholder="Describe the current situation or findings..."
                        />
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={handleAddLog}
                          disabled={isLogging || !technicalNotes.trim()}
                          className="btn-secondary py-4 px-8"
                        >
                          {isLogging ? 'Saving...' : 'Add Log Entry Only'}
                        </button>
                        <button 
                          onClick={async () => {
                            if (!technicalNotes.trim()) {
                              notify('Please provide technical findings before proceeding', 'error');
                              return;
                            }
                            if (assetData.serialNo) await handleTagAsset();
                            await handleAddLog();
                            await handleSaveStep(3);
                          }}
                          className="btn-primary py-4 px-12 flex-1"
                        >
                          Log Findings & Move to Resolution
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {(activeJob.workflow_step || 1) === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h4 className="text-lg font-bold mb-4">Step 3: Resolution & Repair</h4>

                      {/* Log History */}
                      {logs.length > 0 && (
                        <div className="mb-6 space-y-3">
                          <h5 className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Action Timeline</h5>
                          {logs.map(log => (
                            <div key={log.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                              <div className="flex justify-between mb-2 opacity-40">
                                <span className="font-bold">{log.staff_name}</span>
                                <span>{new Date(log.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-white/60 leading-relaxed">{log.notes}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-4 mb-8">
                        <label className="text-[10px] uppercase tracking-widest text-white/20">Update Repair Status</label>
                        <textarea 
                          value={technicalNotes}
                          onChange={(e) => setTechnicalNotes(e.target.value)}
                          className="input-field min-h-[120px] pt-4"
                          placeholder="e.g. Item sent to repair shop, waiting for spare parts..."
                        />
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={handleAddLog}
                          disabled={isLogging || !technicalNotes.trim()}
                          className="btn-secondary py-4 px-8"
                        >
                          {isLogging ? 'Logging...' : 'Add Log Entry'}
                        </button>
                        <button 
                          onClick={async () => {
                            if (technicalNotes.trim()) await handleAddLog();
                            await handleSaveStep(4);
                          }}
                          className="btn-primary py-4 px-12 flex-1"
                        >
                          Complete Technical Phase
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {(activeJob.workflow_step || 1) === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h4 className="text-lg font-bold mb-4">Step 4: Post-Inspection & Finalize</h4>
                      
                      {/* Optional Parts Replacement */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <PlusCircleIcon className="w-4 h-4 text-it-cyan" />
                          <h5 className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Optional Parts Replacement</h5>
                        </div>

                        {/* Saved Parts List */}
                        {partsList.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <h6 className="text-[8px] uppercase tracking-widest text-green-400 font-bold opacity-60">Already Saved in Database</h6>
                            {partsList.map(part => (
                              <div key={part.id} className="group flex justify-between items-center p-3 rounded-lg bg-green-500/5 border border-green-500/10 text-[10px]">
                                <div>
                                  <span className="text-white/60 font-bold">{part.part_name}</span>
                                  <span className="mx-2 opacity-20">|</span>
                                  <span className="font-mono text-it-cyan">SN: {part.serial_no}</span>
                                </div>
                                <button 
                                  className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-all"
                                  title="Delete from Server"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Staged Queue List */}
                        {stagedParts.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <h6 className="text-[8px] uppercase tracking-widest text-eng-orange font-bold opacity-60">Pending Save (Queue)</h6>
                            {stagedParts.map(part => (
                              <div key={part.id} className="group flex justify-between items-center p-3 rounded-lg bg-eng-orange/5 border border-eng-orange/10 text-[10px]">
                                <div>
                                  <span className="text-white/60 font-bold">{part.name}</span>
                                  <span className="mx-2 opacity-20">|</span>
                                  <span className="font-mono text-eng-orange">SN: {part.sn}</span>
                                </div>
                                <button 
                                  onClick={() => handleRemoveFromQueue(part.id)}
                                  className="text-white/40 hover:text-white transition-all"
                                  title="Remove from Queue"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button 
                              onClick={handleSaveQueue}
                              className="w-full py-2 bg-it-cyan text-black font-bold uppercase tracking-widest text-[10px] rounded hover:bg-white transition-all"
                            >
                              Save All Pending Parts to Server
                            </button>
                          </div>
                        )}

                        {partsList.length === 0 && stagedParts.length === 0 && (
                          <div className="p-4 text-center border border-dashed border-white/5 rounded-xl mb-4">
                            <p className="text-[10px] text-white/20 italic">No parts replacement recorded yet</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            placeholder="Part Name / Description" 
                            className="input-field text-xs"
                            value={partName}
                            onChange={(e) => setPartName(e.target.value)}
                          />
                          <input 
                            type="text" 
                            placeholder="Part Serial Number" 
                            className="input-field text-xs"
                            value={partSerial}
                            onChange={(e) => setPartSerial(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={handleAddToQueue}
                          disabled={!partName.trim()}
                          className="btn-secondary py-2 px-4 text-[10px] uppercase tracking-widest border-it-cyan/30 text-it-cyan hover:bg-it-cyan hover:text-black transition-all"
                        >
                          + Add to List (Unsaved)
                        </button>
                      </div>

                      {/* Final Report */}
                      <div className="space-y-4 mb-8">
                        <label className="text-[10px] uppercase tracking-widest text-white/20">Post-Inspection Report / Actions Done</label>
                        <textarea 
                          value={finalReport}
                          onChange={(e) => setFinalReport(e.target.value)}
                          className="input-field min-h-[150px] pt-4"
                          placeholder="Provide a final summary of the work performed..."
                        />
                      </div>

                      <div className="flex gap-4">
                        <button 
                          className="btn-primary py-4 px-8 flex-1 bg-green-500 hover:bg-green-400 border-none text-black font-bold uppercase tracking-widest text-xs"
                          onClick={handleFinalizeJob}
                        >
                          Complete Job & Archive Request
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderStaffView;
