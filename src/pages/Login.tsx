import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resetPassword, loading, error } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanId = identifier.trim().toUpperCase();
    if (!cleanId) {
      setLocalError('Please enter your Employee ID.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    const success = await login(cleanId, password);
    setSubmitting(false);

    if (success) {
      const from = (location.state as any)?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        if (cleanId === 'PRX-ADMIN' || cleanId === 'PRX-001') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }
    }
  };

  const handleQuickLogin = async (empId: string, pass: string) => {
    setIdentifier(empId);
    setPassword(pass);
    setSubmitting(true);
    const success = await login(empId, pass);
    setSubmitting(false);
    if (success) {
      if (empId === 'PRX-ADMIN' || empId === 'PRX-001') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setLocalError('Please enter your Employee ID or corporate email to receive password reset instructions.');
      return;
    }
    const sent = await resetPassword(identifier.trim());
    if (sent) {
      setResetSent(true);
      setLocalError(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4ED] p-4 md:p-8">
      <div className="w-full max-w-5xl bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: BRAND STORY & ENTERPRISE BADGE */}
        <div className="lg:col-span-6 bg-[#174A4A] p-8 md:p-12 text-[#F7F4ED] flex flex-col justify-between relative overflow-hidden">
          {/* Subtle organizational geometric grid pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#F7F4ED 1.5px, transparent 1.5px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10">
            {/* BRAND HEADER */}
            <div className="flex items-center space-x-3 mb-10">
              <div className="w-11 h-11 rounded-2xl bg-[#789B8B] text-[#174A4A] flex items-center justify-center font-bold text-xl font-display shadow-sm">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#F7F4ED] font-display">
                  PRIONIX Employee 360
                </h1>
                <p className="text-xs font-semibold text-[#789B8B] tracking-widest uppercase">
                  AI-Powered Enterprise Workforce Platform
                </p>
              </div>
            </div>

            {/* EDITORIAL HERO COPY */}
            <div className="space-y-4 max-w-md">
              <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#789B8B]/20 text-[#789B8B] text-xs font-semibold border border-[#789B8B]/30">
                <ShieldCheck size={14} />
                <span>Enterprise Zero-Trust Security</span>
              </span>
              <h2 className="text-2xl md:text-3xl font-normal leading-snug font-display text-[#F7F4ED]">
                One secure workspace for your working life.
              </h2>
              <p className="text-sm text-[#EFEAE0]/80 leading-relaxed font-normal">
                Manage employee information, workforce operations, attendance, leave, and company updates in one unified, protected platform.
              </p>
            </div>
          </div>

          {/* HIGHLIGHTED ENTERPRISE FEATURES */}
          <div className="mt-12 pt-8 border-t border-[#789B8B]/30 relative z-10 space-y-3">
            <div className="flex items-center space-x-3 text-xs text-[#EFEAE0]/90">
              <CheckCircle2 size={16} className="text-[#789B8B] shrink-0" />
              <span>Full-Stack Role-Based Access Control (RBAC)</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[#EFEAE0]/90">
              <CheckCircle2 size={16} className="text-[#789B8B] shrink-0" />
              <span>Encrypted Salary, Hike & Medical Records Isolation</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[#EFEAE0]/90">
              <CheckCircle2 size={16} className="text-[#789B8B] shrink-0" />
              <span>Database-Driven Workforce & Domain Analytics</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM & DEMO CONTROLS */}
        <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-[#F7F4ED]">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#174A4A] font-display">
                PRIONIX Employee 360
              </h3>
              <p className="text-xs text-[#73716B] mt-1">
                AI-Powered Enterprise Workforce Platform
              </p>
            </div>

            {/* ERROR BANNER */}
            {(localError || error) && (
              <div className="p-3.5 rounded-xl bg-[#FAF0EE] border border-[#C97867]/30 text-[#B85C50] text-xs flex items-start space-x-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-semibold block">{localError || error}</span>
                  {(error && error.includes('auth/operation-not-allowed')) && (
                    <div className="mt-2 pt-2 border-t border-[#C97867]/20 text-[11px] text-[#30302D] space-y-1">
                      <p className="font-bold text-[#174A4A]">Firebase Console Action Required:</p>
                      <p>
                        Enable <strong>Email/Password</strong> under <em>Authentication &gt; Sign-in method</em> in the Firebase Console for project <code className="bg-[#EFEAE0] px-1 rounded font-mono">fourth-trees-dnm9t</code>.
                      </p>
                      <a
                        href="https://console.firebase.google.com/project/fourth-trees-dnm9t/authentication/providers"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-[#174A4A] font-bold underline mt-1"
                      >
                        <span>Open Firebase Auth Providers Console</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RESET PASSWORD SUCCESS */}
            {resetSent && (
              <div className="p-3.5 rounded-xl bg-[#EBF2EE] border border-[#789B8B]/40 text-[#4F8068] text-xs flex items-start space-x-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>Password reset link sent to your registered email address.</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {!showForgotPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1.5">
                    Employee ID
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716B]" />
                    <input
                      type="text"
                      placeholder="PRX-001"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] placeholder-[#73716B] focus:outline-hidden focus:border-[#174A4A] focus:ring-1 focus:ring-[#174A4A] transition-all uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#30302D]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-semibold text-[#174A4A] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716B]" />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] placeholder-[#73716B] focus:outline-hidden focus:border-[#174A4A] focus:ring-1 focus:ring-[#174A4A] transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="w-full py-3 px-6 rounded-xl bg-[#174A4A] hover:bg-[#123B3B] text-[#F7F4ED] font-bold text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  <span>{submitting ? 'Authenticating with Firebase...' : 'Sign In to Workspace'}</span>
                  <ArrowRight size={16} />
                </button>

                {/* DEMO MODE BANNER */}
                <div className="p-2.5 rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] text-center">
                  <p className="text-[11px] font-medium text-[#73716B]">
                    Demo Mode — Fictional credentials for evaluation only
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1.5">
                    Enter your Employee ID or Email
                  </label>
                  <input
                    type="text"
                    placeholder="PRX-001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D] focus:outline-hidden focus:border-[#174A4A]"
                    required
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#174A4A] text-[#F7F4ED] text-xs font-bold cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="py-2.5 px-4 rounded-xl bg-[#EFEAE0] text-[#30302D] text-xs font-semibold hover:bg-[#DDD7CA] cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            {/* INSTANT DEMO ACCOUNTS FOR EVALUATION */}
            <div className="pt-6 border-t border-[#DDD7CA]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#73716B] uppercase tracking-wider">
                  Test Credentials (1-Click Fill)
                </span>
                <span className="text-[10px] text-[#789B8B] font-semibold">Ready for Reviewers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('PRX-001', 'PrionixDemo2025!')}
                  className="p-2.5 rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] hover:border-[#174A4A] text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#174A4A] group-hover:underline">
                      Admin Persona
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#174A4A] text-[#F7F4ED] font-bold">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-[#30302D] mt-1 font-medium">Siddharth Rao (PRX-001)</p>
                  <p className="text-[10px] text-[#73716B]">Full company & analytics access</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('PRX-002', 'PrionixDemo2025!')}
                  className="p-2.5 rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] hover:border-[#789B8B] text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#174A4A] group-hover:underline">
                      Employee Persona
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#789B8B]/30 text-[#174A4A] font-bold">
                      EMPLOYEE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#30302D] mt-1 font-medium">Devika Krishnan (PRX-002)</p>
                  <p className="text-[10px] text-[#73716B]">Restricted private 360 profile</p>
                </button>
              </div>

              <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-[#73716B]">
                <Info size={13} className="shrink-0 text-[#789B8B]" />
                <span>Password for demo accounts: <strong className="text-[#30302D]">PrionixDemo2025!</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
