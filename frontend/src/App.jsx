import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  UserGroupIcon, 
  WrenchScrewdriverIcon, 
  CpuChipIcon,
  ChevronRightIcon,
  ArrowLeftOnRectangleIcon,
  XCircleIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

import RequesterDashboard from './components/RequesterDashboard';
import ProviderDashboard from './components/ProviderDashboard';
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';
import PublicPortal from './components/PublicPortal';
import PrintableRequest from './components/PrintableRequest';

const App = () => {
  const [role, setRole] = useState(null);
  const [providerType, setProviderType] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [showStaffSelector, setShowStaffSelector] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [printContext, setPrintContext] = useState(null); // { request, logs, parts }

  React.useEffect(() => {
    const host = window.location.hostname || 'localhost';
    fetch(`http://${host}:5001/api/staff`)
      .then(res => res.json())
      .then(data => setStaffList(Array.isArray(data) ? data : []))
      .catch(err => console.error('Staff fetch error:', err));
  }, []);

  const roles = [
    { id: 'requester', name: 'Requester', icon: UserGroupIcon, color: 'text-blue-400', desc: 'Department Head / Encoder' },
    { id: 'it_provider', name: 'IT Provider', icon: ShieldCheckIcon, color: 'text-it-cyan', desc: 'IT Service Management' },
    { id: 'eng_provider', name: 'Engineering Provider', icon: ShieldCheckIcon, color: 'text-eng-orange', desc: 'Facilities & Engineering' },
    { id: 'staff', name: 'Technical Staff', icon: WrenchScrewdriverIcon, color: 'text-white/40', desc: 'Maintenance & Repairs' },
    { id: 'admin', name: 'Administrator', icon: CpuChipIcon, color: 'text-eng-orange', desc: 'System Control' },
    { id: 'it_portal', name: 'IT Public Board', icon: BoltIcon, color: 'text-it-cyan', desc: 'IT Office Status Display' },
    { id: 'eng_portal', name: 'Engineering Public Board', icon: BoltIcon, color: 'text-eng-orange', desc: 'Engineering Status Display' }
  ];

  const handleLogin = (selectedRole) => {
    if (selectedRole === 'it_provider') {
      setRole('provider');
      setProviderType('IT');
    } else if (selectedRole === 'eng_provider') {
      setRole('provider');
      setProviderType('Engineering');
    } else if (selectedRole === 'staff') {
      setShowStaffSelector(true);
    } else {
      setRole(selectedRole);
      setProviderType(null);
    }
  };

  const [notification, setNotification] = useState(null);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-radial from-[#1a1a2e] to-dark-bg">
      {/* Premium Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl glass-card border-it-cyan/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[350px]"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              notification.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-it-cyan/20 text-it-cyan'
            }`}>
              {notification.type === 'error' ? <XCircleIcon className="w-6 h-6" /> : <ShieldCheckIcon className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 mb-0.5">System Notification</p>
              <p className="text-sm font-bold text-white/90">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/5 rounded-full transition-colors">
              <XCircleIcon className="w-4 h-4 text-white/20" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!role ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl no-print"
          >
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl mb-4 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent uppercase tracking-tight font-black">
                SRMC <span className="text-it-cyan font-light italic">Portal</span>
              </h1>
              <p className="text-white/40 text-lg uppercase tracking-[0.3em] font-light">Service Request & Inspection Management System</p>
            </div>

            {!showStaffSelector ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleLogin(r.id)}
                    className="glass-card p-6 group text-left hover:border-it-cyan/50 hover:bg-white/[0.08] transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-it-cyan/5 blur-[50px] group-hover:bg-it-cyan/10 transition-all"></div>
                    <div className={`p-3 rounded-xl bg-white/5 w-fit mb-4 group-hover:scale-110 transition-transform relative z-10 ${r.color}`}>
                      <r.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg mb-1 font-bold relative z-10">{r.name}</h3>
                    <p className="text-white/40 text-[10px] leading-relaxed mb-4 relative z-10">{r.desc}</p>
                    <div className="flex items-center text-it-cyan text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                      Enter Dashboard <ChevronRightIcon className="w-3 h-3 ml-1" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 max-w-2xl mx-auto border-it-cyan/30 bg-[#1a1a2e]/80 backdrop-blur-3xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black uppercase italic tracking-tight">Select <span className="text-it-cyan">Staff Account</span></h2>
                  <button onClick={() => setShowStaffSelector(false)} className="text-white/20 hover:text-white underline text-[10px] font-bold uppercase tracking-widest">Back to Roles</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {staffList.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => {
                        setCurrentStaff(s);
                        setRole('staff');
                      }}
                      className="p-4 rounded-xl bg-white/5 hover:bg-it-cyan/10 border border-white/10 hover:border-it-cyan/50 transition-all text-left group"
                    >
                      <h4 className="font-bold group-hover:text-it-cyan transition-colors">{s.first_name} {s.last_name}</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{s.position}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            
            <div className="mt-12 text-center text-white/10 text-[10px] tracking-[0.5em] uppercase font-black">
              Integrated Hospital Operations Management System | Enterprise v3.0
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full min-h-screen no-print"
          >
            {(role === 'it_portal' || role === 'eng_portal') ? (
              <PublicPortal type={role === 'it_portal' ? 'IT' : 'Engineering'} />
            ) : (
              <>
                <nav className="glass-card m-6 p-4 flex justify-between items-center border-white/5 bg-[#1a1a2e]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-it-cyan/10 flex items-center justify-center border border-it-cyan/20">
                      <CpuChipIcon className="w-6 h-6 text-it-cyan" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">SRMC <span className="text-it-cyan">System</span></h4>
                      <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold mt-0.5">
                        {role === 'staff' ? `${currentStaff?.first_name} ${currentStaff?.last_name}` : role} authenticated
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/5 border border-green-500/10 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Network Secure</span>
                    </div>
                    <button 
                      onClick={() => {
                        setRole(null);
                        setCurrentStaff(null);
                      }}
                      className="p-3 bg-white/5 hover:bg-red-500/10 rounded-xl text-white/20 hover:text-red-400 transition-all border border-white/5"
                      title="Logout"
                    >
                      <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </nav>

                <main className="px-6">
                  {role === 'requester' && <RequesterDashboard notify={notify} onPrint={(data) => setPrintContext(data)} />}
                  {role === 'provider' && <ProviderDashboard type={providerType} notify={notify} onPrint={(data) => setPrintContext(data)} />}
                  {role === 'staff' && <StaffDashboard user={currentStaff} notify={notify} onPrint={(data) => setPrintContext(data)} />}
                  {role === 'admin' && <AdminDashboard notify={notify} onPrint={(data) => setPrintContext(data)} />}
                </main>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Print Mode Overlay */}
      <AnimatePresence>
        {printContext && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white overflow-auto flex flex-col items-center hide-scrollbar"
          >
            <div className="w-full max-w-[210mm] no-print p-4 flex justify-between items-center bg-gray-100 border-b border-gray-200">
               <button 
                 onClick={() => setPrintContext(null)}
                 className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black flex items-center gap-2"
               >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4 rotate-180" /> Exit Print View
               </button>
               <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all shadow-lg"
                  >
                     Confirm Print
                  </button>
               </div>
            </div>
            
            <div className="p-8">
               <PrintableRequest 
                  request={printContext.request}
                  logs={printContext.logs}
                  parts={printContext.parts}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
