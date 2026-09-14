export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface UserProfile {
  uid: string;
  employeeId: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
  domainId: string;
  designation: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  phone?: string;
  avatarUrl?: string;
  joiningDate?: string;
  manager?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeDirectoryItem {
  employeeId: string;
  ownerUid?: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName?: string;
  domainId: string;
  domainName?: string;
  designation: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  joiningDate: string;
  manager: string;
  location: string;
  phone: string;
  avatarUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  description: string;
  employeeCount?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Domain {
  id: string;
  name: string;
  code: string;
  description: string;
  employeeCount?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  ownerUid: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string; // e.g. "09:15 AM"
  checkOut?: string; // e.g. "06:30 PM"
  workHours?: number;
  notes?: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'PATERNITY' | 'MATERNITY' | 'BEREAVEMENT';
export type LeaveDuration = 'FULL_DAY' | 'HALF_DAY';

export interface LeaveRecord {
  id: string;
  employeeId: string;
  ownerUid: string;
  employeeName: string;
  leaveType: LeaveType;
  duration: LeaveDuration;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  ownerUid: string;
  year: number;
  annualSalary: number; // in INR
  monthlySalary: number;
  currency: string;
  hikePercentage: number;
  previousSalary?: number;
  revisionDate: string;
  designation: string;
  remarks?: string;
}

export interface MedicalRecord {
  employeeId: string;
  ownerUid: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyPhone: string;
  allergies: string[];
  medicalNotes: string;
  chronicConditions?: string[];
  insurancePolicyNumber?: string;
  lastUpdated: string;
}

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'PENDING' | 'ON_HOLD';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  team: string;
  domainId: string;
  domainName?: string;
  ownerName: string;
  ownerEmployeeId: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  deadline: string;
  completionPercentage: number;
  budget?: string;
}

export interface RecognitionItem {
  id: string;
  employeeId: string;
  employeeName: string;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  rank: number;
  category: string; // e.g. "AI Innovation Award", "Outstanding Delivery", "Team Excellence"
  achievement: string;
  score: number;
  year?: number;
  timeframeLabel?: string; // e.g. "August 2026", "Q2 2026", "2026"
  awardedAt?: string;
  dateAwarded?: string;
  avatarUrl?: string;
  departmentName?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  category: 'GENERAL' | 'HR' | 'EVENTS' | 'TRAINING' | 'PROJECTS' | 'POLICY';
  description: string;
  publishedDate: string;
  authorName: string;
  authorEmployeeId: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface NotificationItem {
  id: string;
  recipientUid: string;
  employeeId?: string;
  title: string;
  message: string;
  type: 'LEAVE_STATUS' | 'ANNOUNCEMENT' | 'PROJECT_ASSIGNMENT' | 'PROJECT_DEADLINE' | 'PROFILE_UPDATE' | 'COMPANY_UPDATE' | 'RECOGNITION';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  performedByUid: string;
  performedByName: string;
  performedByRole: UserRole;
  targetType: 'EMPLOYEE' | 'LEAVE' | 'PROJECT' | 'ANNOUNCEMENT' | 'RECOGNITION' | 'SECURITY';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  category: 'HARDWARE' | 'ERGONOMICS' | 'AUDIO' | 'PRODUCTIVITY' | 'WELLNESS';
  description: string;
  pricePoints: number;
  priceINR: number;
  imageUrl: string;
  rating: number;
  inStock: boolean;
  stockCount: number;
  vendor: string;
  tags: string[];
}

export interface DemoOrder {
  id: string;
  orderNumber: string;
  employeeId: string;
  employeeName: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  totalPoints: number;
  totalAmount: number;
  orderDate: string;
  status: 'DELIVERED' | 'SHIPPED' | 'PROCESSING' | 'CONFIRMED';
  shippingAddress: string;
  trackingNumber: string;
}

export interface AppointmentSlot {
  id: string;
  title: string;
  type: '1_ON_1' | 'MENTORSHIP' | 'HR_CONNECT' | 'PERFORMANCE_REVIEW';
  hostEmployeeId: string;
  hostName: string;
  hostRole: string;
  attendeeEmployeeId?: string;
  attendeeName?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location: string;
  status: 'AVAILABLE' | 'BOOKED' | 'COMPLETED';
  notes?: string;
}

