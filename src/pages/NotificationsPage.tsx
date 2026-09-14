import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  CalendarDays, 
  Award, 
  Megaphone, 
  BriefcaseBusiness, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/notificationService';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const loadNotifications = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const data = await fetchUserNotifications(userProfile.uid);
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userProfile?.uid]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    if (!userProfile?.uid) return;
    await markAllNotificationsAsRead(userProfile.uid);
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter(n => filter === 'ALL' || !n.isRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'LEAVE_STATUS': return CalendarDays;
      case 'RECOGNITION': return Award;
      case 'ANNOUNCEMENT': return Megaphone;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <Bell size={14} />
            <span>Workspace Activity Alerts</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Notifications
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Real-time updates regarding leave requests, announcements, recognition awards, and system notices.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] hover:border-[#174A4A] text-[#174A4A] transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCheck size={15} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. FILTER PILLS */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filter === 'ALL' 
              ? 'bg-[#174A4A] text-[#F7F4ED]' 
              : 'bg-[#EFEAE0] text-[#73716B] hover:text-[#30302D]'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filter === 'UNREAD' 
              ? 'bg-[#174A4A] text-[#F7F4ED]' 
              : 'bg-[#EFEAE0] text-[#73716B] hover:text-[#30302D]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* 3. NOTIFICATIONS LIST */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] animate-pulse flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#DDD7CA] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-40 h-3.5 bg-[#DDD7CA] rounded" />
                  <div className="w-3/4 h-3 bg-[#DDD7CA]/70 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#73716B]">
            <CheckCircle2 size={32} className="mx-auto text-[#4F8068] mb-2" />
            <h3 className="text-sm font-bold text-[#174A4A]">You're all caught up!</h3>
            <p className="text-xs mt-1">No unread notifications at this time.</p>
          </div>
        ) : (
          filtered.map(notif => {
            const Icon = getIcon(notif.type);
            return (
              <div 
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                  notif.isRead 
                    ? 'bg-[#F7F4ED]/70 border-[#DDD7CA]' 
                    : 'bg-[#F7F4ED] border-[#789B8B] shadow-xs'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  notif.isRead ? 'bg-[#DDD7CA]/50 text-[#73716B]' : 'bg-[#174A4A] text-[#F7F4ED]'
                }`}>
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs ${notif.isRead ? 'font-semibold text-[#30302D]' : 'font-bold text-[#174A4A]'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-[#73716B]">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#73716B] mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-2.5 flex items-center space-x-3 text-[11px]">
                    {notif.link && (
                      <button
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif.id);
                          navigate(notif.link!);
                        }}
                        className="font-bold text-[#174A4A] hover:underline flex items-center space-x-1"
                      >
                        <span>View Details</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[#789B8B] hover:text-[#174A4A] font-semibold"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
