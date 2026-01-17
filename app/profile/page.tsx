'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  user: {
    email: string;
    name?: string;
    createdAt: string;
  };
  team: {
    name: string;
    role: string;
    title?: string;
    memberCount: number;
    joinedAt: string;
  } | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data);
      setName(data.user.name || '');
      setTitle(data.team?.title || '');
    } catch (err) {
      setError('Failed to load profile');
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, title }),
      });

      if (res.ok) {
        setSuccess('Profile updated successfully');
        loadProfile();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred');
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!profile) return <div className="container">Loading...</div>;

  return (
    <div>
      <div className="container" style={{ maxWidth: '800px' }}>
        {error && <div className="error">{error}</div>}
        {success && <div className="badge badge-success" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)' }}>{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
          
          {/* Profile Form */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Personal Details</h3>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={profile.user.email} disabled />
              </div>
              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input 
                  id="name"
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="title">Job Title</label>
                <input 
                  id="title"
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Developer" 
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Team Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Team Membership</h3>
            </div>
            {profile.team ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div>
                  <div className="text-xs text-muted uppercase">Team Name</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>{profile.team.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted uppercase">Your Role</div>
                  <div className="badge badge-info">{profile.team.role}</div>
                </div>
                <div>
                  <div className="text-xs text-muted uppercase">Team Size</div>
                  <div className="text-sm">{profile.team.memberCount} members</div>
                </div>
                <div>
                  <div className="text-xs text-muted uppercase">Joined On</div>
                  <div className="text-sm">{formatDate(profile.team.joinedAt)}</div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>You are not a member of any team.</p>
              </div>
            )}
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="text-xs text-muted">
              Account created on {formatDate(profile.user.createdAt)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
