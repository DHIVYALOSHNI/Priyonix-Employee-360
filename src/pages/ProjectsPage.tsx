import React, { useState, useEffect, useMemo } from 'react';
import { 
  BriefcaseBusiness, 
  Plus, 
  Search, 
  Pencil, 
  Calendar, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Layers3, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchProjects, saveProject, updateProjectStatus, getCachedProjects } from '../services/projectService';
import { fetchDomains, getCachedDomains } from '../services/departmentService';
import { ProjectItem, Domain } from '../types';

export const ProjectsPage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>(() => getCachedProjects());
  const [domains, setDomains] = useState<Domain[]>(() => getCachedDomains());
  const [loading, setLoading] = useState(() => getCachedProjects().length === 0);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTeam, setFormTeam] = useState('');
  const [formDomainId, setFormDomainId] = useState('DOM-SWE');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerEmpId, setFormOwnerEmpId] = useState('');
  const [formStatus, setFormStatus] = useState<ProjectItem['status']>('ACTIVE');
  const [formStartDate, setFormStartDate] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formCompletion, setFormCompletion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProjectsData = async (silent = false) => {
    if (!silent && projects.length === 0) {
      setLoading(true);
    }
    try {
      const [prjList, domList] = await Promise.all([
        fetchProjects(),
        fetchDomains(),
      ]);
      setProjects(prjList);
      setDomains(domList);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectsData(projects.length > 0);
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormDescription('');
    setFormTeam('Engineering Core');
    setFormDomainId('DOM-SWE');
    setFormOwnerName(userProfile?.name || 'Siddharth Rao');
    setFormOwnerEmpId(userProfile?.employeeId || 'PRX-001');
    setFormStatus('ACTIVE');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormDeadline('2026-12-31');
    setFormCompletion(10);
    setShowModal(true);
  };

  const openEditModal = (proj: ProjectItem) => {
    setEditingProject(proj);
    setFormName(proj.name);
    setFormDescription(proj.description);
    setFormTeam(proj.team);
    setFormDomainId(proj.domainId);
    setFormOwnerName(proj.ownerName);
    setFormOwnerEmpId(proj.ownerEmployeeId);
    setFormStatus(proj.status);
    setFormStartDate(proj.startDate);
    setFormDeadline(proj.deadline);
    setFormCompletion(proj.completionPercentage);
    setShowModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setFormError(null);

    if (!formName.trim() || !formTeam.trim() || !formDeadline) {
      setFormError('Please provide project name, team, and deadline.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedDomain = domains.find(d => d.id === formDomainId);
      const payload: ProjectItem = {
        id: editingProject ? editingProject.id : `PRJ-${Date.now().toString().slice(-4)}`,
        name: formName.trim(),
        description: formDescription.trim(),
        team: formTeam.trim(),
        domainId: formDomainId,
        domainName: selectedDomain?.name || formDomainId,
        ownerName: formOwnerName.trim(),
        ownerEmployeeId: formOwnerEmpId.trim(),
        status: formStatus,
        priority: editingProject?.priority || 'HIGH',
        startDate: formStartDate,
        deadline: formDeadline,
        completionPercentage: Number(formCompletion),
      };

      await saveProject(payload, userProfile.uid, userProfile.name);
      await loadProjectsData();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = !searchTerm.trim() || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesDomain = domainFilter === 'ALL' || p.domainId === domainFilter;
      return matchesSearch && matchesStatus && matchesDomain;
    });
  }, [projects, searchTerm, statusFilter, domainFilter]);

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase flex items-center space-x-1.5">
            <BriefcaseBusiness size={14} />
            <span>Company Deliverables & Engineering Portfolios</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Company Projects
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            Track active initiatives, teams, deadlines, and delivery milestones across all enterprise domains.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#047857] hover:bg-[#065F46] text-white transition-colors flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Project</span>
          </button>
        )}
      </section>

      {/* 2. SEARCH & FILTERS */}
      <section className="p-4 rounded-3xl bg-white border border-[#E7E3D8] flex flex-wrap items-center gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656966]" />
          <input
            type="text"
            placeholder="Search projects, teams, owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>

        <div>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
          >
            <option value="ALL">All Domains</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* 3. PROJECTS GRID */}
      {loading ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-[#E7E3D8] space-y-4 animate-pulse shadow-xs">
              <div className="flex justify-between items-center">
                <div className="h-5 w-16 bg-[#E7E3D8] rounded-full" />
                <div className="h-4 w-28 bg-[#E7E3D8] rounded" />
              </div>
              <div className="h-6 w-3/4 bg-[#E7E3D8] rounded" />
              <div className="h-4 w-full bg-[#E7E3D8] rounded" />
              <div className="h-4 w-2/3 bg-[#E7E3D8] rounded" />
              <div className="pt-4 border-t border-[#E7E3D8] space-y-2">
                <div className="h-3 w-1/2 bg-[#E7E3D8] rounded" />
                <div className="h-3 w-2/3 bg-[#E7E3D8] rounded" />
              </div>
            </div>
          ))}
        </section>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E7E3D8] rounded-3xl space-y-3 shadow-xs">
          <BriefcaseBusiness size={32} className="mx-auto text-[#047857]" />
          <h3 className="text-base font-bold text-[#0B2E2E] font-display">No matching projects found</h3>
          <p className="text-xs text-[#656966] max-w-sm mx-auto">
            No projects matched your active search query or domain filters.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setDomainFilter('ALL'); }}
            className="px-4 py-2 text-xs font-bold bg-[#047857] text-white rounded-xl hover:bg-[#065F46] transition-colors cursor-pointer shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(proj => (
            <div 
              key={proj.id} 
              className="p-6 rounded-3xl bg-white border border-[#E7E3D8] hover:border-[#047857] transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    proj.status === 'ACTIVE' ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]' :
                    proj.status === 'COMPLETED' ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' :
                    proj.status === 'PENDING' ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' :
                    'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                  }`}>
                    {proj.status}
                  </span>
                  <span className="text-[10px] font-semibold text-[#656966] flex items-center space-x-1">
                    <Clock size={12} />
                    <span>Deadline: {proj.deadline}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0B2E2E] font-display mb-1.5">
                  {proj.name}
                </h3>
                <p className="text-xs text-[#656966] line-clamp-3 leading-relaxed">
                  {proj.description}
                </p>

                <div className="mt-4 pt-3 border-t border-[#E7E3D8] space-y-1.5 text-xs text-[#222525]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#656966]">Team:</span>
                    <span className="font-semibold">{proj.team}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#656966]">Domain:</span>
                    <span className="font-semibold text-[#0B2E2E]">{proj.domainName || proj.domainId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#656966]">Project Lead:</span>
                    <span className="font-semibold">{proj.ownerName}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E7E3D8]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[11px] font-bold text-[#656966]">Progress</span>
                  <span className="font-bold text-[#047857]">{proj.completionPercentage}%</span>
                </div>
                <div className="w-full bg-[#E7E3D8] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#047857] h-full rounded-full transition-all duration-300"
                    style={{ width: `${proj.completionPercentage}%` }}
                  />
                </div>

                {isAdmin && (
                  <div className="mt-4 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="px-3 py-1 text-xs font-bold rounded-lg bg-[#F8F6F1] border border-[#E7E3D8] hover:border-[#047857] hover:text-[#047857] text-[#222525] flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Pencil size={12} />
                      <span>Edit Project</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 4. CREATE / EDIT PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0B2E2E]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-white border border-[#E7E3D8] rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E7E3D8] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#047857] tracking-wider uppercase">
                  PROJECT ADMINISTRATION
                </span>
                <h3 className="text-xl font-bold text-[#0B2E2E] font-display">
                  {editingProject ? 'Edit Project Specifications' : 'Initialize New Project'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-[#656966] hover:text-[#222525] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="m-6 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center space-x-2">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#222525] mb-1">Project Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Project Orion: AI Safety Mesh"
                  className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222525] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Strategic scope and architectural goals..."
                  className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Assigned Team *</label>
                  <input
                    type="text"
                    value={formTeam}
                    onChange={(e) => setFormTeam(e.target.value)}
                    placeholder="e.g. AI Platforms Group"
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Domain</label>
                  <select
                    value={formDomainId}
                    onChange={(e) => setFormDomainId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  >
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Deadline *</label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1 text-[#222525]">
                  <span>Completion Percentage</span>
                  <span className="text-[#047857]">{formCompletion}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formCompletion}
                  onChange={(e) => setFormCompletion(Number(e.target.value))}
                  className="w-full accent-[#047857]"
                />
              </div>

              <div className="pt-4 border-t border-[#E7E3D8] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] text-[#222525] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#047857] text-white hover:bg-[#065F46] disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                >
                  {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
