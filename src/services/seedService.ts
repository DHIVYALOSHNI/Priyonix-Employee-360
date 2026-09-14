import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  DEPARTMENTS_DATA, 
  DOMAINS_DATA, 
  EMPLOYEES_DATA, 
  PROJECTS_DATA, 
  RECOGNITIONS_DATA, 
  ANNOUNCEMENTS_DATA, 
  DEMO_SALARY_DATA, 
  DEMO_MEDICAL_DATA, 
  DEMO_LEAVES_DATA,
  MARKETPLACE_PRODUCTS_DATA,
  DEMO_ORDERS_DATA,
  APPOINTMENT_SLOTS_DATA,
  NOTIFICATIONS_DATA
} from './seedData';
import { generateDemoMonthAttendance } from './attendanceService';

class BatchWriter {
  private batch = writeBatch(db);
  private count = 0;
  private maxPerBatch = 350;

  async set(ref: any, data: any) {
    this.batch.set(ref, data, { merge: true });
    this.count++;
    if (this.count >= this.maxPerBatch) {
      await this.batch.commit();
      this.batch = writeBatch(db);
      this.count = 0;
    }
  }

  async commit() {
    if (this.count > 0) {
      await this.batch.commit();
      this.batch = writeBatch(db);
      this.count = 0;
    }
  }
}

export const seedDatabaseIfEmpty = async (force = false): Promise<{ seeded: boolean; message: string }> => {
  try {
    const productsSnap = await getDocs(collection(db, 'marketplaceProducts'));
    const employeesSnap = await getDocs(collection(db, 'employees'));
    const ordersSnap = await getDocs(collection(db, 'orders'));

    const needsSeeding = force || 
      employeesSnap.size < 30 || 
      productsSnap.size < 20 || 
      ordersSnap.size < 15;

    if (!needsSeeding) {
      return { seeded: false, message: 'Database is already fully populated with enterprise records.' };
    }

    console.log('Seeding Prionix Employee 360 database with enterprise datasets (Batch Mode)...');
    const writer = new BatchWriter();

    // 1. Seed Departments (8 departments)
    for (const dept of DEPARTMENTS_DATA) {
      await writer.set(doc(db, 'departments', dept.id), dept);
    }

    // 2. Seed Domains (9 domains)
    for (const domain of DOMAINS_DATA) {
      await writer.set(doc(db, 'domains', domain.id), domain);
    }

    // 3. Seed Employees (32 employees across 8 departments)
    for (const emp of EMPLOYEES_DATA) {
      await writer.set(doc(db, 'employees', emp.employeeId), emp);
    }

    // 4. Seed Projects (10 projects)
    for (const proj of PROJECTS_DATA) {
      await writer.set(doc(db, 'projects', proj.id), proj);
    }

    // 5. Seed Recognitions (9 items)
    for (const rec of RECOGNITIONS_DATA) {
      await writer.set(doc(db, 'recognition', rec.id), rec);
    }

    // 6. Seed Announcements (8 items across all categories)
    for (const ann of ANNOUNCEMENTS_DATA) {
      await writer.set(doc(db, 'announcements', ann.id), ann);
    }

    // 7. Seed Leaves (12 records)
    for (const lv of DEMO_LEAVES_DATA) {
      await writer.set(doc(db, 'leaves', lv.id), lv);
    }

    // 8. Seed Salary History for demo employees
    for (const [, records] of Object.entries(DEMO_SALARY_DATA)) {
      for (const rec of records) {
        await writer.set(doc(db, 'salaryHistory', rec.id), rec);
      }
    }

    // 9. Seed Medical Records
    for (const [empId, rec] of Object.entries(DEMO_MEDICAL_DATA)) {
      await writer.set(doc(db, 'medicalRecords', empId), rec);
    }

    // 10. Seed Attendance (30+ days for key employees)
    const attList = [
      ...generateDemoMonthAttendance('PRX-002', 'employee-uid-demo', 2026, 8),
      ...generateDemoMonthAttendance('PRX-002', 'employee-uid-demo', 2026, 9),
      ...generateDemoMonthAttendance('PRX-001', 'admin-uid-demo', 2026, 8),
      ...generateDemoMonthAttendance('PRX-001', 'admin-uid-demo', 2026, 9),
      ...generateDemoMonthAttendance('PRX-003', 'vikram-uid', 2026, 9),
    ];
    for (const att of attList) {
      await writer.set(doc(db, 'attendance', att.id), att);
    }

    // 11. Seed Marketplace Products (exactly 20 products)
    for (const prod of MARKETPLACE_PRODUCTS_DATA) {
      await writer.set(doc(db, 'marketplaceProducts', prod.id), prod);
    }

    // 12. Seed Demo Orders (exactly 15 orders)
    for (const ord of DEMO_ORDERS_DATA) {
      await writer.set(doc(db, 'orders', ord.id), ord);
    }

    // 13. Seed Appointment Slots (16 slots)
    for (const slot of APPOINTMENT_SLOTS_DATA) {
      await writer.set(doc(db, 'appointmentSlots', slot.id), slot);
    }

    // 14. Seed Notifications (15 notifications)
    for (const notif of NOTIFICATIONS_DATA) {
      await writer.set(doc(db, 'notifications', notif.id), notif);
    }

    // Commit any remaining writes
    await writer.commit();

    return { 
      seeded: true, 
      message: 'Prionix Enterprise database successfully populated with 32 employees, 20 products, 15 orders, appointments, attendance, and all operational records.' 
    };
  } catch (err: any) {
    console.warn('Seeding notice (partial write or offline):', err);
    return { seeded: false, message: err?.message || 'Seeding skipped or completed.' };
  }
};

export const seedInitialDatabase = async (force = false): Promise<{ seeded: boolean; message: string }> => {
  return seedDatabaseIfEmpty(force);
};

