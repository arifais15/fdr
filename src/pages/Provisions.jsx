import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Plus, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  Percent, 
  Receipt,
  Layers,
  FileSpreadsheet,
  Pencil,
  AlertCircle,
  HelpCircle,
  ArrowRightLeft
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { calculateInterestDetails, calculateExciseDuty } from '../utils/financial';
import { api } from '../utils/api';
import { exportTableToExcel } from '../utils/exportHelper';

export default function Provisions({ showToast, onRefreshStats }) {
  const [provisions, setProvisions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  // Modals
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Mode for Single Provision: 'auto' | 'manual'
  const [entryMode, setEntryMode] = useState('auto');

  // Single provision form
  const [singleForm, setSingleForm] = useState({
    investment_id: '',
    provision_date: new Date().toISOString().split('T')[0],
    period_start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    gross_interest: '',
    tax_rate: '10',
    tax_amount: '',
    excise_duty: '0',
    bank_charge: '0',
    net_interest: '',
    notes: 'Monthly interest provision calculation'
  });

  // Edit provision form
  const [editForm, setEditForm] = useState({
    id: null,
    investment_id: '',
    fdr_no: '',
    bank_name: '',
    provision_date: '',
    period_start: '',
    period_end: '',
    gross_interest: '',
    tax_rate: '',
    tax_amount: '',
    excise_duty: '',
    bank_charge: '',
    net_interest: '',
    notes: ''
  });

  // Batch provision form
  const [batchForm, setBatchForm] = useState({
    provision_date: new Date().toISOString().split('T')[0],
    period_start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [provData, invData, settingsData] = await Promise.all([
        api.getProvisions(),
        api.getInvestments({ status: 'Active' }),
        api.getSettings()
      ]);
      setProvisions(provData);
      setInvestments(invData);
      setSettings(settingsData || {});
      if (invData.length > 0 && !singleForm.investment_id) {
        setSingleForm(prev => ({ ...prev, investment_id: invData[0].id }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Live calculation for single form (auto mode)
  const currentInv = investments.find(i => i.id === parseInt(singleForm.investment_id));
  const currentInvProvisions = provisions.filter(p => p.investment_id === parseInt(singleForm.investment_id));
  const calcResult = currentInv ? calculateInterestDetails(
    currentInv.principal_amount,
    currentInv.interest_rate,
    singleForm.period_start,
    singleForm.period_end,
    currentInv.tin_provided !== undefined ? currentInv.tin_provided : 1,
    currentInv.issue_date,
    settings,
    currentInv.fund_name,
    currentInv.acc_code,
    currentInvProvisions
  ) : null;

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    try {
      let postData = {};
      if (entryMode === 'auto') {
        if (!calcResult) return;
        postData = {
          investment_id: singleForm.investment_id,
          provision_date: singleForm.provision_date,
          period_start: calcResult.effectivePeriodStart || singleForm.period_start,
          period_end: singleForm.period_end,
          gross_interest: calcResult.grossInterest,
          tax_rate: calcResult.taxRate,
          excise_duty: calcResult.exciseDuty,
          bank_charge: parseFloat(singleForm.bank_charge || 0),
          notes: singleForm.notes
        };
      } else {
        // Manual override / reversal mode
        const gross = parseFloat(singleForm.gross_interest || 0);
        const taxRate = parseFloat(singleForm.tax_rate || 0);
        const taxVal = singleForm.tax_amount !== '' ? parseFloat(singleForm.tax_amount) : Math.round(gross * (taxRate / 100));
        const exciseVal = parseFloat(singleForm.excise_duty || 0);
        const bankChargeVal = parseFloat(singleForm.bank_charge || 0);
        const netVal = singleForm.net_interest !== '' ? parseFloat(singleForm.net_interest) : Math.round(gross - taxVal - exciseVal - bankChargeVal);

        postData = {
          investment_id: singleForm.investment_id,
          provision_date: singleForm.provision_date,
          period_start: singleForm.period_start,
          period_end: singleForm.period_end,
          gross_interest: gross,
          tax_rate: taxRate,
          tax_amount: taxVal,
          excise_duty: exciseVal,
          bank_charge: bankChargeVal,
          net_interest: netVal,
          notes: singleForm.notes || (gross < 0 ? 'Manual provision reversal entry' : 'Manual provision adjustment entry')
        };
      }

      await api.createProvision(postData);
      showToast(entryMode === 'manual' && parseFloat(singleForm.gross_interest) < 0 ? 'Provision reversal entry posted successfully' : 'Interest provision posted successfully', 'success');
      setIsSingleModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openEditModal = (p) => {
    setEditForm({
      id: p.id,
      investment_id: p.investment_id,
      fdr_no: p.fdr_no,
      bank_name: p.bank_name,
      provision_date: p.provision_date,
      period_start: p.period_start,
      period_end: p.period_end,
      gross_interest: p.gross_interest,
      tax_rate: p.tax_rate || 10,
      tax_amount: p.tax_amount,
      excise_duty: p.excise_duty,
      bank_charge: p.bank_charge || 0,
      net_interest: p.net_interest,
      notes: p.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const gross = parseFloat(editForm.gross_interest || 0);
      const taxRate = parseFloat(editForm.tax_rate || 0);
      const taxVal = editForm.tax_amount !== '' ? parseFloat(editForm.tax_amount) : Math.round(gross * (taxRate / 100));
      const exciseVal = parseFloat(editForm.excise_duty || 0);
      const bankChargeVal = parseFloat(editForm.bank_charge || 0);
      const netVal = editForm.net_interest !== '' ? parseFloat(editForm.net_interest) : Math.round(gross - taxVal - exciseVal - bankChargeVal);

      await api.updateProvision(editForm.id, {
        provision_date: editForm.provision_date,
        period_start: editForm.period_start,
        period_end: editForm.period_end,
        gross_interest: gross,
        tax_rate: taxRate,
        tax_amount: taxVal,
        excise_duty: exciseVal,
        bank_charge: bankChargeVal,
        net_interest: netVal,
        notes: editForm.notes
      });

      showToast('Provision entry updated successfully! Financial statements dynamically refreshed.', 'success');
      setIsEditModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.batchPostProvisions(batchForm);
      showToast(res.message, 'success');
      setIsBatchModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleting(true);
      await api.deleteProvision(deleteTargetId);
      showToast('Provision entry deleted/reversed successfully. Reports updated.', 'info');
      setDeleteTargetId(null);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Group provisions by Fund Category -> FDR No
  const groupedProvisions = {};
  let grandTotalGross = 0;
  let grandTotalTax = 0;
  let grandTotalExcise = 0;
  let grandTotalBankCharge = 0;
  let grandTotalNet = 0;

  provisions.forEach(p => {
    const fundKey = p.acc_code ? `${p.acc_code} - ${p.fund_name}` : 'Unassigned / General Fund';
    const fdrKey = p.fdr_no || 'Unknown FDR';

    if (!groupedProvisions[fundKey]) {
      groupedProvisions[fundKey] = {
        name: fundKey,
        fdrGroups: {},
        totalGross: 0,
        totalTax: 0,
        totalExcise: 0,
        totalBankCharge: 0,
        totalNet: 0
      };
    }

    if (!groupedProvisions[fundKey].fdrGroups[fdrKey]) {
      groupedProvisions[fundKey].fdrGroups[fdrKey] = {
        fdrNo: fdrKey,
        items: [],
        totalGross: 0,
        totalTax: 0,
        totalExcise: 0,
        totalBankCharge: 0,
        totalNet: 0
      };
    }

    const fdrGroup = groupedProvisions[fundKey].fdrGroups[fdrKey];
    fdrGroup.items.push(p);
    fdrGroup.totalGross += p.gross_interest || 0;
    fdrGroup.totalTax += p.tax_amount || 0;
    fdrGroup.totalExcise += p.excise_duty || 0;
    fdrGroup.totalBankCharge += p.bank_charge || 0;
    fdrGroup.totalNet += p.net_interest || 0;

    groupedProvisions[fundKey].totalGross += p.gross_interest || 0;
    groupedProvisions[fundKey].totalTax += p.tax_amount || 0;
    groupedProvisions[fundKey].totalExcise += p.excise_duty || 0;
    groupedProvisions[fundKey].totalBankCharge += p.bank_charge || 0;
    groupedProvisions[fundKey].totalNet += p.net_interest || 0;

    grandTotalGross += p.gross_interest || 0;
    grandTotalTax += p.tax_amount || 0;
    grandTotalExcise += p.excise_duty || 0;
    grandTotalBankCharge += p.bank_charge || 0;
    grandTotalNet += p.net_interest || 0;
  });

  const groupedEntries = Object.values(groupedProvisions);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* HEADER BAR */}
      <div className="glass-panel" style={{ padding: '6px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>Periodic Interest &amp; Tax Provision Ledger</span>
              <button 
                onClick={() => setShowGuide(!showGuide)} 
                className="btn-secondary" 
                style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              >
                <HelpCircle size={12} />
                <span>{showGuide ? 'Hide Guide' : 'Guide'}</span>
              </button>
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setIsBatchModalOpen(true)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '11.5px' }}>
              <Layers size={14} />
              <span>Batch Provision</span>
            </button>
            <button onClick={() => { setEntryMode('auto'); setIsSingleModalOpen(true); }} className="btn-primary" style={{ padding: '5px 12px', fontSize: '11.5px' }}>
              <Plus size={15} />
              <span>Post Provision</span>
            </button>
            <button onClick={() => exportTableToExcel('provisions-table', 'Interest_Provisions.xlsx')} className="btn-success" style={{ padding: '5px 10px', fontSize: '11.5px' }}>
              <FileSpreadsheet size={14} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* ACCOUNTING & REVERSAL GUIDE BANNER */}
        {showGuide && (
          <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-main)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} />
              How to Adjust or Reverse Provisions &amp; Impact on Financial Statements
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '8px 10px', borderRadius: '6px' }}>
                <strong style={{ color: '#60a5fa' }}>1. Reversing a Wrong Provision Entry</strong>
                <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  • <strong>Delete:</strong> Click the red trash button (<Trash2 size={11} style={{ inlineSize: '11px' }} />) to delete.<br />
                  • <strong>Manual Reversal:</strong> Switch to <em>Manual Override &amp; Reversal Mode</em> with negative figures (e.g. <code>-50000</code>).
                </p>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '8px 10px', borderRadius: '6px' }}>
                <strong style={{ color: '#34d399' }}>2. Adjusting Provision Amounts</strong>
                <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  • Click the blue edit button (<Pencil size={11} style={{ inlineSize: '11px' }} />) to edit.<br />
                  • Modify Gross Interest, Tax, or Excise Duty directly to match bank advice.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                <strong style={{ color: '#fbbf24' }}>3. Real-Time Impact on Reports</strong>
                <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                  • Instantly updates FDR Bank Statement, Income Statement, and Accrual Financial Statements.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROVISIONS TABLE */}
      <div className="glass-panel" style={{ padding: '8px 12px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading provision ledgers...</div>
        ) : provisions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No provision entries posted yet. Click "Post Single Provision / Reversal" or "Batch Provision" above.
          </div>
        ) : (
          <div className="data-table-container">
            <table id="provisions-table" className="data-table">
              <thead>
                <tr>
                  <th>Posting Date</th>
                  <th>Investment FDR</th>
                  <th>Principal Amount</th>
                  <th>Issue / Reissue Date</th>
                  <th>Bank Name</th>
                  <th>Period Covered</th>
                  <th style={{ textAlign: 'right' }}>Gross Interest</th>
                  <th style={{ textAlign: 'right' }}>Tax Deducted</th>
                  <th style={{ textAlign: 'right' }}>Excise Duty</th>
                  <th style={{ textAlign: 'right' }}>Net Receivable</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedEntries.map(fundGroup => (
                  <React.Fragment key={fundGroup.name}>
                    {/* Fund Header Row */}
                    <tr style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', borderTop: '2px solid #38bdf8' }}>
                      <td colSpan={11} style={{ padding: '12px 16px', fontWeight: '800', color: '#38bdf8', fontSize: '13px' }}>
                        Fund Category: {fundGroup.name}
                      </td>
                    </tr>

                    {/* Loop over FDR Groups within Fund */}
                    {Object.values(fundGroup.fdrGroups).map(fdrGroup => (
                      <React.Fragment key={`${fundGroup.name}-${fdrGroup.fdrNo}`}>
                        
                        {/* Provision Rows for this FDR */}
                        {fdrGroup.items.map(p => {
                          const isReversal = (p.gross_interest || 0) < 0;
                          return (
                            <tr key={p.id} style={{ backgroundColor: isReversal ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                              <td>
                                <strong style={{ color: isReversal ? '#f87171' : 'var(--text-main)' }}>
                                  {formatDate(p.provision_date)}
                                </strong>
                                {isReversal && <span className="badge badge-danger" style={{ marginLeft: '6px', fontSize: '10px' }}>Reversal</span>}
                              </td>
                              <td>
                                <div style={{ fontWeight: '600', color: '#60a5fa' }}>{p.fdr_no}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.investment_type}</div>
                              </td>
                              <td><strong style={{ color: '#34d399' }}>{formatCurrency(p.principal_amount)}</strong></td>
                              <td>{formatDate(p.issue_date)}</td>
                              <td>{p.bank_name}</td>
                              <td>{formatDate(p.period_start)} to {formatDate(p.period_end)}</td>
                              <td style={{ textAlign: 'right' }}>
                                <strong style={{ color: isReversal ? '#f87171' : '#34d399' }}>
                                  {formatCurrency(p.gross_interest)}
                                </strong>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span style={{ color: '#fb7185' }}>{formatCurrency(p.tax_amount)} ({p.tax_rate}%)</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span style={{ color: '#fb7185' }}>{formatCurrency(p.excise_duty)}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <strong style={{ color: isReversal ? '#ef4444' : '#3b82f6', fontSize: '15px' }}>
                                  {formatCurrency(p.net_interest)}
                                </strong>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => openEditModal(p)}
                                    className="btn-secondary"
                                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid rgba(96, 165, 250, 0.4)', color: '#60a5fa' }}
                                    title="Edit / Adjust Provision"
                                  >
                                    <Pencil size={14} />
                                  </button>

                                  <button 
                                    onClick={() => setDeleteTargetId(p.id)}
                                    className="btn-danger"
                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                    title="Delete / Reverse Provision Entry"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {/* FDR-Wise Subtotal Row */}
                        <tr style={{ backgroundColor: 'rgba(96, 165, 250, 0.08)', fontWeight: 'bold', borderBottom: '1px dashed #60a5fa' }}>
                          <td colSpan={6} style={{ textAlign: 'right', color: '#60a5fa', padding: '8px 12px' }}>
                            Subtotal (FDR #{fdrGroup.fdrNo}):
                          </td>
                          <td style={{ textAlign: 'right', color: '#34d399', padding: '8px 12px' }}>{formatCurrency(fdrGroup.totalGross)}</td>
                          <td style={{ textAlign: 'right', color: '#fb7185', padding: '8px 12px' }}>{formatCurrency(fdrGroup.totalTax)}</td>
                          <td style={{ textAlign: 'right', color: '#fb7185', padding: '8px 12px' }}>{formatCurrency(fdrGroup.totalExcise)}</td>
                          <td style={{ textAlign: 'right', color: '#60a5fa', padding: '8px 12px', fontSize: '13px' }}>{formatCurrency(fdrGroup.totalNet)}</td>
                          <td></td>
                        </tr>

                      </React.Fragment>
                    ))}

                    {/* Fund-Wise Subtotal Row */}
                    <tr style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', fontWeight: 'bold', borderBottom: '2px solid #38bdf8' }}>
                      <td colSpan={6} style={{ textAlign: 'right', color: '#38bdf8', padding: '10px 12px', fontSize: '13px' }}>
                        Subtotal ({fundGroup.name}):
                      </td>
                      <td style={{ textAlign: 'right', color: '#34d399', padding: '10px 12px', fontSize: '13px' }}>{formatCurrency(fundGroup.totalGross)}</td>
                      <td style={{ textAlign: 'right', color: '#fb7185', padding: '10px 12px', fontSize: '13px' }}>{formatCurrency(fundGroup.totalTax)}</td>
                      <td style={{ textAlign: 'right', color: '#fb7185', padding: '10px 12px', fontSize: '13px' }}>{formatCurrency(fundGroup.totalExcise)}</td>
                      <td style={{ textAlign: 'right', color: '#38bdf8', padding: '10px 12px', fontSize: '14px' }}>{formatCurrency(fundGroup.totalNet)}</td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                ))}

                {/* Grand Total Row */}
                {groupedEntries.length > 0 && (
                  <tr style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', fontWeight: 'bold', fontSize: '14px', borderTop: '3px double #10b981' }}>
                    <td colSpan={6} style={{ textAlign: 'right', color: 'var(--text-main)', padding: '12px' }}>GRAND TOTAL:</td>
                    <td style={{ textAlign: 'right', color: '#34d399', padding: '12px' }}>{formatCurrency(grandTotalGross)}</td>
                    <td style={{ textAlign: 'right', color: '#fb7185', padding: '12px' }}>{formatCurrency(grandTotalTax)}</td>
                    <td style={{ textAlign: 'right', color: '#fb7185', padding: '12px' }}>{formatCurrency(grandTotalExcise)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981', padding: '12px', fontSize: '15px' }}>{formatCurrency(grandTotalNet)}</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: SINGLE PROVISION / REVERSAL CALCULATOR */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title="Post Interest Provision or Reversal Entry"
        maxWidth="680px"
      >
        <form onSubmit={handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* MODE TOGGLE */}
          <div style={{ display: 'flex', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '8px', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setEntryMode('auto')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: entryMode === 'auto' ? '1px solid #2563eb' : '1px solid transparent',
                background: entryMode === 'auto' ? '#2563eb' : 'transparent',
                color: entryMode === 'auto' ? '#ffffff' : 'var(--text-main)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Auto-Calculated Mode
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('manual')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: entryMode === 'manual' ? '1px solid #d97706' : '1px solid transparent',
                background: entryMode === 'manual' ? '#d97706' : 'transparent',
                color: entryMode === 'manual' ? '#ffffff' : 'var(--text-main)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Manual Override & Reversal Mode
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Select Active Investment *</label>
            <select
              className="form-select"
              value={singleForm.investment_id}
              onChange={(e) => setSingleForm({ ...singleForm, investment_id: e.target.value })}
              required
            >
              {investments.map(inv => (
                <option key={inv.id} value={inv.id}>
                  #{inv.fdr_no} - {inv.bank_name} ({formatCurrency(inv.principal_amount)} @ {inv.interest_rate}%)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Provision Date *</label>
              <input
                type="date"
                className="form-input"
                value={singleForm.provision_date}
                onChange={(e) => setSingleForm({ ...singleForm, provision_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Period Start *</label>
              <input
                type="date"
                className="form-input"
                value={singleForm.period_start}
                onChange={(e) => setSingleForm({ ...singleForm, period_start: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Period End *</label>
              <input
                type="date"
                className="form-input"
                value={singleForm.period_end}
                onChange={(e) => setSingleForm({ ...singleForm, period_end: e.target.value })}
                required
              />
            </div>
          </div>

          {/* MODE 1: AUTO CALCULATION */}
          {entryMode === 'auto' && calcResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {calcResult.isOffsetted && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#eab308', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span><strong>Period Start Offset:</strong> Start date auto-adjusted to <strong>{calcResult.effectivePeriodStart}</strong> (previous periodEnd + 1 day) to avoid overlap with existing provisions.</span>
                </div>
              )}
              {calcResult.exciseAlreadyCharged && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span><strong>Single Excise Duty Rule:</strong> Excise duty set to <strong>BDT 0</strong> because excise duty was already charged for this FDR in calendar year <strong>{calcResult.effectivePeriodStart.substring(0, 4)}</strong>.</span>
                </div>
              )}
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', color: '#34d399', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Auto-Computed Interest & Tax ({calcResult.days} Days: {calcResult.effectivePeriodStart} to {singleForm.period_end})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Gross Accrued</div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{formatCurrency(calcResult.grossInterest)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Tax ({calcResult.taxRate}%)</div>
                    <div style={{ fontWeight: '700', color: '#fb7185' }}>{formatCurrency(calcResult.taxAmount)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Excise Duty</div>
                    <div style={{ fontWeight: '700', color: '#fb7185' }}>{formatCurrency(calcResult.exciseDuty)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Net Receivable</div>
                    <div style={{ fontWeight: '700', color: '#0284c7' }}>{formatCurrency(calcResult.netInterest)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: MANUAL OVERRIDE & REVERSAL INPUTS */}
          {entryMode === 'manual' && (
            <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.3)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} />
                <span>Tip: Enter negative numbers (e.g. <code>-50000</code>) to post a Provision Reversal for erroneous entries.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Gross Interest (BDT) *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={singleForm.gross_interest}
                    onChange={(e) => setSingleForm({ ...singleForm, gross_interest: e.target.value })}
                    placeholder="e.g. 50000 or -50000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={singleForm.tax_rate}
                    onChange={(e) => setSingleForm({ ...singleForm, tax_rate: e.target.value })}
                    placeholder="10"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">AIT Tax Amount (BDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={singleForm.tax_amount}
                    onChange={(e) => setSingleForm({ ...singleForm, tax_amount: e.target.value })}
                    placeholder="Auto or Manual"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Excise Duty (BDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={singleForm.excise_duty}
                    onChange={(e) => setSingleForm({ ...singleForm, excise_duty: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Charge (BDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={singleForm.bank_charge}
                    onChange={(e) => setSingleForm({ ...singleForm, bank_charge: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Net Interest (BDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={singleForm.net_interest}
                    onChange={(e) => setSingleForm({ ...singleForm, net_interest: e.target.value })}
                    placeholder="Auto computed if empty"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Accounting Notes & Reason</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={singleForm.notes}
              onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
              placeholder="Enter remarks, bank statement reference, or reversal justification"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsSingleModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className={entryMode === 'manual' && parseFloat(singleForm.gross_interest || 0) < 0 ? "btn-danger" : "btn-primary"}>
              {entryMode === 'manual' && parseFloat(singleForm.gross_interest || 0) < 0 ? 'Post Provision Reversal' : 'Post Provision Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT PROVISION ENTRY */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Adjust Provision Entry #${editForm.id} - ${editForm.fdr_no}`}
        maxWidth="680px"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Adjust provision figures for FDR <strong>#{editForm.fdr_no}</strong> ({editForm.bank_name}). Changes directly update all financial statements and FDR bank statements.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Provision Date *</label>
              <input
                type="date"
                className="form-input"
                value={editForm.provision_date}
                onChange={(e) => setEditForm({ ...editForm, provision_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Period Start *</label>
              <input
                type="date"
                className="form-input"
                value={editForm.period_start}
                onChange={(e) => setEditForm({ ...editForm, period_start: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Period End *</label>
              <input
                type="date"
                className="form-input"
                value={editForm.period_end}
                onChange={(e) => setEditForm({ ...editForm, period_end: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Gross Interest (BDT) *</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={editForm.gross_interest}
                onChange={(e) => setEditForm({ ...editForm, gross_interest: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tax Rate (%)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={editForm.tax_rate}
                onChange={(e) => setEditForm({ ...editForm, tax_rate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">AIT Tax Amount (BDT)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={editForm.tax_amount}
                onChange={(e) => setEditForm({ ...editForm, tax_amount: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Excise Duty (BDT)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={editForm.excise_duty}
                onChange={(e) => setEditForm({ ...editForm, excise_duty: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Charge (BDT)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={editForm.bank_charge}
                onChange={(e) => setEditForm({ ...editForm, bank_charge: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Net Interest (BDT)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={editForm.net_interest}
                onChange={(e) => setEditForm({ ...editForm, net_interest: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adjustment Notes / Remarks</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Provision Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: BATCH PROVISION */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Batch Provision Posting for All Active Investments"
        maxWidth="600px"
      >
        <form onSubmit={handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            This will calculate interest, AIT tax, and excise duty provisions for all <strong>{investments.length} active investments</strong> for the selected accounting date range and post them into the ledger.
          </p>

          <div className="form-group">
            <label className="form-label">Provision Posting Date</label>
            <input
              type="date"
              className="form-input"
              value={batchForm.provision_date}
              onChange={(e) => setBatchForm({ ...batchForm, provision_date: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Period Start Date</label>
              <input
                type="date"
                className="form-input"
                value={batchForm.period_start}
                onChange={(e) => setBatchForm({ ...batchForm, period_start: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Period End Date</label>
              <input
                type="date"
                className="form-input"
                value={batchForm.period_end}
                onChange={(e) => setBatchForm({ ...batchForm, period_end: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsBatchModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Execute Batch Posting
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DELETE CONFIRMATION */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete / Reverse Provision Entry"
        message="Are you sure you want to delete this interest provision ledger entry? Deleting this entry will immediately remove it from all FDR Bank Statements and Financial Reports."
        loading={deleting}
      />

    </div>
  );
}
