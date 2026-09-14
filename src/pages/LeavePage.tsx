import React, { useState, useEffect } from 'react';
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
  calculateLeaveSummary 
} from '../services/leaveService';
import { LeaveRecord } from '../types';

export const LeavePage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadLeaves = async () => {
    setLoading(true);
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
    loadLeaves();
  }, [isAdmin, userProfile?.employeeId, userProfile?.uid]);

  const summary = calculateLeaveSummary(leaves);

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

  const filteredLeaves = leaves.filter(l => 
    statusFilter === 'ALL' ? true : l.status === statusFilter
  );

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <CalendarDays size={14} />
            <span>Time Off & Statutory Leave</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Leave Management
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            {isAdmin 
              ? 'Review and manage organization-wide leave requests and automated balance adjustments.'
              : 'Submit leave applications, track approval statuses, and monitor your annual leave balance.'
            }
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#174A4A] hover:bg-[#123B3B] text-[#F7F4ED] transition-colors flex items-center space-x-2 shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>Apply for Leave</span>
        </button>
      </section>

      {/* 2. LEAVE METRICS COUNTERS */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] text-center">
          <span className="text-[10px] font-bold text-[#73716B] uppercase tracking-wider">Total Allowance</span>
          <p className="text-2xl font-bold text-[#174A4A] font-display mt-1">{summary.totalAllowance} Days</p>
          <span className="text-[10px] text-[#73716B]">Annual statutory</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] text-center">
          <span className="text-[10px] font-bold text-[#73716B] uppercase tracking-wider">Leaves Used</span>
          <p className="text-2xl font-bold text-[#B58A3A] font-display mt-1">{summary.used} Days</p>
          <span className="text-[10px] text-[#73716B]">Consumed year-to-date</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#EBF2EE] border border-[#789B8B]/40 text-center">
          <span className="text-[10px] font-bold text-[#4F8068] uppercase tracking-wider">Remaining</span>
          <p className="text-2xl font-bold text-[#4F8068] font-display mt-1">{summary.remaining} Days</p>
          <span className="text-[10px] text-[#4F8068]">Available balance</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF6ED] border border-[#C5A45D]/40 text-center">
          <span className="text-[10px] font-bold text-[#B58A3A] uppercase tracking-wider">Pending Action</span>
          <p className="text-2xl font-bold text-[#B58A3A] font-display mt-1">{summary.pendingCount}</p>
          <span className="text-[10px] text-[#B58A3A]">Awaiting review</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] text-center">
          <span className="text-[10px] font-bold text-[#73716B] uppercase tracking-wider">Half Days</span>
          <p className="text-2xl font-bold text-[#30302D] font-display mt-1">{summary.halfDayCount}</p>
          <span className="text-[10px] text-[#73716B]">Logged partials</span>
        </div>
      </section>

      {/* 3. LEAVE APPLICATIONS TABLE */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDD7CA]">
          <div>
            <h2 className="text-lg font-bold text-[#174A4A] font-display">
              {isAdmin ? 'All Corporate Leave Applications' : 'Your Leave History'}
            </h2>
            <p className="text-xs text-[#73716B]">Audited and timestamped in Firestore database.</p>
          </div>

          {/* STATUS FILTER PILLS */}
          <div className="flex items-center space-x-1.5 bg-[#F7F4ED] p-1 rounded-xl border border-[#DDD7CA]">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === status 
                    ? 'bg-[#174A4A] text-[#F7F4ED]' 
                    : 'text-[#73716B] hover:text-[#30302D]'
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
              <tr className="bg-[#E5E0D5] text-[#73716B] text-[10px] uppercase font-bold">
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Admin Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD7CA] bg-[#F7F4ED]">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-[#73716B]">
                    No leave applications matching the filter.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(lv => (
                  <tr key={lv.id} className="hover:bg-[#EFEAE0]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#30302D]">
                      <div>{lv.employeeName}</div>
                      <div className="text-[10px] font-mono text-[#73716B]">{lv.employeeId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#174A4A]">{lv.leaveType}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {lv.startDate} to {lv.endDate}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {lv.daysCount} days ({lv.duration})
                    </td>
                    <td className="py-3 px-4 text-[#73716B] max-w-xs truncate">
                      {lv.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lv.status === 'APPROVED' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                        lv.status === 'PENDING' ? 'bg-[#B58A3A]/15 text-[#B58A3A]' :
                        'bg-[#B85C50]/15 text-[#B85C50]'
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
                              className="px-2.5 py-1 rounded-lg bg-[#4F8068] text-[#F7F4ED] font-bold text-[11px] hover:bg-[#436e59] transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAdminDecision(lv, 'REJECTED')}
                              disabled={actionLoadingId === lv.id}
                              className="px-2 py-1 rounded-lg bg-[#FAF0EE] border border-[#C97867]/40 text-[#B85C50] font-bold text-[11px] hover:bg-[#C97867]/20 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#73716B]">
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
        <div className="fixed inset-0 bg-[#30302D]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-[#F7F4ED] border border-[#DDD7CA] rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[#DDD7CA] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#789B8B] tracking-wider uppercase">
                  LEAVE APPLICATION FORM
                </span>
                <h3 className="text-xl font-bold text-[#174A4A] font-display">
                  Request Time Off
                </h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 text-[#73716B] hover:text-[#30302D]"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="m-6 p-3 rounded-xl bg-[#FAF0EE] border border-[#C97867]/40 text-[#B85C50] text-xs flex items-center space-x-2">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="PAID">Paid Leave</option>
                    <option value="PRIVILEGE">Privilege Leave</option>
                    <option value="MATERNITY_PATERNITY">Maternity/Paternity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                  >
                    <option value="FULL_DAY">Full Day</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#30302D] mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide context for manager approval..."
                  className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#DDD7CA] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] text-[#30302D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#174A4A] text-[#F7F4ED] hover:bg-[#123B3B] cursor-pointer disabled:opacity-50"
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
