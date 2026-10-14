import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function PrintHeader({ title, docRef, date, printOnly = false }) {
  const [orgSettings, setOrgSettings] = useState({
    org_name: 'Gazipur Palli Bidyut Samity-2',
    org_address: 'Rajendrapur, Gazipur',
    org_phone: '01769402677',
    org_email: 'gazipbs2@gmail.com',
    org_logo_url: '',
    org_secondary_logo_url: ''
  });

  useEffect(() => {
    api.getSettings().then(data => {
      if (data && data.org_name) {
        setOrgSettings(prev => ({ ...prev, ...data }));
      }
    }).catch(() => { });
  }, []);

  const pbsLogo = orgSettings.org_secondary_logo_url;
  const brebLogo = orgSettings.org_logo_url;

  // Left Logo: PBS Samity Logo (org_secondary_logo_url) or fallback
  const leftLogoSrc = pbsLogo || brebLogo;
  // Right Logo: BREB Emblem Logo (org_logo_url) if PBS logo exists on left
  const rightLogoSrc = pbsLogo ? brebLogo : '';

  return (
    <div className={`printable-header ${printOnly ? 'print-only' : ''}`} style={{
      marginBottom: '20px',
      width: '100%'
    }}>
      {/* 1. TOP HEADER: PBS LOGO (TOP LEFT) | ORG DETAILS (CENTER) | OTHER / BREB LOGO (TOP RIGHT) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '130px 1fr 130px',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: '16px',
        width: '100%',
        marginBottom: '6px'
      }}>

        {/* TOP LEFT COLUMN: PBS SAMITY LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '130px' }}>
          {leftLogoSrc ? (
            <img
              src={leftLogoSrc}
              alt="PBS Samity Logo"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{
                height: '70px',
                width: '70px',
                objectFit: 'contain',
                background: 'transparent',
                mixBlendMode: 'multiply'
              }}
            />
          ) : (
            <div style={{ width: '70px', height: '70px' }} />
          )}
        </div>

        {/* CENTER COLUMN: ORGANIZATION TITLE & CONTACT DETAILS */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h1 style={{
            fontSize: '21px',
            fontWeight: '900',
            textTransform: 'uppercase',
            color: '#000000',
            letterSpacing: '0.03em',
            margin: 0,
            lineHeight: '1.2'
          }}>
            {orgSettings.org_name}
          </h1>
          <p style={{ fontSize: '15px', color: '#000000', fontWeight: '700', margin: '2px 0 0 0', textAlign: 'center' }}>
            {orgSettings.org_address}
          </p>
          <p style={{ fontSize: '13.5px', color: '#000000', fontWeight: '600', margin: '2px 0 0 0', textAlign: 'center' }}>
            Phone: {orgSettings.org_phone} • Email: {orgSettings.org_email}
          </p>
        </div>

        {/* TOP RIGHT COLUMN: OTHER / BREB EMBLEM LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '130px' }}>
          {rightLogoSrc ? (
            <img
              src={rightLogoSrc}
              alt="Other / BREB Logo"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{
                height: '70px',
                width: '70px',
                objectFit: 'contain',
                background: 'transparent',
                mixBlendMode: 'multiply'
              }}
            />
          ) : (
            <div style={{ width: '70px', height: '70px' }} />
          )}
        </div>
      </div>

      {/* 2. BOLD HORIZONTAL DIVIDER LINE */}
      <div className="header-horizontal-bar" style={{
        borderTop: '2px solid #000000',
        width: '100%',
        margin: '6px 0 10px 0',
        display: 'block',
        height: '0px',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }} />

      {/* 3. REF NO, OPTIONAL DOC TITLE, AND DATE ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#000000', fontWeight: 'bold' }}>
        <div>
          {docRef && (
            docRef.toLowerCase().includes('annexure') ? (
              <span style={{ fontWeight: '800', fontSize: '12.5px', color: '#1e293b', background: '#e2e8f0', padding: '3px 12px', borderRadius: '6px', border: '1.5px solid #64748b', display: 'inline-block' }}>
                {docRef}
              </span>
            ) : (
              <span><strong>Ref No:</strong> {docRef}</span>
            )
          )}
        </div>
        <div>
          {title && <span style={{ fontSize: '17px', fontWeight: '800', textDecoration: 'underline' }}>{title}</span>}
        </div>
        <div>
          {date && <span><strong>Date:</strong> {date}</span>}
        </div>
      </div>
    </div>
  );
}
