import React from 'react';
import { 
  Wallet, 
  Landmark, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Percent, 
  Receipt, 
  ArrowRight,
  FileText,
  Clock,
  PieChart as PieIcon,
  Activity,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard({ stats, loading, onNavigate }) {
  if (loading || !stats) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '600' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #0284c7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: '12px' }}>Loading investment dashboard statistics...</div>
      </div>
    );
  }

  const chartColors = ['#0284c7', '#10b981', '#f59e0b', '#a855f7', '#f43f5e'];

  const typeData = [
    { name: 'FDR Investment', value: stats.totalFdrInvestment || 0 },
    { name: 'Savings Certificates', value: stats.totalSavingsCertInvestment || 0 }
  ];

  const pgStats = stats.providentGratuityStats || {
    total: 0,
    govtBankAmount: 0,
    privateBankAmount: 0,
    govtBankPercent: 0,
    privateBankPercent: 0
  };

  const otherStats = stats.otherFundsStats || {
    total: 0,
    govtBankAmount: 0,
    privateBankAmount: 0,
    govtBankPercent: 0,
    privateBankPercent: 0
  };

  const totalPortfolio = (stats.totalFdrInvestment || 0) + (stats.totalSavingsCertInvestment || 0);
  const fdrPct = totalPortfolio > 0 ? Math.round(((stats.totalFdrInvestment || 0) / totalPortfolio) * 100) : 0;
  const certPct = 100 - fdrPct;
  const fundCategoryTotal = Math.max((pgStats.total || 0) + (otherStats.total || 0), 1);
  const pgPct = fundCategoryTotal > 0 ? Math.round(((pgStats.total || 0) / fundCategoryTotal) * 100) : 0;
  const otherPct = 100 - pgPct;
  const fundDistribution = (stats.fundDistribution || []).map(item => ({
    ...item,
    fund_name: item.fund_name && item.fund_name.trim() ? item.fund_name : 'General Fund'
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* TIER 1: PRIMARY INVESTMENT STATS CARDS (4 CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
        <StatsCard
          title="Total Investment"
          value={formatCurrency(stats.totalInvestment)}
          subtext="Combined Principal Value"
          icon={Wallet}
          color="blue"
          trend="up"
          trendValue="Principal"
          sparklineType="up"
          compact={true}
        />
        <StatsCard
          title="Total FDR Investment"
          value={formatCurrency(stats.totalFdrInvestment)}
          subtext={`${stats.activeFdrsCount} Active Certificates`}
          icon={Landmark}
          color="emerald"
          trend="up"
          trendValue={`${fdrPct}% Share`}
          sparklineType="up"
          compact={true}
        />
        <StatsCard
          title="Total Savings Certificate"
          value={formatCurrency(stats.totalSavingsCertInvestment)}
          subtext={`${stats.activeSavingsCertCount} Active Certificates`}
          icon={TrendingUp}
          color="purple"
          trend="down"
          trendValue={`${certPct}% Share`}
          sparklineType="down"
          compact={true}
        />
        <StatsCard
          title="Estimated Net Profit"
          value={formatCurrency(stats.totalNetInterest || 0)}
          subtext="Net Return (After Tax & Excise)"
          icon={CheckCircle2}
          color="amber"
          trend="up"
          trendValue={stats.totalInvestment > 0 ? `${((stats.totalNetInterest / stats.totalInvestment) * 100).toFixed(1)}%` : 'Active'}
          sparklineType="up"
          compact={true}
        />
      </div>

      {/* TIER 2: STATUTORY PROVISIONS & MATURITY ALERTS STRIP (6 CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        <StatsCard
          title="Accrued Interest"
          value={formatCurrency(stats.totalAccruedInterest)}
          subtext="Gross Accrued Profit"
          icon={TrendingUp}
          color="teal"
          trend="up"
          trendValue="Accrued"
          sparklineType="up"
          compact={true}
        />
        <StatsCard
          title="Tax Provision (AIT)"
          value={formatCurrency(stats.totalTaxProvision)}
          subtext="Deductible AIT Tax"
          icon={Percent}
          color="rose"
          trend="down"
          trendValue="Tax Slab"
          sparklineType="down"
          compact={true}
        />
        <StatsCard
          title="Excise Duty"
          value={formatCurrency(stats.totalExciseDuty)}
          subtext="National Duty Slabs"
          icon={Receipt}
          color="amber"
          trend="down"
          trendValue="Excise"
          sparklineType="down"
          compact={true}
        />
        <StatsCard
          title="Net Receivable"
          value={formatCurrency(stats.totalNetInterest)}
          subtext="Net Profit Receivable"
          icon={CheckCircle2}
          color="indigo"
          trend="up"
          trendValue="Net Profit"
          sparklineType="up"
          compact={true}
        />

        {/* 30-Day Urgent Action Alert Card */}
        <div 
          onClick={() => onNavigate('investments')}
          className="glass-panel" 
          style={{ 
            padding: '11px 13px', 
            cursor: 'pointer',
            borderRadius: '12px',
            borderTop: '3px solid #ef4444',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
            background: stats.maturing30Days > 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(15, 23, 42, 0.88) 100%)' : undefined
          }}
          title="Click to view maturing investments"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '800', 
              padding: '2px 6px', 
              borderRadius: '6px', 
              background: stats.maturing30Days > 0 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #10b981, #059669)', 
              color: '#ffffff'
            }}>
              {stats.maturing30Days > 0 ? 'URGENT (30D)' : 'CLEAR (30D)'}
            </span>
            <div style={{ 
              background: stats.maturing30Days > 0 ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #10b981, #047857)', 
              padding: '6px', 
              borderRadius: '8px'
            }}>
              <Clock size={14} color="#ffffff" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginTop: '3px', color: stats.maturing30Days > 0 ? '#ef4444' : '#10b981' }}>
              {stats.maturing30Days} <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Due</span>
            </h3>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
              Within 30 Days
            </p>
          </div>
        </div>

        {/* 90-Day Upcoming Maturities Card */}
        <div 
          onClick={() => onNavigate('investments')}
          className="glass-panel" 
          style={{ 
            padding: '11px 13px', 
            cursor: 'pointer',
            borderRadius: '12px',
            borderTop: '3px solid #f59e0b',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(15, 23, 42, 0.88) 100%)'
          }}
          title="Click to view maturing investments"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '800', 
              padding: '2px 6px', 
              borderRadius: '6px', 
              background: 'linear-gradient(90deg, #f59e0b, #d97706)', 
              color: '#ffffff'
            }}>
              UPCOMING (90D)
            </span>
            <div style={{ 
              background: 'linear-gradient(135deg, #f59e0b, #b45309)', 
              padding: '6px', 
              borderRadius: '8px'
            }}>
              <Calendar size={14} color="#ffffff" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginTop: '3px', color: '#d97706' }}>
              {stats.maturing90Days} <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Due</span>
            </h3>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
              Within 90 Days
            </p>
          </div>
        </div>
      </div>

      {/* TIER 3: VISUAL ANALYTICS & QUICK ACTION TABLE (3 COLUMNS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(250px, 1.05fr) minmax(320px, 1.35fr)', gap: '10px', alignItems: 'stretch' }}>
        
        {/* Panel 1: Bankwise Distribution */}
        <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', borderTop: '3px solid #0e9475' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'linear-gradient(135deg, #0e9475, #085c48)', padding: '6px', borderRadius: '8px' }}>
                <Landmark size={13} color="#ffffff" />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bank Distribution</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(14, 148, 117, 0.12)', color: '#0e9475', padding: '2px 7px', borderRadius: '6px', border: '1px solid rgba(14, 148, 117, 0.25)' }}>{(stats.bankDistribution || []).length} Banks</span>
          </div>

          {(stats.bankDistribution || []).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '12px 0' }}>No bank distribution available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '185px', overflowY: 'auto', paddingRight: '4px' }}>
              {(() => {
                const ranked = [...(stats.bankDistribution || [])].sort((a, b) => b.total_amount - a.total_amount);
                const max = Math.max(...ranked.map(item => item.total_amount), 1);
                return ranked.slice(0, 8).map((bank, i) => {
                  const width = Math.max((bank.total_amount / max) * 100, 4);
                  return (
                    <div key={bank.bank_name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: 'var(--text-main)', marginBottom: '2px' }}>
                        <span style={{ fontWeight: '700', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bank.bank_name}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '10px' }}>{formatCurrency(bank.total_amount)}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(148, 163, 184, 0.12)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${width}%`, height: '100%', background: i % 3 === 0 ? 'linear-gradient(90deg, #0284c7, #10b981)' : i % 3 === 1 ? 'linear-gradient(90deg, #8b5cf6, #7c3aed)' : 'linear-gradient(90deg, #f59e0b, #e11d48)', borderRadius: '10px' }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Panel 2: Fundwise Graph & Fund Breakdown */}
        <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', borderTop: '3px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', padding: '6px', borderRadius: '8px' }}>
                <PieIcon size={13} color="#ffffff" />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fund Allocation</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', padding: '2px 7px', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>{fundDistribution.length} Funds</span>
          </div>

          {/* Category Split */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
            {[
              { label: 'Provident + Gratuity', amount: pgStats.total, color: '#10b981', percent: pgPct },
              { label: 'Other Funds', amount: otherStats.total, color: '#f59e0b', percent: otherPct }
            ].map((cat, i) => {
              const max = Math.max(pgStats.total, otherStats.total, 1);
              const width = Math.max((cat.amount / max) * 100, 3);
              return (
                <div key={cat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-main)', marginBottom: '2px' }}>
                    <span style={{ fontWeight: '700' }}>{cat.label} ({cat.percent}%)</span>
                    <span style={{ color: cat.color, fontWeight: '800' }}>{formatCurrency(cat.amount)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(148, 163, 184, 0.12)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: `linear-gradient(90deg, ${cat.color}, ${i===0 ? '#059669' : '#d97706'})`, borderRadius: '10px' }} />
                  </div>
                  {cat.label === 'Provident + Gratuity' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '2px' }}>
                      <span>Govt {pgStats.govtBankPercent || 0}%</span>
                      <span>Pvt {pgStats.privateBankPercent || 0}%</span>
                    </div>
                  )}
                  {cat.label === 'Other Funds' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '2px' }}>
                      <span>Govt {otherStats.govtBankPercent || 0}%</span>
                      <span>Pvt {otherStats.privateBankPercent || 0}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fund Name Breakdown list */}
          <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.12)', paddingTop: '6px', flex: 1, minHeight: 0 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>Fund Name Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '95px', overflowY: 'auto', paddingRight: '4px' }}>
              {(fundDistribution || []).map((fund, i) => (
                <div key={fund.fund_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{fund.fund_name}</span>
                  <span style={{ color: '#8b5cf6', fontWeight: '700' }}>{formatCurrency(fund.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: Investments Maturing Soon Quick Action Table */}
        <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', padding: '6px', borderRadius: '8px' }}>
                <Clock size={13} color="#ffffff" />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Expiring Soon (90 Days)
              </span>
            </div>
            <button 
              onClick={() => onNavigate('investments')} 
              className="btn-secondary"
              style={{ fontSize: '10.5px', padding: '3px 8px', color: '#0e9475', border: '1px solid rgba(14, 148, 117, 0.30)', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <span>View All</span>
              <ArrowRight size={11} />
            </button>
          </div>

          {(!stats.upcomingMaturities || stats.upcomingMaturities.length === 0) ? (
            <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px', background: 'rgba(148, 163, 184, 0.05)', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              No investments maturing within 90 days.
            </div>
          ) : (
            <div style={{ maxHeight: '185px', overflowY: 'auto', paddingRight: '2px' }}>
              <table className="data-table" style={{ fontSize: '10.5px', width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(148, 163, 184, 0.08)' }}>
                    <th style={{ padding: '5px 6px' }}>FDR No</th>
                    <th style={{ padding: '5px 6px' }}>Bank</th>
                    <th style={{ padding: '5px 6px' }}>Principal</th>
                    <th style={{ padding: '5px 6px' }}>Due</th>
                    <th style={{ padding: '5px 6px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.upcomingMaturities.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ padding: '5px 6px', fontWeight: '700' }}>{inv.fdr_no}</td>
                      <td style={{ padding: '5px 6px', color: 'var(--text-muted)', maxWidth: '105px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.bank_name}</td>
                      <td style={{ padding: '5px 6px', fontWeight: '700', color: '#059669' }}>{formatCurrency(inv.principal_amount)}</td>
                      <td style={{ padding: '5px 6px' }}>
                        <span className="badge" style={{
                          background: inv.days_left <= 30 ? '#fee2e2' : '#fef3c7',
                          color: inv.days_left <= 30 ? '#dc2626' : '#b45309',
                          border: `1px solid ${inv.days_left <= 30 ? '#fca5a5' : '#fde68a'}`,
                          fontWeight: '800',
                          fontSize: '9.5px',
                          padding: '1px 4px'
                        }}>
                          {inv.days_left}d
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => onNavigate('proposals', { newForInv: inv })}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '2px 6px',
                              borderRadius: '5px',
                              fontWeight: '700',
                              fontSize: '9.5px',
                              cursor: 'pointer'
                            }}
                            title="Renewal Proposal"
                          >
                            Prop
                          </button>
                          <button 
                            onClick={() => onNavigate('letters', { newForInv: inv })}
                            style={{
                              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '2px 6px',
                              borderRadius: '5px',
                              fontWeight: '700',
                              fontSize: '9.5px',
                              cursor: 'pointer'
                            }}
                            title="Bank Letter"
                          >
                            Ltr
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
      </div>
    </div>
  );
}
