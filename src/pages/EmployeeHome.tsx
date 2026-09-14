import React, { useState, useEffect } from 'react';
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
import { fetchEmployeeDirectory } from '../services/employeeService';
import { fetchProjects } from '../services/projectService';
import { fetchRecognitions } from '../services/recognitionService';
import { fetchAnnouncements } from '../services/announcementService';
import { fetchDomains, fetchDepartments } from '../services/departmentService';
import { EmployeeDirectoryItem, ProjectItem, RecognitionItem, AnnouncementItem, Domain } from '../types';
import { StatsCardSkeleton, CardSkeleton, Skeleton } from '../components/common/LoadingSkeleton';

export const EmployeeHome: React.FC = () => {
  const { userProfile, role } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [recognitions, setRecognitions] = useState<RecognitionItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
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
    loadHomeData();
  }, []);

  // Compute database-derived metrics
  const totalEmployees = employees.length;
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const pendingProjects = projects.filter(p => p.status === 'PENDING').length;

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
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase">
            PRIONIX WORKSPACE &bull; {userProfile?.departmentId || 'ENGINEERING'}
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Good morning, {userProfile?.name || 'Devika'}
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Here's what's happening across Prionix operations, ongoing projects, and company-wide milestones.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#174A4A] hover:bg-[#123B3B] text-[#F7F4ED] transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <span>My 360 Profile</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/leave"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] text-[#30302D] hover:bg-[#DDD7CA] transition-colors"
          >
            Request Leave
          </Link>
        </div>
      </section>

      {/* 2. ORGANIZATION SNAPSHOT METRICS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold tracking-wider text-[#73716B] uppercase">
            Organization Snapshot
          </h2>
          <span className="text-[11px] text-[#789B8B] font-semibold">Live Database Telemetry</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] hover:border-[#789B8B] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#73716B]">Total Employees</span>
              <div className="p-2 rounded-xl bg-[#F7F4ED] text-[#174A4A]">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#174A4A] font-display">{totalEmployees}</span>
              <span className="text-[11px] text-[#4F8068] font-semibold flex items-center">
                <TrendingUp size={12} className="mr-0.5" /> 8 Domains
              </span>
            </div>
            <p className="text-[11px] text-[#73716B] mt-1">Across 4 technology campuses</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] hover:border-[#174A4A] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#73716B]">Active Projects</span>
              <div className="p-2 rounded-xl bg-[#F7F4ED] text-[#174A4A]">
                <BriefcaseBusiness size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#174A4A] font-display">{activeProjects}</span>
              <span className="text-[11px] text-[#174A4A] font-semibold">In Progress</span>
            </div>
            <p className="text-[11px] text-[#73716B] mt-1">AI, Cloud, Security & Design</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] hover:border-[#4F8068] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#73716B]">Completed Projects</span>
              <div className="p-2 rounded-xl bg-[#F7F4ED] text-[#4F8068]">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#4F8068] font-display">{completedProjects}</span>
              <span className="text-[11px] text-[#4F8068] font-semibold">Production Ready</span>
            </div>
            <p className="text-[11px] text-[#73716B] mt-1">High-impact company deliverables</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] hover:border-[#B58A3A] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#73716B]">Pending / Upcoming</span>
              <div className="p-2 rounded-xl bg-[#F7F4ED] text-[#B58A3A]">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#B58A3A] font-display">{pendingProjects}</span>
              <span className="text-[11px] text-[#73716B] font-semibold">Roadmap Queue</span>
            </div>
            <p className="text-[11px] text-[#73716B] mt-1">Scheduled for Q4 execution</p>
          </div>
        </div>
      </section>

      {/* 3. TOP 3 RECOGNITION PODIUM & WORKFORCE OVERVIEW */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TOP 3 RECOGNITIONS SHOWCASE */}
        <div className="lg:col-span-7 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#789B8B] tracking-wider uppercase flex items-center space-x-1">
                <Trophy size={14} className="text-[#C5A45D]" />
                <span>Monthly Recognition Podium</span>
              </span>
              <h3 className="text-lg md:text-xl font-bold text-[#174A4A] font-display mt-0.5">
                Top 3 Performers &bull; August 2026
              </h3>
            </div>
            <Link
              to="/recognition"
              className="text-xs font-bold text-[#174A4A] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {recognitions.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] hover:border-[#789B8B] transition-all flex items-start space-x-4"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  item.rank === 1 ? 'bg-[#C5A45D] text-[#F7F4ED]' :
                  item.rank === 2 ? 'bg-[#789B8B] text-[#F7F4ED]' :
                  'bg-[#DDD7CA] text-[#30302D]'
                }`}>
                  #{item.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#30302D] truncate">{item.employeeName}</h4>
                      <p className="text-[11px] text-[#73716B]">{item.departmentName} &bull; {item.employeeId}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#174A4A]/10 text-[#174A4A]">
                      Score: {item.score}/100
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#174A4A]">
                    {item.category}
                  </div>
                  <p className="text-xs text-[#73716B] mt-0.5 line-clamp-2 leading-relaxed">
                    {item.achievement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WORKFORCE BY DOMAIN HIGHLIGHT */}
        <div className="lg:col-span-5 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#789B8B] tracking-wider uppercase flex items-center space-x-1">
              <Layers3 size={14} />
              <span>Workforce Capabilities</span>
            </span>
            <h3 className="text-lg md:text-xl font-bold text-[#174A4A] font-display mt-0.5">
              Domain Expertise
            </h3>
            <p className="text-xs text-[#73716B] mt-1">
              Distributed engineering and organizational domains powering Prionix systems.
            </p>

            <div className="mt-5 space-y-2.5">
              {domains.slice(0, 5).map(domain => {
                const count = employees.filter(e => e.domainId === domain.id).length;
                const pct = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
                return (
                  <div key={domain.id} className="p-3 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#30302D]">{domain.name}</span>
                      <span className="font-semibold text-[#73716B]">{count} Members</span>
                    </div>
                    <div className="w-full bg-[#E5E2DA] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#174A4A] h-full rounded-full" 
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
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] hover:border-[#174A4A] text-xs font-bold text-[#174A4A] text-center transition-all block"
          >
            Browse All {totalEmployees} Employees in Directory &rarr;
          </Link>
        </div>
      </section>

      {/* 4. COMPANY PROJECTS */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] font-bold text-[#789B8B] tracking-wider uppercase">
              Operations & Engineering
            </span>
            <h3 className="text-xl font-bold text-[#174A4A] font-display mt-0.5">
              Company Projects
            </h3>
          </div>
          <Link
            to="/projects"
            className="text-xs font-bold text-[#174A4A] hover:underline flex items-center space-x-1"
          >
            <span>View All Projects</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map(proj => (
            <div 
              key={proj.id} 
              className="p-5 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] flex flex-col justify-between hover:border-[#174A4A] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    proj.status === 'ACTIVE' ? 'bg-[#174A4A]/10 text-[#174A4A]' :
                    proj.status === 'COMPLETED' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                    proj.status === 'PENDING' ? 'bg-[#C5A45D]/15 text-[#B58A3A]' :
                    'bg-[#C97867]/15 text-[#C97867]'
                  }`}>
                    {proj.status}
                  </span>
                  <span className="text-[10px] font-semibold text-[#73716B]">
                    Due {proj.deadline}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#30302D] mb-1 leading-snug">{proj.name}</h4>
                <p className="text-xs text-[#73716B] line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#DDD7CA]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#73716B]">Team: {proj.team}</span>
                  <span className="font-bold text-[#174A4A]">{proj.completionPercentage}%</span>
                </div>
                <div className="w-full bg-[#E5E2DA] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#174A4A] h-full rounded-full transition-all duration-300"
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
        <div className="lg:col-span-8 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#789B8B] tracking-wider uppercase flex items-center space-x-1">
                <Megaphone size={14} />
                <span>Internal Communications</span>
              </span>
              <h3 className="text-xl font-bold text-[#174A4A] font-display mt-0.5">
                Official Announcements
              </h3>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-bold text-[#174A4A] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {announcements.slice(0, 3).map(ann => (
              <div 
                key={ann.id}
                className="p-5 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] hover:border-[#174A4A] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#789B8B]/20 text-[#174A4A]">
                    {ann.category}
                  </span>
                  <span className="text-[11px] text-[#73716B]">
                    {ann.publishedDate} &bull; by {ann.authorName}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#30302D] mb-1.5 font-display">
                  {ann.title}
                </h4>
                <p className="text-xs text-[#73716B] leading-relaxed">
                  {ann.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK SHORTCUTS & POLICY NOTICE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#174A4A] text-[#F7F4ED] rounded-3xl p-6 md:p-8">
            <span className="text-[10px] font-bold text-[#789B8B] tracking-widest uppercase">
              CONFIDENTIAL PORTAL
            </span>
            <h4 className="text-lg font-bold font-display mt-1 text-[#F7F4ED]">
              Employee 360 Privacy
            </h4>
            <p className="text-xs text-[#EFEAE0]/80 mt-2 leading-relaxed">
              Your salary revisions, hike history, and emergency medical records are isolated and protected by Cloud Firestore security rules.
            </p>
            <Link
              to="/profile"
              className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#789B8B] text-[#174A4A] font-bold text-xs hover:bg-[#F7F4ED] transition-colors"
            >
              <ShieldCheck size={14} />
              <span>Review Private File</span>
            </Link>
          </div>

          <div className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6">
            <h4 className="text-xs font-bold text-[#73716B] uppercase tracking-wider mb-3">
              Quick Operations
            </h4>
            <div className="space-y-2">
              <Link
                to="/attendance"
                className="p-3 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] hover:border-[#174A4A] flex items-center justify-between text-xs font-semibold text-[#30302D] transition-all block"
              >
                <span className="flex items-center space-x-2">
                  <CalendarCheck size={16} className="text-[#174A4A]" />
                  <span>Check Monthly Attendance</span>
                </span>
                <ChevronRight size={14} className="text-[#73716B]" />
              </Link>
              <Link
                to="/leave"
                className="p-3 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] hover:border-[#174A4A] flex items-center justify-between text-xs font-semibold text-[#30302D] transition-all block"
              >
                <span className="flex items-center space-x-2">
                  <CalendarDays size={16} className="text-[#174A4A]" />
                  <span>Submit Leave Request</span>
                </span>
                <ChevronRight size={14} className="text-[#73716B]" />
              </Link>
              <Link
                to="/employees"
                className="p-3 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] hover:border-[#174A4A] flex items-center justify-between text-xs font-semibold text-[#30302D] transition-all block"
              >
                <span className="flex items-center space-x-2">
                  <Users size={16} className="text-[#174A4A]" />
                  <span>Search Directory</span>
                </span>
                <ChevronRight size={14} className="text-[#73716B]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
