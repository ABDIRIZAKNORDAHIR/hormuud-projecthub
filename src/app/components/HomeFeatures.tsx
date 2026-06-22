import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';
import {
  FolderKanban, Users, MessageSquare, Bot, ClipboardCheck, ShieldCheck, IdCard, BarChart3,
} from 'lucide-react';
import { HU_BRAND_GREEN } from '../config/appImages';

const capabilities = [
  { icon: IdCard, title: 'HU ID authentication', text: 'Every student and teacher signs in with their official Hormuud University ID.' },
  { icon: FolderKanban, title: 'Project proposals', text: 'Students propose projects and assign them directly to their course teacher.' },
  { icon: Users, title: 'Team building', text: 'Invite classmates by HU ID and collaborate on one shared project workspace.' },
  { icon: MessageSquare, title: 'Team chat', text: 'Discuss ideas, share files, and coordinate submissions in real time.' },
  { icon: Bot, title: 'AI-assisted review', text: 'Teachers use intelligent tools to review submissions faster and fairly.' },
  { icon: ClipboardCheck, title: 'Approval workflow', text: 'Submit, review, request changes, and approve — all in one professional flow.' },
  { icon: BarChart3, title: 'Progress tracking', text: 'Students see project status, feedback, and scores in a clear dashboard.' },
  { icon: ShieldCheck, title: 'Secure & private', text: 'Role-based access keeps student work visible only to their team and teacher.' },
];

function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 25 });
  const sy = useSpring(my, { stiffness: 200, damping: 25 });
  const spotlight = useMotionTemplate`radial-gradient(320px circle at ${sx}px ${sy}px, rgba(22,128,85,0.12), transparent 55%)`;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <motion.div
      ref={ref}
      className={`home-feature-card home-feature-card--spotlight ${className}`}
      style={{ backgroundImage: spotlight }}
      onMouseMove={onMove}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      whileHover={{ y: -4 }}
    >
      {children}
    </motion.div>
  );
}

export function HomeFeatures() {
  return (
    <section className="home-features">
      <div className="text-center mb-8">
        <p className="welcome-label" style={{ color: HU_BRAND_GREEN }}>Platform</p>
        <h2 className="text-xl sm:text-2xl welcome-heading mt-1">Built for Hormuud University</h2>
        <p className="welcome-body text-sm mt-2 max-w-xl mx-auto">
          Everything students and teachers need for academic projects — in one professional system.
        </p>
      </div>
      <div className="home-features-grid">
        {capabilities.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <SpotlightCard>
                <div className="home-feature-icon">
                  <Icon size={20} style={{ color: HU_BRAND_GREEN }} />
                </div>
                <p className="portal-info-title">{item.title}</p>
                <p className="portal-info-text">{item.text}</p>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
