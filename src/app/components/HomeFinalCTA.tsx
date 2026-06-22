import { ArrowRight, Sparkles } from 'lucide-react';
import { MagneticLink } from './MagneticLink';
import { HU_BRAND_GREEN, UNIVERSITY_NAME } from '../config/appImages';

export function HomeFinalCTA() {
  return (
    <section className="home-final-cta">
      <div className="home-final-cta-mesh" aria-hidden />
      <div className="home-final-cta-inner">
        <div className="home-final-cta-icon">
          <Sparkles size={22} style={{ color: HU_BRAND_GREEN }} />
        </div>
        <h2 className="home-final-cta-title" style={{ fontFamily: 'var(--font-display)' }}>
          Ready to begin your academic journey?
        </h2>
        <p className="welcome-body text-sm mt-3 max-w-md mx-auto">
          Join {UNIVERSITY_NAME} students and teachers on the official project platform. Sign in with your HU ID today.
        </p>
        <div className="home-final-cta-actions">
          <MagneticLink to="/student" className="pro-hero-cta pro-hero-cta--primary">
            Sign in as Student
            <ArrowRight size={18} />
          </MagneticLink>
          <MagneticLink to="/teacher" className="pro-hero-cta pro-hero-cta--secondary">
            Sign in as Teacher
          </MagneticLink>
        </div>
      </div>
    </section>
  );
}
