import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  UserRound, 
  CalendarCheck, 
  CalendarDays, 
  IndianRupee, 
  Lock, 
  BriefcaseBusiness, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  UserCheck, 
  TrendingUp,
  FileText,
  Pencil,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchEmployeeById } from '../services/employeeService';
import { fetchSalaryHistory, UnauthorizedAccessError, saveSalaryRecord } from '../services/salaryService';
import { fetchMedicalRecord, MedicalAccessDeniedError, updateMedicalRecord } from '../services/medicalService';
import { fetchEmployeeAttendance, calculateAttendanceSummary } from '../services/attendanceService';
import { fetchLeaves, calculateLeaveSummary } from '../services/leaveService';
import { fetchProjects } from '../services/projectService';
import { 
  EmployeeDirectoryItem, 
  SalaryRecord, 
  MedicalRecord, 
  AttendanceRecord, 
  LeaveRecord, 
  ProjectItem 
} from '../types';

export const Profile360: React.FC = () => {
  const { employeeId: paramEmployeeId } = useParams<{ employeeId?: string }>();
  const { userProfile, role, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Determine target employee: if URL has an ID (e.g. /profile/PRX-001), use that; else current user's profile
  const targetEmployeeId = paramEmployeeId 
    ? paramEmployeeId.toUpperCase() 
    : userProfile?.employeeId || 'PRX-002';

  const isOwnProfile = userProfile?.employeeId?.toUpperCase() === targetEmployeeId.toUpperCase();
  const canAccessSensitiveData = isOwnProfile || isAdmin;

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'leave' | 'salary' | 'private' | 'projects'
  >('overview');

  const [employee, setEmployee] = useState<EmployeeDirectoryItem | null>(null);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Medical Edit State
  const [editingMedical, setEditingMedical] = useState(false);
  const [medicalForm, setMedicalForm] = useState<Partial<MedicalRecord>>({});
  const [savingMedical, setSavingMedical] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      setSecurityError(null);

      try {
        // 1. Fetch public employee directory record
        const emp = await fetchEmployeeById(targetEmployeeId);
        setEmployee(emp);

        // 2. Fetch projects
        const allProjects = await fetchProjects();
        const assignedProjects = allProjects.filter(p => 
          p.ownerEmployeeId === targetEmployeeId || p.domainId === emp?.domainId
        );
        setProjects(assignedProjects);

        // 3. Attempt to fetch sensitive data: Salary, Medical, Attendance, Leaves
        if (canAccessSensitiveData) {
          try {
            const [salaries, medical, attendance, employeeLeaves] = await Promise.all([
              fetchSalaryHistory(targetEmployeeId, userProfile?.uid || '', role, userProfile?.employeeId),
              fetchMedicalRecord(targetEmployeeId, userProfile?.uid || '', role, userProfile?.employeeId),
              fetchEmployeeAttendance(targetEmployeeId, userProfile?.uid || '', 2026, 9),
              fetchLeaves(targetEmployeeId, userProfile?.uid),
            ]);
            setSalaryRecords(salaries);
            setMedicalRecord(medical);
            setMedicalForm(medical);
            setAttendanceRecords(attendance);
            setLeaves(employeeLeaves);
          } catch (err: any) {
            console.warn('Sensitive record access blocked by security rules:', err);
            if (err instanceof UnauthorizedAccessError || err instanceof MedicalAccessDeniedError) {
              setSecurityError(err.message);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching employee profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [targetEmployeeId, userProfile?.employeeId, role, canAccessSensitiveData]);

  // Handle Tab Switching with RBAC security validation
  const handleTabChange = (tab: typeof activeTab) => {
    if ((tab === 'salary' || tab === 'private' || tab === 'attendance' || tab === 'leave') && !canAccessSensitiveData) {
      setSecurityError(
        `403 Forbidden: Employee ${userProfile?.employeeId} is not authorized to access confidential ${tab} records of ${targetEmployeeId}. This action is restricted by Cloud Firestore security rules.`
      );
    } else {
      setSecurityError(null);
    }
    setActiveTab(tab);
  };

  const handleSaveMedical = async () => {
    if (!medicalRecord || !userProfile) return;
    setSavingMedical(true);
    try {
      const updated: MedicalRecord = {
        ...medicalRecord,
        bloodGroup: medicalForm.bloodGroup || medicalRecord.bloodGroup,
        emergencyContactName: medicalForm.emergencyContactName || medicalRecord.emergencyContactName,
        emergencyContactRelation: medicalForm.emergencyContactRelation || medicalRecord.emergencyContactRelation,
        emergencyPhone: medicalForm.emergencyPhone || medicalRecord.emergencyPhone,
        allergies: typeof medicalForm.allergies === 'string' 
          ? (medicalForm.allergies as string).split(',').map(s => s.trim()) 
          : medicalRecord.allergies,
        medicalNotes: medicalForm.medicalNotes || medicalRecord.medicalNotes,
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      await updateMedicalRecord(updated, userProfile.uid, userProfile.name, role);
      setMedicalRecord(updated);
      setEditingMedical(false);
    } catch (err: any) {
      alert(err?.message || 'Could not update medical record.');
    } finally {
      setSavingMedical(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-[#EFEAE0] rounded-3xl" />
        <div className="h-12 bg-[#EFEAE0] rounded-2xl w-2/3" />
        <div className="h-96 bg-[#EFEAE0] rounded-3xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-12 text-center bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl">
        <AlertCircle size={32} className="mx-auto text-[#B85C50] mb-3" />
        <h3 className="text-lg font-bold text-[#174A4A] font-display">Employee Not Found</h3>
        <p className="text-xs text-[#73716B] mt-1">No employee matching ID "{targetEmployeeId}" exists in the directory.</p>
        <button
          onClick={() => navigate('/employees')}
          className="mt-4 px-4 py-2 rounded-xl bg-[#174A4A] text-[#F7F4ED] text-xs font-bold"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const attendanceSummary = calculateAttendanceSummary(attendanceRecords);
  const leaveSummary = calculateLeaveSummary(leaves);

  return (
    <div className="space-y-8">
      {/* 1. EMPLOYEE 360 HEADER PROFILE CARD */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center space-x-5">
            <div className="w-18 h-18 md:w-20 md:h-20 rounded-2xl bg-[#174A4A] text-[#F7F4ED] flex items-center justify-center font-bold text-2xl font-display shrink-0 overflow-hidden shadow-sm">
              {employee.avatarUrl ? (
                <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                employee.name.charAt(0)
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-[#174A4A] font-display tracking-tight">
                  {employee.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#174A4A]/10 text-[#174A4A]">
                  {employee.employeeId}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  employee.status === 'ACTIVE' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                  employee.status === 'ON_LEAVE' ? 'bg-[#B58A3A]/15 text-[#B58A3A]' :
                  'bg-[#B85C50]/15 text-[#B85C50]'
                }`}>
                  {employee.status}
                </span>
                {isOwnProfile && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#789B8B]/20 text-[#174A4A]">
                    Your Workspace
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-[#30302D]">
                {employee.designation} &bull; <span className="text-[#789B8B]">{employee.departmentName || employee.departmentId}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#73716B] pt-1">
                <span className="flex items-center space-x-1">
                  <Mail size={13} />
                  <span>{employee.email}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin size={13} />
                  <span>{employee.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <UserCheck size={13} />
                  <span>Reports to: {employee.manager}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions / Role Badge */}
          <div className="flex flex-col md:items-end space-y-2">
            <span className="text-[10px] font-bold text-[#73716B] uppercase tracking-wider">
              Access Governance
            </span>
            <div className="flex items-center space-x-2">
              {canAccessSensitiveData ? (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#4F8068] bg-[#4F8068]/15 px-3 py-1 rounded-full">
                  <ShieldCheck size={14} />
                  <span>Full 360 Privileged Access</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#B58A3A] bg-[#B58A3A]/15 px-3 py-1 rounded-full">
                  <Lock size={14} />
                  <span>Directory View Only</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. TABBED NAVIGATION */}
      <section className="border-b border-[#DDD7CA] overflow-x-auto">
        <div className="flex space-x-1 sm:space-x-2 min-w-max pb-px">
          {[
            { id: 'overview', label: 'Personal & Employment', icon: UserRound },
            { id: 'attendance', label: 'Attendance', icon: CalendarCheck, restricted: !canAccessSensitiveData },
            { id: 'leave', label: 'Leave Records', icon: CalendarDays, restricted: !canAccessSensitiveData },
            { id: 'salary', label: 'Salary & Hikes', icon: IndianRupee, restricted: !canAccessSensitiveData },
            { id: 'private', label: 'Private Information 🔒', icon: Lock, restricted: !canAccessSensitiveData },
            { id: 'projects', label: 'Projects', icon: BriefcaseBusiness },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold rounded-t-2xl border-t border-l border-r transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#EFEAE0] border-[#DDD7CA] text-[#174A4A] shadow-xs' 
                    : 'border-transparent text-[#73716B] hover:text-[#30302D] hover:bg-[#EFEAE0]/50'
                }`}
              >
                <Icon size={15} className={tab.restricted ? 'text-[#B58A3A]' : ''} />
                <span>{tab.label}</span>
                {tab.restricted && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#C97867]/20 text-[#B85C50]">
                    Restricted
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. SECURITY RESTRICTION ALERT (Tests 2, 3, 4, 6) */}
      {securityError && (
        <div className="p-5 rounded-2xl bg-[#FAF0EE] border-2 border-[#C97867] text-[#B85C50] flex items-start space-x-4 shadow-sm animate-fade-in">
          <ShieldAlert size={24} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-display">403 Forbidden &bull; Zero-Trust Authorization Block</h4>
            <p className="text-xs leading-relaxed">{securityError}</p>
            <p className="text-[11px] text-[#73716B] mt-1">
              Rule verification: Personal compensation, emergency health data, and attendance records are owner-bound or restricted to authorized executives.
            </p>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENTS */}
      <div className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8">
        {/* TAB 1: PERSONAL & EMPLOYMENT */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-[#174A4A] font-display mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Full Name</span>
                  <p className="text-sm font-bold text-[#30302D] mt-0.5">{employee.name}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Employee ID</span>
                  <p className="text-sm font-mono font-bold text-[#174A4A] mt-0.5">{employee.employeeId}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Corporate Email</span>
                  <p className="text-sm font-bold text-[#30302D] mt-0.5">{employee.email}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Office Phone</span>
                  <p className="text-sm font-bold text-[#30302D] mt-0.5">{employee.phone}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Assigned Campus</span>
                  <p className="text-sm font-bold text-[#30302D] mt-0.5">{employee.location}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Status</span>
                  <p className="text-sm font-bold text-[#4F8068] mt-0.5">{employee.status}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#DDD7CA]">
              <h3 className="text-lg font-bold text-[#174A4A] font-display mb-4">
                Employment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Joining Date</span>
                  <p className="text-sm font-bold text-[#30302D] mt-0.5">{employee.joiningDate}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Corporate Role</span>
                  <p className="text-sm font-bold text-[#30302D] mt-0.5">{employee.designation}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Department</span>
                  <p className="text-sm font-bold text-[#174A4A] mt-0.5">{employee.departmentName || employee.departmentId}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Domain Expertise</span>
                  <p className="text-sm font-bold text-[#174A4A] mt-0.5">{employee.domainName || employee.domainId}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Reporting Manager</span>
                  <p className="text-sm font-bold text-[#30302D] mt-0.5">{employee.manager}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <span className="text-[11px] text-[#73716B] font-semibold">Tenure at Prionix</span>
                  <p className="text-sm font-bold text-[#30302D] mt-0.5">3+ Years active service</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === 'attendance' && (
          canAccessSensitiveData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#174A4A] font-display">
                    Monthly Attendance &bull; September 2026
                  </h3>
                  <p className="text-xs text-[#73716B]">Working days record and check-in audit telemetry.</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#174A4A] text-[#F7F4ED]">
                  {attendanceSummary.attendancePercentage}% Attendance Rate
                </span>
              </div>

              {/* Attendance counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] text-center">
                  <span className="text-[10px] font-bold text-[#73716B] uppercase">Working Days</span>
                  <p className="text-xl font-bold text-[#30302D] mt-1">{attendanceSummary.workingDays}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#EBF2EE] border border-[#789B8B]/40 text-center">
                  <span className="text-[10px] font-bold text-[#4F8068] uppercase">Present (P)</span>
                  <p className="text-xl font-bold text-[#4F8068] mt-1">{attendanceSummary.present}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#C5A45D]/40 text-center">
                  <span className="text-[10px] font-bold text-[#B58A3A] uppercase">Half Day (H)</span>
                  <p className="text-xl font-bold text-[#B58A3A] mt-1">{attendanceSummary.halfDay}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F2EFE8] border border-[#DDD7CA] text-center">
                  <span className="text-[10px] font-bold text-[#73716B] uppercase">Leave (L)</span>
                  <p className="text-xl font-bold text-[#174A4A] mt-1">{attendanceSummary.leave}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF0EE] border border-[#C97867]/40 text-center">
                  <span className="text-[10px] font-bold text-[#B85C50] uppercase">Absent (A)</span>
                  <p className="text-xl font-bold text-[#B85C50] mt-1">{attendanceSummary.absent}</p>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-[#F7F4ED] rounded-2xl border border-[#DDD7CA] overflow-hidden">
                <div className="p-4 border-b border-[#DDD7CA] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#174A4A]">Daily Attendance Timeline</span>
                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-[#4F8068]" /><span>P: Present</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-[#B58A3A]" /><span>H: Half Day</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-[#174A4A]" /><span>L: Leave</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-[#B85C50]" /><span>A: Absent</span></span>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFEAE0] text-[#73716B] text-[10px] uppercase font-bold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Check In</th>
                        <th className="py-2.5 px-4">Check Out</th>
                        <th className="py-2.5 px-4 text-right">Work Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD7CA]">
                      {attendanceRecords.slice(0, 15).map(att => (
                        <tr key={att.id} className="hover:bg-[#EFEAE0]/50">
                          <td className="py-2 px-4 font-mono font-medium">{att.date}</td>
                          <td className="py-2 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              att.status === 'PRESENT' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                              att.status === 'HALF_DAY' ? 'bg-[#B58A3A]/15 text-[#B58A3A]' :
                              att.status === 'LEAVE' ? 'bg-[#174A4A]/10 text-[#174A4A]' :
                              'bg-[#B85C50]/15 text-[#B85C50]'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-[#73716B]">{att.checkIn || '-'}</td>
                          <td className="py-2 px-4 text-[#73716B]">{att.checkOut || '-'}</td>
                          <td className="py-2 px-4 text-right font-semibold">{att.workHours ? `${att.workHours} hrs` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#73716B]">
              <Lock size={28} className="mx-auto text-[#B58A3A] mb-2" />
              <h4 className="font-bold text-[#174A4A]">Access Restricted</h4>
              <p className="text-xs mt-1">Attendance logs are strictly private to this employee and authorized HR.</p>
            </div>
          )
        )}

        {/* TAB 3: LEAVE */}
        {activeTab === 'leave' && (
          canAccessSensitiveData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#174A4A] font-display">
                    Leave Balance & History
                  </h3>
                  <p className="text-xs text-[#73716B]">Annual statutory leave allowance tracking.</p>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/leave')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#174A4A] text-[#F7F4ED] text-xs font-bold hover:bg-[#123B3B]"
                  >
                    Apply for Leave
                  </button>
                )}
              </div>

              {/* Leave Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] text-center">
                  <span className="text-[10px] font-bold text-[#73716B] uppercase">Total Allowance</span>
                  <p className="text-xl font-bold text-[#174A4A] mt-1">{leaveSummary.totalAllowance} Days</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] text-center">
                  <span className="text-[10px] font-bold text-[#73716B] uppercase">Days Used</span>
                  <p className="text-xl font-bold text-[#B58A3A] mt-1">{leaveSummary.used} Days</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#EBF2EE] border border-[#789B8B]/40 text-center">
                  <span className="text-[10px] font-bold text-[#4F8068] uppercase">Remaining</span>
                  <p className="text-xl font-bold text-[#4F8068] mt-1">{leaveSummary.remaining} Days</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#C5A45D]/40 text-center">
                  <span className="text-[10px] font-bold text-[#B58A3A] uppercase">Pending Requests</span>
                  <p className="text-xl font-bold text-[#B58A3A] mt-1">{leaveSummary.pendingCount}</p>
                </div>
              </div>

              {/* Leave records list */}
              <div className="bg-[#F7F4ED] rounded-2xl border border-[#DDD7CA] overflow-hidden">
                <div className="p-4 border-b border-[#DDD7CA]">
                  <span className="text-xs font-bold text-[#174A4A]">Historical Leave Requests</span>
                </div>
                <div className="divide-y divide-[#DDD7CA]">
                  {leaves.length === 0 ? (
                    <div className="p-6 text-center text-[#73716B] text-xs">
                      No leave requests filed yet.
                    </div>
                  ) : (
                    leaves.map(lv => (
                      <div key={lv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#30302D]">{lv.leaveType} ({lv.duration})</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              lv.status === 'APPROVED' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                              lv.status === 'PENDING' ? 'bg-[#B58A3A]/15 text-[#B58A3A]' :
                              'bg-[#B85C50]/15 text-[#B85C50]'
                            }`}>
                              {lv.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#73716B] mt-0.5">
                            {lv.startDate} to {lv.endDate} &bull; {lv.daysCount} days
                          </p>
                          <p className="text-xs text-[#73716B] mt-0.5 italic">
                            Reason: "{lv.reason}"
                          </p>
                        </div>
                        {lv.reviewedBy && (
                          <div className="text-[11px] text-[#73716B] text-right">
                            <span>Reviewed by <strong>{lv.reviewedBy}</strong></span>
                            <div className="text-[10px]">
                              {typeof lv.reviewedAt === 'string' && lv.reviewedAt ? lv.reviewedAt.split('T')[0] : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#73716B]">
              <Lock size={28} className="mx-auto text-[#B58A3A] mb-2" />
              <h4 className="font-bold text-[#174A4A]">Access Restricted</h4>
              <p className="text-xs mt-1">Leave records are strictly private to this employee and authorized HR.</p>
            </div>
          )
        )}

        {/* TAB 4: SALARY & HIKE HISTORY */}
        {activeTab === 'salary' && (
          canAccessSensitiveData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#789B8B] tracking-wider uppercase">
                    CONFIDENTIAL COMPENSATION &bull; RESTRICTED
                  </span>
                  <h3 className="text-lg font-bold text-[#174A4A] font-display mt-0.5">
                    Salary & Hike Progression Timeline
                  </h3>
                  <p className="text-xs text-[#73716B]">Fictional demonstration data for Prionix enterprise modeling.</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#174A4A] text-[#F7F4ED]">
                  Protected by Firestore Rules
                </span>
              </div>

              {/* Current Salary Snapshot */}
              {salaryRecords.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] text-[#73716B] font-semibold">Current Annual CTC</span>
                    <p className="text-2xl font-bold text-[#174A4A] font-display mt-0.5">
                      ₹{salaryRecords[salaryRecords.length - 1].annualSalary.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-[#73716B]">Effective {salaryRecords[salaryRecords.length - 1].revisionDate}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#73716B] font-semibold">Monthly Gross</span>
                    <p className="text-2xl font-bold text-[#30302D] font-display mt-0.5">
                      ₹{salaryRecords[salaryRecords.length - 1].monthlySalary.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-[#73716B]">Before statutory deductions</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#73716B] font-semibold">Latest Hike Percentage</span>
                    <p className="text-2xl font-bold text-[#4F8068] font-display mt-0.5 flex items-center">
                      <TrendingUp size={20} className="mr-1" />
                      +{salaryRecords[salaryRecords.length - 1].hikePercentage}%
                    </p>
                    <span className="text-[10px] text-[#4F8068]">Performance merit revision</span>
                  </div>
                </div>
              )}

              {/* Hike History Table */}
              <div className="bg-[#F7F4ED] rounded-2xl border border-[#DDD7CA] overflow-hidden">
                <div className="p-4 border-b border-[#DDD7CA]">
                  <span className="text-xs font-bold text-[#174A4A]">Historical Compensation Progression</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFEAE0] text-[#73716B] text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-3 px-4">Year</th>
                        <th className="py-3 px-4">Designation</th>
                        <th className="py-3 px-4">Annual Salary</th>
                        <th className="py-3 px-4">Hike %</th>
                        <th className="py-3 px-4">Revision Date</th>
                        <th className="py-3 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD7CA]">
                      {salaryRecords.map(sal => (
                        <tr key={sal.id} className="hover:bg-[#EFEAE0]/50">
                          <td className="py-3 px-4 font-bold text-[#174A4A]">{sal.year}</td>
                          <td className="py-3 px-4 font-semibold">{sal.designation}</td>
                          <td className="py-3 px-4 font-bold">₹{sal.annualSalary.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#4F8068]/15 text-[#4F8068]">
                              +{sal.hikePercentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#73716B]">{sal.revisionDate}</td>
                          <td className="py-3 px-4 text-[#73716B] text-[11px] max-w-xs">{sal.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#73716B]">
              <Lock size={28} className="mx-auto text-[#B58A3A] mb-2" />
              <h4 className="font-bold text-[#174A4A]">Access Restricted</h4>
              <p className="text-xs mt-1">Salary history is strictly confidential and protected by database rules.</p>
            </div>
          )
        )}

        {/* TAB 5: PRIVATE INFORMATION 🔒 */}
        {activeTab === 'private' && (
          canAccessSensitiveData ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <Lock size={16} className="text-[#174A4A]" />
                    <h3 className="text-base font-bold text-[#174A4A] font-display">
                      Private Information 🔒
                    </h3>
                  </div>
                  <p className="text-xs text-[#73716B] mt-0.5">
                    Restricted to you and authorized Prionix administrators. (Fictional demonstration data).
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {!editingMedical ? (
                    <button
                      onClick={() => setEditingMedical(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] hover:border-[#174A4A] text-xs font-bold text-[#174A4A] flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Pencil size={13} />
                      <span>Edit Emergency Details</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveMedical}
                        disabled={savingMedical}
                        className="px-3.5 py-1.5 rounded-xl bg-[#174A4A] text-[#F7F4ED] text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Save size={13} />
                        <span>{savingMedical ? 'Saving...' : 'Save File'}</span>
                      </button>
                      <button
                        onClick={() => setEditingMedical(false)}
                        className="px-3 py-1.5 rounded-xl bg-[#EFEAE0] text-[#73716B] text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {medicalRecord && !editingMedical ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                    <span className="text-[11px] text-[#73716B] font-semibold">Blood Group</span>
                    <p className="text-base font-bold text-[#174A4A] mt-0.5">{medicalRecord.bloodGroup}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                    <span className="text-[11px] text-[#73716B] font-semibold">Emergency Contact Person</span>
                    <p className="text-base font-bold text-[#30302D] mt-0.5">{medicalRecord.emergencyContactName}</p>
                    <span className="text-[10px] text-[#73716B]">Relation: {medicalRecord.emergencyContactRelation}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                    <span className="text-[11px] text-[#73716B] font-semibold">Emergency Phone</span>
                    <p className="text-base font-bold text-[#30302D] mt-0.5">{medicalRecord.emergencyPhone}</p>
                    <span className="text-[10px] text-[#4F8068]">Verified 24/7 line</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                    <span className="text-[11px] text-[#73716B] font-semibold">Known Allergies</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {medicalRecord.allergies.map((all, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF0EE] text-[#B85C50]">
                          {all}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                    <span className="text-[11px] text-[#73716B] font-semibold">Corporate Insurance Policy</span>
                    <p className="text-xs font-mono font-bold text-[#30302D] mt-0.5">{medicalRecord.insurancePolicyNumber || 'PRX-STAR-2026'}</p>
                    <span className="text-[10px] text-[#73716B]">Updated {medicalRecord.lastUpdated}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] sm:col-span-2 lg:col-span-3">
                    <span className="text-[11px] text-[#73716B] font-semibold">Confidential Medical Notes</span>
                    <p className="text-xs text-[#30302D] mt-1 leading-relaxed bg-[#EFEAE0] p-3 rounded-lg border border-[#DDD7CA]">
                      {medicalRecord.medicalNotes}
                    </p>
                  </div>
                </div>
              ) : (
                /* EDIT FORM */
                <div className="p-6 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#30302D] mb-1">Blood Group</label>
                      <input
                        type="text"
                        value={medicalForm.bloodGroup || ''}
                        onChange={(e) => setMedicalForm({ ...medicalForm, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#30302D] mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={medicalForm.emergencyContactName || ''}
                        onChange={(e) => setMedicalForm({ ...medicalForm, emergencyContactName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#30302D] mb-1">Emergency Phone</label>
                      <input
                        type="text"
                        value={medicalForm.emergencyPhone || ''}
                        onChange={(e) => setMedicalForm({ ...medicalForm, emergencyPhone: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#30302D] mb-1">Known Allergies (comma separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(medicalForm.allergies) ? medicalForm.allergies.join(', ') : medicalForm.allergies || ''}
                        onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#30302D] mb-1">Medical Notes</label>
                      <textarea
                        rows={3}
                        value={medicalForm.medicalNotes || ''}
                        onChange={(e) => setMedicalForm({ ...medicalForm, medicalNotes: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-[#73716B]">
              <Lock size={28} className="mx-auto text-[#B58A3A] mb-2" />
              <h4 className="font-bold text-[#174A4A]">Access Restricted</h4>
              <p className="text-xs mt-1">Confidential medical details are restricted to this employee and authorized administrators.</p>
            </div>
          )
        )}

        {/* TAB 6: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-[#174A4A] font-display">
                Assigned Projects & Key Initiatives
              </h3>
              <span className="text-xs text-[#73716B] font-semibold">{projects.length} Projects</span>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center text-[#73716B] bg-[#F7F4ED] rounded-2xl">
                No projects directly mapped to this employee ID currently.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div key={p.id} className="p-5 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'ACTIVE' ? 'bg-[#174A4A]/10 text-[#174A4A]' :
                          p.status === 'COMPLETED' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                          'bg-[#C5A45D]/15 text-[#B58A3A]'
                        }`}>
                          {p.status}
                        </span>
                        <span className="text-[10px] text-[#73716B]">Due {p.deadline}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#30302D] mb-1">{p.name}</h4>
                      <p className="text-xs text-[#73716B] line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#DDD7CA]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#73716B]">Team: {p.team}</span>
                        <span className="font-bold text-[#174A4A]">{p.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-[#E5E2DA] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#174A4A] h-full rounded-full" style={{ width: `${p.completionPercentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
