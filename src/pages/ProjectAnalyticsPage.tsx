import React, { useState, useEffect } from 'react';
import { 
  BriefcaseBusiness, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Layers3, 
  AlertCircle 
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
import { fetchProjects } from '../services/projectService';
import { ProjectItem } from '../types';

export const ProjectAnalyticsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="h-64 bg-[#EFEAE0] rounded-3xl animate-pulse" />;
  }

  const active = projects.filter(p => p.status === 'ACTIVE').length;
  const completed = projects.filter(p => p.status === 'COMPLETED').length;
  const pending = projects.filter(p => p.status === 'PENDING').length;
  const onHold = projects.filter(p => p.status === 'ON_HOLD').length;

  const avgCompletion = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.completionPercentage, 0) / projects.length)
    : 0;

  const statusPie = [
    { name: 'Active', value: active, color: '#174A4A' },
    { name: 'Completed', value: completed, color: '#4F8068' },
    { name: 'Pending', value: pending, color: '#C5A45D' },
    { name: 'On Hold', value: onHold, color: '#C97867' },
  ].filter(i => i.value > 0);

  const teamProgressData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    completion: p.completionPercentage,
  }));

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <BriefcaseBusiness size={14} />
            <span>Delivery & Portfolio Velocity</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Project Analytics
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Portfolio completion rates, deliverable health indexes, and cross-team milestone status.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#174A4A] text-[#F7F4ED]">
            Average Velocity: {avgCompletion}%
          </span>
        </div>
      </section>

      {/* 2. SUMMARY METRICS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA]">
          <span className="text-xs font-semibold text-[#73716B]">Total Initiatives</span>
          <p className="text-3xl font-bold text-[#174A4A] font-display mt-2">{projects.length}</p>
          <span className="text-[11px] text-[#73716B]">Across 8 enterprise domains</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA]">
          <span className="text-xs font-semibold text-[#73716B]">Active Sprints</span>
          <p className="text-3xl font-bold text-[#174A4A] font-display mt-2">{active}</p>
          <span className="text-[11px] text-[#4F8068] font-semibold">Under active development</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA]">
          <span className="text-xs font-semibold text-[#73716B]">Delivered & Deployed</span>
          <p className="text-3xl font-bold text-[#4F8068] font-display mt-2">{completed}</p>
          <span className="text-[11px] text-[#4F8068] font-semibold">100% production verified</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA]">
          <span className="text-xs font-semibold text-[#73716B]">Average Progress</span>
          <p className="text-3xl font-bold text-[#C5A45D] font-display mt-2">{avgCompletion}%</p>
          <span className="text-[11px] text-[#73716B]">Overall completion score</span>
        </div>
      </section>

      {/* 3. CHARTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8">
          <h3 className="text-lg font-bold text-[#174A4A] font-display mb-1">
            Initiative Completion Rates
          </h3>
          <p className="text-xs text-[#73716B] mb-6">Percentage progress across all active projects.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#73716B" fontSize={10} tickLine={false} />
                <YAxis stroke="#73716B" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#F7F4ED', borderColor: '#DDD7CA', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="completion" fill="#174A4A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#174A4A] font-display mb-1">
              Project Status Ratios
            </h3>
            <p className="text-xs text-[#73716B] mb-4">Lifecycle distribution.</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPie.map((entry, index) => (
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
            {statusPie.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#30302D]">{item.name}</span>
                </span>
                <span className="font-bold text-[#174A4A]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
