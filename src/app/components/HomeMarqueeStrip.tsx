import { ShieldCheck, Users, Bot, IdCard, ClipboardCheck, Sparkles } from 'lucide-react';
import { HU_BRAND_GREEN } from '../config/appImages';

const items = [
  { icon: IdCard, label: 'HU ID Authentication' },
  { icon: Users, label: 'Team Collaboration' },
  { icon: Bot, label: 'AI-Assisted Review' },
  { icon: ClipboardCheck, label: 'Approval Workflow' },
  { icon: ShieldCheck, label: 'Secure & Private' },
  { icon: Sparkles, label: 'Real-Time Chat' },
];

export function HomeMarqueeStrip() {
  const track = [...items, ...items];

  return (
    <section className="home-marquee" aria-label="Platform highlights">
      <div className="home-marquee-fade home-marquee-fade--left" />
      <div className="home-marquee-fade home-marquee-fade--right" />
      <div className="home-marquee-track">
        {track.map(({ icon: Icon, label }, i) => (
          <span key={`${label}-${i}`} className="home-marquee-item">
            <Icon size={15} style={{ color: HU_BRAND_GREEN }} />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
