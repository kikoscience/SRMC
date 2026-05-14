import React, { useState } from 'react';
import { 
  CheckBadgeIcon,
  NoSymbolIcon,
  TagIcon,
  UserPlusIcon,
  ChevronRightIcon,
  BeakerIcon,
  BoltIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  StarIcon,
  CalendarIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  CpuChipIcon,
  ArchiveBoxIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  SpeakerWaveIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

import ProviderStaffView from './ProviderStaffView';
import CommentSection from './CommentSection';
import PrintableRequest from './PrintableRequest';
import { getPriorityStyles, getTimeToBreach, getStatusColor } from '../utils/statusHelper';

const ProviderDashboard = ({ type, notify }) => {
  const [activeTab, setActiveTab] = useState('review');
  const [selectedReq, setSelectedReq] = useState(null);
  const [techLogs, setTechLogs] = useState([]);
  const [techParts, setTechParts] = useState([]);
  const [loadingTech, setLoadingTech] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [targetReq, setTargetReq] = useState(null);
  const [newPriority, setNewPriority] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffAnalytics, setStaffAnalytics] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assetName, setAssetName] = useState('');
  const [propertyNo, setPropertyNo] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchingReq, setDispatchingReq] = useState(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [isProxyMode, setIsProxyMode] = useState(false);
  const [globalLogs, setGlobalLogs] = useState([]);
  const [printingReq, setPrintingReq] = useState(null);
  const [printingLogs, setPrintingLogs] = useState([]);
  const [printingParts, setPrintingParts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const itemsPerPage = 10;

  const fetchGlobalLogs = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/logs`);
      const data = await res.json();
      setGlobalLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch global logs error:', err);
    }
  };

  // Staff Form States
  const [sfName, setSfName] = useState('');
  const [smName, setSmName] = useState('');
  const [slName, setSlName] = useState('');
  const [sSuffix, setSSuffix] = useState('');
  const [sEmpId, setSEmpId] = useState('');
  const [sPosition, setSPosition] = useState('');

  const fetchRequests = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests?provider_type=${type}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
      setRequests([]);
    }
  };

  const fetchReminders = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/reminders?provider_type=${type}`);
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch reminders error:', err);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.trim()) return;
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newReminder, provider_type: type })
      });
      setNewReminder('');
      fetchReminders();
      notify('Reminder Broadcasted!');
    } catch (err) {
      console.error('Add reminder error:', err);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/reminders/${id}`, { method: 'DELETE' });
      fetchReminders();
    } catch (err) {
      console.error('Delete reminder error:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/staff?provider_type=${type}`);
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Staff fetch error:', err);
      setStaff([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/analytics/staff?provider_type=${type}`);
      const data = await res.json();
      setStaffAnalytics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!sfName || !slName || !sEmpId) {
      notify('Please fill in Name and Employee ID', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: sfName,
          middle_name: smName,
          last_name: slName,
          suffix: sSuffix,
          employee_id: sEmpId,
          position: sPosition,
          provider_type: type
        })
      });
      if (res.ok) {
        fetchStaff();
        // Reset form
        setSfName(''); setSmName(''); setSlName(''); setSSuffix(''); setSEmpId(''); setSPosition('');
      } else {
        const errData = await res.json();
        notify(errData.error || 'Failed to register staff member', 'error');
      }
    } catch (err) {
      console.error('Create staff error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId) => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/staff/${staffId}/toggle`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handlePrint = async (req) => {
    try {
      const host = window.location.hostname || 'localhost';
      // Fetch logs and parts for the print form
      const logsRes = await fetch(`http://${host}:5001/api/requests/${req.id}/logs`);
      const logsData = await logsRes.json();
      const partsRes = await fetch(`http://${host}:5001/api/requests/${req.id}/parts`);
      const partsData = await partsRes.json();
      
      setPrintingLogs(logsData);
      setPrintingParts(partsData);
      setPrintingReq(req);
      
      // Delay to allow state update and component render
      setTimeout(() => {
        window.print();
        setPrintingReq(null);
      }, 500);
    } catch (err) {
      console.error('Print preparation error:', err);
      notify('Failed to prepare print form', 'error');
    }
  };

  const handleDispatch = async (reqId, staffIds) => {
    if (!staffIds || staffIds.length === 0) {
      notify('Please select at least one staff member', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests/${reqId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_ids: staffIds })
      });
      if (res.ok) {
        notify('Technical team dispatched successfully!');
        fetchRequests();
        setSelectedStaffIds([]); // Clear selection
      } else {
        const errData = await res.json();
        notify('Dispatch Failed: ' + (errData.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      notify('Network Error: Could not connect to the server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveStep = async (reqId, nextStep) => {
    setIsSubmitting(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests/${reqId}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: nextStep })
      });
      if (res.ok) {
        fetchRequests();
        // Force update local selected request to show next step immediately
        setSelectedReq(prev => prev ? { ...prev, workflow_step: nextStep } : null);
      }
    } catch (err) {
      console.error('Save step error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleAccept = async (reqId) => {
    setIsSubmitting(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests/${reqId}/accept`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error('Accept error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = (reqId) => {
    setRejectingId(reqId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      notify('Please provide a reason for rejection', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (res.ok) {
        notify('Request rejected successfully');
        setShowRejectModal(false);
        fetchRequests();
      }
    } catch (err) {
      console.error('Rejection error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAdjustPriority = async () => {
    if (!adjustmentReason.trim()) {
      notify('Please provide a reason for adjustment', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/requests/${targetReq.id}/priority`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priority: newPriority, 
          reason: adjustmentReason 
        })
      });
      if (res.ok) {
        notify(`Priority adjusted to ${newPriority}`);
        setShowPriorityModal(false);
        fetchRequests();
      }
    } catch (err) {
      console.error('Priority adjustment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
    fetchStaff();
    fetchAnalytics();
    fetchGlobalLogs();
    fetchReminders();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [type]);

  const fetchTechDetails = async (reqId) => {
    setLoadingTech(true);
    try {
      const host = window.location.hostname || 'localhost';
      const [logsRes, partsRes] = await Promise.all([
        fetch(`http://${host}:5001/api/requests/${reqId}/logs`),
        fetch(`http://${host}:5001/api/requests/${reqId}/parts`)
      ]);
      const [logs, parts] = await Promise.all([logsRes.json(), partsRes.json()]);
      setTechLogs(Array.isArray(logs) ? logs : []);
      setTechParts(Array.isArray(parts) ? parts : []);
    } catch (err) {
      console.error('Tech details error:', err);
    } finally {
      setLoadingTech(false);
    }
  };

  const resetNudge = async (reqId) => {
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5001/api/requests/${reqId}/nudge/reset`, { method: 'POST' });
      fetchRequests(); // Refresh list to remove shaky effect
    } catch (err) {
      console.error('Reset nudge error:', err);
    }
  };

  React.useEffect(() => {
    if (dispatchingReq && activeTab === 'job_details') {
      fetchTechDetails(dispatchingReq.id);
      if (dispatchingReq.is_nudged) {
        resetNudge(dispatchingReq.id);
      }
    }
  }, [dispatchingReq, activeTab]);



  const fetchEquipment = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5001/api/equipment?provider_type=${type}`);
      const data = await res.json();
      setEquipment(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch equipment error:', err);
    }
  };

  const handleDownloadAssets = () => {
    if (equipment.length === 0) return;
    const headers = ['Property No', 'Asset Name', 'Model', 'Serial No', 'Location', 'Last Service'];
    const rows = equipment.map(e => [
      e.property_no,
      e.name,
      e.model,
      e.serial_no,
      e.location,
      e.last_service_at ? new Date(e.last_service_at).toLocaleDateString() : 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SRMC_Asset_Registry_${type}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  React.useEffect(() => {
    if (activeTab === 'assets') {
      fetchEquipment();
    }
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
    if (activeTab === 'history') {
      fetchGlobalLogs();
    }
  }, [activeTab]);

  if (isProxyMode) {
    return <ProviderStaffView type={type} onBack={() => setIsProxyMode(false)} notify={notify} />;
  }

  return (
    <>
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8 no-print">
      {/* Sidebar Navigation */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        {/* Proxy Mode Trigger */}
        <button 
          onClick={() => setIsProxyMode(true)}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-it-cyan/20 to-it-cyan/5 border border-it-cyan/30 flex items-center justify-between group hover:border-it-cyan transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-it-cyan/20 rounded-lg text-it-cyan group-hover:scale-110 transition-transform">
              <WrenchScrewdriverIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-it-cyan/60">Proxy Intervention</p>
              <h4 className="text-sm font-bold">Technician Mode</h4>
            </div>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-it-cyan/40 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="space-y-2">
          {[
          { id: 'overview', name: 'Overview Dashboard', icon: ChartBarIcon },
          { id: 'master', name: 'Master Operations', icon: CircleStackIcon, count: requests.length },
          { id: 'review', name: 'Review Desk', icon: CheckBadgeIcon, count: requests.filter(r => r.status === 'Pending Review').length },
          { id: 'dispatch', name: 'Staff Dispatch', icon: UserPlusIcon, count: requests.filter(r => r.status === 'Accepted').length },
          { id: 'rejected', name: 'Rejected Jobs', icon: NoSymbolIcon, count: requests.filter(r => r.status === 'Rejected').length },
          { id: 'assets', name: 'Asset Registry', icon: CpuChipIcon },
          { id: 'team', name: 'Staff Registry', icon: UsersIcon, count: staff.length },
          { id: 'analytics', name: 'Staff Performance', icon: BoltIcon },
          { id: 'history', name: 'Live Audit Logs', icon: ArchiveBoxIcon },
          { id: 'reminders', name: 'Broadcast Reminders', icon: SpeakerWaveIcon },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
              activeTab === item.id 
              ? 'bg-it-cyan text-black font-bold' 
              : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest">{item.name}</span>
            </div>
            {item.count && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === item.id ? 'bg-black/20' : 'bg-it-cyan/20 text-it-cyan'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>

    {/* Main Work Area */}
      <div className="col-span-12 lg:col-span-9 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-['Outfit'] uppercase tracking-tight">
            <span className={type === 'IT' ? 'text-it-cyan' : 'text-eng-orange'}>{type} Provider</span> • {activeTab.replace('_', ' ')}
          </h2>
          <div className="flex items-center gap-2 text-xs text-white/20">
            <BoltIcon className="w-4 h-4" />
            LIVE SYSTEM STATUS: OPTIMAL
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Pending Review', value: requests.filter(r => r.status === 'Pending Review').length, icon: ClipboardDocumentCheckIcon, color: 'text-yellow-500' },
                { label: 'Awaiting Dispatch', value: requests.filter(r => r.status === 'Accepted').length, icon: UserPlusIcon, color: 'text-eng-orange' },
                { label: 'Active Jobs', value: requests.filter(r => r.status === 'Assigned').length, icon: BoltIcon, color: 'text-it-cyan' },
                { label: 'Total Completed', value: requests.filter(r => r.status === 'Completed').length, icon: CheckBadgeIcon, color: 'text-green-500' }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color.replace('text', 'bg')}/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:blur-3xl transition-all`} />
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20 mb-1">{stat.label}</p>
                      <h4 className="text-4xl font-black italic">{stat.value}</h4>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-10 border-it-cyan/10 bg-it-cyan/[0.01] relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-it-cyan/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1">
                     <h3 className="text-3xl font-black uppercase tracking-tight italic mb-2">Departmental Health Index</h3>
                     <p className="text-white/40 text-sm max-w-xl">Your technical unit is currently operating at <span className="text-it-cyan font-bold">Optimal Performance</span>. Average response time for {type} requests is within the established 15-minute SLA threshold.</p>
                  </div>
                  <div className="text-center">
                     <div className="text-6xl font-black text-it-cyan italic mb-1">98%</div>
                     <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Efficiency Rating</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="grid gap-4">
            {requests.filter(r => r.status === 'Pending Review').length === 0 ? (
              <div className="glass-card p-12 text-center text-white/20 uppercase tracking-widest text-sm">
                No pending {type} requests
              </div>
            ) : (
              requests.filter(r => r.status === 'Pending Review').map((req) => (
                <motion.div 
                  layoutId={req.tracking_no}
                  key={req.id} 
                  className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-yellow-500/50 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded">{req.tracking_no}</span>
                      <span className="text-xs text-white/40 uppercase tracking-widest">{req.location || 'No Location'}</span>
                      <div className="px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase tracking-widest">Pending Review</div>
                      {req.sla_deadline && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          getTimeToBreach(req.sla_deadline) === 'BREACHED' ? 'bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse' : 'bg-white/5 text-white/30'
                        }`}>
                          <ClockIcon className="w-3 h-3" /> SLA: {getTimeToBreach(req.sla_deadline)}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg mb-1 font-bold">{req.title}</h3>
                    <p className="text-white/40 text-sm">
                      Submitted {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'} • <span className={
                        req.priority === 'Urgent' ? 'text-red-500 font-black' : 
                        req.priority === 'High' ? 'text-purple-400 font-bold' : 
                        req.priority === 'Medium' ? 'text-green-400 font-bold' : 
                        'text-it-cyan'
                      }>{req.priority} Priority</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setTargetReq(req);
                        setNewPriority(req.priority);
                        setShowPriorityModal(true);
                      }}
                      className="p-3 rounded-xl bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all border border-yellow-500/20"
                      title="Adjust Priority"
                    >
                      <ArrowPathIcon className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)}
                      className="p-3 rounded-xl bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-black transition-all border border-red-400/20"
                    >
                      <NoSymbolIcon className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleAccept(req.id)}
                      disabled={isSubmitting}
                      className={`flex-1 md:flex-none px-6 py-3 ${type === 'IT' ? 'bg-it-cyan' : 'bg-eng-orange'} text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50`}
                    >
                      Accept Request <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div className="grid gap-4">
            {requests.filter(r => r.status === 'Rejected').length === 0 ? (
              <div className="glass-card p-12 text-center text-white/20 uppercase tracking-widest text-sm">
                No rejected requests
              </div>
            ) : (
              requests.filter(r => r.status === 'Rejected').map((req) => (
                <div key={req.id} className="glass-card p-6 border-red-500/10 opacity-60">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-red-400 bg-red-400/10 px-2 py-0.5 rounded">{req.tracking_no}</span>
                        <span className="text-xs text-white/40 uppercase tracking-widest">{req.location}</span>
                      </div>
                      <h3 className="text-lg mb-1">{req.title}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-red-500 uppercase border border-red-500/50 px-2 py-1 rounded">Rejected</span>
                    </div>
                  </div>
                  <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/10">
                    <p className="text-[10px] uppercase tracking-widest text-red-400 mb-1 font-bold">Reason for Rejection</p>
                    <p className="text-sm text-white/60 italic">"{req.rejection_reason}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'master' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-4 flex-1 w-full md:max-w-xl bg-white/5 px-6 py-3 rounded-2xl border border-white/10 focus-within:border-it-cyan/50 transition-all">
                <MagnifyingGlassIcon className="w-5 h-5 text-white/20" />
                <input 
                  type="text" 
                  placeholder="Search by Tracking No, Title, or Location..." 
                  className="bg-transparent border-none text-sm w-full focus:ring-0 text-white placeholder-white/20"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full md:w-auto">
                {['All', 'Pending Review', 'Accepted', 'Assigned', 'Completed', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                      statusFilter === status 
                        ? (status === 'All' ? 'bg-it-cyan text-black border-it-cyan' : 
                           status === 'Completed' ? 'bg-green-500 text-black border-green-500' :
                           status === 'Rejected' ? 'bg-red-500 text-black border-red-500' :
                           'bg-it-cyan text-black border-it-cyan')
                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {(() => {
                const filtered = requests.filter(r => {
                  const matchesSearch = !searchQuery || 
                    r.tracking_no?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.location?.toLowerCase().includes(searchQuery.toLowerCase());
                  
                  const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
                  
                  return matchesSearch && matchesStatus;
                });

                const totalPages = Math.ceil(filtered.length / itemsPerPage);
                const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                return (
                  <>
                    <div className="flex justify-between items-center px-2">
                      <div className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">
                        Showing {paginated.length} of {filtered.length} matching requests
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-20 transition-all"
                          >
                            <ChevronRightIcon className="w-4 h-4 rotate-180" />
                          </button>
                          <span className="text-[10px] font-mono text-it-cyan px-3 py-1 bg-it-cyan/10 rounded-lg border border-it-cyan/20">
                            Page {currentPage} / {totalPages}
                          </span>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-20 transition-all"
                          >
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {paginated.map((req) => (
                      <motion.div 
                        key={req.id} 
                        onClick={() => { setDispatchingReq(req); setActiveTab('job_details'); }}
                        className="glass-card p-6 cursor-pointer group flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 transition-all hover:bg-white/[0.04] relative overflow-hidden border-l-it-cyan shadow-[0_10px_30px_rgba(0,255,255,0.05)]"
                      >
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded">{req.tracking_no}</span>
                            <span className="text-xs text-white/40 uppercase tracking-widest">{req.location}</span>
                          </div>
                          <h3 className="text-xl font-bold group-hover:text-it-cyan transition-colors">{req.title}</h3>
                          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
                            <span className={getStatusColor(req.status, type)}>{req.status}</span>
                            <span className="text-white/10">•</span>
                            <span className="text-white/20">{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-3 w-full md:w-auto">
                          <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-[0.2em] inline-block ${getPriorityStyles(req.priority).bg} ${getPriorityStyles(req.priority).text} ${getPriorityStyles(req.priority).border} ${getPriorityStyles(req.priority).glow}`}>
                            {req.priority}
                          </div>
                          {req.sla_deadline && (
                            <div className={`text-[10px] font-mono font-bold ${getTimeToBreach(req.sla_deadline) === 'BREACHED' ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>
                              SLA: {getTimeToBreach(req.sla_deadline)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'job_details' && dispatchingReq && (
          <div className="space-y-6">
            <button 
              onClick={() => setActiveTab('master')}
              className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors mb-4"
            >
              <ChevronRightIcon className="w-4 h-4 rotate-180" /> Back to Master List
            </button>
            
            <div className="glass-card p-0 border-it-cyan/30 bg-it-cyan/[0.02] overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded">{dispatchingReq.tracking_no}</span>
                    <span className="text-xs text-white/40 uppercase tracking-widest">{dispatchingReq.location}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      dispatchingReq.status === 'Completed' ? 'border-green-500 text-green-400 bg-green-500/10' :
                      dispatchingReq.status === 'Rejected' ? 'border-red-500 text-red-500 bg-red-500/10' :
                      'border-it-cyan text-it-cyan bg-it-cyan/10'
                    }`}>
                      {dispatchingReq.status}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">{dispatchingReq.title}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-white/40 text-sm">{dispatchingReq.description}</p>
                    {dispatchingReq.assigned_names && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-it-cyan/10 border border-it-cyan/20">
                        <UsersIcon className="w-4 h-4 text-it-cyan" />
                        <span className="text-xs font-black text-it-cyan uppercase tracking-widest italic">{dispatchingReq.assigned_names}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePrint(dispatchingReq)}
                    className="px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-it-cyan hover:border-it-cyan/30 transition-all flex items-center gap-2"
                    title="Print ISO Form"
                  >
                    <PrinterIcon className="w-5 h-5" />
                  </button>
                  {dispatchingReq.status === 'Accepted' && (
                    <button 
                      onClick={() => {
                        setShowDispatchModal(true);
                      }}
                      className="btn-primary px-8 py-4 flex items-center gap-2"
                    >
                      <UserPlusIcon className="w-5 h-5" /> Assign Technical Staff
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-12">
                {/* Left: Technical Progress */}
                <div className="col-span-12 lg:col-span-7 p-8 border-r border-white/5 space-y-8">
                  {/* Visual Stepper (Minimal version) */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Technical Workflow Status</h4>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className="flex-1 flex flex-col gap-2">
                          <div className={`h-1 rounded-full transition-all ${
                            (dispatchingReq.workflow_step || 1) >= step ? 'bg-it-cyan shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-white/10'
                          }`} />
                          <span className={`text-[8px] font-black uppercase tracking-tighter ${
                            (dispatchingReq.workflow_step || 1) === step ? 'text-it-cyan' : 'text-white/20'
                          }`}>Step {step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Technical Timeline */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-it-cyan border-b border-it-cyan/10 pb-2 flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-3 h-3" /> Technical Timeline
                      </h4>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {loadingTech ? (
                          <div className="text-[10px] uppercase text-white/20 animate-pulse">Scanning logs...</div>
                        ) : techLogs.length === 0 ? (
                          <div className="text-[10px] text-white/10 italic">No technical logs recorded yet</div>
                        ) : (
                          techLogs.map((log, i) => (
                            <div key={i} className="relative pl-4 border-l border-white/10">
                              <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-it-cyan/20 border border-it-cyan/40" />
                              <p className="text-[10px] font-bold text-white/60 mb-1 leading-relaxed">{log.notes}</p>
                              <div className="flex justify-between items-center opacity-30">
                                <span className="text-[8px] uppercase font-black">{log.staff_name}</span>
                                <span className="text-[8px]">{new Date(log.created_at).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Parts Tracking */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-eng-orange border-b border-eng-orange/10 pb-2 flex items-center gap-2">
                        <WrenchScrewdriverIcon className="w-3 h-3" /> Resource Logs
                      </h4>
                      <div className="space-y-2">
                        {loadingTech ? (
                          <div className="text-[10px] uppercase text-white/20 animate-pulse">Auditing assets...</div>
                        ) : techParts.length === 0 ? (
                          <div className="text-[10px] text-white/10 italic">No parts replacement logged</div>
                        ) : (
                          techParts.map((part, i) => (
                            <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5">
                              <p className="text-[10px] font-bold text-white/80">{part.part_name}</p>
                              <p className="text-[8px] font-mono text-white/20 mt-1 uppercase">SN: {part.serial_no}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Discussion */}
                <div className="col-span-12 lg:col-span-5 bg-black/20 border-l border-white/5 h-[500px]">
                  <CommentSection 
                    requestId={dispatchingReq.id} 
                    userName={`${type} Admin`} 
                    userRole="Provider"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dispatch' && (
          <div className="grid gap-6">
            {requests.filter(r => r.status === 'Accepted').length === 0 ? (
              <div className="glass-card p-12 text-center text-white/20 uppercase tracking-widest text-sm">
                No requests awaiting dispatch
              </div>
            ) : (
              requests.filter(r => r.status === 'Accepted').map((req) => (
                <div key={req.id} className="glass-card p-0 border-it-cyan/30 bg-it-cyan/[0.02] overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded">{req.tracking_no}</span>
                        <span className="text-xs text-white/40 uppercase tracking-widest">{req.location}</span>
                      </div>
                      <h3 className="text-2xl font-bold">{req.title}</h3>
                      <p className="text-white/40 text-sm mt-1">{req.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePrint(req)}
                        className="px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-it-cyan hover:border-it-cyan/30 transition-all flex items-center gap-2"
                        title="Print ISO Form"
                      >
                        <PrinterIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setDispatchingReq(req);
                          setSelectedStaffIds([]);
                          setShowDispatchModal(true);
                        }}
                        className="btn-primary px-8 py-4 flex items-center gap-2"
                      >
                        <UserPlusIcon className="w-5 h-5" /> Assign Technical Staff
                      </button>
                    </div>
                  </div>
                  
                  {/* Discussion Panel in Dispatch Card */}
                  <div className="h-[400px] p-6 bg-black/20">
                    <CommentSection 
                      requestId={req.id} 
                      userName={`${type} Admin`} 
                      userRole="Provider"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/[0.02] p-8 rounded-3xl border border-white/5">
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Departmental <span className="text-it-cyan">Asset Registry</span></h3>
                <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-black mt-1">Full inventory of serviced equipment and metadata</p>
              </div>
              <button 
                onClick={handleDownloadAssets}
                className="btn-primary px-8 py-4 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" /> Download CSV Report
              </button>
            </div>

            <div className="glass-card p-0 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-white/20 font-black">
                  <tr>
                    <th className="p-6 pl-8">Property No</th>
                    <th className="p-6">Asset Name</th>
                    <th className="p-6">Model / Specs</th>
                    <th className="p-6">Serial Number</th>
                    <th className="p-6">Site Location</th>
                    <th className="p-6 text-right pr-8">Last Service</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {equipment.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-20 text-center text-white/10 uppercase tracking-[0.5em] text-xs italic font-black">Registry empty • No assets tagged yet</td>
                    </tr>
                  ) : (
                    equipment.map((e) => (
                      <tr key={e.id} className="hover:bg-white/[0.02] transition-all group">
                        <td className="p-6 pl-8 font-mono text-it-cyan text-sm">{e.property_no}</td>
                        <td className="p-6 text-sm font-bold uppercase italic">{e.name}</td>
                        <td className="p-6 text-xs text-white/40">{e.model || 'N/A'}</td>
                        <td className="p-6 font-mono text-xs text-white/20">{e.serial_no || 'N/A'}</td>
                        <td className="p-6 text-xs text-white/40">{e.location || 'N/A'}</td>
                        <td className="p-6 text-right pr-8 text-[10px] font-black text-white/20">
                          {e.last_service_at ? new Date(e.last_service_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* Add Staff Form */}
            <form onSubmit={handleCreateStaff} className="glass-card p-8 border-it-cyan/20">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5 text-it-cyan" /> Add New Technical Staff
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">First Name</label>
                  <input type="text" className="input-field" value={sfName} onChange={(e) => setSfName(e.target.value)} placeholder="e.g. John" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Middle Name</label>
                  <input type="text" className="input-field" value={smName} onChange={(e) => setSmName(e.target.value)} placeholder="e.g. Quincy" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Last Name</label>
                  <input type="text" className="input-field" value={slName} onChange={(e) => setSlName(e.target.value)} placeholder="e.g. Doe" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Suffix</label>
                  <input type="text" className="input-field" value={sSuffix} onChange={(e) => setSSuffix(e.target.value)} placeholder="e.g. Jr." />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Employee ID</label>
                  <input type="text" className="input-field border-it-cyan/20 focus:border-it-cyan font-mono" value={sEmpId} onChange={(e) => setSEmpId(e.target.value)} placeholder="IT-2026-001" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Position</label>
                  <input type="text" className="input-field" value={sPosition} onChange={(e) => setSPosition(e.target.value)} placeholder="e.g. Network Engineer" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full md:w-auto px-12">
                {isSubmitting ? 'Registering...' : 'Register Team Member'}
              </button>
            </form>

            {/* Staff List */}
            <div className="glass-card p-0 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-white/20">
                  <tr>
                    <th className="p-4 pl-8 font-bold">Employee ID</th>
                    <th className="p-4 font-bold">Full Name</th>
                    <th className="p-4 font-bold">Position</th>
                    <th className="p-4 text-right pr-8 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-white/20 uppercase tracking-widest text-xs">No staff registered under your department</td>
                    </tr>
                  ) : (
                    staff.map(s => (
                      <tr key={s.id} className={`hover:bg-white/[0.02] transition-colors group ${!s.is_active ? 'opacity-40' : ''}`}>
                        <td className="p-4 pl-8 font-mono text-it-cyan text-sm">{s.employee_id}</td>
                        <td className="p-4">
                          <span className="text-sm font-bold">{s.first_name} {s.middle_name} {s.last_name} {s.suffix}</span>
                        </td>
                        <td className="p-4 text-sm text-white/60">{s.position}</td>
                        <td className="p-4 text-right pr-8">
                          <button 
                            onClick={() => handleToggleStatus(s.id)}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                              s.is_active 
                                ? 'text-green-400 border-green-400/20 bg-green-400/5 hover:bg-red-400/20 hover:text-red-400 hover:border-red-400/20' 
                                : 'text-white/20 border-white/10 bg-white/5 hover:bg-green-400/20 hover:text-green-400 hover:border-green-400/20'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-green-400' : 'bg-white/20'}`}></span>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold">Technical Performance Analytics</h2>
              <p className="text-white/40 text-sm">Real-time tracking of staff service quality and operational throughput.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {staffAnalytics.map((s) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={s.id} 
                  className="glass-card p-8 border border-white/5 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-it-cyan/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-it-cyan/10 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-it-cyan/10 flex items-center justify-center border border-it-cyan/20">
                        <UsersIcon className="w-6 h-6 text-it-cyan" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{s.name}</h3>
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">{s.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-0.5 mb-1 justify-end">
                        {[1, 2, 3, 4, 5].map(star => (
                          <StarIcon key={star} className={`w-3 h-3 ${Math.round(s.avg_rating || 0) >= star ? 'text-it-cyan fill-it-cyan' : 'text-white/5'}`} />
                        ))}
                      </div>
                      <p className="text-sm font-black text-it-cyan">
                        {s.avg_rating ? Number(s.avg_rating).toFixed(1) : '0.0'} <span className="text-[10px] text-white/20 font-normal">AVG SCORE</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2 mb-3 opacity-40">
                        <CalendarIcon className="w-3 h-3" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Monthly Load</span>
                      </div>
                      <p className="text-3xl font-black text-white">{s.monthly_jobs || 0}</p>
                      <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
                        <div className="h-full bg-it-cyan" style={{ width: `${Math.min((s.monthly_jobs / 20) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2 mb-3 opacity-40">
                        <BoltIcon className="w-3 h-3" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Total Resolved</span>
                      </div>
                      <p className="text-3xl font-black text-white">{s.total_jobs || 0}</p>
                      <p className="text-[10px] text-white/20 mt-2 uppercase font-bold">Lifetime Experience</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {staffAnalytics.length === 0 && (
                <div className="col-span-2 p-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <ChartBarIcon className="w-12 h-12 text-white/5 mx-auto mb-4" />
                  <p className="text-white/20 uppercase tracking-widest text-sm">No historical performance data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="grid gap-4">
            {requests.filter(r => r.status === 'Completed').length === 0 ? (
              <div className="glass-card p-12 text-center text-white/20 uppercase tracking-widest text-sm">
                No completed jobs in history
              </div>
            ) : (
              requests.filter(r => r.status === 'Completed').map((req) => (
                <div key={req.id} className="glass-card p-6 border-l-4 border-l-green-500 bg-green-500/[0.02] relative overflow-hidden group">
                  <div className="absolute right-[5%] top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.05] text-7xl font-black uppercase tracking-[0.2em] text-green-500">
                    {req.status}
                  </div>
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-widest">{req.tracking_no}</span>
                        <span className="text-xs text-white/40 uppercase tracking-widest">{req.location}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white/90">{req.title}</h3>
                      <p className="text-[10px] text-white/20 uppercase font-black mt-1">Completed: {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handlePrint(req)}
                      className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-black transition-all"
                    >
                      <PrinterIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="glass-card p-6 border-it-cyan/10 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest">Technical Audit History</h3>
                  <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] mt-1">Real-time Technical Activity Stream</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-it-cyan/10 border border-it-cyan/20">
                  <div className="w-2 h-2 rounded-full bg-it-cyan animate-pulse"></div>
                  <span className="text-[10px] font-bold text-it-cyan uppercase tracking-widest">Live Monitoring</span>
                </div>
              </div>
            </div>

            <div className="glass-card overflow-hidden border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Request</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Technical Staff</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Log Entry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {globalLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-white/20 italic text-sm">No technical activities recorded yet</td>
                      </tr>
                    ) : (
                      globalLogs.map((log, i) => (
                        <tr key={log.id || i} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-[10px] text-white/60 font-mono">
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-white/20 font-mono">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[10px] font-mono text-it-cyan bg-it-cyan/10 px-2 py-0.5 rounded inline-block mb-1">
                              {log.tracking_no}
                            </div>
                            <div className="text-xs font-bold text-white truncate max-w-[150px]">
                              {log.title}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                {log.first_name?.[0]}{log.last_name?.[0]}
                              </div>
                              <div className="text-xs font-medium text-white/80">
                                {log.first_name} {log.last_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-white/60 leading-relaxed italic group-hover:text-white transition-colors">
                              "{log.entry || log.notes}"
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="glass-card p-8 border-white/5">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <SpeakerWaveIcon className="w-6 h-6 text-it-cyan" />
                Broadcast Portal Reminders
              </h3>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  className="input-field flex-1" 
                  placeholder="Enter reminder for the public portal marquee..."
                  value={newReminder}
                  onChange={(e) => setNewReminder(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddReminder()}
                />
                <button 
                  onClick={handleAddReminder}
                  className={`px-8 py-3 rounded-xl font-bold transition-all ${type === 'IT' ? 'bg-it-cyan' : 'bg-eng-orange'} text-black hover:scale-105`}
                >
                  Broadcast
                </button>
              </div>
              <p className="mt-4 text-[10px] text-white/20 uppercase tracking-widest font-bold">This message will scroll horizontally at the bottom of the {type} Operations Board.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 px-2">Active Broadcasts</h4>
              {reminders.length === 0 ? (
                <div className="glass-card p-12 text-center text-white/10 uppercase tracking-widest text-sm">No active reminders</div>
              ) : (
                reminders.map((rem) => (
                  <div key={rem.id} className="glass-card p-6 flex justify-between items-center group bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${type === 'IT' ? 'bg-it-cyan' : 'bg-eng-orange'} animate-pulse`} />
                      <p className="text-white/80">{rem.text}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
      <AnimatePresence>
        {showDispatchModal && dispatchingReq && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDispatchModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-card p-8 border-it-cyan/30 bg-[#1a1a2e]"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Dispatch Technical Team</h2>
                  <p className="text-it-cyan text-[10px] uppercase tracking-[0.2em] font-bold">Request: {dispatchingReq.tracking_no}</p>
                </div>
                <button onClick={() => setShowDispatchModal(false)} className="text-white/20 hover:text-white transition-colors">
                  <XCircleIcon className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-sm text-white/40 mb-4">Select the staff members to assign to this task:</p>
                {staff.filter(s => s.is_active).map(s => {
                  const isSelected = selectedStaffIds.includes(s.id);
                  return (
                    <div 
                      key={s.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedStaffIds(selectedStaffIds.filter(id => id !== s.id));
                        } else {
                          setSelectedStaffIds([...selectedStaffIds, s.id]);
                        }
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                        isSelected ? 'border-it-cyan bg-it-cyan/10' : 'border-white/5 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-it-cyan border-it-cyan' : 'border-white/20'
                      }`}>
                        {isSelected && <CheckBadgeIcon className="w-4 h-4 text-black" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold">{s.first_name} {s.last_name}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">{s.position}</div>
                      </div>
                      <div className="text-[10px] font-mono text-white/20">{s.employee_id}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setShowDispatchModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (selectedStaffIds.length === 0) {
                      alert('Please select at least one staff member');
                      return;
                    }
                    await handleDispatch(dispatchingReq.id, selectedStaffIds);
                    setShowDispatchModal(false);
                  }}
                  disabled={isSubmitting || selectedStaffIds.length === 0}
                  className="btn-primary flex-1 py-4"
                >
                  {isSubmitting ? 'Dispatching...' : `Dispatch ${selectedStaffIds.length} Staff`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {printingReq && (
        <div className="print-only">
          <PrintableRequest 
            request={printingReq} 
            logs={printingLogs} 
            parts={printingParts} 
          />
        </div>
      )}
      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRejectModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a1a] border border-red-500/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col p-10"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-500/10 rounded-2xl">
                   <NoSymbolIcon className="w-8 h-8 text-red-500" />
                </div>
                <div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Decline <span className="text-red-500">Request</span></h3>
                   <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-black mt-1">Official Rejection Protocol</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 block mb-3 pl-1">Formal Reason for Rejection</label>
                  <textarea 
                    autoFocus
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a specific reason for declining this ticket..."
                    className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/10 text-sm focus:border-red-500/50 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 py-4 rounded-xl bg-white/5 text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmReject}
                    disabled={isSubmitting}
                    className="flex-1 py-4 rounded-xl bg-red-500 text-black text-xs font-black uppercase tracking-widest hover:bg-red-400 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Priority Adjustment Modal */}
      <AnimatePresence>
        {showPriorityModal && targetReq && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPriorityModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a1a] border border-it-cyan/20 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col p-10"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-it-cyan/10 rounded-2xl">
                   <ArrowPathIcon className="w-8 h-8 text-it-cyan" />
                </div>
                <div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Adjust <span className="text-it-cyan">Priority</span></h3>
                   <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-black mt-1">Recalculating Operational SLA</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 block mb-4">New Response Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Urgent', 'High', 'Medium', 'Low'].map(p => (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          newPriority === p ? 'bg-it-cyan text-black border-it-cyan' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 block mb-3 pl-1">Justification for Adjustment</label>
                  <textarea 
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Why is the priority being adjusted? (e.g., Downgraded due to non-critical impact)"
                    className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/10 text-sm focus:border-it-cyan/50 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowPriorityModal(false)}
                    className="flex-1 py-4 rounded-xl bg-white/5 text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAdjustPriority}
                    disabled={isSubmitting}
                    className="flex-1 py-4 rounded-xl bg-it-cyan text-black text-xs font-black uppercase tracking-widest hover:bg-[#00d1e0] transition-all shadow-lg shadow-it-cyan/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Update & Reset SLA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper for shield icon
const ShieldCheckIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
);

export default ProviderDashboard;
