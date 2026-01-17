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
              <h1>Manage Your Environment Variables Smarter</h1>
              <p className="lead">
                Stop sharing secrets in Slack. Encrypt, manage, and sync your .env files across your team with ease and confidence.
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
                  src="/dashboard-preview.png"
                  alt="Env Box Dashboard Preview"
                  width={1000}
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
              <h3>Multiple Environments</h3>
              <p>Manage secrets for Development, Staging, and Production separately. Switch contexts instantly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3>Audit Logs</h3>
              <p>Track every change. See who added, updated, or deleted a variable and when it happened.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3>Import & Export</h3>
              <p>Import your existing .env files in seconds. Export variables to JSON or .env format whenever you need them.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
              <h3>Variable Masking</h3>
              <p>Sensitive values are masked by default. Only authorized team members can reveal them.</p>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>&copy; {new Date().getFullYear()} EnvBox. All rights reserved.</p>
            <a 
              href="https://github.com/a7medayman6/env-box" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-7.38-4.095-1.485-.21-.555-.555-1.095-1.035-1.455-.855-.585-.03-.57.03-.57.945.06 1.44 1.035 1.44 1.035 1.005 1.71 2.64 1.215 3.285.93.105-.72.39-1.215.705-1.485-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.405.345.765 1.035.765 2.085 0 1.515-.015 2.745-.015 3.105 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
