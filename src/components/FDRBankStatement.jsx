import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, FileSpreadsheet, TrendingUp, TrendingDown, Activity, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const EVENT_COLORS = {
  Creation:   { bg: 'rgba(59,130,246,0.15)',  border: '#3b82f6', badge: '#60a5fa',  label: 'Opening' },
  Provision:  { bg: 'rgba(52,211,153,0.10)',  border: '#34d399', badge: '#34d399',  label: 'Interest' },
  Tax:        { bg: 'rgba(248,113,113,0.10)', border: '#f87171', badge: '#f87171',  label: 'AIT Tax' },
  ExciseDuty: { bg: 'rgba(245,158,11,0.10)',  border: '#f59e0b', badge: '#f59e0b',  label: 'Excise' },
  BankCharge: { bg: 'rgba(148,163,184,0.10)', border: '#94a3b8', badge: '#94a3b8',  label: 'Charge' },
  Encashment: { bg: 'rgba(239,68,68,0.10)',   border: '#ef4444', badge: '#ef4444',  label: 'Encashed' },
  Renewal:    { bg: 'rgba(251,191,36,0.10)',  border: '#fbbf24', badge: '#fbbf24',  label: 'Renewed' },
  Letter:     { bg: 'rgba(168,85,247,0.08)',  border: '#a855f7', badge: '#c084fc',  label: 'Letter' },
  Update:     { bg: 'rgba(255,255,255,0.04)', border: '#475569', badge: '#94a3b8',  label: 'Update' },
};

function getEventStyle(type) {
  for (const key of Object.keys(EVENT_COLORS)) {
    if (type && type.toLowerCase().includes(key.toLowerCase())) return EVENT_COLORS[key];
  }
  return EVENT_COLORS.Update;
}

export default function FDRBankStatement({ invId, invFdrNo, onClose, settings = {} }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (!invId) return;
    setLoading(true);
    setError(null);
    api.getFdrBankStatement(invId)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [invId]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=960,height=780');
    if (!printWindow) {
      window.print();
      return;
    }

    const organizationName = settings?.org_name || 'Fund Management System';
    const organizationAddress = settings?.org_address || 'Head Office';
    const reportDate = new Date().toLocaleDateString('en-BD', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>FDR Bank Statement – ${invFdrNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
            marks: none;
          }

          * { box-sizing: border-box; }

          html, body {
            background: #ffffff;
            color: #0f172a;
            font-family: 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif;
            font-size: 11px;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }

          body {
            padding: 0;
            overflow: visible;
          }

          .statement-report {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            color: #111827;
            box-shadow: none;
            border: 1px solid #cbd5e1;
            padding: 12mm;
            margin: 0 auto;
            page-break-inside: avoid;
          }

          .report-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }

          .report-brand {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .report-brand .org {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.4px;
          }

          .report-brand .address {
            font-size: 10px;
            color: #475569;
          }

          .report-title-block {
            text-align: right;
            min-width: 160px;
          }

          .report-title-block .title {
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 1.2px;
            color: #0f172a;
            text-transform: uppercase;
          }

          .report-title-block .date {
            font-size: 10px;
            color: #475569;
            margin-top: 4px;
          }

          .report-meta-strip {
            display: grid;
            grid-template-columns: repeat(4, minmax(120px, 1fr));
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            margin-bottom: 12px;
          }

          .report-meta-strip .meta-cell {
            font-size: 10px;
            color: #475569;
            border-right: 1px solid #cbd5e1;
            padding-right: 8px;
          }

          .report-meta-strip .meta-cell:last-child {
            border-right: none;
          }

          .report-meta-strip .meta-cell strong {
            color: #0f172a;
            font-size: 11px;
          }

          .statement-print {
            background: #ffffff;
            color: #0f172a;
            border: 1px solid #e2e8f0;
            padding: 0;
          }

          .statement-print .header-block {
            display: none;
          }

          .statement-print > div:first-child {
            background: transparent;
          }

          .statement-print .data-table-container {
            width: 100%;
            border: 1px solid #475569;
            background: #ffffff;
            border-radius: 0;
            overflow: hidden;
          }

          .statement-print table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            border: 1px solid #475569;
            table-layout: fixed;
          }

          .statement-print thead th {
            background: #0f172a;
            color: #ffffff;
            padding: 8px 6px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border: 1px solid #334155;
          }

          .statement-print td {
            padding: 7px 6px;
            border: 1px solid #94a3b8;
            background: #ffffff;
            font-size: 10px;
            color: #0f172a;
            vertical-align: top;
          }

          .statement-print tfoot td {
            background: #e2e8f0;
            color: #0f172a;
            border-top: 2px solid #0f172a;
            font-weight: 800;
          }

          .statement-print .credit,
          .statement-print .debit,
          .statement-print .balance {
            font-family: 'Times New Roman', serif;
          }

          .statement-print .summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(130px, 1fr));
            gap: 8px;
            margin: 12px 0 16px 0;
          }

          .statement-print .summary-box {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            padding: 8px 10px;
            border-radius: 6px;
          }

          .statement-print .summary-box .label {
            font-size: 9px;
            color: #475569;
            font-weight: 700;
            text-transform: uppercase;
          }

          .statement-print .summary-box .value {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
          }

          .statement-print .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            color: #475569;
            border-top: 1px solid #94a3b8;
            padding-top: 10px;
            margin-top: 16px;
          }

          .statement-print .footer div {
            min-width: 150px;
            border-top: none;
            text-align: center;
          }

          .statement-print .data-table-container {
            max-width: 100%;
            overflow: hidden;
          }

          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        <section class="statement-report">
          <section class="report-top">
            <div class="report-brand">
              <div class="org">${organizationName}</div>
              <div class="address">${organizationAddress}</div>
            </div>
            <div class="report-title-block">
              <div class="title">FDR Statement</div>
              <div class="date">Printed: ${reportDate}</div>
            </div>
          </section>

          <section class="report-meta-strip">
            <div class="meta-cell"><strong>FDR No:</strong> ${data.investment.fdr_no || '—'}</div>
            <div class="meta-cell"><strong>Fund:</strong> ${data.investment.fund_name || '—'}</div>
            <div class="meta-cell"><strong>Bank:</strong> ${data.investment.bank_name || '—'}</div>
            <div class="meta-cell"><strong>Status:</strong> ${data.investment.status || '—'}</div>
          </section>

          <section class="statement-print">
            ${printContent.innerHTML}
          </section>

          <section class="statement-print footer">
            <div>Prepared by ${organizationName}</div>
            <div>FDR Bank Statement</div>
            <div>${reportDate}</div>
          </section>
        </section>
      </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (err) {
        printWindow.close();
        window.print();
      } finally {
        setTimeout(() => printWindow.close(), 300);
      }
    }, 250);
  };

  const handleExport = () => {
    if (!data) return;
    const inv = data.investment;
    const rows = [
      ['FDR Bank Statement'],
      [`FDR No: ${inv.fdr_no}`, `Bank: ${inv.bank_name} (${inv.bank_branch})`],
      [`Fund: ${inv.fund_name || '—'} (${inv.acc_code || '—'})`, `Rate: ${inv.interest_rate}% p.a.`],
      [`Issue Date: ${inv.issue_date}`, `Maturity Date: ${inv.maturity_date}`],
      [],
      ['Date', 'Particulars', 'Note', 'DEBIT (BDT)', 'CREDIT (BDT)', 'BALANCE (BDT)', 'Event Type'],
      ...data.ledger.map(r => [
        r.date || '',
        r.particulars,
        r.note || '',
        r.debit != null ? r.debit : '',
        r.credit != null ? r.credit : '',
        r.balance != null ? r.balance : '',
        r.event_type
      ]),
      [],
      ['TOTALS', '', '', data.summary.totalDebits, data.summary.totalCredits, data.summary.netBalance, ''],
    ];

    let csv = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FDR_Statement_${inv.fdr_no.replace(/[/\\]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColor = (status) => {
    const m = { Active: '#10b981', Matured: '#f59e0b', Renewed: '#fbbf24', Encashed: '#ef4444' };
    return m[status] || '#94a3b8';
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9000 }}>
      <div
        className="modal-content glass-panel"
        style={{
          width: '100%', maxWidth: '1100px',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* ===== TOP HEADER BAR ===== */}
        <div 
          className="no-print"
          style={{
            background: 'var(--table-th-bg)',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Activity size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '0.3px' }}>
                FDR Bank Statement
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>
                {invFdrNo} — Complete Debit / Credit Ledger
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleExport} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 14px' }}>
              <FileSpreadsheet size={15} /> <span>Export CSV</span>
            </button>
            <button onClick={handlePrint} className="btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }}>
              <Printer size={15} /> <span>Print Statement</span>
            </button>
            <button 
              onClick={onClose} 
              style={{
                background: 'var(--bg-card-hover)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                padding: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Loading bank statement ledger...</div>
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
              <AlertCircle size={28} style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: '700' }}>Error: {error}</div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* ===== PRINTABLE AREA ===== */}
              <div ref={printRef} id="fdr-print-area">

                {/* Print Header (visible in print) */}
                <div className="header-block" style={{ textAlign: 'center', marginBottom: '20px', display: 'none' }} id="print-header-only">
                  <h1>{settings.org_name || 'Organization Name'}</h1>
                  <p>{settings.org_address || ''}</p>
                  <div className="divider" />
                  <h2>FDR / INVESTMENT ACCOUNT STATEMENT</h2>
                  <p>FDR No: {data.investment.fdr_no} | Generated: {new Date().toLocaleDateString('en-BD')}</p>
                </div>

                {/* ===== INVESTMENT INFO HEADER ===== */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
                  background: 'var(--bg-card-hover)', borderRadius: '12px',
                  border: '1px solid var(--border-color)', padding: '20px', marginBottom: '20px'
                }}>
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '0.5px', margin: 0 }}>
                        {data.investment.fdr_no}
                      </h3>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                        background: `${statusColor(data.investment.status)}1f`,
                        color: statusColor(data.investment.status),
                        border: `1px solid ${statusColor(data.investment.status)}55`
                      }}>
                        {data.investment.status}
                      </span>
                    </div>
                    <InfoRow label="Bank" value={`${data.investment.bank_name}`} color="var(--text-main)" />
                    <InfoRow label="Branch" value={data.investment.bank_branch || 'Main Branch'} />
                    <InfoRow label="Account No" value={data.investment.account_no || 'N/A'} />
                    <InfoRow label="Investment Type" value={data.investment.investment_type} color="var(--primary)" />
                    <InfoRow label="Sanction Ref" value={data.investment.sanction_ref || '—'} />
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>Fund Category</div>
                      <div style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--primary)' }}>
                        {data.investment.acc_code || '—'} — {data.investment.fund_name || 'General Fund'}
                      </div>
                    </div>
                    {data.investment.initialPrincipal && data.investment.initialPrincipal !== data.investment.principal_amount ? (
                      <>
                        <InfoRow label="Initial Principal" value={formatCurrency(data.investment.initialPrincipal)} color="var(--text-muted)" />
                        <InfoRow label="Current Principal" value={formatCurrency(data.investment.principal_amount)} color="#10b981" />
                      </>
                    ) : (
                      <InfoRow label="Principal Amount" value={formatCurrency(data.investment.principal_amount)} color="#10b981" />
                    )}
                    <InfoRow label="Interest Rate" value={`${data.investment.interest_rate}% p.a.`} color="var(--primary)" />
                    <InfoRow label="Initial Opening Date" value={formatDate(data.investment.initialOpeningDate || data.investment.first_issue_date || data.investment.issue_date)} color="var(--text-main)" />
                    {data.investment.issue_date !== (data.investment.initialOpeningDate || data.investment.first_issue_date) &&
                     new Date(data.investment.initialOpeningDate || data.investment.first_issue_date) < new Date(data.investment.issue_date) && (
                      <InfoRow label="Latest Issue Date" value={formatDate(data.investment.issue_date)} />
                    )}
                    <InfoRow label="Maturity Date" value={formatDate(data.investment.maturity_date)} color="#f59e0b" />
                    <InfoRow label="Tenure" value={`${data.investment.tenure_months} months`} />
                  </div>
                </div>

                {/* ===== SUMMARY CARDS ===== */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                  <SummaryCard label="Total Credits (BDT)" value={formatCurrency(data.summary.totalCredits)} color="#10b981" icon={<TrendingUp size={18} />} />
                  <SummaryCard label="Total Debits (BDT)" value={formatCurrency(data.summary.totalDebits)} color="#ef4444" icon={<TrendingDown size={18} />} />
                  <SummaryCard
                    label="Net Balance (BDT)"
                    value={formatCurrency(data.summary.netBalance)}
                    color={data.summary.netBalance >= 0 ? '#10b981' : '#ef4444'}
                    icon={<Activity size={18} />}
                  />
                  <SummaryCard label="Ledger Rows" value={data.ledger.length} color="var(--primary)" icon={<FileSpreadsheet size={18} />} />
                </div>

                {/* ===== MAIN LEDGER TABLE ===== */}
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45px', textAlign: 'center' }}>SL</th>
                        <th style={{ width: '100px' }}>DATE</th>
                        <th>PARTICULARS</th>
                        <th style={{ width: '100px' }}>TYPE</th>
                        <th style={{ textAlign: 'right', color: '#ef4444' }}>DEBIT (BDT)</th>
                        <th style={{ textAlign: 'right', color: '#10b981' }}>CREDIT (BDT)</th>
                        <th style={{ textAlign: 'right' }}>BALANCE (BDT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ledger.map((row, idx) => {
                        const style = getEventStyle(row.event_type);
                        const isInfoRow = row.debit == null && row.credit == null;
                        return (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>{idx + 1}</td>
                            <td style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '12px' }}>
                              {row.date ? formatDate(row.date) : <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>—</span>}
                            </td>
                            <td style={{ maxWidth: '380px' }}>
                              <div style={{ color: isInfoRow ? '#a855f7' : 'var(--text-main)', fontWeight: isInfoRow ? '600' : '700', fontSize: '13px' }}>
                                {row.particulars}
                              </div>
                              {row.note && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                  <ChevronRight size={12} color="var(--primary)" />
                                  {row.note}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                                background: `${style.badge}22`, color: style.badge,
                                border: `1px solid ${style.badge}44`
                              }}>
                                {style.label}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                              {row.debit > 0
                                ? <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '13px' }}>{formatCurrency(row.debit)}</span>
                                : <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                              {row.credit > 0
                                ? <span style={{ color: '#10b981', fontWeight: '800', fontSize: '13px' }}>{formatCurrency(row.credit)}</span>
                                : <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                              {row.balance != null
                                ? <span style={{
                                  color: row.balance >= 0 ? 'var(--primary)' : '#ef4444',
                                  fontWeight: '800', fontSize: '13.5px'
                                }}>{formatCurrency(row.balance)}</span>
                                : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' }}>info</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* TOTALS ROW */}
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-main)', fontSize: '13px' }}>
                          STATEMENT TOTALS
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444', fontSize: '14px', fontFamily: 'monospace' }}>
                          {formatCurrency(data.summary.totalDebits)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#10b981', fontSize: '14px', fontFamily: 'monospace' }}>
                          {formatCurrency(data.summary.totalCredits)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--primary)', fontSize: '15px', fontFamily: 'monospace' }}>
                          {formatCurrency(data.summary.netBalance)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* ===== RENEWAL CHILDREN SECTION ===== */}
                {data.renewalChildren && data.renewalChildren.length > 0 && (
                  <div style={{ marginTop: '20px', background: 'var(--bg-card-hover)', borderRadius: '10px', border: '1px solid var(--border-color)', padding: '16px' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#f59e0b', marginBottom: '10px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={15} />
                      <span>Renewal Chain — New FDR(s) Created from This Investment</span>
                    </h4>
                    {data.renewalChildren.map((ch, i) => (
                      <div key={i} style={{ display: 'flex', gap: '20px', fontSize: '12.5px', color: 'var(--text-main)', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px 12px', marginBottom: '6px', border: '1px solid var(--border-color)' }}>
                        <span><strong style={{ color: '#f59e0b' }}>{ch.fdr_no}</strong></span>
                        <span>Issued: {formatDate(ch.issue_date)}</span>
                        <span style={{ color: '#10b981', fontWeight: '700' }}>Principal: {formatCurrency(ch.principal_amount)}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Rate: {ch.interest_rate}%</span>
                        <span style={{
                          color: statusColor(ch.status),
                          fontWeight: '800',
                          padding: '1px 8px', borderRadius: '12px',
                          background: `${statusColor(ch.status)}22`,
                          border: `1px solid ${statusColor(ch.status)}44`
                        }}>{ch.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer note */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  <span>Statement generated: {new Date().toLocaleString('en-BD')}</span>
                  <span>
                    {settings.org_name || ''} — Fund Management System
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', minWidth: '120px', flexShrink: 0 }}>{label}:</span>
      <span style={{ fontSize: '13.5px', fontWeight: '700', color: color || 'var(--text-main)' }}>{value}</span>
    </div>
  );
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'var(--bg-card-hover)', borderRadius: '12px',
      border: `1px solid var(--border-color)`,
      borderLeft: `4px solid ${color}`,
      padding: '14px 16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, marginBottom: '6px', fontWeight: '700' }}>
        {icon}
        <span style={{ fontSize: '12px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{value}</div>
    </div>
  );
}
