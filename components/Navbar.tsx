'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Team {
  _id: string;
  name: string;
  role: string;
}

export default function Navbar() {
  const [team, setTeam] = useState<Team | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/teams', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.team) {
            setTeam({
              _id: data.team._id,
              name: data.team.name,
              role: data.membership.role,
            });
          }
        })
        .catch(() => {});
    } else {
      setTeam(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setTeam(null);
    router.push('/');
  };

  // Show a simplified navbar on the landing page if not logged in
  if (pathname === '/' && !team) {
    return (
      <nav className="navbar">
        <div className="navbar-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <img src="/logo.svg" alt="Env Box Logo" style={{ height: '48px', width: 'auto' }} />
            </div>
            <span className="badge badge-info" style={{ fontSize: '10px' }}>Beta</span>
          </div>
          <div className="navbar-actions">
            <a 
              href="https://github.com/a7medayman6/env-box" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-ghost"
              title="View on GitHub"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-7.38-4.095-1.485-.21-.555-.555-1.095-1.035-1.455-.855-.585-.03-.57.03-.57.945.06 1.44 1.035 1.44 1.035 1.005 1.71 2.64 1.215 3.285.93.105-.72.39-1.215.705-1.485-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.405.345.765 1.035.765 2.085 0 1.515-.015 2.745-.015 3.105 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
            <button 
              onClick={() => router.push('/auth?mode=login')} 
              className="btn btn-ghost"
            >
              Sign In
            </button>
            <button 
              onClick={() => router.push('/auth?mode=createTeam')} 
              className="btn btn-primary"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // Don't show navbar on auth page
  if (pathname === '/auth') return null;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <img src="/logo.svg" alt="Env Box Logo" style={{ height: '48px', width: 'auto' }} />
            </div>
            <span className="badge badge-info" style={{ fontSize: '10px' }}>Beta</span>
        </div>
        <div className="navbar-actions">
          <button 
            onClick={() => router.push('/dashboard')} 
            className={`btn btn-ghost ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => router.push('/profile')} 
            className={`btn btn-ghost ${pathname === '/profile' ? 'active' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>
          {team?.role === 'admin' && (
            <button 
              onClick={() => router.push('/settings')} 
              className={`btn btn-ghost ${pathname === '/settings' ? 'active' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          )}
          <a 
            href="https://github.com/a7medayman6/env-box" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-ghost"
            title="View on GitHub"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-7.38-4.095-1.485-.21-.555-.555-1.095-1.035-1.455-.855-.585-.03-.57.03-.57.945.06 1.44 1.035 1.44 1.035 1.005 1.71 2.64 1.215 3.285.93.105-.72.39-1.215.705-1.485-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.405.345.765 1.035.765 2.085 0 1.515-.015 2.745-.015 3.105 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <button onClick={handleLogout} className="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
