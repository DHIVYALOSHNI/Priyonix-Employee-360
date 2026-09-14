import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceRecord, AttendanceStatus } from '../types';

// Deterministic seed generation for 30 days of attendance
let attendanceCache: Record<string, AttendanceRecord[]> = {};

export const generateDemoMonthAttendance = (
  employeeId: string, 
  ownerUid: string, 
  year: number, 
  month: number // 1 to 12
): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
    const dayStr = d.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    // Hash day + employee to create realistic pattern
    const hash = (d * 7 + employeeId.charCodeAt(employeeId.length - 1)) % 30;
    let status: AttendanceStatus = 'PRESENT';
    let checkIn: string | undefined = '09:15 AM';
    let checkOut: string | undefined = '06:30 PM';
    let workHours = 8.5;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend: flex shift or scheduled off
      if (d % 3 === 0) {
        status = 'PRESENT';
        checkIn = '10:00 AM';
        checkOut = '03:30 PM';
        workHours = 5.5;
      } else {
        status = 'LEAVE';
        checkIn = undefined;
        checkOut = undefined;
        workHours = 0;
      }
    } else if (hash === 4 || hash === 19) {
      status = 'HALF_DAY';
      checkIn = '09:30 AM';
      checkOut = '01:45 PM';
      workHours = 4.25;
    } else if (hash === 8) {
      status = 'LEAVE';
      checkIn = undefined;
      checkOut = undefined;
      workHours = 0;
    } else if (hash === 22) {
      status = 'ABSENT';
      checkIn = undefined;
      checkOut = undefined;
      workHours = 0;
    }

    records.push({
      id: `ATT-${employeeId}-${dateStr}`,
      employeeId,
      ownerUid,
      date: dateStr,
      status,
      checkIn,
      checkOut,
      workHours,
    });
  }

  return records;
};

export interface AttendanceSummary {
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  workingDays: number;
  attendancePercentage: number;
}

export const calculateAttendanceSummary = (records: AttendanceRecord[]): AttendanceSummary => {
  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let leave = 0;

  records.forEach(r => {
    if (r.status === 'PRESENT') present++;
    else if (r.status === 'ABSENT') absent++;
    else if (r.status === 'HALF_DAY') halfDay++;
    else if (r.status === 'LEAVE') leave++;
  });

  const workingDays = present + absent + halfDay + leave;
  const effectivePresent = present + (halfDay * 0.5);
  const attendancePercentage = workingDays > 0 
    ? Math.round((effectivePresent / workingDays) * 100) 
    : 100;

  return {
    present,
    absent,
    halfDay,
    leave,
    workingDays,
    attendancePercentage,
  };
};

export const getCachedAttendance = (
  employeeId: string, 
  year = 2026, 
  month = 9
): AttendanceRecord[] | null => {
  const cacheKey = `${employeeId}-${year}-${month}`;
  if (attendanceCache[cacheKey] && attendanceCache[cacheKey].length > 0) {
    return attendanceCache[cacheKey];
  }
  return null;
};

export const fetchEmployeeAttendance = async (
  employeeId: string, 
  ownerUid: string, 
  year = 2026, 
  month = 9,
  forceRefresh = false
): Promise<AttendanceRecord[]> => {
  const cacheKey = `${employeeId}-${year}-${month}`;
  if (!forceRefresh && attendanceCache[cacheKey] && attendanceCache[cacheKey].length > 0) {
    return attendanceCache[cacheKey];
  }

  try {
    const colRef = collection(db, 'attendance');
    const startPrefix = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endPrefix = `${year}-${month.toString().padStart(2, '0')}-31`;

    const q = query(
      colRef,
      where('employeeId', '==', employeeId),
      where('date', '>=', startPrefix),
      where('date', '<=', endPrefix),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      attendanceCache[cacheKey] = records;
      return records;
    }
  } catch (err) {
    console.warn(`Firestore attendance query error for ${employeeId}:`, err);
  }

  // Fallback to generated month dataset
  const fallbackRecords = generateDemoMonthAttendance(employeeId, ownerUid, year, month);
  attendanceCache[cacheKey] = fallbackRecords;
  return fallbackRecords;
};

export const logDailyAttendance = async (
  record: Omit<AttendanceRecord, 'id'>
): Promise<void> => {
  const id = `ATT-${record.employeeId}-${record.date}`;
  const ref = doc(db, 'attendance', id);
  const payload = JSON.parse(JSON.stringify({ ...record, id }));
  await setDoc(ref, payload, { merge: true });

  // Update in-memory cache directly
  const dateParts = record.date.split('-');
  if (dateParts.length >= 2) {
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const cacheKey = `${record.employeeId}-${year}-${month}`;
    if (attendanceCache[cacheKey]) {
      const existingIdx = attendanceCache[cacheKey].findIndex(r => r.date === record.date);
      const updatedRecord: AttendanceRecord = { ...record, id };
      if (existingIdx >= 0) {
        attendanceCache[cacheKey][existingIdx] = updatedRecord;
      } else {
        attendanceCache[cacheKey].push(updatedRecord);
      }
    }
  }
};

export const markTodayAttendance = async (
  employeeIdOrRecord: string | Omit<AttendanceRecord, 'id'>,
  ownerUid?: string,
  employeeName?: string,
  date?: string,
  status?: AttendanceStatus,
  checkIn?: string,
  checkOut?: string
): Promise<void> => {
  if (typeof employeeIdOrRecord === 'object') {
    return logDailyAttendance(employeeIdOrRecord);
  }
  return logDailyAttendance({
    employeeId: employeeIdOrRecord,
    ownerUid: ownerUid || 'unknown',
    date: date || new Date().toISOString().split('T')[0],
    status: status || 'PRESENT',
    checkIn,
    checkOut,
    workHours: status === 'HALF_DAY' ? 4 : 8.5,
  });
};
