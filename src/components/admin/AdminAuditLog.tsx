import React, { useState } from 'react';
import { ShieldCheck, Clock, User, Filter, AlertCircle } from 'lucide-react';

interface AuditItem {
  id: string;
  action: string;
  category: 'Auth' | 'Product' | 'Order' | 'Settings';
  user: string;
  details: string;
  timestamp: string;
  status: 'Success' | 'Denied' | 'Notice';
}

const INITIAL_LOGS: AuditItem[] = [
  {
    id: 'log-1',
    action: 'Firebase Admin Sign-In',
    category: 'Auth',
    user: 'admin@clothiqo.com',
    details: 'Verified role: admin, active: true via Firestore users/{uid}',
    timestamp: 'Just now',
    status: 'Success',
  },
  {
    id: 'log-2',
    action: 'Courier Logistics Sync',
    category: 'Settings',
    user: 'admin@clothiqo.com',
    details: 'Configured Steadfast API and Pathao integration profiles',
    timestamp: '15 mins ago',
    status: 'Success',
  },
  {
    id: 'log-3',
    action: 'Order Status Transition',
    category: 'Order',
    user: 'admin@clothiqo.com',
    details: 'Updated Order #CLT-8241 to Shipped via Steadfast Courier',
    timestamp: '1 hour ago',
    status: 'Success',
  },
  {
    id: 'log-4',
    action: 'Branding & Design Update',
    category: 'Settings',
    user: 'admin@clothiqo.com',
    details: 'Synchronized top announcement bar & 3D orbit showcase parameters',
    timestamp: '2 hours ago',
    status: 'Success',
  },
  {
    id: 'log-5',
    action: 'Unauthorized Admin Attempt',
    category: 'Auth',
    user: 'anonymous-visitor',
    details: 'Attempted /admin route without valid credentials (Blocked)',
    timestamp: '5 hours ago',
    status: 'Denied',
  },
];

export const AdminAuditLog: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const [logs] = useState<AuditItem[]>(INITIAL_LOGS);

  const filteredLogs = filter === 'All' ? logs : logs.filter((l) => l.category === filter);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>Security &amp; Administrative Audit Log</span>
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Immutable tracking of Firebase admin sessions, order adjustments, and configuration updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Auth', 'Product', 'Order', 'Settings'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === cat
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#faf8f4] text-[#666666] border border-[#d5cfc0] hover:bg-black/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#ece7dc] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf8f4] border-b border-[#ece7dc] text-[#555555] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Category</th>
                <th className="p-4">User</th>
                <th className="p-4">Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eae0]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#faf8f4]/60 transition">
                  <td className="p-4 font-bold text-[#111111]">{log.action}</td>
                  <td className="p-4 font-semibold text-[#666666]">{log.category}</td>
                  <td className="p-4 font-mono text-[11px] text-[#444444]">{log.user}</td>
                  <td className="p-4 text-[#555555] max-w-xs truncate">{log.details}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide ${
                        log.status === 'Success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'Denied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-[#777777] font-mono text-[11px]">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
