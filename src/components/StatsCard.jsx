import React from 'react';

export default function StatsCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  color = 'blue', 
  trend, 
  trendValue, 
  sparklineType = 'up',
  compact = false,
  onClick
}) {
  const colorMap = {
    blue: {
      borderDark: 'rgba(56, 189, 248, 0.45)',
      iconBg: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
      iconColor: '#ffffff',
      valueColorDark: '#38bdf8',
      valueColorLight: '#0284c7',
      cardBgDark: 'linear-gradient(135deg, rgba(14, 165, 233, 0.16) 0%, rgba(15, 23, 42, 0.88) 100%)',
      topBar: 'linear-gradient(90deg, #0ea5e9, #0284c7)',
      glowDark: '0 8px 24px -4px rgba(14, 165, 233, 0.35)',
      sparkline: '#0ea5e9'
    },
    emerald: {
      borderDark: 'rgba(52, 211, 153, 0.45)',
      iconBg: 'linear-gradient(135deg, #10b981, #059669)',
      iconColor: '#ffffff',
      valueColorDark: '#34d399',
      valueColorLight: '#059669',
      cardBgDark: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(15, 23, 42, 0.88) 100%)',
      topBar: 'linear-gradient(90deg, #34d399, #10b981)',
      glowDark: '0 8px 24px -4px rgba(16, 185, 129, 0.35)',
      sparkline: '#10b981'
    },
    amber: {
      borderDark: 'rgba(251, 191, 36, 0.45)',
      iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      iconColor: '#ffffff',
      valueColorDark: '#fbbf24',
      valueColorLight: '#d97706',
      cardBgDark: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.88) 100%)',
      topBar: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
      glowDark: '0 8px 24px -4px rgba(245, 158, 11, 0.35)',
      sparkline: '#f59e0b'
    },
    rose: {
      borderDark: 'rgba(251, 113, 133, 0.45)',
      iconBg: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      iconColor: '#ffffff',
      valueColorDark: '#fb7185',
      valueColorLight: '#e11d48',
      cardBgDark: 'linear-gradient(135deg, rgba(244, 63, 94, 0.16) 0%, rgba(15, 23, 42, 0.88) 100%)',
      topBar: 'linear-gradient(90deg, #fb7185, #f43f5e)',
      glowDark: '0 8px 24px -4px rgba(244, 63, 94, 0.35)',
      sparkline: '#f43f5e'
    },
    purple: {
      borderDark: 'rgba(167, 139, 250, 0.45)',
      iconBg: 'linear-gradient(135deg, #a855f7, #7e22ce)',
      iconColor: '#ffffff',
      valueColorDark: '#c084fc',
      valueColorLight: '#7c3aed',
      cardBgDark: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16) 0%, rgba(15, 23, 42, 0.88) 100%)',
      topBar: 'linear-gradient(90deg, #c084fc, #a855f7)',
      glowDark: '0 8px 24px -4px rgba(168, 85, 247, 0.35)',
      sparkline: '#a855f7'
    },
    cyan: {
      borderDark: 'rgba(34, 211, 238, 0.45)',
      iconBg: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      iconColor: '#ffffff',
      valueColorDark: '#22d3ee',
      valueColorLight: '#0891b2',
      cardBgDark: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(15, 23, 42, 0.88) 100%)',
      topBar: 'linear-gradient(90deg, #22d3ee, #06b6d4)',
      glowDark: '0 8px 24px -4px rgba(6, 182, 212, 0.35)',
      sparkline: '#06b6d4'
    },
    teal: {
      borderDark: 'rgba(45, 212, 191, 0.45)',
      iconBg: 'linear-gradient(135deg, #14b8a6, #0d9488)',
      iconColor: '#ffffff',
      valueColorDark: '#2dd4bf',
      valueColorLight: '#0d9488',
      cardBgDark: 'linear-gradient(135deg, rgba(20, 184, 166, 0.16) 0%, rgba(15, 23, 42, 0.88) 100%)',
      topBar: 'linear-gradient(90deg, #2dd4bf, #14b8a6)',
      glowDark: '0 8px 24px -4px rgba(20, 184, 166, 0.35)',
      sparkline: '#14b8a6'
    },
    indigo: {
      borderDark: 'rgba(129, 140, 248, 0.45)',
      iconBg: 'linear-gradient(135deg, #6366f1, #4338ca)',
      iconColor: '#ffffff',
      valueColorDark: '#818cf8',
      valueColorLight: '#4338ca',
      cardBgDark: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(15, 23, 42, 0.88) 100%)',
      topBar: 'linear-gradient(90deg, #818cf8, #6366f1)',
      glowDark: '0 8px 24px -4px rgba(99, 102, 241, 0.35)',
      sparkline: '#6366f1'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div 
      className="glass-panel stats-card-panel" 
      onClick={onClick}
      style={{
        padding: compact ? '12px 14px' : '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {/* Top Accent Line */}
      <div 
        className="stats-card-topbar"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: scheme.topBar
        }} 
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="stats-card-title" style={{ fontSize: compact ? '10.5px' : '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <h3 className={`stats-card-value stats-value-${color}`} style={{ fontSize: compact ? '18px' : '25px', fontWeight: '800', marginTop: compact ? '2px' : '6px', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value}
          </h3>
          {subtext && (
            <p className="stats-card-subtext" style={{ fontSize: compact ? '10px' : '11.5px', marginTop: compact ? '2px' : '4px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtext}
            </p>
          )}
        </div>

        {Icon && (
          <div style={{
            background: scheme.iconBg,
            padding: compact ? '7px' : '11px',
            borderRadius: compact ? '9px' : '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            flexShrink: 0
          }}>
            <Icon size={compact ? 16 : 20} color={scheme.iconColor} strokeWidth={2.2} />
          </div>
        )}
      </div>

      {/* Sparkline & Trend Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: compact ? '8px' : '16px', paddingTop: compact ? '6px' : '10px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {trendValue ? (
          <span style={{
            fontSize: compact ? '10px' : '11px',
            fontWeight: '700',
            padding: compact ? '2px 6px' : '3px 8px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: trend === 'down' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: trend === 'down' ? '#ef4444' : '#10b981',
            border: `1px solid ${trend === 'down' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
          }}>
            {trend === 'down' ? '↓' : '↑'} {trendValue}
          </span>
        ) : (
          <span style={{ fontSize: compact ? '10px' : '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
            Active Portfolio
          </span>
        )}

        {/* Smooth Micro Sparkline SVG Graph */}
        <svg width={compact ? "54" : "72"} height={compact ? "18" : "24"} viewBox="0 0 72 24" fill="none" style={{ overflow: 'visible' }}>
          {sparklineType === 'down' ? (
            <path d="M2 6 C 20 4, 30 20, 48 10 T 70 20" stroke={trend === 'down' ? '#f43f5e' : scheme.sparkline} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M2 20 C 20 22, 32 6, 48 14 T 70 4" stroke={scheme.sparkline} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}
        </svg>
      </div>
    </div>
  );
}
