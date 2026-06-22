import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { HomeNav } from '../components/HomeNav';
import { HomePortalCards } from '../components/HomePortalCards';
import { ProHeroBillboard } from '../components/ProHeroBillboard';
import { HomeMarqueeStrip } from '../components/HomeMarqueeStrip';
import { HomeWorkflowTimeline } from '../components/HomeWorkflowTimeline';
import { HomeBentoShowcase } from '../components/HomeBentoShowcase';
import { HomeFeatures } from '../components/HomeFeatures';
import { HomeFinalCTA } from '../components/HomeFinalCTA';
import { HomeFooter } from '../components/HomeFooter';
import { ScrollToTop } from '../components/ScrollToTop';
import { InstallAppPrompt } from '../components/InstallAppPrompt';
import { BrandBackground } from '../components/BrandBackground';
import { useWelcomeEffects } from '../hooks/useWelcomeEffects';
import { HU_BRAND_GREEN } from '../config/appImages';
import '../styles/welcome.css';

function RevealSection({
  children,
  className = '',
  registerReveal,
}: {
  children: React.ReactNode;
  className?: string;
  registerReveal: (el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => { registerReveal(ref.current); }, [registerReveal]);
  return <section ref={ref} className={`reveal-section reveal-section--animate ${className}`}>{children}</section>;
}

export function WelcomePage() {
  const { scrolled, registerReveal } = useWelcomeEffects();

  return (
    <BrandBackground variant="student">
      <div className="welcome-page welcome-page--student min-h-screen flex flex-col pb-24 sm:pb-0">
        <HomeNav scrolled={scrolled} />
        <ScrollToTop />
        <InstallAppPrompt />

        <header className="px-4 sm:px-8 pt-8 sm:pt-10 pb-2 max-w-6xl mx-auto w-full">
          <ProHeroBillboard />
        </header>

        <HomeMarqueeStrip />

        <main className="flex-1 px-4 sm:px-8 pb-8 max-w-6xl mx-auto w-full space-y-14 sm:space-y-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <p className="welcome-label" style={{ color: HU_BRAND_GREEN }}>Portals</p>
                <h2 className="text-xl sm:text-2xl welcome-heading mt-1">Choose your role</h2>
              </div>
              <p className="welcome-body text-xs hidden sm:block max-w-xs text-right">
                Students and teachers sign in with HU ID credentials
              </p>
            </div>
            <HomePortalCards />
          </motion.div>

          <RevealSection registerReveal={registerReveal}>
            <HomeWorkflowTimeline />
          </RevealSection>

          <RevealSection registerReveal={registerReveal}>
            <HomeBentoShowcase />
          </RevealSection>

          <RevealSection registerReveal={registerReveal}>
            <HomeFeatures />
          </RevealSection>

          <RevealSection registerReveal={registerReveal}>
            <HomeFinalCTA />
          </RevealSection>
        </main>

        <HomeFooter />
      </div>
    </BrandBackground>
  );
}
