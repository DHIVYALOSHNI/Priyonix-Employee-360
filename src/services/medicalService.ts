import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MedicalRecord } from '../types';
import { DEMO_MEDICAL_DATA } from './seedData';
import { logActivity } from './activityService';

export class MedicalAccessDeniedError extends Error {
  statusCode: number;
  constructor(message = 'Access Denied: You are not authorized to view this confidential medical/emergency record.') {
    super(message);
    this.name = 'MedicalAccessDeniedError';
    this.statusCode = 403;
  }
}

export const fetchMedicalRecord = async (
  targetEmployeeId: string,
  requestingUserUid: string,
  requestingUserRole: 'ADMIN' | 'EMPLOYEE',
  requestingEmployeeId?: string
): Promise<MedicalRecord> => {
  // CRITICAL SECURITY ENFORCEMENT
  if (requestingUserRole !== 'ADMIN') {
    if (!requestingEmployeeId || requestingEmployeeId.toUpperCase() !== targetEmployeeId.toUpperCase()) {
      throw new MedicalAccessDeniedError(
        `403 Forbidden: Employee ${requestingEmployeeId} cannot access confidential medical data of ${targetEmployeeId}.`
      );
    }
  }

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
