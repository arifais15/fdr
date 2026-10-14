import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileCheck,
  CheckCircle,
  XCircle,
  Printer,
  Trash2,
  Building2,
  TrendingUp,
  FileText,
  Calendar,
  Edit3,
  Check,
  Percent,
  Layers,
  FileSpreadsheet,
  Send,
  Download
} from 'lucide-react';
import Modal from '../components/Modal';
import PrintHeader from '../components/PrintHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { triggerPrint } from '../utils/printHelper';
import { formatCurrency, formatDate, numberToWords } from '../utils/formatters';
import { api } from '../utils/api';
import { exportTableToExcel } from '../utils/exportHelper';
import { exportBankLettersToDocx } from '../utils/docxExportHelper';
import { getDefaultLetterContent, resolveFdrFinancials } from './BankLetters';

export default function Proposals({ showToast, initialData, onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('monthly-matured-note'); // 'monthly-matured-note' or 'single-proposals'
  const [proposals, setProposals] = useState([]);
  const [banks, setBanks] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPrintNoteModalOpen, setIsPrintNoteModalOpen] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [lettersToPrint, setLettersToPrint] = useState([]);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [noteSheetDate, setNoteSheetDate] = useState(new Date().toISOString().split('T')[0]);

  const [fundCategories, setFundCategories] = useState([]);

  // Form state for Multi-FDR Bank Investment Proposal
  const [formData, setFormData] = useState({
    proposal_type: 'New', // 'New' | 'Renewal' | 'Mixed'
    proposal_no: `PROP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    proposal_subject: 'তফসিলি ব্যাংকে স্থায়ী আমানত (FDR) বিনিয়োগ / নবায়ন সংক্রান্ত আনুষ্ঠানিক প্রস্তাবনা',
    justification: 'সমিতির বিভিন্ন ফান্ডের উদ্বৃত্ত অর্থ সর্বাধিক লাভজনক সুদের হারে রাষ্ট্রায়ত্ত ও নির্ভরযোগ্য তফসিলি ব্যাংকে স্থায়ী আমানত (FDR) হিসেবে বিনিয়োগ/নবায়নের জন্য প্রস্তাব পেশ করা হলো।',
    prepared_by: 'Accounts Officer',
    fdr_items: [
      {
        id: 'item-1',
        bank_id: '',
        bank_name: 'Agrani Bank PLC',
        branch_name: 'Dhaka Corporate Branch',
        fund_name: 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)',
        acc_code: '129.25.100',
        amount: '5000000',
        tenure_months: '12',
        offered_rate: '11.25',
        investment_mode: 'New Deposit',
        remarks: 'Highest offered rate for 12 months'
      },
      {
        id: 'item-2',
        bank_id: '',
        bank_name: 'Pubali Bank PLC',
        branch_name: 'Principal Branch',
        fund_name: 'কর্মচারী গ্রাচ্যুইটি ফান্ড',
        acc_code: '129.25.200',
        amount: '5000000',
        tenure_months: '12',
        offered_rate: '11.00',
        investment_mode: 'New Deposit',
        remarks: 'Scheduled bank allocation'
      }
    ]
  });

  // Monthly Matured Note Sheet State
  const currentDate = new Date();
  const currentYearStr = currentDate.getFullYear().toString();
  const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');

  const [filterMode, setFilterMode] = useState('month'); // 'month' or 'all-matured'
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [globalProposedRate, setGlobalProposedRate] = useState('10.00');
  const [noteSubject, setNoteSubject] = useState('মাসিক মেয়াদপূর্তি এফডিআরসমূহের পুনঃবিনিয়োগ/নবায়নের প্রস্তাবনা সংক্রান্ত নোট শিট');
  const [noteLanguage, setNoteLanguage] = useState('auto'); // 'auto', 'English', 'Bengali'
  const [noteItems, setNoteItems] = useState([]);

  useEffect(() => {
    loadData();
    if (initialData && initialData.newForInv) {
      const inv = initialData.newForInv;
      setFormData(prev => ({
        ...prev,
        proposal_type: 'Renewal',
        justification: `Renewal proposal for expiring FDR #${inv.fdr_no} maturing on ${inv.maturity_date}.`,
        fdr_items: [
          {
            id: 'item-1',
            bank_id: inv.bank_id || '',
            bank_name: inv.bank_name || '',
            branch_name: inv.branch_name || inv.bank_branch || '',
            fund_name: inv.fund_name || 'General Fund',
            acc_code: inv.acc_code || '',
            amount: inv.principal_amount ? inv.principal_amount.toString() : '1000000',
            tenure_months: inv.tenure_months ? inv.tenure_months.toString() : '12',
            offered_rate: inv.interest_rate ? inv.interest_rate.toString() : '10.50',
            investment_mode: `Renewal (FDR #${inv.fdr_no})`,
            remarks: `Renewal of FDR #${inv.fdr_no}`
          }
        ]
      }));
      setActiveSubTab('single-proposals');
      setIsModalOpen(true);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [propData, bankData, invData, settingsData, fundData] = await Promise.all([
        api.getProposals(),
        api.getBanks(),
        api.getInvestments(),
        api.getSettings(),
        api.getFundCategories()
      ]);
      setProposals(propData);
      setBanks(bankData);
      setInvestments(invData);
      setSettings(settingsData || {});
      setFundCategories(fundData || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Synchronize noteItems when investments or date filters change
  useEffect(() => {
    if (!investments.length) return;

    let filtered = [];
    if (filterMode === 'month') {
      filtered = investments.filter(inv => {
        if (!inv.maturity_date) return false;
        const [y, m] = inv.maturity_date.split('-');
        return y === selectedYear && m === selectedMonth;
      });
    } else {
      // All maturing or active investments
      filtered = investments.filter(inv => inv.status === 'Active' || inv.status === 'Renewed');
    }

    setNoteItems(filtered.map(inv => ({
      id: inv.id,
      fdr_no: inv.fdr_no,
      fund_name: inv.fund_name || 'Provident Fund',
      acc_code: inv.acc_code || '129.25.100',
      bank_name: inv.bank_name,
      branch_name: inv.branch_name,
      principal_amount: inv.principal_amount,
      issue_date: inv.issue_date,
      maturity_date: inv.maturity_date,
      interest_rate: inv.interest_rate,
      proposed_rate: inv.interest_rate ? inv.interest_rate.toString() : '10.50',
      proposed_action: 'Renew',
      remarks: 'Proposed for renewal as per bank quote',
      included: true
    })));
  }, [investments, selectedYear, selectedMonth, filterMode]);

  const handleItemChange = (id, field, value) => {
    setNoteItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleApplyGlobalRate = () => {
    if (!globalProposedRate || isNaN(parseFloat(globalProposedRate))) {
      showToast('Please enter a valid rate', 'warning');
      return;
    }
    setNoteItems(prev => prev.map(item => ({ ...item, proposed_rate: globalProposedRate })));
    showToast(`Applied ${globalProposedRate}% proposed rate to all maturing FDRs`, 'info');
  };

  const generateBankLetterForItem = (item) => {
    const inv = investments.find(i => i.id === item.id) || {
      ...item,
      principal_amount: item.principal_amount,
      maturity_date: item.maturity_date,
      interest_rate: item.interest_rate,
      fdr_no: item.fdr_no,
      fund_name: item.fund_name,
      bank_id: item.bank_id,
      bank_name: item.bank_name,
      branch_name: item.branch_name
    };

    const bank = banks.find(b => b.id === inv.bank_id || b.name === inv.bank_name) || {
      name: inv.bank_name || 'Bank',
      branch_name: inv.branch_name || 'Branch',
      address: ''
    };

    const action = item.proposed_action || 'Renew';
    let letterType = 'Renewal_Compound';
    if (action === 'Encash') {
      letterType = 'Encashment';
    } else if (action === 'Renew only Principal') {
      letterType = 'Renewal_Profit_To_Account';
    } else if (action === 'Renew at Highest Offered Rate') {
      letterType = 'Renewal_Standard';
    } else if (action === 'Renew') {
      letterType = 'Renewal_Compound';
    } else {
      // Custom remarks
      const lower = action.toLowerCase();
      if (lower.includes('encash') || lower.includes('নগদায়ন')) {
        letterType = 'Encashment';
      } else if (lower.includes('principal') || lower.includes('মূলধন')) {
        letterType = 'Renewal_Profit_To_Account';
      } else {
        letterType = 'Renewal_Compound';
      }
    }

    const orgName = settings.org_name || 'Gazipur Palli Bidyut Samity-2';
    const bankName = bank.name;
    const branchAddress = `${bank.branch_name || ''}${bank.address ? `, ${bank.address}` : ''}`;
    const matDate = formatDate(inv.maturity_date);
    const fundName = inv.fund_name || 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)';
    const lang = 'Bengali'; // Default official communication in Bengali

    const lowerFund = (fundName || '').toLowerCase();
    const isCpfOrGratuity = lowerFund.includes('cpf') || lowerFund.includes('gpf') || fundName.includes('প্রভিডেন্ট') || lowerFund.includes('gratuity') || fundName.includes('গ্রাচ্যুইটি');
    const isTin = inv.tin_provided === 1 || inv.tin_provided === true || inv.tin_provided === '1';

    const taxRateBangla = isCpfOrGratuity
      ? 'আয়কর আইন অনুযায়ী ১০% উৎসে কর (AIT)'
      : isTin
        ? 'আয়কর আইন অনুযায়ী ২০% উৎসে কর (AIT)'
        : 'আয়কর আইন অনুযায়ী ৩০% উৎসে কর (AIT)';

    const taxRateEnglish = isCpfOrGratuity
      ? 'applicable Income Tax (AIT) at 10%'
      : isTin
        ? 'applicable Income Tax (AIT) at 20%'
        : 'applicable Income Tax (AIT) at 30%';

    const defaultContent = getDefaultLetterContent({
      type: letterType,
      lang,
      fundName,
      matDate,
      orgName,
      branchAddress,
      taxRateBangla,
      taxRateEnglish
    });

    const prefix = settings.memo_ref_prefix || '27.12.6400.506.04.044';
    const yearSuffix = new Date().getFullYear().toString().slice(2);
    const numPart = (inv.fdr_no || '').replace(/\D/g, '').slice(-3) || '01';
    const ref_no = `${prefix}.${yearSuffix}.${numPart}`;

    // Append proposed action/rate note to paragraphs if custom or specific
    let paragraphs = [...defaultContent.paragraphs];
    if (item.proposed_rate && letterType.startsWith('Renewal')) {
      const rateText = `উল্লেখ্য যে, অত্র সমিতির প্রস্তাবিত সুদের হার ${item.proposed_rate}% বা তার অধিক বিদ্যমান সর্বোচ্চ লাভজনক হারে নবায়ন নিশ্চিত করতে অনুরোধ করা হলো।`;
      paragraphs.splice(1, 0, rateText);
    }
    if (item.remarks && item.remarks !== 'Proposed for renewal as per bank quote') {
      paragraphs.push(`বিশেষ দ্রষ্টব্য / নির্দেশনা: ${item.remarks}`);
    }

    return {
      id: `prop_letter_${inv.id}_${Date.now()}`,
      investment_id: inv.id,
      bank_id: inv.bank_id,
      bank_name: bank.name,
      branch_name: bank.branch_name,
      bank_address: bank.address,
      ref_no,
      letter_date: new Date().toISOString().split('T')[0],
      letter_type: letterType,
      recipient_designation: 'ব্যবস্থাপক',
      subject: defaultContent.subject,
      body_content: paragraphs.join('\n\n'),
      language: lang,
      special_instructions: JSON.stringify({
        language: lang,
        paragraphs,
        enclosure: defaultContent.enclosure,
        recipient_bank_name: bank.name,
        recipient_branch_address: branchAddress,
        prepared_by: settings.signatory_agm_name !== undefined ? settings.signatory_agm_name : 'Md. Ariful Islam',
        approved_by: settings.signatory_gm_name !== undefined ? settings.signatory_gm_name : 'Md. Rabiul Haque'
      }),
      associated_inv: inv,
      proposed_action_source: action
    };
  };

  const handleGenerateLettersAll = () => {
    const included = noteItems.filter(i => i.included);
    if (included.length === 0) {
      showToast('No maturing FDR items selected with checkbox.', 'warning');
      return;
    }
    const generated = included.map(generateBankLetterForItem);
    setLettersToPrint(generated);
    setIsLetterModalOpen(true);
    showToast(`Generated ${generated.length} official bank instruction letter(s) based on Proposed Actions!`, 'success');
  };

  const handlePrintSingleItemLetter = (item) => {
    const letter = generateBankLetterForItem(item);
    setLettersToPrint([letter]);
    setIsLetterModalOpen(true);
  };

  const handleAddFdrItem = () => {
    const firstBank = banks.length > 0 ? banks[0] : null;
    const firstFund = fundCategories.length > 0 ? fundCategories[0] : null;
    const newItem = {
      id: `item-${Date.now()}`,
      bank_id: firstBank ? firstBank.id : '',
      bank_name: firstBank ? firstBank.name : 'Scheduled Commercial Bank',
      branch_name: firstBank ? firstBank.branch_name : '',
      fund_name: firstFund ? firstFund.fund_name : 'General Fund',
      acc_code: firstFund ? firstFund.acc_code : '121.20.000',
      amount: '5000000',
      tenure_months: '12',
      offered_rate: '11.00',
      investment_mode: 'New Deposit',
      remarks: 'Allocated as per liquidity & yield'
    };
    setFormData(prev => ({
      ...prev,
      fdr_items: [...prev.fdr_items, newItem]
    }));
  };

  const handleFdrItemChange = (index, field, value) => {
    const updated = [...formData.fdr_items];
    if (field === 'bank_id') {
      const selectedBank = banks.find(b => String(b.id) === String(value));
      updated[index].bank_id = value;
      if (selectedBank) {
        updated[index].bank_name = selectedBank.name;
        updated[index].branch_name = selectedBank.branch_name;
      }
    } else if (field === 'acc_code') {
      const selectedFund = fundCategories.find(f => String(f.acc_code) === String(value));
      updated[index].acc_code = value;
      if (selectedFund) {
        updated[index].fund_name = selectedFund.fund_name;
      }
    } else {
      updated[index][field] = value;
    }
    setFormData(prev => ({ ...prev, fdr_items: updated }));
  };

  const handleRemoveFdrItem = (index) => {
    if (formData.fdr_items.length <= 1) {
      showToast('A proposal must have at least one proposed FDR item.', 'warning');
      return;
    }
    const updated = formData.fdr_items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, fdr_items: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fdr_items || formData.fdr_items.length === 0) {
      showToast('Please add at least one proposed FDR allocation item.', 'warning');
      return;
    }

    const totalAmount = formData.fdr_items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalWeightedRate = formData.fdr_items.reduce((sum, item) => sum + ((parseFloat(item.amount) || 0) * (parseFloat(item.offered_rate) || 0)), 0);
    const weightedAvgRate = totalAmount > 0 ? (totalWeightedRate / totalAmount).toFixed(2) : '10.50';
    const primaryTenure = parseInt(formData.fdr_items[0]?.tenure_months) || 12;
    const primaryBankId = formData.fdr_items[0]?.bank_id || (banks.length > 0 ? banks[0].id : null);

    try {
      await api.createProposal({
        proposal_type: formData.proposal_type,
        proposal_no: formData.proposal_no,
        target_bank_id: primaryBankId,
        proposal_amount: totalAmount,
        tenure_months: primaryTenure,
        proposed_rate: parseFloat(weightedAvgRate),
        rate_comparison: formData.fdr_items,
        justification: formData.justification,
        prepared_by: formData.prepared_by
      });
      showToast('Multi-FDR Bank Investment Proposal submitted successfully for management approval', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateProposal(id, { status, approved_by: 'Managing Director / Executive Board' });
      showToast(`Proposal marked as ${status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleting(true);
      await api.deleteProposal(deleteTargetId);
      showToast('Investment proposal deleted successfully', 'info');
      setDeleteTargetId(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = (prop) => {
    setSelectedProposal(prop);
    setIsPrintModalOpen(true);
  };

  const handleTriggerPrintWindow = () => {
    triggerPrint('portrait');
  };

  // Calculations for Monthly Note Sheet
  const selectedNoteItems = noteItems.filter(i => i.included);
  const totalMaturedPrincipal = selectedNoteItems.reduce((sum, i) => sum + (i.principal_amount || 0), 0);
  const totalProposedAnnualInterest = selectedNoteItems.reduce((sum, i) => {
    const rate = parseFloat(i.proposed_rate || 0);
    return sum + Math.round(((i.principal_amount || 0) * rate) / 100);
  }, 0);

  const monthsList = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* NAVIGATION SUB-TABS & HEADER */}
      <div className="glass-panel" style={{ padding: '6px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Investment Proposals &amp; Notes
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              (Monthly Matured Notes &amp; Board Proposals)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '8px', display: 'flex', gap: '3px', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setActiveSubTab('monthly-matured-note')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeSubTab === 'monthly-matured-note' ? 'var(--primary)' : 'transparent',
                  color: activeSubTab === 'monthly-matured-note' ? '#fff' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Calendar size={14} />
                <span>Monthly Note Sheet</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '8px', fontSize: '10px' }}>
                  {noteItems.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('single-proposals')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeSubTab === 'single-proposals' ? 'var(--primary)' : 'transparent',
                  color: activeSubTab === 'single-proposals' ? '#fff' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileCheck size={14} />
                <span>Multi-FDR Proposals</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '8px', fontSize: '10px' }}>
                  {proposals.length}
                </span>
              </button>
            </div>

            {activeSubTab === 'single-proposals' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '5px 10px', fontSize: '11.5px' }}>
                  <Plus size={15} />
                  <span>New Multi-FDR Proposal</span>
                </button>
                <button onClick={() => exportTableToExcel('single-proposals-table', 'Single_Proposals.xlsx')} className="btn-success" style={{ padding: '5px 10px', fontSize: '11.5px' }}>
                  <FileSpreadsheet size={15} />
                  <span>Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTHLY MATURED FDR NOTE SHEET (WITH MANUAL PROPOSAL RATE ENTRY) */}
      {activeSubTab === 'monthly-matured-note' && (
        <div className="glass-panel" style={{ padding: '10px 14px' }}>

          {/* CONTROLS & FILTER BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Filter Mode:</label>
                <select
                  className="form-select"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: '#38bdf8', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px' }}
                >
                  <option value="month">Specific Month &amp; Year</option>
                  <option value="all-matured">All Expiring &amp; Active FDRs</option>
                </select>
              </div>

              {filterMode === 'month' && (
                <>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--input-label)', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Select Year:</label>
                    <select
                      className="form-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px' }}
                    >
                      {['2024', '2025', '2026', '2027', '2028'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--input-label)', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Select Month:</label>
                    <select
                      className="form-select"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px' }}
                    >
                      {monthsList.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* BATCH PROPOSE RATE TOOLBAR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 'bold' }}>Quick Set Rate:</span>
              <input
                type="number"
                step="0.01"
                className="form-input"
                style={{ width: '80px', padding: '4px 8px', fontSize: '12px', textAlign: 'right', fontWeight: 'bold', color: '#38bdf8' }}
                value={globalProposedRate}
                onChange={(e) => setGlobalProposedRate(e.target.value)}
              />
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>%</span>
              <button
                type="button"
                onClick={handleApplyGlobalRate}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Apply to All
              </button>
            </div>
          </div>

          {/* EXECUTIVE METRICS BANNER FOR MONTHLY MATURED NOTE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #60a5fa' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Maturing FDR Count</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                {selectedNoteItems.length} FDRs
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Out of {noteItems.length} listed investments
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Maturing Principal</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {formatCurrency(totalMaturedPrincipal)}
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: '600' }}>
                Fund Reinvestment Pool
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Est. Annual Yield @ Proposed Rates</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#8b5cf6', marginTop: '4px' }}>
                {formatCurrency(totalProposedAnnualInterest)}
              </div>
              <div style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '2px', fontWeight: '600' }}>
                Expected Annual Profit Gross
              </div>
            </div>
          </div>

          {/* MATURED FDR LIST TABLE WITH MANUAL PROPOSAL RATE ENTRY */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading maturing FDRs...</div>
          ) : noteItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No FDRs found maturing in {monthsList.find(m => m.value === selectedMonth)?.label} {selectedYear}. Switch filter to "All Expiring & Active FDRs" or change month.
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#38bdf8' }}>
                  Itemized Maturing FDR List — Proposal Rate Manual Entry
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleGenerateLettersAll}
                    className="btn-primary"
                    style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)' }}
                    title="Generate default official bank instruction letters for all checked FDRs based on their Proposed Action & Remarks"
                  >
                    <Send size={15} />
                    <span>Generate Bank Letters (All 1-Click)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintNoteModalOpen(true)}
                    className="btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    <Printer size={15} />
                    <span>Generate Note Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportTableToExcel('proposals-note-sheet-table', 'Matured_FDR_Note_Sheet.xlsx')}
                    className="btn-success"
                    style={{ padding: '8px 16px' }}
                  >
                    <FileSpreadsheet size={15} />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              <div className="data-table-container">
                <table id="proposals-note-sheet-table" className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={noteItems.length > 0 && noteItems.every(i => i.included)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setNoteItems(prev => prev.map(item => ({ ...item, included: checked })));
                          }}
                        />
                      </th>
                      <th>SL</th>
                      <th>Fund Category</th>
                      <th>FDR Cert No</th>
                      <th>Bank Institution</th>
                      <th>Maturity Date</th>
                      <th style={{ textAlign: 'right' }}>Principal (BDT)</th>
                      <th style={{ textAlign: 'right' }}>Current Rate</th>
                      <th style={{ textAlign: 'right', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                        PROPOSAL RATE (%)
                      </th>
                      <th>Proposed Action & Remarks</th>
                      <th style={{ textAlign: 'center', width: '110px' }}>Letter Print</th>
                    </tr>
                  </thead>
                  <tbody>
                    {noteItems.map((item, idx) => {
                      return (
                        <tr key={item.id} style={{ opacity: item.included ? 1 : 0.4 }}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={item.included}
                              onChange={(e) => handleItemChange(item.id, 'included', e.target.checked)}
                            />
                          </td>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{item.fund_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.acc_code}</div>
                          </td>
                          <td><strong style={{ color: '#60a5fa' }}>{item.fdr_no}</strong></td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{item.bank_name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.branch_name || 'N/A'}</div>
                          </td>
                          <td>
                            <span className="badge badge-matured">{formatDate(item.maturity_date)}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.principal_amount)}</td>
                          <td style={{ textAlign: 'right', color: '#94a3b8' }}>{item.interest_rate}%</td>

                          {/* MANUAL ENTRY FOR PROPOSED RATE */}
                          <td style={{ textAlign: 'right', background: 'rgba(59, 130, 246, 0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                style={{
                                  width: '90px',
                                  textAlign: 'right',
                                  fontWeight: 'bold',
                                  color: '#38bdf8',
                                  borderColor: '#3b82f6',
                                  padding: '4px 8px',
                                  fontSize: '13px'
                                }}
                                value={item.proposed_rate}
                                onChange={(e) => handleItemChange(item.id, 'proposed_rate', e.target.value)}
                                placeholder="0.00"
                              />
                              <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '12px' }}>%</span>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <select
                                className="form-select"
                                style={{ width: '220px', padding: '4px 8px', fontSize: '12px', background: 'var(--input-bg)', color: 'var(--input-text)', borderColor: 'var(--border-color)', borderRadius: '6px' }}
                                value={
                                  ['Renew', 'Encash', 'Renew only Principal', 'Renew at Highest Offered Rate'].includes(item.proposed_action)
                                    ? item.proposed_action
                                    : 'Custom'
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Custom') {
                                    handleItemChange(item.id, 'proposed_action', '');
                                  } else {
                                    handleItemChange(item.id, 'proposed_action', val);
                                  }
                                }}
                              >
                                <option value="Renew">Renew (নবায়ন)</option>
                                <option value="Encash">Encash (নগদায়ন)</option>
                                <option value="Renew only Principal">Renew only Principal (শুধু মূলধন নবায়ন)</option>
                                <option value="Renew at Highest Offered Rate">Renew at Highest Offered Rate (সর্বোচ্চ হারে নবায়ন)</option>
                                <option value="Custom">Custom Remark...</option>
                              </select>

                              {!['Renew', 'Encash', 'Renew only Principal', 'Renew at Highest Offered Rate'].includes(item.proposed_action) && (
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ width: '220px', padding: '4px 8px', fontSize: '12px' }}
                                  value={item.proposed_action}
                                  onChange={(e) => handleItemChange(item.id, 'proposed_action', e.target.value)}
                                  placeholder="Type custom action / remark..."
                                />
                              )}
                            </div>
                          </td>

                          {/* INDIVIDUAL PRINT ACTION */}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handlePrintSingleItemLetter(item)}
                              className="btn-primary"
                              style={{ padding: '5px 9px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                              title={`Print bank instruction letter for FDR #${item.fdr_no} (${item.proposed_action || 'Renew'})`}
                            >
                              <Printer size={13} />
                              <span>Print Letter</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(52, 211, 153, 0.1)', fontWeight: '800', borderTop: '2px solid #34d399' }}>
                      <td colSpan="6" style={{ textAlign: 'right' }}>TOTAL SELECTED MATURING FDRs ({selectedNoteItems.length})</td>
                      <td style={{ textAlign: 'right', fontSize: '14px', color: '#34d399' }}>{formatCurrency(totalMaturedPrincipal)}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SINGLE PROPOSALS TABLE */}
      {activeSubTab === 'single-proposals' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No single proposals created yet. Click "Create Single Proposal" above.
            </div>
          ) : (
            <div className="data-table-container">
              <table id="single-proposals-table" className="data-table">
                <thead>
                  <tr>
                    <th>Proposal No</th>
                    <th>Category</th>
                    <th>Proposed Bank Allocations</th>
                    <th>Total Proposed Amount</th>
                    <th>Tenure</th>
                    <th>Avg. Rate</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map(prop => {
                    let items = [];
                    try {
                      if (prop.rate_comparison_json) {
                        items = JSON.parse(prop.rate_comparison_json);
                      }
                    } catch (e) {
                      items = [];
                    }
                    const isMultiFdr = Array.isArray(items) && items.some(it => it.fund_name || it.amount);
                    const bankNames = isMultiFdr 
                      ? Array.from(new Set(items.map(it => it.bank_name).filter(Boolean))).join(', ')
                      : (prop.target_bank_name || 'Scheduled Bank');

                    return (
                    <tr key={prop.id}>
                      <td><strong style={{ color: 'var(--text-main)' }}>{prop.proposal_no}</strong></td>
                      <td>
                        <span className={`badge ${prop.proposal_type === 'New' ? 'badge-active' : 'badge-renewed'}`}>
                          {prop.proposal_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {bankNames}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>
                          {isMultiFdr ? `${items.length} FDR Allocation${items.length > 1 ? 's' : ''}` : (prop.target_branch || 'Single Allocation')}
                        </div>
                      </td>
                      <td><strong style={{ color: '#34d399' }}>{formatCurrency(prop.proposal_amount)}</strong></td>
                      <td>{prop.tenure_months} Months</td>
                      <td><strong style={{ color: '#60a5fa' }}>{prop.proposed_rate}%</strong></td>
                      <td>
                        <span className={`badge badge-${prop.status === 'Approved' ? 'approved' : prop.status === 'Rejected' ? 'matured' : 'pending'}`}>
                          {prop.status}
                        </span>
                      </td>
                      <td>{formatDate(prop.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {prop.status === 'Pending Approval' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(prop.id, 'Approved')}
                                className="btn-success"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                title="Approve Proposal"
                              >
                                <CheckCircle size={14} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(prop.id, 'Rejected')}
                                className="btn-danger"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                title="Reject Proposal"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handlePrint(prop)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Print Formal Board Proposal Document"
                          >
                            <Printer size={14} />
                            <span>Print</span>
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(prop.id)}
                            className="btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Delete Proposal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: PRINT OFFICIAL MONTHLY MATURED NOTE SHEET */}
      <Modal
        isOpen={isPrintNoteModalOpen}
        onClose={() => setIsPrintNoteModalOpen(false)}
        title="Monthly Matured FDR Reinvestment Note Sheet Preview"
        maxWidth="950px"
      >
        <div>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '10px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Configure Note Subject:</div>
                <div style={{ marginTop: '4px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Subject Text"
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    style={{ width: '380px', padding: '4px 8px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Note Language:</div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteLanguage('English');
                      if (noteSubject.includes('মাসিক')) {
                        setNoteSubject('Reinvestment & Renewal Proposal Note Sheet for Maturing FDR Accounts');
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: noteLanguage === 'English' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      background: noteLanguage === 'English' ? '#3b82f6' : 'var(--bg-card-hover)',
                      color: noteLanguage === 'English' ? '#ffffff' : 'var(--text-main)'
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteLanguage('Bengali');
                      if (noteSubject.includes('Reinvestment')) {
                        setNoteSubject('মাসিক মেয়াদপূর্তি এফডিআরসমূহের পুনঃবিনিয়োগ/নবায়নের প্রস্তাবনা সংক্রান্ত নোট শিট');
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: noteLanguage === 'Bengali' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      background: noteLanguage === 'Bengali' ? '#3b82f6' : 'var(--bg-card-hover)',
                      color: noteLanguage === 'Bengali' ? '#ffffff' : 'var(--text-main)'
                    }}
                  >
                    Bengali (বাংলা)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteLanguage('auto')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: noteLanguage === 'auto' ? '1px solid #10b981' : '1px solid var(--border-color)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      background: noteLanguage === 'auto' ? '#10b981' : 'var(--bg-card-hover)',
                      color: noteLanguage === 'auto' ? '#ffffff' : 'var(--text-main)'
                    }}
                  >
                    Auto-Detect
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Note Printing Date:</span>
                <input
                  type="date"
                  className="form-input"
                  value={noteSheetDate}
                  onChange={(e) => setNoteSheetDate(e.target.value)}
                  style={{ fontSize: '12px', padding: '4px 8px', height: '34px', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', fontWeight: 'bold' }}
                />
              </div>

              <span style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 'bold' }}>
                Single Copy Mode (1 Copy)
              </span>
              <button onClick={() => triggerPrint('portrait')} className="btn-secondary" style={{ padding: '8px 14px' }}>
                <Printer size={16} />
                <span>Print Portrait (1 Copy)</span>
              </button>
              <button onClick={() => triggerPrint('landscape')} className="btn-primary" style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}>
                <Printer size={16} />
                <span>Print Landscape</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC LANGUAGE CALCULATION */}
          {(() => {
            const isNoteEnglish = noteLanguage === 'English' || 
              (noteLanguage === 'auto' && selectedNoteItems.length > 0 && selectedNoteItems.some(i => /[a-zA-Z]/.test(i.fund_name || '') && !/[\u0980-\u09FF]/.test(i.fund_name || '')));

            return (
              <div className="printable-area official-note-sheet" style={{ background: '#fff', color: '#000', padding: '20px 24px', borderRadius: '8px', fontSize: '15px', fontFamily: "'OfficialDocFont', 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif" }}>
                <PrintHeader title={isNoteEnglish ? 'OFFICIAL NOTE SHEET' : 'অফিসিয়াল নোট শিট'} date={formatDate(noteSheetDate)} />

                <div style={{ margin: '16px 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  {isNoteEnglish ? 'Subject: ' : 'বিষয়: '}
                  <span style={{ textDecoration: 'underline' }}>{noteSubject}</span>
                  {!isNoteEnglish && '।'}
                </div>

                <p style={{ lineHeight: '1.65', marginBottom: '16px', textAlign: 'justify', fontSize: '15px' }}>
                  {isNoteEnglish ? (
                    `Sir, With reference to the subject cited above, a total of ${selectedNoteItems.length} Fixed Deposit Receipt(s) (FDR) are maturing in the upcoming period. Based on bank negotiations and quotations, the proposed interest rates and detailed information are presented in the table below:`
                  ) : (
                    `মহোদয়, উপযুক্ত বিষয়ে জানানো যাচ্ছে যে, নিম্নবর্ণিত ছকে উল্লেখিত মোট= ${selectedNoteItems.length} টি স্থায়ী আমানত (FDR) আগামী সময়ে মেয়াদপূর্তি হতে যাচ্ছে। উক্ত স্থায়ী আমানতসমূহের বিপরীতে ব্যাংকের সাথে আলোচনা ও কোটেশন অনুযায়ী প্রস্তাবিত সুদের হার এবং বিস্তারিত তথ্য নিম্নরূপ:`
                  )}
                </p>

                {/* PRINTABLE TABLE WITH PROPOSED RATE COLUMN */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px', border: '1.5px solid #000000' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'center', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'SL' : 'ক্রমিক'}
                      </th>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'left', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'Fund & Account Code' : 'ফান্ড ও হিসাব কোড'}
                      </th>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'left', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'FDR No.' : 'এফডিআর নম্বর'}
                      </th>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'left', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'Bank & Branch' : 'ব্যাংক ও শাখা'}
                      </th>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'center', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'Maturity Date' : 'মেয়াদপূর্তির তারিখ'}
                      </th>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'right', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'Principal Amount (BDT)' : 'মূলধন পরিমাণ (BDT)'}
                      </th>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'right', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'Current Rate' : 'বর্তমান হার'}
                      </th>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'right', color: '#000', background: '#f1f5f9', fontSize: '14px' }}>
                        {isNoteEnglish ? 'Proposed Rate (%)' : 'প্রস্তাবিত হার (%)'}
                      </th>
                      <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'left', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'Proposed Action & Remarks' : 'প্রস্তাবিত সিদ্ধান্ত ও মন্তব্য'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNoteItems.map((item, i) => {
                      return (
                        <tr key={item.id}>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'center', color: '#000', fontWeight: 'bold', fontSize: '14px' }}>{i + 1}</td>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', color: '#000', fontSize: '14px' }}>
                            <strong style={{ color: '#000' }}>{item.fund_name}</strong><br />
                            <span style={{ fontSize: '12.5px', color: '#000', fontWeight: 'bold' }}>{item.acc_code}</span>
                          </td>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>{item.fdr_no}</td>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', color: '#000', fontSize: '14px' }}>
                            <span style={{ fontWeight: 'bold', color: '#000' }}>{item.bank_name}</span><br />
                            <span style={{ fontSize: '12.5px', color: '#000', fontWeight: '600' }}>{item.branch_name || 'N/A'}</span>
                          </td>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'center', color: '#000', fontWeight: '600', fontSize: '14px' }}>{formatDate(item.maturity_date)}</td>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>{formatCurrency(item.principal_amount)}</td>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', color: '#000', fontWeight: '600', fontSize: '14px' }}>{item.interest_rate}%</td>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>
                            {item.proposed_rate}%
                          </td>
                          <td style={{ border: '1.5px solid #000000', padding: '8px 8px', color: '#000', fontSize: '14px' }}>
                            <strong style={{ color: '#000' }}>{item.proposed_action}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid #000000' }}>
                      <td colSpan="5" style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', color: '#000', fontSize: '14px' }}>
                        {isNoteEnglish ? 'Total:' : 'সর্বমোট:'}
                      </td>
                      <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', fontSize: '15px', color: '#000', fontWeight: 'bold' }}>{formatCurrency(totalMaturedPrincipal)}</td>
                      <td style={{ border: '1.5px solid #000000' }}></td>
                      <td style={{ border: '1.5px solid #000000' }}></td>
                      <td style={{ border: '1.5px solid #000000' }}></td>
                    </tr>
                  </tfoot>
                </table>

                <p style={{ lineHeight: '1.65', marginBottom: '20px', color: '#000', fontWeight: '500', fontSize: '15px' }}>
                  <strong style={{ color: '#000' }}>{isNoteEnglish ? 'Recommendation & Proposal:' : 'সুপারিশ ও প্রস্তাবনা:'}</strong> {
                    isNoteEnglish ? (
                      'The above-mentioned maturing fixed deposit receipts are submitted for administrative and financial approval for reinvestment/renewal in listed banks at the most profitable interest rates.'
                    ) : (
                      'উপরোক্ত বর্ণিত মেয়াদপূর্তি স্থায়ী আমানতসমূহ সর্বাধিক লাভজনক সুদের হারে তালিকাভুক্ত ব্যাংকে পুনঃবিনিয়োগ/নবায়ন করার জন্য প্রয়োজনীয় প্রশাসনিক ও আর্থিক অনুমোদনের জন্য নোট পেশ করা হলো।'
                    )
                  }
                </p>

                {/* OFFICIAL SIGNATORIES */}
                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '14px' }}>
                  {/* SIGNATORY 1: OFFICER (ACCOUNTS) */}
                  <div style={{ width: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {settings.signatory_accountant_signature ? (
                      <img src={settings.signatory_accountant_signature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '150px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                    ) : (
                      <div style={{ height: '42px' }} />
                    )}
                    <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#000000' }}>
                        ( {settings.signatory_accountant_name || (isNoteEnglish ? 'Officer (Accounts)' : 'কর্মকর্তা (অর্থ/হিসাব)')} )
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#000000', fontWeight: 'bold' }}>
                        {settings.signatory_accountant || (isNoteEnglish ? 'Officer (Accounts)' : 'কর্মকর্তা (অর্থ/হিসাব)')}
                      </div>
                    </div>
                  </div>

                  {/* SIGNATORY 2: AGM (FINANCE) */}
                  <div style={{ width: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {settings.signatory_agm_signature ? (
                      <img src={settings.signatory_agm_signature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '150px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                    ) : (
                      <div style={{ height: '42px' }} />
                    )}
                    <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#000000' }}>
                        ( {settings.signatory_agm_name || (isNoteEnglish ? 'Md. Ariful Islam' : 'মো: আরিফুল ইসলাম')} )
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#000000', fontWeight: 'bold' }}>
                        {settings.signatory_agm_finance || (isNoteEnglish ? 'AGM (Finance & Accounts)' : 'সহকারী জেনারেল ম্যানেজার (অর্থ)')}
                      </div>
                    </div>
                  </div>

                  {/* SIGNATORY 3: GENERAL MANAGER */}
                  <div style={{ width: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {settings.signatory_gm_signature ? (
                      <img src={settings.signatory_gm_signature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '150px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                    ) : (
                      <div style={{ height: '42px' }} />
                    )}
                    <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#000000' }}>
                        ( {settings.signatory_gm_name || (isNoteEnglish ? 'Md. Rabiul Haque' : 'মো: রবিউল হক')} )
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#000000', fontWeight: 'bold' }}>
                        {settings.signatory_gm || (isNoteEnglish ? 'General Manager' : 'জেনারেল ম্যানেজার')}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      </Modal>

      {/* MODAL: CREATE MULTI-FDR BANK INVESTMENT PROPOSAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Prepare Multi-FDR Bank Investment Proposal"
        maxWidth="1050px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* TOP PROPOSAL DETAILS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 2fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Proposal Category *</label>
              <select
                className="form-select"
                value={formData.proposal_type}
                onChange={(e) => setFormData({ ...formData, proposal_type: e.target.value })}
                required
              >
                <option value="New">New Investment Proposal</option>
                <option value="Renewal">Renewal Investment Proposal</option>
                <option value="Mixed">Mixed (New & Renewal) Proposal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Proposal Memo No *</label>
              <input
                type="text"
                className="form-input"
                value={formData.proposal_no}
                onChange={(e) => setFormData({ ...formData, proposal_no: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject / Purpose</label>
              <input
                type="text"
                className="form-input"
                value={formData.proposal_subject}
                onChange={(e) => setFormData({ ...formData, proposal_subject: e.target.value })}
                placeholder="e.g. বিভিন্ন ফান্ডের অর্থ তফসিলি ব্যাংকে স্থায়ী আমানত (FDR) বিনিয়োগের প্রস্তাবনা"
              />
            </div>
          </div>

          {/* MULTI-FDR ALLOCATION SCHEDULE BUILDER */}
          <div style={{ background: 'var(--bg-card-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={17} color="#38bdf8" />
                  Proposed FDR Bank Investment Allocation Schedule
                </h4>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Allocate proposed FDR investments across multiple banks, branches, and fund portfolios.
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddFdrItem}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
              >
                <Plus size={15} />
                <span>Add Proposed FDR</span>
              </button>
            </div>

            {/* ALLOCATION ITEMS TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '35px' }}>#</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '190px' }}>Proposed Bank & Branch *</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '170px' }}>Fund Category *</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '110px' }}>Mode</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', minWidth: '130px' }}>Proposed Amount (BDT) *</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px' }}>Tenure</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', width: '90px' }}>Rate % *</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '140px' }}>Remarks / Justification</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.fdr_items.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        {idx + 1}
                      </td>

                      {/* BANK SELECT */}
                      <td style={{ padding: '6px 4px' }}>
                        <select
                          className="form-select"
                          style={{ padding: '5px 8px', fontSize: '12px', width: '100%' }}
                          value={item.bank_id}
                          onChange={(e) => handleFdrItemChange(idx, 'bank_id', e.target.value)}
                        >
                          <option value="">-- Select Bank & Branch --</option>
                          {banks.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.branch_name})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* FUND SELECT */}
                      <td style={{ padding: '6px 4px' }}>
                        <select
                          className="form-select"
                          style={{ padding: '5px 8px', fontSize: '12px', width: '100%' }}
                          value={item.acc_code}
                          onChange={(e) => handleFdrItemChange(idx, 'acc_code', e.target.value)}
                        >
                          <option value="">-- Select Fund --</option>
                          {fundCategories.map(f => (
                            <option key={f.acc_code || f.id} value={f.acc_code}>
                              {f.fund_name} ({f.acc_code})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* MODE */}
                      <td style={{ padding: '6px 4px' }}>
                        <select
                          className="form-select"
                          style={{ padding: '5px 8px', fontSize: '12px', width: '100%' }}
                          value={item.investment_mode}
                          onChange={(e) => handleFdrItemChange(idx, 'investment_mode', e.target.value)}
                        >
                          <option value="New Deposit">New Deposit</option>
                          <option value="Renewal">Renewal</option>
                          <option value="Re-investment">Re-investment</option>
                        </select>
                      </td>

                      {/* AMOUNT */}
                      <td style={{ padding: '6px 4px' }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '5px 8px', fontSize: '12px', textAlign: 'right', fontWeight: '700', color: '#10b981' }}
                          value={item.amount}
                          onChange={(e) => handleFdrItemChange(idx, 'amount', e.target.value)}
                          placeholder="Amount"
                          required
                        />
                      </td>

                      {/* TENURE */}
                      <td style={{ padding: '6px 4px' }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '5px 6px', fontSize: '12px', textAlign: 'center' }}
                          value={item.tenure_months}
                          onChange={(e) => handleFdrItemChange(idx, 'tenure_months', e.target.value)}
                          placeholder="Mos"
                          required
                        />
                      </td>

                      {/* RATE */}
                      <td style={{ padding: '6px 4px' }}>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          style={{ padding: '5px 6px', fontSize: '12px', textAlign: 'right', fontWeight: '700', color: '#38bdf8' }}
                          value={item.offered_rate}
                          onChange={(e) => handleFdrItemChange(idx, 'offered_rate', e.target.value)}
                          placeholder="Rate %"
                          required
                        />
                      </td>

                      {/* REMARKS */}
                      <td style={{ padding: '6px 4px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '5px 8px', fontSize: '12px', width: '100%' }}
                          value={item.remarks}
                          onChange={(e) => handleFdrItemChange(idx, 'remarks', e.target.value)}
                          placeholder="Remarks / Terms"
                        />
                      </td>

                      {/* REMOVE BUTTON */}
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveFdrItem(idx)}
                          className="btn-danger"
                          style={{ padding: '5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove FDR row"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LIVE KPI SUMMARY BANNER */}
            {(() => {
              const totalAmount = formData.fdr_items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
              const totalWeighted = formData.fdr_items.reduce((sum, it) => sum + ((parseFloat(it.amount) || 0) * (parseFloat(it.offered_rate) || 0)), 0);
              const weightedAvg = totalAmount > 0 ? (totalWeighted / totalAmount).toFixed(2) : '0.00';
              const estAnnualProfit = totalAmount > 0 ? (totalWeighted / 100).toFixed(0) : '0';

              return (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  padding: '10px 16px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Proposed FDRs: </span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{formData.fdr_items.length} Deposits</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weighted Avg. Rate: </span>
                      <strong style={{ fontSize: '14px', color: '#38bdf8' }}>{weightedAvg}% p.a.</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Annual Return: </span>
                      <strong style={{ fontSize: '14px', color: '#10b981' }}>BDT {formatCurrency(estAnnualProfit)}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Investment: </span>
                    <strong style={{ fontSize: '16px', color: '#10b981', marginLeft: '6px' }}>BDT {formatCurrency(totalAmount)}</strong>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* JUSTIFICATION */}
          <div className="form-group">
            <label className="form-label">Management Justification & Recommendation</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="State the rationale for bank allocation and yield considerations..."
            />
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
              <FileCheck size={16} />
              <span>Submit Multi-FDR Proposal</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: PRINT FORMAL SINGLE PROPOSAL */}
      {selectedProposal && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Formal Board Proposal Preview"
          maxWidth="850px"
        >
          <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 'bold' }}>
                Single Copy Mode (1 Copy)
              </span>
              <button onClick={handleTriggerPrintWindow} className="btn-primary">
                <Printer size={16} />
                <span>Print Official Document (1 Copy)</span>
              </button>
            </div>

            {/* PRINTABLE PROPOSAL CONTAINER (Single Page Auto-Fit Layout) */}
            <div className="printable-area" style={{ background: '#fff', color: '#000', padding: '20px 24px', borderRadius: '8px', fontSize: '14.5px', fontFamily: "'OfficialDocFont', 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif" }}>
              <PrintHeader title="INVESTMENT PROPOSAL" docRef={selectedProposal.proposal_no} date={formatDate(selectedProposal.created_at)} />

              {(() => {
                let items = [];
                try {
                  if (selectedProposal.rate_comparison_json) {
                    items = JSON.parse(selectedProposal.rate_comparison_json);
                  }
                } catch (e) {
                  items = [];
                }
                const isMultiFdr = Array.isArray(items) && items.some(it => it.fund_name || it.amount);
                const totalAllocAmount = isMultiFdr 
                  ? items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0)
                  : selectedProposal.proposal_amount;
                const totalWeightedRate = isMultiFdr
                  ? items.reduce((sum, it) => sum + ((parseFloat(it.amount) || 0) * (parseFloat(it.offered_rate) || 0)), 0)
                  : (selectedProposal.proposal_amount * selectedProposal.proposed_rate);
                const avgRate = totalAllocAmount > 0 ? (totalWeightedRate / totalAllocAmount).toFixed(2) : selectedProposal.proposed_rate;
                const estTotalProfit = (totalWeightedRate / 100);

                return (
                  <>
                    <h2 style={{ fontSize: '19px', textAlign: 'center', margin: '18px 0 14px 0', textTransform: 'uppercase', textDecoration: 'underline', color: '#0f172a' }}>
                      PROPOSAL FOR {selectedProposal.proposal_type.toUpperCase()} FDR INVESTMENTS (MULTI-BANK ALLOCATION)
                    </h2>

                    <div style={{ fontSize: '15px', lineHeight: '1.65', marginBottom: '14px', background: '#f8fafc', padding: '10px 14px', borderLeft: '4px solid #0284c7', borderRadius: '4px' }}>
                      <p style={{ margin: '0 0 4px 0' }}>
                        <strong>Subject:</strong> Formal approval for {selectedProposal.proposal_type} Investment of <strong>BDT {formatCurrency(totalAllocAmount)}</strong> ({numberToWords(totalAllocAmount)}) in Fixed Deposit Receipts (FDRs) across scheduled commercial banks.
                      </p>
                      <p style={{ margin: 0, color: '#334155' }}>
                        <strong>Justification & Rationale:</strong> {selectedProposal.justification || 'Optimized multi-bank placement ensuring institutional fund security, diversification, and maximum yield across scheduled commercial banks.'}
                      </p>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: '#000000', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Proposed FDR Bank Investment & Allocation Schedule:</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>
                        Weighted Average Rate: <strong>{avgRate}% p.a.</strong>
                      </span>
                    </h4>

                    {isMultiFdr ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px', border: '1.5px solid #000000' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#000000', fontWeight: 'bold' }}>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', width: '30px', color: '#000000', fontSize: '14px' }}>SL</th>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'left', color: '#000000', fontSize: '14px' }}>Proposed Bank & Branch</th>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'left', color: '#000000', fontSize: '14px' }}>Fund Category</th>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 6px', textAlign: 'center', width: '75px', color: '#000000', fontSize: '14px' }}>Mode</th>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'right', color: '#000000', fontSize: '14px' }}>Proposed Principal (BDT)</th>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', width: '55px', color: '#000000', fontSize: '14px' }}>Tenure</th>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 6px', textAlign: 'right', width: '65px', color: '#000000', fontSize: '14px' }}>Rate %</th>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'right', color: '#000000', fontSize: '14px' }}>Est. Annual Return</th>
                            <th style={{ border: '1.5px solid #000000', padding: '7px 8px', textAlign: 'left', color: '#000000', fontSize: '14px' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((row, i) => {
                            const pAmt = parseFloat(row.amount) || 0;
                            const pRate = parseFloat(row.offered_rate) || 0;
                            const annReturn = (pAmt * pRate) / 100;
                            return (
                              <tr key={i}>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 5px', textAlign: 'center', fontWeight: 'bold', color: '#000000', fontSize: '14px' }}>{i + 1}</td>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 8px', fontSize: '14px' }}>
                                  <div style={{ fontWeight: 'bold', color: '#000000' }}>{row.bank_name || 'Scheduled Bank'}</div>
                                  {row.branch_name && <div style={{ fontSize: '12.5px', color: '#000000', fontWeight: '600' }}>{row.branch_name}</div>}
                                </td>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 8px', color: '#000000', fontWeight: '600', fontSize: '14px' }}>
                                  {row.fund_name || 'General Fund'}
                                </td>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 5px', textAlign: 'center', fontSize: '12.5px', color: '#000000', fontWeight: '600' }}>
                                  {row.investment_mode || 'New Deposit'}
                                </td>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000000', fontSize: '14px' }}>
                                  {formatCurrency(pAmt)}
                                </td>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 5px', textAlign: 'center', color: '#000000', fontWeight: '600', fontSize: '14px' }}>
                                  {row.tenure_months || 12} M
                                </td>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 6px', textAlign: 'right', fontWeight: 'bold', color: '#000000', fontSize: '14px' }}>
                                  {pRate}%
                                </td>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000000', fontSize: '14px' }}>
                                  {formatCurrency(annReturn)}
                                </td>
                                <td style={{ border: '1.5px solid #000000', padding: '8px 8px', fontSize: '13.5px', color: '#000000', fontWeight: '600' }}>
                                  {row.remarks || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid #000000' }}>
                            <td colSpan={4} style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'right', textTransform: 'uppercase', color: '#000000', fontSize: '14px' }}>
                              Total Proposed Allocation ({items.length} FDRs):
                            </td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'right', color: '#000000', fontSize: '15px', fontWeight: 'bold' }}>
                              BDT {formatCurrency(totalAllocAmount)}
                            </td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'center', color: '#000000', fontSize: '14px' }}>-</td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'right', color: '#000000', fontWeight: 'bold', fontSize: '14px' }}>
                              {avgRate}%
                            </td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'right', color: '#000000', fontWeight: 'bold', fontSize: '15px' }}>
                              BDT {formatCurrency(estTotalProfit)}
                            </td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px' }}></td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      /* SINGLE ALLOCATION FALLBACK */
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14.5px', border: '1.5px solid #000000' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ border: '1.5px solid #000000', padding: '8px', textAlign: 'center', color: '#000000', fontSize: '14px' }}>SL</th>
                            <th style={{ border: '1.5px solid #000000', padding: '8px', textAlign: 'left', color: '#000000', fontSize: '14px' }}>Proposed Bank</th>
                            <th style={{ border: '1.5px solid #000000', padding: '8px', textAlign: 'right', color: '#000000', fontSize: '14px' }}>Proposed Principal</th>
                            <th style={{ border: '1.5px solid #000000', padding: '8px', textAlign: 'center', color: '#000000', fontSize: '14px' }}>Tenure</th>
                            <th style={{ border: '1.5px solid #000000', padding: '8px', textAlign: 'right', color: '#000000', fontSize: '14px' }}>Offered Rate %</th>
                            <th style={{ border: '1.5px solid #000000', padding: '8px', textAlign: 'right', color: '#000000', fontSize: '14px' }}>Est. Annual Return</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'center', color: '#000000', fontWeight: 'bold', fontSize: '14px' }}>1</td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', fontWeight: 'bold', color: '#000000', fontSize: '14px' }}>{selectedProposal.target_bank_name}</td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000000', fontSize: '14px' }}>
                              BDT {formatCurrency(selectedProposal.proposal_amount)}
                            </td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'center', color: '#000000', fontWeight: '600', fontSize: '14px' }}>{selectedProposal.tenure_months} Months</td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000000', fontSize: '14px' }}>
                              {selectedProposal.proposed_rate}%
                            </td>
                            <td style={{ border: '1.5px solid #000000', padding: '9px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000000', fontSize: '14px' }}>
                              BDT {formatCurrency((selectedProposal.proposal_amount * selectedProposal.proposed_rate) / 100)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </>
                );
              })()}

              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '14px' }}>
                <div style={{ width: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {settings.signatory_accountant_signature ? (
                    <img src={settings.signatory_accountant_signature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '150px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                  ) : (
                    <div style={{ height: '42px' }} />
                  )}
                  <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#000000' }}>
                      ( {settings.signatory_accountant_name || 'Officer (Accounts)'} )
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#000000', fontWeight: 'bold' }}>
                      {settings.signatory_accountant || 'Officer (Accounts)'}
                    </div>
                  </div>
                </div>

                <div style={{ width: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {settings.signatory_agm_signature ? (
                    <img src={settings.signatory_agm_signature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '150px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                  ) : (
                    <div style={{ height: '42px' }} />
                  )}
                  <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#000000' }}>
                      ( {settings.signatory_agm_name || 'Md. Ariful Islam'} )
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#000000', fontWeight: 'bold' }}>
                      {settings.signatory_agm_finance || 'AGM (Finance & Accounts)'}
                    </div>
                  </div>
                </div>

                <div style={{ width: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {settings.signatory_gm_signature ? (
                    <img src={settings.signatory_gm_signature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '150px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                  ) : (
                    <div style={{ height: '42px' }} />
                  )}
                  <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#000000' }}>
                      ( {settings.signatory_gm_name || 'Md. Rabiul Haque'} )
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#000000', fontWeight: 'bold' }}>
                      {settings.signatory_gm || 'General Manager'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* MODAL: PRINT OFFICIAL BANK INSTRUCTION LETTERS (GENERATED FROM PROPOSED ACTIONS) */}
      {isLetterModalOpen && lettersToPrint.length > 0 && (
        <Modal
          isOpen={isLetterModalOpen}
          onClose={() => setIsLetterModalOpen(false)}
          title={`Bank Instruction Letters Preview (${lettersToPrint.length} ${lettersToPrint.length > 1 ? 'Letters' : 'Letter'})`}
          maxWidth="900px"
        >
          <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{
                fontSize: '12px',
                color: lettersToPrint.length > 1 ? 'var(--primary)' : '#10b981',
                background: lettersToPrint.length > 1 ? 'rgba(2, 132, 199, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: lettersToPrint.length > 1 ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 'bold'
              }}>
                {lettersToPrint.length > 1 ? `Batch Print Mode (${lettersToPrint.length} Letters - 1 Per Page)` : 'Single Letter Print Mode (1 Page)'}
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => triggerPrint('portrait')} className="btn-primary">
                  <Printer size={16} />
                  <span>Print Portrait {lettersToPrint.length > 1 ? `(${lettersToPrint.length} Pages)` : '(1 Copy)'}</span>
                </button>
                <button onClick={() => triggerPrint('landscape')} className="btn-secondary">
                  <Printer size={16} />
                  <span>Print Landscape</span>
                </button>
                <button
                  onClick={() => exportBankLettersToDocx(lettersToPrint, {
                    filename: `${lettersToPrint.length > 1 ? 'Proposed_Bank_Letters_Batch' : 'Proposed_Bank_Letter'}.docx`,
                    settings,
                    investments,
                    sourceHtml: document.querySelector('.bank-letters-printable-area')?.outerHTML || '',
                    onError: (err) => console.error(err)
                  })}
                  className="btn-success"
                >
                  <Download size={16} />
                  <span>Export DOCX</span>
                </button>
              </div>
            </div>

            {/* PRINTABLE AREA FOR BANK LETTERS */}
            <div className="printable-area bank-letters-printable-area" style={{ fontFamily: "'OfficialDocFont', 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif", fontSize: '17px' }}>
              {lettersToPrint.map((letItem, letIdx) => {
                let parsedInstructions = {};
                try {
                  if (letItem.special_instructions) {
                    parsedInstructions = typeof letItem.special_instructions === 'string'
                      ? JSON.parse(letItem.special_instructions)
                      : letItem.special_instructions;
                  }
                } catch (e) { }

                const isEnglish = (parsedInstructions && parsedInstructions.language)
                  ? parsedInstructions.language === 'English'
                  : (letItem.language === 'English' || !/[\u0980-\u09FF]/.test(letItem.subject || ''));
                const associatedInv = letItem.associated_inv;

                const paras = parsedInstructions.paragraphs || (letItem.body_content || '').split('\n\n').filter(p => p.trim());
                const enclosureText = parsedInstructions.enclosure || (isEnglish ? 'Enclosure: Original FDR Certificate / Advice as described above.' : 'সংযুক্ত: বর্ণনা অনুযায়ী মূল স্থায়ী আমানত রশিদ।');

                const agmDisplayName = (parsedInstructions.prepared_by !== undefined && parsedInstructions.prepared_by !== '')
                  ? parsedInstructions.prepared_by
                  : (settings.signatory_agm_name || (isEnglish ? 'Md. Ariful Islam' : 'মো: আরিফুল ইসলাম'));
                const gmDisplayName = (parsedInstructions.approved_by !== undefined && parsedInstructions.approved_by !== '')
                  ? parsedInstructions.approved_by
                  : (settings.signatory_gm_name || (isEnglish ? 'Md. Rabiul Haque' : 'মো: রবিউল হক'));

                return (
                  <div
                    key={letItem.id || letIdx}
                    className="bank-letter-page"
                    style={{
                      background: '#fff',
                      color: '#000',
                      padding: '20px 24px',
                      marginBottom: lettersToPrint.length > 1 && letIdx < lettersToPrint.length - 1 ? '36px' : '0',
                      borderBottom: lettersToPrint.length > 1 && letIdx < lettersToPrint.length - 1 ? '2px dashed #cbd5e1' : 'none',
                      borderRadius: '8px',
                      fontSize: '14.5px',
                      lineHeight: '1.55'
                    }}
                  >
                    {/* HEADER WITH LOGO & REF/DATE */}
                    <PrintHeader isBankLetter={true} docRef={letItem.ref_no} date={formatDate(letItem.letter_date)} />

                    {/* RECIPIENT BLOCK */}
                    <div style={{ margin: '16px 0', lineHeight: '1.55', color: '#000', fontWeight: '600', fontSize: '14.5px' }}>
                      {isEnglish ? 'To,' : ''}{isEnglish ? <br /> : ''}
                      <strong>{letItem.recipient_designation || (isEnglish ? 'The Manager' : 'ব্যবস্থাপক')}</strong><br />
                      {letItem.bank_name || parsedInstructions.recipient_bank_name}<br />
                      {letItem.branch_name || parsedInstructions.recipient_branch_address}{letItem.bank_address ? `, ${letItem.bank_address}` : ''}
                    </div>

                    {/* SUBJECT LINE */}
                    <div style={{ margin: '16px 0', fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
                      {isEnglish ? 'Subject: ' : 'বিষয়: '}
                      <span style={{ textDecoration: 'underline' }}>{letItem.subject}</span>
                    </div>

                    {/* DYNAMIC PARAGRAPHS */}
                    {paras.map((pText, i) => (
                      <p key={i} style={{ textAlign: 'justify', marginBottom: '14px', fontSize: '16px', color: '#000', fontWeight: '500', lineHeight: '1.65' }}>
                        {pText}
                      </p>
                    ))}

                    {/* FDR TABLE */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', fontSize: '14px', border: '1.5px solid #000' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                          <th style={{ border: '1.5px solid #000', padding: '6px', textAlign: 'center', width: '50px', color: '#000' }}>
                            {isEnglish ? 'SL No.' : 'ক্রমিক নং'}
                          </th>
                          <th style={{ border: '1.5px solid #000', padding: '6px', textAlign: 'left', color: '#000' }}>
                            {isEnglish ? 'Fund Name / Category' : 'ফান্ডের নাম'}
                          </th>
                          <th style={{ border: '1.5px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>
                            {isEnglish ? 'Fixed Deposit Account / Cert No.' : 'স্থায়ী আমানত হিসাব / রশিদ নং'}
                          </th>
                          <th style={{ border: '1.5px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>
                            {isEnglish ? 'Maturity Date' : 'মেয়াদ উত্তীর্ণের তারিখ'}
                          </th>
                          <th style={{ border: '1.5px solid #000', padding: '6px', textAlign: 'right', color: '#000' }}>
                            {isEnglish ? 'Amount (BDT)' : 'মূলধন পরিমাণ (টাকা)'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {associatedInv ? (
                          <tr>
                            <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', color: '#000', fontWeight: '600' }}>1</td>
                            <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', color: '#000' }}>
                              {associatedInv.fund_name || 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)'}
                            </td>
                            <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#000' }}>
                              {associatedInv.fdr_no}
                            </td>
                            <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', color: '#000', fontWeight: '600' }}>
                              {formatDate(associatedInv.maturity_date)}
                            </td>
                            <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#000' }}>
                              {formatCurrency(associatedInv.principal_amount)}
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ border: '1.5px solid #000', padding: '12px', textAlign: 'center', color: '#000', fontWeight: 'bold' }}>
                              {isEnglish ? 'No FDR investment linked to this letter.' : 'এই পত্রের সাথে কোনো নির্দিষ্ট FDR সংযুক্ত করা হয়নি।'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* ENCLOSURE NOTE */}
                    <div style={{ margin: '16px 0', fontSize: '13.5px', fontWeight: 'bold', color: '#000' }}>
                      {enclosureText}
                    </div>

                    {/* DUAL AUTHORIZED SIGNATORIES (ALWAYS PRESENT: AGM FINANCE ON LEFT, GM ON RIGHT) */}
                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'center', fontSize: '14px' }}>
                      {/* LEFT: AGM (FINANCE & ACCOUNTS) */}
                      <div style={{ width: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 'auto' }}>
                        {settings.signatory_agm_signature ? (
                          <img src={settings.signatory_agm_signature} alt="AGM Signature" style={{ maxHeight: '48px', maxWidth: '160px', objectFit: 'contain', marginBottom: '4px', background: 'transparent', mixBlendMode: 'multiply' }} />
                        ) : (
                          <div style={{ height: '42px' }} />
                        )}
                        <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px', color: '#000000' }}>
                          <strong style={{ fontSize: '14.5px', color: '#000000' }}>( {agmDisplayName} )</strong><br />
                          <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#000000' }}>{settings.signatory_agm_finance || (isEnglish ? 'AGM (Finance & Accounts)' : 'সহকারী জেনারেল ম্যানেজার (অর্থ)')}</span>
                        </div>
                      </div>

                      {/* RIGHT: GENERAL MANAGER */}
                      <div style={{ width: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 'auto' }}>
                        {settings.signatory_gm_signature ? (
                          <img src={settings.signatory_gm_signature} alt="GM Signature" style={{ maxHeight: '48px', maxWidth: '160px', objectFit: 'contain', marginBottom: '4px', background: 'transparent', mixBlendMode: 'multiply' }} />
                        ) : (
                          <div style={{ height: '42px' }} />
                        )}
                        <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px', color: '#000000' }}>
                          <strong style={{ fontSize: '14.5px', color: '#000000' }}>( {gmDisplayName} )</strong><br />
                          <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#000000' }}>{settings.signatory_gm || (isEnglish ? 'General Manager' : 'জেনারেল ম্যানেজার')}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Proposal Record"
        message="Are you sure you want to delete this investment proposal? This action cannot be undone."
        loading={deleting}
      />

    </div>
  );
}
