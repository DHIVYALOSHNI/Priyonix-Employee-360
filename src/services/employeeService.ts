import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EmployeeDirectoryItem } from '../types';
import { EMPLOYEES_DATA } from './seedData';
import { logActivity } from './activityService';
import { memoryCache, FIVE_MINUTES_MS } from './cacheUtils';

const CACHE_KEY_DIRECTORY = 'employee_directory_raw';
const CACHE_KEY_EMPLOYEE_PREFIX = 'employee_id_';

export interface EmployeeFilterOptions {
  searchQuery?: string;
  departmentId?: string;
  domainId?: string;
  status?: string;
  sortBy?: 'name' | 'employeeId' | 'department' | 'domain';
  sortOrder?: 'asc' | 'desc';
}

export const fetchEmployeeDirectory = async (
  filters?: EmployeeFilterOptions,
  forceRefresh = false
): Promise<EmployeeDirectoryItem[]> => {
  let list: EmployeeDirectoryItem[] = [];

  // Check 5-minute in-memory cache
  if (!forceRefresh) {
    const cached = memoryCache.get<EmployeeDirectoryItem[]>(CACHE_KEY_DIRECTORY);
    if (cached) {
      list = [...cached];
    }
  }

  if (list.length === 0) {
    try {
      const colRef = collection(db, 'employees');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        list = snapshot.docs.map(d => ({ ...d.data(), employeeId: d.id } as EmployeeDirectoryItem));
      } else {
        list = [...EMPLOYEES_DATA];
      }
    } catch (err) {
      console.warn('Firestore employee directory read warning, falling back to cached directory:', err);
      list = [...EMPLOYEES_DATA];
    }

    // Cache the raw list with 5-minute TTL
    memoryCache.set(CACHE_KEY_DIRECTORY, list, FIVE_MINUTES_MS);
    // Also warm individual employee caches
    list.forEach(emp => {
      memoryCache.set(`${CACHE_KEY_EMPLOYEE_PREFIX}${emp.employeeId.toUpperCase()}`, emp, FIVE_MINUTES_MS);
    });
  }

  // Client-side filtration and searching
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    list = list.filter(emp => 
      emp.name.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
  }

  if (filters?.departmentId && filters.departmentId !== 'ALL') {
    list = list.filter(emp => emp.departmentId === filters.departmentId);
  }

  if (filters?.domainId && filters.domainId !== 'ALL') {
    list = list.filter(emp => emp.domainId === filters.domainId);
  }

  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter(emp => emp.status === filters.status);
  }

  // Sorting
  const sortBy = filters?.sortBy || 'employeeId';
  const sortOrder = filters?.sortOrder || 'asc';

  list.sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortBy === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortBy === 'department') {
      valA = (a.departmentName || a.departmentId).toLowerCase();
      valB = (b.departmentName || b.departmentId).toLowerCase();
    } else if (sortBy === 'domain') {
      valA = (a.domainName || a.domainId).toLowerCase();
      valB = (b.domainName || b.domainId).toLowerCase();
    } else {
      valA = a.employeeId.toLowerCase();
      valB = b.employeeId.toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
};

export const fetchEmployeeById = async (
  employeeId: string,
  forceRefresh = false
): Promise<EmployeeDirectoryItem | null> => {
  const normId = employeeId.trim().toUpperCase();
  const cacheKey = `${CACHE_KEY_EMPLOYEE_PREFIX}${normId}`;

  if (!forceRefresh) {
    const cached = memoryCache.get<EmployeeDirectoryItem>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const ref = doc(db, 'employees', normId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const emp = { ...snap.data(), employeeId: snap.id } as EmployeeDirectoryItem;
      memoryCache.set(cacheKey, emp, FIVE_MINUTES_MS);
      return emp;
    }
  } catch (err) {
    console.warn(`Could not fetch employee ${employeeId} from Firestore:`, err);
  }

  const found = EMPLOYEES_DATA.find(e => e.employeeId.toUpperCase() === normId);
  if (found) {
    memoryCache.set(cacheKey, found, FIVE_MINUTES_MS);
    return found;
  }
  return null;
};

export const saveEmployee = async (
  employee: EmployeeDirectoryItem, 
  adminUid: string, 
  adminName: string
): Promise<void> => {
  // Strip any undefined keys
  const payload = JSON.parse(JSON.stringify(employee));
  const ref = doc(db, 'employees', employee.employeeId);
  await setDoc(ref, payload, { merge: true });

  // Invalidate in-memory caches to guarantee consistency
  memoryCache.invalidate(CACHE_KEY_DIRECTORY);
  memoryCache.invalidate(`${CACHE_KEY_EMPLOYEE_PREFIX}${employee.employeeId.toUpperCase()}`);

  await logActivity(
    'EMPLOYEE_SAVED',
    adminUid,
    adminName,
    'ADMIN',
    'EMPLOYEE',
    employee.employeeId,
    `Saved/Updated profile for ${employee.name} (${employee.employeeId}, ${employee.designation}).`
  );
};

export const updateEmployeeStatus = async (
  employeeId: string, 
  newStatus: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE',
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'employees', employeeId);
  await updateDoc(ref, { status: newStatus });

  // Invalidate in-memory caches
  memoryCache.invalidate(CACHE_KEY_DIRECTORY);
  memoryCache.invalidate(`${CACHE_KEY_EMPLOYEE_PREFIX}${employeeId.toUpperCase()}`);

  await logActivity(
    'EMPLOYEE_STATUS_CHANGED',
    adminUid,
    adminName,
    'ADMIN',
    'EMPLOYEE',
    employeeId,
    `Updated status of ${employeeId} to ${newStatus}.`
  );
};
