import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
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
import { fetchUserNotifications, getCachedUserNotifications } from '../services/notificationService';
import { NotificationItem } from '../types';
import { BRAND_ASSETS } from '../assets/branding';

// Self-contained memoized search input to prevent re-rendering the entire layout & page on keystrokes
const HeaderSearchBar = React.memo<{ onSearch: (term: string) => void }>(({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-96">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716B]" />
      <input 
        type="text"
        placeholder="Search employees by name, ID, or designation..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8F6F1] border border-[#DDD7CA] rounded-xl text-[#222525] placeholder-[#73716B] focus:outline-hidden focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all"
      />
    </form>
  );
});

// Sleek fallback skeleton for lazy-loaded route pages
const PageSuspenseSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse py-2">
    <div className="h-7 bg-[#E7E3D8]/70 rounded-xl w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="h-28 bg-[#E7E3D8]/50 rounded-2xl" />
      <div className="h-28 bg-[#E7E3D8]/50 rounded-2xl" />
      <div className="h-28 bg-[#E7E3D8]/50 rounded-2xl" />
      <div className="h-28 bg-[#E7E3D8]/50 rounded-2xl" />
    </div>
    <div className="h-64 bg-[#E7E3D8]/40 rounded-3xl" />
  </div>
);

export const AppLayout: React.FC = () => {
  const { userProfile, role, isAdmin, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return userProfile?.uid ? getCachedUserNotifications(userProfile.uid) : [];
  });
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

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

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleSearch = useCallback((query: string) => {
    navigate(`/employees?search=${encodeURIComponent(query)}`);
  }, [navigate]);

  const employeeNavLinks = useMemo(() => [
    { label: 'Home', path: '/home', icon: House },
    { label: 'My Profile', path: '/profile', icon: UserRound },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { label: 'Leave', path: '/leave', icon: CalendarDays },
    { label: 'Projects', path: '/projects', icon: BriefcaseBusiness },
    { label: 'Recognition', path: '/recognition', icon: Trophy },
  ], []);

  const adminNavLinks = useMemo(() => [
    { label: 'Dashboard', path: '/dashboard', icon: House },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { label: 'Leave', path: '/leave', icon: CalendarDays },
    { label: 'Projects', path: '/projects', icon: BriefcaseBusiness },
    { label: 'Recognition', path: '/recognition', icon: Trophy },
  ], []);

  const adminAnalyticsLinks = useMemo(() => [
    { label: 'Workforce Analytics', path: '/analytics/workforce', icon: ChartNoAxesCombined },
    { label: 'Domain Analytics', path: '/analytics/domains', icon: Layers3 },
    { label: 'Project Analytics', path: '/analytics/projects', icon: BriefcaseBusiness },
  ], []);

  const companyNavLinks = useMemo(() => [
    { label: 'Announcements', path: '/announcements', icon: Megaphone },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    ...(isAdmin ? [{ label: 'Activity', path: '/activity', icon: Activity }] : []),
  ], [unreadCount, isAdmin]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F6F1] text-[#222525]">
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B2E2E] border-b border-[#133E3E] text-white sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-1.5 rounded-lg text-[#A7F3D0] hover:bg-[#133E3E] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center space-x-2">
            <img 
              src={BRAND_ASSETS.logo} 
              alt="PRIYONIX" 
              className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shadow-xs" 
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-white tracking-wider text-sm font-display">PRIYONIX</span>
              <span className="text-[9px] text-[#34D399] uppercase tracking-widest font-semibold">EMPLOYEE 360</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
            isAdmin ? 'bg-[#047857] text-white' : 'bg-[#133E3E] text-[#A7F3D0] border border-[#047857]/40'
          }`}>
            {role}
          </span>
          <button 
            onClick={() => navigate('/notifications')} 
            className="relative p-1.5 text-[#D1E0DE] hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E11D48]" />
            )}
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION (Desktop & Drawer Mobile) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-[#0B2E2E] border-r border-[#133E3E]
        flex flex-col justify-between transition-transform duration-200 ease-in-out text-[#E0EBE9]
        ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* BRAND & LOGO */}
        <div className="p-5 border-b border-[#133E3E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={BRAND_ASSETS.logo} 
                alt="PRIYONIX Logo" 
                className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-sm shrink-0 border border-white/20" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="font-bold text-white text-base tracking-tight leading-none font-display">PRIYONIX</h1>
                <p className="text-[10px] font-bold text-[#34D399] tracking-widest uppercase mt-1">EMPLOYEE 360</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden text-[#94A3B8] hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Active Role Indicator & Switcher */}
          <div className="mt-4 p-2.5 rounded-xl bg-[#082424] border border-[#144848] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-[#34D399]' : 'bg-[#10B981]'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#E0EBE9] uppercase tracking-wide">
                  {role} PORTAL
                </span>
                <span className="text-[10px] text-[#8EAFA9] truncate max-w-[100px]">
                  {userProfile?.name || 'Priyonix User'}
                </span>
              </div>
            </div>
            <button
              onClick={() => switchDemoRole(isAdmin ? 'EMPLOYEE' : 'ADMIN')}
              className="text-[10px] font-bold px-2 py-1 bg-[#047857]/30 text-[#6EE7B7] hover:bg-[#047857]/50 rounded-md transition-colors border border-[#047857]/50 cursor-pointer"
              title="Switch role for testing"
            >
              {isAdmin ? 'To Employee' : 'To Admin'}
            </button>
          </div>
        </div>

        {/* SCROLLABLE LINKS */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* MAIN SECTION */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold text-[#6B9E98] uppercase tracking-wider">
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
                        ? 'bg-[#047857] text-white font-semibold shadow-xs' 
                        : 'text-[#C4D9D6] hover:bg-[#133E3E] hover:text-white'
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
              <div className="px-3 mb-1.5 text-[10px] font-bold text-[#6B9E98] uppercase tracking-wider">
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
                          ? 'bg-[#047857] text-white font-semibold shadow-xs' 
                          : 'text-[#C4D9D6] hover:bg-[#133E3E] hover:text-white'
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
            <div className="px-3 mb-1.5 text-[10px] font-bold text-[#6B9E98] uppercase tracking-wider">
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
                        ? 'bg-[#047857] text-white font-semibold shadow-xs' 
                        : 'text-[#C4D9D6] hover:bg-[#133E3E] hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#E11D48] text-white">
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
            <div className="px-3 mb-1.5 text-[10px] font-bold text-[#6B9E98] uppercase tracking-wider">
              SECURITY AUDIT
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/security-audit"
                className={({ isActive }) => `
                  flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-[#047857] text-white font-semibold shadow-xs' 
                    : 'text-[#C4D9D6] hover:bg-[#133E3E] hover:text-white'
                  }
                `}
              >
                <ShieldCheck size={18} className="text-[#34D399]" />
                <span className="flex-1">Security Tests</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#047857]/40 text-[#A7F3D0] border border-[#047857]">
                  9/9 Passed
                </span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* BOTTOM USER & LOGOUT */}
        <div className="p-3 border-t border-[#133E3E] bg-[#082424]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0B2E2E] border border-[#144848]">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#34D399]/40">
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  userProfile?.name?.charAt(0) || 'P'
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate">{userProfile?.name}</span>
                <span className="text-[10px] text-[#8EAFA9] truncate">{userProfile?.employeeId}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <NavLink 
                to="/settings"
                className="p-1 text-[#8EAFA9] hover:text-[#34D399] transition-colors rounded-md" 
                title="Settings"
              >
                <Settings size={16} />
              </NavLink>
              <button 
                onClick={handleLogout}
                className="p-1 text-[#F87171] hover:text-red-400 transition-colors rounded-md cursor-pointer" 
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
          className="fixed inset-0 bg-[#0B2E2E]/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* DESKTOP TOP HEADER */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#E7E3D8] sticky top-0 z-20 shadow-xs">
          {/* SEARCH BAR */}
          <HeaderSearchBar onSearch={handleSearch} />

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center space-x-4">
            {/* Quick Role Tester Pill */}
            <div className="flex items-center space-x-2 bg-[#F8F6F1] px-3 py-1.5 rounded-xl border border-[#DDD7CA]">
              <span className="text-xs text-[#656966]">Portal:</span>
              <span className="text-xs font-bold text-[#047857]">{role}</span>
              <button
                onClick={() => switchDemoRole(isAdmin ? 'EMPLOYEE' : 'ADMIN')}
                className="text-[11px] font-bold text-[#059669] hover:text-[#047857] hover:underline ml-1 cursor-pointer"
              >
                Switch to {isAdmin ? 'Employee' : 'Admin'}
              </button>
            </div>

            {/* Notifications button */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="p-2 rounded-xl bg-[#F8F6F1] border border-[#DDD7CA] text-[#222525] hover:bg-[#EFEAE0] relative transition-colors cursor-pointer"
                aria-label="View notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E11D48] text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Quick Notifications Flyout */}
              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#DDD7CA] rounded-2xl shadow-lg p-3.5 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DDD7CA]">
                    <span className="text-xs font-bold text-[#0D3535]">Notifications ({unreadCount} unread)</span>
                    <button 
                      onClick={() => {
                        setShowNotificationsMenu(false);
                        navigate('/notifications');
                      }}
                      className="text-[11px] text-[#047857] font-semibold hover:underline cursor-pointer"
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
                        className="p-2.5 rounded-xl bg-[#F8F6F1] hover:bg-[#F1ECE1] cursor-pointer text-xs transition-colors"
                      >
                        <p className="font-bold text-[#222525] truncate">{n.title}</p>
                        <p className="text-[11px] text-[#656966] line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile badge */}
            <div className="flex items-center space-x-3 pl-3 border-l border-[#DDD7CA]">
              <div className="w-9 h-9 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-xs overflow-hidden border border-[#A7F3D0]">
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  userProfile?.name?.charAt(0) || 'P'
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#222525] leading-tight">{userProfile?.name}</span>
                <span className="text-[10px] text-[#047857] font-medium">{userProfile?.designation}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<PageSuspenseSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

