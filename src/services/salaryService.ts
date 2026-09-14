import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SalaryRecord } from '../types';
import { DEMO_SALARY_DATA } from './seedData';
import { logActivity } from './activityService';

export class UnauthorizedAccessError extends Error {
  statusCode: number;
  constructor(message = 'Access Denied: You are not authorized to view this confidential record.') {
    super(message);
    this.name = 'UnauthorizedAccessError';
    this.statusCode = 403;
  }
}

export const fetchSalaryHistory = async (
  targetEmployeeId: string,
  requestingUserUid: string,
  requestingUserRole: 'ADMIN' | 'EMPLOYEE',
  requestingEmployeeId?: string
): Promise<SalaryRecord[]> => {
  // CRITICAL SECURITY ENFORCEMENT:
  // If requester is EMPLOYEE and not their own employeeId, reject immediately with 403
  if (requestingUserRole !== 'ADMIN') {
    if (!requestingEmployeeId || requestingEmployeeId.toUpperCase() !== targetEmployeeId.toUpperCase()) {
      throw new UnauthorizedAccessError(
        `403 Forbidden: Employee ${requestingEmployeeId} cannot access salary records of ${targetEmployeeId}.`
      );
    }
  }

  try {
    const colRef = collection(db, 'salaryHistory');
    const q = query(
      colRef, 
      where('employeeId', '==', targetEmployeeId),
      orderBy('year', 'asc')
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SalaryRecord));
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      throw new UnauthorizedAccessError('403 Forbidden: Firestore Security Rules blocked unauthorized salary access.');
    }
    console.warn('Salary history query notice, checking local demo record store:', err);
  }

  const found = DEMO_SALARY_DATA[targetEmployeeId.toUpperCase()];
  if (found) {
    return found;
  }

  // Generate standard demo progression if not explicitly defined
  return [
    {
      id: `SAL-${targetEmployeeId}-2024`,
      employeeId: targetEmployeeId,
      ownerUid: requestingUserUid,
      year: 2024,
      annualSalary: 1250000,
      monthlySalary: 104166,
      currency: 'INR',
      hikePercentage: 11.2,
      previousSalary: 1125000,
      revisionDate: '2024-04-01',
      designation: 'Software Specialist',
      remarks: 'Annual merit revision reflecting project delivery benchmarks.',
    },
    {
      id: `SAL-${targetEmployeeId}-2025`,
      employeeId: targetEmployeeId,
      ownerUid: requestingUserUid,
      year: 2025,
      annualSalary: 1420000,
      monthlySalary: 118333,
      currency: 'INR',
      hikePercentage: 13.6,
      previousSalary: 1250000,
      revisionDate: '2025-04-01',
      designation: 'Senior Specialist',
      remarks: 'Merit increase & compensation band adjustment.',
    },
    {
      id: `SAL-${targetEmployeeId}-2026`,
      employeeId: targetEmployeeId,
      ownerUid: requestingUserUid,
      year: 2026,
      annualSalary: 1650000,
      monthlySalary: 137500,
      currency: 'INR',
      hikePercentage: 16.2,
      previousSalary: 1420000,
      revisionDate: '2026-04-01',
      designation: 'Senior Specialist',
      remarks: 'Performance excellence award and retention revision.',
    },
  ];
};

export const saveSalaryRecord = async (
  record: SalaryRecord,
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'salaryHistory', record.id);
  const payload = JSON.parse(JSON.stringify(record));
  await setDoc(ref, payload, { merge: true });

  await logActivity(
    'SALARY_REVISION_RECORDED',
    adminUid,
    adminName,
    'ADMIN',
    'SECURITY',
    record.employeeId,
    `Recorded salary revision for year ${record.year} for employee ${record.employeeId}.`
  );
};
