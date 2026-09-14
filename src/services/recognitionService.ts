import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RecognitionItem } from '../types';
import { RECOGNITIONS_DATA } from './seedData';
import { logActivity } from './activityService';
import { memoryCache, FIVE_MINUTES_MS } from './cacheUtils';

const CACHE_KEY_REC_PREFIX = 'recognition_cache_';

export const getCachedRecognitions = (period?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'): RecognitionItem[] | null => {
  const cacheKey = `${CACHE_KEY_REC_PREFIX}${period || 'all'}`;
  const cached = memoryCache.peek<RecognitionItem[]>(cacheKey);
  if (cached) return cached;
  if (period) {
    return RECOGNITIONS_DATA.filter(r => r.period === period);
  }
  return RECOGNITIONS_DATA;
};

export const fetchRecognitions = async (
  period?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  forceRefresh = false
): Promise<RecognitionItem[]> => {
  const cacheKey = `${CACHE_KEY_REC_PREFIX}${period || 'all'}`;

  return memoryCache.getOrFetch(cacheKey, async () => {
    try {
      const colRef = collection(db, 'recognition');
      let q = query(colRef, orderBy('score', 'desc'));
      if (period) {
        q = query(colRef, where('period', '==', period), orderBy('rank', 'asc'));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RecognitionItem));
      }
    } catch (err) {
      console.warn('Firestore recognition query notice, returning seeded rankings:', err);
    }

    if (period) {
      return RECOGNITIONS_DATA.filter(r => r.period === period);
    }
    return [...RECOGNITIONS_DATA];
  }, FIVE_MINUTES_MS, forceRefresh);
};

export const saveRecognition = async (
  item: RecognitionItem,
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'recognition', item.id);
  const payload = JSON.parse(JSON.stringify(item));
  await setDoc(ref, payload, { merge: true });

  // Invalidate recognition caches
  memoryCache.invalidatePrefix(CACHE_KEY_REC_PREFIX);

  await logActivity(
    'RECOGNITION_RECORDED',
    adminUid,
    adminName,
    'ADMIN',
    'RECOGNITION',
    item.id,
    `Awarded Rank ${item.rank} (${item.period}) to ${item.employeeName} for ${item.category}.`
  );
};
