import React, { useState, useEffect } from 'react';
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
  TrendingUp
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
import { fetchEmployeeDirectory } from '../services/employeeService';
import { fetchProjects } from '../services/projectService';
import { fetchLeaves, updateLeaveStatus } from '../services/leaveService';
import { fetchAnnouncements } from '../services/announcementService';
import { fetchDomains } from '../services/departmentService';
import { fetchActivityLogs } from '../services/activityService';
import { EmployeeDirectoryItem, ProjectItem, LeaveRecord, AnnouncementItem, Domain, ActivityLogItem } from '../types';
import { StatsCardSkeleton, ChartSkeleton, TableSkeleton, Skeleton } from '../components/common/LoadingSkeleton';

export const AdminDashboard: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboardData = async () => {
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
    loadDashboardData();
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

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const pendingProjects = projects.filter(p => p.status === 'PENDING').length;
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');

  // Chart data: Workforce by domain
  const domainChartData = domains.map(d => ({
    name: d.code,
    fullName: d.name,
    count: employees.filter(e => e.domainId === d.id).length,
  })).sort((a, b) => b.count - a.count);

  // Chart data: Project status
  const projectStatusData = [
    { name: 'Active', value: activeProjects, color: '#174A4A' },
    { name: 'Completed', value: completedProjects, color: '#4F8068' },
    { name: 'Pending', value: pendingProjects, color: '#C5A45D' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'ON_HOLD').length, color: '#C97867' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-48 bg-[#DDD7CA]" />
            <Skeleton className="h-8 w-80 bg-[#DDD7CA]" />
            <Skeleton className="h-4 w-64 bg-[#DDD7CA]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl bg-[#DDD7CA]" />
            <Skeleton className="h-10 w-32 rounded-xl bg-[#DDD7CA]" />
          </div>
        </div>
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
    <div className="space-y-10">
      {/* 1. EDITORIAL HEADER */}
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase">
            EXECUTIVE CONTROL CONSOLE &bull; ORG ID: PRX-HQ
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Prionix Operations Command
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Live workforce metrics, organizational project telemetry, and administrative approval queues.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/employees"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#174A4A] hover:bg-[#123B3B] text-[#F7F4ED] transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <span>Manage Employees</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/security-audit"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#4F8068]/15 border border-[#4F8068]/30 text-[#4F8068] hover:bg-[#4F8068]/25 transition-colors"
          >
            Security Audit Runner
          </Link>
        </div>
      </section>

      {/* 2. ORGANIZATION KPI METRICS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#73716B]">Total Headcount</span>
            <div className="p-2 rounded-xl bg-[#F7F4ED] text-[#174A4A]">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#174A4A] font-display">{totalEmployees}</span>
            <span className="text-[11px] text-[#4F8068] font-semibold">{activeEmployees} Active</span>
          </div>
          <p className="text-[11px] text-[#73716B] mt-1">Across 8 functional domains</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#73716B]">Active Projects</span>
            <div className="p-2 rounded-xl bg-[#F7F4ED] text-[#174A4A]">
              <BriefcaseBusiness size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#174A4A] font-display">{activeProjects}</span>
            <span className="text-[11px] text-[#73716B] font-semibold">of {projects.length} Total</span>
          </div>
          <p className="text-[11px] text-[#73716B] mt-1">{completedProjects} completed, {pendingProjects} queued</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#73716B]">Pending Leaves</span>
            <div className="p-2 rounded-xl bg-[#F7F4ED] text-[#B58A3A]">
              <CalendarDays size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#B58A3A] font-display">{pendingLeaves.length}</span>
            <span className="text-[11px] text-[#B58A3A] font-semibold">Requires Action</span>
          </div>
          <p className="text-[11px] text-[#73716B] mt-1">Awaiting administrative approval</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#73716B]">Announcements</span>
            <div className="p-2 rounded-xl bg-[#F7F4ED] text-[#789B8B]">
              <Megaphone size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#174A4A] font-display">{announcements.length}</span>
            <span className="text-[11px] text-[#4F8068] font-semibold">Published</span>
          </div>
          <p className="text-[11px] text-[#73716B] mt-1">Company-wide broadcasts</p>
        </div>
      </section>

      {/* 3. CHARTS: WORKFORCE BY DOMAIN & PROJECT STATUS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DOMAIN BREAKDOWN BAR CHART */}
        <div className="lg:col-span-8 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#789B8B] tracking-wider uppercase">
                Resource Allocation
              </span>
              <h3 className="text-xl font-bold text-[#174A4A] font-display mt-0.5">
                Workforce Distribution by Domain
              </h3>
            </div>
            <Link
              to="/analytics/domains"
              className="text-xs font-bold text-[#174A4A] hover:underline flex items-center space-x-1"
            >
              <span>Deep Dive</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#73716B" fontSize={11} tickLine={false} />
                <YAxis stroke="#73716B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#F7F4ED', borderColor: '#DDD7CA', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#174A4A' }}
                />
                <Bar dataKey="count" fill="#174A4A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROJECT STATUS PIE CHART */}
        <div className="lg:col-span-4 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#789B8B] tracking-wider uppercase">
              Project Health
            </span>
            <h3 className="text-xl font-bold text-[#174A4A] font-display mt-0.5">
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
                    contentStyle={{ backgroundColor: '#F7F4ED', borderColor: '#DDD7CA', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t border-[#DDD7CA]">
            {projectStatusData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#30302D] font-medium">{item.name}</span>
                </span>
                <span className="font-bold text-[#174A4A]">{item.value} Projects</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PENDING ACTIONS: LEAVE APPROVALS */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] font-bold text-[#B58A3A] tracking-wider uppercase flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>Pending Administrative Actions</span>
            </span>
            <h3 className="text-xl font-bold text-[#174A4A] font-display mt-0.5">
              Leave Requests Awaiting Approval
            </h3>
          </div>
          <Link
            to="/leave"
            className="text-xs font-bold text-[#174A4A] hover:underline flex items-center space-x-1"
          >
            <span>View All ({leaves.length})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-8 text-center bg-[#F7F4ED] rounded-2xl border border-[#DDD7CA]">
            <CheckCircle2 size={28} className="mx-auto text-[#4F8068] mb-2" />
            <h4 className="text-sm font-bold text-[#174A4A]">No Pending Approvals</h4>
            <p className="text-xs text-[#73716B] mt-1">All employee leave requests have been processed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLeaves.map(leave => (
              <div
                key={leave.id}
                className="p-4 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-sm text-[#30302D]">{leave.employeeName}</span>
                    <span className="text-[10px] text-[#73716B]">({leave.employeeId})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B58A3A]/15 text-[#B58A3A] font-bold">
                      {leave.leaveType} &bull; {leave.duration}
                    </span>
                  </div>
                  <p className="text-xs text-[#73716B]">
                    Dates: <strong className="text-[#30302D]">{leave.startDate} to {leave.endDate}</strong> ({leave.daysCount} days)
                  </p>
                  <p className="text-xs text-[#73716B] mt-0.5 italic">
                    Reason: "{leave.reason}"
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApproveLeave(leave)}
                    disabled={actionLoading === leave.id}
                    className="px-3.5 py-1.5 rounded-xl bg-[#4F8068] hover:bg-[#436e59] text-[#F7F4ED] text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectLeave(leave)}
                    disabled={actionLoading === leave.id}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF0EE] border border-[#C97867]/40 text-[#B85C50] hover:bg-[#C97867]/20 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
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
        <div className="lg:col-span-7 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#789B8B] tracking-wider uppercase flex items-center space-x-1">
                <Activity size={14} />
                <span>Zero-Trust Governance</span>
              </span>
              <h3 className="text-xl font-bold text-[#174A4A] font-display mt-0.5">
                Organization Activity Stream
              </h3>
            </div>
            <Link
              to="/activity"
              className="text-xs font-bold text-[#174A4A] hover:underline flex items-center space-x-1"
            >
              <span>Full Audit Log</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {activities.map(act => (
              <div 
                key={act.id} 
                className="p-3.5 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] flex items-start space-x-3 text-xs"
              >
                <div className="p-1.5 rounded-lg bg-[#174A4A]/10 text-[#174A4A] shrink-0 mt-0.5 font-bold">
                  {act.action.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#30302D]">{act.action}</span>
                    <span className="text-[10px] text-[#73716B]">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#73716B] mt-0.5 line-clamp-1">{act.details}</p>
                  <p className="text-[10px] text-[#789B8B] mt-0.5 font-medium">
                    By {act.performedByName} ({act.performedByRole})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ANNOUNCEMENTS */}
        <div className="lg:col-span-5 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold text-[#789B8B] tracking-wider uppercase">
                  Broadcasts
                </span>
                <h3 className="text-xl font-bold text-[#174A4A] font-display mt-0.5">
                  Recent Announcements
                </h3>
              </div>
              <Link
                to="/announcements"
                className="text-xs font-bold text-[#174A4A] hover:underline"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="p-3.5 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-bold px-1.5 py-0.2 rounded bg-[#789B8B]/20 text-[#174A4A]">
                      {ann.category}
                    </span>
                    <span className="text-[#73716B]">{ann.publishedDate}</span>
                  </div>
                  <h5 className="font-bold text-xs text-[#30302D] line-clamp-1">{ann.title}</h5>
                  <p className="text-[11px] text-[#73716B] line-clamp-2 mt-1">{ann.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/announcements"
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#174A4A] hover:bg-[#123B3B] text-xs font-bold text-[#F7F4ED] text-center transition-all block shadow-xs"
          >
            Create New Announcement &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
};
