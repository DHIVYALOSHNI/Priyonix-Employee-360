import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  House, 
  UserRound, 
  Users, 
  CalendarCheck, 
  CalendarDays, 
  BriefcaseBusiness, 
  Trophy, 
  Megaphone, 
  Bell, 
  ChartNoAxesCombined, 
  Layers3, 
  Activity, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X,
  Search,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserNotifications } from '../services/notificationService';
import { NotificationItem } from '../types';

export const AppLayout: React.FC = () => {
  const { userProfile, role, isAdmin, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Load notifications
  useEffect(() => {
    if (userProfile?.uid) {
      fetchUserNotifications(userProfile.uid).then(setNotifications);
    }
  }, [userProfile?.uid]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/employees?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const employeeNavLinks = [
    { label: 'Home', path: '/home', icon: House },
    { label: 'My Profile', path: '/profile', icon: UserRound },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { label: 'Leave', path: '/leave', icon: CalendarDays },
    { label: 'Projects', path: '/projects', icon: BriefcaseBusiness },
    { label: 'Recognition', path: '/recognition', icon: Trophy },
  ];

  const adminNavLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: House },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { label: 'Leave', path: '/leave', icon: CalendarDays },
    { label: 'Projects', path: '/projects', icon: BriefcaseBusiness },
    { label: 'Recognition', path: '/recognition', icon: Trophy },
  ];

  const adminAnalyticsLinks = [
    { label: 'Workforce Analytics', path: '/analytics/workforce', icon: ChartNoAxesCombined },
    { label: 'Domain Analytics', path: '/analytics/domains', icon: Layers3 },
    { label: 'Project Analytics', path: '/analytics/projects', icon: BriefcaseBusiness },
  ];

  const companyNavLinks = [
    { label: 'Announcements', path: '/announcements', icon: Megaphone },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    ...(isAdmin ? [{ label: 'Activity', path: '/activity', icon: Activity }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F4ED] text-[#30302D]">
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#EFEAE0] border-b border-[#DDD7CA] sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-1.5 rounded-lg text-[#174A4A] hover:bg-[#DDD7CA]/50 transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex flex-col">
            <span className="font-extrabold text-[#174A4A] tracking-wider text-sm font-display">PRIONIX</span>
            <span className="text-[10px] text-[#73716B] uppercase tracking-widest font-semibold">EMPLOYEE 360</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            isAdmin ? 'bg-[#174A4A] text-[#F7F4ED]' : 'bg-[#789B8B]/20 text-[#174A4A]'
          }`}>
            {role}
          </span>
          <button 
            onClick={() => navigate('/notifications')} 
            className="relative p-1.5 text-[#30302D] hover:text-[#174A4A]"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C97867]" />
            )}
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION (Desktop & Drawer Mobile) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-[#EFEAE0] border-r border-[#DDD7CA]
        flex flex-col justify-between transition-transform duration-200 ease-in-out
        ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* BRAND & LOGO */}
        <div className="p-5 border-b border-[#DDD7CA]/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#174A4A] flex items-center justify-center text-[#F7F4ED] shadow-sm font-bold text-lg font-display">
                P
              </div>
              <div>
                <h1 className="font-bold text-[#174A4A] text-base tracking-tight leading-none">PRIONIX</h1>
                <p className="text-[11px] font-semibold text-[#789B8B] tracking-wider uppercase mt-1">EMPLOYEE 360</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden text-[#73716B] hover:text-[#30302D]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Active Role Indicator & Switcher */}
          <div className="mt-4 p-2.5 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-[#174A4A]' : 'bg-[#789B8B]'}`} />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#30302D] uppercase tracking-wide">
                  {role} PORTAL
                </span>
                <span className="text-[10px] text-[#73716B] truncate max-w-[110px]">
                  {userProfile?.name || 'Prionix User'}
                </span>
              </div>
            </div>
            <button
              onClick={() => switchDemoRole(isAdmin ? 'EMPLOYEE' : 'ADMIN')}
              className="text-[10px] font-bold px-2 py-1 bg-[#174A4A]/10 text-[#174A4A] hover:bg-[#174A4A]/20 rounded-md transition-colors"
              title="Switch role for testing"
            >
              Switch to {isAdmin ? 'Emp' : 'Admin'}
            </button>
          </div>
        </div>

        {/* SCROLLABLE LINKS */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* MAIN SECTION */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-[#73716B] uppercase tracking-wider">
              MAIN
            </div>
            <nav className="space-y-1">
              {(isAdmin ? adminNavLinks : employeeNavLinks).map(link => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                      ${isActive 
                        ? 'bg-[#174A4A] text-[#F7F4ED] font-semibold shadow-xs' 
                        : 'text-[#30302D] hover:bg-[#DDD7CA]/60 hover:text-[#174A4A]'
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* ADMIN ANALYTICS SECTION */}
          {isAdmin && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-[#73716B] uppercase tracking-wider">
                ANALYTICS
              </div>
              <nav className="space-y-1">
                {adminAnalyticsLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) => `
                        flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                        ${isActive 
                          ? 'bg-[#174A4A] text-[#F7F4ED] font-semibold shadow-xs' 
                          : 'text-[#30302D] hover:bg-[#DDD7CA]/60 hover:text-[#174A4A]'
                        }
                      `}
                    >
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {/* COMPANY SECTION */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-[#73716B] uppercase tracking-wider">
              COMPANY
            </div>
            <nav className="space-y-1">
              {companyNavLinks.map(link => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => `
                      flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                      ${isActive 
                        ? 'bg-[#174A4A] text-[#F7F4ED] font-semibold shadow-xs' 
                        : 'text-[#30302D] hover:bg-[#DDD7CA]/60 hover:text-[#174A4A]'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#C97867] text-[#F7F4ED]">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* SECURITY & VERIFICATION LINK */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-[#73716B] uppercase tracking-wider">
              SECURITY AUDIT
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/security-audit"
                className={({ isActive }) => `
                  flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-[#174A4A] text-[#F7F4ED] font-semibold shadow-xs' 
                    : 'text-[#30302D] hover:bg-[#DDD7CA]/60 hover:text-[#174A4A]'
                  }
                `}
              >
                <ShieldCheck size={18} className="text-[#4F8068]" />
                <span className="flex-1">Security Tests</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#4F8068]/15 text-[#4F8068]">
                  9/9 Tests
                </span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* BOTTOM USER & LOGOUT */}
        <div className="p-3 border-t border-[#DDD7CA]/70 bg-[#E8E2D7]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#174A4A] text-[#F7F4ED] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" />
                ) : (
                  userProfile?.name?.charAt(0) || 'P'
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-[#30302D] truncate">{userProfile?.name}</span>
                <span className="text-[10px] text-[#73716B] truncate">{userProfile?.employeeId}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <NavLink 
                to="/settings"
                className="p-1 text-[#73716B] hover:text-[#174A4A] transition-colors rounded-md" 
                title="Settings"
              >
                <Settings size={16} />
              </NavLink>
              <button 
                onClick={handleLogout}
                className="p-1 text-[#C97867] hover:text-[#B85C50] transition-colors rounded-md" 
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BACKDROP */}
      {mobileNavOpen && (
        <div 
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-[#30302D]/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* DESKTOP TOP HEADER */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#F7F4ED] border-b border-[#DDD7CA]/70 sticky top-0 z-20">
          {/* SEARCH BAR */}
          <form onSubmit={handleSearchSubmit} className="relative w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716B]" />
            <input 
              type="text"
              placeholder="Search employees by name, ID, or designation..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] placeholder-[#73716B] focus:outline-hidden focus:border-[#174A4A] focus:ring-1 focus:ring-[#174A4A] transition-all"
            />
          </form>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center space-x-4">
            {/* Quick Role Tester Pill */}
            <div className="flex items-center space-x-2 bg-[#EFEAE0] px-3 py-1.5 rounded-xl border border-[#DDD7CA]">
              <span className="text-xs text-[#73716B]">Role:</span>
              <span className="text-xs font-bold text-[#174A4A]">{role}</span>
              <button
                onClick={() => switchDemoRole(isAdmin ? 'EMPLOYEE' : 'ADMIN')}
                className="text-[11px] font-bold text-[#789B8B] hover:text-[#174A4A] underline ml-1"
              >
                Toggle {isAdmin ? 'Employee' : 'Admin'}
              </button>
            </div>

            {/* Notifications button */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="p-2 rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] text-[#30302D] hover:bg-[#DDD7CA]/50 relative transition-colors"
                aria-label="View notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#C97867] text-[#F7F4ED]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Quick Notifications Flyout */}
              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-[#F7F4ED] border border-[#DDD7CA] rounded-2xl shadow-lg p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DDD7CA]">
                    <span className="text-xs font-bold text-[#174A4A]">Notifications ({unreadCount} unread)</span>
                    <button 
                      onClick={() => {
                        setShowNotificationsMenu(false);
                        navigate('/notifications');
                      }}
                      className="text-[11px] text-[#789B8B] font-semibold hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                    {notifications.slice(0, 3).map(n => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          setShowNotificationsMenu(false);
                          if (n.link) navigate(n.link);
                        }}
                        className="p-2 rounded-xl bg-[#EFEAE0]/60 hover:bg-[#EFEAE0] cursor-pointer text-xs"
                      >
                        <p className="font-bold text-[#30302D] truncate">{n.title}</p>
                        <p className="text-[11px] text-[#73716B] line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile badge */}
            <div className="flex items-center space-x-3 pl-3 border-l border-[#DDD7CA]">
              <div className="w-9 h-9 rounded-full bg-[#174A4A] text-[#F7F4ED] flex items-center justify-center font-bold text-xs overflow-hidden">
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" />
                ) : (
                  userProfile?.name?.charAt(0) || 'P'
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#30302D] leading-tight">{userProfile?.name}</span>
                <span className="text-[10px] text-[#789B8B] font-medium">{userProfile?.designation}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
