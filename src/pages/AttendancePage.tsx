import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  LogOut,
  LogIn
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchEmployeeAttendance, 
  calculateAttendanceSummary, 
  markTodayAttendance,
  getCachedAttendance 
} from '../services/attendanceService';
import { AttendanceRecord } from '../types';

export const AttendancePage: React.FC = () => {
  const { userProfile } = useAuth();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // September 2026
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    return userProfile?.employeeId ? (getCachedAttendance(userProfile.employeeId, 2026, 9) || []) : [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = userProfile?.employeeId ? getCachedAttendance(userProfile.employeeId, 2026, 9) : null;
    return !cached || cached.length === 0;
  });
  const [clockingIn, setClockingIn] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAttendance = async (silent = false) => {
    if (!userProfile?.employeeId) return;
    if (!silent) setLoading(true);
    try {
      const data = await fetchEmployeeAttendance(
        userProfile.employeeId,
        userProfile.uid,
        currentYear,
        currentMonth
      );
      setRecords(data);
    } catch (err) {
      console.error('Error loading attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = userProfile?.employeeId ? getCachedAttendance(userProfile.employeeId, currentYear, currentMonth) : null;
    if (cached && cached.length > 0) {
      setRecords(cached);
      setLoading(false);
      loadAttendance(true);
    } else {
      loadAttendance(false);
    }
  }, [userProfile?.employeeId, currentYear, currentMonth]);

  const summary = useMemo(() => calculateAttendanceSummary(records), [records]);

  const handleSimulateCheckIn = async (status: 'PRESENT' | 'HALF_DAY') => {
    if (!userProfile?.employeeId) return;
    setClockingIn(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await markTodayAttendance(
        userProfile.employeeId,
        userProfile.uid,
        userProfile.name,
        todayStr,
        status,
        '09:05 AM',
        '06:15 PM'
      );
      setSuccessMessage(`Check-in recorded successfully as ${status}!`);
      await loadAttendance();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error clocking in:', err);
    } finally {
      setClockingIn(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase flex items-center space-x-1.5">
            <CalendarCheck size={14} />
            <span>Time & Attendance Telemetry</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Attendance Records
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            Monthly working days, clock-in timestamps, and attendance status for {userProfile?.name} ({userProfile?.employeeId}).
          </p>
        </div>

        {/* SIMULATE DAILY CHECK-IN BUTTON */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSimulateCheckIn('PRESENT')}
            disabled={clockingIn}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#047857] hover:bg-[#065F46] text-white transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <LogIn size={15} />
            <span>{clockingIn ? 'Clocking In...' : 'Clock In Today (Present)'}</span>
          </button>
        </div>
      </section>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs flex items-center space-x-2 shadow-xs">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. SUMMARY COUNTERS (Emerald & Metric Cards) */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#E7E3D8] text-center shadow-xs">
          <span className="text-[10px] font-bold text-[#656966] uppercase tracking-wider">Working Days</span>
          <p className="text-2xl font-bold text-[#222525] font-display mt-1">{summary.workingDays}</p>
          <span className="text-[10px] text-[#656966]">In {monthNames[currentMonth - 1]}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#A7F3D0] text-center shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#047857]" />
          <span className="text-[10px] font-bold text-[#047857] uppercase tracking-wider">Present (P)</span>
          <p className="text-2xl font-bold text-[#047857] font-display mt-1">{summary.present}</p>
          <span className="text-[10px] text-[#047857] font-medium">Full days logged</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#FDE68A] text-center shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#F59E0B]" />
          <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Half Day (H)</span>
          <p className="text-2xl font-bold text-[#D97706] font-display mt-1">{summary.halfDay}</p>
          <span className="text-[10px] text-[#D97706] font-medium">Partial shift logs</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E7E3D8] text-center shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0B2E2E]" />
          <span className="text-[10px] font-bold text-[#0B2E2E] uppercase tracking-wider">On Leave (L)</span>
          <p className="text-2xl font-bold text-[#0B2E2E] font-display mt-1">{summary.leave}</p>
          <span className="text-[10px] text-[#656966]">Approved requests</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#FECACA] text-center shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#EF4444]" />
          <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider">Absent (A)</span>
          <p className="text-2xl font-bold text-[#DC2626] font-display mt-1">{summary.absent}</p>
          <span className="text-[10px] text-[#DC2626] font-medium">Unexcused absence</span>
        </div>
      </section>

      {/* 3. MONTH CONTROLLER & TABLE (White Rounded Card) */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E3D8]">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl p-1">
              <button
                onClick={() => setCurrentMonth(prev => prev > 1 ? prev - 1 : 12)}
                className="p-1 rounded-lg hover:bg-[#E7E3D8] text-[#0B2E2E] transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-bold text-xs text-[#0B2E2E]">
                {monthNames[currentMonth - 1]} {currentYear}
              </span>
              <button
                onClick={() => setCurrentMonth(prev => prev < 12 ? prev + 1 : 1)}
                className="p-1 rounded-lg hover:bg-[#E7E3D8] text-[#0B2E2E] transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#047857] text-white">
              {summary.attendancePercentage}% Attendance Rate
            </span>
            <span className="text-xs text-[#656966] font-medium hidden md:inline">
              ({records.length} Days Recorded)
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold text-[#656966]">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#047857]" /><span>P: Present</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" /><span>H: Half Day</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0B2E2E]" /><span>L: Leave</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" /><span>A: Absent</span></span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-10 bg-[#E7E3D8]/50 rounded-xl w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8F6F1] text-[#656966] text-[10px] uppercase font-bold border-b border-[#E7E3D8]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Work Hours</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3D8]">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#656966]">
                      No attendance logs recorded for this period.
                    </td>
                  </tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id} className="hover:bg-[#F8F6F1]/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#222525]">{record.date}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          record.status === 'PRESENT' ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]' :
                          record.status === 'HALF_DAY' ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' :
                          record.status === 'LEAVE' ? 'bg-[#ECFDF5] text-[#0B2E2E]' :
                          'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#656966]">{record.checkIn || '-'}</td>
                      <td className="py-2.5 px-4 text-[#656966]">{record.checkOut || '-'}</td>
                      <td className="py-2.5 px-4 font-semibold text-[#222525]">
                        {record.workHours ? `${record.workHours} hrs` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-[10px] text-[#047857] font-mono font-medium">
                          PRIYONIX-GEO-VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};
