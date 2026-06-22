import { Link } from 'react-router';
import { GraduationCap, Briefcase, Mail, ExternalLink, Shield } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import {
  APP_BRAND_NAME, APP_BRAND_TAGLINE, UNIVERSITY_NAME, HU_BRAND_GREEN, HU_WEBSITE,
} from '../config/appImages';
import { InstallAppButton } from './InstallAppPrompt';

export function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-brand">
          <BrandLogo variant="hero" />
          <div>
            <p className="welcome-body text-sm mt-2">{UNIVERSITY_NAME}</p>
            <p className="welcome-body text-xs mt-1 max-w-xs">
              {APP_BRAND_TAGLINE} — official academic project management.
            </p>
          </div>
        </div>

        <div className="home-footer-col">
          <p className="home-footer-heading">Portals</p>
          <Link to="/student" className="home-footer-link">
            <GraduationCap size={14} /> Sign in as Student
          </Link>
          <Link to="/teacher" className="home-footer-link">
            <Briefcase size={14} /> Sign in as Teacher
          </Link>
          <Link to="/register?role=student" className="home-footer-link">Create student account</Link>
          <Link to="/register?role=teacher" className="home-footer-link">Create teacher account</Link>
          <Link to="/admin" className="home-footer-link">
            <Shield size={14} /> Staff / Admin sign-in
          </Link>
        </div>

        <div className="home-footer-col">
          <p className="home-footer-heading">University</p>
          <a
            href={HU_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
            className="home-footer-link"
          >
            <ExternalLink size={14} /> {UNIVERSITY_NAME} website
          </a>
          <p className="welcome-body text-xs mt-2">
            Project proposals · Team collaboration · Teacher review
          </p>
        </div>

        <div className="home-footer-col">
          <p className="home-footer-heading">Install app</p>
          <InstallAppButton />
          <p className="welcome-body text-xs mt-2">
            Desktop or phone — opens like a native application.
          </p>
        </div>

        <div className="home-footer-col">
          <p className="home-footer-heading">Support</p>
          <p className="home-footer-link inline-flex items-center gap-1.5 cursor-default">
            <Mail size={14} /> Contact your department admin
          </p>
          <p className="welcome-body text-xs mt-2">
            Use your HU ID and university email to sign in.
          </p>
        </div>
      </div>

      <div className="home-footer-bar">
        <p>© {new Date().getFullYear()} {APP_BRAND_NAME} · {UNIVERSITY_NAME}</p>
        <p className="hidden sm:block" style={{ color: HU_BRAND_GREEN }}>Academic excellence through collaboration</p>
      </div>
    </footer>
  );
}
