'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Team {
  _id: string;
  name: string;
  joinCode: string;
  environments: string[];
}

interface Member {
  userId: string;
  email: string;
  name?: string;
  title?: string;
  role: 'admin' | 'member';
  canDownload: boolean;
}

export default function SettingsPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newEnvName, setNewEnvName] = useState('');
  const [newTeamPassword, setNewTeamPassword] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      // Load team info
      const teamRes = await fetch('/api/teams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamData = await teamRes.json();
      
      if (!teamData.team || teamData.membership?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      setTeam(teamData.team);
      setCurrentUserId(teamData.membership.userId);

      // Load members
      const membersRes = await fetch(`/api/teams/${teamData.team._id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const membersData = await membersRes.json();
      setMembers(membersData.members || []);
    } catch (err) {
      setError('Failed to load settings');
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamPassword) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/teams/${team?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newTeamPassword }),
      });

      if (res.ok) {
        setSuccess('Team password updated successfully');
        setNewTeamPassword('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setError('An error occurred');
    }
    setIsLoading(false);
  };

  const handleRegenerateCode = async () => {
    if (!confirm('Regenerating the code will invalidate the old one. Continue?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/teams/${team?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ regenerateCode: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setSuccess('Join code regenerated');
      }
    } catch (err) {
      setError('Failed to regenerate code');
    }
  };

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/teams/${team?._id}/environments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newEnvName }),
      });

      if (res.ok) {
        const data = await res.json();
        setTeam(prev => prev ? { ...prev, environments: data.environments } : null);
        setNewEnvName('');
        setSuccess('Environment added');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add environment');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleRemoveEnv = async (env: string) => {
    if (!confirm(`Are you sure you want to remove the "${env}" environment?`)) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/teams/${team?._id}/environments?name=${env}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTeam(prev => prev ? { ...prev, environments: data.environments } : null);
        setSuccess('Environment removed');
      }
    } catch (err) {
      setError('Failed to remove environment');
    }
  };

  const handleToggleDownload = async (member: Member) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/teams/${team?._id}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: member.userId, 
          canDownload: !member.canDownload 
        }),
      });

      if (res.ok) {
        setMembers(prev => prev.map(m => 
          m.userId === member.userId ? { ...m, canDownload: !m.canDownload } : m
        ));
      }
    } catch (err) {
      setError('Failed to update member permissions');
    }
  };

  const handleUpdateRole = async (member: Member, newRole: 'admin' | 'member') => {
    if (!confirm(`Are you sure you want to change ${member.name || member.email}'s role to ${newRole}?`)) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/teams/${team?._id}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: member.userId, 
          role: newRole 
        }),
      });

      if (res.ok) {
        setMembers(prev => prev.map(m => 
          m.userId === member.userId ? { ...m, role: newRole } : m
        ));
        setSuccess(`Role updated for ${member.name || member.email}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update role');
      }
    } catch (err) {
      setError('Failed to update member role');
    }
  };

  return (
    <div>
      <div className="container">
        {error && <div className="error">{error}</div>}
        {success && <div className="badge badge-success" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)' }}>{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-xl)' }}>
          
          {/* Team Info & Join Code */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Team Access</h3>
            </div>
            <div className="form-group">
              <label>Team Name</label>
              <input type="text" value={team?.name || ''} disabled />
            </div>
            <div className="form-group">
              <label>Join Code</label>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input 
                  type="text" 
                  value={team?.joinCode || ''} 
                  readOnly 
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 'bold' }} 
                />
                <button onClick={handleRegenerateCode} className="btn btn-secondary">Regenerate</button>
              </div>
              <p className="text-xs text-muted mt-sm">Share this code with people you want to invite to your team.</p>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="mt-lg">
              <div className="form-group">
                <label>Change Team Password</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input 
                    type="password" 
                    value={newTeamPassword} 
                    onChange={(e) => setNewTeamPassword(e.target.value)}
                    placeholder="New team password" 
                  />
                  <button type="submit" className="btn btn-primary" disabled={isLoading || !newTeamPassword}>Update</button>
                </div>
              </div>
            </form>
          </div>

          {/* Environments Management */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Environments</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              {team?.environments.map(env => (
                <div key={env} className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  {env}
                  <button onClick={() => handleRemoveEnv(env)} style={{ color: 'inherit', opacity: 0.6 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddEnv}>
              <div className="form-group">
                <label>Add Environment</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input 
                    type="text" 
                    value={newEnvName} 
                    onChange={(e) => setNewEnvName(e.target.value)}
                    placeholder="e.g. testing, qa" 
                  />
                  <button type="submit" className="btn btn-primary" disabled={!newEnvName}>Add</button>
                </div>
              </div>
            </form>
          </div>

          {/* Member Management */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h3 className="card-title">Team Members</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name / Email</th>
                    <th>Title</th>
                    <th>Role</th>
                    <th>Download Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.userId}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{member.name || 'No Name'}</div>
                          <div className="text-xs text-muted">{member.email}</div>
                        </div>
                      </td>
                      <td className="text-sm">{member.title || '—'}</td>
                      <td>
                        {member.userId === currentUserId ? (
                          <span className="badge badge-success">admin (You)</span>
                        ) : (
                          <select 
                            value={member.role} 
                            onChange={(e) => handleUpdateRole(member, e.target.value as 'admin' | 'member')}
                            className="role-select"
                            style={{ 
                              background: member.role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                              color: member.role === 'admin' ? 'var(--color-success)' : 'var(--color-accent-primary)',
                            }}
                          >
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={member.canDownload} 
                            onChange={() => handleToggleDownload(member)}
                            disabled={member.role === 'admin'} // Admin always has permission
                          />
                          <span className="toggle-slider"></span>
                          <span className="toggle-label">{member.canDownload ? 'Allowed' : 'Blocked'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
