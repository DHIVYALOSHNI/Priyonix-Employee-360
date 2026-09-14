import React, { useState, useEffect } from 'react';
import { 
  ChartNoAxesCombined, 
  Users, 
  TrendingUp, 
  Building2, 
  Layers3, 
  UserCheck, 
  UserX 
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
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getWorkforceAnalytics, getCachedWorkforceAnalytics, WorkforceAnalyticsData } from '../services/analyticsService';
import { StatsCardSkeleton, ChartSkeleton, Skeleton } from '../components/common/LoadingSkeleton';

export const WorkforceAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<WorkforceAnalyticsData | null>(() => getCachedWorkforceAnalytics());
  const [loading, setLoading] = useState(() => !getCachedWorkforceAnalytics());

  useEffect(() => {
    getWorkforceAnalytics().then(data => {
      setAnalytics(data);
      setLoading(false);
    });
  }, []);

  if (loading || !analytics) {
    return (
      <div className="space-y-8">
        <div className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-48 bg-[#E7E3D8]" />
            <Skeleton className="h-8 w-80 bg-[#E7E3D8]" />
            <Skeleton className="h-4 w-64 bg-[#E7E3D8]" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-80" type="bar" />
          <ChartSkeleton height="h-80" type="donut" />
        </div>
      </div>
    );
  }

  const deptData = (analytics.departmentDistribution || []).map(d => {
    const rawName = (d as any).name || (d as any).departmentName || 'Department';
    return {
      name: typeof rawName === 'string' ? rawName.split(' ')[0] : 'Dept',
      fullName: rawName,
      count: d.count,
    };
  });

  const domainData = (analytics.domainDistribution || []).map(d => {
    const rawName = (d as any).name || (d as any).domainName || (d as any).code || 'Domain';
    return {
      name: (d as any).code || (typeof rawName === 'string' ? rawName.split(' ')[0] : 'Domain'),
      fullName: rawName,
      count: d.count,
    };
  });

  const statusPieData = [
    { name: 'Active', value: analytics.activeEmployees, color: '#047857' },
    { name: 'On Leave', value: analytics.onLeaveEmployees, color: '#D97706' },
    { name: 'Inactive', value: analytics.inactiveEmployees, color: '#EF4444' },
  ].filter(i => i.value > 0);

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase flex items-center space-x-1.5">
            <ChartNoAxesCombined size={14} />
            <span>Executive Workforce Intelligence</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Workforce Analytics
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            Live workforce census, department allocations, retention indicators, and employment status metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#047857] text-white shadow-xs">
            Database Computed &bull; Real-time
          </span>
        </div>
      </section>

      {/* 2. SUMMARY METRICS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656966]">Total Headcount</span>
            <Users size={18} className="text-[#0B2E2E]" />
          </div>
          <p className="text-3xl font-bold text-[#0B2E2E] font-display mt-2">{analytics.totalEmployees}</p>
          <span className="text-[11px] text-[#047857] font-semibold mt-1 block">Full enterprise footprint</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656966]">Active Personnel</span>
            <UserCheck size={18} className="text-[#047857]" />
          </div>
          <p className="text-3xl font-bold text-[#047857] font-display mt-2">{analytics.activeEmployees}</p>
          <span className="text-[11px] text-[#656966] mt-1 block">
            {Math.round((analytics.activeEmployees / analytics.totalEmployees) * 100)}% utilization
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656966]">On Statutory Leave</span>
            <TrendingUp size={18} className="text-[#D97706]" />
          </div>
          <p className="text-3xl font-bold text-[#D97706] font-display mt-2">{analytics.onLeaveEmployees}</p>
          <span className="text-[11px] text-[#656966] mt-1 block">Approved time-off</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7E3D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656966]">Inactive Records</span>
            <UserX size={18} className="text-[#EF4444]" />
          </div>
          <p className="text-3xl font-bold text-[#EF4444] font-display mt-2">{analytics.inactiveEmployees}</p>
          <span className="text-[11px] text-[#656966] mt-1 block">Offboarded accounts</span>
        </div>
      </section>

      {/* 3. CHARTS: DEPARTMENT ALLOCATION & STATUS PIE */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs">
          <h3 className="text-lg font-bold text-[#0B2E2E] font-display mb-1">
            Headcount by Department
          </h3>
          <p className="text-xs text-[#656966] mb-6">Distribution across business units.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#656966" fontSize={11} tickLine={false} />
                <YAxis stroke="#656966" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E3D8', borderRadius: '12px', fontSize: '12px', color: '#222525' }}
                />
                <Bar dataKey="count" fill="#047857" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-[#0B2E2E] font-display mb-1">
              Employment Status Ratio
            </h3>
            <p className="text-xs text-[#656966] mb-4">Current operational readiness.</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E3D8', borderRadius: '12px', fontSize: '11px', color: '#222525' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t border-[#E7E3D8]">
            {statusPieData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#222525]">{item.name}</span>
                </span>
                <span className="font-bold text-[#047857]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DOMAIN DISTRIBUTION BAR CHART */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 shadow-xs">
        <h3 className="text-lg font-bold text-[#0B2E2E] font-display mb-1">
          Technical Domain Breakdown
        </h3>
        <p className="text-xs text-[#656966] mb-6">Staffing across specialized engineering and design practices.</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={domainData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#656966" fontSize={11} tickLine={false} />
              <YAxis stroke="#656966" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E3D8', borderRadius: '12px', fontSize: '12px', color: '#222525' }}
              />
              <Bar dataKey="count" fill="#0B2E2E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
