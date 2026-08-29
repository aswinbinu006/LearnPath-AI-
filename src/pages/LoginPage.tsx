import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import {
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  BrainCircuit,
  Zap,
  Code2,
  BarChart3,
  ShieldCheck,
  Star,
  XCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'ADMIN' || loggedUser?.role === 'SUPER_ADMIN') {
        navigate('/back/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await login('devashish@learnpath.ai', 'password123', true);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Demo login failed: ' + (err.message || 'Please register or try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f00f_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f00f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Main Dual-Panel Container */}
      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Side: Brand Hero Showcase */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-6 space-y-8 py-2 hidden sm:block"
        >
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">LearnPath</span>
                <span className="text-blue-600 font-extrabold text-2xl">AI</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  Enterprise
                </span>
              </div>
            </Link>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Welcome Back to Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">
                AI Workspace
              </span>
            </h1>
            
            <p className="text-base text-slate-600 leading-relaxed max-w-lg">
              Resume your structured roadmap, run AI-assisted architectural reviews, and track your engineering velocity.
            </p>
          </div>

          {/* Quick Feature Grid */}
          <div className="space-y-3 max-w-lg">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Live Workspace Sync</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seamlessly sync your active code sprints, problem history, and diagnostic assessments.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Interactive Pair Studio</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI-assisted code reviews, automated unit testing runs, and real-time guidance.
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-2 flex items-center gap-6 text-xs text-slate-500 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">12,000+ Active Engineers</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-500 font-medium">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-slate-700 font-bold ml-1">4.9/5 Rating</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          {/* Mobile Header */}
          <div className="sm:hidden text-center space-y-2 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20 font-extrabold text-2xl">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign in to LearnPath AI
            </h1>
            <p className="text-xs text-slate-500">
              Intelligent personalized roadmaps & AI mentoring
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative space-y-6">
            {/* Header */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-600" /> Member Portal
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500">
                Enter your credentials to continue to your dashboard.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2.5 shadow-xs"
              >
                <XCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                className="bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 py-2.5 rounded-xl text-base sm:text-sm min-h-[44px]"
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                className="bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 py-2.5 rounded-xl text-base sm:text-sm min-h-[44px]"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-2 cursor-pointer focus:outline-none min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 mt-2 py-3 transition-all duration-200"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            {/* Quick One-Click Demo Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleDemoLogin}
                type="button"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>⚡ One-Click Demo Sign In (Instant Access)</span>
              </button>
            </div>

            {/* Security Trust & Register Link */}
            <div className="pt-1 space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>256-bit encrypted & secure authentication</span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-1"
                  >
                    Create account →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

