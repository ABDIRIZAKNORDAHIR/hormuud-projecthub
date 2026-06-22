import { useEffect, useRef, useState } from 'react';
import { FolderKanban, Users, MessageSquare, ClipboardCheck } from 'lucide-react';
import { HU_BRAND_GREEN } from '../config/appImages';

const steps = [
  {
    icon: FolderKanban,
    title: 'Propose & assign',
    text: 'Students propose a project and assign it to their Hormuud teacher.',
  },
  {
    icon: Users,
    title: 'Build your team',
    text: 'Invite classmates by HU ID — profiles appear instantly in your workspace.',
  },
  {
    icon: MessageSquare,
    title: 'Collaborate',
    text: 'Chat, share files, and coordinate as one team before submission.',
  },
  {
    icon: ClipboardCheck,
    title: 'Submit & review',
    text: 'Teachers review with AI assistance, approve, or request changes.',
  },
];

export function HomeWorkflowTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85;
      const end = vh * 0.15;
      const raw = (start - rect.top) / (start - end + rect.height * 0.5);
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="home-workflow">
      <div className="text-center mb-10">
        <p className="welcome-label" style={{ color: HU_BRAND_GREEN }}>Workflow</p>
        <h2 className="text-xl sm:text-2xl welcome-heading mt-1">From idea to approval</h2>
        <p className="welcome-body text-sm mt-2">A guided path built for academic excellence</p>
      </div>

      <div className="home-workflow-rail">
        <svg className="home-workflow-svg" viewBox="0 0 1000 8" preserveAspectRatio="none" aria-hidden>
          <line x1="0" y1="4" x2="1000" y2="4" className="home-workflow-line-bg" />
          <line
            x1="0" y1="4" x2="1000" y2="4"
            className="home-workflow-line-fill"
            style={{ strokeDashoffset: `${1000 * (1 - progress)}` }}
          />
        </svg>

        <div className="home-workflow-steps">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const active = progress >= (i + 0.5) / steps.length;
            return (
              <article
                key={step.title}
                className={`home-workflow-step ${active ? 'is-active' : ''}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="home-workflow-node">
                  <Icon size={20} />
                </div>
                <div className="home-workflow-card">
                  <span className="home-workflow-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="welcome-heading text-base">{step.title}</h3>
                  <p className="welcome-step-text mt-2">{step.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
