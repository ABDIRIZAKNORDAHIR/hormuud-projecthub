import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, GraduationCap, Briefcase, ChevronDown, Shield } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { HU_BRAND_GREEN } from '../config/appImages';

interface HomeNavProps {
  scrolled: boolean;
}

export function HomeNav({ scrolled }: HomeNavProps) {
  const [signInOpen, setSignInOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setSignInOpen(false);
    };
    if (signInOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [signInOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSignInOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header
      className={`welcome-nav ${scrolled ? 'is-scrolled' : ''}`}
      style={{
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
        borderBottom: `1px solid ${HU_BRAND_GREEN}20`,
        boxShadow: scrolled ? '0 4px 24px rgba(22,128,85,0.08)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <motion.div className="flex items-center min-w-0" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <BrandLogo variant="hero" />
        </motion.div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/student"
            className="nav-portal-link nav-portal-link--student sm:hidden inline-flex !px-2.5 !py-2"
            style={{ color: HU_BRAND_GREEN, borderColor: `${HU_BRAND_GREEN}35`, background: '#f0fdf4' }}
            aria-label="Student portal"
          >
            <GraduationCap size={18} />
          </Link>
          <Link
            to="/teacher"
            className="nav-portal-link sm:hidden inline-flex !px-2.5 !py-2"
            style={{ color: HU_BRAND_GREEN, borderColor: `${HU_BRAND_GREEN}35`, background: '#f0fdf4' }}
            aria-label="Teacher portal"
          >
            <Briefcase size={18} />
          </Link>
          <Link
            to="/student"
            className="nav-portal-link nav-portal-link--student hidden sm:inline-flex"
            style={{ color: HU_BRAND_GREEN, borderColor: `${HU_BRAND_GREEN}35`, background: '#f0fdf4' }}
          >
            <GraduationCap size={14} />
            Student
          </Link>
          <Link
            to="/teacher"
            className="nav-portal-link hidden sm:inline-flex"
            style={{ color: HU_BRAND_GREEN, borderColor: `${HU_BRAND_GREEN}35`, background: '#f0fdf4' }}
          >
            <Briefcase size={14} />
            Teacher
          </Link>

          <div className="relative" ref={panelRef}>
            <button
              type="button"
              className="btn-signin-top"
              aria-expanded={signInOpen}
              onClick={e => { e.stopPropagation(); setSignInOpen(o => !o); }}
            >
              <LogIn size={15} />
              Sign In
              <ChevronDown size={14} className={`transition-transform ${signInOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {signInOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden z-50 bg-white"
                  style={{ borderColor: `${HU_BRAND_GREEN}30` }}
                >
                  <div className="px-3 py-2 border-b text-[10px] font-extrabold uppercase tracking-wider text-black" style={{ borderColor: `${HU_BRAND_GREEN}15` }}>
                    Choose portal
                  </div>
                  <Link to="/student" onClick={() => setSignInOpen(false)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 transition-colors group">
                    <span className="portal-icon-badge" style={{ background: HU_BRAND_GREEN, border: 'none', color: 'white' }}>
                      <GraduationCap size={18} />
                    </span>
                    <div>
                      <p className="font-extrabold text-sm text-black group-hover:text-green-800">Sign in as Student</p>
                      <p className="text-black text-[11px] font-bold">Projects & team</p>
                    </div>
                  </Link>
                  <Link to="/teacher" onClick={() => setSignInOpen(false)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 transition-colors group border-t" style={{ borderColor: `${HU_BRAND_GREEN}12` }}>
                    <span className="portal-icon-badge" style={{ background: HU_BRAND_GREEN, border: 'none', color: 'white' }}>
                      <Briefcase size={18} />
                    </span>
                    <div>
                      <p className="font-extrabold text-sm text-black group-hover:text-green-800">Sign in as Teacher</p>
                      <p className="text-black text-[11px] font-bold">Review & approve</p>
                    </div>
                  </Link>
                  <Link to="/admin" onClick={() => setSignInOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group border-t" style={{ borderColor: `${HU_BRAND_GREEN}12` }}>
                    <Shield size={14} style={{ color: HU_BRAND_GREEN }} />
                    <p className="text-[11px] font-bold text-black/70">Staff / Admin sign-in</p>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
