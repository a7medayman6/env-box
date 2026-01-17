'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      router.push('/dashboard');
    }
  }, [router]);

  if (isLoggedIn) return null;

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <span className="badge badge-accent">Secure & Collaborative</span>
              <h1>Securely Manage Your Team&apos;s Environment Variables</h1>
              <p className="lead">
                The modern, encrypted, and collaborative way to handle .env files across your entire development lifecycle. No more sharing secrets in Slack or plain text.
              </p>
              <div className="hero-actions">
                <button 
                  onClick={() => router.push('/auth?mode=createTeam')} 
                  className="btn btn-primary btn-lg"
                >
                  Get Started for Free
                </button>
                <button 
                  onClick={() => router.push('/auth?mode=login')} 
                  className="btn btn-secondary btn-lg"
                >
                  Sign In
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-container">
                <Image 
                  src="/home/abed/.gemini/antigravity/brain/f4f331d4-953f-47b2-b722-d850fdfc4183/landing_hero_dashboard_1768619724595.png"
                  alt="EnvBox Dashboard Preview"
                  width={800}
                  height={600}
                  className="hero-image"
                  priority
                />
                <div className="hero-image-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Everything you need to manage secrets</h2>
            <p>Built for developers who care about security and productivity.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <h3>End-to-End Encryption</h3>
              <p>Your variables are encrypted using AES-256 before they ever leave your browser. Only your team can decrypt them.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3>Team Collaboration</h3>
              <p>Manage projects, environments, and team members with granular roles and permissions. Promote admins and manage download access.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3>.env Import & Export</h3>
              <p>Easily import your existing .env files with override detection. Export variables securely when you need them.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
              <h3>Variable Masking</h3>
              <p>Mask sensitive keys to prevent accidental exposure. Only authorized users can reveal or unmask values.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to secure your workflow?</h2>
            <p>Join hundreds of developers who trust EnvBox for their secret management.</p>
            <button 
              onClick={() => router.push('/auth?mode=createTeam')} 
              className="btn btn-primary btn-lg"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} EnvBox. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
