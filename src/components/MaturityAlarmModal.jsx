import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, X, ArrowRight, ShieldAlert, Volume2 } from 'lucide-react';

export default function MaturityAlarmModal({ stats, onNavigate }) {
  const [maturingFDRs, setMaturingFDRs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasPlayedChime, setHasPlayedChime] = useState(false);

  useEffect(() => {
    if (!stats || !stats.upcomingMaturities) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter FDRs maturing today or tomorrow (within 2 days)
    const urgent = stats.upcomingMaturities.filter(inv => {
      if (!inv.maturity_date) return false;
      const mDate = new Date(inv.maturity_date);
      mDate.setHours(0, 0, 0, 0);
      const diffTime = mDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1; // 0 = today, 1 = tomorrow, < 0 = overdue
    });

    if (urgent.length > 0) {
      setMaturingFDRs(urgent);
      setIsOpen(true);

      // Play audio chime beep
      if (!hasPlayedChime) {
        playAlarmChime();
        triggerWindowsNotification(urgent);
        setHasPlayedChime(true);
      }
    }
  }, [stats]);

  const playAlarmChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio Context playback failed:", e);
    }
  };

  const triggerWindowsNotification = (items) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`FDR Maturity Alert (${items.length} Maturing)`, {
          body: `Attention! ${items.length} FDR(s) are maturing today or tomorrow. Click to open management dashboard.`,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(`FDR Maturity Alert (${items.length} Maturing)`, {
              body: `Attention! ${items.length} FDR(s) are maturing today or tomorrow.`,
              icon: '/favicon.ico'
            });
          }
        });
      }
    }
  };

  if (!isOpen || maturingFDRs.length === 0) return null;

  return (
    <div 
      className="no-print" 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '440px',
        width: 'calc(100% - 40px)',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        border: '2px solid #ef4444',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(239, 68, 68, 0.4), 0 0 20px rgba(0, 0, 0, 0.8)',
        padding: '18px 20px',
        color: '#f8fafc',
        animation: 'pulse 2s infinite ease-in-out'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f87171'
          }}>
            <Bell size={20} className="animate-bounce" />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#fca5a5', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>FDR MATURITY ALARM</span>
            </h4>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
              আজ বা শীঘ্রই মেয়াদোত্তীর্ণ হবে ({maturingFDRs.length} টি FDR)
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Dismiss Alarm"
        >
          <X size={16} />
        </button>
      </div>

      {/* Maturing FDR List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '14px' }}>
        {maturingFDRs.map((inv) => (
          <div 
            key={inv.id}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                FDR: {inv.fdr_no}
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                {inv.bank_name} ({inv.fund_name || 'General Fund'})
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>
                  BDT {Number(inv.principal_amount || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '10px', color: '#fca5a5', fontWeight: '700' }}>
                  Matures: {inv.maturity_date}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const msg = `🚨 *Gazipur PBS-2 | FDR Maturity Notice*\n` +
                    `Dear Manager,\n` +
                    `FDR No: *${inv.fdr_no}* at ${inv.bank_name}\n` +
                    `Principal: *BDT ${Number(inv.principal_amount || 0).toLocaleString('en-IN')}*\n` +
                    `Maturity Date: *${inv.maturity_date}*\n` +
                    `Please check instruction letter for renewal/encashment.\n` +
                    `Regards,\nAGM (Finance & Accounts), Gazipur PBS-2`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                title="Send 1-Click WhatsApp Notice to Bank Manager"
                style={{
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.4)',
                  color: '#25d366',
                  borderRadius: '6px',
                  padding: '4px 7px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Action */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            setIsOpen(false);
            if (onNavigate) onNavigate('investments');
          }}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
          }}
        >
          <span>নবায়ন / এনক্যাশ করুন (Manage Now)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
