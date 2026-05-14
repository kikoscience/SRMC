import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ServerIcon, 
  PresentationChartBarIcon, 
  AdjustmentsHorizontalIcon,
  CircleStackIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const [statsRes, auditRes] = await Promise.all([
        fetch(`http://${host}:5001/api/admin/stats`),
        fetch(`http://${host}:5001/api/admin/audit`)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div key={m.label} className="glass-card p-6 border-white/5 group hover:border-it-cyan/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-it-cyan/10 rounded-lg text-it-cyan group-hover:scale-110 transition-transform">
                <m.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {m.change}
              </span>
            </div>
            <h4 className="text-white/40 text-xs uppercase tracking-widest mb-1">{m.label}</h4>
            <span className="text-3xl font-black italic">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 glass-card overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-tight">Global System Audit</h3>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-1">Cross-Department Operational Stream</p>
            </div>
            <button className="px-4 py-2 bg-white/5 hover:bg-it-cyan hover:text-black rounded-lg text-[10px] font-black uppercase transition-all">Export System Logs</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Technician</th>
                  <th className="px-6 py-4">Tracking No</th>
                  <th className="px-6 py-4">Action Taken</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {auditLogs.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-mono text-white/40 text-xs">{new Date(row.created_at).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 font-bold">{row.first_name} {row.last_name}</td>
                    <td className="px-6 py-4 text-it-cyan font-mono text-xs">{row.tracking_no}</td>
                    <td className="px-6 py-4">
                      <span className="text-white/60 italic">"{row.entry || row.notes}"</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border-white/5">
            <h3 className="text-lg mb-6 flex items-center gap-2 font-bold uppercase">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-it-cyan" />
              System Config
            </h3>
            <div className="space-y-3">
              <button className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left text-xs font-bold uppercase tracking-widest hover:border-it-cyan/30 transition-all flex justify-between items-center group">
                Manage Departments
                <div className="w-2 h-2 rounded-full bg-it-cyan opacity-20 group-hover:opacity-100" />
              </button>
              <button className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left text-xs font-bold uppercase tracking-widest hover:border-it-cyan/30 transition-all flex justify-between items-center group">
                SLA Thresholds
                <div className="w-2 h-2 rounded-full bg-it-cyan opacity-20 group-hover:opacity-100" />
              </button>
              <button className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left text-xs font-bold uppercase tracking-widest hover:border-it-cyan/30 transition-all flex justify-between items-center group">
                Staff Permissions
                <div className="w-2 h-2 rounded-full bg-it-cyan opacity-20 group-hover:opacity-100" />
              </button>
              <button className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left text-xs font-bold uppercase tracking-widest hover:border-red-500/30 transition-all flex justify-between items-center group">
                Backup Database
                <div className="w-2 h-2 rounded-full bg-red-500 opacity-20 group-hover:opacity-100 animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
