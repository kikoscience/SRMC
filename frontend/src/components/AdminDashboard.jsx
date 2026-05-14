import React from 'react';
import { 
  UsersIcon, 
  ServerIcon, 
  PresentationChartBarIcon, 
  AdjustmentsHorizontalIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const metrics = [
    { label: 'Total Requests', value: '1,240', change: '+12%', icon: CircleStackIcon },
    { label: 'Avg. Resolution', value: '4.2 hrs', change: '-5%', icon: ServerIcon },
    { label: 'System Uptime', value: '99.9%', change: '0%', icon: PresentationChartBarIcon },
    { label: 'Active Staff', value: '18', change: '+2', icon: UsersIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div key={m.label} className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-400/10 rounded-lg text-purple-400">
                <m.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold ${m.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {m.change}
              </span>
            </div>
            <h4 className="text-white/40 text-xs uppercase tracking-widest mb-1">{m.label}</h4>
            <span className="text-3xl font-bold">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 glass-card overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg">Recent Audit Logs</h3>
            <button className="text-xs text-it-cyan hover:underline">Export CSV</button>
          </div>
          <div className="p-0">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-white/40">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {[
                  { time: '13:42:01', user: 'Admin-01', action: 'STATUS_CHANGE', entity: 'SR-2026-001' },
                  { time: '13:38:12', user: 'IT-Prov-1', action: 'ASSIGN_STAFF', entity: 'SR-2026-003' },
                  { time: '13:35:45', user: 'Eng-Staff-4', action: 'UPLOAD_ASSET', entity: 'PROP-122' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-mono text-white/40">{row.time}</td>
                    <td className="px-6 py-4">{row.user}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold">{row.action}</span>
                    </td>
                    <td className="px-6 py-4 text-it-cyan">{row.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg mb-6 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-it-cyan" />
              Quick Config
            </h3>
            <div className="space-y-4">
              <button className="w-full btn-secondary text-left text-sm py-3 px-4">Manage Departments</button>
              <button className="w-full btn-secondary text-left text-sm py-3 px-4">Staff Roles & Permissions</button>
              <button className="w-full btn-secondary text-left text-sm py-3 px-4">Maintenance Schedules</button>
              <button className="w-full btn-secondary text-left text-sm py-3 px-4">Backup System DB</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
