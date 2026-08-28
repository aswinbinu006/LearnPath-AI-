import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, Lock, Mail, AlertCircle, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { adminService } from '../services/adminService.js';
import { useAuth } from '../contexts/AuthContext.js';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser, user, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as admin, redirect to admin dashboard
  React.useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      navigate('/back/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleFillDemo = () => {
    setEmail('admin@learnpath.ai');
    setPassword('password123');
    setSecurityCode('HCL-ADMIN-2026');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide your admin email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminService.login({
        email: email.trim(),
        password,
        securityCode: securityCode.trim() || undefined,
      });

      if (res.success) {
        await refreshUser();
        navigate('/back/dashboard', { replace: true });
      } else {
        setError(res.message || 'Authentication failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrative credentials.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enterprise Governance & Security</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Admin Control Center
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Authorized administrative access & security verification
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Quick autofill helper box */}
        <div className="mb-4 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-4 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Admin Demo Credentials</p>
              <p className="text-[11px] text-indigo-300 font-mono">admin@learnpath.ai • HCL-ADMIN-2026</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Auto-Fill
          </button>
        </div>


        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-800">
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-3 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@learnpath.ai"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Security Code Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Master Security Access Code
                </label>
                <span className="text-[10px] text-slate-500 font-mono">2FA Required</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  placeholder="HCL-ADMIN-2026"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-indigo-900/60 rounded-xl text-sm font-mono text-indigo-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tracking-wider transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>LearnPath AI v2.4 Enterprise</span>
            <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              Learner Login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
