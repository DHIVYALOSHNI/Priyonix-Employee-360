import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  ShieldCheck, 
  Calendar, 
  User, 
  FileText,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchActivityLogs, getCachedActivityLogs } from '../services/activityService';
import { ActivityLogItem } from '../types';

export const ActivityPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLogItem[]>(() => getCachedActivityLogs() || []);
  const [loading, setLoading] = useState(() => !getCachedActivityLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const loadLogs = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await fetchActivityLogs(50);
        setLogs(data);
      } catch (err) {
        console.error('Error loading activity logs:', err);
      } finally {
        setLoading(false);
      }
    };

    const cached = getCachedActivityLogs();
    if (cached && cached.length > 0) {
      setLogs(cached);
      setLoading(false);
      loadLogs(true);
    } else {
      loadLogs(false);
    }
  }, []);

  const filtered = logs.filter(l => {
    const matchesSearch = !searchTerm.trim() ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || l.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase flex items-center space-x-1.5">
            <ShieldCheck size={14} />
            <span>Zero-Trust Enterprise Audit Log</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Security & Activity Audit
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            Immutable system audit logs tracking administrative actions, employee updates, and status modifications.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#047857] text-white shadow-xs">
            Live Audit Stream ({logs.length} Events)
          </span>
        </div>
      </section>

      {/* 2. SEARCH & FILTER */}
      <section className="p-4 rounded-3xl bg-white border border-[#E7E3D8] flex flex-wrap items-center gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656966]" />
          <input
            type="text"
            placeholder="Search by action, user, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
          >
            <option value="ALL">All Actions</option>
            <option value="UPDATE">Update Actions</option>
            <option value="CREATE">Create Actions</option>
            <option value="STATUS">Status Actions</option>
            <option value="DELETE">Delete Actions</option>
          </select>
        </div>
      </section>

      {/* 3. AUDIT TIMELINE TABLE */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8F6F1] text-[#656966] text-[10px] uppercase font-bold border-b border-[#E7E3D8]">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3D8] bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#656966]">
                    No audit records matching search.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-[#F8F6F1]/80 transition-colors">
                    <td className="py-3 px-5 font-mono text-[11px] text-[#656966] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md text-[10px]">
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#222525]">
                      {item.targetId || '-'}
                    </td>
                    <td className="py-3 px-4 text-[#222525]">
                      <div className="font-semibold">{item.performedByName}</div>
                      <div className="text-[10px] text-[#047857]">{item.performedByRole}</div>
                    </td>
                    <td className="py-3 px-5 text-[#656966] max-w-md">
                      {item.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
