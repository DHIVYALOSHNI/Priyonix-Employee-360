import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_ASSETS } from '../assets/branding';

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
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1] p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white border border-[#E7E3D8] rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: BRAND STORY & ENTERPRISE BADGE */}
        <div className="lg:col-span-6 bg-[#0B2E2E] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle organizational geometric grid pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#F8F6F1 1.5px, transparent 1.5px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10">
            {/* BRAND HEADER */}
            <div className="flex items-center space-x-3.5 mb-10">
              <img 
                src={BRAND_ASSETS.logo} 
                alt="PRIYONIX" 
                className="w-12 h-12 rounded-2xl object-contain bg-white p-1 shadow-md border border-white/20 shrink-0" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white font-display">
                  PRIYONIX Employee 360
                </h1>
                <p className="text-xs font-semibold text-[#34D399] tracking-widest uppercase">
                  AI-Powered Enterprise Workforce Platform
                </p>
              </div>
            </div>

            {/* EDITORIAL HERO COPY */}
            <div className="space-y-4 max-w-md">
              <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#047857]/40 text-[#A7F3D0] text-xs font-semibold border border-[#047857]">
                <ShieldCheck size={14} />
                <span>Enterprise Zero-Trust Security</span>
              </span>
              <h2 className="text-2xl md:text-3xl font-normal leading-snug font-display text-white">
                One secure workspace for your working life.
              </h2>
              <p className="text-sm text-[#D1E0DE] leading-relaxed font-normal">
                Manage employee information, workforce operations, attendance, leave, and company updates in one unified, protected platform.
              </p>
            </div>
          </div>

          {/* HIGHLIGHTED ENTERPRISE FEATURES */}
          <div className="mt-12 pt-8 border-t border-[#133E3E] relative z-10 space-y-3">
            <div className="flex items-center space-x-3 text-xs text-[#E0EBE9]">
              <CheckCircle2 size={16} className="text-[#34D399] shrink-0" />
              <span>Full-Stack Role-Based Access Control (RBAC)</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[#E0EBE9]">
              <CheckCircle2 size={16} className="text-[#34D399] shrink-0" />
              <span>Encrypted Salary, Hike & Medical Records Isolation</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[#E0EBE9]">
              <CheckCircle2 size={16} className="text-[#34D399] shrink-0" />
              <span>Database-Driven Workforce & Domain Analytics</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM & DEMO CONTROLS */}
        <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="flex items-center space-x-3">
              <img 
                src={BRAND_ASSETS.logo} 
                alt="PRIYONIX Logo" 
                className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-[#DDD7CA] shadow-xs shrink-0" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-xl font-bold text-[#0B2E2E] font-display">
                  PRIYONIX Employee 360
                </h3>
                <p className="text-xs text-[#656966] mt-0.5">
                  Sign in to access your enterprise workspace
                </p>
              </div>
            </div>

            {/* ERROR BANNER */}
            {(localError || error) && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#F87171]/40 text-[#B91C1C] text-xs flex items-start space-x-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-semibold block">{localError || error}</span>
                  {(error && error.includes('auth/operation-not-allowed')) && (
                    <div className="mt-2 pt-2 border-t border-[#F87171]/30 text-[11px] text-[#222525] space-y-1">
                      <p className="font-bold text-[#0B2E2E]">Firebase Console Action Required:</p>
                      <p>
                        Enable <strong>Email/Password</strong> under <em>Authentication &gt; Sign-in method</em> in the Firebase Console.
                      </p>
                      <a
                        href="https://console.firebase.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-[#047857] font-bold underline mt-1"
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
              <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs flex items-start space-x-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>Password reset link sent to your registered email address.</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {!showForgotPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1.5">
                    Employee ID
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716B]" />
                    <input
                      type="text"
                      placeholder="PRX-001"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8F6F1] border border-[#DDD7CA] rounded-xl text-[#222525] placeholder-[#73716B] focus:outline-hidden focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#222525]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-semibold text-[#047857] hover:underline cursor-pointer"
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
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8F6F1] border border-[#DDD7CA] rounded-xl text-[#222525] placeholder-[#73716B] focus:outline-hidden focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="w-full py-3 px-6 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  <span>{submitting ? 'Authenticating with Firebase...' : 'Sign In to Workspace'}</span>
                  <ArrowRight size={16} />
                </button>

                {/* DEMO MODE BANNER */}
                <div className="p-2.5 rounded-xl bg-[#F8F6F1] border border-[#DDD7CA] text-center">
                  <p className="text-[11px] font-medium text-[#656966]">
                    Demo Mode — Enterprise credentials for evaluation
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1.5">
                    Enter your Employee ID or Email
                  </label>
                  <input
                    type="text"
                    placeholder="PRX-001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-[#F8F6F1] border border-[#DDD7CA] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                    required
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#047857] text-white text-xs font-bold cursor-pointer hover:bg-[#065F46]"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="py-2.5 px-4 rounded-xl bg-[#F8F6F1] text-[#222525] text-xs font-semibold hover:bg-[#DDD7CA] cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            {/* INSTANT DEMO ACCOUNTS FOR EVALUATION */}
            <div className="pt-6 border-t border-[#E7E3D8]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#656966] uppercase tracking-wider">
                  Test Credentials (1-Click Fill)
                </span>
                <span className="text-[10px] text-[#047857] font-semibold">Ready for Reviewers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('PRX-001', 'PrionixDemo2025!')}
                  className="p-2.5 rounded-xl bg-[#F8F6F1] border border-[#DDD7CA] hover:border-[#047857] text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B2E2E] group-hover:underline">
                      Admin Persona
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#047857] text-white font-bold">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-[#222525] mt-1 font-medium">Siddharth Rao (PRX-001)</p>
                  <p className="text-[10px] text-[#656966]">Full company & analytics access</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('PRX-002', 'PrionixDemo2025!')}
                  className="p-2.5 rounded-xl bg-[#F8F6F1] border border-[#DDD7CA] hover:border-[#047857] text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B2E2E] group-hover:underline">
                      Employee Persona
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#ECFDF5] text-[#047857] border border-[#047857]/30 font-bold">
                      EMPLOYEE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#222525] mt-1 font-medium">Devika Krishnan (PRX-002)</p>
                  <p className="text-[10px] text-[#656966]">Restricted private 360 profile</p>
                </button>
              </div>

              <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-[#656966]">
                <Info size={13} className="shrink-0 text-[#047857]" />
                <span>Password for demo accounts: <strong className="text-[#222525]">PrionixDemo2025!</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

