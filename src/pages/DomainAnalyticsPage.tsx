import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers3, 
  Users, 
  BriefcaseBusiness, 
  ChevronRight, 
  Eye, 
  Building2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { fetchDomains, getCachedDomains } from '../services/departmentService';
import { fetchEmployeeDirectory, getCachedEmployeeDirectory } from '../services/employeeService';
import { fetchProjects, getCachedProjects } from '../services/projectService';
import { Domain, EmployeeDirectoryItem, ProjectItem } from '../types';

export const DomainAnalyticsPage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>(() => getCachedDomains());
  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>(() => getCachedEmployeeDirectory());
  const [projects, setProjects] = useState<ProjectItem[]>(() => getCachedProjects());
  const [loading, setLoading] = useState(() => getCachedDomains().length === 0);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('DOM-SWE');

  useEffect(() => {
    Promise.all([
      fetchDomains(),
      fetchEmployeeDirectory(),
      fetchProjects(),
    ]).then(([domList, empList, prjList]) => {
      setDomains(domList);
      setEmployees(empList);
      setProjects(prjList);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-3xl border border-[#E7E3D8]" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-[#E7E3D8]" />)}
        </div>
      </div>
    );
  }

  const selectedDomain = domains.find(d => d.id === selectedDomainId) || domains[0];
  const domainEmployees = employees.filter(e => e.domainId === selectedDomain?.id);
  const domainProjects = projects.filter(p => p.domainId === selectedDomain?.id);

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase flex items-center space-x-1.5">
            <Layers3 size={14} />
            <span>Domain Intelligence & Personnel Drill-Down</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Domain Analytics
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            Select any capability domain to inspect headcount, operational initiatives, and active staff assignments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#047857] text-white shadow-xs">
            {domains.length} Strategic Domains
          </span>
        </div>
      </section>

      {/* 2. DOMAINS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {domains.map(dom => {
          const count = employees.filter(e => e.domainId === dom.id).length;
          const isSelected = selectedDomain?.id === dom.id;
          return (
            <div
              key={dom.id}
              onClick={() => setSelectedDomainId(dom.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected 
                  ? 'bg-[#0B2E2E] text-[#F8F6F1] border-[#0B2E2E] shadow-sm' 
                  : 'bg-white text-[#222525] border-[#E7E3D8] hover:border-[#047857] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-[#047857] text-white' : 'bg-[#F8F6F1] text-[#047857] border border-[#E7E3D8]'
                  }`}>
                    {dom.code}
                  </span>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-[#F8F6F1]/80' : 'text-[#656966]'}`}>
                    {count} Members
                  </span>
                </div>
                <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-[#F8F6F1]' : 'text-[#0B2E2E]'}`}>
                  {dom.name}
                </h3>
                <p className={`text-xs line-clamp-2 ${isSelected ? 'text-[#F8F6F1]/80' : 'text-[#656966]'}`}>
                  {dom.description}
                </p>
              </div>

              <div className={`mt-4 pt-3 border-t text-[11px] font-bold flex items-center justify-between ${
                isSelected ? 'border-white/10 text-emerald-300' : 'border-[#E7E3D8] text-[#047857]'
              }`}>
                <span>{isSelected ? 'Active Drill-Down' : 'Click to inspect'}</span>
                <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. DRILL-DOWN PANEL: SELECTED DOMAIN EMPLOYEES & PROJECTS */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E3D8]">
          <div>
            <span className="text-[10px] font-bold text-[#047857] tracking-wider uppercase">
              DRILL-DOWN VIEW &bull; {selectedDomain?.code}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#0B2E2E] font-display">
              {selectedDomain?.name} Specialists
            </h2>
            <p className="text-xs text-[#656966] mt-0.5">
              {domainEmployees.length} personnel allocated &bull; {domainProjects.length} active initiatives
            </p>
          </div>

          <Link
            to={`/employees?search=${selectedDomain?.code}`}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] hover:border-[#047857] text-[#047857] transition-all shadow-xs cursor-pointer"
          >
            Filter Directory by {selectedDomain?.code} &rarr;
          </Link>
        </div>

        {/* DOMAIN PERSONNEL TABLE */}
        <div className="overflow-x-auto bg-white rounded-2xl border border-[#E7E3D8]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8F6F1] text-[#656966] text-[10px] uppercase font-bold border-b border-[#E7E3D8]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">360 View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3D8]">
              {domainEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#656966]">
                    No employees currently assigned to this domain.
                  </td>
                </tr>
              ) : (
                domainEmployees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-[#F8F6F1]/60 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#222525]">
                      {emp.name}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#047857]">
                      {emp.employeeId}
                    </td>
                    <td className="py-2.5 px-4 text-[#656966]">
                      {emp.designation}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#222525]">
                      {emp.departmentName || emp.departmentId}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.status === 'ACTIVE' ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]' :
                        'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        to={`/profile/${emp.employeeId}`}
                        className="p-1 rounded-md text-[#047857] hover:bg-[#047857] hover:text-white inline-block transition-colors"
                      >
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
