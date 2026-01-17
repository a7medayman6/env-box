'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  _id: string;
  name: string;
  teamId: string;
  createdAt: string;
}

interface Team {
  _id: string;
  name: string;
  environments: string[];
  joinCode?: string;
  memberCount: number;
}

interface Membership {
  role: 'admin' | 'member';
  title?: string;
  canDownload: boolean;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

      if (teamRes.status === 401) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const teamData = await teamRes.json();
      setTeam(teamData.team);
      setMembership(teamData.membership);

      // Load projects
      const projectsRes = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projectsData = await projectsRes.json();
      setProjects(projectsData.projects || []);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: projectName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create project');
        setIsLoading(false);
        return;
      }

      setProjectName('');
      setShowModal(false);
      setIsLoading(false);
      loadData();
    } catch (err) {
      setError('An error occurred');
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete project');
        return;
      }

      loadData();
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="container">
        {team && (
          <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="badge badge-info">{team.name}</span>
            <span className="text-muted text-xs">{team.memberCount} members</span>
            {membership?.role === 'admin' && (
              <span className="badge badge-success">Admin</span>
            )}
          </div>
        )}

        <div className="page-header">
          <div>
            <h2>Projects</h2>
            <p style={{ color: 'var(--color-text-tertiary)', marginTop: '2px', fontSize: 'var(--font-size-xs)' }}>
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {projects.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '60px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 16px',
              background: 'var(--color-bg-glass)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-border)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: 'var(--font-size-base)', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              No projects yet
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', marginBottom: '16px' }}>
              Create your first project to start managing environment variables.
            </p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project._id} className="project-card">
                <h3>{project.name}</h3>
                <p>Created {formatDate(project.createdAt)}</p>
                <div className="project-actions">
                  <button
                    onClick={() => router.push(`/projects/${project._id}`)}
                    className="btn btn-primary"
                  >
                    Open
                  </button>
                  {membership?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteProject(project._id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-awesome-project"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.7 : 1, width: 'auto' }}
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
