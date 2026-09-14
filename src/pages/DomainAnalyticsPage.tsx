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
import { fetchDomains } from '../services/departmentService';
import { fetchEmployeeDirectory } from '../services/employeeService';
import { fetchProjects } from '../services/projectService';
import { Domain, EmployeeDirectoryItem, ProjectItem } from '../types';

export const DomainAnalyticsPage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
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
        <div className="h-20 bg-[#EFEAE0] rounded-3xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#EFEAE0] rounded-2xl" />)}
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
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <Layers3 size={14} />
            <span>Domain Intelligence & Personnel Drill-Down</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Domain Analytics
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Select any capability domain to inspect headcount, operational initiatives, and active staff assignments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#174A4A] text-[#F7F4ED]">
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
                  ? 'bg-[#174A4A] text-[#F7F4ED] border-[#174A4A] shadow-sm' 
                  : 'bg-[#EFEAE0] text-[#30302D] border-[#DDD7CA] hover:border-[#789B8B]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-[#789B8B] text-[#174A4A]' : 'bg-[#F7F4ED] text-[#174A4A]'
                  }`}>
                    {dom.code}
                  </span>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-[#EFEAE0]/80' : 'text-[#73716B]'}`}>
                    {count} Members
                  </span>
                </div>
                <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-[#F7F4ED]' : 'text-[#174A4A]'}`}>
                  {dom.name}
                </h3>
                <p className={`text-xs line-clamp-2 ${isSelected ? 'text-[#EFEAE0]/80' : 'text-[#73716B]'}`}>
                  {dom.description}
                </p>
              </div>

              <div className={`mt-4 pt-3 border-t text-[11px] font-bold flex items-center justify-between ${
                isSelected ? 'border-[#789B8B]/40 text-[#789B8B]' : 'border-[#DDD7CA] text-[#174A4A]'
              }`}>
                <span>{isSelected ? 'Active Drill-Down' : 'Click to inspect'}</span>
                <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. DRILL-DOWN PANEL: SELECTED DOMAIN EMPLOYEES & PROJECTS */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DDD7CA]">
          <div>
            <span className="text-[10px] font-bold text-[#789B8B] tracking-wider uppercase">
              DRILL-DOWN VIEW &bull; {selectedDomain?.code}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#174A4A] font-display">
              {selectedDomain?.name} Specialists
            </h2>
            <p className="text-xs text-[#73716B] mt-0.5">
              {domainEmployees.length} personnel allocated &bull; {domainProjects.length} active initiatives
            </p>
          </div>

          <Link
            to={`/employees?search=${selectedDomain?.code}`}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] hover:border-[#174A4A] text-[#174A4A] transition-all"
          >
            Filter Directory by {selectedDomain?.code} &rarr;
          </Link>
        </div>

        {/* DOMAIN PERSONNEL TABLE */}
        <div className="overflow-x-auto bg-[#F7F4ED] rounded-2xl border border-[#DDD7CA]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#E5E0D5] text-[#73716B] text-[10px] uppercase font-bold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">360 View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD7CA]">
              {domainEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#73716B]">
                    No employees currently assigned to this domain.
                  </td>
                </tr>
              ) : (
                domainEmployees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-[#EFEAE0]/50 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#30302D]">
                      {emp.name}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#174A4A]">
                      {emp.employeeId}
                    </td>
                    <td className="py-2.5 px-4 text-[#73716B]">
                      {emp.designation}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#30302D]">
                      {emp.departmentName || emp.departmentId}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.status === 'ACTIVE' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                        'bg-[#B58A3A]/15 text-[#B58A3A]'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        to={`/profile/${emp.employeeId}`}
                        className="p-1 rounded-md text-[#174A4A] hover:bg-[#174A4A] hover:text-[#F7F4ED] inline-block transition-colors"
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
