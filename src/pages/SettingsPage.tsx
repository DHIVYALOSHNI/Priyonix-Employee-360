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
import { memoryCache } from '../services/cacheUtils';

export const SettingsPage: React.FC = () => {
  const { userProfile, role, isAdmin, switchDemoRole } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleResetDatabase = async () => {
    const confirm = window.confirm('Reset database to clean enterprise seed data?');
    if (!confirm) return;
    setSeeding(true);
    try {
      memoryCache.clear();
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
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase flex items-center space-x-1.5">
            <Settings size={14} />
            <span>Preferences & Security Configuration</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Settings & Security
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            Account governance, role simulation, theme settings, and Firestore database management.
          </p>
        </div>
      </section>

      {seedMessage && (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs flex items-center space-x-2 shadow-xs">
          <CheckCircle2 size={16} />
          <span>{seedMessage}</span>
        </div>
      )}

      {/* 2. ROLE SWITCHER & IDENTITY */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#047857] tracking-wider uppercase">
              AUTHENTICATION PERSONA
            </span>
            <h3 className="text-lg font-bold text-[#0B2E2E] font-display mt-0.5">
              Active Security Role
            </h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#047857] text-white shadow-xs">
            {role}
          </span>
        </div>

        <p className="text-xs text-[#656966] leading-relaxed">
          You are currently signed in as <strong className="text-[#222525]">{userProfile?.name}</strong> ({userProfile?.employeeId}).
          Use this instant switch to verify security rules and interface behavior across roles.
        </p>

        <div className="pt-2 flex items-center space-x-3">
          <button
            onClick={() => switchDemoRole('ADMIN')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isAdmin 
                ? 'bg-[#047857] text-white shadow-xs' 
                : 'bg-[#F8F6F1] text-[#222525] border border-[#E7E3D8] hover:border-[#047857]'
            }`}
          >
            Switch to Administrator (PRX-001)
          </button>
          <button
            onClick={() => switchDemoRole('EMPLOYEE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isAdmin 
                ? 'bg-[#047857] text-white shadow-xs' 
                : 'bg-[#F8F6F1] text-[#222525] border border-[#E7E3D8] hover:border-[#047857]'
            }`}
          >
            Switch to Employee (PRX-002)
          </button>
        </div>
      </section>

      {/* 3. CLOUD FIRESTORE SECURITY RULES REPORT */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={20} className="text-[#047857]" />
          <h3 className="text-lg font-bold text-[#0B2E2E] font-display">
            Zero-Trust Rule Enforcement
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#656966]">
          <div className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#E7E3D8] space-y-1">
            <span className="font-bold text-[#0B2E2E] block">1. Employee Directory Protection</span>
            <p>Directory queries only expose safe corporate contact fields. Private compensation, medical notes, and attendance are isolated in subcollections.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#E7E3D8] space-y-1">
            <span className="font-bold text-[#0B2E2E] block">2. Personal Compensation Isolation</span>
            <p>Salary documents require <code className="text-[#047857] font-mono font-bold">isOwner() || isAdmin()</code> at the database engine level, rejecting horizontal cross-employee tampering.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#E7E3D8] space-y-1">
            <span className="font-bold text-[#0B2E2E] block">3. Medical & Emergency Data</span>
            <p>Protected under healthcare privacy standards. Fictional demo records are readable solely by the authenticated individual or administrators.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#E7E3D8] space-y-1">
            <span className="font-bold text-[#0B2E2E] block">4. Audit Stream Immutability</span>
            <p>All updates to salaries, employees, leaves, and announcements append structured records to the immutable <code className="text-[#047857] font-mono font-bold">activity_logs</code> collection.</p>
          </div>
        </div>
      </section>

      {/* 4. DATABASE SEEDING UTILITY */}
      <section className="bg-white border border-[#E7E3D8] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-[#0B2E2E] font-display">
            Reset & Re-Seed Enterprise Database
          </h3>
          <p className="text-xs text-[#656966] mt-1 max-w-xl">
            Populate Firestore with 32 realistic enterprise employees across 8 domains, project initiatives, announcements, and 3-year salary progression history.
          </p>
        </div>

        <button
          onClick={handleResetDatabase}
          disabled={seeding}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition-all flex items-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <RotateCcw size={15} />
          <span>{seeding ? 'Seeding Database...' : 'Re-Seed Database'}</span>
        </button>
      </section>
    </div>
  );
};
