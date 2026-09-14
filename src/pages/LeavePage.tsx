import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  ShieldCheck, 
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchLeaves, 
  requestLeave, 
  updateLeaveStatus, 
  calculateLeaveSummary,
  getCachedLeaves
} from '../services/leaveService';
import { LeaveRecord } from '../types';

export const LeavePage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const empIdFilter = isAdmin ? undefined : userProfile?.employeeId;
  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => getCachedLeaves(empIdFilter) || []);
  const [loading, setLoading] = useState(() => !getCachedLeaves(empIdFilter));
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRecord['leaveType']>('CASUAL');
  const [duration, setDuration] = useState<LeaveRecord['duration']>('FULL_DAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadLeaves = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // If Admin, load all company leaves; if Employee, load their own leaves
      const data = await fetchLeaves(isAdmin ? undefined : userProfile?.employeeId, userProfile?.uid);
      setLeaves(data);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedLeaves(empIdFilter);
    if (cached && cached.length > 0) {
      setLeaves(cached);
      setLoading(false);
      loadLeaves(true);
    } else {
      loadLeaves(false);
    }
  }, [isAdmin, userProfile?.employeeId, userProfile?.uid]);

  const summary = useMemo(() => calculateLeaveSummary(leaves), [leaves]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setFormError(null);

    if (!startDate || !endDate) {
      setFormError('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after end date.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Please enter a business reason for your leave.');
      return;
    }

    setSubmitting(true);
    try {
      const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const count = duration === 'HALF_DAY' ? 0.5 : diffDays;

      await requestLeave({
        ownerUid: userProfile.uid,
        employeeId: userProfile.employeeId,
        employeeName: userProfile.name,
        leaveType,
        startDate,
        endDate,
        duration,
        daysCount: count,
        reason: reason.trim(),
      });

      setShowRequestModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      await loadLeaves();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminDecision = async (leave: LeaveRecord, decision: 'APPROVED' | 'REJECTED') => {
    if (!userProfile) return;
    setActionLoadingId(leave.id);
    try {
      await updateLeaveStatus(
        leave.id,
        decision,
        userProfile.uid,
        userProfile.name,
        leave.ownerUid,
        leave.employeeName,
        decision === 'REJECTED' ? 'Administrative policy requirements' : undefined
      );
      await loadLeaves();
    } catch (err) {
      console.error('Error updating leave status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => statusFilter === 'ALL' ? true : l.status === statusFilter);
  }, [leaves, statusFilter]);

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase flex items-center space-x-1.5">
            <CalendarDays size={14} />
            <span>Time Off & Statutory Leave</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Leave Management
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            {isAdmin 
              ? 'Review and manage organization-wide leave requests and automated balance adjustments.'
              : 'Submit leave applications, track approval statuses, and monitor your annual leave balance.'
            }
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#047857] hover:bg-[#065F46] text-white transition-colors flex items-center space-x-2 shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>Apply for Leave</span>
        </button>
      </section>

      {/* 2. LEAVE METRICS COUNTERS (Executive Emerald Cards) */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#E7E3D8] text-center shadow-xs">
          <span className="text-[10px] font-bold text-[#656966] uppercase tracking-wider">Total Allowance</span>
          <p className="text-2xl font-bold text-[#0B2E2E] font-display mt-1">{summary.totalAllowance} Days</p>
          <span className="text-[10px] text-[#656966]">Annual statutory</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#FDE68A] text-center shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#F59E0B]" />
          <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Leaves Used</span>
          <p className="text-2xl font-bold text-[#D97706] font-display mt-1">{summary.used} Days</p>
          <span className="text-[10px] text-[#656966]">Consumed year-to-date</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#A7F3D0] text-center shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#047857]" />
          <span className="text-[10px] font-bold text-[#047857] uppercase tracking-wider">Remaining</span>
          <p className="text-2xl font-bold text-[#047857] font-display mt-1">{summary.remaining} Days</p>
          <span className="text-[10px] text-[#047857] font-medium">Available balance</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#FDE68A] text-center shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#F59E0B]" />
          <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Pending Action</span>
          <p className="text-2xl font-bold text-[#D97706] font-display mt-1">{summary.pendingCount}</p>
          <span className="text-[10px] text-[#D97706] font-medium">Awaiting review</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E7E3D8] text-center shadow-xs">
          <span className="text-[10px] font-bold text-[#656966] uppercase tracking-wider">Half Days</span>
          <p className="text-2xl font-bold text-[#222525] font-display mt-1">{summary.halfDayCount}</p>
          <span className="text-[10px] text-[#656966]">Logged partials</span>
        </div>
      </section>

      {/* 3. LEAVE APPLICATIONS TABLE */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E3D8]">
          <div>
            <h2 className="text-lg font-bold text-[#0B2E2E] font-display">
              {isAdmin ? 'All Corporate Leave Applications' : 'Your Leave History'}
            </h2>
            <p className="text-xs text-[#656966]">Audited and timestamped in Firestore database.</p>
          </div>

          {/* STATUS FILTER PILLS */}
          <div className="flex items-center space-x-1.5 bg-[#F8F6F1] p-1 rounded-xl border border-[#E7E3D8]">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === status 
                    ? 'bg-[#047857] text-white shadow-xs' 
                    : 'text-[#656966] hover:text-[#222525]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8F6F1] text-[#656966] text-[10px] uppercase font-bold border-b border-[#E7E3D8]">
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Admin Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3D8]">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-[#656966]">
                    No leave applications matching the filter.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(lv => (
                  <tr key={lv.id} className="hover:bg-[#F8F6F1]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#222525]">
                      <div>{lv.employeeName}</div>
                      <div className="text-[10px] font-mono text-[#656966]">{lv.employeeId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0B2E2E]">{lv.leaveType}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#656966]">
                      {lv.startDate} to {lv.endDate}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#222525]">
                      {lv.daysCount} days ({lv.duration})
                    </td>
                    <td className="py-3 px-4 text-[#656966] max-w-xs truncate">
                      {lv.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lv.status === 'APPROVED' ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]' :
                        lv.status === 'PENDING' ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' :
                        'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                      }`}>
                        {lv.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        {lv.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleAdminDecision(lv, 'APPROVED')}
                              disabled={actionLoadingId === lv.id}
                              className="px-2.5 py-1 rounded-lg bg-[#047857] text-white font-bold text-[11px] hover:bg-[#065F46] transition-colors cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAdminDecision(lv, 'REJECTED')}
                              disabled={actionLoadingId === lv.id}
                              className="px-2 py-1 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold text-[11px] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#656966]">
                            {lv.reviewedBy ? `By ${lv.reviewedBy}` : 'Processed'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. LEAVE APPLICATION MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-[#0B2E2E]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-[#E7E3D8] rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E7E3D8] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#047857] tracking-wider uppercase">
                  LEAVE APPLICATION FORM
                </span>
                <h3 className="text-xl font-bold text-[#0B2E2E] font-display">
                  Request Time Off
                </h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 text-[#656966] hover:text-[#222525] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="m-6 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center space-x-2">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="PAID">Paid Leave</option>
                    <option value="PRIVILEGE">Privilege Leave</option>
                    <option value="MATERNITY_PATERNITY">Maternity/Paternity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  >
                    <option value="FULL_DAY">Full Day</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222525] mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide context for manager approval..."
                  className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#E7E3D8] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] text-[#222525] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#047857] text-white hover:bg-[#065F46] cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
