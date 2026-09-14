import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActivityLogItem, UserRole } from '../types';
import { memoryCache, FIVE_MINUTES_MS } from './cacheUtils';

const CACHE_KEY_ACTIVITY = 'activity_logs_cache';

const FALLBACK_LOGS: ActivityLogItem[] = [
  {
    id: 'ACT-01',
    action: 'SYSTEM_BOOT',
    performedByUid: 'system',
    performedByName: 'Prionix Security Core',
    performedByRole: 'ADMIN',
    targetType: 'SECURITY',
    targetId: 'SYS-SEC',
    details: 'Zero-Trust IAM policy engine initialized for all enterprise domains.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'ACT-02',
    action: 'LEAVE_SUBMITTED',
    performedByUid: 'employee-uid-demo',
    performedByName: 'Devika Krishnan',
    performedByRole: 'EMPLOYEE',
    targetType: 'LEAVE',
    targetId: 'LV-201',
    details: 'Submitted 2-day Casual Leave request for family event.',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'ACT-03',
    action: 'ANNOUNCEMENT_PUBLISHED',
    performedByUid: 'admin-uid-demo',
    performedByName: 'Siddharth Rao',
    performedByRole: 'ADMIN',
    targetType: 'ANNOUNCEMENT',
    targetId: 'ANN-01',
    details: 'Published Q3 All-Hands & Technical Innovation Showcase announcement.',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'ACT-04',
    action: 'PROJECT_MILESTONE_UPDATED',
    performedByUid: 'admin-uid-demo',
    performedByName: 'Siddharth Rao',
    performedByRole: 'ADMIN',
    targetType: 'PROJECT',
    targetId: 'PRJ-101',
    details: 'Updated Enterprise Agentic Mesh progress milestone to 68%.',
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
  },
  {
    id: 'ACT-05',
    action: 'LEAVE_APPROVED',
    performedByUid: 'admin-uid-demo',
    performedByName: 'Siddharth Rao',
    performedByRole: 'ADMIN',
    targetType: 'LEAVE',
    targetId: 'LV-202',
    details: 'Approved Sick Leave request for Devika Krishnan.',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
  },
];

export const getCachedActivityLogs = (): ActivityLogItem[] | null => {
  return memoryCache.peek<ActivityLogItem[]>(CACHE_KEY_ACTIVITY) || FALLBACK_LOGS;
};

export const logActivity = async (
  action: string,
  performedByUid: string,
  performedByName: string,
  performedByRole: UserRole,
  targetType: ActivityLogItem['targetType'],
  targetId: string,
  details: string
): Promise<void> => {
  try {
    const payload = {
      action,
      performedByUid,
      performedByName,
      performedByRole,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    
    // Invalidate activity logs cache
    memoryCache.invalidate(CACHE_KEY_ACTIVITY);

    // Clean any undefined values before sending to Firestore
    const cleaned = JSON.parse(JSON.stringify(payload));
    await addDoc(collection(db, 'activityLogs'), cleaned);
  } catch (err) {
    console.warn('Could not write activity log to Firestore:', err);
  }
};

export const fetchActivityLogs = async (maxCount = 40, forceRefresh = false): Promise<ActivityLogItem[]> => {
  return memoryCache.getOrFetch(CACHE_KEY_ACTIVITY, async () => {
    try {
      const logsRef = collection(db, 'activityLogs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxCount));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as ActivityLogItem));
      }
    } catch (err) {
      console.warn('Error fetching Firestore activity logs, falling back to recent in-memory trail:', err);
    }

    return FALLBACK_LOGS;
  }, FIVE_MINUTES_MS, forceRefresh);
};
