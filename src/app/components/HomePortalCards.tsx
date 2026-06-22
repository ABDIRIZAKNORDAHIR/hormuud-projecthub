import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import {
  GraduationCap, Briefcase, ArrowRight,
  Users, MessageSquare, FolderKanban,
  ClipboardCheck, Sparkles, Bot, ShieldCheck,
} from 'lucide-react';
import { HU_BRAND_GREEN } from '../config/appImages';

const studentFeatures = [
  { icon: FolderKanban, label: 'Projects' },
  { icon: Users, label: 'Team invites' },
  { icon: MessageSquare, label: 'Chat' },
];

const teacherFeatures = [
  { icon: Bot, label: 'AI review' },
  { icon: ClipboardCheck, label: 'Approve' },
  { icon: Sparkles, label: 'Feedback' },
];

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), { stiffness: 200, damping: 22 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

export function HomePortalCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <TiltCard>
          <Link to="/student" className="portal-student-hero block group min-h-[260px] sm:min-h-[300px]">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="portal-icon-badge">
                  <GraduationCap size={24} className="text-white" />
                </span>
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Student Portal</span>
              </div>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                Sign in as Student
              </h2>
              <p className="text-white/85 mt-4 text-sm sm:text-base max-w-md leading-relaxed">
                Propose projects, invite classmates by HU ID, chat with your team, and submit to your teacher.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {studentFeatures.map(({ icon: Icon, label }) => (
                  <span key={label} className="portal-feature-chip">
                    <Icon size={13} />
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-2 text-white font-bold text-lg group-hover:gap-3 transition-all">
                Enter student portal
                <ArrowRight size={22} />
              </div>
            </div>
            <div
              className="absolute bottom-0 right-0 w-32 h-32 sm:w-40 sm:h-40 rounded-full opacity-20 pointer-events-none"
              style={{ background: 'white', transform: 'translate(25%, 25%)' }}
            />
          </Link>
        </TiltCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <TiltCard>
          <Link
            to="/teacher"
            className="portal-teacher-card block group min-h-[260px] sm:min-h-[300px] h-full"
            style={{ borderColor: `${HU_BRAND_GREEN}40` }}
          >
            <div className="flex items-center gap-3 mb-5">
              <span
                className="portal-icon-badge"
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: HU_BRAND_GREEN }}
              >
                <Briefcase size={22} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: HU_BRAND_GREEN }}>
                Teacher Portal
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-black">
              Sign in as Teacher
            </h2>
            <p className="portal-desc mt-4 text-sm sm:text-base max-w-md leading-relaxed">
              Review student projects, run AI checks, approve submissions, and send feedback.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {teacherFeatures.map(({ icon: Icon, label }) => (
                <span key={label} className="portal-feature-chip">
                  <Icon size={12} />
                  {label}
                </span>
              ))}
            </div>
            <div
              className="mt-8 flex items-center gap-2 font-extrabold text-lg text-black group-hover:gap-3 transition-all"
            >
              Log in as Teacher
              <ArrowRight size={20} />
            </div>
          </Link>
        </TiltCard>
      </motion.div>

      <motion.div
        className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        {[
          { icon: ShieldCheck, title: 'Secure HU ID login', text: 'Every account tied to your university ID.' },
          { icon: Users, title: 'Team collaboration', text: 'Invite classmates and work together.' },
          { icon: ClipboardCheck, title: 'Teacher workflow', text: 'Submit, review, and approve in one place.' },
        ].map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="portal-info-card rounded-xl p-4 border-2 bg-white"
            style={{ borderColor: `${HU_BRAND_GREEN}25` }}
          >
            <Icon size={20} style={{ color: HU_BRAND_GREEN }} className="mb-2" />
            <p className="portal-info-title">{title}</p>
            <p className="portal-info-text">{text}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
