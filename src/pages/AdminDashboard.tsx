import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  BriefcaseBusiness, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CalendarDays, 
  ArrowRight, 
  Activity, 
  Layers3, 
  Megaphone, 
  Check, 
  X, 
  ChevronRight,
  TrendingUp,
  Building2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { fetchEmployeeDirectory, getCachedEmployeeDirectory } from '../services/employeeService';
import { fetchProjects, getCachedProjects } from '../services/projectService';
import { fetchLeaves, updateLeaveStatus, getCachedLeaves } from '../services/leaveService';
import { fetchAnnouncements, getCachedAnnouncements } from '../services/announcementService';
import { fetchDomains, getCachedDomains } from '../services/departmentService';
import { fetchActivityLogs, getCachedActivityLogs } from '../services/activityService';
import { EmployeeDirectoryItem, ProjectItem, LeaveRecord, AnnouncementItem, Domain, ActivityLogItem } from '../types';
import { StatsCardSkeleton, ChartSkeleton, TableSkeleton, Skeleton } from '../components/common/LoadingSkeleton';
import { BRAND_ASSETS } from '../assets/branding';

export const AdminDashboard: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>(() => getCachedEmployeeDirectory());
  const [projects, setProjects] = useState<ProjectItem[]>(() => getCachedProjects());
  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => getCachedLeaves() || []);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => getCachedAnnouncements(false));
  const [domains, setDomains] = useState<Domain[]>(() => getCachedDomains());
  const [activities, setActivities] = useState<ActivityLogItem[]>(() => getCachedActivityLogs() || []);
  const [loading, setLoading] = useState(() => getCachedEmployeeDirectory().length === 0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboardData = async (silent = false) => {
    if (!silent && employees.length === 0) setLoading(true);
    try {
      const [empData, prjData, lvData, annData, domData, actData] = await Promise.all([
        fetchEmployeeDirectory(),
        fetchProjects(),
        fetchLeaves(),
        fetchAnnouncements(false),
        fetchDomains(),
        fetchActivityLogs(8),
      ]);
      setEmployees(empData);
      setProjects(prjData);
      setLeaves(lvData);
      setAnnouncements(annData);
      setDomains(domData);
      setActivities(actData);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(employees.length > 0);
  }, []);

  const handleApproveLeave = async (leave: LeaveRecord) => {
    if (!userProfile) return;
    setActionLoading(leave.id);
    try {
      await updateLeaveStatus(
        leave.id,
        'APPROVED',
        userProfile.uid,
        userProfile.name,
        leave.ownerUid,
        leave.employeeName
      );
      await loadDashboardData();
    } catch (err) {
      console.error('Error approving leave:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectLeave = async (leave: LeaveRecord) => {
    if (!userProfile) return;
    setActionLoading(leave.id);
    try {
      await updateLeaveStatus(
        leave.id,
        'REJECTED',
        userProfile.uid,
        userProfile.name,
        leave.ownerUid,
        leave.employeeName,
        'Declined by executive administration'
      );
      await loadDashboardData();
    } catch (err) {
      console.error('Error rejecting leave:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const {
    totalEmployees,
    activeEmployees,
    activeProjects,
    completedProjects,
    pendingProjects,
    pendingLeaves,
    domainChartData,
    projectStatusData,
  } = useMemo(() => {
    const total = employees.length;
    const activeEmp = employees.filter(e => e.status === 'ACTIVE').length;
    const activeProj = projects.filter(p => p.status === 'ACTIVE').length;
    const compProj = projects.filter(p => p.status === 'COMPLETED').length;
    const pendProj = projects.filter(p => p.status === 'PENDING').length;
    const pendLeaves = leaves.filter(l => l.status === 'PENDING');

    const domainData = domains.map(d => ({
      name: d.code,
      fullName: d.name,
      count: employees.filter(e => e.domainId === d.id).length,
    })).sort((a, b) => b.count - a.count);

    const projStatusData = [
      { name: 'Active', value: activeProj, color: '#047857' },
      { name: 'Completed', value: compProj, color: '#10B981' },
      { name: 'Pending', value: pendProj, color: '#F59E0B' },
      { name: 'On Hold', value: projects.filter(p => p.status === 'ON_HOLD').length, color: '#E11D48' },
    ].filter(item => item.value > 0);

    return {
      totalEmployees: total,
      activeEmployees: activeEmp,
      activeProjects: activeProj,
      completedProjects: compProj,
      pendingProjects: pendProj,
      pendingLeaves: pendLeaves,
      domainChartData: domainData,
      projectStatusData: projStatusData,
    };
  }, [employees, projects, leaves, domains]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-64 rounded-3xl bg-[#E7E3D8] animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4].map(i => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton height="h-80" type="bar" />
          </div>
          <div className="lg:col-span-1">
            <ChartSkeleton height="h-80" type="donut" />
          </div>
        </div>
        <TableSkeleton rows={4} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. PRIYONIX HEADQUARTERS NIGHT HERO BANNER */}
      <section className="relative rounded-3xl overflow-hidden shadow-md border border-[#133E3E] text-white">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[#0B2E2E]">
          <img 
            src={BRAND_ASSETS.hqNight} 
            alt="PRIYONIX Headquarters Night" 
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Sophisticated Executive Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E1E] via-[#0B2E2E]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E1E] via-transparent to-[#071E1E]/40" />

        {/* Hero Content */}
        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#047857]/40 text-[#A7F3D0] text-xs font-semibold border border-[#047857]">
                <Building2 size={13} />
                <span>PRIYONIX Global Headquarters &bull; Chennai</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-xs">
                <ShieldCheck size={13} className="text-[#34D399]" />
                <span>Zero-Trust Enterprise RBAC</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-white font-display tracking-tight leading-tight">
              PRIYONIX Operations Command
            </h1>
            <p className="text-xs md:text-sm text-[#D1E0DE] leading-relaxed">
              Real-time enterprise workforce telemetry, cross-domain project velocity, and administrative approvals directly from corporate headquarters.
            </p>

            <div className="pt-2 flex items-center space-x-4 text-xs text-[#A7F3D0]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Live Telemetry Active</span>
              </div>
              <span className="text-white/30">&bull;</span>
              <span>8 Enterprise Domains</span>
              <span className="text-white/30">&bull;</span>
              <span>Org ID: PRX-HQ</span>
            </div>
          </div>

          {/* Quick Actions in Hero */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/employees"
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[#047857] hover:bg-[#065F46] text-white transition-all flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <Users size={15} />
              <span>Employee Directory</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/security-audit"
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all backdrop-blur-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <ShieldCheck size={15} className="text-[#34D399]" />
              <span>Security Audit (9/9)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. ORGANIZATION KPI METRICS (Emerald KPI Cards + White Rounded Cards) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Headcount */}
        <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] shadow-xs relative overflow-hidden group hover:border-[#047857]/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#047857]" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656966]">Total Headcount</span>
            <div className="p-2 rounded-xl bg-[#ECFDF5] text-[#047857]">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#0B2E2E] font-display">{totalEmployees}</span>
            <span className="text-[11px] text-[#047857] font-semibold bg-[#ECFDF5] px-1.5 py-0.5 rounded-md">
              {activeEmployees} Active
            </span>
          </div>
          <p className="text-[11px] text-[#656966] mt-1">Across 8 functional domains</p>
        </div>

        {/* Card 2: Active Projects */}
        <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] shadow-xs relative overflow-hidden group hover:border-[#047857]/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656966]">Active Projects</span>
            <div className="p-2 rounded-xl bg-[#ECFDF5] text-[#047857]">
              <BriefcaseBusiness size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#0B2E2E] font-display">{activeProjects}</span>
            <span className="text-[11px] text-[#656966] font-semibold">of {projects.length} Total</span>
          </div>
          <p className="text-[11px] text-[#656966] mt-1">{completedProjects} completed, {pendingProjects} queued</p>
        </div>

        {/* Card 3: Pending Leaves */}
        <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] shadow-xs relative overflow-hidden group hover:border-[#F59E0B]/40 transition-all">
          <div className={`absolute top-0 left-0 right-0 h-1 ${pendingLeaves.length > 0 ? 'bg-[#F59E0B]' : 'bg-[#047857]'}`} />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656966]">Pending Leaves</span>
            <div className={`p-2 rounded-xl ${pendingLeaves.length > 0 ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#ECFDF5] text-[#047857]'}`}>
              <CalendarDays size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold font-display ${pendingLeaves.length > 0 ? 'text-[#D97706]' : 'text-[#0B2E2E]'}`}>
              {pendingLeaves.length}
            </span>
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${pendingLeaves.length > 0 ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#ECFDF5] text-[#047857]'}`}>
              {pendingLeaves.length > 0 ? 'Requires Action' : 'All Clear'}
            </span>
          </div>
          <p className="text-[11px] text-[#656966] mt-1">
            {pendingLeaves.length > 0 ? 'Awaiting administrative approval' : 'Zero pending approvals'}
          </p>
        </div>

        {/* Card 4: Announcements */}
        <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] shadow-xs relative overflow-hidden group hover:border-[#047857]/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#047857]" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656966]">Announcements</span>
            <div className="p-2 rounded-xl bg-[#ECFDF5] text-[#047857]">
              <Megaphone size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#0B2E2E] font-display">{announcements.length}</span>
            <span className="text-[11px] text-[#047857] font-semibold bg-[#ECFDF5] px-1.5 py-0.5 rounded-md">
              Published
            </span>
          </div>
          <p className="text-[11px] text-[#656966] mt-1">Company-wide broadcasts</p>
        </div>
      </section>

      {/* 3. CHARTS: WORKFORCE BY DOMAIN & PROJECT STATUS (White Rounded Cards) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DOMAIN BREAKDOWN BAR CHART */}
        <div className="lg:col-span-8 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#047857] tracking-wider uppercase">
                Resource Allocation
              </span>
              <h3 className="text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
                Workforce Distribution by Domain
              </h3>
            </div>
            <Link
              to="/analytics/domains"
              className="text-xs font-bold text-[#047857] hover:underline flex items-center space-x-1"
            >
              <span>Domain Breakdown</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#73716B" fontSize={11} tickLine={false} />
                <YAxis stroke="#73716B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DDD7CA', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0B2E2E' }}
                />
                <Bar dataKey="count" fill="#047857" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROJECT STATUS PIE CHART */}
        <div className="lg:col-span-4 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#047857] tracking-wider uppercase">
              Project Health
            </span>
            <h3 className="text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
              Portfolio Status
            </h3>
            
            <div className="h-44 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DDD7CA', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#E7E3D8]">
            {projectStatusData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#222525] font-medium">{item.name}</span>
                </span>
                <span className="font-bold text-[#0B2E2E]">{item.value} Projects</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PENDING ACTIONS: LEAVE APPROVALS */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] font-bold text-[#D97706] tracking-wider uppercase flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>Pending Administrative Actions</span>
            </span>
            <h3 className="text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
              Leave Requests Awaiting Approval
            </h3>
          </div>
          <Link
            to="/leave"
            className="text-xs font-bold text-[#047857] hover:underline flex items-center space-x-1"
          >
            <span>View All ({leaves.length})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-8 text-center bg-[#F8F6F1] rounded-2xl border border-[#E7E3D8]">
            <CheckCircle2 size={28} className="mx-auto text-[#047857] mb-2" />
            <h4 className="text-sm font-bold text-[#0B2E2E]">No Pending Approvals</h4>
            <p className="text-xs text-[#656966] mt-1">All employee leave requests have been processed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLeaves.map(leave => (
              <div
                key={leave.id}
                className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#E7E3D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-sm text-[#222525]">{leave.employeeName}</span>
                    <span className="text-[10px] text-[#656966]">({leave.employeeId})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-bold">
                      {leave.leaveType} &bull; {leave.duration}
                    </span>
                  </div>
                  <p className="text-xs text-[#656966]">
                    Dates: <strong className="text-[#222525]">{leave.startDate} to {leave.endDate}</strong> ({leave.daysCount} days)
                  </p>
                  <p className="text-xs text-[#656966] mt-0.5 italic">
                    Reason: "{leave.reason}"
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApproveLeave(leave)}
                    disabled={actionLoading === leave.id}
                    className="px-3.5 py-1.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectLeave(leave)}
                    disabled={actionLoading === leave.id}
                    className="px-3 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#F87171]/40 text-[#B91C1C] hover:bg-[#FEE2E2] text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. RECENT ACTIVITY STREAM & RECENT ANNOUNCEMENTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ACTIVITY AUDIT STREAM */}
        <div className="lg:col-span-7 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#047857] tracking-wider uppercase flex items-center space-x-1">
                <Activity size={14} />
                <span>Zero-Trust Governance</span>
              </span>
              <h3 className="text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
                Organization Activity Stream
              </h3>
            </div>
            <Link
              to="/activity"
              className="text-xs font-bold text-[#047857] hover:underline flex items-center space-x-1"
            >
              <span>Full Audit Log</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {activities.map(act => (
              <div 
                key={act.id} 
                className="p-3.5 rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] flex items-start space-x-3 text-xs"
              >
                <div className="p-1.5 rounded-lg bg-[#047857]/10 text-[#047857] shrink-0 mt-0.5 font-bold">
                  {act.action.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#222525]">{act.action}</span>
                    <span className="text-[10px] text-[#656966]">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#656966] mt-0.5 line-clamp-1">{act.details}</p>
                  <p className="text-[10px] text-[#047857] mt-0.5 font-medium">
                    By {act.performedByName} ({act.performedByRole})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ANNOUNCEMENTS */}
        <div className="lg:col-span-5 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold text-[#047857] tracking-wider uppercase">
                  Broadcasts
                </span>
                <h3 className="text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
                  Recent Announcements
                </h3>
              </div>
              <Link
                to="/announcements"
                className="text-xs font-bold text-[#047857] hover:underline"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="p-3.5 rounded-xl bg-[#F8F6F1] border border-[#E7E3D8]">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                      {ann.category}
                    </span>
                    <span className="text-[#656966]">{ann.publishedDate}</span>
                  </div>
                  <h5 className="font-bold text-xs text-[#222525] line-clamp-1">{ann.title}</h5>
                  <p className="text-[11px] text-[#656966] line-clamp-2 mt-1">{ann.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/announcements"
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#047857] hover:bg-[#065F46] text-xs font-bold text-white text-center transition-all block shadow-xs"
          >
            Create New Announcement &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
};

