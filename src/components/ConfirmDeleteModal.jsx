import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title = 'Confirm Deletion', message = 'Are you sure you want to delete this record? This action cannot be undone.', loading = false }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AlertTriangle size={28} color="#ef4444" />
        </div>

        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
            {title}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={loading}>
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className="btn-danger" 
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={loading}
          >
            <Trash2 size={16} />
            <span>{loading ? 'Deleting...' : 'Delete Record'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
