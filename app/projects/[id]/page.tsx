'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Variable {
  _id: string;
  key: string;
  value: string;
  description?: string;
  isCommented: boolean;
  isMasked: boolean;
  canReveal: boolean;
  updatedAt: string;
}

interface AuditLog {
  _id: string;
  variableKey: string;
  action: string;
  userEmail: string;
  timestamp: string;
}

interface Team {
  _id: string;
  name: string;
  environments: string[];
}

interface Membership {
  role: 'admin' | 'member';
  canDownload: boolean;
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [environment, setEnvironment] = useState<string>('');
  const [variables, setVariables] = useState<Variable[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [projectName, setProjectName] = useState('');
  
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [formData, setFormData] = useState({ key: '', value: '', description: '', isCommented: false, isMasked: false });
  const [importData, setImportData] = useState({ content: '', override: false });
  
  const [revealedValues, setRevealedValues] = useState<Record<string, boolean>>({});
  const [expandedText, setExpandedText] = useState<{ id: string, type: 'value' | 'desc' } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const loadInitialData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      // Load team and membership
      const teamRes = await fetch('/api/teams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamData = await teamRes.json();
      setTeam(teamData.team);
      setMembership(teamData.membership);
      
      if (teamData.team?.environments?.length > 0) {
        setEnvironment(teamData.team.environments[0]);
      }

      // Load project details
      const projectRes = await fetch(`/api/projects/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const projectData = await projectRes.json();
      if (projectData.project) {
        setProjectName(projectData.project.name);
      }
    } catch (err) {
      setError('Failed to load project data');
    }
  }, [params.id, router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadVariables = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `/api/projects/${params.id}/variables?environment=${environment}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 401) {
        router.push('/');
        return;
      }

      const data = await response.json();
      setVariables(data.variables || []);
    } catch (err) {
      setError('Failed to load variables');
    }
  }, [environment, params.id, router]);

  useEffect(() => {
    if (environment) {
      loadVariables();
    }
  }, [environment, loadVariables]);

  const loadAuditLogs = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `/api/projects/${params.id}/audit?environment=${environment}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setAuditLogs(data.logs || []);
      setShowAuditLog(true);
    } catch (err) {
      setError('Failed to load audit logs');
    }
  };

  const handleSaveVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const token = localStorage.getItem('token');
    const url = editingVariable
      ? `/api/projects/${params.id}/variables/${editingVariable._id}`
      : `/api/projects/${params.id}/variables`;
    const method = editingVariable ? 'PUT' : 'POST';

    const body = editingVariable
      ? { value: formData.value, description: formData.description, isCommented: formData.isCommented, isMasked: formData.isMasked }
      : { ...formData, environment };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to save variable');
        setIsLoading(false);
        return;
      }

      setFormData({ key: '', value: '', description: '', isCommented: false, isMasked: false });
      setShowVariableModal(false);
      setEditingVariable(null);
      setIsLoading(false);
      loadVariables();
    } catch (err) {
      setError('An error occurred');
      setIsLoading(false);
    }
  };

  const handleToggleCommented = async (variable: Variable) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/projects/${params.id}/variables/${variable._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCommented: !variable.isCommented }),
      });

      if (response.ok) {
        loadVariables();
      }
    } catch (err) {
      setError('Failed to update variable');
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImportEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const lines = importData.content.split('\n');
    const parsedVariables = [];
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      const firstEqual = line.indexOf('=');
      if (firstEqual === -1) {
        setError(`Invalid line: ${line}`);
        setIsLoading(false);
        return;
      }

      const key = line.substring(0, firstEqual).trim();
      let value = line.substring(firstEqual + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }

      if (!key) {
        setError(`Invalid key in line: ${line}`);
        setIsLoading(false);
        return;
      }

      parsedVariables.push({ key, value });
    }

    if (parsedVariables.length === 0) {
      setError('No variables found in the provided content');
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/projects/${params.id}/variables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          environment,
          variables: parsedVariables,
          override: importData.override,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Import failed');
        setIsLoading(false);
        return;
      }

      setImportData({ content: '', override: false });
      setShowImportModal(false);
      setIsLoading(false);
      loadVariables();
    } catch (err) {
      setError('An error occurred during import');
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(`Are you sure you want to clear ALL variables in the ${environment} environment? This cannot be undone.`)) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/projects/${params.id}/variables?environment=${environment}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        loadVariables();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to clear variables');
      }
    } catch (err) {
      setError('Failed to clear variables');
    }
  };

  const handleDeleteVariable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variable?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/projects/${params.id}/variables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadVariables();
    } catch (err) {
      setError('Failed to delete variable');
    }
  };

  const handleExport = async (format: 'env' | 'json') => {
    if (!membership?.canDownload) {
      alert('You do not have permission to download variables.');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `/api/projects/${params.id}/export?environment=${environment}&format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Export failed');
        return;
      }

      const blob = format === 'json' ? await response.blob() : new Blob([await response.text()], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-${environment}.${format === 'json' ? 'json' : 'env'}`;
      a.click();
    } catch (err) {
      setError('Failed to export variables');
    }
  };

  const openNewVariableModal = () => {
    setEditingVariable(null);
    setFormData({ key: '', value: '', description: '', isCommented: false, isMasked: false });
    setShowVariableModal(true);
  };

  const openEditVariableModal = (variable: Variable) => {
    setEditingVariable(variable);
    setFormData({ 
      key: variable.key, 
      value: '', 
      description: variable.description || '', 
      isCommented: variable.isCommented,
      isMasked: variable.isMasked
    });
    setShowVariableModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="container">
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <h2>{projectName}</h2>
              <span className="badge badge-info">{environment}</span>
            </div>
            <p style={{ color: 'var(--color-text-tertiary)', marginTop: '2px', fontSize: 'var(--font-size-xs)' }}>
              {variables.length} variables in this environment
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button 
              onClick={() => handleExport('env')} 
              className="btn btn-secondary"
              disabled={!membership?.canDownload}
              title={!membership?.canDownload ? "Download disabled by admin" : ""}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              .env
            </button>
            <button 
              onClick={() => handleExport('json')} 
              className="btn btn-secondary"
              disabled={!membership?.canDownload}
              title={!membership?.canDownload ? "Download disabled by admin" : ""}
            >
              JSON
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select 
                value={environment} 
                onChange={(e) => setEnvironment(e.target.value)}
                style={{ width: 'auto', minWidth: '160px' }}
              >
                {team?.environments.map(env => (
                  <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import .env
            </button>
            {membership?.role === 'admin' && (
              <button onClick={handleClearAll} className="btn btn-danger">
                Clear All
              </button>
            )}
            <button onClick={openNewVariableModal} className="btn btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Variable
            </button>
          </div>
        </div>

        {variables.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '40px' }}>
            <p>No variables in this environment yet.</p>
            <button onClick={openNewVariableModal} className="btn btn-primary mt-md">
              Add First Variable
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Description</th>
                  <th>Updated</th>
                  <th style={{ width: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((variable) => (
                  <tr key={variable._id} style={{ opacity: variable.isCommented ? 0.5 : 1 }}>
                    <td>
                      <label className="toggle-switch" title="Toggle Commented">
                        <input 
                          type="checkbox" 
                          checked={variable.isCommented} 
                          onChange={() => handleToggleCommented(variable)} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <code style={{ color: variable.isCommented ? 'var(--color-text-muted)' : 'var(--color-accent-primary)' }}>
                        {variable.isCommented ? '#' : ''}{variable.key}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <code 
                          style={{ 
                            color: 'var(--color-text-tertiary)', 
                            cursor: 'pointer',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          onClick={() => setExpandedText({ id: variable._id, type: 'value' })}
                          title="Click to view full text"
                        >
                          {variable.value === 'MASKED' && !revealedValues[variable._id] 
                            ? '••••••••' 
                            : (revealedValues[variable._id] || !variable.isMasked ? variable.value : '••••••••')}
                        </code>
                        {variable.isMasked && variable.canReveal && (
                          <button 
                            onClick={() => toggleReveal(variable._id)}
                            className="btn btn-ghost"
                            style={{ padding: '2px' }}
                            title={revealedValues[variable._id] ? "Hide value" : "Reveal value"}
                          >
                            {revealedValues[variable._id] ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span 
                        style={{ 
                          fontSize: 'var(--font-size-xs)', 
                          color: 'var(--color-text-tertiary)',
                          cursor: 'pointer',
                          display: 'block',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => setExpandedText({ id: variable._id, type: 'desc' })}
                        title="Click to view full description"
                      >
                        {variable.description || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {formatDate(variable.updatedAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button
                          onClick={() => openEditVariableModal(variable)}
                          className="btn btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVariable(variable._id)}
                          className="btn btn-danger"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showVariableModal && (
        <div className="modal" onClick={() => setShowVariableModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingVariable ? 'Edit Variable' : 'Add New Variable'}</h2>
            <form onSubmit={handleSaveVariable}>
              <div className="form-group">
                <label htmlFor="key">Key</label>
                <input
                  id="key"
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                  placeholder="API_KEY"
                  required
                  disabled={!!editingVariable}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="value">Value</label>
                <input
                  id="value"
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={editingVariable ? 'Enter new value' : 'sk-xxxxx...'}
                  required={!editingVariable}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this variable used for?"
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={formData.isCommented} 
                      onChange={(e) => setFormData({ ...formData, isCommented: e.target.checked })} 
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Commented</span>
                  </label>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={formData.isMasked} 
                      onChange={(e) => setFormData({ ...formData, isMasked: e.target.checked })} 
                      disabled={editingVariable?.isMasked && !membership?.canDownload}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Masked {editingVariable?.isMasked && !membership?.canDownload && '(Immutable)'}</span>
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowVariableModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (editingVariable ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expandedText && (
        <div className="modal" onClick={() => setExpandedText(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>{expandedText.type === 'value' ? 'Full Value' : 'Full Description'}</h2>
            <div style={{ 
              background: 'var(--color-bg-tertiary)', 
              padding: 'var(--space-md)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              wordBreak: 'break-all',
              fontFamily: expandedText.type === 'value' ? 'var(--font-mono)' : 'inherit',
              fontSize: 'var(--font-size-sm)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {expandedText.type === 'value' 
                ? (variables.find(v => v._id === expandedText.id)?.value === 'MASKED' && !revealedValues[expandedText.id] 
                    ? '•••••••• (Masked)' 
                    : variables.find(v => v._id === expandedText.id)?.value)
                : variables.find(v => v._id === expandedText.id)?.description || 'No description'}
            </div>
            <div className="modal-actions">
              <button onClick={() => setExpandedText(null)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Import .env File</h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-md)' }}>
              Paste the contents of your .env file below. Commented lines (#) will be ignored.
            </p>
            <form onSubmit={handleImportEnv}>
              <div className="form-group">
                <textarea
                  value={importData.content}
                  onChange={(e) => setImportData({ ...importData, content: e.target.value })}
                  placeholder="KEY=VALUE&#10;# This is a comment&#10;API_URL=https://api.example.com"
                  required
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    height: '200px', 
                    resize: 'vertical',
                    fontSize: 'var(--font-size-xs)'
                  }}
                />
              </div>
              <div className="form-group">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={importData.override} 
                    onChange={(e) => setImportData({ ...importData, override: e.target.checked })} 
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">Override existing variables</span>
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Importing...' : 'Import Variables'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAuditLog && (
        <div className="modal" onClick={() => setShowAuditLog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Change History</h2>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: 'var(--space-md)' }}>
              <table>
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td><code>{log.variableKey}</code></td>
                      <td>
                        <span className={`badge badge-${
                          log.action === 'create' ? 'success' : 
                          log.action === 'delete' ? 'danger' : 'info'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--font-size-xs)' }}>{log.userEmail}</td>
                      <td style={{ fontSize: 'var(--font-size-xs)' }}>{formatDate(log.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAuditLog(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
