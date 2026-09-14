import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  UserPlus, 
  Eye, 
  Pencil, 
  UserX, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Layers3,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchEmployeeDirectory, saveEmployee, updateEmployeeStatus } from '../services/employeeService';
import { fetchDepartments, fetchDomains } from '../services/departmentService';
import { EmployeeDirectoryItem, Department, Domain } from '../types';

export const Directory: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'employeeId' | 'department' | 'domain'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Admin Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDirectoryItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Employee Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formDeptId, setFormDeptId] = useState('DEP-ENG');
  const [formDomainId, setFormDomainId] = useState('DOM-SWE');
  const [formManager, setFormManager] = useState('');
  const [formLocation, setFormLocation] = useState('Bangalore Campus, BLR-01');
  const [formPhone, setFormPhone] = useState('+91 98450 ');

  const loadData = async () => {
    setLoading(true);
    try {
      const [empList, deptList, domList] = await Promise.all([
        fetchEmployeeDirectory(),
        fetchDepartments(),
        fetchDomains(),
      ]);
      setEmployees(empList);
      setDepartments(deptList);
      setDomains(domList);
    } catch (err) {
      console.error('Error fetching directory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync search query from URL parameter if provided
  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearchTerm(urlQuery);
    }
  }, [searchParams]);

  // Client-side filtering and sorting
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm.trim() || 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || emp.departmentId === departmentFilter;
    const matchesDomain = domainFilter === 'ALL' || emp.domainId === domainFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesDomain && matchesStatus;
  }).sort((a, b) => {
    let aVal = '';
    let bVal = '';
    if (sortBy === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else if (sortBy === 'department') {
      aVal = (a.departmentName || a.departmentId).toLowerCase();
      bVal = (b.departmentName || b.departmentId).toLowerCase();
    } else if (sortBy === 'domain') {
      aVal = (a.domainName || a.domainId).toLowerCase();
      bVal = (b.domainName || b.domainId).toLowerCase();
    } else {
      aVal = a.employeeId.toLowerCase();
      bVal = b.employeeId.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDeactivate = async (employeeId: string, currentStatus: string) => {
    if (!userProfile) return;
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirm = window.confirm(`Are you sure you want to change status of ${employeeId} to ${nextStatus}?`);
    if (!confirm) return;

    await updateEmployeeStatus(employeeId, nextStatus, userProfile.uid, userProfile.name);
    await loadData();
  };

  const handleSaveEmployeeForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setFormError(null);

    if (!formName.trim() || !formEmployeeId.trim() || !formEmail.trim() || !formDesignation.trim()) {
      setFormError('Please fill all mandatory fields (Name, ID, Email, Designation).');
      return;
    }

    setFormSubmitting(true);
    try {
      const selectedDept = departments.find(d => d.id === formDeptId);
      const selectedDomain = domains.find(d => d.id === formDomainId);

      const empPayload: EmployeeDirectoryItem = {
        employeeId: formEmployeeId.trim().toUpperCase(),
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        departmentId: formDeptId,
        departmentName: selectedDept?.name || formDeptId,
        domainId: formDomainId,
        domainName: selectedDomain?.name || formDomainId,
        designation: formDesignation.trim(),
        status: editingEmployee ? editingEmployee.status : 'ACTIVE',
        joiningDate: editingEmployee?.joiningDate || new Date().toISOString().split('T')[0],
        manager: formManager.trim() || 'Executive Office',
        location: formLocation.trim() || 'Bangalore Campus, BLR-01',
        phone: formPhone.trim() || '+91 98450 00000',
      };

      await saveEmployee(empPayload, userProfile.uid, userProfile.name);
      await loadData();
      setShowAddModal(false);
      setEditingEmployee(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save employee record.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (emp: EmployeeDirectoryItem) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormEmployeeId(emp.employeeId);
    setFormDesignation(emp.designation);
    setFormDeptId(emp.departmentId);
    setFormDomainId(emp.domainId);
    setFormManager(emp.manager);
    setFormLocation(emp.location);
    setFormPhone(emp.phone);
    setShowAddModal(true);
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormEmail('');
    setFormEmployeeId(`PRX-${(employees.length + 1).toString().padStart(3, '0')}`);
    setFormDesignation('');
    setFormDeptId('DEP-ENG');
    setFormDomainId('DOM-SWE');
    setFormManager('Siddharth Rao');
    setFormLocation('Bangalore Campus, BLR-01');
    setFormPhone('+91 98450 ');
    setShowAddModal(true);
  };

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <ShieldCheck size={14} />
            <span>Public Company Directory &bull; Safe Fields Only</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Directory records are strictly isolated. Sensitive personal records (salary, medical, attendance, and leave) are protected and omitted from public listings.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#174A4A] hover:bg-[#123B3B] text-[#F7F4ED] transition-colors flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
        )}
      </section>

      {/* 2. SEARCH & FILTERS BAR */}
      <section className="p-5 rounded-2xl bg-[#EFEAE0] border border-[#DDD7CA] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* SEARCH INPUT */}
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716B]" />
            <input
              type="text"
              placeholder="Search by name, employee ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F4ED] border border-[#DDD7CA] rounded-xl text-[#30302D] placeholder-[#73716B] focus:outline-hidden focus:border-[#174A4A]"
            />
          </div>

          {/* DEPARTMENT FILTER */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F7F4ED] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* DOMAIN FILTER */}
          <div>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F7F4ED] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
            >
              <option value="ALL">All Domains</option>
              {domains.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* STATUS FILTER */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F7F4ED] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* SORTING CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#DDD7CA]/70 text-xs">
          <div className="flex items-center space-x-2 text-[#73716B]">
            <ArrowUpDown size={14} />
            <span className="font-semibold">Sort by:</span>
            {(['name', 'employeeId', 'department', 'domain'] as const).map(field => (
              <button
                key={field}
                onClick={() => {
                  if (sortBy === field) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(field);
                    setSortOrder('asc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  sortBy === field 
                    ? 'bg-[#174A4A] text-[#F7F4ED]' 
                    : 'bg-[#F7F4ED] text-[#30302D] hover:bg-[#DDD7CA]'
                }`}
              >
                {field === 'employeeId' ? 'ID' : field} {sortBy === field ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#73716B]">
            Showing <strong className="text-[#174A4A]">{filteredEmployees.length}</strong> of {employees.length} employees
          </div>
        </div>
      </section>

      {/* 3. EMPLOYEES TABLE */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#E5E0D5] border-b border-[#DDD7CA] text-[#73716B] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Domain</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD7CA]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#DDD7CA]" />
                        <div className="space-y-1.5">
                          <div className="w-24 h-3 bg-[#DDD7CA] rounded" />
                          <div className="w-32 h-2.5 bg-[#DDD7CA]/70 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="w-16 h-3 bg-[#DDD7CA] rounded" /></td>
                    <td className="py-3 px-4"><div className="w-20 h-3 bg-[#DDD7CA] rounded" /></td>
                    <td className="py-3 px-4"><div className="w-20 h-3 bg-[#DDD7CA] rounded" /></td>
                    <td className="py-3 px-4"><div className="w-24 h-3 bg-[#DDD7CA] rounded" /></td>
                    <td className="py-3 px-4"><div className="w-14 h-4 bg-[#DDD7CA] rounded-full" /></td>
                    <td className="py-3 px-5 text-right"><div className="w-12 h-6 bg-[#DDD7CA] rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#73716B]">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-[#F7F4ED]/80 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#174A4A] text-[#F7F4ED] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            emp.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#30302D]">{emp.name}</div>
                          <div className="text-[10px] text-[#73716B]">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#174A4A]">
                      {emp.employeeId}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#30302D]">
                      {emp.departmentName || emp.departmentId}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#30302D]">
                      {emp.domainName || emp.domainId}
                    </td>
                    <td className="py-3 px-4 text-[#73716B]">
                      {emp.designation}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.status === 'ACTIVE' ? 'bg-[#4F8068]/15 text-[#4F8068]' :
                        emp.status === 'ON_LEAVE' ? 'bg-[#B58A3A]/15 text-[#B58A3A]' :
                        'bg-[#B85C50]/15 text-[#B85C50]'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/profile/${emp.employeeId}`}
                          className="p-1.5 rounded-lg bg-[#F7F4ED] border border-[#DDD7CA] text-[#174A4A] hover:bg-[#174A4A] hover:text-[#F7F4ED] transition-colors"
                          title="View Employee 360 Profile"
                        >
                          <Eye size={15} />
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-1.5 rounded-lg bg-[#F7F4ED] border border-[#DDD7CA] text-[#789B8B] hover:bg-[#789B8B] hover:text-[#F7F4ED] transition-colors cursor-pointer"
                              title="Edit Employee"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeactivate(emp.employeeId, emp.status)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                emp.status === 'ACTIVE'
                                  ? 'bg-[#FAF0EE] border-[#C97867]/40 text-[#B85C50] hover:bg-[#B85C50] hover:text-[#F7F4ED]'
                                  : 'bg-[#EBF2EE] border-[#789B8B]/40 text-[#4F8068] hover:bg-[#4F8068] hover:text-[#F7F4ED]'
                              }`}
                              title={emp.status === 'ACTIVE' ? 'Deactivate Employee' : 'Activate Employee'}
                            >
                              <UserX size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. ADMIN ADD / EDIT EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#30302D]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-[#F7F4ED] border border-[#DDD7CA] rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[#DDD7CA] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#789B8B] tracking-wider uppercase">
                  ADMINISTRATIVE OPERATION
                </span>
                <h3 className="text-xl font-bold text-[#174A4A] font-display">
                  {editingEmployee ? `Edit Employee: ${editingEmployee.name}` : 'Add New Employee to Prionix'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#73716B] hover:text-[#30302D] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="m-6 p-3 rounded-xl bg-[#FAF0EE] border border-[#C97867]/40 text-[#B85C50] text-xs flex items-center space-x-2">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployeeForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Siddharth Rao"
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    placeholder="e.g. PRX-033"
                    disabled={!!editingEmployee}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A] disabled:opacity-60 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@prionix-corp.demo"
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Lead Systems Engineer"
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">
                    Department
                  </label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">
                    Domain
                  </label>
                  <select
                    value={formDomainId}
                    onChange={(e) => setFormDomainId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                  >
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    placeholder="e.g. Dr. Radhika Sen"
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">
                    Office Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Bangalore Campus, BLR-01"
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDD7CA] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] text-[#30302D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#174A4A] text-[#F7F4ED] hover:bg-[#123B3B] disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
