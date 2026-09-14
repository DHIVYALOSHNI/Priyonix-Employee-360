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
import { fetchActivityLogs } from '../services/activityService';
import { ActivityLogItem } from '../types';

export const ActivityPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const data = await fetchActivityLogs(50);
        setLogs(data);
      } catch (err) {
        console.error('Error loading activity logs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
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
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <ShieldCheck size={14} />
            <span>Zero-Trust Enterprise Audit Log</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Security & Activity Audit
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Immutable system audit logs tracking administrative actions, employee updates, and status modifications.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#174A4A] text-[#F7F4ED]">
            Live Audit Stream ({logs.length} Events)
          </span>
        </div>
      </section>

      {/* 2. SEARCH & FILTER */}
      <section className="p-4 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716B]" />
          <input
            type="text"
            placeholder="Search by action, user, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F4ED] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#F7F4ED] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
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
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#E5E0D5] text-[#73716B] text-[10px] uppercase font-bold">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD7CA] bg-[#F7F4ED]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#73716B]">
                    No audit records matching search.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-[#EFEAE0]/60 transition-colors">
                    <td className="py-3 px-5 font-mono text-[11px] text-[#73716B] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#174A4A] bg-[#174A4A]/10 px-2 py-0.5 rounded-md text-[10px]">
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#30302D]">
                      {item.targetId || '-'}
                    </td>
                    <td className="py-3 px-4 text-[#30302D]">
                      <div className="font-semibold">{item.performedByName}</div>
                      <div className="text-[10px] text-[#789B8B]">{item.performedByRole}</div>
                    </td>
                    <td className="py-3 px-5 text-[#73716B] max-w-md">
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
