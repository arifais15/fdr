import React, { useState } from 'react';
import { Calendar, RefreshCw, Sun, Moon, Sparkles, Globe, ShieldCheck } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import IslamicTicker from './IslamicTicker';
import ProtectShieldModal from './ProtectShieldModal';

export default function Header({ title, subtitle, onRefresh, isSidebarCollapsed, onToggleSidebar, theme, onToggleTheme, lang = 'en', onToggleLang, showToast }) {
  const today = formatDate(new Date().toISOString().split('T')[0]);
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false);

  return (
    <div className="no-print" style={{ marginBottom: '8px' }}>
      {/* Live Scrolling Hadith & Quran Audio Ticker */}
      <IslamicTicker isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={onToggleSidebar} />

      {/* Main Page Title & Actions */}
      <div 
        className="header-container" 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(14, 148, 117, 0.08) 0%, rgba(8, 92, 72, 0.03) 100%)',
          border: '1px solid rgba(14, 148, 117, 0.14)',
          boxShadow: '0 1px 6px rgba(14, 116, 100, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span style={{
            display: 'inline-block',
            width: '3.5px',
            height: '18px',
            borderRadius: '4px',
            background: 'var(--primary-gradient)',
            flexShrink: 0
          }} />
          <h1 style={{ 
            fontSize: '17px', 
            fontWeight: '800', 
            color: 'var(--text-main)', 
            letterSpacing: '-0.02em', 
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            {title}
          </h1>
          {subtitle && (
            <span style={{ 
              fontSize: '12.5px', 
              color: 'var(--text-main)', 
              fontWeight: '700', 
              opacity: 0.9,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              borderLeft: '1.5px solid var(--border-color)',
              paddingLeft: '8px',
              marginLeft: '4px'
            }}>
              {subtitle}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Protect Shield Security Status Button */}
          <button
            onClick={() => setIsShieldModalOpen(true)}
            className="btn-secondary"
            title="System Security & Backup Shield"
            style={{
              padding: '5px 9px',
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '600'
            }}
          >
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            <span>Shield</span>
          </button>

          {/* Bangla / English Language Toggle Button */}
          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className="btn-secondary"
              title="Toggle Language (EN / বাংলা)"
              style={{ 
                padding: '5px 9px', 
                fontSize: '11.5px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                fontWeight: '600'
              }}
            >
              <Globe size={13} color="var(--primary)" />
              <span>{lang === 'en' ? 'EN' : 'বাং'}</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className="btn-secondary"
            title="Toggle Theme (Green → Light → Dark → Gold)"
            style={{ 
              padding: '5px 9px', 
              fontSize: '11.5px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontWeight: '600'
            }}
          >
            {theme === 'black-gold' ? (
              <>
                <Sparkles size={13} color="#fbbf24" />
                <span>Gold</span>
              </>
            ) : theme === 'dark' ? (
              <>
                <Moon size={13} color="#818cf8" />
                <span>Dark</span>
              </>
            ) : (theme === 'azure-mist' || theme === 'sylhet-gray') ? (
              <>
                <Sun size={13} color="#0284c7" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Sparkles size={13} color="#0e9475" />
                <span>Green</span>
              </>
            )}
          </button>

          <button
            onClick={onRefresh}
            className="btn-secondary"
            title="Refresh"
            style={{ padding: '5px 9px', fontSize: '11.5px', fontWeight: '600' }}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--primary-gradient)',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '11.5px',
            color: '#ffffff',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(14, 116, 100, 0.25)'
          }}>
            <Calendar size={13} color="#ffffff" />
            <span>{today}</span>
          </div>
        </div>
      </div>

      {/* Protect Shield Diagnostics Modal */}
      <ProtectShieldModal 
        isOpen={isShieldModalOpen} 
        onClose={() => setIsShieldModalOpen(false)} 
        showToast={showToast}
      />
    </div>
  );
}
