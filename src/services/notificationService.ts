import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NotificationItem } from '../types';
import { NOTIFICATIONS_DATA } from './seedData';
import { memoryCache, FIVE_MINUTES_MS } from './cacheUtils';

const CACHE_KEY_NOTIFS_PREFIX = 'user_notifications_';

export const getCachedUserNotifications = (userUid: string): NotificationItem[] => {
  const cached = memoryCache.peek<NotificationItem[]>(`${CACHE_KEY_NOTIFS_PREFIX}${userUid}`);
  if (cached && cached.length > 0) return cached;
  return NOTIFICATIONS_DATA;
};

export const sendNotification = async (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): Promise<string | null> => {
  try {
    const payload = {
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const cleaned = JSON.parse(JSON.stringify(payload));
    const docRef = await addDoc(collection(db, 'notifications'), cleaned);
    // Invalidate cached notifications
    memoryCache.invalidatePrefix(CACHE_KEY_NOTIFS_PREFIX);
    return docRef.id;
  } catch (err) {
    console.warn('Error sending notification to Firestore:', err);
    return null;
  }
};

export const fetchUserNotifications = async (userUid: string, forceRefresh = false): Promise<NotificationItem[]> => {
  const cacheKey = `${CACHE_KEY_NOTIFS_PREFIX}${userUid}`;

  return memoryCache.getOrFetch(cacheKey, async () => {
    let items: NotificationItem[] = [];
    try {
      const notifsRef = collection(db, 'notifications');
      // Look for notifications intended for this user or global notifications
      const q = query(
        notifsRef, 
        where('recipientUid', 'in', [userUid, 'ALL_EMPLOYEES', 'ALL_USERS', 'employee-uid-demo', 'admin-uid-demo']),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
      } else {
        items = [...NOTIFICATIONS_DATA];
      }
    } catch (err) {
      console.warn('Error fetching notifications from Firestore:', err);
      items = [...NOTIFICATIONS_DATA];
    }
    return items;
  }, FIVE_MINUTES_MS, forceRefresh);
};

export const markNotificationRead = async (id: string, userUid?: string): Promise<void> => {
  try {
    const ref = doc(db, 'notifications', id);
    await updateDoc(ref, { isRead: true });
    if (userUid) {
      const cacheKey = `${CACHE_KEY_NOTIFS_PREFIX}${userUid}`;
      const cached = memoryCache.get<NotificationItem[]>(cacheKey);
      if (cached) {
        const updated = cached.map(n => n.id === id ? { ...n, isRead: true } : n);
        memoryCache.set(cacheKey, updated, FIVE_MINUTES_MS);
      }
    } else {
      memoryCache.invalidatePrefix(CACHE_KEY_NOTIFS_PREFIX);
    }
  } catch (err) {
    console.warn('Could not update notification in Firestore:', err);
  }
};

export const markNotificationAsRead = markNotificationRead;

export const markAllNotificationsRead = async (notifications: NotificationItem[], userUid?: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    notifications.filter(n => !n.isRead).forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { isRead: true });
    });
    await batch.commit();
    if (userUid) {
      const cacheKey = `${CACHE_KEY_NOTIFS_PREFIX}${userUid}`;
      const cached = memoryCache.get<NotificationItem[]>(cacheKey);
      if (cached) {
        const updated = cached.map(n => ({ ...n, isRead: true }));
        memoryCache.set(cacheKey, updated, FIVE_MINUTES_MS);
      }
    } else {
      memoryCache.invalidatePrefix(CACHE_KEY_NOTIFS_PREFIX);
    }
  } catch (err) {
    console.warn('Could not batch mark notifications read:', err);
  }
};

export const markAllNotificationsAsRead = async (userUid: string): Promise<void> => {
  try {
    const notifs = await fetchUserNotifications(userUid);
    await markAllNotificationsRead(notifs, userUid);
  } catch (err) {
    console.warn('Could not mark all notifications as read:', err);
  }
};
