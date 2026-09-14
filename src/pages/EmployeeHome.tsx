import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  BriefcaseBusiness, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Megaphone, 
  ArrowRight, 
  Sparkles, 
  CalendarCheck, 
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Building2,
  Layers3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchEmployeeDirectory, getCachedEmployeeDirectory } from '../services/employeeService';
import { fetchProjects, getCachedProjects } from '../services/projectService';
import { fetchRecognitions, getCachedRecognitions } from '../services/recognitionService';
import { fetchAnnouncements, getCachedAnnouncements } from '../services/announcementService';
import { fetchDomains, fetchDepartments, getCachedDomains } from '../services/departmentService';
import { EmployeeDirectoryItem, ProjectItem, RecognitionItem, AnnouncementItem, Domain } from '../types';
import { StatsCardSkeleton, CardSkeleton, Skeleton } from '../components/common/LoadingSkeleton';

export const EmployeeHome: React.FC = () => {
  const { userProfile, role } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>(() => getCachedEmployeeDirectory());
  const [projects, setProjects] = useState<ProjectItem[]>(() => getCachedProjects());
  const [recognitions, setRecognitions] = useState<RecognitionItem[]>(() => getCachedRecognitions('MONTHLY') || []);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => getCachedAnnouncements(true));
  const [domains, setDomains] = useState<Domain[]>(() => getCachedDomains());
  const [loading, setLoading] = useState(() => getCachedEmployeeDirectory().length === 0);

  useEffect(() => {
    const loadHomeData = async (silent = false) => {
      if (!silent && employees.length === 0) setLoading(true);
      try {
        const [empData, prjData, recData, annData, domData] = await Promise.all([
          fetchEmployeeDirectory(),
          fetchProjects(),
          fetchRecognitions('MONTHLY'),
          fetchAnnouncements(true),
          fetchDomains(),
        ]);
        setEmployees(empData);
        setProjects(prjData);
        setRecognitions(recData);
        setAnnouncements(annData);
        setDomains(domData);
      } catch (err) {
        console.error('Error loading employee home data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData(employees.length > 0);
  }, []);

  // Compute database-derived metrics (memoized)
  const { totalEmployees, activeProjects, completedProjects, pendingProjects } = useMemo(() => ({
    totalEmployees: employees.length,
    activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    pendingProjects: projects.filter(p => p.status === 'PENDING').length,
  }), [employees, projects]);

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-48 bg-[#DDD7CA]" />
            <Skeleton className="h-8 w-72 bg-[#DDD7CA]" />
            <Skeleton className="h-4 w-60 bg-[#DDD7CA]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl bg-[#DDD7CA]" />
            <Skeleton className="h-10 w-32 rounded-xl bg-[#DDD7CA]" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4].map(i => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 1. EDITORIAL HEADER & WELCOME */}
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase">
            PRIYONIX WORKSPACE &bull; {userProfile?.departmentId || 'ENGINEERING'}
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Good morning, {userProfile?.name || 'Devika'}
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            Here's what's happening across PRIYONIX operations, ongoing projects, and company-wide milestones.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#047857] hover:bg-[#065F46] text-white transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <span>My 360 Profile</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/leave"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-[#E7E3D8] text-[#222525] hover:bg-[#F8F6F1] transition-colors"
          >
            Request Leave
          </Link>
        </div>
      </section>

      {/* 2. ORGANIZATION SNAPSHOT METRICS (Emerald KPI Cards) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold tracking-wider text-[#656966] uppercase">
            Organization Snapshot
          </h2>
          <span className="text-[11px] text-[#047857] font-semibold">Live Database Telemetry</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] relative overflow-hidden shadow-xs hover:border-[#047857]/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#047857]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#656966]">Total Employees</span>
              <div className="p-2 rounded-xl bg-[#ECFDF5] text-[#047857]">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#0B2E2E] font-display">{totalEmployees}</span>
              <span className="text-[11px] text-[#047857] font-semibold flex items-center bg-[#ECFDF5] px-1.5 py-0.5 rounded-md">
                <TrendingUp size={12} className="mr-0.5" /> 8 Domains
              </span>
            </div>
            <p className="text-[11px] text-[#656966] mt-1">Across 4 technology campuses</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] relative overflow-hidden shadow-xs hover:border-[#047857]/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#656966]">Active Projects</span>
              <div className="p-2 rounded-xl bg-[#ECFDF5] text-[#047857]">
                <BriefcaseBusiness size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#0B2E2E] font-display">{activeProjects}</span>
              <span className="text-[11px] text-[#047857] font-semibold bg-[#ECFDF5] px-1.5 py-0.5 rounded-md">In Progress</span>
            </div>
            <p className="text-[11px] text-[#656966] mt-1">AI, Cloud, Security & Design</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] relative overflow-hidden shadow-xs hover:border-[#047857]/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#047857]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#656966]">Completed Projects</span>
              <div className="p-2 rounded-xl bg-[#ECFDF5] text-[#047857]">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#047857] font-display">{completedProjects}</span>
              <span className="text-[11px] text-[#047857] font-semibold bg-[#ECFDF5] px-1.5 py-0.5 rounded-md">Production Ready</span>
            </div>
            <p className="text-[11px] text-[#656966] mt-1">High-impact company deliverables</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] relative overflow-hidden shadow-xs hover:border-[#F59E0B]/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#F59E0B]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#656966]">Pending / Upcoming</span>
              <div className="p-2 rounded-xl bg-[#FFFBEB] text-[#D97706]">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#D97706] font-display">{pendingProjects}</span>
              <span className="text-[11px] text-[#656966] font-semibold">Roadmap Queue</span>
            </div>
            <p className="text-[11px] text-[#656966] mt-1">Scheduled for Q4 execution</p>
          </div>
        </div>
      </section>

      {/* 3. TOP 3 RECOGNITION PODIUM & WORKFORCE OVERVIEW (White Rounded Cards) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TOP 3 RECOGNITIONS SHOWCASE */}
        <div className="lg:col-span-7 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#047857] tracking-wider uppercase flex items-center space-x-1">
                <Trophy size={14} className="text-[#D97706]" />
                <span>Monthly Recognition Podium</span>
              </span>
              <h3 className="text-lg md:text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
                Top 3 Performers &bull; August 2026
              </h3>
            </div>
            <Link
              to="/recognition"
              className="text-xs font-bold text-[#047857] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {recognitions.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#E7E3D8] hover:border-[#047857]/40 transition-all flex items-start space-x-4"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  item.rank === 1 ? 'bg-[#D97706] text-white' :
                  item.rank === 2 ? 'bg-[#047857] text-white' :
                  'bg-[#E7E3D8] text-[#222525]'
                }`}>
                  #{item.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#222525] truncate">{item.employeeName}</h4>
                      <p className="text-[11px] text-[#656966]">{item.departmentName} &bull; {item.employeeId}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                      Score: {item.score}/100
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#047857]">
                    {item.category}
                  </div>
                  <p className="text-xs text-[#656966] mt-0.5 line-clamp-2 leading-relaxed">
                    {item.achievement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WORKFORCE BY DOMAIN HIGHLIGHT */}
        <div className="lg:col-span-5 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#047857] tracking-wider uppercase flex items-center space-x-1">
              <Layers3 size={14} />
              <span>Workforce Capabilities</span>
            </span>
            <h3 className="text-lg md:text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
              Domain Expertise
            </h3>
            <p className="text-xs text-[#656966] mt-1">
              Distributed engineering and organizational domains powering PRIYONIX systems.
            </p>

            <div className="mt-5 space-y-2.5">
              {domains.slice(0, 5).map(domain => {
                const count = employees.filter(e => e.domainId === domain.id).length;
                const pct = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
                return (
                  <div key={domain.id} className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E7E3D8]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#222525]">{domain.name}</span>
                      <span className="font-semibold text-[#656966]">{count} Members</span>
                    </div>
                    <div className="w-full bg-[#E7E3D8] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#047857] h-full rounded-full" 
                        style={{ width: `${Math.max(10, pct * 2.5)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            to="/employees"
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] hover:border-[#047857] text-xs font-bold text-[#0B2E2E] text-center transition-all block"
          >
            Browse All {totalEmployees} Employees in Directory &rarr;
          </Link>
        </div>
      </section>

      {/* 4. COMPANY PROJECTS (White Rounded Cards) */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] font-bold text-[#047857] tracking-wider uppercase">
              Operations & Engineering
            </span>
            <h3 className="text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
              Company Projects
            </h3>
          </div>
          <Link
            to="/projects"
            className="text-xs font-bold text-[#047857] hover:underline flex items-center space-x-1"
          >
            <span>View All Projects</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map(proj => (
            <div 
              key={proj.id} 
              className="p-5 rounded-2xl bg-[#F8F6F1] border border-[#E7E3D8] flex flex-col justify-between hover:border-[#047857]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    proj.status === 'ACTIVE' ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]' :
                    proj.status === 'COMPLETED' ? 'bg-[#ECFDF5] text-[#047857]' :
                    proj.status === 'PENDING' ? 'bg-[#FFFBEB] text-[#D97706]' :
                    'bg-[#FEF2F2] text-[#B91C1C]'
                  }`}>
                    {proj.status}
                  </span>
                  <span className="text-[10px] font-semibold text-[#656966]">
                    Due {proj.deadline}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#222525] mb-1 leading-snug">{proj.name}</h4>
                <p className="text-xs text-[#656966] line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E7E3D8]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#656966]">Team: {proj.team}</span>
                  <span className="font-bold text-[#0B2E2E]">{proj.completionPercentage}%</span>
                </div>
                <div className="w-full bg-[#E7E3D8] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#047857] h-full rounded-full transition-all duration-300"
                    style={{ width: `${proj.completionPercentage}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ANNOUNCEMENTS & COMPANY UPDATES */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#047857] tracking-wider uppercase flex items-center space-x-1">
                <Megaphone size={14} />
                <span>Internal Communications</span>
              </span>
              <h3 className="text-xl font-bold text-[#0B2E2E] font-display mt-0.5">
                Official Announcements
              </h3>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-bold text-[#047857] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {announcements.slice(0, 3).map(ann => (
              <div 
                key={ann.id}
                className="p-5 rounded-2xl bg-[#F8F6F1] border border-[#E7E3D8] hover:border-[#047857]/40 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                    {ann.category}
                  </span>
                  <span className="text-[11px] text-[#656966]">
                    {ann.publishedDate} &bull; by {ann.authorName}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#222525] mb-1.5 font-display">
                  {ann.title}
                </h4>
                <p className="text-xs text-[#656966] leading-relaxed">
                  {ann.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK SHORTCUTS & POLICY NOTICE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0B2E2E] text-white rounded-3xl p-6 md:p-8 shadow-xs">
            <span className="text-[10px] font-bold text-[#34D399] tracking-widest uppercase">
              CONFIDENTIAL PORTAL
            </span>
            <h4 className="text-lg font-bold font-display mt-1 text-white">
              Employee 360 Privacy
            </h4>
            <p className="text-xs text-[#D1E0DE] mt-2 leading-relaxed">
              Your salary revisions, hike history, and emergency medical records are isolated and protected by Cloud Firestore security rules.
            </p>
            <Link
              to="/profile"
              className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <ShieldCheck size={14} />
              <span>Review Private File</span>
            </Link>
          </div>

          <div className="bg-white border border-[#E7E3D8] rounded-3xl p-6 shadow-xs">
            <h4 className="text-xs font-bold text-[#656966] uppercase tracking-wider mb-3">
              Quick Operations
            </h4>
            <div className="space-y-2">
              <Link
                to="/attendance"
                className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] hover:border-[#047857] flex items-center justify-between text-xs font-semibold text-[#222525] transition-all block"
              >
                <span className="flex items-center space-x-2">
                  <CalendarCheck size={16} className="text-[#047857]" />
                  <span>Check Monthly Attendance</span>
                </span>
                <ChevronRight size={14} className="text-[#656966]" />
              </Link>
              <Link
                to="/leave"
                className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] hover:border-[#047857] flex items-center justify-between text-xs font-semibold text-[#222525] transition-all block"
              >
                <span className="flex items-center space-x-2">
                  <CalendarDays size={16} className="text-[#047857]" />
                  <span>Submit Leave Request</span>
                </span>
                <ChevronRight size={14} className="text-[#656966]" />
              </Link>
              <Link
                to="/employees"
                className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] hover:border-[#047857] flex items-center justify-between text-xs font-semibold text-[#222525] transition-all block"
              >
                <span className="flex items-center space-x-2">
                  <Users size={16} className="text-[#047857]" />
                  <span>Search Directory</span>
                </span>
                <ChevronRight size={14} className="text-[#656966]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
