import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CpuChipIcon, 
  WrenchScrewdriverIcon, 
  ClockIcon, 
  BoltIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  BellAlertIcon,
  XMarkIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/solid';
import CommentSection from './CommentSection';

const PublicPortal = ({ type }) => {
  const [requests, setRequests] = useState([]);
  const [time, setTime] = useState(new Date());
  const [selectedReq, setSelectedReq] = useState(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [alertAudio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')); 
  alertAudio.loop = true;

  const fetchAllRequests = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests?provider_type=${type}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Portal fetch error:', err);
    }
  };

  const handleFollowUp = async (id) => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${id}/nudge`, { method: 'POST' });
      fetchAllRequests();
    } catch (err) {
      console.error('Follow-up error:', err);
    }
  };

  const resetFollowUp = async (id) => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${id}/nudge/reset`, { method: 'POST' });
      fetchAllRequests();
    } catch (err) {
      console.error('Reset follow-up error:', err);
    }
  };

  useEffect(() => {
    if (requests.some(r => r.is_nudged)) {
      alertAudio.play().catch(err => console.log('Audio autoplay blocked until interaction'));
    } else {
      alertAudio.pause();
      alertAudio.currentTime = 0;
    }
  }, [requests, alertAudio]);

  useEffect(() => {
    fetchAllRequests();
    const interval = setInterval(fetchAllRequests, 5000); 
    const timer = setInterval(() => setTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
      alertAudio.pause();
    };
  }, [type, alertAudio]);

  const activeRequests = requests.filter(r => ['Accepted', 'Assigned'].includes(r.status));
  

  const themeColor = type === 'IT' ? 'text-it-cyan' : 'text-eng-orange';
  const themeBg = type === 'IT' ? 'bg-it-cyan' : 'bg-eng-orange';
  const themeBorder = type === 'IT' ? 'border-it-cyan' : 'border-eng-orange';

  return (
    <div className="fixed inset-0 bg-[#0a0a1a] text-white p-12 overflow-hidden flex flex-col font-['Outfit']">
      {/* High-Fidelity Portal Header */}
      <div className="flex justify-between items-center mb-16 border-b border-white/5 pb-10">
        <div className="flex items-center gap-10">
          <div className={`w-24 h-24 rounded-3xl ${themeBg}/10 flex items-center justify-center border ${themeBorder}/20 shadow-[0_0_50px_rgba(0,255,255,0.1)]`}>
            {type === 'IT' ? <CpuChipIcon className={`w-14 h-14 ${themeColor} animate-pulse`} /> : <WrenchScrewdriverIcon className={`w-14 h-14 ${themeColor} animate-pulse`} />}
          </div>
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter italic">
              {type} <span className={themeColor}>Operations Board</span>
            </h1>
            <p className="text-white/20 text-sm uppercase tracking-[0.6em] font-bold mt-2">Real-Time Service Logistics • {type} Department Hub</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-6xl font-black font-mono tracking-tighter text-white/90">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className={`text-xs ${themeColor} uppercase tracking-[0.4em] font-black mt-2`}>
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Single Department Massive Queue */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 gap-6 h-full">
          <div className="flex flex-col h-full gap-8">
            <div className={`flex items-center justify-between px-8 py-4 ${themeBg}/10 border ${themeBorder}/20 rounded-2xl`}>
              <div className="flex items-center gap-4">
                <BoltIcon className={`w-8 h-8 ${themeColor}`} />
                <h2 className="text-2xl font-black uppercase tracking-[0.3em] font-mono">Active Response Queue</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[10px] text-white/20 uppercase font-black">Live Load</p>
                    <p className={`text-3xl font-black ${themeColor} italic leading-none`}>{activeRequests.length}</p>
                </div>
                <div className={`w-px h-10 ${themeBg}/20`}></div>
                <div className="text-right">
                    <p className="text-[10px] text-white/20 uppercase font-black">Efficiency</p>
                    <p className="text-3xl font-black text-green-500 italic leading-none">98%</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 flex flex-col gap-6 marquee-vertical">
                {/* Duplicate the list for seamless looping */}
                {[...activeRequests, ...activeRequests].map((req, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: req.is_nudged ? [1, 1.03, 1] : 1,
                      backgroundColor: req.is_nudged ? ['rgba(255,255,255,0.02)', 'rgba(234,179,8,0.05)', 'rgba(255,255,255,0.02)'] : 'rgba(255,255,255,0.02)'
                    }}
                    transition={{
                      scale: req.is_nudged ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : {},
                      backgroundColor: req.is_nudged ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : {}
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={`${req.id}-${idx}`}
                    onClick={() => {
                      setSelectedReq(req);
                      setShowDiscussion(true);
                      if (req.is_nudged) {
                        resetFollowUp(req.id);
                      }
                    }}
                    className={`glass-card p-10 border-l-8 ${themeBorder} bg-white/[0.02] flex justify-between items-center group hover:bg-white/[0.05] cursor-pointer transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden ${req.is_nudged ? 'border-yellow-500/50' : ''}`}
                  >
                    {/* Follow Up Bell */}
                    {req.is_nudged && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30 animate-pulse">
                        <BellAlertIcon className="w-4 h-4 text-yellow-500" />
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Following Up</span>
                      </div>
                    )}

                    {/* Background Status Stamp */}
                    <div className={`absolute right-[10%] top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.05] text-8xl font-black uppercase tracking-[0.2em] transition-all group-hover:opacity-[0.15] group-hover:scale-110 ${
                      req.status === 'Completed' ? 'text-green-500' :
                      req.status === 'Rejected' ? 'text-red-500' :
                      req.status === 'Pending Review' ? 'text-yellow-500' :
                      type === 'IT' ? 'text-it-cyan' : 'text-eng-orange'
                    }`}>
                      {req.status}
                    </div>

                    <div className="flex-1 relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`text-sm font-mono ${themeColor} bg-white/5 px-3 py-1 rounded-lg uppercase tracking-[0.2em] font-bold`}>{req.tracking_no}</span>
                        <div className="flex items-center gap-2 text-xs text-white/30 uppercase font-black tracking-widest">
                          <MapPinIcon className="w-4 h-4" />
                          {req.location}
                        </div>
                        {req.priority === 'Urgent' && (
                           <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                             Urgent Priority
                           </div>
                        )}
                        {req.priority === 'High' && (
                           <div className="px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                             High Priority
                           </div>
                        )}
                        {req.priority === 'Medium' && (
                           <div className="px-3 py-1 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(22,163,74,0.3)]">
                             Medium Priority
                           </div>
                        )}
                        {req.priority === 'Low' && (
                           <div className="px-3 py-1 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10">
                             Low Priority
                           </div>
                        )}
                      </div>
                      <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white group-hover:text-it-cyan transition-colors">{req.title}</h3>
                      <div className="flex items-center gap-6 mt-6">
                         <div className="flex items-center gap-2 text-white/20">
                            <ClockIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Log: {new Date(req.created_at).toLocaleTimeString()}</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2 opacity-20 group-hover:opacity-100 transition-opacity max-w-[200px] relative z-10">
                      <p className="text-xs uppercase tracking-[0.3em] font-black text-white/40">Authorized Personnel</p>
                      <div className={`text-xl font-black ${themeColor} uppercase italic tracking-tighter truncate`}>
                        {req.assigned_names || 'Awaiting Dispatch'}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {activeRequests.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 border-4 border-dashed border-white/5 rounded-[4rem]">
                     <ShieldCheckIcon className="w-40 h-40 mb-8" />
                     <p className="uppercase tracking-[1em] font-black text-2xl">Operations Stable</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="mt-12 flex justify-between items-center border-t border-white/5 pt-8 text-white/10">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-black uppercase tracking-[0.3em]">Network Integrity: High</span>
           </div>
           <div className="w-px h-6 bg-white/5"></div>
           <span className="text-xs font-black uppercase tracking-[0.3em]">Security Protocol: Active</span>
        </div>
        <div className="text-xs font-black uppercase tracking-[1em]">SRMC {type} HUB v3.0</div>
      </div>
      {/* Discussion Modal */}
      <AnimatePresence>
        {showDiscussion && selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiscussion(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0a0a1a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
              style={{ maxHeight: '90vh' }}
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono ${themeColor} bg-white/5 px-2 py-0.5 rounded`}>{selectedReq.tracking_no}</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/20 font-black">Operational Discussion</span>
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">{selectedReq.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowDiscussion(false)}
                    className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden p-8 bg-black/40">
                <CommentSection 
                  requestId={selectedReq.id} 
                  userName="Public Requester" 
                  userRole="Requester"
                />
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                 <p className="text-[8px] uppercase tracking-[0.5em] text-white/10 font-black italic">End of Log • Mission Critical Interface</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicPortal;
