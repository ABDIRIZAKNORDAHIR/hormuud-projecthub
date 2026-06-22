import { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, BookOpen, Briefcase, Lock, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { BrandLogo } from '../components/BrandLogo';
import { HU_BRAND_GREEN } from '../config/appImages';
import { AuthLayout } from '../components/BrandBackground';
import { AuthPortalLinks } from '../components/AuthPageShell';
import '../styles/welcome.css';

type PortalRole = 'student' | 'teacher' | 'admin';

const config: Record<PortalRole, {
  title: string;
  subtitle: string;
  signInLabel: string;
  icon: typeof BookOpen;
  badge: string;
  canRegister: boolean;
}> = {
  student: {
    title: 'Student Sign In',
    subtitle: 'Use your HU ID and email to access projects, teams, and submissions.',
    signInLabel: 'Sign in as Student',
    icon: BookOpen,
    badge: 'Student Portal',
    canRegister: true,
  },
  teacher: {
    title: 'Teacher Sign In',
    subtitle: 'Use your HU ID and email to review and approve student projects.',
    signInLabel: 'Sign in as Teacher',
    icon: Briefcase,
    badge: 'Teacher Portal',
    canRegister: true,
  },
  admin: {
    title: 'Admin Sign In',
    subtitle: 'Authorized Hormuud University personnel only.',
    signInLabel: 'Sign in as Admin',
    icon: Lock,
    badge: 'Admin Portal',
    canRegister: false,
  },
};

export function RolePortalPage({ role }: { role: PortalRole }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const cfg = config[role];
  const Icon = cfg.icon;
  const isAdmin = role === 'admin';

  const [universityId, setUniversityId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingApproval(false);
    setLoading(true);
    try {
      await login(isAdmin ? undefined : universityId, email, password, role);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'pending_approval') {
        setPendingApproval(true);
        setError('');
      } else {
        setPendingApproval(false);
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="auth-card auth-card--portal"
      >
        <div className="auth-card-accent" />

        <div className="mb-5">
          <BrandLogo variant="full" />
        </div>

        <span className="auth-role-badge">{cfg.badge}</span>

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mt-4 shadow-md"
          style={{ background: HU_BRAND_GREEN }}
        >
          <Icon size={26} className="text-white" />
        </div>

        <h1 className="text-2xl font-extrabold text-black">{cfg.title}</h1>
        <p className="welcome-body text-sm mt-2 leading-relaxed">{cfg.subtitle}</p>

        {!isAdmin && (
          <div className="mt-4 flex items-center gap-2 welcome-body text-xs px-3 py-2.5 rounded-lg auth-notice">
            <Shield size={14} style={{ color: HU_BRAND_GREEN, flexShrink: 0 }} />
            Secure login with your Hormuud University credentials
          </div>
        )}

        {isAdmin && (
          <div className="mt-4 flex items-center gap-2 welcome-body text-xs px-3 py-2.5 rounded-lg auth-notice auth-notice--admin">
            <Lock size={14} style={{ color: HU_BRAND_GREEN, flexShrink: 0 }} />
            Restricted access — authorized administrators only
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {!isAdmin && (
            <div>
              <label className="auth-label">University ID (HU000)</label>
              <input
                value={universityId}
                onChange={e => setUniversityId(e.target.value)}
                placeholder="HU000-1234"
                className="auth-input"
                autoComplete="username"
                required
              />
            </div>
          )}
          <div>
            <label className="auth-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={isAdmin ? 'admin@hu.edu' : 'you@hu.edu'}
              className="auth-input"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="auth-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input pr-16"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-black hover:text-green-800"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {pendingApproval && (
            <div className="rounded-xl border-2 px-4 py-4 space-y-2" style={{ borderColor: `${HU_BRAND_GREEN}40`, background: '#f0fdf4' }}>
              <p className="font-extrabold text-sm text-black">Account pending approval</p>
              <p className="welcome-body text-sm">
                Your registration was received. An administrator must approve your account before you can sign in.
              </p>
              <p className="welcome-body text-xs">
                Contact your department if approval takes longer than expected.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-700 font-bold bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">{error}</p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="auth-submit"
            style={{ background: HU_BRAND_GREEN }}
          >
            <LogIn size={18} />
            {loading ? 'Signing in…' : cfg.signInLabel}
          </motion.button>
        </form>

        {cfg.canRegister && (
          <Link to={`/register?role=${role}`} className="auth-secondary">
            <UserPlus size={18} />
            Create new {role} account
          </Link>
        )}

        <AuthPortalLinks role={role} />
      </motion.div>
    </AuthLayout>
  );
}
