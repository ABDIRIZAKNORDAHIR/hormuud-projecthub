import { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, UserPlus, BookOpen, Briefcase, Shield } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { validateUniversityId, UNIVERSITY_ID_HINT, formatUniversityId } from '../utils/universityId';
import { AuthLayout } from '../components/BrandBackground';
import { AuthPortalLinks } from '../components/AuthPageShell';
import '../styles/welcome.css';
import { BrandLogo } from '../components/BrandLogo';
import { HU_BRAND_GREEN, HU_BRAND_GREEN_BRIGHT } from '../config/appImages';

type AccountRole = 'student' | 'teacher';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const accountRole: AccountRole = roleParam === 'teacher' ? 'teacher' : 'student';
  const [form, setForm] = useState({
    universityId: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', department: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const RoleIcon = accountRole === 'teacher' ? Briefcase : BookOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    const idCheck = validateUniversityId(form.universityId);
    if (!idCheck.ok) return setError(idCheck.error);
    setError('');
    setLoading(true);
    try {
      const result = await register({
        universityId: idCheck.id,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        department: form.department || undefined,
        role: accountRole,
      });
      if (result.pendingApproval) {
        setPendingMessage(result.message);
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (pendingMessage) {
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auth-card auth-card--portal text-center">
          <div className="auth-card-accent" />
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: '#f0fdf4', color: HU_BRAND_GREEN }}>
            ⏳
          </div>
          <h1 className="text-xl font-extrabold text-black">Account Pending Review</h1>
          <p className="welcome-body text-sm mt-3 leading-relaxed">{pendingMessage}</p>
          <p className="welcome-body text-xs mt-4">
            Your {accountRole} account will be reviewed. If approved, you can sign in.
          </p>
          <Link
            to={accountRole === 'teacher' ? '/teacher' : '/student'}
            className="inline-flex items-center justify-center gap-2 mt-6 px-6 py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: HU_BRAND_GREEN }}
          >
            Back to Sign In
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auth-card auth-card--portal">
        <div className="auth-card-accent" />

        <div className="mb-5">
          <BrandLogo variant="full" />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: HU_BRAND_GREEN }}>
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-black">Create Account</h1>
            <p className="welcome-body text-xs">Register with your HU ID and email</p>
          </div>
        </div>

        <div className="auth-role-badge inline-flex items-center gap-2 mb-5 mt-3">
          <RoleIcon size={14} />
          Creating {accountRole} account
        </div>

        <div className="flex items-center gap-2 welcome-body text-xs px-3 py-2.5 rounded-lg mb-4 auth-notice">
          <Shield size={14} style={{ color: HU_BRAND_GREEN, flexShrink: 0 }} />
          Accounts require university approval before first sign-in
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="auth-label">First Name</label>
              <input value={form.firstName} onChange={e => set('firstName', e.target.value)} required className="auth-input" />
            </div>
            <div>
              <label className="auth-label">Last Name</label>
              <input value={form.lastName} onChange={e => set('lastName', e.target.value)} required className="auth-input" />
            </div>
          </div>
          <div>
            <label className="auth-label">University ID</label>
            <input
              value={form.universityId}
              onChange={e => set('universityId', e.target.value)}
              placeholder="HU000-1234"
              required
              className="auth-input font-mono"
            />
            <p className="welcome-body text-[11px] mt-1">{UNIVERSITY_ID_HINT}</p>
            {form.universityId && validateUniversityId(form.universityId).ok && (
              <p className="text-[11px] mt-0.5 font-mono font-semibold" style={{ color: HU_BRAND_GREEN }}>
                {formatUniversityId(form.universityId)}
              </p>
            )}
          </div>
          <div>
            <label className="auth-label">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="auth-input" />
          </div>
          <div>
            <label className="auth-label">Department</label>
            <input value={form.department} onChange={e => set('department', e.target.value)} className="auth-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="auth-label">Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} minLength={8} required className="auth-input" />
            </div>
            <div>
              <label className="auth-label">Confirm</label>
              <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required className="auth-input" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            className="auth-submit"
            style={{ background: HU_BRAND_GREEN }}
          >
            <UserPlus size={18} />
            {loading ? 'Creating…' : `Create ${accountRole} account`}
          </motion.button>
        </form>

        <p className="text-center mt-4 welcome-body text-sm">
          Already registered?{' '}
          <Link to={accountRole === 'teacher' ? '/teacher' : '/student'} className="font-extrabold hover:underline" style={{ color: HU_BRAND_GREEN_BRIGHT }}>
            Sign in to {accountRole} portal
          </Link>
        </p>

        <AuthPortalLinks role={accountRole} />
      </motion.div>
    </AuthLayout>
  );
}
