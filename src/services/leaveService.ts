import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LeaveRecord, LeaveStatus } from '../types';
import { DEMO_LEAVES_DATA } from './seedData';
import { sendNotification } from './notificationService';
import { logActivity } from './activityService';

export interface LeaveAllowanceSummary {
  totalAllowance: number; // e.g. 24 days annual
  used: number;
  remaining: number;
  fullDayCount: number;
  halfDayCount: number;
  pendingCount: number;
}

export const calculateLeaveSummary = (leaves: LeaveRecord[], totalAllowance = 24): LeaveAllowanceSummary => {
  let used = 0;
  let fullDayCount = 0;
  let halfDayCount = 0;
  let pendingCount = 0;

  leaves.forEach(l => {
    if (l.status === 'APPROVED') {
      used += l.daysCount;
      if (l.duration === 'FULL_DAY') fullDayCount++;
      else halfDayCount++;
    } else if (l.status === 'PENDING') {
      pendingCount++;
    }
  });

  return {
    totalAllowance,
    used,
    remaining: Math.max(0, totalAllowance - used),
    fullDayCount,
    halfDayCount,
    pendingCount,
  };
};

export const fetchLeaves = async (employeeId?: string, ownerUid?: string): Promise<LeaveRecord[]> => {
  try {
    const colRef = collection(db, 'leaves');
    let q = query(colRef, orderBy('appliedAt', 'desc'));

    if (employeeId && ownerUid) {
      q = query(colRef, where('employeeId', '==', employeeId), orderBy('appliedAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRecord));
    }
  } catch (err) {
    console.warn('Firestore leaves query warning, falling back to demo records:', err);
  }

  if (employeeId) {
    return DEMO_LEAVES_DATA.filter(l => l.employeeId === employeeId);
  }
  return [...DEMO_LEAVES_DATA];
};

export const submitLeaveRequest = async (
  leave: Omit<LeaveRecord, 'id' | 'appliedAt' | 'status'>,
  employeeName: string
): Promise<string> => {
  const newLeave = {
    ...leave,
    employeeName,
    status: 'PENDING' as LeaveStatus,
    appliedAt: new Date().toISOString(),
  };

  const cleaned = JSON.parse(JSON.stringify(newLeave));
  const docRef = await addDoc(collection(db, 'leaves'), cleaned);

  await logActivity(
    'LEAVE_SUBMITTED',
    leave.ownerUid,
    employeeName,
    'EMPLOYEE',
    'LEAVE',
    docRef.id,
    `Submitted ${leave.leaveType} leave request for ${leave.startDate} to ${leave.endDate} (${leave.daysCount} days).`
  );

  return docRef.id;
};

export const requestLeave = (
  leave: Omit<LeaveRecord, 'id' | 'appliedAt' | 'status'>
): Promise<string> => {
  return submitLeaveRequest(leave, leave.employeeName);
};

export const updateLeaveStatus = async (
  leaveId: string,
  newStatus: 'APPROVED' | 'REJECTED',
  reviewerUid: string,
  reviewerName: string,
  recipientUid: string,
  employeeName: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const ref = doc(db, 'leaves', leaveId);
    const updateData: Record<string, unknown> = {
      status: newStatus,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
    };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await updateDoc(ref, updateData);
  } catch (err) {
    console.warn('Could not update leave status in Firestore:', err);
  }

  // Create employee notification
  await sendNotification({
    recipientUid,
    title: `Leave Request ${newStatus === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    message: newStatus === 'APPROVED'
      ? `Your leave request has been approved by ${reviewerName}.`
      : `Your leave request was declined: ${rejectionReason || 'No reason specified'}.`,
    type: 'LEAVE_STATUS',
    link: '/leave',
  });

  // Log activity
  await logActivity(
    `LEAVE_${newStatus}`,
    reviewerUid,
    reviewerName,
    'ADMIN',
    'LEAVE',
    leaveId,
    `${newStatus === 'APPROVED' ? 'Approved' : 'Rejected'} leave request for ${employeeName}.`
  );
};
