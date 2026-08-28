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
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-950/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

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
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25 border border-blue-400/30 group-hover:scale-105 transition-transform duration-200">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-2xl tracking-tight text-white">LearnPath</span>
                <span className="text-blue-500 font-extrabold text-2xl">AI</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  v2.0
                </span>
              </div>
            </Link>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Welcome Back to Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
                AI Workspace
              </span>
            </h1>
            
            <p className="text-base text-neutral-400 leading-relaxed max-w-lg">
              Resume your structured roadmap, run AI-assisted architectural reviews, and track your engineering velocity.
            </p>
          </div>

          {/* Quick Feature Grid */}
          <div className="space-y-3 max-w-lg">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md hover:border-neutral-700/80 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Live Workspace Sync</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Seamlessly sync your active code sprints, problem history, and diagnostic assessments.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md hover:border-neutral-700/80 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Interactive Pair Studio</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  AI-assisted code reviews, automated unit testing runs, and real-time guidance.
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-2 flex items-center gap-6 text-xs text-neutral-400 border-t border-neutral-800/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">12,000+ Active Engineers</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-slate-300 font-bold ml-1">4.9/5 Rating</span>
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
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20 font-extrabold text-2xl">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Sign in to LearnPath AI
            </h1>
            <p className="text-xs text-neutral-400">
              Intelligent personalized roadmaps & AI mentoring
            </p>
          </div>

          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative space-y-6">
            {/* Header */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-400" /> Member Portal
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight pt-1">
                Welcome Back
              </h2>
              <p className="text-xs text-neutral-400">
                Enter your credentials to continue to your dashboard.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs font-semibold text-red-300 flex items-start gap-2.5 shadow-sm"
              >
                <XCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
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
                leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
                className="bg-neutral-950/80 border-neutral-800 focus:border-blue-500 focus:ring-blue-500/30 text-white placeholder:text-neutral-500 py-2.5 rounded-xl text-sm"
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-neutral-400" />}
                className="bg-neutral-950/80 border-neutral-800 focus:border-blue-500 focus:ring-blue-500/30 text-white placeholder:text-neutral-500 py-2.5 rounded-xl text-sm"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-200 transition-colors p-1 cursor-pointer focus:outline-none"
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
                className="w-full font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/25 mt-2 py-3 transition-all duration-200"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            {/* Quick One-Click Demo Button */}
            <div className="pt-3 border-t border-neutral-800/80">
              <button
                onClick={handleDemoLogin}
                type="button"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 text-blue-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ One-Click Demo Sign In (Instant Access)</span>
              </button>
            </div>

            {/* Security Trust & Register Link */}
            <div className="pt-1 space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>256-bit encrypted & secure authentication</span>
              </div>

              <div className="border-t border-neutral-800/80 pt-4">
                <p className="text-xs text-neutral-400">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors ml-1"
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

