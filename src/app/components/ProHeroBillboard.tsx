import { motion } from 'motion/react';
import { ArrowRight, Award, ShieldCheck } from 'lucide-react';
import { MagneticLink } from './MagneticLink';
import { AnimatedCounter } from './AnimatedCounter';
import { BrandLogo } from './BrandLogo';
import {
  APP_BRAND_TAGLINE, APP_HERO_HEADLINE, APP_HERO_SUBHEADLINE, HU_BRAND_GREEN,
  APP_IMAGES,
} from '../config/appImages';

const HU_STUDENT_IMAGE = APP_IMAGES.campusGroup;

const metrics = [
  { value: 500, suffix: '+', label: 'Student teams' },
  { value: 1200, suffix: '+', label: 'Projects' },
  { value: 80, suffix: '+', label: 'Teachers' },
];

export function ProHeroBillboard() {
  return (
    <section className="pro-hero-billboard">
      <div className="pro-hero-aurora" aria-hidden />

      <div className="pro-hero-billboard-inner">
        <motion.div
          className="pro-hero-visual"
          initial={{ opacity: 0, x: 24, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pro-hero-visual-frame">
            <div className="pro-hero-visual-accent" aria-hidden />
            <div className="pro-hero-visual-shine" aria-hidden />
            <img
              src={HU_STUDENT_IMAGE}
              alt="Hormuud University students on campus"
              className="pro-hero-visual-img"
              loading="eager"
            />
            <div className="pro-hero-visual-caption">
              <span className="pro-hero-visual-badge">
                <Award size={12} />
                Campus
              </span>
              <p>Hormuud University</p>
            </div>
          </div>
          <motion.div
            className="pro-hero-float-card pro-hero-float-card--trust"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ShieldCheck size={16} style={{ color: HU_BRAND_GREEN }} />
            <div>
              <p className="pro-hero-float-title">Secure HU ID</p>
              <p className="pro-hero-float-sub">Verified access</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="pro-hero-copy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <BrandLogo variant="xl" />
          </motion.div>

          <motion.h1
            className="pro-hero-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
          >
            {APP_HERO_HEADLINE}
          </motion.h1>

          <motion.p
            className="pro-hero-subtitle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.5 }}
          >
            {APP_HERO_SUBHEADLINE}
          </motion.p>

          <motion.p
            className="pro-hero-lead"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {APP_BRAND_TAGLINE}
          </motion.p>

          <motion.div
            className="pro-hero-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <MagneticLink to="/student" className="pro-hero-cta pro-hero-cta--primary">
              Sign in as Student
              <ArrowRight size={18} />
            </MagneticLink>
            <MagneticLink to="/teacher" className="pro-hero-cta pro-hero-cta--secondary">
              Sign in as Teacher
            </MagneticLink>
          </motion.div>

          <motion.div
            className="pro-hero-metrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            {metrics.map(m => (
              <div key={m.label} className="pro-hero-metric">
                <AnimatedCounter
                  value={m.value}
                  suffix={m.suffix}
                  className="pro-hero-metric-value"
                />
                <span className="pro-hero-metric-label">{m.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="pro-hero-trust-bar">
        <span>Academic project management</span>
        <span className="pro-hero-trust-sep" />
        <span>Team collaboration</span>
        <span className="pro-hero-trust-sep" />
        <span>Teacher review workflow</span>
      </div>
    </section>
  );
}
