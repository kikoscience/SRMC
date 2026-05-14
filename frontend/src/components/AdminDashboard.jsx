import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ServerIcon, 
  PresentationChartBarIcon, 
  AdjustmentsHorizontalIcon,
  CircleStackIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import API_BASE_URL from '../config';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`),
        fetch(`${API_BASE_URL}/api/admin/audit`)
      ]);
      const [statsData, auditData] = await Promise.all([statsRes.json(), auditRes.json()]);
      setStats(statsData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) return <div className="text-center p-20 animate-pulse text-it-cyan font-black italic tracking-widest uppercase">Initializing Command Center...</div>;

  const metrics = [
    { label: 'Total Requests', value: stats?.total_requests || 0, change: 'Lifetime', icon: CircleStackIcon },
    { label: 'Avg. Resolution', value: stats?.avg_age_hours ? `${stats.avg_age_hours} hrs` : 'N/A', change: 'Current Queue', icon: ClockIcon },
    { label: 'System Staff', value: stats?.active_staff || 0, change: 'Verified', icon: UsersIcon },
    { label: 'Completion Rate', value: stats?.total_requests ? `${Math.round((stats.completed_requests / stats.total_requests) * 100)}%` : '0%', change: 'Performance', icon: PresentationChartBarIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Real-time Status Header */}
      <div className="flex justify-between items-end mb-4 px-2">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">System <span className="text-it-cyan">Integrity</span></h2>
          <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-black mt-1">Live NOC Feed | Data Refreshing every 10s</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Gateway</p>
            <span className="text-[10px] font-mono text-green-500">10.0.1.90:5001</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-it-cyan/20 rounded-2xl animate-ping scale-75" />
            <BoltIcon className="w-5 h-5 text-it-cyan relative z-10" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div key={m.label} className="glass-card p-6 border-white/5 group hover:border-it-cyan/30 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-it-cyan/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-it-cyan/10 rounded-lg text-it-cyan group-hover:scale-110 transition-transform">
                <m.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {m.change}
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-white group-hover:text-it-cyan transition-colors">{m.value}</p>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Audit Trail <span className="text-it-cyan/30">| Recent Operations</span></h3>
             <button onClick={fetchData} className="text-[10px] text-it-cyan font-black uppercase tracking-widest hover:underline">Force Sync</button>
          </div>
          <div className="glass-card overflow-hidden border-white/5">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">Reference</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">Operator</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-xs text-white/60">{new Date(log.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-white/20 font-mono">{new Date(log.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-it-cyan border border-white/10">{log.tracking_no}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white/80">{log.first_name} {log.last_name}</p>
                      <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Staff Unit</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40 group-hover:text-white/80 transition-colors">
                      {log.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 px-2">Network Grid</h3>
          <div className="glass-card p-8 border-white/5">
            <div className="grid grid-cols-6 gap-3">
              {[...Array(24)].map((_, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-md border flex items-center justify-center transition-all duration-1000 ${
                    i % 7 === 0 ? 'bg-red-500/20 border-red-500/30' : 
                    i % 3 === 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 
                    'bg-it-cyan/10 border-it-cyan/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    i % 7 === 0 ? 'bg-red-500 animate-pulse' : 
                    i % 3 === 0 ? 'bg-yellow-500' : 
                    'bg-it-cyan'
                  }`} />
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Database Latency</span>
                 <span className="text-[10px] font-mono text-green-500">12ms</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Active Threads</span>
                 <span className="text-[10px] font-mono text-it-cyan">14 active</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 border-eng-orange/10 bg-eng-orange/[0.02]">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-eng-orange/10 flex items-center justify-center">
                   <ServerIcon className="w-4 h-4 text-eng-orange" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">System Logs</h4>
             </div>
             <p className="text-xs text-white/40 leading-relaxed">System logs are being streamed to the primary NOC terminal. Ensure all primary gateways are within SLA parameters.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
