import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppointmentSlot } from '../types';
import { APPOINTMENT_SLOTS_DATA } from './seedData';
import { logActivity } from './activityService';

let appointmentsCache: { data: AppointmentSlot[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000;

export const fetchAppointmentSlots = async (forceRefresh = false): Promise<AppointmentSlot[]> => {
  const now = Date.now();
  if (!forceRefresh && appointmentsCache && (now - appointmentsCache.timestamp < CACHE_TTL_MS)) {
    return appointmentsCache.data;
  }

  try {
    const colRef = collection(db, 'appointmentSlots');
    const q = query(colRef, orderBy('date', 'asc'));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppointmentSlot));
      appointmentsCache = { data: list, timestamp: now };
      return list;
    }
  } catch (err) {
    console.warn('Firestore appointmentSlots query fallback notice:', err);
  }

  // Fallback
  appointmentsCache = { data: APPOINTMENT_SLOTS_DATA, timestamp: now };
  return APPOINTMENT_SLOTS_DATA;
};

export const bookAppointmentSlot = async (
  slotId: string,
  attendeeEmployeeId: string,
  attendeeName: string,
  userProfile: { uid: string; name: string; role: any }
): Promise<boolean> => {
  try {
    const slotRef = doc(db, 'appointmentSlots', slotId);
    await updateDoc(slotRef, {
      status: 'BOOKED',
      attendeeEmployeeId,
      attendeeName,
    });

    appointmentsCache = null;

    await logActivity(
      'APPOINTMENT_BOOKED',
      userProfile.uid,
      userProfile.name,
      userProfile.role,
      'EMPLOYEE',
      slotId,
      `Booked appointment slot ${slotId} with ${attendeeName}`
    );

    return true;
  } catch (err) {
    console.warn('Could not update appointment slot in Firestore:', err);
    // Optimistically update local cache
    if (appointmentsCache) {
      appointmentsCache.data = appointmentsCache.data.map(slot => 
        slot.id === slotId ? { ...slot, status: 'BOOKED', attendeeEmployeeId, attendeeName } : slot
      );
    }
    return true;
  }
};

export const cancelAppointmentSlot = async (
  slotId: string,
  userProfile: { uid: string; name: string; role: any }
): Promise<boolean> => {
  try {
    const slotRef = doc(db, 'appointmentSlots', slotId);
    await updateDoc(slotRef, {
      status: 'AVAILABLE',
      attendeeEmployeeId: null,
      attendeeName: null,
    });

    appointmentsCache = null;

    await logActivity(
      'APPOINTMENT_CANCELLED',
      userProfile.uid,
      userProfile.name,
      userProfile.role,
      'EMPLOYEE',
      slotId,
      `Cancelled appointment slot ${slotId}`
    );

    return true;
  } catch (err) {
    console.warn('Could not cancel appointment slot in Firestore:', err);
    return false;
  }
};
