'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type AuthMode = 'login' | 'createTeam' | 'joinTeam';

function AuthContent() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const m = searchParams.get('mode') as AuthMode;
    if (m && ['login', 'createTeam', 'joinTeam'].includes(m)) {
      setMode(m);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Login failed');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        // Signup with team creation or joining
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: name || undefined,
            title: title || undefined,
            createTeam: mode === 'createTeam',
            joinTeam: mode === 'joinTeam',
            teamName: mode === 'createTeam' ? teamName : undefined,
            teamPassword,
            joinCode: mode === 'joinTeam' ? joinCode : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Signup failed');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>
          {mode === 'login' && 'Welcome Back'}
          {mode === 'createTeam' && 'Create Your Team'}
          {mode === 'joinTeam' && 'Join a Team'}
        </h1>
        
        {error && <div className="error">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {mode !== 'login' && (
          <>
            <div className="form-group">
              <label htmlFor="name">Your Name <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="title">Your Title <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Frontend Developer"
              />
            </div>

            {mode === 'createTeam' && (
              <div className="form-group">
                <label htmlFor="teamName">Team Name</label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Acme Corp"
                  required
                />
              </div>
            )}

            {mode === 'joinTeam' && (
              <div className="form-group">
                <label htmlFor="joinCode">Team Join Code</label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  maxLength={8}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="teamPassword">Team Password</label>
              <input
                id="teamPassword"
                type="password"
                value={teamPassword}
                onChange={(e) => setTeamPassword(e.target.value)}
                placeholder={mode === 'createTeam' ? 'Create a team password' : 'Enter team password'}
                required
              />
            </div>
          </>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? 'Processing...' : (
            mode === 'login' ? 'Sign In' : 
            mode === 'createTeam' ? 'Create Team & Sign Up' :
            'Join Team & Sign Up'
          )}
        </button>
        
        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?
              <button type="button" onClick={() => setMode('createTeam')}>
                Create Team
              </button>
              <span style={{ margin: '0 4px' }}>or</span>
              <button type="button" onClick={() => setMode('joinTeam')}>
                Join Team
              </button>
            </>
          ) : (
            <>
              Already have an account?
              <button type="button" onClick={() => setMode('login')}>
                Sign In
              </button>
              <span style={{ display: 'block', marginTop: '8px' }}>
                {mode === 'createTeam' ? (
                  <>
                    Have a join code?
                    <button type="button" onClick={() => setMode('joinTeam')}>
                      Join Team
                    </button>
                  </>
                ) : (
                  <>
                    Want to start fresh?
                    <button type="button" onClick={() => setMode('createTeam')}>
                      Create Team
                    </button>
                  </>
                )}
              </span>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="loading-container">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
