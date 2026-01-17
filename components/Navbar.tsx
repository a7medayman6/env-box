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
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  // Show a simplified navbar on the landing page if not logged in
  if (pathname === '/' && !team) {
    return (
      <nav className="navbar">
        <div className="navbar-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <img src="/logo.svg" alt="EnvBox Logo" style={{ height: '48px', width: 'auto' }} />
            </div>
            <span className="badge badge-info" style={{ fontSize: '10px' }}>Beta</span>
          </div>
          <div className="navbar-actions">
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
              <img src="/logo.svg" alt="EnvBox Logo" style={{ height: '48px', width: 'auto' }} />
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
