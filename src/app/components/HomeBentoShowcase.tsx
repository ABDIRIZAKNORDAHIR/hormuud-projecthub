import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Link } from 'react-router';
import {
  GraduationCap, Briefcase, Bot, BarChart3, Globe, ArrowUpRight,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { HU_BRAND_GREEN, APP_BRAND_TAGLINE } from '../config/appImages';

function BentoTile({
  children,
  className = '',
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 150, damping: 20 });
  const sy = useSpring(my, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(sy, [0, 1], [6, -6]);
  const rotateY = useTransform(sx, [0, 1], [-6, 6]);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <motion.div
      ref={ref}
      className={`home-bento-tile ${glow ? 'home-bento-tile--glow' : ''} ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={onMove}
      onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

export function HomeBentoShowcase() {
  return (
    <section className="home-bento">
      <div className="text-center mb-8">
        <p className="welcome-label" style={{ color: HU_BRAND_GREEN }}>Experience</p>
        <h2 className="text-xl sm:text-2xl welcome-heading mt-1">Designed for every role</h2>
        <p className="welcome-body text-sm mt-2 max-w-lg mx-auto">
          A modern academic platform — interactive dashboards, AI tools, and secure HU ID access.
        </p>
      </div>

      <div className="home-bento-grid">
        <BentoTile className="home-bento-tile--hero" glow>
          <div className="home-bento-aurora" aria-hidden />
          <BrandLogo variant="full" className="mb-3" />
          <p className="welcome-body text-sm mt-1 max-w-xs" style={{ color: HU_BRAND_GREEN, fontWeight: 600 }}>
            {APP_BRAND_TAGLINE}
          </p>
          <p className="welcome-body text-sm mt-3 max-w-xs">
            Official project management — proposals, teams, chat, and teacher review in one place.
          </p>
          <div className="home-bento-stats">
            <div><strong>500+</strong><span>Teams</span></div>
            <div><strong>1.2k</strong><span>Projects</span></div>
            <div><strong>80+</strong><span>Faculty</span></div>
          </div>
        </BentoTile>

        <BentoTile>
          <Link to="/student" className="home-bento-link">
            <GraduationCap size={28} style={{ color: HU_BRAND_GREEN }} />
            <h3 className="welcome-heading text-lg mt-3">Student workspace</h3>
            <p className="welcome-body text-xs mt-2">Propose, invite, chat, submit</p>
            <ArrowUpRight size={18} className="home-bento-arrow" />
          </Link>
        </BentoTile>

        <BentoTile>
          <Link to="/teacher" className="home-bento-link">
            <Briefcase size={28} style={{ color: HU_BRAND_GREEN }} />
            <h3 className="welcome-heading text-lg mt-3">Teacher dashboard</h3>
            <p className="welcome-body text-xs mt-2">Review, approve, give feedback</p>
            <ArrowUpRight size={18} className="home-bento-arrow" />
          </Link>
        </BentoTile>

        <BentoTile className="home-bento-tile--wide">
          <Bot size={24} style={{ color: HU_BRAND_GREEN }} />
          <h3 className="welcome-heading text-base mt-3">Athena AI Review</h3>
          <p className="welcome-body text-xs mt-1">
            Intelligent similarity checks and review suggestions — teachers always make the final call.
          </p>
          <div className="home-bento-pills">
            <span>Similarity scan</span>
            <span>Batch analysis</span>
            <span>Collision alerts</span>
          </div>
        </BentoTile>

        <BentoTile>
          <BarChart3 size={24} style={{ color: HU_BRAND_GREEN }} />
          <h3 className="welcome-heading text-base mt-3">Progress tracking</h3>
          <p className="welcome-body text-xs mt-1">Status, scores, and feedback at a glance</p>
        </BentoTile>

        <BentoTile>
          <Globe size={24} style={{ color: HU_BRAND_GREEN }} />
          <h3 className="welcome-heading text-base mt-3">Project Atlas</h3>
          <p className="welcome-body text-xs mt-1">Browse the university project archive</p>
        </BentoTile>
      </div>
    </section>
  );
}
