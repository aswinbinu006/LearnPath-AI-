import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  Zap,
  Code2,
  BarChart3,
  Check,
  Star,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength evaluation
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: password.length >= 8,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.hasMinLength) score++;
    if (passwordCriteria.hasUpperLower) score++;
    if (passwordCriteria.hasNumber) score++;
    if (passwordCriteria.hasSpecial) score++;
    return score;
  }, [passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (!password) return { text: '', color: 'bg-neutral-800', textColor: 'text-neutral-500' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' };
    if (strengthScore <= 3) return { text: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-400' };
    return { text: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  }, [password, strengthScore]);

  const isPasswordMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (strengthScore < 2) {
      setError('Please choose a stronger password with at least 8 characters including numbers and letters.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password });
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-950/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Dual-Panel Container */}
      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Side: Brand Showcase & Interactive Feature Highlights */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-6 space-y-8 py-2 hidden sm:block"
        >
          {/* Brand Logo & Tagline */}
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
              Master Modern Engineering with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
                AI Precision
              </span>
            </h1>
            
            <p className="text-base text-neutral-400 leading-relaxed max-w-lg">
              Personalized career roadmaps, real-time code mentoring, and adaptive diagnostic benchmarks tailored for ambitious developers.
            </p>
          </div>

          {/* Feature Highlights Cards */}
          <div className="space-y-3 max-w-lg">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md hover:border-neutral-700/80 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Adaptive AI Roadmaps</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Dynamic milestone graphs tailored to your current experience and dream engineering role.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md hover:border-neutral-700/80 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">AI Pair Programming Studio</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Get AST diagnostics, architectural refactoring, and instant unit test validations in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md hover:border-neutral-700/80 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Skill Diagnostic Benchmarks</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Calibrated assessments that reveal hidden blind spots and certify real-world competencies.
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof & Metrics */}
          <div className="pt-2 flex items-center gap-6 text-xs text-neutral-400 border-t border-neutral-800/80">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-[#090a0f] flex items-center justify-center text-[10px] font-bold text-white">
                  JD
                </div>
                <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-[#090a0f] flex items-center justify-center text-[10px] font-bold text-white">
                  SK
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-[#090a0f] flex items-center justify-center text-[10px] font-bold text-white">
                  AL
                </div>
              </div>
              <span className="font-semibold text-slate-200">12,000+ Engineers</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-slate-300 font-bold ml-1">4.9/5</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Registration Glassmorphic Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          {/* Mobile-only Top Brand Header */}
          <div className="sm:hidden text-center space-y-2 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20 font-extrabold text-2xl">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-xs text-neutral-400">
              Join thousands of developers mastering engineering skills with AI.
            </p>
          </div>

          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative space-y-6">
            {/* Card Header */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-400" /> Get Started Free
                </span>
                <span className="text-xs text-neutral-500 font-medium">No credit card required</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight pt-1">
                Create Account
              </h2>
              <p className="text-xs text-neutral-400">
                Start your tailored engineering journey in less than 2 minutes.
              </p>
            </div>

            {/* Error Message */}
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                leftIcon={<User className="w-4 h-4 text-neutral-400" />}
                className="bg-neutral-950/80 border-neutral-800 focus:border-blue-500 focus:ring-blue-500/30 text-white placeholder:text-neutral-500 py-2.5 rounded-xl text-sm"
                required
              />

              {/* Email Address */}
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

              {/* Password */}
              <div className="space-y-1.5">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 pt-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-400">
                        Password strength:
                      </span>
                      <span className={`font-bold ${strengthLabel.textColor}`}>
                        {strengthLabel.text}
                      </span>
                    </div>

                    {/* Strength Bars */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 1 ? strengthLabel.color : 'bg-transparent'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 2 ? strengthLabel.color : 'bg-transparent'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 3 ? strengthLabel.color : 'bg-transparent'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 4 ? strengthLabel.color : 'bg-transparent'}`} />
                    </div>

                    {/* Criteria Checklist — Responsive 1-col on mobile, 2-col on sm */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {passwordCriteria.hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0" />}
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpperLower ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {passwordCriteria.hasUpperLower ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0" />}
                        <span>Upper & lowercase</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {passwordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0" />}
                        <span>At least 1 number</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {passwordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0" />}
                        <span>Special symbol (!@#)</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  leftIcon={<Lock className="w-4 h-4 text-neutral-400" />}
                  className="bg-neutral-950/80 border-neutral-800 focus:border-blue-500 focus:ring-blue-500/30 text-white placeholder:text-neutral-500 py-2.5 rounded-xl text-base sm:text-sm"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-neutral-400 hover:text-neutral-200 transition-colors p-2 cursor-pointer focus:outline-none min-h-[36px] min-w-[36px] flex items-center justify-center"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />

                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-medium mt-1">
                    {isPasswordMatch ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-blue-500/40 cursor-pointer"
                    required
                  />
                  <span className="text-xs text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                    I agree to the{' '}
                    <span className="font-semibold text-blue-400 hover:underline underline-offset-2">
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="font-semibold text-blue-400 hover:underline underline-offset-2">
                      Privacy Policy
                    </span>
                    .
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/25 mt-2 py-3 transition-all duration-200"
                isLoading={isLoading}
                disabled={!agreeTerms || (confirmPassword.length > 0 && !isPasswordMatch)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>

            {/* Footer Trust & Sign In Link */}
            <div className="pt-2 space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>256-bit AES encrypted & verified authentication</span>
              </div>

              <div className="border-t border-neutral-800/80 pt-4">
                <p className="text-xs text-neutral-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors ml-1"
                  >
                    Sign in here →
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

