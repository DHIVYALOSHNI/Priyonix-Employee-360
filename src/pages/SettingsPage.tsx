import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  UserRound, 
  Bell, 
  Lock, 
  Palette, 
  CheckCircle2, 
  RotateCcw,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { seedInitialDatabase } from '../services/seedService';

export const SettingsPage: React.FC = () => {
  const { userProfile, role, isAdmin, switchDemoRole } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleResetDatabase = async () => {
    const confirm = window.confirm('Reset database to clean enterprise seed data?');
    if (!confirm) return;
    setSeeding(true);
    try {
      await seedInitialDatabase(true);
      setSeedMessage('Database successfully re-seeded with 32 employees, project portfolios, and 3-year salary progression!');
    } catch (err: any) {
      setSeedMessage(`Error: ${err?.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <Settings size={14} />
            <span>Preferences & Security Configuration</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Settings & Security
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Account governance, role simulation, theme settings, and Firestore database management.
          </p>
        </div>
      </section>

      {seedMessage && (
        <div className="p-4 rounded-2xl bg-[#EBF2EE] border border-[#789B8B]/40 text-[#4F8068] text-xs flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{seedMessage}</span>
        </div>
      )}

      {/* 2. ROLE SWITCHER & IDENTITY */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#789B8B] tracking-wider uppercase">
              AUTHENTICATION PERSONA
            </span>
            <h3 className="text-lg font-bold text-[#174A4A] font-display mt-0.5">
              Active Security Role
            </h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#174A4A] text-[#F7F4ED]">
            {role}
          </span>
        </div>

        <p className="text-xs text-[#73716B] leading-relaxed">
          You are currently signed in as <strong className="text-[#30302D]">{userProfile?.name}</strong> ({userProfile?.employeeId}).
          Use this instant switch to verify security rules and interface behavior across roles.
        </p>

        <div className="pt-2 flex items-center space-x-3">
          <button
            onClick={() => switchDemoRole('ADMIN')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isAdmin 
                ? 'bg-[#174A4A] text-[#F7F4ED] shadow-xs' 
                : 'bg-[#F7F4ED] text-[#30302D] border border-[#DDD7CA] hover:border-[#174A4A]'
            }`}
          >
            Switch to Administrator (PRX-001)
          </button>
          <button
            onClick={() => switchDemoRole('EMPLOYEE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isAdmin 
                ? 'bg-[#174A4A] text-[#F7F4ED] shadow-xs' 
                : 'bg-[#F7F4ED] text-[#30302D] border border-[#DDD7CA] hover:border-[#789B8B]'
            }`}
          >
            Switch to Employee (PRX-002)
          </button>
        </div>
      </section>

      {/* 3. CLOUD FIRESTORE SECURITY RULES REPORT */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={20} className="text-[#4F8068]" />
          <h3 className="text-lg font-bold text-[#174A4A] font-display">
            Zero-Trust Rule Enforcement
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#73716B]">
          <div className="p-4 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] space-y-1">
            <span className="font-bold text-[#174A4A] block">1. Employee Directory Protection</span>
            <p>Directory queries only expose safe corporate contact fields. Private compensation, medical notes, and attendance are isolated in subcollections.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] space-y-1">
            <span className="font-bold text-[#174A4A] block">2. Personal Compensation Isolation</span>
            <p>Salary documents require <code className="text-[#174A4A] font-mono font-bold">isOwner() || isAdmin()</code> at the database engine level, rejecting horizontal cross-employee tampering.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] space-y-1">
            <span className="font-bold text-[#174A4A] block">3. Medical & Emergency Data</span>
            <p>Protected under healthcare privacy standards. Fictional demo records are readable solely by the authenticated individual or administrators.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F7F4ED] border border-[#DDD7CA] space-y-1">
            <span className="font-bold text-[#174A4A] block">4. Audit Stream Immutability</span>
            <p>All updates to salaries, employees, leaves, and announcements append structured records to the immutable <code className="text-[#174A4A] font-mono font-bold">activity_logs</code> collection.</p>
          </div>
        </div>
      </section>

      {/* 4. DATABASE SEEDING UTILITY */}
      <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#174A4A] font-display">
            Reset & Re-Seed Enterprise Database
          </h3>
          <p className="text-xs text-[#73716B] mt-1 max-w-xl">
            Populate Firestore with 32 realistic enterprise employees across 8 domains, project initiatives, announcements, and 3-year salary progression history.
          </p>
        </div>

        <button
          onClick={handleResetDatabase}
          disabled={seeding}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FAF0EE] border border-[#C97867]/40 text-[#B85C50] hover:bg-[#C97867]/20 transition-all flex items-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RotateCcw size={15} />
          <span>{seeding ? 'Seeding Database...' : 'Re-Seed Database'}</span>
        </button>
      </section>
    </div>
  );
};
