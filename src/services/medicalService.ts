import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MedicalRecord } from '../types';
import { DEMO_MEDICAL_DATA } from './seedData';
import { logActivity } from './activityService';
import { memoryCache, FIVE_MINUTES_MS } from './cacheUtils';

const CACHE_KEY_MEDICAL_PREFIX = 'medical_cache_';

export class MedicalAccessDeniedError extends Error {
  statusCode: number;
  constructor(message = 'Access Denied: You are not authorized to view this confidential medical/emergency record.') {
    super(message);
    this.name = 'MedicalAccessDeniedError';
    this.statusCode = 403;
  }
}

export const getCachedMedicalRecord = (targetEmployeeId: string): MedicalRecord | null => {
  const cached = memoryCache.peek<MedicalRecord>(`${CACHE_KEY_MEDICAL_PREFIX}${targetEmployeeId.toUpperCase()}`);
  if (cached) return cached;
  return DEMO_MEDICAL_DATA[targetEmployeeId.toUpperCase()] || null;
};

export const fetchMedicalRecord = async (
  targetEmployeeId: string,
  requestingUserUid: string,
  requestingUserRole: 'ADMIN' | 'EMPLOYEE',
  requestingEmployeeId?: string,
  forceRefresh = false
): Promise<MedicalRecord> => {
  // CRITICAL SECURITY ENFORCEMENT
  if (requestingUserRole !== 'ADMIN') {
    if (!requestingEmployeeId || requestingEmployeeId.toUpperCase() !== targetEmployeeId.toUpperCase()) {
      throw new MedicalAccessDeniedError(
        `403 Forbidden: Employee ${requestingEmployeeId} cannot access confidential medical data of ${targetEmployeeId}.`
      );
    }
  }

  const cacheKey = `${CACHE_KEY_MEDICAL_PREFIX}${targetEmployeeId.toUpperCase()}`;

  return memoryCache.getOrFetch(cacheKey, async () => {
    try {
      const ref = doc(db, 'medicalRecords', targetEmployeeId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as MedicalRecord;
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        throw new MedicalAccessDeniedError('403 Forbidden: Firestore Security Rules blocked unauthorized medical record access.');
      }
      console.warn(`Firestore medical record query notice for ${targetEmployeeId}:`, err);
    }

    const found = DEMO_MEDICAL_DATA[targetEmployeeId.toUpperCase()];
    if (found) {
      return found;
    }

    // Safe fallback dummy medical file for demo employees
    return {
      employeeId: targetEmployeeId,
      ownerUid: requestingUserUid,
      bloodGroup: 'O+ (Positive)',
      emergencyContactName: 'Emergency Contact Person',
      emergencyContactRelation: 'Family Member',
      emergencyPhone: '+91 98450 00000',
      allergies: ['None reported'],
      medicalNotes: 'Standard corporate medical wellness check cleared.',
      chronicConditions: [],
      insurancePolicyNumber: 'PRX-MED-HEALTH-2026',
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  }, FIVE_MINUTES_MS, forceRefresh);
};

export const updateMedicalRecord = async (
  record: MedicalRecord,
  performedByUid: string,
  performedByName: string,
  performedByRole: 'ADMIN' | 'EMPLOYEE'
): Promise<void> => {
  const ref = doc(db, 'medicalRecords', record.employeeId);
  const payload = JSON.parse(JSON.stringify({
    ...record,
    lastUpdated: new Date().toISOString().split('T')[0],
  }));
  await setDoc(ref, payload, { merge: true });

  // Invalidate cached medical record
  memoryCache.invalidate(`${CACHE_KEY_MEDICAL_PREFIX}${record.employeeId.toUpperCase()}`);

  await logActivity(
    'MEDICAL_RECORD_UPDATED',
    performedByUid,
    performedByName,
    performedByRole,
    'SECURITY',
    record.employeeId,
    `Updated confidential medical & emergency details for ${record.employeeId}.`
  );
};
