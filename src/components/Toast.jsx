import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} color="#34d399" />,
    error: <AlertCircle size={18} color="#fb7185" />,
    info: <Info size={18} color="#60a5fa" />
  };

  const bgColors = {
    success: 'rgba(16, 185, 129, 0.2)',
    error: 'rgba(244, 63, 94, 0.2)',
    info: 'rgba(59, 130, 246, 0.2)'
  };

  const borderColors = {
    success: 'rgba(16, 185, 129, 0.4)',
    error: 'rgba(244, 63, 94, 0.4)',
    info: 'rgba(59, 130, 246, 0.4)'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 200,
      background: bgColors[toast.type] || bgColors.info,
      border: `1px solid ${borderColors[toast.type] || borderColors.info}`,
      backdropFilter: 'blur(10px)',
      color: '#f8fafc',
      padding: '12px 18px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '280px'
    }}>
      {icons[toast.type] || icons.info}
      <span style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>{toast.message}</span>
      <button 
        onClick={onClose} 
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
