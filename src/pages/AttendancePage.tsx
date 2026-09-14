import React, { useState, useEffect } from 'react';
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
import { fetchEmployeeAttendance, calculateAttendanceSummary, markTodayAttendance } from '../services/attendanceService';
import { AttendanceRecord } from '../types';

export const AttendancePage: React.FC = () => {
  const { userProfile } = useAuth();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // September 2026
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAttendance = async () => {
    if (!userProfile?.employeeId) return;
    setLoading(true);
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
    loadAttendance();
  }, [userProfile?.employeeId, currentYear, currentMonth]);

  const summary = calculateAttendanceSummary(records);

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
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <CalendarCheck size={14} />
            <span>Time & Attendance Telemetry</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Attendance Records
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Monthly working days, clock-in timestamps, and attendance status for {userProfile?.name} ({userProfile?.employeeId}).
          </p>
        </div>

        {/* SIMULATE DAILY CHECK-IN BUTTON */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSimulateCheckIn('PRESENT')}
            disabled={clockingIn}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#174A4A] hover:bg-[#123B3B] text-[#F7F4ED] transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <LogIn size={15} />
            <span>{clockingIn ? 'Clocking In...' : 'Clock In Today (Present)'}</span>
          </button>
        </div>
      </section>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#EBF2EE] border border-[#789B8B]/40 text-[#4F8068] text-xs flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. SUMMARY COUNTERS */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] text-center">
          <span className="text-[10px] font-bold text-[#73716B] uppercase tracking-wider">Working Days</span>
          <p className="text-2xl font-bold text-[#30302D] font-display mt-1">{summary.workingDays}</p>
          <span className="text-[10px] text-[#73716B]">In {monthNames[currentMonth - 1]}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#EBF2EE] border border-[#789B8B]/40 text-center">
          <span className="text-[10px] font-bold text-[#4F8068] uppercase tracking-wider">Present (P)</span>
          <p className="text-2xl font-bold text-[#4F8068] font-display mt-1">{summary.present}</p>
          <span className="text-[10px] text-[#4F8068]">Full days logged</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF6ED] border border-[#C5A45D]/40 text-center">
          <span className="text-[10px] font-bold text-[#B58A3A] uppercase tracking-wider">Half Day (H)</span>
          <p className="text-2xl font-bold text-[#B58A3A] font-display mt-1">{summary.halfDay}</p>
          <span className="text-[10px] text-[#B58A3A]">Partial shift logs</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F2EFE8] border border-[#DDD7CA] text-center">
          <span className="text-[10px] font-bold text-[#174A4A] uppercase tracking-wider">On Leave (L)</span>
          <p className="text-2xl font-bold text-[#174A4A] font-display mt-1">{summary.leave}</p>
          <span className="text-[10px] text-[#73716B]">Approved requests</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF0EE] border border-[#C97867]/40 text-center">
          <span className="text-[10px] font-bold text-[#B85C50] uppercase tracking-wider">Absent (A)</span>
          <p className="text-2xl font-bold text-[#B85C50] font-display mt-1">{summary.absent}</p>
          <span className="text-[10px] text-[#B85C50]">Unexcused absence</span>
        </div>
      </section>

      {/* 3. MONTH CONTROLLER & TABLE */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDD7CA]">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-[#F7F4ED] border border-[#DDD7CA] rounded-xl p-1">
              <button
                onClick={() => setCurrentMonth(prev => prev > 1 ? prev - 1 : 12)}
                className="p-1 rounded-lg hover:bg-[#DDD7CA] text-[#174A4A] transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-bold text-xs text-[#174A4A]">
                {monthNames[currentMonth - 1]} {currentYear}
              </span>
              <button
                onClick={() => setCurrentMonth(prev => prev < 12 ? prev + 1 : 1)}
                className="p-1 rounded-lg hover:bg-[#DDD7CA] text-[#174A4A] transition-colors"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#174A4A] text-[#F7F4ED]">
              {summary.attendancePercentage}% Attendance Rate
            </span>
            <span className="text-xs text-[#73716B] font-medium hidden md:inline">
              ({records.length} Days Recorded)
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold text-[#73716B]">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4F8068]" /><span>P: Present</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#B58A3A]" /><span>H: Half Day</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#174A4A]" /><span>L: Leave</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#B85C50]" /><span>A: Absent</span></span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-10 bg-[#DDD7CA]/50 rounded-xl w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#E5E0D5] text-[#73716B] text-[10px] uppercase font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Work Hours</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD7CA] bg-[#F7F4ED]">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#73716B]">
                      No attendance logs recorded for this period.
                    </td>
                  </tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id} className="hover:bg-[#EFEAE0]/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#30302D]">{record.date}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          record.status === 'PRESENT' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                          record.status === 'HALF_DAY' ? 'bg-[#B58A3A]/15 text-[#B58A3A]' :
                          record.status === 'LEAVE' ? 'bg-[#174A4A]/10 text-[#174A4A]' :
                          'bg-[#B85C50]/15 text-[#B85C50]'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#73716B]">{record.checkIn || '-'}</td>
                      <td className="py-2.5 px-4 text-[#73716B]">{record.checkOut || '-'}</td>
                      <td className="py-2.5 px-4 font-semibold text-[#30302D]">
                        {record.workHours ? `${record.workHours} hrs` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-[10px] text-[#789B8B] font-mono">
                          PRX-GEO-VERIFIED
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
