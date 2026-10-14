import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, UserCheck, Clock } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { api } from '../utils/api';

export default function AuditLogs({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CREATE': return 'badge-active';
      case 'UPDATE': return 'badge-renewed';
      case 'DELETE': return 'badge-matured';
      case 'ENCASH': return 'badge-approved';
      case 'RENEW': return 'badge-renewed';
      case 'PROPOSAL_APPROVE': return 'badge-approved';
      default: return 'badge-encashed';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER BAR */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
              System Audit Trail Logs
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Immutable system record tracking every investment, proposal, letter, and provision action
            </p>
          </div>
          <button onClick={loadLogs} className="btn-secondary">
            <RefreshCw size={16} />
            <span>Refresh Audit Log</span>
          </button>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit events recorded yet.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Details & Action Description</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-main)' }}>
                        <Clock size={13} color="var(--text-muted)" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td><strong style={{ color: '#60a5fa', textTransform: 'capitalize' }}>{log.entity}</strong></td>
                    <td>#{log.entity_id || 'N/A'}</td>
                    <td><span style={{ color: 'var(--text-main)' }}>{log.details}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <UserCheck size={13} color="#34d399" />
                        <span>{log.performed_by || 'System User'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
