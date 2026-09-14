import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AnnouncementItem } from '../types';
import { ANNOUNCEMENTS_DATA } from './seedData';
import { logActivity } from './activityService';
import { sendNotification } from './notificationService';
import { memoryCache, FIVE_MINUTES_MS } from './cacheUtils';

const CACHE_KEY_ANNOUNCEMENTS = 'announcements_all_cache';

export const getCachedAnnouncements = (onlyPublished = true): AnnouncementItem[] => {
  const cached = memoryCache.peek<AnnouncementItem[]>(CACHE_KEY_ANNOUNCEMENTS);
  const items = (cached && cached.length > 0) ? cached : ANNOUNCEMENTS_DATA;
  if (onlyPublished) {
    return items.filter(a => a.status === 'PUBLISHED');
  }
  return items;
};

export const fetchAnnouncements = async (
  onlyPublished = true, 
  forceRefresh = false
): Promise<AnnouncementItem[]> => {
  const allItems = await memoryCache.getOrFetch(CACHE_KEY_ANNOUNCEMENTS, async () => {
    let list: AnnouncementItem[] = [];
    try {
      const colRef = collection(db, 'announcements');
      const q = query(colRef, orderBy('publishedDate', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AnnouncementItem));
      } else {
        list = [...ANNOUNCEMENTS_DATA];
      }
    } catch (err) {
      console.warn('Firestore announcements read notice, falling back to seed announcements:', err);
      list = [...ANNOUNCEMENTS_DATA];
    }
    return list;
  }, FIVE_MINUTES_MS, forceRefresh);

  if (onlyPublished) {
    return allItems.filter(a => a.status === 'PUBLISHED');
  }
  return allItems;
};

export const saveAnnouncement = async (
  announcement: AnnouncementItem,
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'announcements', announcement.id);
  const payload = JSON.parse(JSON.stringify(announcement));
  await setDoc(ref, payload, { merge: true });

  // Invalidate 5-minute in-memory cache
  memoryCache.invalidate(CACHE_KEY_ANNOUNCEMENTS);

  await logActivity(
    announcement.status === 'PUBLISHED' ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_DRAFT_SAVED',
    adminUid,
    adminName,
    'ADMIN',
    'ANNOUNCEMENT',
    announcement.id,
    `Announcement "${announcement.title}" (${announcement.category}) set to ${announcement.status}.`
  );

  // If published, trigger broadcast notification
  if (announcement.status === 'PUBLISHED') {
    await sendNotification({
      recipientUid: 'ALL_EMPLOYEES',
      title: `Announcement: ${announcement.title}`,
      message: announcement.description.slice(0, 120) + (announcement.description.length > 120 ? '...' : ''),
      type: 'ANNOUNCEMENT',
      link: '/announcements',
    });
  }
};

export const updateAnnouncementStatus = async (
  id: string,
  newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'announcements', id);
  await updateDoc(ref, { status: newStatus });
  memoryCache.invalidate(CACHE_KEY_ANNOUNCEMENTS);

  await logActivity(
    'ANNOUNCEMENT_STATUS_UPDATED',
    adminUid,
    adminName,
    'ADMIN',
    'ANNOUNCEMENT',
    id,
    `Updated status to ${newStatus}.`
  );
};

export const deleteAnnouncement = async (
  id: string,
  adminUid: string,
  adminName: string
): Promise<void> => {
  try {
    const ref = doc(db, 'announcements', id);
    await deleteDoc(ref);
    memoryCache.invalidate(CACHE_KEY_ANNOUNCEMENTS);
    await logActivity(
      'ANNOUNCEMENT_DELETED',
      adminUid,
      adminName,
      'ADMIN',
      'ANNOUNCEMENT',
      id,
      `Deleted announcement ${id}.`
    );
  } catch (err) {
    console.warn('Could not delete announcement from Firestore:', err);
  }
};
