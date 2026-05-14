import React, { useState } from 'react';
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
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import CommentSection from './CommentSection';
import { getPriorityStyles, getTimeToBreach, getStatusColor } from '../utils/statusHelper';
import API_BASE_URL from '../config';

const StaffDashboard = ({ user, notify }) => {
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
  const [finalReport, setFinalReport] = useState('');
  const [logs, setLogs] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [assetHistory, setAssetHistory] = useState(null);
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);

  const steps = [
    { id: 1, name: 'Job Accepted', desc: 'Confirm you are heading to the site' },
    { id: 2, name: 'Arrival', desc: 'Tag the asset and perform inspection' },
    { id: 3, name: 'Resolution', desc: 'Perform repair and log spare parts' },
    { id: 4, name: 'Review', desc: 'Finalize technical report' },
    { id: 5, name: 'Completed', desc: 'Pending user acknowledgment' }
  ];

  const fetchParts = async (reqId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/${reqId}/parts`);
      const data = await res.json();
      setPartsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch parts error:', err);
    }
  };

  const fetchLogs = async (reqId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/${reqId}/logs`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch logs error:', err);
    }
  };

  const fetchAsset = async (reqId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/${reqId}/asset`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setAssetData({
            name: data.name || '',
            model: data.model || '',
            serialNo: data.serial_no || '',
            propertyNo: data.property_no || '',
            locationTag: data.location || ''
          });
          setIsAssetSaved(true);
        } else {
          setAssetData({ name: '', model: '', serialNo: '', propertyNo: '', locationTag: '' });
          setIsAssetSaved(false);
        }
      }
    } catch (err) {
      console.error('Fetch asset error:', err);
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
      for (const part of stagedParts) {
        await fetch(`${API_BASE_URL}/api/requests/${activeJob.id}/parts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ part_name: part.name, serial_no: part.sn })
        });
      }
      setStagedParts([]);
      fetchParts(activeJob.id);
    } catch (err) {
      console.error("Save queue error:", err);
    }
  };

  const handleDeletePart = async (partId) => {
    try {
      await fetch(`${API_BASE_URL}/api/requests/${activeJob.id}/parts/${partId}`, {
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
      await fetch(`${API_BASE_URL}/api/requests/${activeJob.id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: user.id, notes: technicalNotes })
      });
      setTechnicalNotes('');
      fetchLogs(activeJob.id);
    } catch (err) {
      console.error('Log error:', err);
    } finally {
      setIsLogging(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests?staff_id=${user?.id}`);
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

  const handleAssetLookup = async () => {
    const searchVal = assetData.propertyNo || assetData.serialNo;
    if (!searchVal) {
      notify('Enter Property No or Serial No first', 'error');
      return;
    }

    setIsSearchingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/equipment/search?query=${searchVal}`);
      if (res.ok) {
        const data = await res.json();
        setAssetHistory(data);
        // Auto-fill metadata if found and current is empty
        setAssetData({
          name: assetData.name || data.equipment.name,
          model: assetData.model || data.equipment.model,
          serialNo: assetData.serialNo || data.equipment.serial_no,
          propertyNo: assetData.propertyNo || data.equipment.property_no,
          locationTag: assetData.locationTag || data.equipment.location
        });
        notify('Asset history retrieved');
      } else {
        notify('No existing record found for this asset');
        setAssetHistory(null);
      }
    } catch (err) {
      console.error('Lookup error:', err);
      notify('Lookup failed', 'error');
    } finally {
      setIsSearchingHistory(false);
    }
  };

  const [isNudged, setIsNudged] = useState(false);

  const handleTagAsset = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/requests/${activeJob.id}/tag`, {
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

  const handleFinalizeJob = async () => {
    try {
      if (finalReport.trim()) {
        await fetch(`${API_BASE_URL}/api/requests/${activeJob.id}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff_id: user.id, notes: `FINAL REPORT: ${finalReport}` })
        });
      }

      await fetch(`${API_BASE_URL}/api/requests/${activeJob.id}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 5, notes: finalReport })
      });
      
      const formData = new FormData();
      if (completionPhoto) {
        formData.append('completion_image', completionPhoto);
      }

      const res = await fetch(`${API_BASE_URL}/api/requests/${activeJob.id}/complete`, {
        method: 'PUT',
        body: formData
      });
      
      if (res.ok) {
        notify('Job Completed with Proof of Work!');
        setActiveJob(null);
        setCompletionPhoto(null);
        setAssetData({ name: '', model: '', serialNo: '' });
        setFinalReport('');
        setPartName('');
        setPartSerial('');
        setStagedParts([]);
        setIsAssetSaved(false);
        setIsAssetEditing(false);
        fetchJobs();
      }
    } catch (err) {
      console.error('Finalize error:', err);
      notify('Failed to finalize job', 'error');
    }
  };

  const handleSaveStep = async (nextStep) => {
    try {
      await fetch(`${API_BASE_URL}/api/requests/${activeJob.id}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: nextStep, notes: technicalNotes })
      });
      fetchJobs();
      setActiveJob({ ...activeJob, workflow_step: nextStep });
    } catch (err) {
      console.error('Save step error:', err);
    }
  };

  React.useEffect(() => {
    fetchJobs();
  }, [user]);

  React.useEffect(() => {
    if (activeJob) {
      setTechnicalNotes(''); 
      setAssetHistory(null);
      setIsAssetEditing(false);
      fetchLogs(activeJob.id);
      fetchParts(activeJob.id);
      fetchAsset(activeJob.id);
    }
  }, [activeJob?.id]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <h2 className="text-xl mb-4 font-bold tracking-widest uppercase text-eng-orange">My Work Queue</h2>
        {loading ? (
          <div className="p-12 text-center text-white/20 animate-pulse">Loading assigned jobs...</div>
        ) : myJobs.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/20 uppercase tracking-widest text-xs">
            No pending assignments
          </div>
        ) : (
          myJobs.map((job) => (
            <button 
              key={job.id}
              onClick={() => setActiveJob(job)}
              className={`w-full text-left glass-card p-6 border-l-4 transition-all relative overflow-hidden ${
                activeJob?.id === job.id ? 'border-l-eng-orange bg-eng-orange/[0.05]' : 'border-l-transparent hover:border-l-white/20'
              } ${job.is_nudged ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''}`}
            >
              {job.is_nudged && (
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-500 text-[8px] font-black uppercase tracking-widest animate-pulse z-10">
                  Follow-up Nudge
                </div>
              )}
              <div className="flex justify-between items-start mb-2 relative z-0">
                <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded">{job.tracking_no}</span>
                <div className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-widest border ${getPriorityStyles(job.priority).bg} ${getPriorityStyles(job.priority).text} ${getPriorityStyles(job.priority).border}`}>
                  {job.priority}
                </div>
              </div>
              <h3 className="text-lg mb-1 font-bold">{job.title}</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{job.location}</p>
                {job.sla_deadline && (
                  <div className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    getTimeToBreach(job.sla_deadline) === 'BREACHED' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/30'
                  }`}>
                    <ClockIcon className="w-3 h-3" /> {getTimeToBreach(job.sla_deadline)}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="col-span-12 lg:col-span-8">
        {!activeJob ? (
          <div className="h-[400px] glass-card flex flex-col items-center justify-center text-white/20">
            <ClipboardDocumentCheckIcon className="w-16 h-16 mb-4 opacity-10" />
            <p>Select a job from the queue to begin technical operations</p>
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
                    showHints ? 'bg-it-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'bg-white/5 text-white/40'
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
                  return (
                    <div key={s.id} className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isDone ? 'bg-green-500 border-green-500' : 
                        isCurrent ? 'bg-[#1a1a2e] border-it-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 
                        'bg-[#1a1a2e] border-white/10'
                      }`}>
                        {isDone ? <CheckBadgeIcon className="w-5 h-5 text-black" /> : 
                         <span className={`text-xs font-bold ${isCurrent ? 'text-it-cyan' : 'text-white/20'}`}>{s.id}</span>}
                      </div>
                      <span className={`text-[8px] uppercase tracking-widest font-black mt-2 hidden md:block ${
                        isCurrent ? 'text-it-cyan' : 'text-white/20'
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
                  className="mb-8 p-4 rounded-xl bg-it-cyan/10 border border-it-cyan/20 flex gap-4 items-start"
                >
                  <InformationCircleIcon className="w-6 h-6 text-it-cyan shrink-0 mt-1" />
                  <div>
                    <h5 className="text-xs font-bold text-it-cyan uppercase tracking-widest mb-1">Step {(activeJob.workflow_step || 1)}: {steps.find(s => s.id === (activeJob.workflow_step || 1))?.name}</h5>
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
                          <div className="flex gap-2">
                            <button 
                              onClick={handleAssetLookup}
                              disabled={isSearchingHistory || (!assetData.propertyNo && !assetData.serialNo)}
                              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/5 text-it-cyan rounded hover:bg-it-cyan hover:text-black transition-colors"
                            >
                              {isSearchingHistory ? 'Searching...' : 'Lookup History'}
                            </button>
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
                          </div>
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

                    {/* Asset History Display */}
                    <AnimatePresence>
                      {assetHistory && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-it-cyan/5 border border-it-cyan/20 rounded-2xl p-6 mb-8 overflow-hidden"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-[10px] uppercase tracking-widest text-it-cyan font-black flex items-center gap-2">
                              <ArchiveBoxIcon className="w-4 h-4" /> Lifetime Repair History
                            </h5>
                            <button onClick={() => setAssetHistory(null)} className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest">Close History</button>
                          </div>
                          
                          {assetHistory.history.length === 0 ? (
                            <p className="text-xs text-white/40 italic">Found asset record but no technical logs exist.</p>
                          ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {assetHistory.history.map((h, i) => (
                                <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/5 relative">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-[8px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded">{h.tracking_no}</span>
                                    <span className="text-[8px] text-white/20 uppercase tracking-widest font-black">{new Date(h.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-[10px] text-white/60 leading-relaxed">{h.notes}</p>
                                  <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[8px] text-white/20 italic">Technician: {h.staff_name || 'System'}</span>
                                    <span className="text-[8px] text-it-cyan/60 uppercase font-black">{h.title}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

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
                                onClick={() => handleDeletePart(part.id)}
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

                    {/* Proof of Completion Photo */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 space-y-6">
                      <div className="flex items-center gap-2">
                        <PhotoIcon className="w-4 h-4 text-it-cyan" />
                        <h5 className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Proof of Completion (Photo)</h5>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center gap-4">
                        {!completionPhoto ? (
                          <label className="w-full cursor-pointer">
                            <div className="h-48 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-it-cyan/40 hover:bg-it-cyan/5 transition-all">
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <PhotoIcon className="w-6 h-6 text-white/20" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-white/60">Capture Proof of Work</p>
                                <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Tap to open camera</p>
                              </div>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              className="hidden" 
                              onChange={(e) => setCompletionPhoto(e.target.files[0])}
                            />
                          </label>
                        ) : (
                          <div className="relative w-full group">
                            <img 
                              src={URL.createObjectURL(completionPhoto)} 
                              alt="Completion Proof" 
                              className="w-full h-48 object-cover rounded-2xl border border-it-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                              <button 
                                onClick={() => setCompletionPhoto(null)}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                              >
                                <XCircleIcon className="w-4 h-4" /> Retake Photo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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
                <div className="mt-12 pt-12 border-t border-white/5 pb-12">
                   <h4 className="text-[10px] uppercase tracking-widest text-white/20 mb-6 font-black">Stakeholder Discussion</h4>
                   <CommentSection 
                      requestId={activeJob.id} 
                      userName={user.first_name + ' ' + user.last_name} 
                      userRole="Technician"
                   />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

export default StaffDashboard;
