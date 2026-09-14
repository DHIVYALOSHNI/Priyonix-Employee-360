import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Department, Domain } from '../types';
import { DEPARTMENTS_DATA, DOMAINS_DATA } from './seedData';
import { logActivity } from './activityService';
import { memoryCache, FIVE_MINUTES_MS } from './cacheUtils';

const CACHE_KEY_DEPARTMENTS = 'departments_cache';
const CACHE_KEY_DOMAINS = 'domains_cache';

export const getCachedDepartments = (): Department[] => {
  const cached = memoryCache.peek<Department[]>(CACHE_KEY_DEPARTMENTS);
  if (cached && cached.length > 0) return cached;
  return DEPARTMENTS_DATA;
};

export const getCachedDomains = (): Domain[] => {
  const cached = memoryCache.peek<Domain[]>(CACHE_KEY_DOMAINS);
  if (cached && cached.length > 0) return cached;
  return DOMAINS_DATA;
};

export const fetchDepartments = async (forceRefresh = false): Promise<Department[]> => {
  return memoryCache.getOrFetch(CACHE_KEY_DEPARTMENTS, async () => {
    let list: Department[] = [];
    try {
      const colRef = collection(db, 'departments');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Department));
      } else {
        list = [...DEPARTMENTS_DATA];
      }
    } catch (err) {
      console.warn('Firestore departments read notice, using seed departments:', err);
      list = [...DEPARTMENTS_DATA];
    }
    return list;
  }, FIVE_MINUTES_MS, forceRefresh);
};

export const fetchDomains = async (forceRefresh = false): Promise<Domain[]> => {
  return memoryCache.getOrFetch(CACHE_KEY_DOMAINS, async () => {
    let list: Domain[] = [];
    try {
      const colRef = collection(db, 'domains');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Domain));
      } else {
        list = [...DOMAINS_DATA];
      }
    } catch (err) {
      console.warn('Firestore domains read notice, using seed domains:', err);
      list = [...DOMAINS_DATA];
    }
    return list;
  }, FIVE_MINUTES_MS, forceRefresh);
};

export const saveDepartment = async (
  dept: Department,
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'departments', dept.id);
  const payload = JSON.parse(JSON.stringify(dept));
  await setDoc(ref, payload, { merge: true });
  memoryCache.invalidate(CACHE_KEY_DEPARTMENTS);

  await logActivity(
    'DEPARTMENT_SAVED',
    adminUid,
    adminName,
    'ADMIN',
    'SECURITY',
    dept.id,
    `Created/Updated department ${dept.name} (${dept.code}).`
  );
};

export const saveDomain = async (
  domain: Domain,
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'domains', domain.id);
  const payload = JSON.parse(JSON.stringify(domain));
  await setDoc(ref, payload, { merge: true });
  memoryCache.invalidate(CACHE_KEY_DOMAINS);

  await logActivity(
    'DOMAIN_SAVED',
    adminUid,
    adminName,
    'ADMIN',
    'SECURITY',
    domain.id,
    `Created/Updated domain ${domain.name} (${domain.code}).`
  );
};
