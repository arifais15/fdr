import React, { useState, useEffect } from 'react';
import { BarChart3, Printer, Download, Calendar, Landmark, Percent, FileText, RefreshCcw, CheckCircle, FileSpreadsheet, XCircle, Building2, Search, Sliders, ChevronLeft, ChevronRight, Eye, Filter, ZoomIn, ZoomOut, RotateCcw, ChevronDown, Layers, ShieldCheck, Plus, Trash2, BookOpen, AlertCircle, Check, Send } from 'lucide-react';
import { formatCurrency, formatDate, cleanRemarks } from '../utils/formatters';
import PrintHeader from '../components/PrintHeader';
import Modal from '../components/Modal';
import { api } from '../utils/api';
import { triggerPrint } from '../utils/printHelper';
import { exportTableToExcel } from '../utils/exportHelper';

export default function Reports({ showToast, initialData }) {
  const [activeReportTab, setActiveReportTab] = useState(() => {
    return initialData?.reportTab || 'portfolio';
  });

  useEffect(() => {
    if (initialData?.reportTab) {
      setActiveReportTab(initialData.reportTab);
    }
  }, [initialData]);
  const [investments, setInvestments] = useState([]);
  const [provisions, setProvisions] = useState([]);
  const [fundWiseData, setFundWiseData] = useState([]);
  const [sectorMatrixData, setSectorMatrixData] = useState({ sectors: {}, fundCategories: [], matrixRows: [] });
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Monthly Report Selector state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Period Comparison State
  const todayStr = new Date().toISOString().split('T')[0];
  const lastMonthStr = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  })();
  // Last day of current month — so month-end dated Auto JVs (e.g. 30-Sep-2026)
  // are always included in GL queries even when today is mid-month.
  const monthEndStr = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0); // day 0 of next month = last day of this month
    return d.toISOString().split('T')[0];
  })();
  // Bangladesh Fiscal Year: July 1 – June 30.
  // If current month is July or later, FY started this year; otherwise it started last year.
  const fyStartStr = (() => {
    const d = new Date();
    const fyYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    return `${fyYear}-07-01`;
  })();
  const fyEndStr = (() => {
    const d = new Date();
    const fyYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    return `${fyYear + 1}-06-30`;
  })();

  const [periodPrevDate, setPeriodPrevDate] = useState(lastMonthStr);
  const [periodCurrDate, setPeriodCurrDate] = useState(todayStr);
  const [periodInterestMode, setPeriodInterestMode] = useState('actual');
  const [periodFiscalYear, setPeriodFiscalYear] = useState('FY 2026-2027');
  const [periodQuickMonth, setPeriodQuickMonth] = useState('');
  const [periodReport, setPeriodReport] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [selectedDetailFund, setSelectedDetailFund] = useState(null);

  // Financial History Register State
  const [financialHistoryLogs, setFinancialHistoryLogs] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // In-Place Rollover List State
  const [inplaceRolloverData, setInplaceRolloverData] = useState(null);
  const [inplaceSearch, setInplaceSearch] = useState('');
  const [inplaceLoading, setInplaceLoading] = useState(false);

  // Accrual & Actual GL Financial Statements State.
  // • finAsOfDate  — end of current month (captures month-end dated JVs).
  // • finStartDate — Bangladesh FY start: 01-Jul of the current FY year.
  // • finEndDate   — Bangladesh FY end: 30-Jun of the next calendar year.
  const [finAsOfDate, setFinAsOfDate] = useState(monthEndStr);
  const [finStartDate, setFinStartDate] = useState(fyStartStr);
  const [finEndDate, setFinEndDate] = useState(fyEndStr);
  const [finSubTab, setFinSubTab] = useState('trial-balance');
  const [statementBasis, setStatementBasis] = useState('actual_gl'); // 'actual_gl' (Posted JVs) or 'portfolio' (Portfolio Accruals)
  const [financialStatementsData, setFinancialStatementsData] = useState(null);
  const [finLoading, setFinLoading] = useState(false);
  const [iasPresentationMode, setIasPresentationMode] = useState(true);

  // Auto JV & Journal Voucher Book State
  const [jvSubSection, setJvSubSection] = useState('auto-jv'); // 'auto-jv', 'manual-jv', 'jv-register'
  const [isJvPosted, setIsJvPosted] = useState(false);
  const [postedJvInfo, setPostedJvInfo] = useState(null);
  const [journalVouchersList, setJournalVouchersList] = useState([]);
  const [jvListLoading, setJvListLoading] = useState(false);
  const [selectedVoucherDetail, setSelectedVoucherDetail] = useState(null);
  const [postingJv, setPostingJv] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [manualJvForm, setManualJvForm] = useState({
    voucher_no: '',
    voucher_date: todayStr,
    voucher_type: 'Manual General JV',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    narration: '',
    posted_by: 'AGM (Finance)',
    items: [
      { account_code: '131.10.000', account_name: 'Cash at Bank - Settlement Account', account_type: 'Asset', fund_name: 'General', description: '', debit: '', credit: '' },
      { account_code: '419.10.000', account_name: 'Interest Income on FDR Investments', account_type: 'Revenue', fund_name: 'General', description: '', debit: '', credit: '' }
    ]
  });

  // SAP Crystal Report State
  const [showSapReport, setShowSapReport] = useState(false);
  const [sapReportConfig, setSapReportConfig] = useState({
    reportType: 'master-register',
    asOfDate: todayStr,
    fundCategory: 'ALL'
  });

  // FY FDR Register (Annexure A) State
  const [fyRegisterData, setFyRegisterData] = useState(null);
  const [fyRegisterLoading, setFyRegisterLoading] = useState(false);
  const [fyRegisterFy, setFyRegisterFy] = useState('FY 2025-2026');
  const [fyRegisterFundFilter, setFyRegisterFundFilter] = useState('ALL');
  const [fyRegisterSearch, setFyRegisterSearch] = useState('');

  const loadFyRegisterData = async () => {
    try {
      setFyRegisterLoading(true);
      const res = await api.getFyFdrRegister({ fiscal_year: fyRegisterFy });
      setFyRegisterData(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFyRegisterLoading(false);
    }
  };

  const [previewZoom, setPreviewZoom] = useState(100);
  const [reportFilterSearch, setReportFilterSearch] = useState('');
  const [maturityHorizonDays, setMaturityHorizonDays] = useState('all');
  const [selectedBankFilter, setSelectedBankFilter] = useState('ALL');
  const [reportPrintDate, setReportPrintDate] = useState(todayStr);
  const [jvViewMode, setJvViewMode] = useState('fund-wise');
  const [jvTypeMode, setJvTypeMode] = useState('actual'); // 'actual' = actual settlement & realized history; 'provisional' = monthly accruals

  const handleExportExcel = () => {
    const printableArea = document.querySelector('.printable-area');
    if (!printableArea) return;
    
    const tables = printableArea.querySelectorAll('table');
    if (tables.length === 0) {
      showToast('No tabular data found to export in this report.', 'warning');
      return;
    }

    const tableIds = [];
    tables.forEach((tbl, idx) => {
      const id = tbl.id || `dynamic-table-${idx}`;
      tbl.id = id;
      tableIds.push(id);
    });

    const filename = `${activeReportTab.toUpperCase()}_Report_${formatDate(reportPrintDate)}.xlsx`;
    exportTableToExcel(tableIds, filename);
  };

  useEffect(() => {
    loadReportData();
  }, []);

  useEffect(() => {
    const targetReport = activeReportTab === 'sap-crystal' ? sapReportConfig.reportType : activeReportTab;
    
    if (targetReport === 'monthly' || targetReport === 'auto-jv') {
      loadMonthlyReport();
      checkPostedStatus();
      loadCoaList();
      loadJournalVouchers();
    } else if (targetReport === 'fund-wise') {
      loadFundWiseReport();
    } else if (targetReport === 'fy-fdr-register') {
      loadFyRegisterData();
    } else if (targetReport === 'period-comparison') {
      loadPeriodReport();
    } else if (targetReport === 'financial-history') {
      loadFinancialHistory();
    } else if (targetReport === 'inplace-rollover') {
      loadInplaceRolloverList();
    } else if (targetReport === 'accrual-statements') {
      loadFinancialStatements();
    }
    
    // Reset SAP Report Viewer
    if (activeReportTab !== 'sap-crystal') {
      setShowSapReport(false);
    }
  }, [activeReportTab, sapReportConfig.reportType, selectedYear, selectedMonth, jvTypeMode, jvSubSection, periodPrevDate, periodCurrDate, periodInterestMode, historySearch, inplaceSearch, finAsOfDate, finStartDate, finEndDate, fyRegisterFy]);

  const loadFinancialHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.getFinancialHistory({ search: historySearch });
      setFinancialHistoryLogs(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadInplaceRolloverList = async () => {
    try {
      setInplaceLoading(true);
      const params = {};
      if (inplaceSearch) params.search = inplaceSearch;
      const res = await api.getInPlaceRolloverList(params);
      setInplaceRolloverData(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setInplaceLoading(false);
    }
  };

  const loadPeriodReport = async () => {
    try {
      setPeriodLoading(true);
      const res = await api.getPeriodComparisonReport(periodPrevDate, periodCurrDate, periodInterestMode);
      setPeriodReport(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPeriodLoading(false);
    }
  };

  const loadFinancialStatements = async () => {
    try {
      setFinLoading(true);
      const res = await api.getFinancialStatements(finAsOfDate, finStartDate, finEndDate);
      setFinancialStatementsData(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFinLoading(false);
    }
  };

  const loadFundWiseReport = async () => {
    try {
      setLoading(true);
      const res = await api.getFundWiseReport(selectedYear, selectedMonth);
      setFundWiseData(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [invData, provData, fundReport, settingsData, matrixReport, inplaceData] = await Promise.all([
        api.getInvestments(),
        api.getProvisions(),
        api.getFundWiseReport(), // initial load without date params
        api.getSettings(),
        api.getSectorFundMatrixReport(),
        api.getInPlaceRolloverList()
      ]);
      setInvestments(invData);
      setProvisions(provData);
      setFundWiseData(fundReport);
      setSettings(settingsData || {});
      setSectorMatrixData(matrixReport || { sectors: {}, fundCategories: [], matrixRows: [] });
      setInplaceRolloverData(inplaceData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReport = async () => {
    try {
      setMonthlyLoading(true);
      const res = await api.getMonthlyReport(selectedYear, selectedMonth);
      setMonthlyData(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMonthlyLoading(false);
    }
  };

  const checkPostedStatus = async () => {
    try {
      const vType = jvTypeMode === 'actual' ? 'Auto JV - Actual Realized' : 'Auto JV - Provisional Accruals';
      const res = await api.checkJVMonthPosted({ year: selectedYear, month: selectedMonth, voucher_type: vType });
      setIsJvPosted(!!res.is_posted);
      setPostedJvInfo(res.voucher || null);
    } catch (err) {
      console.error('Error checking JV posted status:', err);
    }
  };

  const loadJournalVouchers = async () => {
    try {
      setJvListLoading(true);
      const res = await api.getJournalVouchers();
      setJournalVouchersList(res || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setJvListLoading(false);
    }
  };

  const loadCoaList = async () => {
    try {
      const res = await api.getCOA();
      setCoaList(res || []);
    } catch (err) {
      console.error('Error loading COA:', err);
    }
  };

  const handleDeleteVoucher = async (id, vNo) => {
    if (!window.confirm(`Are you sure you want to delete Journal Voucher "${vNo}"? This will reverse its entries in the General Ledger.`)) {
      return;
    }
    try {
      await api.deleteJournalVoucher(id);
      showToast(`Journal Voucher ${vNo} deleted successfully`, 'success');
      loadJournalVouchers();
      checkPostedStatus();
      loadFinancialStatements();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddManualRow = () => {
    setManualJvForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { account_code: '', account_name: '', account_type: 'Asset', fund_name: 'General', description: '', debit: '', credit: '' }
      ]
    }));
  };

  const handleRemoveManualRow = (idx) => {
    if (manualJvForm.items.length <= 2) {
      showToast('A Journal Voucher requires at least 2 entry rows', 'warning');
      return;
    }
    setManualJvForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleManualRowChange = (idx, field, val) => {
    setManualJvForm(prev => {
      const updated = [...prev.items];
      if (field === 'account_code') {
        const selectedAcc = coaList.find(c => c.account_code === val);
        updated[idx] = {
          ...updated[idx],
          account_code: val,
          account_name: selectedAcc ? selectedAcc.account_name : updated[idx].account_name,
          account_type: selectedAcc ? selectedAcc.account_type : updated[idx].account_type,
          fund_name: selectedAcc?.fund_name || updated[idx].fund_name || 'General'
        };
      } else {
        updated[idx] = { ...updated[idx], [field]: val };
      }
      return { ...prev, items: updated };
    });
  };

  const handlePostManualJV = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const items = manualJvForm.items || [];
      if (items.length < 2) {
        showToast('At least 2 balanced journal voucher items are required', 'error');
        return;
      }
      const totalDr = items.reduce((s, it) => s + (parseFloat(it.debit) || 0), 0);
      const totalCr = items.reduce((s, it) => s + (parseFloat(it.credit) || 0), 0);
      if (Math.abs(totalDr - totalCr) > 0.05) {
        showToast(`Voucher is not balanced! Total Debit (BDT ${totalDr.toFixed(2)}) != Total Credit (BDT ${totalCr.toFixed(2)})`, 'error');
        return;
      }
      if (totalDr <= 0) {
        showToast('Debit and credit amounts must be greater than zero', 'error');
        return;
      }

      setPostingJv(true);
      const res = await api.postJournalVoucher({
        ...manualJvForm,
        period_month: parseInt(manualJvForm.period_month),
        period_year: parseInt(manualJvForm.period_year)
      });
      showToast(res.message || 'Journal Voucher posted successfully!', 'success');
      loadJournalVouchers();
      checkPostedStatus();
      loadFinancialStatements();
      setJvSubSection('jv-register');
      // Reset form
      setManualJvForm({
        voucher_no: '',
        voucher_date: todayStr,
        voucher_type: 'Manual General JV',
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear(),
        narration: '',
        posted_by: 'AGM (Finance)',
        items: [
          { account_code: '131.10.000', account_name: 'Cash at Bank - Settlement Account', account_type: 'Asset', fund_name: 'General', description: '', debit: '', credit: '' },
          { account_code: '419.10.000', account_name: 'Interest Income on FDR Investments', account_type: 'Revenue', fund_name: 'General', description: '', debit: '', credit: '' }
        ]
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPostingJv(false);
    }
  };

  // Filter ONLY active investments for Portfolio Register
  const activeInvestments = investments.filter(i => i.status === 'Active');
  const displayInvestments = activeInvestments.filter(i => {
    if (selectedBankFilter !== 'ALL' && i.bank_name !== selectedBankFilter) return false;
    if (!reportFilterSearch) return true;
    const q = reportFilterSearch.toLowerCase();
    return (
      (i.fdr_no || '').toLowerCase().includes(q) ||
      (i.bank_name || '').toLowerCase().includes(q) ||
      (i.bank_branch || '').toLowerCase().includes(q) ||
      (i.fund_name || '').toLowerCase().includes(q) ||
      (i.investment_type || '').toLowerCase().includes(q)
    );
  });

  const displayMaturityInvestments = investments
    .filter(inv => {
      if (selectedBankFilter !== 'ALL' && inv.bank_name !== selectedBankFilter) return false;
      if (maturityHorizonDays !== 'all') {
        const today = new Date();
        const matDate = new Date(inv.maturity_date);
        const diffDays = Math.ceil((matDate - today) / (1000 * 60 * 60 * 24));
        const daysLimit = parseInt(maturityHorizonDays);
        if (isNaN(diffDays) || diffDays < 0 || diffDays > daysLimit) return false;
      }
      if (reportFilterSearch) {
        const q = reportFilterSearch.toLowerCase();
        return (
          (inv.fdr_no || '').toLowerCase().includes(q) ||
          (inv.bank_name || '').toLowerCase().includes(q) ||
          (inv.bank_branch || '').toLowerCase().includes(q) ||
          (inv.fund_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(a.maturity_date) - new Date(b.maturity_date));

  // Summary Totals
  const totalPrincipal = displayInvestments.reduce((sum, i) => sum + (i.principal_amount || 0), 0);
  const totalAccrued = displayInvestments.reduce((sum, i) => sum + (i.accrued_gross_interest || 0), 0);
  const totalTax = displayInvestments.reduce((sum, i) => sum + (i.estimated_tax || 0), 0);
  const totalExcise = displayInvestments.reduce((sum, i) => sum + (i.estimated_excise_duty || 0), 0);
  const totalNetInterest = totalAccrued - totalTax - totalExcise;

  // Renewed FDR List & Totals (combines Standard Renewals + In-Place Rollovers)
  const standardRenewedList = investments.filter(i => i.status === 'Renewed').map(inv => {
    const gross = inv.actual_gross_interest || inv.accrued_gross_interest || 0;
    const tax = inv.actual_tax || inv.estimated_tax || 0;
    const duty = inv.actual_excise_duty || inv.estimated_excise_duty || 0;
    const charge = inv.actual_bank_charge || 0;
    const net = inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' 
      ? inv.actual_net_interest 
      : (gross - tax - duty - charge);
    const deposit = inv.encash_received || (inv.principal_amount + net);
    return {
      id: `std-${inv.id}`,
      fdr_no: inv.fdr_no,
      bank_name: inv.bank_name,
      bank_branch: inv.bank_branch || inv.branch_name,
      acc_code: inv.acc_code,
      fund_name: inv.fund_name,
      principal_amount: inv.principal_amount,
      gross,
      tax,
      duty,
      charge,
      net,
      deposit,
      renewal_date: inv.encash_date || inv.maturity_date,
      remarks: cleanRemarks(inv.remarks) || 'Standard Renewal',
      renewal_type: 'Standard'
    };
  });

  const inplaceRenewedList = (inplaceRolloverData?.records || []).map(r => ({
    id: `inp-${r.id}`,
    fdr_no: r.fdr_no,
    bank_name: r.bank_name,
    bank_branch: r.bank_branch,
    acc_code: r.acc_code,
    fund_name: r.fund_name,
    principal_amount: r.new_principal,
    gross: r.gross_interest || 0,
    tax: r.tax_amount || 0,
    duty: r.excise_duty || 0,
    charge: 0,
    net: r.net_interest || 0,
    deposit: r.new_principal,
    renewal_date: r.rollover_date,
    remarks: cleanRemarks(r.remarks) || 'Renew',
    renewal_type: 'Renew'
  }));

  const renewedInvestments = [...standardRenewedList, ...inplaceRenewedList];

  const renewedTotals = renewedInvestments.reduce((acc, i) => ({
    principal: acc.principal + (i.principal_amount || 0),
    gross: acc.gross + i.gross,
    tax: acc.tax + i.tax,
    duty: acc.duty + i.duty,
    charge: acc.charge + i.charge,
    net: acc.net + i.net,
    deposit: acc.deposit + i.deposit
  }), { principal: 0, gross: 0, tax: 0, duty: 0, charge: 0, net: 0, deposit: 0 });

  // Encashed FDR List & Totals
  const encashedInvestments = investments.filter(i => i.status === 'Encashed');
  const encashedTotals = encashedInvestments.reduce((acc, i) => {
    const gross = i.actual_gross_interest || 0;
    const tax = i.actual_tax || 0;
    const duty = i.actual_excise_duty || 0;
    const charge = i.actual_bank_charge || 0;
    const net = i.actual_net_interest !== undefined && i.actual_net_interest !== null && i.actual_net_interest !== '' 
      ? i.actual_net_interest 
      : (gross - tax - duty - charge);
    const deposit = i.encash_received || (i.principal_amount + net);
    return {
      principal: acc.principal + (i.principal_amount || 0),
      gross: acc.gross + gross,
      tax: acc.tax + tax,
      duty: acc.duty + duty,
      charge: acc.charge + charge,
      net: acc.net + net,
      deposit: acc.deposit + deposit
    };
  }, { principal: 0, gross: 0, tax: 0, duty: 0, charge: 0, net: 0, deposit: 0 });

  // Bank Grouping
  const bankWiseMap = {};
  activeInvestments.forEach(inv => {
    if (!bankWiseMap[inv.bank_name]) {
      bankWiseMap[inv.bank_name] = { count: 0, totalAmount: 0, totalAccrued: 0 };
    }
    bankWiseMap[inv.bank_name].count++;
    bankWiseMap[inv.bank_name].totalAmount += inv.principal_amount;
    bankWiseMap[inv.bank_name].totalAccrued += inv.accrued_gross_interest || 0;
  });

  const handleExportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csvContent = "data:text/csv;charset=utf-8," +
      keys.join(",") + "\n" +
      data.map(row => keys.map(k => `"${row[k] || ''}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const getFiscalYearMonths = (fyString) => {
    let startYear = 2026;
    let endYear = 2027;
    if (fyString === 'FY 2025-2026') { startYear = 2025; endYear = 2026; }
    else if (fyString === 'FY 2024-2025') { startYear = 2024; endYear = 2025; }
    else if (fyString === 'FY 2023-2024') { startYear = 2023; endYear = 2024; }
    else if (fyString === 'FY 2022-2023') { startYear = 2022; endYear = 2023; }

    return [
      { monthName: 'July', monthNum: 7, year: startYear },
      { monthName: 'August', monthNum: 8, year: startYear },
      { monthName: 'September', monthNum: 9, year: startYear },
      { monthName: 'October', monthNum: 10, year: startYear },
      { monthName: 'November', monthNum: 11, year: startYear },
      { monthName: 'December', monthNum: 12, year: startYear },
      { monthName: 'January', monthNum: 1, year: endYear },
      { monthName: 'February', monthNum: 2, year: endYear },
      { monthName: 'March', monthNum: 3, year: endYear },
      { monthName: 'April', monthNum: 4, year: endYear },
      { monthName: 'May', monthNum: 5, year: endYear },
      { monthName: 'June', monthNum: 6, year: endYear },
    ];
  };

  const handlePeriodQuickMonth = (val) => {
    setPeriodQuickMonth(val);
    if (!val) return;
    const [mode, yStr, mStr] = val.split('_');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const padM = String(m).padStart(2, '0');
    const padD = String(lastDay).padStart(2, '0');
    const monthEnd = `${y}-${padM}-${padD}`;

    if (mode === 'single') {
      setPeriodPrevDate(`${y}-${padM}-01`);
      setPeriodCurrDate(monthEnd);
    } else if (mode === 'cumulative') {
      const startYear = m < 7 ? y - 1 : y;
      setPeriodPrevDate(`${startYear}-07-01`);
      setPeriodCurrDate(monthEnd);
    }
  };

  const distinctBanks = Array.from(new Set(investments.map(i => i.bank_name).filter(Boolean))).sort();

  const currentMeta = (() => {
    switch (activeReportTab) {
      case 'portfolio': return { title: 'Portfolio Register', subtitle: 'Live status of active investments & balances' };
      case 'fy-fdr-register': return { title: `Fixed Deposit Register (Annexure A) — ${fyRegisterFy}`, subtitle: 'Fiscal Year FDR balances, additions, encashments, realized profit & accrued interest with fund-wise sub-totals' };
      case 'govt-fdr': return { title: 'Government Bank FDR Register', subtitle: 'Detailed investment register of FDRs held in State-Owned & Govt Banks' };
      case 'private-fdr': return { title: 'Private Bank FDR Register', subtitle: 'Detailed investment register of FDRs held in Private Commercial Banks' };
      case 'monthly': return { title: `Monthly Report (${monthOptions.find(m => m.value === selectedMonth)?.label} ${selectedYear})`, subtitle: 'Monthly revenue, tax provisions & profit reconciliation' };
      case 'auto-jv': return { title: `Auto Journal Voucher (${monthOptions.find(m => m.value === selectedMonth)?.label} ${selectedYear})`, subtitle: 'Automated monthly balanced JV based on month-over-month movement & profit accruals' };
      case 'maturity': return { title: 'Maturity Schedule', subtitle: 'Upcoming maturity timeline & payout schedules' };
      case 'bank-exposure': return { title: 'Bank Exposure', subtitle: 'Institutional risk & principal distribution across banks' };
      case 'fund-wise': return { title: 'Fund Concentration', subtitle: 'Detailed balance breakdown by PBS fund account codes' };
      case 'sector-matrix': return { title: 'Bank & Fund Matrix', subtitle: 'Cross-tabulation matrix of funds vs banking institutions' };
      case 'bank-branch-wise': return { title: 'Bank & Branch Breakdown', subtitle: 'Hierarchical tree of FDRs grouped by bank branch locations' };
      case 'accrual-statements': return { title: 'Financial Statements', subtitle: 'Audited Balance Sheet, Income & Cash Flow statements' };
      case 'period-comparison': return { title: 'Period Movement', subtitle: 'Opening balance, additions, encashments & closing balance' };
      case 'provisions': return { title: 'Provision Ledger', subtitle: 'Detailed interest accrual & statutory tax provision ledger' };
      case 'renewed-fdr': return { title: 'Renewed FDRs', subtitle: 'Settled renewals, reinvested principal & revised rate structure' };
      case 'encashed-fdr': return { title: 'Encashed FDRs', subtitle: 'Settlement summary, net cash received & bank deductions' };
      case 'inplace-rollover': return { title: 'In-Place Rollovers', subtitle: 'Automated in-place FDR renewals log' };
      case 'financial-history': return { title: 'Financial History', subtitle: 'Chronological activity history & modification audit trail' };
      case 'sap-crystal': return { title: 'SAP Crystal Engine', subtitle: 'Formal SAP Crystal styled enterprise report engine' };
      default: return { title: 'Reports Suite', subtitle: 'Enterprise analytical reporting suite' };
    }
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* DYNAMIC TOP MENUBAR & PARAMETER CONTROLS */}
      <div className="glass-panel no-print" style={{ padding: '6px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderRadius: '10px' }}>
        
        {/* Left Menubar Info & Quick Report Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>{currentMeta.title}</span>
              <span className="badge badge-info" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                Live Preview
              </span>
              <select
                value={activeReportTab}
                onChange={(e) => setActiveReportTab(e.target.value)}
                className="form-select"
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  height: '26px',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  fontWeight: '700',
                  border: '1.5px solid var(--primary)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginLeft: '4px'
                }}
                title="Switch Report Directly"
              >
                <optgroup label="📂 Portfolio & Registers (রেজিস্টার)">
                  <option value="portfolio">Portfolio Register (চলমান)</option>
                  <option value="fy-fdr-register">FY FDR Register (Annexure A - অর্থবছর)</option>
                  <option value="govt-fdr">Govt. Bank FDR List (সরকারি)</option>
                  <option value="private-fdr">Private Bank FDR List (বেসরকারি)</option>
                  <option value="monthly">Monthly Report (মাসিক)</option>
                  <option value="maturity">Maturity Schedule (মেয়াদপূর্তি)</option>
                </optgroup>
                <optgroup label="📊 Exposure & Matrix (ম্যাট্রিক্স)">
                  <option value="bank-exposure">Bank Exposure (ব্যাংক এক্সপোজার)</option>
                  <option value="fund-wise">Fund Concentration (ফান্ড ভিত্তিক)</option>
                  <option value="sector-matrix">Bank & Fund Matrix (ম্যাট্রিক্স)</option>
                  <option value="bank-branch-wise">Bank & Branch Breakdown (শাখা বিবরণী)</option>
                </optgroup>
                <optgroup label="📑 Statements & Accruals (বিবরণী)">
                  <option value="accrual-statements">Financial Statements (আর্থিক বিবরণী)</option>
                  <option value="period-comparison">Period Movement (পিরিয়ড মুভমেন্ট)</option>
                  <option value="provisions">Provision Ledger (প্রভিশন খতিয়ান)</option>
                  <option value="auto-jv">Auto Journal Voucher (অটো জেভি)</option>
                </optgroup>
              </select>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentMeta.subtitle}</span>
          </div>
        </div>

        {/* Right Menubar Controls & Dynamic Report Parameters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          
          {/* FY FDR Register (Annexure A) Parameters */}
          {activeReportTab === 'fy-fdr-register' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-hover)', padding: '3px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>Fiscal Year:</span>
              <select
                className="form-select"
                value={fyRegisterFy}
                onChange={(e) => setFyRegisterFy(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                <option value="FY 2026-2027">FY 2026-2027 (Jul 2026 – Jun 2027)</option>
                <option value="FY 2025-2026">FY 2025-2026 (Jul 2025 – Jun 2026)</option>
                <option value="FY 2024-2025">FY 2024-2025 (Jul 2024 – Jun 2025)</option>
                <option value="FY 2023-2024">FY 2023-2024 (Jul 2023 – Jun 2024)</option>
              </select>

              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '4px' }}>Fund:</span>
              <select
                className="form-select"
                value={fyRegisterFundFilter}
                onChange={(e) => setFyRegisterFundFilter(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                <option value="ALL">All Funds (সকল ফান্ড)</option>
                {(fyRegisterData?.fund_groups || []).map(g => (
                  <option key={g.fund_id} value={g.acc_code}>{g.fund_name} ({g.acc_code})</option>
                ))}
              </select>

              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '4px' }}>Search:</span>
              <input
                type="text"
                placeholder="Search bank / FDR..."
                value={fyRegisterSearch}
                onChange={(e) => setFyRegisterSearch(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 8px', height: '26px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: '600', border: '1.5px solid var(--input-border)', borderRadius: '6px', width: '130px' }}
              />
            </div>
          )}
          
          {/* Monthly & Fund-Wise Parameters */}
          {(activeReportTab === 'monthly' || activeReportTab === 'fund-wise' || activeReportTab === 'auto-jv') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-hover)', padding: '3px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>Month:</span>
              <select
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '4px' }}>Year:</span>
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Maturity Schedule Parameters */}
          {activeReportTab === 'maturity' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-hover)', padding: '3px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>Horizon:</span>
              <select
                className="form-select"
                value={maturityHorizonDays}
                onChange={(e) => setMaturityHorizonDays(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                <option value="all">All Maturing FDRs</option>
                <option value="30">Next 30 Days</option>
                <option value="60">Next 60 Days</option>
                <option value="90">Next 90 Days</option>
                <option value="180">Next 180 Days</option>
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '4px' }}>Bank:</span>
              <select
                className="form-select"
                value={selectedBankFilter}
                onChange={(e) => setSelectedBankFilter(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                <option value="ALL">All Commercial Banks</option>
                {distinctBanks.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Period Comparison Parameters */}
          {activeReportTab === 'period-comparison' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-hover)', padding: '3px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>Prev:</span>
              <input
                type="date"
                className="form-input"
                value={periodPrevDate}
                onChange={(e) => setPeriodPrevDate(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '4px' }}>Curr:</span>
              <input
                type="date"
                className="form-input"
                value={periodCurrDate}
                onChange={(e) => setPeriodCurrDate(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '4px' }}>Basis:</span>
              <select
                className="form-select"
                value={periodInterestMode}
                onChange={(e) => setPeriodInterestMode(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                <option value="actual">Realized Interest</option>
                <option value="accrued">Accrued Interest</option>
              </select>
            </div>
          )}

          {/* Accrual Financial Statements Parameters */}
          {activeReportTab === 'accrual-statements' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-hover)', padding: '3px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>As-Of:</span>
              <input
                type="date"
                className="form-input"
                value={finAsOfDate}
                onChange={(e) => setFinAsOfDate(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '4px' }}>Start:</span>
              <input
                type="date"
                className="form-input"
                value={finStartDate}
                onChange={(e) => setFinStartDate(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              />
            </div>
          )}

          {/* Bank Branch & Exposure Parameters */}
          {(activeReportTab === 'bank-branch-wise' || activeReportTab === 'bank-exposure') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-hover)', padding: '3px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>Bank:</span>
              <select
                className="form-select"
                value={selectedBankFilter}
                onChange={(e) => setSelectedBankFilter(e.target.value)}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                <option value="ALL">All Banking Partners</option>
                {distinctBanks.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* SAP Crystal Parameters */}
          {activeReportTab === 'sap-crystal' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-hover)', padding: '3px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>Module:</span>
              <select
                className="form-select"
                value={sapReportConfig.reportType}
                onChange={e => setSapReportConfig({...sapReportConfig, reportType: e.target.value})}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              >
                <option value="master-register">Master FDR Register</option>
                <option value="monthly">Monthly Statement</option>
                <option value="fund-wise">Fund Concentration</option>
                <option value="maturity">Maturity Schedule</option>
                <option value="renewed-fdr">Renewed Statement</option>
                <option value="encashed-fdr">Encashed Statement</option>
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold', marginLeft: '4px' }}>As-Of:</span>
              <input
                type="date"
                className="form-input"
                value={sapReportConfig.asOfDate}
                onChange={e => setSapReportConfig({...sapReportConfig, asOfDate: e.target.value})}
                style={{ fontSize: '11px', padding: '2px 6px', height: '28px', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', border: '1.5px solid var(--input-border)' }}
              />
            </div>
          )}

          {/* Report Print Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }} title="Change Report Printing Date">
            <Calendar size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>Print Date:</span>
            <input
              type="date"
              className="form-input"
              value={reportPrintDate}
              onChange={(e) => setReportPrintDate(e.target.value)}
              style={{ padding: '2px 6px', fontSize: '11px', height: '28px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold', cursor: 'pointer' }}
            />
          </div>

              {/* Quick Search */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search in preview..."
                  className="form-input"
                  value={reportFilterSearch}
                  onChange={(e) => setReportFilterSearch(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '12px', width: '160px', height: '34px' }}
                />
              </div>

              {/* Zoom Controls */}
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '6px' }}>
                <button 
                  onClick={() => setPreviewZoom(Math.max(70, previewZoom - 10))} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', minWidth: '34px', textAlign: 'center' }}>{previewZoom}%</span>
                <button 
                  onClick={() => setPreviewZoom(Math.min(140, previewZoom + 10))} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                {previewZoom !== 100 && (
                  <button 
                    onClick={() => setPreviewZoom(100)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '2px' }} 
                    title="Reset Zoom"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>

              {/* Print Orientation Controls */}
              {activeReportTab === 'fy-fdr-register' ? (
                <button 
                  onClick={() => triggerPrint('landscape')} 
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', fontSize: '12px', padding: '6px 14px', fontWeight: '700' }} 
                  title="Print Fixed Deposit Register in Landscape orientation"
                >
                  <Printer size={14} />
                  <span>Print Register (Landscape)</span>
                </button>
              ) : (
                <>
                  {/* Print Portrait */}
                  <button onClick={() => triggerPrint('portrait')} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} title="Print in Portrait orientation">
                    <Printer size={14} />
                    <span>Portrait</span>
                  </button>

                  {/* Print Landscape */}
                  <button onClick={() => triggerPrint('landscape')} className="btn-primary" style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', fontSize: '12px', padding: '6px 12px' }} title="Print in Landscape orientation">
                    <Printer size={14} />
                    <span>Landscape</span>
                  </button>
                </>
              )}

              {/* Export Excel */}
              <button onClick={handleExportExcel} className="btn-success" style={{ fontSize: '12px', padding: '6px 12px' }} title="Export data to Excel">
                <FileSpreadsheet size={14} />
                <span>Excel</span>
              </button>
            </div>

          </div>

          {/* 3. PRINTABLE REPORT CANVAS (WITH LIVE PREVIEW ZOOM) */}
          <div className="glass-panel printable-area" style={{ padding: '12px 16px', minHeight: '600px', transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : 'none', transformOrigin: 'top center', transition: 'transform 0.15s ease' }}>
            {activeReportTab !== 'sap-crystal' && (
              <PrintHeader
                printOnly={false}
                title={activeReportTab === 'fy-fdr-register' ? 'FIXED DEPOSIT REGISTER' : 'MANAGEMENT & ACCOUNTS REPORT'}
                docRef={activeReportTab === 'fy-fdr-register' ? 'Annexure A' : undefined}
                date={formatDate(reportPrintDate)}
              />
            )}

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Generating live report preview...</div>
            ) : (
              <>
            {/* REPORT 1: PORTFOLIO SUMMARY */}
            {activeReportTab === 'portfolio' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#60a5fa' }}>
                  Executive Investment Portfolio Register Report
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total Principal Investment</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>{formatCurrency(totalPrincipal)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Accrued Gross Profit</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#60a5fa', marginTop: '4px' }}>{formatCurrency(totalAccrued)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Statutory Tax & Duty</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#fb7185', marginTop: '4px' }}>{formatCurrency(totalTax + totalExcise)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Net Receivable Interest</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>{formatCurrency(totalNetInterest)}</div>
                  </div>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>FDR / Cert No</th>
                        <th>Type</th>
                        <th>Bank Institution</th>
                        <th>Principal Amount</th>
                        <th>Rate (%)</th>
                        <th>Issue Date</th>
                        <th>Maturity Date</th>
                        <th>Accrued Interest</th>
                        <th>Est. Tax</th>
                        <th>Est. Net Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInvestments.map(inv => (
                        <tr key={inv.id}>
                          <td><strong>{inv.fdr_no}</strong></td>
                          <td>{inv.investment_type}</td>
                          <td>{inv.bank_name} ({inv.bank_branch})</td>
                          <td><strong>{formatCurrency(inv.principal_amount)}</strong></td>
                          <td>{inv.interest_rate}%</td>
                          <td>{formatDate(inv.issue_date)}</td>
                          <td>{formatDate(inv.maturity_date)}</td>
                          <td>{formatCurrency(inv.accrued_gross_interest)}</td>
                          <td>{formatCurrency(inv.estimated_tax)}</td>
                          <td><strong style={{ color: '#34d399' }}>{formatCurrency(inv.estimated_net_interest)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT: FY WISE FDR BALANCES & REGISTER (ANNEXURE A) */}
            {activeReportTab === 'fy-fdr-register' && (() => {
              if (fyRegisterLoading) {
                return (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px auto', width: '36px', height: '36px' }}></div>
                    <div style={{ fontSize: '15px', fontWeight: '700' }}>Loading Fiscal Year FDR Register (Annexure A)...</div>
                  </div>
                );
              }

              if (!fyRegisterData || !fyRegisterData.fund_groups) {
                return (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No FDR records found for {fyRegisterFy}.
                  </div>
                );
              }

              const searchQ = fyRegisterSearch.trim().toLowerCase();
              const displayedGroups = (fyRegisterData.fund_groups || [])
                .filter(g => fyRegisterFundFilter === 'ALL' || g.acc_code === fyRegisterFundFilter)
                .map(g => {
                  if (!searchQ) return g;
                  const filteredRecords = g.records.filter(r => 
                    (r.bank_name || '').toLowerCase().includes(searchQ) ||
                    (r.bank_branch || '').toLowerCase().includes(searchQ) ||
                    (r.fdr_no || '').toLowerCase().includes(searchQ)
                  );
                  const sub = {
                    opening_balance: filteredRecords.reduce((s, r) => s + r.opening_balance, 0),
                    addition_renewal_int: filteredRecords.reduce((s, r) => s + r.addition_renewal_int, 0),
                    addition_new_inv: filteredRecords.reduce((s, r) => s + r.addition_new_inv, 0),
                    principal_encashment: filteredRecords.reduce((s, r) => s + r.principal_encashment, 0),
                    closing_balance: filteredRecords.reduce((s, r) => s + r.closing_balance, 0),
                    opening_provision: filteredRecords.reduce((s, r) => s + r.opening_provision, 0),
                    charged_during_year: filteredRecords.reduce((s, r) => s + r.charged_during_year, 0),
                    source_tax: filteredRecords.reduce((s, r) => s + r.source_tax, 0),
                    excise_duty: filteredRecords.reduce((s, r) => s + r.excise_duty, 0),
                    encashment_net: filteredRecords.reduce((s, r) => s + r.encashment_net, 0),
                    accrued_amount: filteredRecords.reduce((s, r) => s + r.accrued_amount, 0),
                    count: filteredRecords.length
                  };
                  return { ...g, records: filteredRecords, sub_total: sub };
                })
                .filter(g => g.records.length > 0);

              const grandTotals = {
                opening_balance: displayedGroups.reduce((s, g) => s + g.sub_total.opening_balance, 0),
                addition_renewal_int: displayedGroups.reduce((s, g) => s + g.sub_total.addition_renewal_int, 0),
                addition_new_inv: displayedGroups.reduce((s, g) => s + g.sub_total.addition_new_inv, 0),
                principal_encashment: displayedGroups.reduce((s, g) => s + g.sub_total.principal_encashment, 0),
                closing_balance: displayedGroups.reduce((s, g) => s + g.sub_total.closing_balance, 0),
                opening_provision: displayedGroups.reduce((s, g) => s + g.sub_total.opening_provision, 0),
                charged_during_year: displayedGroups.reduce((s, g) => s + g.sub_total.charged_during_year, 0),
                source_tax: displayedGroups.reduce((s, g) => s + g.sub_total.source_tax, 0),
                excise_duty: displayedGroups.reduce((s, g) => s + g.sub_total.excise_duty, 0),
                encashment_net: displayedGroups.reduce((s, g) => s + g.sub_total.encashment_net, 0),
                accrued_amount: displayedGroups.reduce((s, g) => s + g.sub_total.accrued_amount, 0),
                total_count: displayedGroups.reduce((s, g) => s + g.sub_total.count, 0)
              };

              let runningSl = 1;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* FISCAL YEAR & REPORT PERIOD SUBTITLE */}
                  <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', paddingBottom: '2px' }}>
                    Fiscal Year: <span style={{ color: '#0284c7', fontWeight: '800' }}>{fyRegisterData?.fiscal_year}</span> &nbsp;•&nbsp; Period: <span>{formatDate(fyRegisterData?.start_date)}</span> to <span>{formatDate(fyRegisterData?.end_date)}</span>
                  </div>

                  {/* SUMMARY CARDS STRIP (AT A GLANCE) */}
                  <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderLeft: '4px solid #60a5fa', padding: '10px 14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>Opening Principal ({fyRegisterData?.start_date})</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#0284c7', marginTop: '2px' }}>
                        {formatCurrency(grandTotals.opening_balance)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981', padding: '10px 14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>Renewal Additions (Net)</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
                        +{formatCurrency(grandTotals.addition_renewal_int)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderLeft: '4px solid #ef4444', padding: '10px 14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>Principal Encashed</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#ef4444', marginTop: '2px' }}>
                        -{formatCurrency(grandTotals.principal_encashment)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderLeft: '4px solid #0e7463', padding: '10px 14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>Closing Principal ({fyRegisterData?.end_date})</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#0e7463', marginTop: '2px' }}>
                        {formatCurrency(grandTotals.closing_balance)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderLeft: '4px solid #f59e0b', padding: '10px 14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>Year-End Accrued Interest</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#d97706', marginTop: '2px' }}>
                        {formatCurrency(grandTotals.accrued_amount)}
                      </div>
                    </div>
                  </div>

                  {/* MASTER MULTI-LEVEL TABLE */}
                  <div className="data-table-container fy-register-container" style={{ overflowX: 'auto' }}>
                    <table id="fy-fdr-register-table" className="data-table fy-fdr-register-table" style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse' }}>
                      <thead>
                        {/* TOP TIER HEADERS */}
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid var(--border-color)' }}>
                          <th rowSpan={2} style={{ textAlign: 'center', width: '36px', verticalAlign: 'middle', borderRight: '1px solid var(--border-color)' }}>Sl No.</th>
                          <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '130px', borderRight: '1px solid var(--border-color)' }}>Name of Bank</th>
                          <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '110px', borderRight: '1px solid var(--border-color)' }}>Bank Branch</th>
                          <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '105px', borderRight: '1px solid var(--border-color)' }}>A/C No / FDR No.</th>
                          <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', minWidth: '85px', borderRight: '1px solid var(--border-color)' }}>Reissue / Renew Date</th>
                          <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', minWidth: '85px', borderRight: '1px solid var(--border-color)' }}>Maturity Date</th>
                          <th rowSpan={2} style={{ textAlign: 'right', verticalAlign: 'middle', minWidth: '65px', borderRight: '2px solid #0e7463' }}>Interest Rate</th>

                          {/* PRINCIPAL SECTION (GREEN) */}
                          <th colSpan={6} style={{ textAlign: 'center', background: '#bbf7d0', color: '#166534', fontWeight: '900', fontSize: '12px', borderRight: '2px solid #0e7463', borderBottom: '1.5px solid #86efac' }}>
                            Principal
                          </th>

                          {/* INTEREST SECTION (YELLOW) */}
                          <th colSpan={6} style={{ textAlign: 'center', background: '#fef08a', color: '#854d0e', fontWeight: '900', fontSize: '12px', borderRight: '2px solid #0e7463', borderBottom: '1.5px solid #fde047' }}>
                            Interest
                          </th>

                          {/* ACCRUED INTEREST SECTION (AMBER) */}
                          <th colSpan={3} style={{ textAlign: 'center', background: '#fed7aa', color: '#9a3412', fontWeight: '900', fontSize: '12px', borderBottom: '1.5px solid #fdba74' }}>
                            Accrued Interest
                          </th>
                        </tr>

                        {/* BOTTOM TIER COLUMN HEADERS */}
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                          {/* Under Principal */}
                          <th style={{ textAlign: 'right', background: '#f0fdf4', color: '#166534', minWidth: '100px' }}>
                            Opening Balance<br/><span style={{ fontSize: '9.5px', opacity: 0.85 }}>({fyRegisterData?.start_date})</span>
                          </th>
                          <th style={{ textAlign: 'right', background: '#f0fdf4', color: '#166534', minWidth: '95px' }}>
                            Addition<br/><span style={{ fontSize: '9.5px', opacity: 0.85 }}>[Renewal Int.]</span>
                          </th>
                          <th style={{ textAlign: 'right', background: '#f0fdf4', color: '#166534', minWidth: '95px' }}>
                            Addition<br/><span style={{ fontSize: '9.5px', opacity: 0.85 }}>[New Inv.]</span>
                          </th>
                          <th style={{ textAlign: 'right', background: '#f0fdf4', color: '#991b1b', minWidth: '95px' }}>
                            Principal<br/><span style={{ fontSize: '9.5px', opacity: 0.85 }}>Encashment</span>
                          </th>
                          <th style={{ textAlign: 'right', background: '#dcfce7', color: '#15803d', fontWeight: '900', minWidth: '105px' }}>
                            Closing Balance<br/><span style={{ fontSize: '9.5px', opacity: 0.85 }}>({fyRegisterData?.end_date})</span>
                          </th>
                          <th style={{ textAlign: 'right', background: '#f0fdf4', color: '#166534', minWidth: '90px', borderRight: '2px solid #0e7463' }}>
                            Opening Balance<br/><span style={{ fontSize: '9px', opacity: 0.85 }}>(Provision)</span>
                          </th>

                          {/* Under Interest */}
                          <th style={{ textAlign: 'right', background: '#fefce8', color: '#854d0e', minWidth: '65px' }}>Renewal<br/>Rate</th>
                          <th style={{ textAlign: 'right', background: '#fefce8', color: '#854d0e', minWidth: '95px' }}>Charged during<br/>the year</th>
                          <th style={{ textAlign: 'right', background: '#fefce8', color: '#b91c1c', minWidth: '80px' }}>Source<br/>Tax</th>
                          <th style={{ textAlign: 'right', background: '#fefce8', color: '#c2410c', minWidth: '75px' }}>Excise<br/>Duty</th>
                          <th style={{ textAlign: 'right', background: '#fef08a', color: '#15803d', fontWeight: '900', minWidth: '95px' }}>Encashment<br/><span style={{ fontSize: '9px', opacity: 0.85 }}>(Net Int.)</span></th>
                          <th style={{ textAlign: 'center', background: '#fefce8', color: '#854d0e', minWidth: '70px', borderRight: '2px solid #0e7463' }}>Comments</th>

                          {/* Under Accrued Interest */}
                          <th style={{ textAlign: 'right', background: '#fff7ed', color: '#9a3412', minWidth: '55px' }}>Days</th>
                          <th style={{ textAlign: 'right', background: '#fff7ed', color: '#9a3412', minWidth: '65px' }}>Interest<br/>Rate</th>
                          <th style={{ textAlign: 'right', background: '#fed7aa', color: '#9a3412', fontWeight: '900', minWidth: '105px' }}>Amount as at<br/><span style={{ fontSize: '9.5px', opacity: 0.85 }}>{fyRegisterData?.end_date}</span></th>
                        </tr>
                      </thead>

                      <tbody>
                        {displayedGroups.map(group => (
                          <React.Fragment key={group.fund_id}>
                            {/* FUND CATEGORY GROUP BANNER */}
                            <tr style={{ background: 'linear-gradient(90deg, #ede9fe 0%, #f5f3ff 100%)', borderTop: '2px solid #7c3aed', borderBottom: '1px solid #c4b5fd' }}>
                              <td colSpan={22} style={{ padding: '7px 12px', fontSize: '13px', fontWeight: '900', color: '#6d28d9', letterSpacing: '0.01em' }}>
                                📁 FUND CATEGORY: {group.fund_name.toUpperCase()} (A/C CODE: {group.acc_code}) &nbsp;—&nbsp; {group.records.length} Investment{group.records.length !== 1 ? 's' : ''}
                              </td>
                            </tr>

                            {/* FDR RECORDS UNDER THIS FUND */}
                            {group.records.map((r) => {
                              const currentSl = runningSl++;
                              return (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                                  <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>{currentSl}</td>
                                  <td><strong style={{ color: 'var(--text-main)' }}>{r.bank_name}</strong></td>
                                  <td style={{ color: '#334155' }}>{r.bank_branch}</td>
                                  <td><strong style={{ color: '#0369a1' }}>{r.fdr_no}</strong></td>
                                  <td style={{ textAlign: 'center', color: 'var(--text-main)' }}>{formatDate(r.reissue_date)}</td>
                                  <td style={{ textAlign: 'center', color: '#c2410c', fontWeight: '700' }}>{formatDate(r.maturity_date)}</td>
                                  <td style={{ textAlign: 'right', color: '#1d4ed8', fontWeight: '700' }}>{r.interest_rate ? `${r.interest_rate}%` : '-'}</td>

                                  {/* Principal values */}
                                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>
                                    {r.opening_balance > 0 ? formatCurrency(r.opening_balance) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#15803d', fontWeight: '700' }}>
                                    {r.addition_renewal_int > 0 ? formatCurrency(r.addition_renewal_int) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#0369a1', fontWeight: '700' }}>
                                    {r.addition_new_inv > 0 ? formatCurrency(r.addition_new_inv) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#b91c1c', fontWeight: '700' }}>
                                    {r.principal_encashment > 0 ? formatCurrency(r.principal_encashment) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d', background: 'rgba(220, 252, 231, 0.35)' }}>
                                    {r.closing_balance > 0 ? formatCurrency(r.closing_balance) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                    {r.opening_provision > 0 ? formatCurrency(r.opening_provision) : '-'}
                                  </td>

                                  {/* Interest values */}
                                  <td style={{ textAlign: 'right', color: '#1d4ed8', fontWeight: '700' }}>
                                    {r.renewal_rate > 0 ? `${r.renewal_rate}%` : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#0369a1', fontWeight: '700' }}>
                                    {r.charged_during_year > 0 ? formatCurrency(r.charged_during_year) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#b91c1c', fontWeight: '700' }}>
                                    {r.source_tax > 0 ? formatCurrency(r.source_tax) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#c2410c', fontWeight: '700' }}>
                                    {r.excise_duty > 0 ? formatCurrency(r.excise_duty) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#15803d', fontWeight: '900', background: 'rgba(254, 240, 138, 0.35)' }}>
                                    {r.encashment_net > 0 ? formatCurrency(r.encashment_net) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: r.comments === 'Renew' ? '#dcfce7' : (r.comments === 'Encash' ? '#fee2e2' : '#e0f2fe'),
                                      color: r.comments === 'Renew' ? '#15803d' : (r.comments === 'Encash' ? '#b91c1c' : '#0369a1'),
                                      border: `1px solid ${r.comments === 'Renew' ? '#86efac' : (r.comments === 'Encash' ? '#fca5a5' : '#7dd3fc')}`
                                    }}>
                                      {r.comments}
                                    </span>
                                  </td>

                                  {/* Accrued Interest values */}
                                  <td style={{ textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>
                                    {r.accrued_days > 0 ? `${r.accrued_days}.00` : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#1d4ed8', fontWeight: '700' }}>
                                    {r.accrued_rate > 0 ? `${r.accrued_rate}%` : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: '900', color: '#c2410c', background: 'rgba(254, 215, 170, 0.35)' }}>
                                    {r.accrued_amount > 0 ? formatCurrency(r.accrued_amount) : '-'}
                                  </td>
                                </tr>
                              );
                            })}

                            {/* SUB-TOTAL ROW FOR THIS FUND CATEGORY */}
                            <tr style={{ background: '#fef3c7', fontWeight: '800', borderTop: '2px solid #d97706', borderBottom: '2px solid #d97706' }}>
                              <td colSpan={7} style={{ textAlign: 'right', color: '#92400e', fontSize: '12px', fontWeight: '900' }}>
                                SUB-TOTAL [{group.fund_name}] ({group.records.length} FDRs):
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--text-main)' }}>
                                {formatCurrency(group.sub_total.opening_balance)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d' }}>
                                {formatCurrency(group.sub_total.addition_renewal_int)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#0369a1' }}>
                                {formatCurrency(group.sub_total.addition_new_inv)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#b91c1c' }}>
                                {formatCurrency(group.sub_total.principal_encashment)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d', fontSize: '12.5px' }}>
                                {formatCurrency(group.sub_total.closing_balance)}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                {formatCurrency(group.sub_total.opening_provision)}
                              </td>
                              <td></td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#0369a1' }}>
                                {formatCurrency(group.sub_total.charged_during_year)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#b91c1c' }}>
                                {formatCurrency(group.sub_total.source_tax)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#c2410c' }}>
                                {formatCurrency(group.sub_total.excise_duty)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d', fontSize: '12.5px' }}>
                                {formatCurrency(group.sub_total.encashment_net)}
                              </td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td style={{ textAlign: 'right', fontWeight: '900', color: '#c2410c', fontSize: '12.5px' }}>
                                {formatCurrency(group.sub_total.accrued_amount)}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>

                      {/* GRAND TOTAL SUMMARY (ALL FUNDS) */}
                      <tfoot style={{ borderTop: '3px double #0e7463', background: '#dcfce7' }}>
                        <tr style={{ fontWeight: '900', fontSize: '13px' }}>
                          <td colSpan={7} style={{ textAlign: 'right', color: '#065f46', fontWeight: '900' }}>
                            GRAND TOTAL (ALL FUNDS) ({grandTotals.total_count} FDRs):
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--text-main)' }}>
                            {formatCurrency(grandTotals.opening_balance)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d' }}>
                            {formatCurrency(grandTotals.addition_renewal_int)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#0369a1' }}>
                            {formatCurrency(grandTotals.addition_new_inv)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#b91c1c' }}>
                            {formatCurrency(grandTotals.principal_encashment)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d', fontSize: '14px' }}>
                            {formatCurrency(grandTotals.closing_balance)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                            {formatCurrency(grandTotals.opening_provision)}
                          </td>
                          <td></td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#0369a1' }}>
                            {formatCurrency(grandTotals.charged_during_year)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#b91c1c' }}>
                            {formatCurrency(grandTotals.source_tax)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#c2410c' }}>
                            {formatCurrency(grandTotals.excise_duty)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d', fontSize: '14px' }}>
                            {formatCurrency(grandTotals.encashment_net)}
                          </td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td style={{ textAlign: 'right', fontWeight: '900', color: '#c2410c', fontSize: '14px' }}>
                            {formatCurrency(grandTotals.accrued_amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* DUAL SIGNATURE FOOTER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '48px', paddingTop: '20px', paddingLeft: '40px', paddingRight: '40px' }}>
                    <div style={{ textAlign: 'center', minWidth: '180px', borderTop: '1.5px solid #0f172a', paddingTop: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>AGM (Finance)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{settings.samity_name || 'Gazipur PBS-2'}</div>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: '180px', borderTop: '1.5px solid #0f172a', paddingTop: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>General Manager</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{settings.samity_name || 'Gazipur PBS-2'}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* REPORT: GOVERNMENT BANK FDR LIST */}
            {activeReportTab === 'govt-fdr' && (() => {
              const govtList = activeInvestments.filter(inv => inv.bank_type === 'Government Bank' || inv.bank_type !== 'Private Bank');
              const gPrincipal = govtList.reduce((sum, i) => sum + (i.principal_amount || 0), 0);
              const gAccrued = govtList.reduce((sum, i) => sum + (i.accrued_gross_interest || 0), 0);
              const gTax = govtList.reduce((sum, i) => sum + (i.estimated_tax || 0), 0);
              const gExcise = govtList.reduce((sum, i) => sum + (i.estimated_excise_duty || 0), 0);
              const gNet = govtList.reduce((sum, i) => sum + (i.estimated_net_interest || 0), 0);

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#34d399', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Government Bank FDR Investment Register Report</span>
                      </h3>
                    </div>
                    <span className="badge badge-active" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                      {govtList.length} Govt. FDR Certificates
                    </span>
                  </div>

                  <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ background: 'rgba(52,211,153,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: '700', textTransform: 'uppercase' }}>Total Govt. Principal</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>{formatCurrency(gPrincipal)}</div>
                    </div>
                    <div style={{ background: 'rgba(56,189,248,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.2)' }}>
                      <div style={{ fontSize: '10px', color: '#7dd3fc', fontWeight: '700', textTransform: 'uppercase' }}>Gross Accrued Interest</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>{formatCurrency(gAccrued)}</div>
                    </div>
                    <div style={{ background: 'rgba(244,63,94,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.2)' }}>
                      <div style={{ fontSize: '10px', color: '#fda4af', fontWeight: '700', textTransform: 'uppercase' }}>Est. Tax & Duty</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fb7185', marginTop: '2px' }}>{formatCurrency(gTax + gExcise)}</div>
                    </div>
                    <div style={{ background: 'rgba(251,191,36,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <div style={{ fontSize: '10px', color: '#fde68a', fontWeight: '700', textTransform: 'uppercase' }}>Net Receivable Profit</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fbbf24', marginTop: '2px' }}>{formatCurrency(gNet)}</div>
                    </div>
                  </div>

                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>FDR / Cert No</th>
                          <th>Fund Category</th>
                          <th>Bank & Branch Name</th>
                          <th style={{ textAlign: 'right' }}>Principal Amount (BDT)</th>
                          <th style={{ textAlign: 'center' }}>Rate</th>
                          <th style={{ textAlign: 'center' }}>Issue Date</th>
                          <th style={{ textAlign: 'center' }}>Maturity Date</th>
                          <th style={{ textAlign: 'right' }}>Accrued Interest</th>
                          <th style={{ textAlign: 'right' }}>Est. Tax</th>
                          <th style={{ textAlign: 'right' }}>Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {govtList.length === 0 ? (
                          <tr>
                            <td colSpan="11" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                              No active FDR investments found in Government Banks.
                            </td>
                          </tr>
                        ) : (
                          govtList.map((inv, idx) => (
                            <tr key={inv.id}>
                              <td>{idx + 1}</td>
                              <td><strong>{inv.fdr_no}</strong></td>
                              <td><span style={{ color: '#94a3b8' }}>{inv.fund_name}</span></td>
                              <td>
                                <strong>{inv.bank_name}</strong>
                                <div style={{ fontSize: '11px', color: '#6ee7b7' }}>Branch: {inv.bank_branch}</div>
                              </td>
                              <td style={{ textAlign: 'right' }}><strong>{formatCurrency(inv.principal_amount)}</strong></td>
                              <td style={{ textAlign: 'center' }}><span className="badge badge-info">{inv.interest_rate}%</span></td>
                              <td style={{ textAlign: 'center' }}>{formatDate(inv.issue_date)}</td>
                              <td style={{ textAlign: 'center' }}>{formatDate(inv.maturity_date)}</td>
                              <td style={{ textAlign: 'right', color: '#38bdf8' }}>{formatCurrency(inv.accrued_gross_interest)}</td>
                              <td style={{ textAlign: 'right', color: '#f87171' }}>{formatCurrency(inv.estimated_tax)}</td>
                              <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 'bold' }}>{formatCurrency(inv.estimated_net_interest)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {govtList.length > 0 && (
                        <tfoot>
                          <tr style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                            <td colSpan="4" style={{ textAlign: 'right' }}>TOTAL GOVERNMENT BANK FDRs ({govtList.length}):</td>
                            <td style={{ textAlign: 'right', color: '#34d399' }}>{formatCurrency(gPrincipal)}</td>
                            <td colSpan="3"></td>
                            <td style={{ textAlign: 'right', color: '#38bdf8' }}>{formatCurrency(gAccrued)}</td>
                            <td style={{ textAlign: 'right', color: '#f87171' }}>{formatCurrency(gTax)}</td>
                            <td style={{ textAlign: 'right', color: '#34d399' }}>{formatCurrency(gNet)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* REPORT: PRIVATE BANK FDR LIST */}
            {activeReportTab === 'private-fdr' && (() => {
              const privList = activeInvestments.filter(inv => inv.bank_type === 'Private Bank');
              const pPrincipal = privList.reduce((sum, i) => sum + (i.principal_amount || 0), 0);
              const pAccrued = privList.reduce((sum, i) => sum + (i.accrued_gross_interest || 0), 0);
              const pTax = privList.reduce((sum, i) => sum + (i.estimated_tax || 0), 0);
              const pExcise = privList.reduce((sum, i) => sum + (i.estimated_excise_duty || 0), 0);
              const pNet = privList.reduce((sum, i) => sum + (i.estimated_net_interest || 0), 0);

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Private Commercial Bank FDR Investment Register Report</span>
                      </h3>
                    </div>
                    <span className="badge badge-renewed" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                      {privList.length} Private FDR Certificates
                    </span>
                  </div>

                  <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ background: 'rgba(251,191,36,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <div style={{ fontSize: '10px', color: '#fde68a', fontWeight: '700', textTransform: 'uppercase' }}>Total Private Principal</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fbbf24', marginTop: '2px' }}>{formatCurrency(pPrincipal)}</div>
                    </div>
                    <div style={{ background: 'rgba(56,189,248,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.2)' }}>
                      <div style={{ fontSize: '10px', color: '#7dd3fc', fontWeight: '700', textTransform: 'uppercase' }}>Gross Accrued Interest</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>{formatCurrency(pAccrued)}</div>
                    </div>
                    <div style={{ background: 'rgba(244,63,94,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.2)' }}>
                      <div style={{ fontSize: '10px', color: '#fda4af', fontWeight: '700', textTransform: 'uppercase' }}>Est. Tax & Duty</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fb7185', marginTop: '2px' }}>{formatCurrency(pTax + pExcise)}</div>
                    </div>
                    <div style={{ background: 'rgba(52,211,153,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: '700', textTransform: 'uppercase' }}>Net Receivable Profit</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>{formatCurrency(pNet)}</div>
                    </div>
                  </div>

                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>FDR / Cert No</th>
                          <th>Fund Category</th>
                          <th>Bank & Branch Name</th>
                          <th style={{ textAlign: 'right' }}>Principal Amount (BDT)</th>
                          <th style={{ textAlign: 'center' }}>Rate</th>
                          <th style={{ textAlign: 'center' }}>Issue Date</th>
                          <th style={{ textAlign: 'center' }}>Maturity Date</th>
                          <th style={{ textAlign: 'right' }}>Accrued Interest</th>
                          <th style={{ textAlign: 'right' }}>Est. Tax</th>
                          <th style={{ textAlign: 'right' }}>Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {privList.length === 0 ? (
                          <tr>
                            <td colSpan="11" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                              No active FDR investments found in Private Banks.
                            </td>
                          </tr>
                        ) : (
                          privList.map((inv, idx) => (
                            <tr key={inv.id}>
                              <td>{idx + 1}</td>
                              <td><strong>{inv.fdr_no}</strong></td>
                              <td><span style={{ color: '#94a3b8' }}>{inv.fund_name}</span></td>
                              <td>
                                <strong>{inv.bank_name}</strong>
                                <div style={{ fontSize: '11px', color: '#fbbf24' }}>Branch: {inv.bank_branch}</div>
                              </td>
                              <td style={{ textAlign: 'right' }}><strong>{formatCurrency(inv.principal_amount)}</strong></td>
                              <td style={{ textAlign: 'center' }}><span className="badge badge-renewed">{inv.interest_rate}%</span></td>
                              <td style={{ textAlign: 'center' }}>{formatDate(inv.issue_date)}</td>
                              <td style={{ textAlign: 'center' }}>{formatDate(inv.maturity_date)}</td>
                              <td style={{ textAlign: 'right', color: '#38bdf8' }}>{formatCurrency(inv.accrued_gross_interest)}</td>
                              <td style={{ textAlign: 'right', color: '#f87171' }}>{formatCurrency(inv.estimated_tax)}</td>
                              <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 'bold' }}>{formatCurrency(inv.estimated_net_interest)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {privList.length > 0 && (
                        <tfoot>
                          <tr style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                            <td colSpan="4" style={{ textAlign: 'right' }}>TOTAL PRIVATE BANK FDRs ({privList.length}):</td>
                            <td style={{ textAlign: 'right', color: '#fbbf24' }}>{formatCurrency(pPrincipal)}</td>
                            <td colSpan="3"></td>
                            <td style={{ textAlign: 'right', color: '#38bdf8' }}>{formatCurrency(pAccrued)}</td>
                            <td style={{ textAlign: 'right', color: '#f87171' }}>{formatCurrency(pTax)}</td>
                            <td style={{ textAlign: 'right', color: '#34d399' }}>{formatCurrency(pNet)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* REPORT 2: MONTHLY REPORT */}
            {activeReportTab === 'monthly' && (
              <div>
                {monthlyLoading || !monthlyData ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading monthly summary...</div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: '#60a5fa' }}>
                          Monthly Investment & Profit Statement: {monthlyData.monthName} {monthlyData.year}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                          Accounting Period: {formatDate(monthlyData.startDateStr)} to {formatDate(monthlyData.endDateStr)}
                        </p>
                      </div>
                      <button
                        className="btn no-print"
                        onClick={() => setActiveReportTab('auto-jv')}
                        style={{ fontSize: '12px', padding: '7px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)', border: 'none', color: '#fff', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(251,113,133,0.3)' }}
                      >
                        <FileText size={15} /> View Auto Journal Voucher (JV)
                      </button>
                    </div>

                    {/* Monthly Summary Cards Grid */}
                    <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Active FDR Count</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>{monthlyData.totalActiveFdrCount || monthlyData.monthlyRegister.length} FDRs</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>During {monthlyData.monthName} {monthlyData.year}</div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #60a5fa' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Opening Portfolio Balance</div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#60a5fa', marginTop: '4px' }}>{formatCurrency(monthlyData.openingBalance)}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{monthlyData.openingCount} Active at Start</div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #34d399' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>New Openings / Renewals</div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>+{formatCurrency(monthlyData.newInvestmentsMonth)}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{monthlyData.newCountMonth} New Certificates</div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #fbbf24' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gross Profit Accrued</div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>{formatCurrency(monthlyData.monthGrossInterest)}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>During {monthlyData.monthName}</div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Net Monthly Profit</div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>{formatCurrency(monthlyData.monthNetInterest)}</div>
                        <div style={{ fontSize: '10px', color: '#fb7185', marginTop: '2px' }}>After Tax ({formatCurrency(monthlyData.monthTaxProvision)}) & Duty</div>
                      </div>
                    </div>

                    {/* FUND-WISE BALANCE RECONCILIATION SUMMARY */}
                    {monthlyData.fundBreakdown && monthlyData.fundBreakdown.length > 0 && (
                      <div style={{ marginBottom: '28px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#34d399', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Fund-wise Monthly Balance & Profit Reconciliation</span>
                        </h4>
                        <div className="data-table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>FUND CATEGORY</th>
                                <th style={{ textAlign: 'center' }}>FDR COUNT</th>
                                 <th style={{ textAlign: 'right' }}>TOTAL PRINCIPAL (BDT)</th>
                                <th style={{ textAlign: 'right' }}>MONTHLY GROSS PROFIT (BDT)</th>
                                <th style={{ textAlign: 'right' }}>MONTHLY TAX / AIT (BDT)</th>
                                <th style={{ textAlign: 'right' }}>NET MONTHLY PROFIT (BDT)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyData.fundBreakdown.map((fb, idx) => (
                                <tr key={idx}>
                                  <td><strong>{fb.fund_name}</strong></td>
                                  <td style={{ textAlign: 'center' }}><span className="badge badge-info">{fb.fdr_count} FDRs</span></td>
                                  <td style={{ textAlign: 'right' }}><strong>{formatCurrency(fb.total_principal)}</strong></td>
                                  <td style={{ textAlign: 'right', color: '#38bdf8' }}>{formatCurrency(fb.total_gross_interest)}</td>
                                  <td style={{ textAlign: 'right', color: '#f87171' }}>{formatCurrency(fb.total_tax)}</td>
                                  <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 'bold' }}>{formatCurrency(fb.total_net_interest)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ITEMIZED MONTHLY FDR REGISTER TABLE */}
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#60a5fa', marginBottom: '12px' }}>
                        Itemized Active FDR Register & Monthly Accruals ({monthlyData.monthlyRegister.length} Investments)
                      </h4>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>FDR / Cert No</th>
                              <th>Fund Category</th>
                              <th>Bank Institution</th>
                              <th style={{ textAlign: 'right' }}>Principal Amount</th>
                              <th style={{ textAlign: 'center' }}>Rate</th>
                              <th style={{ textAlign: 'center' }}>Days</th>
                              <th style={{ textAlign: 'right' }}>Monthly Gross Interest</th>
                              <th style={{ textAlign: 'right' }}>Monthly Tax (AIT)</th>
                              <th style={{ textAlign: 'right' }}>Monthly Net Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyData.monthlyRegister.map(inv => (
                              <tr key={inv.id}>
                                <td><strong>{inv.fdr_no}</strong></td>
                                <td><span style={{ color: '#94a3b8' }}>{inv.fund_name}</span></td>
                                <td>{inv.bank_name} ({inv.bank_branch})</td>
                                <td style={{ textAlign: 'right' }}><strong>{formatCurrency(inv.principal_amount)}</strong></td>
                                <td style={{ textAlign: 'center' }}>{inv.interest_rate}%</td>
                                <td style={{ textAlign: 'center' }}>{inv.days_in_month} Days</td>
                                <td style={{ textAlign: 'right', color: '#38bdf8' }}>{formatCurrency(inv.month_gross_interest)}</td>
                                <td style={{ textAlign: 'right', color: '#fb7185' }}>{formatCurrency(inv.month_tax)}</td>
                                <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 'bold' }}>{formatCurrency(inv.month_net_interest)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* REPORT: AUTO JOURNAL VOUCHER (AUTO JV) */}
            {activeReportTab === 'auto-jv' && (
              <div>
                {monthlyLoading || !monthlyData ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading Auto Journal Voucher data...</div>
                ) : (() => {
                  const year = monthlyData.year;
                  const monthStr = String(monthlyData.month).padStart(2, '0');
                  const jvNo = `JV/PBS/${year}/${monthStr}`;
                  const jvDate = formatDate(monthlyData.endDateStr);
                  
                  const grossInterest = monthlyData.monthGrossInterest || 0;
                  const taxProvision = monthlyData.monthTaxProvision || 0;
                  const exciseDuty = monthlyData.monthExciseDuty || 0;
                  const netInterest = monthlyData.monthNetInterest || 0;
                  const newAdditions = monthlyData.newInvestmentsMonth || 0;
                  const encashments = monthlyData.encashedMonth || 0;
                  const openingBal = monthlyData.openingBalance || 0;
                  const closingBal = monthlyData.closingBalance || 0;
                  const netMovement = newAdditions - encashments;

                  const actualSettlement = monthlyData.actualSettlement || {
                    totalGrossInterest: 0,
                    totalTax: 0,
                    totalExciseDuty: 0,
                    totalBankCharge: 0,
                    totalNetInterest: 0,
                    totalEncashmentPrincipal: 0,
                    totalRenewedPrincipal: 0,
                    eventsCount: 0,
                    actualFundBreakdown: [],
                    actualEvents: []
                  };

                  // ── 1. PROVISIONAL MONTHLY ACCRUAL JOURNAL ENTRIES (PBS BREB UNIFORM COA) ──
                  const provisionalEntries = [
                    {
                      code: '143.10.000',
                      account: 'Accrued Interest Receivable (FDR Investments)',
                      narration: `Gross profit accrued on FDR portfolio for ${monthlyData.monthName} ${year} (${formatDate(monthlyData.startDateStr)} to ${formatDate(monthlyData.endDateStr)})`,
                      debit: grossInterest,
                      credit: 0
                    },
                    {
                      code: '419.10.000',
                      account: 'Interest Income on FDR Investments',
                      narration: `Gross profit revenue recognized for ${monthlyData.monthName} ${year}`,
                      debit: 0,
                      credit: grossInterest
                    },
                    {
                      code: '165.20.000',
                      account: 'Advance Income Tax (AIT) Paid at Source',
                      narration: `Statutory 10%/15% AIT withholding provision for ${monthlyData.monthName} ${year}`,
                      debit: taxProvision,
                      credit: 0
                    },
                    {
                      code: '236.10.000',
                      account: 'Provision for Income Tax Liabilities',
                      narration: `Tax liability provision accrued for ${monthlyData.monthName} ${year}`,
                      debit: 0,
                      credit: taxProvision
                    }
                  ];

                  if (exciseDuty > 0) {
                    provisionalEntries.push(
                      {
                        code: '922',
                        account: 'Bank Excise Duty & Service Charges',
                        narration: `Excise duty and charges deducted for ${monthlyData.monthName} ${year}`,
                        debit: exciseDuty,
                        credit: 0
                      },
                      {
                        code: '131.10.000',
                        account: 'Cash at Bank - Settlement Account',
                        narration: `Bank charges paid in ${monthlyData.monthName} ${year}`,
                        debit: 0,
                        credit: exciseDuty
                      }
                    );
                  }

                  if (newAdditions > 0) {
                    provisionalEntries.push(
                      {
                        code: '136.10.000',
                        account: 'FDR Principal Investment Account',
                        narration: `New FDR investment principal added in ${monthlyData.monthName} ${year} (${monthlyData.newCountMonth} Certificates)`,
                        debit: newAdditions,
                        credit: 0
                      },
                      {
                        code: '131.10.000',
                        account: 'Cash at Bank - Settlement Account',
                        narration: `Disbursement for new FDR placements in ${monthlyData.monthName} ${year}`,
                        debit: 0,
                        credit: newAdditions
                      }
                    );
                  }

                  if (encashments > 0) {
                    provisionalEntries.push(
                      {
                        code: '131.10.000',
                        account: 'Cash at Bank - Settlement Account',
                        narration: `Encashment proceeds received in ${monthlyData.monthName} ${year} (${monthlyData.encashedCountMonth} Certificates)`,
                        debit: encashments,
                        credit: 0
                      },
                      {
                        code: '136.10.000',
                        account: 'FDR Principal Investment Account',
                        narration: `Principal reduction on matured/encashed FDRs in ${monthlyData.monthName} ${year}`,
                        debit: 0,
                        credit: encashments
                      }
                    );
                  }

                  // ── PROVISIONAL FUND-WISE ENTRIES ──
                  const provisionalFundGroupedEntries = [];
                  if (monthlyData.fundBreakdown && monthlyData.fundBreakdown.length > 0) {
                    monthlyData.fundBreakdown.forEach((fb) => {
                      const fundName = fb.fund_name || 'General Fund';
                      const fundCode = fb.acc_code || '136.10.000';
                      const gross = fb.total_gross_interest || 0;
                      const tax = fb.total_tax || 0;

                      let fundNewAdditions = 0;
                      let fundEncashments = 0;
                      const startDateStr = monthlyData.startDateStr;
                      const endDateStr = monthlyData.endDateStr;

                      (monthlyData.monthlyRegister || []).forEach(inv => {
                        const invFund = inv.fund_name || 'General Fund';
                        if (invFund === fundName) {
                          const isClosed = inv.status === 'Encashed' || inv.status === 'Renewed';
                          const closeDateStr = inv.encash_date || (inv.updated_at ? inv.updated_at.split(' ')[0] : inv.maturity_date);

                          if (inv.issue_date >= startDateStr && inv.issue_date <= endDateStr) {
                            fundNewAdditions += inv.principal_amount || 0;
                          }
                          if (isClosed && closeDateStr >= startDateStr && closeDateStr <= endDateStr) {
                            fundEncashments += inv.principal_amount || 0;
                          }
                        }
                      });

                      const fundEntries = [];
                      if (gross > 0) {
                        fundEntries.push(
                          {
                            code: '143.10.000',
                            account: `Accrued Interest Receivable — ${fundName}`,
                            narration: `Gross profit accrued on ${fundName} FDR portfolio for ${monthlyData.monthName} ${year}`,
                            debit: gross,
                            credit: 0
                          },
                          {
                            code: '419.10.000',
                            account: `Interest Income on FDRs — ${fundName}`,
                            narration: `Gross profit revenue recognized for ${fundName} in ${monthlyData.monthName} ${year}`,
                            debit: 0,
                            credit: gross
                          }
                        );
                      }

                      if (tax > 0) {
                        fundEntries.push(
                          {
                            code: '165.20.000',
                            account: `Advance Income Tax (AIT) Paid at Source — ${fundName}`,
                            narration: `AIT withholding tax provision for ${fundName} in ${monthlyData.monthName} ${year}`,
                            debit: tax,
                            credit: 0
                          },
                          {
                            code: '236.10.000',
                            account: `Provision for Income Tax Liabilities — ${fundName}`,
                            narration: `Tax liability provision accrued for ${fundName} in ${monthlyData.monthName} ${year}`,
                            debit: 0,
                            credit: tax
                          }
                        );
                      }

                      if (fundNewAdditions > 0) {
                        fundEntries.push(
                          {
                            code: fundCode,
                            account: `FDR Principal Investment Account — ${fundName}`,
                            narration: `New FDR investment principal added for ${fundName} in ${monthlyData.monthName} ${year}`,
                            debit: fundNewAdditions,
                            credit: 0
                          },
                          {
                            code: '131.10.000',
                            account: `Cash at Bank - Settlement Account — ${fundName}`,
                            narration: `Disbursement for new FDR placements of ${fundName} in ${monthlyData.monthName} ${year}`,
                            debit: 0,
                            credit: fundNewAdditions
                          }
                        );
                      }

                      if (fundEncashments > 0) {
                        fundEntries.push(
                          {
                            code: '131.10.000',
                            account: `Cash at Bank - Settlement Account — ${fundName}`,
                            narration: `Encashment proceeds received for ${fundName} in ${monthlyData.monthName} ${year}`,
                            debit: fundEncashments,
                            credit: 0
                          },
                          {
                            code: fundCode,
                            account: `FDR Principal Investment Account — ${fundName}`,
                            narration: `Principal reduction on matured/encashed FDRs for ${fundName} in ${monthlyData.monthName} ${year}`,
                            debit: 0,
                            credit: fundEncashments
                          }
                        );
                      }

                      const subtotalDebit = fundEntries.reduce((sum, e) => sum + e.debit, 0);
                      const subtotalCredit = fundEntries.reduce((sum, e) => sum + e.credit, 0);

                      if (fundEntries.length > 0) {
                        provisionalFundGroupedEntries.push({
                          fundName,
                          fundCode,
                          fdrCount: fb.fdr_count,
                          closingPrincipal: fb.total_principal,
                          entries: fundEntries,
                          subtotalDebit,
                          subtotalCredit
                        });
                      }
                    });
                  }

                  // ── 2. ACTUAL REALIZED SETTLEMENT JOURNAL ENTRIES (RENEWAL WITH INTEREST VS ENCASHMENT) ──
                  // Logic:
                  // 1. When FDR renews with Interest: Fund account increases -> DEBIT FDR Principal / Fund account (reinvested profit)
                  // 2. When FDR Encashes: Cash at Bank is DEBITED for total proceeds, FDR Principal is CREDITED for Principal Amount
                  // 3. Tax at source: DEBIT AIT Tax (165.20.000)
                  // 4. Bank Charges & Duty: DEBIT Bank Charges (922)
                  // 5. Gross Realized Interest: CREDIT Interest Income (419.10.000)
                  const actGross = actualSettlement.totalGrossInterest || 0;
                  const actTax = actualSettlement.totalTax || 0;
                  const actDuty = (actualSettlement.totalExciseDuty || 0) + (actualSettlement.totalBankCharge || 0);
                  const actReinvestNet = actualSettlement.totalReinvestedInterest || 0;
                  const actEncashP = actualSettlement.totalEncashmentPrincipal || 0;
                  const actBankDepositedNet = actualSettlement.totalBankDepositedNet || 0;
                  const actBankDepositProceeds = actualSettlement.totalBankDepositProceeds || (actEncashP + actBankDepositedNet);

                  const actualEntries = [];
                  
                  // 1. Reinvested Net Interest on Renewal (Fund Account Increases -> Debit Fund / FDR Investment Account)
                  if (actReinvestNet > 0) {
                    actualEntries.push({
                      code: '136.10.000',
                      account: 'FDR Principal Investment Account (Reinvested Interest)',
                      narration: `Net interest profit reinvested into FDR Principal (Fund Account increases) upon renewal in ${monthlyData.monthName} ${year}`,
                      debit: actReinvestNet,
                      credit: 0
                    });
                  }

                  // 2. Cash Proceeds Deposited in Bank (Encashment proceeds & direct profit payouts)
                  if (actBankDepositProceeds > 0) {
                    actualEntries.push({
                      code: '131.10.000',
                      account: 'Cash at Bank - Settlement Account',
                      narration: `Actual net profit proceeds and encashed principal deposited to Bank in ${monthlyData.monthName} ${year}`,
                      debit: actBankDepositProceeds,
                      credit: 0
                    });
                  }

                  // 3. Statutory Advance Income Tax Withheld at Source
                  if (actTax > 0) {
                    actualEntries.push({
                      code: '165.20.000',
                      account: 'Advance Income Tax (AIT) Paid at Source',
                      narration: `Actual AIT tax deducted at source by bank on renewals/encashments in ${monthlyData.monthName} ${year}`,
                      debit: actTax,
                      credit: 0
                    });
                  }

                  // 4. Bank Excise Duty and Service Charges
                  if (actDuty > 0) {
                    actualEntries.push({
                      code: '922',
                      account: 'Bank Excise Duty & Service Charges',
                      narration: `Actual excise duty and bank charges deducted by bank in ${monthlyData.monthName} ${year}`,
                      debit: actDuty,
                      credit: 0
                    });
                  }

                  // 5. Encashment Principal Reduction (Fund Account Decreases -> Credit Fund / FDR Investment Account)
                  if (actEncashP > 0) {
                    actualEntries.push({
                      code: '136.10.000',
                      account: 'FDR Principal Investment Account (Principal Encashment)',
                      narration: `Actual principal reduction on encashed/settled FDRs in ${monthlyData.monthName} ${year}`,
                      debit: 0,
                      credit: actEncashP
                    });
                  }

                  // 6. Realized Gross Interest Revenue Recognized
                  if (actGross > 0) {
                    actualEntries.push({
                      code: '419.10.000',
                      account: 'Interest Income on FDRs (Realized Revenue)',
                      narration: `Actual gross interest profit realized upon maturity/encashment/renewal in ${monthlyData.monthName} ${year}`,
                      debit: 0,
                      credit: actGross
                    });
                  }

                  // ── ACTUAL FUND-WISE ENTRIES ──
                  const actualFundGroupedEntries = [];
                  if (actualSettlement.actualFundBreakdown && actualSettlement.actualFundBreakdown.length > 0) {
                    actualSettlement.actualFundBreakdown.forEach((fb) => {
                      const fundName = fb.fund_name || 'General Fund';
                      const fundCode = fb.acc_code || '136.10.000';
                      const gross = fb.gross_interest || 0;
                      const tax = fb.tax || 0;
                      const duty = (fb.excise_duty || 0) + (fb.bank_charge || 0);
                      const reinvestNet = fb.reinvested_interest || 0;
                      const bankDepositTotal = fb.bank_deposit_total || 0;
                      const encashP = fb.encashment_principal || 0;

                      const fundEntries = [];

                      // Fund increases with reinvested profit on renewal -> Debit Fund Code
                      if (reinvestNet > 0) {
                        fundEntries.push({
                          code: fundCode,
                          account: `FDR Principal Investment Account — ${fundName} (Reinvested Interest)`,
                          narration: `Net interest profit reinvested into ${fundName} FDR Principal in ${monthlyData.monthName} ${year}`,
                          debit: reinvestNet,
                          credit: 0
                        });
                      }

                      // Proceeds deposited in bank -> Debit Cash at Bank
                      if (bankDepositTotal > 0) {
                        fundEntries.push({
                          code: '131.10.000',
                          account: `Cash at Bank - Settlement Account — ${fundName}`,
                          narration: `Actual net profit & encashment proceeds realized in Bank for ${fundName} in ${monthlyData.monthName} ${year}`,
                          debit: bankDepositTotal,
                          credit: 0
                        });
                      }

                      // AIT Tax -> Debit AIT
                      if (tax > 0) {
                        fundEntries.push({
                          code: '165.20.000',
                          account: `Advance Income Tax (AIT) Paid at Source — ${fundName}`,
                          narration: `Actual AIT tax deducted at source for ${fundName} in ${monthlyData.monthName} ${year}`,
                          debit: tax,
                          credit: 0
                        });
                      }

                      // Bank Charges -> Debit 922
                      if (duty > 0) {
                        fundEntries.push({
                          code: '922',
                          account: `Bank Excise Duty & Service Charges — ${fundName}`,
                          narration: `Actual excise duty and bank charges deducted for ${fundName} in ${monthlyData.monthName} ${year}`,
                          debit: duty,
                          credit: 0
                        });
                      }

                      // Encashment principal equal fund credit -> Credit Fund Code
                      if (encashP > 0) {
                        fundEntries.push({
                          code: fundCode,
                          account: `FDR Principal Investment Account — ${fundName} (Principal Encashment)`,
                          narration: `Actual principal reduction on encashed FDRs for ${fundName} in ${monthlyData.monthName} ${year}`,
                          debit: 0,
                          credit: encashP
                        });
                      }

                      // Realized Revenue -> Credit 419.10.000
                      if (gross > 0) {
                        fundEntries.push({
                          code: '419.10.000',
                          account: `Interest Income on FDRs (Realized) — ${fundName}`,
                          narration: `Actual gross interest realized for ${fundName} in ${monthlyData.monthName} ${year}`,
                          debit: 0,
                          credit: gross
                        });
                      }

                      const subtotalDebit = fundEntries.reduce((sum, e) => sum + e.debit, 0);
                      const subtotalCredit = fundEntries.reduce((sum, e) => sum + e.credit, 0);

                      if (fundEntries.length > 0) {
                        actualFundGroupedEntries.push({
                          fundName,
                          fundCode,
                          fdrCount: fb.event_count,
                          closingPrincipal: (fb.encashment_principal || 0) + (fb.renewed_principal || 0),
                          entries: fundEntries,
                          subtotalDebit,
                          subtotalCredit
                        });
                      }
                    });
                  }

                  // ── ACTIVE ENTRIES SELECTION ──
                  const entries = jvTypeMode === 'actual' ? actualEntries : provisionalEntries;
                  const fundGroupedEntries = jvTypeMode === 'actual' ? actualFundGroupedEntries : provisionalFundGroupedEntries;

                  const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
                  const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
                  const isBalanced = Math.abs(totalDebit - totalCredit) < 1;

                  const handleCopyJvText = () => {
                    const textLines = [
                      `================================================================================`,
                      `PALLI BIDYUT SAMITI (PBS) - AUTOMATED JOURNAL VOUCHER (AUTO JV)`,
                      `================================================================================`,
                      `Voucher No   : ${jvNo}`,
                      `Voucher Date : ${jvDate}`,
                      `Period       : ${formatDate(monthlyData.startDateStr)} to ${formatDate(monthlyData.endDateStr)} (${monthlyData.monthName} ${year})`,
                      `JV Type Basis: ${jvTypeMode === 'actual' ? 'Actual Realized Settlement (Renewals, Encashment & History)' : 'Provisional Monthly Profit Accruals'}`,
                      `View Mode    : ${jvViewMode === 'fund-wise' ? 'Fund-Wise Subtotals' : 'Consolidated Summary'}`,
                      `Status       : ${isBalanced ? 'BALANCED (100%)' : 'UNBALANCED'}`,
                      `================================================================================`
                    ];

                    if (jvViewMode === 'fund-wise' && fundGroupedEntries.length > 0) {
                      fundGroupedEntries.forEach(group => {
                        textLines.push(`\n--- FUND NAME: ${group.fundName.toUpperCase()} (${group.fdrCount} Events/FDRs) ---`);
                        textLines.push(`ACCOUNT CODE | ACCOUNT DESCRIPTION | DEBIT (BDT) | CREDIT (BDT)`);
                        textLines.push(`--------------------------------------------------------------------------------`);
                        group.entries.forEach(e => {
                          textLines.push(`${e.code.padEnd(12)} | ${e.account}`);
                          textLines.push(`  Narration : ${e.narration}`);
                          textLines.push(`  Debit     : ${e.debit ? formatCurrency(e.debit) : '0.00'}`);
                          textLines.push(`  Credit    : ${e.credit ? formatCurrency(e.credit) : '0.00'}`);
                          textLines.push(`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - `);
                        });
                        textLines.push(`SUBTOTAL [${group.fundName}] => DEBIT: BDT ${formatCurrency(group.subtotalDebit)} | CREDIT: BDT ${formatCurrency(group.subtotalCredit)}`);
                      });
                    } else {
                      entries.forEach(e => {
                        textLines.push(`${e.code.padEnd(12)} | ${e.account}`);
                        textLines.push(`  Narration : ${e.narration}`);
                        textLines.push(`  Debit     : ${e.debit ? formatCurrency(e.debit) : '0.00'}`);
                        textLines.push(`  Credit    : ${e.credit ? formatCurrency(e.credit) : '0.00'}`);
                        textLines.push(`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - `);
                      });
                    }

                    textLines.push(`\n================================================================================`);
                    textLines.push(`GRAND TOTAL DEBIT  : BDT ${formatCurrency(totalDebit)}`);
                    textLines.push(`GRAND TOTAL CREDIT : BDT ${formatCurrency(totalCredit)}`);
                    textLines.push(`NET DIFFERENCE     : BDT ${formatCurrency(totalDebit - totalCredit)}`);
                    textLines.push(`================================================================================`);
                    
                    navigator.clipboard.writeText(textLines.join('\n'));
                    showToast('Auto JV journal entries copied to clipboard!', 'success');
                  };

                  const handleAutoPostToGL = async () => {
                    try {
                      setPostingJv(true);
                      const vType = jvTypeMode === 'actual' ? 'Auto JV - Actual Realized' : 'Auto JV - Provisional Accruals';
                      const typeTag = jvTypeMode === 'actual' ? 'ACTUAL' : 'PROV';
                      const defaultVNo = `JV/PBS/${year}/${monthStr}/${typeTag}`;

                      const postItems = entries.map(e => ({
                        account_code: e.code,
                        account_name: e.account,
                        account_type: e.code.startsWith('1') ? 'Asset' : (e.code.startsWith('2') ? 'Liability' : (e.code.startsWith('3') ? 'Equity' : (e.code.startsWith('4') ? 'Revenue' : 'Expense'))),
                        fund_name: e.account.includes('—') ? e.account.split('—')[1].trim() : 'General',
                        description: e.narration,
                        debit: e.debit || 0,
                        credit: e.credit || 0
                      }));

                      const res = await api.autoPostJournalVoucher({
                        year: parseInt(year),
                        month: parseInt(monthlyData.month),
                        voucher_type: vType,
                        voucher_no: defaultVNo,
                        voucher_date: finAsOfDate || monthlyData.endDateStr,
                        narration: `Automated ${jvTypeMode === 'actual' ? 'Actual Realized Settlement' : 'Provisional Monthly Profit Accrual'} Journal Voucher for ${monthlyData.monthName} ${year}`,
                        items: postItems,
                        posted_by: 'AGM (Finance)'
                      });

                      showToast(res.message || 'Auto JV successfully posted to General Ledger!', 'success');
                      checkPostedStatus();
                      loadJournalVouchers();
                      loadFinancialStatements();
                    } catch (err) {
                      showToast(err.message, 'error');
                    } finally {
                      setPostingJv(false);
                    }
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* SUB NAVIGATION FOR AUTO JV, MANUAL ENTRY & POSTED REGISTER */}
                      <div className="no-print" style={{ display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setJvSubSection('auto-jv')}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            background: jvSubSection === 'auto-jv' ? '#007acc' : 'var(--bg-card)',
                            color: jvSubSection === 'auto-jv' ? '#ffffff' : 'var(--text-main)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: jvSubSection === 'auto-jv' ? '0 2px 8px rgba(0,122,204,0.3)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <FileText size={16} /> Automated Monthly JV
                        </button>
                        <button
                          type="button"
                          onClick={() => setJvSubSection('manual-jv')}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            background: jvSubSection === 'manual-jv' ? '#10b981' : 'var(--bg-card)',
                            color: jvSubSection === 'manual-jv' ? '#ffffff' : 'var(--text-main)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: jvSubSection === 'manual-jv' ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Plus size={16} /> Post Manual Journal Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => { setJvSubSection('jv-register'); loadJournalVouchers(); }}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            background: jvSubSection === 'jv-register' ? '#7c3aed' : 'var(--bg-card)',
                            color: jvSubSection === 'jv-register' ? '#ffffff' : 'var(--text-main)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: jvSubSection === 'jv-register' ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <BookOpen size={16} /> Journal Voucher Book ({journalVouchersList.length})
                        </button>
                      </div>

                      {/* VIEW 1: AUTOMATED MONTHLY JV */}
                      {jvSubSection === 'auto-jv' && (
                        <>
                          {/* TOP CONTROL BAR & ACTIONS */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <FileText size={20} /> Automated Monthly Journal Voucher (Auto JV)
                                </h3>
                                {isJvPosted ? (
                                  <span className="badge badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
                                    <Check size={12} /> Posted in GL ({postedJvInfo?.voucher_no})
                                  </span>
                                ) : (
                                  <span className="badge badge-warning" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
                                    <AlertCircle size={12} /> Unposted Auto JV
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                                {jvTypeMode === 'actual' 
                                  ? `Actual realized financial settlements (Renewals, Encashment & History) for ${monthlyData.monthName} ${year}` 
                                  : `Month-over-month movement & profit accruals from ${formatDate(monthlyData.startDateStr)} to ${formatDate(monthlyData.endDateStr)}`}
                              </p>
                            </div>
                            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              
                              {/* 1. JV TYPE BASIS SELECTOR (PROVISIONAL vs ACTUAL REALIZED) */}
                              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <button
                                  type="button"
                                  onClick={() => setJvTypeMode('provisional')}
                                  title="Provisional monthly profit accruals for open portfolio"
                                  style={{
                                    padding: '5px 11px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: jvTypeMode === 'provisional' ? '#007acc' : 'transparent',
                                    color: jvTypeMode === 'provisional' ? '#ffffff' : 'var(--text-main)',
                                    boxShadow: jvTypeMode === 'provisional' ? '0 2px 6px rgba(0,122,204,0.3)' : 'none',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Provisional Accruals
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setJvTypeMode('actual')}
                                  title="Actual realized settlements from Renewals, Encashments & History List"
                                  style={{
                                    padding: '5px 11px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: jvTypeMode === 'actual' ? '#10b981' : 'transparent',
                                    color: jvTypeMode === 'actual' ? '#ffffff' : 'var(--text-main)',
                                    boxShadow: jvTypeMode === 'actual' ? '0 2px 6px rgba(16,185,129,0.3)' : 'none',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Actual Realized JV ({actualSettlement.eventsCount})
                                </button>
                              </div>

                              {/* 2. JV VIEW MODE SELECTOR (FUND-WISE SUBTOTALS vs CONSOLIDATED) */}
                              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <button
                                  type="button"
                                  onClick={() => setJvViewMode('fund-wise')}
                                  title="Display Journal Voucher entries grouped by Fund Name with Fund Subtotals"
                                  style={{
                                    padding: '5px 11px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: jvViewMode === 'fund-wise' ? '#7c3aed' : 'transparent',
                                    color: jvViewMode === 'fund-wise' ? '#ffffff' : 'var(--text-main)',
                                    boxShadow: jvViewMode === 'fund-wise' ? '0 2px 6px rgba(124,58,237,0.3)' : 'none',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Fund-Wise Subtotals
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setJvViewMode('consolidated')}
                                  title="Display Consolidated Summary Journal Voucher"
                                  style={{
                                    padding: '5px 11px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: jvViewMode === 'consolidated' ? '#7c3aed' : 'transparent',
                                    color: jvViewMode === 'consolidated' ? '#ffffff' : 'var(--text-main)',
                                    boxShadow: jvViewMode === 'consolidated' ? '0 2px 6px rgba(124,58,237,0.3)' : 'none',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Consolidated Summary
                                </button>
                              </div>

                              {/* 3. ACTION BUTTON: POST AUTO JV TO GENERAL LEDGER */}
                              <button
                                type="button"
                                onClick={handleAutoPostToGL}
                                disabled={postingJv || entries.length === 0}
                                style={{
                                  fontSize: '12px',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  background: isJvPosted ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  cursor: postingJv || entries.length === 0 ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontWeight: '700',
                                  boxShadow: isJvPosted ? '0 2px 8px rgba(2,132,199,0.3)' : '0 2px 8px rgba(16,185,129,0.3)'
                                }}
                                title="Post these journal entries directly to the General Ledger to update Actual Financial Statements"
                              >
                                <Send size={13} />
                                {postingJv ? 'Posting...' : (isJvPosted ? 'Re-Post / Update GL' : 'Post Auto JV to GL')}
                              </button>

                              <button
                                className="btn btn-secondary"
                                onClick={handleCopyJvText}
                                style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                Copy JV Narrative
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleExportExcel('auto-jv-table')}
                                style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                Export Excel
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => window.print()}
                                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #007acc 0%, #005a9e 100%)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                Print Voucher
                              </button>
                            </div>
                          </div>

                          {/* SUMMARY KPI CARDS DEPENDING ON MODE */}
                          {jvTypeMode === 'actual' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Settlement Events</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>{actualSettlement.eventsCount} Events</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Renewals &amp; Encashments</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #007acc' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actual Gross Revenue</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#007acc', marginTop: '4px' }}>{formatCurrency(actualSettlement.totalGrossInterest)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>419.10.000 (Cr Revenue)</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #ef4444' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actual AIT Tax Paid</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>{formatCurrency(actualSettlement.totalTax)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>165.20.000 (Dr AIT Asset)</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #d97706' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actual Duty &amp; Charges</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>{formatCurrency(actualSettlement.totalExciseDuty + actualSettlement.totalBankCharge)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>922 (Dr Bank Charge)</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reinvested to Fund</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>{formatCurrency(actualSettlement.totalReinvestedInterest)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>136.10.000 (Dr Fund Account)</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #8b5cf6' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deposited to Bank</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#8b5cf6', marginTop: '4px' }}>{formatCurrency(actualSettlement.totalBankDepositProceeds)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>131.10.000 (Dr Cash at Bank)</div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #007acc' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prev Month End (Opening)</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>{formatCurrency(openingBal)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{monthlyData.openingCount} FDRs at Start</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Principal Movement</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: netMovement >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                                  {netMovement >= 0 ? `+${formatCurrency(netMovement)}` : formatCurrency(netMovement)}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  +{formatCurrency(newAdditions)} / -{formatCurrency(encashments)}
                                </div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #8b5cf6' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Selected Month End (Closing)</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>{formatCurrency(closingBal)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{monthlyData.totalActiveFdrCount} Active FDRs</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #d97706' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gross Profit Accrual</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>{formatCurrency(grossInterest)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{monthlyData.monthName} Accrual</div>
                              </div>

                              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid #ef4444' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tax & Duty Provisions</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>{formatCurrency(taxProvision + exciseDuty)}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>AIT ({formatCurrency(taxProvision)})</div>
                              </div>
                            </div>
                          )}

                      {/* OFFICIAL VOUCHER CONTAINER (FOR SCREEN & PRINT) */}
                      <div className="printable-area" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', color: 'var(--text-main)' }}>
                        
                        {/* VOUCHER HEADER */}
                        <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              PALLI BIDYUT SAMITI (PBS)
                            </h2>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: jvTypeMode === 'actual' ? '#10b981' : '#e11d48', marginTop: '4px' }}>
                              AUTOMATED JOURNAL VOUCHER (AUTO JV) — {jvTypeMode === 'actual' ? 'ACTUAL SETTLEMENT & REALIZED HISTORY' : 'PROVISIONAL MONTHLY ACCRUALS'} ({jvViewMode === 'fund-wise' ? 'FUND-WISE SUBTOTALS' : 'CONSOLIDATED SUMMARY'})
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {jvTypeMode === 'actual'
                                ? 'Actual Realized Financial Transactions from Encashment, Renewal & History Register'
                                : 'Monthly Financial Settlement & Accrual Register'}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div style={{ background: jvTypeMode === 'actual' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(225, 29, 72, 0.1)', border: jvTypeMode === 'actual' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(225, 29, 72, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', color: jvTypeMode === 'actual' ? '#10b981' : '#e11d48' }}>
                              Voucher No: {jvNo}{jvTypeMode === 'actual' ? '/ACTUAL' : ''}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '4px' }}>
                              <strong>Voucher Date:</strong> {jvDate}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              <strong>Period:</strong> {monthlyData.monthName} {year} ({formatDate(monthlyData.startDateStr)} - {formatDate(monthlyData.endDateStr)})
                            </div>
                            {isBalanced ? (
                              <span className="badge badge-success" style={{ fontSize: '10px', marginTop: '4px' }}>
                                Balanced JV
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ fontSize: '10px', marginTop: '4px' }}>
                                Unbalanced JV
                              </span>
                            )}
                          </div>
                        </div>

                        {/* JOURNAL ENTRIES TABLE */}
                        <div style={{ marginBottom: '24px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0284c7', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>1. General Ledger Journal Entries {jvViewMode === 'fund-wise' ? '(Fund-Wise Subtotals)' : '(Consolidated)'}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', textTransform: 'none' }}>
                              Basis: <strong>{jvTypeMode === 'actual' ? 'Actual Realized Settlement' : 'Provisional Accruals'}</strong> | Grouping: <strong>{jvViewMode === 'fund-wise' ? 'Fund Name Subtotal' : 'Consolidated Overall'}</strong>
                            </span>
                          </h4>
                          
                          {jvTypeMode === 'actual' && entries.length === 0 ? (
                            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--table-th-bg)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                              <FileText size={32} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
                              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>No Actual Realized Settlements Recorded in {monthlyData.monthName} {year}</div>
                              <div style={{ fontSize: '12px', marginTop: '4px' }}>No FDRs were encashed or renewed during this accounting period. Switch to "Provisional Accruals" to view month-over-month profit accruals.</div>
                            </div>
                          ) : (
                            <div className="data-table-container">
                              <table className="data-table" id="auto-jv-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: '120px' }}>ACCOUNT CODE</th>
                                    <th>ACCOUNT TITLE & TRANSACTION NARRATION</th>
                                    <th style={{ textAlign: 'right', width: '160px' }}>DEBIT AMOUNT (BDT)</th>
                                    <th style={{ textAlign: 'right', width: '160px' }}>CREDIT AMOUNT (BDT)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {jvViewMode === 'fund-wise' && fundGroupedEntries.length > 0 ? (
                                    fundGroupedEntries.map((group, gIdx) => (
                                      <React.Fragment key={gIdx}>
                                        {/* FUND GROUP HEADER ROW */}
                                        <tr style={{ background: 'var(--table-th-bg)', borderTop: gIdx > 0 ? '2px solid var(--border-color)' : 'none' }}>
                                          <td colSpan="4" style={{ fontWeight: '800', color: '#0284c7', padding: '8px 12px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            FUND NAME: {group.fundName} &nbsp;
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', textTransform: 'none' }}>
                                              ({group.fdrCount} {jvTypeMode === 'actual' ? 'Events' : 'FDRs'} • {jvTypeMode === 'actual' ? 'Realized Settlement Value' : 'Closing Principal'}: BDT {formatCurrency(group.closingPrincipal)})
                                            </span>
                                          </td>
                                        </tr>

                                        {/* FUND JOURNAL ENTRIES */}
                                        {group.entries.map((item, idx) => (
                                          <tr key={idx}>
                                            <td style={{ paddingLeft: '16px' }}><code style={{ color: '#0284c7', fontWeight: 'bold' }}>{item.code}</code></td>
                                            <td>
                                              <div style={{ fontWeight: '700', color: 'var(--text-main)', paddingLeft: item.credit > 0 ? '20px' : '0' }}>
                                                {item.account}
                                              </div>
                                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px', paddingLeft: item.credit > 0 ? '20px' : '0' }}>
                                                (Narration: {item.narration})
                                              </div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: item.debit > 0 ? '800' : 'normal', color: item.debit > 0 ? '#059669' : 'var(--text-muted)' }}>
                                              {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: item.credit > 0 ? '800' : 'normal', color: item.credit > 0 ? '#e11d48' : 'var(--text-muted)' }}>
                                              {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                                            </td>
                                          </tr>
                                        ))}

                                        {/* FUND SUBTOTAL ROW */}
                                        <tr style={{ background: 'rgba(2, 132, 199, 0.06)', borderBottom: '2px solid var(--border-color)', fontWeight: '800' }}>
                                          <td colSpan="2" style={{ textAlign: 'right', color: '#0284c7', fontSize: '12.5px' }}>
                                            SUBTOTAL [{group.fundName}]:
                                          </td>
                                          <td style={{ textAlign: 'right', color: '#059669', fontSize: '13px', fontWeight: '800' }}>
                                            Tk. {formatCurrency(group.subtotalDebit)}
                                          </td>
                                          <td style={{ textAlign: 'right', color: '#e11d48', fontSize: '13px', fontWeight: '800' }}>
                                            Tk. {formatCurrency(group.subtotalCredit)}
                                          </td>
                                        </tr>
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    entries.map((item, idx) => (
                                      <tr key={idx}>
                                        <td><code style={{ color: '#0284c7', fontWeight: 'bold' }}>{item.code}</code></td>
                                        <td>
                                          <div style={{ fontWeight: '700', color: 'var(--text-main)', paddingLeft: item.credit > 0 ? '20px' : '0' }}>
                                            {item.account}
                                          </div>
                                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px', paddingLeft: item.credit > 0 ? '20px' : '0' }}>
                                            (Narration: {item.narration})
                                          </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: item.debit > 0 ? '800' : 'normal', color: item.debit > 0 ? '#059669' : 'var(--text-muted)' }}>
                                          {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: item.credit > 0 ? '800' : 'normal', color: item.credit > 0 ? '#e11d48' : 'var(--text-muted)' }}>
                                          {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                                <tfoot>
                                  <tr style={{ background: 'var(--table-th-bg)', borderTop: '2px solid var(--border-color)', fontSize: '14px' }}>
                                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>
                                      GRAND TOTAL VOUCHER AMOUNT:
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '900', color: '#059669', fontSize: '15px' }}>
                                      Tk. {formatCurrency(totalDebit)}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '900', color: '#e11d48', fontSize: '15px' }}>
                                      Tk. {formatCurrency(totalCredit)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* 2. SUB-LEDGER & ACTUAL SETTLEMENT EVENT BREAKDOWN */}
                        {jvTypeMode === 'actual' ? (
                          <>
                            {/* INDIVIDUAL FDR ACTUAL REALIZED SETTLEMENTS REGISTER */}
                            {actualSettlement.actualEvents && actualSettlement.actualEvents.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  2. Individual FDR Actual Realized Settlements Register ({actualSettlement.eventsCount} Events)
                                </h4>
                                <div className="data-table-container">
                                  <table className="data-table" id="auto-jv-actual-events">
                                    <thead>
                                      <tr>
                                        <th>FDR NO / EVENT</th>
                                        <th>DATE</th>
                                        <th>FUND CATEGORY</th>
                                        <th style={{ textAlign: 'right' }}>ACTUAL GROSS INTEREST</th>
                                        <th style={{ textAlign: 'right' }}>ACTUAL AIT TAX DEDUCTED</th>
                                        <th style={{ textAlign: 'right' }}>ACTUAL EXCISE DUTY</th>
                                        <th style={{ textAlign: 'right' }}>ACTUAL BANK CHARGE</th>
                                        <th style={{ textAlign: 'right' }}>ACTUAL NET PROFIT</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {actualSettlement.actualEvents.map((ev, idx) => (
                                        <tr key={idx}>
                                          <td>
                                            <strong>{ev.fdr_no}</strong>
                                            <span className={`badge ${ev.event_type === 'Encashment' ? 'badge-matured' : 'badge-renewed'}`} style={{ marginLeft: '8px', fontSize: '10px' }}>
                                              {ev.event_type}
                                            </span>
                                          </td>
                                          <td>{formatDate(ev.event_date)}</td>
                                          <td>
                                            <div style={{ fontWeight: '600', color: '#38bdf8' }}>{ev.acc_code || '—'}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ev.fund_name || 'General Fund'}</div>
                                          </td>
                                          <td style={{ textAlign: 'right', color: '#007acc', fontWeight: '600' }}>{formatCurrency(ev.gross_interest)}</td>
                                          <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(ev.tax_amount)}</td>
                                          <td style={{ textAlign: 'right', color: '#d97706' }}>{formatCurrency(ev.excise_duty)}</td>
                                          <td style={{ textAlign: 'right', color: '#64748b' }}>{formatCurrency(ev.bank_charge)}</td>
                                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '800' }}>{formatCurrency(ev.net_interest)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr style={{ background: 'var(--table-th-bg)', borderTop: '2px solid var(--border-color)', fontWeight: '800' }}>
                                        <td colSpan="3" style={{ textAlign: 'right' }}>TOTAL REALIZED SETTLEMENTS:</td>
                                        <td style={{ textAlign: 'right', color: '#007acc' }}>{formatCurrency(actualSettlement.totalGrossInterest)}</td>
                                        <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(actualSettlement.totalTax)}</td>
                                        <td style={{ textAlign: 'right', color: '#d97706' }}>{formatCurrency(actualSettlement.totalExciseDuty)}</td>
                                        <td style={{ textAlign: 'right', color: '#64748b' }}>{formatCurrency(actualSettlement.totalBankCharge)}</td>
                                        <td style={{ textAlign: 'right', color: '#10b981', fontSize: '14px' }}>{formatCurrency(actualSettlement.totalNetInterest)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* FUND-WISE ACTUAL SETTLEMENT SUB-LEDGER */}
                            {actualSettlement.actualFundBreakdown && actualSettlement.actualFundBreakdown.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  3. Fund-Wise Realized Settlement Summary Sub-Ledger
                                </h4>
                                <div className="data-table-container">
                                  <table className="data-table" id="auto-jv-actual-subledger">
                                    <thead>
                                      <tr>
                                        <th>FUND NAME</th>
                                        <th style={{ textAlign: 'center' }}>EVENTS COUNT</th>
                                        <th style={{ textAlign: 'right' }}>ACTUAL GROSS PROFIT</th>
                                        <th style={{ textAlign: 'right' }}>ACTUAL AIT TAX DEDUCTED</th>
                                        <th style={{ textAlign: 'right' }}>DUTY &amp; BANK FEES</th>
                                        <th style={{ textAlign: 'right' }}>NET BANK DEPOSIT (BDT)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {actualSettlement.actualFundBreakdown.map((fb, idx) => (
                                        <tr key={idx}>
                                          <td><strong>{fb.fund_name}</strong></td>
                                          <td style={{ textAlign: 'center' }}><span className="badge badge-info">{fb.event_count} Events</span></td>
                                          <td style={{ textAlign: 'right', color: '#007acc' }}>{formatCurrency(fb.gross_interest)}</td>
                                          <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(fb.tax)}</td>
                                          <td style={{ textAlign: 'right', color: '#d97706' }}>{formatCurrency((fb.excise_duty || 0) + (fb.bank_charge || 0))}</td>
                                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(fb.net_interest)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          /* PROVISIONAL FUND-WISE MOVEMENT & ACCRUAL SUB-LEDGER */
                          monthlyData.fundBreakdown && monthlyData.fundBreakdown.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                2. Fund-Wise Sub-Ledger Breakdown & Profit Accrual
                              </h4>
                              <div className="data-table-container">
                                <table className="data-table" id="auto-jv-subledger">
                                  <thead>
                                    <tr>
                                      <th>FUND NAME</th>
                                      <th style={{ textAlign: 'center' }}>FDR COUNT</th>
                                      <th style={{ textAlign: 'right' }}>CLOSING PRINCIPAL (BDT)</th>
                                      <th style={{ textAlign: 'right' }}>MONTH GROSS PROFIT (BDT)</th>
                                      <th style={{ textAlign: 'right' }}>AIT TAX PROVISION (BDT)</th>
                                      <th style={{ textAlign: 'right' }}>NET MONTH PROFIT (BDT)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monthlyData.fundBreakdown.map((fb, idx) => (
                                      <tr key={idx}>
                                        <td><strong>{fb.fund_name}</strong></td>
                                        <td style={{ textAlign: 'center' }}><span className="badge badge-info">{fb.fdr_count} FDRs</span></td>
                                        <td style={{ textAlign: 'right' }}><strong>{formatCurrency(fb.total_principal)}</strong></td>
                                        <td style={{ textAlign: 'right', color: '#0284c7' }}>{formatCurrency(fb.total_gross_interest)}</td>
                                        <td style={{ textAlign: 'right', color: '#dc2626' }}>{formatCurrency(fb.total_tax)}</td>
                                        <td style={{ textAlign: 'right', color: '#059669', fontWeight: 'bold' }}>{formatCurrency(fb.total_net_interest)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )
                        )}

                        {/* OFFICIAL SIGNATURE BOXES */}
                        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', textAlign: 'center' }}>
                          <div>
                            <div style={{ height: '40px' }}></div>
                            <div style={{ borderTop: '1px solid var(--text-main)', paddingTop: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                              Prepared By
                            </div>
                          </div>
                          <div>
                            <div style={{ height: '40px' }}></div>
                            <div style={{ borderTop: '1px solid var(--text-main)', paddingTop: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                              Checked By
                            </div>
                          </div>
                          <div>
                            <div style={{ height: '40px' }}></div>
                            <div style={{ borderTop: '1px solid var(--text-main)', paddingTop: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                              Approved By
                            </div>
                          </div>
                        </div>

                      </div>
                    </>
                  )}

                  {/* VIEW 2: MANUAL JOURNAL ENTRY FORM */}
                  {jvSubSection === 'manual-jv' && (() => {
                    const totalDr = (manualJvForm.items || []).reduce((s, it) => s + (parseFloat(it.debit) || 0), 0);
                    const totalCr = (manualJvForm.items || []).reduce((s, it) => s + (parseFloat(it.credit) || 0), 0);
                    const diff = Math.abs(totalDr - totalCr);
                    const isBalanced = diff < 0.05 && totalDr > 0;

                    return (
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Plus size={20} /> Post Manual Journal Voucher (General Ledger)
                            </h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                              Record manual adjustments, fund transfers, or statutory corrections adhering to PBS Uniform Chart of Accounts.
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isBalanced ? (
                              <span className="badge badge-success" style={{ fontSize: '12px', padding: '6px 12px' }}>
                                Balanced (Debits = Credits: Tk. {formatCurrency(totalDr)})
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ fontSize: '12px', padding: '6px 12px' }}>
                                Out of Balance (Diff: Tk. {formatCurrency(diff)})
                              </span>
                            )}
                          </div>
                        </div>

                        <form onSubmit={handlePostManualJV}>
                          {/* VOUCHER META FIELDS */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', background: 'var(--table-th-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                Voucher No (Optional)
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Auto-generated if left blank"
                                value={manualJvForm.voucher_no}
                                onChange={(e) => setManualJvForm({ ...manualJvForm, voucher_no: e.target.value })}
                                style={{ fontSize: '12.5px' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                Voucher Date <span style={{ color: '#ef4444' }}>*</span>
                              </label>
                              <input
                                type="date"
                                required
                                className="form-input"
                                value={manualJvForm.voucher_date}
                                onChange={(e) => setManualJvForm({ ...manualJvForm, voucher_date: e.target.value })}
                                style={{ fontSize: '12.5px' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                Voucher Type
                              </label>
                              <select
                                className="form-input"
                                value={manualJvForm.voucher_type}
                                onChange={(e) => setManualJvForm({ ...manualJvForm, voucher_type: e.target.value })}
                                style={{ fontSize: '12.5px' }}
                              >
                                <option value="Manual General JV">Manual General JV</option>
                                <option value="Fund Adjustment JV">Fund Adjustment JV</option>
                                <option value="Statutory Tax JV">Statutory Tax JV</option>
                                <option value="Bank Revaluation JV">Bank Revaluation JV</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                Accounting Month & Year
                              </label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                  className="form-input"
                                  value={manualJvForm.period_month}
                                  onChange={(e) => setManualJvForm({ ...manualJvForm, period_month: e.target.value })}
                                  style={{ fontSize: '12.5px', flex: 1 }}
                                >
                                  {[...Array(12)].map((_, mIdx) => (
                                    <option key={mIdx + 1} value={mIdx + 1}>
                                      {new Date(2000, mIdx, 1).toLocaleString('default', { month: 'short' })}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={manualJvForm.period_year}
                                  onChange={(e) => setManualJvForm({ ...manualJvForm, period_year: e.target.value })}
                                  style={{ width: '85px', fontSize: '12.5px' }}
                                />
                              </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                Voucher Narration / Remarks <span style={{ color: '#ef4444' }}>*</span>
                              </label>
                              <input
                                type="text"
                                required
                                className="form-input"
                                placeholder="Enter detailed narration explaining the nature and purpose of this journal entry..."
                                value={manualJvForm.narration}
                                onChange={(e) => setManualJvForm({ ...manualJvForm, narration: e.target.value })}
                                style={{ fontSize: '13px' }}
                              />
                            </div>
                          </div>

                          {/* LINE ITEMS TABLE */}
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Debit &amp; Credit Line Items ({manualJvForm.items.length} Lines)
                              </h4>
                              <button
                                type="button"
                                onClick={handleAddManualRow}
                                className="btn btn-secondary"
                                style={{ fontSize: '12px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Plus size={14} /> Add Line Item
                              </button>
                            </div>

                            <div className="data-table-container">
                              <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                  <tr>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th style={{ width: '35%' }}>CHART OF ACCOUNTS ACCOUNT</th>
                                    <th style={{ width: '18%' }}>FUND NAME</th>
                                    <th>PARTICULARS / REF</th>
                                    <th style={{ width: '140px', textAlign: 'right' }}>DEBIT (BDT)</th>
                                    <th style={{ width: '140px', textAlign: 'right' }}>CREDIT (BDT)</th>
                                    <th style={{ width: '40px' }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {manualJvForm.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                        {idx + 1}
                                      </td>
                                      <td>
                                        <select
                                          className="form-input"
                                          required
                                          value={item.account_code}
                                          onChange={(e) => handleManualRowChange(idx, 'account_code', e.target.value)}
                                          style={{ fontSize: '12px', padding: '6px 8px', width: '100%' }}
                                        >
                                          <option value="">-- Select Chart of Account --</option>
                                          {coaList.map(c => (
                                            <option key={c.account_code} value={c.account_code}>
                                              {c.account_code} — {c.account_name} ({c.account_type})
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-input"
                                          placeholder="General or Fund Name"
                                          value={item.fund_name}
                                          onChange={(e) => handleManualRowChange(idx, 'fund_name', e.target.value)}
                                          style={{ fontSize: '12px', padding: '6px 8px' }}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-input"
                                          placeholder="Line description..."
                                          value={item.description}
                                          onChange={(e) => handleManualRowChange(idx, 'description', e.target.value)}
                                          style={{ fontSize: '12px', padding: '6px 8px' }}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          step="any"
                                          min="0"
                                          className="form-input"
                                          placeholder="0.00"
                                          value={item.debit}
                                          onChange={(e) => handleManualRowChange(idx, 'debit', e.target.value)}
                                          style={{ fontSize: '12.5px', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          step="any"
                                          min="0"
                                          className="form-input"
                                          placeholder="0.00"
                                          value={item.credit}
                                          onChange={(e) => handleManualRowChange(idx, 'credit', e.target.value)}
                                          style={{ fontSize: '12.5px', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#e11d48' }}
                                        />
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveManualRow(idx)}
                                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                          title="Remove row"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr style={{ background: 'var(--table-th-bg)', borderTop: '2px solid var(--border-color)', fontWeight: '800' }}>
                                    <td colSpan="4" style={{ textAlign: 'right', fontSize: '13px' }}>TOTAL VOUCHER AMOUNT:</td>
                                    <td style={{ textAlign: 'right', color: '#059669', fontSize: '14px', fontWeight: '900' }}>
                                      Tk. {formatCurrency(totalDr)}
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#e11d48', fontSize: '14px', fontWeight: '900' }}>
                                      Tk. {formatCurrency(totalCr)}
                                    </td>
                                    <td></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>

                          {/* FOOTER ACTIONS & SUBMIT */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Vouchers posted to the General Ledger automatically update the <strong>Trial Balance</strong>, <strong>Income Statement</strong>, and <strong>Balance Sheet</strong>.
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setJvSubSection('auto-jv')}
                                className="btn btn-secondary"
                                style={{ fontSize: '12.5px', padding: '8px 16px' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={postingJv || !isBalanced}
                                className="btn btn-primary"
                                style={{
                                  fontSize: '13px',
                                  padding: '8px 22px',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  border: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  boxShadow: isBalanced ? '0 2px 10px rgba(16,185,129,0.3)' : 'none',
                                  cursor: isBalanced ? 'pointer' : 'not-allowed',
                                  opacity: isBalanced ? 1 : 0.6
                                }}
                              >
                                <Send size={15} />
                                {postingJv ? 'Posting to GL...' : 'Post Journal Voucher to GL'}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    );
                  })()}

                  {/* VIEW 3: JOURNAL VOUCHER BOOK (REGISTER) */}
                  {jvSubSection === 'jv-register' && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#7c3aed', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={20} /> General Ledger Journal Voucher Book &amp; Register
                          </h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Chronological master register of all automated and manual journal vouchers posted into the General Ledger.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={loadJournalVouchers}
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <RefreshCcw size={13} /> Refresh Register
                          </button>
                          <button
                            type="button"
                            onClick={() => setJvSubSection('manual-jv')}
                            className="btn btn-primary"
                            style={{ fontSize: '12px', padding: '6px 14px', background: '#10b981', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Plus size={14} /> Post New JV
                          </button>
                        </div>
                      </div>

                      {jvListLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Loading Journal Voucher Book...
                        </div>
                      ) : journalVouchersList.length === 0 ? (
                        <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--table-th-bg)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                          <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                            No Journal Vouchers Posted Yet
                          </h4>
                          <p style={{ fontSize: '13px', maxWidth: '480px', margin: '0 auto 16px auto', color: 'var(--text-muted)' }}>
                            To generate your Actual Financial Statements, post the Automated Monthly Settlement JV or enter a manual journal entry.
                          </p>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setJvSubSection('auto-jv')}
                              className="btn btn-primary"
                              style={{ fontSize: '12.5px', padding: '7px 16px' }}
                            >
                              Go to Auto JV &amp; Post
                            </button>
                            <button
                              type="button"
                              onClick={() => setJvSubSection('manual-jv')}
                              className="btn btn-secondary"
                              style={{ fontSize: '12.5px', padding: '7px 16px' }}
                            >
                              Enter Manual JV
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="data-table-container">
                          <table className="data-table" id="journal-voucher-book-table">
                            <thead>
                              <tr>
                                <th>VOUCHER NO</th>
                                <th>VOUCHER DATE</th>
                                <th>PERIOD</th>
                                <th>VOUCHER TYPE</th>
                                <th>NARRATION / PURPOSE</th>
                                <th style={{ textAlign: 'right' }}>TOTAL DEBIT (BDT)</th>
                                <th style={{ textAlign: 'right' }}>TOTAL CREDIT (BDT)</th>
                                <th>POSTED BY</th>
                                <th style={{ textAlign: 'center' }}>STATUS</th>
                                <th style={{ textAlign: 'center' }}>ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {journalVouchersList.map((v) => (
                                <tr key={v.id}>
                                  <td>
                                    <code style={{ fontWeight: '800', color: '#0284c7', background: 'rgba(2, 132, 199, 0.08)', padding: '3px 6px', borderRadius: '4px' }}>
                                      {v.voucher_no}
                                    </code>
                                  </td>
                                  <td>{formatDate(v.voucher_date)}</td>
                                  <td>
                                    <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                      {v.period_month ? `${new Date(2000, v.period_month - 1, 1).toLocaleString('default', { month: 'short' })} ${v.period_year}` : '—'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${v.voucher_type?.includes('Actual') ? 'badge-success' : (v.voucher_type?.includes('Manual') ? 'badge-info' : 'badge-warning')}`} style={{ fontSize: '11px' }}>
                                      {v.voucher_type}
                                    </span>
                                  </td>
                                  <td style={{ maxWidth: '280px', fontSize: '12px' }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.narration}>
                                      {v.narration || '—'}
                                    </div>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                                    {formatCurrency(v.total_debit)}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: '800', color: '#e11d48' }}>
                                    {formatCurrency(v.total_credit)}
                                  </td>
                                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {v.posted_by || 'System'}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className="badge badge-success" style={{ fontSize: '10px' }}>
                                      Posted
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                      <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        onClick={async () => {
                                          try {
                                            const fullVoucher = await api.getJournalVoucher(v.id);
                                            setSelectedVoucherDetail(fullVoucher);
                                          } catch (err) {
                                            showToast(err.message, 'error');
                                          }
                                        }}
                                        title="View Voucher Details & Print"
                                      >
                                        <Eye size={13} /> View
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-danger"
                                        style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                                        onClick={() => handleDeleteVoucher(v.id, v.voucher_no)}
                                        title="Delete Voucher & Reverse GL"
                                      >
                                        <Trash2 size={13} /> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: 'var(--table-th-bg)', borderTop: '2px solid var(--border-color)', fontWeight: '800' }}>
                                <td colSpan="5" style={{ textAlign: 'right' }}>TOTAL REGISTER TURNOVER:</td>
                                <td style={{ textAlign: 'right', color: '#059669', fontSize: '13.5px' }}>
                                  Tk. {formatCurrency(journalVouchersList.reduce((s, v) => s + (v.total_debit || 0), 0))}
                                </td>
                                <td style={{ textAlign: 'right', color: '#e11d48', fontSize: '13.5px' }}>
                                  Tk. {formatCurrency(journalVouchersList.reduce((s, v) => s + (v.total_credit || 0), 0))}
                                </td>
                                <td colSpan="3"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODAL: VIEW JOURNAL VOUCHER DETAIL */}
                  {selectedVoucherDetail && (
                    <Modal
                      isOpen={!!selectedVoucherDetail}
                      onClose={() => setSelectedVoucherDetail(null)}
                      title={`Official Journal Voucher: ${selectedVoucherDetail.voucher_no}`}
                      maxWidth="850px"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="printable-area" style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>PALLI BIDYUT SAMITI (PBS)</h3>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7', marginTop: '2px' }}>
                              JOURNAL VOUCHER (JV)
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              General Ledger Accounting Voucher Record
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px', fontSize: '12px' }}>
                            <div>
                              <div><strong>Voucher No:</strong> <code style={{ color: '#0284c7', fontWeight: 'bold' }}>{selectedVoucherDetail.voucher_no}</code></div>
                              <div><strong>Voucher Date:</strong> {formatDate(selectedVoucherDetail.voucher_date)}</div>
                              <div><strong>Voucher Type:</strong> {selectedVoucherDetail.voucher_type}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div><strong>Period:</strong> {selectedVoucherDetail.period_month ? `${new Date(2000, selectedVoucherDetail.period_month - 1, 1).toLocaleString('default', { month: 'short' })} ${selectedVoucherDetail.period_year}` : '—'}</div>
                              <div><strong>Posted By:</strong> {selectedVoucherDetail.posted_by || 'AGM (Finance)'}</div>
                              <div><strong>Status:</strong> <span className="badge badge-success" style={{ fontSize: '10px' }}>Posted in GL</span></div>
                            </div>
                          </div>

                          {selectedVoucherDetail.narration && (
                            <div style={{ background: 'var(--table-th-bg)', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', borderLeft: '3px solid #0284c7' }}>
                              <strong>Narration:</strong> {selectedVoucherDetail.narration}
                            </div>
                          )}

                          <div className="data-table-container" style={{ marginBottom: '24px' }}>
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>ACCOUNT CODE</th>
                                  <th>ACCOUNT TITLE &amp; DESCRIPTION</th>
                                  <th>FUND NAME</th>
                                  <th style={{ textAlign: 'right' }}>DEBIT (BDT)</th>
                                  <th style={{ textAlign: 'right' }}>CREDIT (BDT)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(selectedVoucherDetail.items || []).map((it, idx) => (
                                  <tr key={idx}>
                                    <td><code style={{ fontWeight: 'bold', color: '#0284c7' }}>{it.account_code}</code></td>
                                    <td>
                                      <div style={{ fontWeight: '700', paddingLeft: it.credit > 0 ? '16px' : '0' }}>{it.account_name}</div>
                                      {it.description && (
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: it.credit > 0 ? '16px' : '0' }}>
                                          {it.description}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#38bdf8' }}>{it.fund_name || 'General'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: it.debit > 0 ? '800' : 'normal', color: it.debit > 0 ? '#059669' : 'var(--text-muted)' }}>
                                      {it.debit > 0 ? formatCurrency(it.debit) : '-'}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: it.credit > 0 ? '800' : 'normal', color: it.credit > 0 ? '#e11d48' : 'var(--text-muted)' }}>
                                      {it.credit > 0 ? formatCurrency(it.credit) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: 'var(--table-th-bg)', borderTop: '2px solid var(--border-color)', fontWeight: '900' }}>
                                  <td colSpan="3" style={{ textAlign: 'right' }}>VOUCHER TOTAL:</td>
                                  <td style={{ textAlign: 'right', color: '#059669', fontSize: '13.5px' }}>
                                    Tk. {formatCurrency(selectedVoucherDetail.total_debit)}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#e11d48', fontSize: '13.5px' }}>
                                    Tk. {formatCurrency(selectedVoucherDetail.total_credit)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* SIGNATURE BOXES */}
                          <div style={{ marginTop: '30px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
                            <div>
                              <div style={{ height: '35px' }}></div>
                              <div style={{ borderTop: '1px solid var(--text-main)', paddingTop: '4px', fontSize: '11px', fontWeight: '700' }}>Prepared By</div>
                            </div>
                            <div>
                              <div style={{ height: '35px' }}></div>
                              <div style={{ borderTop: '1px solid var(--text-main)', paddingTop: '4px', fontSize: '11px', fontWeight: '700' }}>Checked By</div>
                            </div>
                            <div>
                              <div style={{ height: '35px' }}></div>
                              <div style={{ borderTop: '1px solid var(--text-main)', paddingTop: '4px', fontSize: '11px', fontWeight: '700' }}>Approved By</div>
                            </div>
                          </div>
                        </div>

                        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedVoucherDetail(null)}
                            className="btn btn-secondary"
                            style={{ fontSize: '12.5px', padding: '6px 14px' }}
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="btn btn-primary"
                            style={{ fontSize: '12.5px', padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Printer size={14} /> Print Voucher
                          </button>
                        </div>
                      </div>
                    </Modal>
                  )}

                </div>
                  );
                })()}
              </div>
            )}

            {/* REPORT 3: MATURITY SCHEDULE */}
            {activeReportTab === 'maturity' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#fbbf24' }}>
                  Investment Maturity Schedule Report
                </h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Maturity Date</th>
                        <th>FDR Certificate No</th>
                        <th>Bank & Branch</th>
                        <th>Principal Amount</th>
                        <th>Rate</th>
                        <th>Expected Net Proceeds</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayMaturityInvestments.map(inv => (
                          <tr key={inv.id}>
                            <td><strong style={{ color: '#fbbf24' }}>{formatDate(inv.maturity_date)}</strong></td>
                            <td>{inv.fdr_no}</td>
                            <td>{inv.bank_name} ({inv.bank_branch})</td>
                            <td>{formatCurrency(inv.principal_amount)}</td>
                            <td>{inv.interest_rate}%</td>
                            <td><strong style={{ color: '#34d399' }}>{formatCurrency(inv.principal_amount + (inv.estimated_net_interest || 0))}</strong></td>
                            <td><span className={`badge badge-${(inv.status || 'Active').toLowerCase()}`}>{inv.status || 'Active'}</span></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 4: BANK CONCENTRATION */}
            {activeReportTab === 'bank-exposure' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#c084fc' }}>
                  Bank-Wise Concentration & Risk Exposure Report
                </h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bank Institution</th>
                        <th>Active Certificates</th>
                        <th>Total Invested Principal</th>
                        <th>Portfolio Share (%)</th>
                        <th>Total Accrued Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(bankWiseMap).map(bName => {
                        const info = bankWiseMap[bName];
                        const share = ((info.totalAmount / totalPrincipal) * 100).toFixed(2);
                        return (
                          <tr key={bName}>
                            <td><strong style={{ color: 'var(--text-main)' }}>{bName}</strong></td>
                            <td>{info.count} FDRs</td>
                            <td><strong style={{ color: '#10b981' }}>{formatCurrency(info.totalAmount)}</strong></td>
                            <td><span style={{ color: 'var(--primary)', fontWeight: '700' }}>{share}%</span></td>
                            <td>{formatCurrency(info.totalAccrued)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 5: FUND-WISE CONCENTRATION REPORT */}
            {activeReportTab === 'fund-wise' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: 'var(--primary)' }}>
                  PBS Fund Categories & Account Code Concentration Report
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Snapshot As Of: {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
                
                <div className="data-table-container" style={{ marginBottom: '24px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Account Code</th>
                        <th>Fund Name (Bengali / English)</th>
                        <th>Active FDRs</th>
                        <th>Total Invested Principal</th>
                        <th>Portfolio Share (%)</th>
                        <th>Total Accrued Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundWiseData.map(f => {
                        const share = totalPrincipal > 0 ? ((f.total_principal / totalPrincipal) * 100).toFixed(2) : '0.00';
                        return (
                          <tr key={f.id || f.acc_code}>
                            <td><strong style={{ color: 'var(--primary)' }}>{f.acc_code}</strong></td>
                            <td><strong style={{ color: 'var(--text-main)' }}>{f.fund_name}</strong></td>
                            <td>{f.count} FDRs</td>
                            <td><strong style={{ color: '#10b981' }}>{formatCurrency(f.total_principal)}</strong></td>
                            <td><span style={{ color: 'var(--primary)', fontWeight: '700' }}>{share}%</span></td>
                            <td>{formatCurrency(f.total_accrued)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>
                  Detailed Investment Breakdown by Fund Category
                </h4>
                {fundWiseData.filter(f => f.investments && f.investments.length > 0).map(f => (
                  <div key={`breakdown-${f.acc_code}`} style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: '800', color: '#38bdf8', marginBottom: '8px' }}>
                      Fund: {f.acc_code} - {f.fund_name} ({formatCurrency(f.total_principal)})
                    </div>
                    <table className="data-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>FDR No</th>
                          <th>Bank & Branch</th>
                          <th>Principal Amount</th>
                          <th>Interest Rate</th>
                          <th>Issue Date</th>
                          <th>Maturity Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {f.investments.map(inv => (
                          <tr key={inv.id}>
                            <td><strong>{inv.fdr_no}</strong></td>
                            <td>{inv.bank_name}</td>
                            <td>{formatCurrency(inv.principal_amount)}</td>
                            <td>{inv.interest_rate}%</td>
                            <td>{formatDate(inv.issue_date)}</td>
                            <td>{formatDate(inv.maturity_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* REPORT: BANK SECTOR & FUND CLASSIFICATION MATRIX */}
            {activeReportTab === 'sector-matrix' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: 'var(--primary)' }}>
                  Bank Sector (Government vs Private) & Fund Classification Matrix Report
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Cross-classified breakdown of FDR & Savings Certificate investments by Bank Type and PBS Account Codes (CPF, Gratuity, Benevolent, etc.)
                </p>

                {/* SECTOR SUMMARY CARDS */}
                <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Government Banks Sector</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                      {formatCurrency(sectorMatrixData.sectors['Government Bank']?.total_principal || 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', fontWeight: '600' }}>
                      {totalPrincipal > 0 ? (((sectorMatrixData.sectors['Government Bank']?.total_principal || 0) / totalPrincipal) * 100).toFixed(2) : 0}% of Total Portfolio
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Private Commercial Banks Sector</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
                      {formatCurrency(sectorMatrixData.sectors['Private Bank']?.total_principal || 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', fontWeight: '600' }}>
                      {totalPrincipal > 0 ? (((sectorMatrixData.sectors['Private Bank']?.total_principal || 0) / totalPrincipal) * 100).toFixed(2) : 0}% of Total Portfolio
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #0284c7' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>CPF / Provident Fund (129.25.100)</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                      {formatCurrency(fundWiseData.find(f => f.acc_code === '129.25.100')?.total_principal || 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Employee CPF Account</div>
                  </div>

                  <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Gratuity Fund (129.35.000)</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#8b5cf6', marginTop: '4px' }}>
                      {formatCurrency(fundWiseData.find(f => f.acc_code === '129.35.000')?.total_principal || 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Gratuity Reserve Account</div>
                  </div>
                </div>

                {/* CLASSIFICATION MATRIX GRID TABLE */}
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bank Name & Sector</th>
                        <th>CPF / Provident (129.25.100)</th>
                        <th>Gratuity (129.35.000)</th>
                        <th>Benevolent (129.60.101)</th>
                        <th>Security (129.40.000)</th>
                        <th>Other Funds</th>
                        <th>Total Invested Principal</th>
                        <th>Accrued Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectorMatrixData.matrixRows.map(row => {
                        const cpfAmt = row.fundTotals['129.25.100'] || 0;
                        const gratuityAmt = row.fundTotals['129.35.000'] || 0;
                        const benevolentAmt = row.fundTotals['129.60.101'] || 0;
                        const securityAmt = row.fundTotals['129.40.000'] || 0;
                        
                        // sum of other codes
                        const knownCodes = ['129.25.100', '129.35.000', '129.60.101', '129.40.000'];
                        const otherAmt = Object.keys(row.fundTotals)
                          .filter(c => !knownCodes.includes(c))
                          .reduce((sum, c) => sum + row.fundTotals[c], 0);

                        return (
                          <tr key={row.bank_name}>
                            <td>
                              <strong style={{ color: 'var(--text-main)' }}>{row.bank_name}</strong>
                              <div style={{ fontSize: '11px', color: row.bank_type === 'Private Bank' ? '#d97706' : '#10b981', fontWeight: '600' }}>
                                • {row.bank_type}
                              </div>
                            </td>
                            <td>{cpfAmt > 0 ? formatCurrency(cpfAmt) : '—'}</td>
                            <td>{gratuityAmt > 0 ? formatCurrency(gratuityAmt) : '—'}</td>
                            <td>{benevolentAmt > 0 ? formatCurrency(benevolentAmt) : '—'}</td>
                            <td>{securityAmt > 0 ? formatCurrency(securityAmt) : '—'}</td>
                            <td>{otherAmt > 0 ? formatCurrency(otherAmt) : '—'}</td>
                            <td><strong style={{ color: '#10b981' }}>{formatCurrency(row.total_principal)}</strong></td>
                            <td><strong style={{ color: 'var(--primary)' }}>{formatCurrency(row.total_accrued)}</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT: SAP / CRYSTAL REPORTS ENTERPRISE FORMAT */}
            {activeReportTab === 'sap-crystal' && !showSapReport && (
              <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '550px', margin: '40px auto', border: '1px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ background: '#f0f9ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <FileText size={40} style={{ color: '#0ea5e9' }} />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Advanced Report Engine</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Configure parameters to generate dynamic enterprise reports</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report Module / View</label>
                    <select 
                      className="form-select" 
                      value={sapReportConfig.reportType} 
                      onChange={e => setSapReportConfig({...sapReportConfig, reportType: e.target.value})}
                      style={{ border: '2px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '15px', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <option value="master-register">FDR & Savings Certificate Master Register</option>
                      <option value="monthly">Monthly Investment & Profit Statement</option>
                      <option value="fund-wise">Fund-Wise Concentration Report</option>
                      <option value="period-comparison">Periodical Balance & Movement</option>
                      <option value="maturity">Investment Maturity Schedule</option>
                      <option value="bank-exposure">Bank-Wise Exposure Matrix</option>
                      <option value="sector-matrix">Sector/Fund Investment Matrix</option>
                      <option value="provisions">Interest & Tax Provision Ledger</option>
                      <option value="financial-history">Financial History Register</option>
                      <option value="renewed-fdr">Renewed FDR Statement</option>
                      <option value="encashed-fdr">Encashed FDR Statement</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Run Date (As of Date)</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={sapReportConfig.asOfDate} 
                      onChange={e => setSapReportConfig({...sapReportConfig, asOfDate: e.target.value})}
                      style={{ border: '2px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '15px', padding: '12px', borderRadius: '8px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fund Category Filter</label>
                    <select 
                      className="form-select" 
                      value={sapReportConfig.fundCategory} 
                      onChange={e => setSapReportConfig({...sapReportConfig, fundCategory: e.target.value})}
                      style={{ border: '2px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '15px', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <option value="ALL">All Active Funds & Categories</option>
                      {(Array.isArray(fundWiseData) ? fundWiseData : []).map(f => (
                        <option key={f.fund_name || f.acc_code} value={f.fund_name}>{f.acc_code} - {f.fund_name}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => setShowSapReport(true)} 
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '16px', fontWeight: 'bold', background: '#0ea5e9', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}
                  >
                    Generate & View Report
                  </button>
                </div>
              </div>
            )}

            {activeReportTab === 'sap-crystal' && showSapReport && (
              <div style={{ background: '#d4d4d4', display: 'flex', flexDirection: 'column', height: '85vh', borderRadius: '4px', border: '1px solid #737373', overflow: 'hidden' }}>
                
                {/* MODERNIZED VIEWER TOOLBAR */}
                <div className="no-print" style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => setShowSapReport(false)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px' }}>
                      <XCircle size={16} /> Exit Viewer
                    </button>
                    <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>Advanced Report Engine</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{sapReportConfig.reportType.replaceAll('-', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => triggerPrint('landscape')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6' }}>
                      <Printer size={16} /> Print Report
                    </button>
                    <button onClick={handleExportExcel} className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981' }}>
                      <FileSpreadsheet size={16} /> Export Excel
                    </button>
                  </div>
                </div>

                {/* VIEWER BODY (No confusing sidebars, just the report) */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                  {/* REPORT PAGE CONTAINER */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
                    
                    {/* A4 PAPER PAGE */}
                    <div className="printable-area" style={{ background: '#ffffff', color: '#0f172a', padding: '40px', width: '100%', maxWidth: '1123px', minHeight: '794px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', fontFamily: "'OfficialDocFont', 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif" }}>
                
                {/* SAP SYSTEM HEADER BLOCK */}
                <div style={{ border: '2px solid #0f172a', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #94a3b8', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold' }}>SYSTEM: SAP ERP / PBS FUND MANAGEMENT</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a' }}>{settings.org_name || 'DHAKA PALLI BIDYUT SAMITY-1'}</div>
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 'bold' }}>FINANCE & ACCOUNTS DIRECTORATE — INVESTMENT RECONCILIATION</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#334155' }}>
                      <div><strong>REPORT ID:</strong> Z_PBS_FIN_FDR_RECON_REPORT_V2</div>
                      <div><strong>RUN DATE:</strong> {new Date().toISOString().split('T')[0]}</div>
                      <div><strong>RUN TIME:</strong> {new Date().toTimeString().split(' ')[0]}</div>
                      <div><strong>CURRENCY:</strong> BDT (Taka)</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '11px', background: '#f8fafc', padding: '10px', border: '1px solid #cbd5e1' }}>
                    <div><strong>COMPANY CODE:</strong> PBS-01</div>
                    <div><strong>FISCAL YEAR:</strong> 2025-2026</div>
                    <div><strong>SELECTION:</strong> ALL ACTIVE FDRs</div>
                    <div><strong>USER:</strong> {settings.signatory_accountant || 'SYSTEM_ADMIN'}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '800', textAlign: 'center', margin: '0 0 16px 0', textDecoration: 'underline' }}>
                  {sapReportConfig.reportType === 'master-register' ? 'CRYSTAL REPORT: FDR & SAVINGS CERTIFICATE MASTER REGISTER' :
                   sapReportConfig.reportType === 'renewed-fdr' ? 'CRYSTAL REPORT: RENEWED FDR STATEMENT & SETTLEMENT' :
                   sapReportConfig.reportType === 'encashed-fdr' ? 'CRYSTAL REPORT: ENCASHED FDR STATEMENT & SETTLEMENT' :
                   'SYSTEM REPORT'}
                </h3>

                {/* CRYSTAL REPORT TABULAR DATA GRID */}
                {sapReportConfig.reportType === 'master-register' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#0f172a', marginBottom: '24px' }}>
                    <thead>
                      <tr style={{ background: '#e2e8f0', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>ACC CODE</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FUND CATEGORY</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FDR / CERT NO</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>BANK INSTITUTION</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>PRINCIPAL (BDT)</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>RATE</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>ISSUE DATE</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>MATURITY</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>ACCRUED INTEREST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredSapInvestments = displayInvestments.filter(inv => sapReportConfig.fundCategory === 'ALL' || inv.fund_name === sapReportConfig.fundCategory);
                        const filteredPrincipal = filteredSapInvestments.reduce((sum, inv) => sum + (inv.principal_amount || 0), 0);
                        const filteredAccrued = filteredSapInvestments.reduce((sum, inv) => sum + (inv.accrued_gross_interest || 0), 0);

                        return (
                          <>
                            {filteredSapInvestments.map(inv => (
                              <tr key={`sap-${inv.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 8px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{inv.acc_code || '136'}</td>
                                <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.fund_name || 'General Fund'}</td>
                                <td style={{ padding: '6px 8px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{inv.fdr_no}</td>
                                <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.bank_name}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(inv.principal_amount)}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{inv.interest_rate}%</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <div>{formatDate(inv.issue_date)}</div>
                                  {inv.first_issue_date && inv.first_issue_date !== inv.issue_date && new Date(inv.first_issue_date) < new Date(inv.issue_date) && (
                                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 'bold' }}>
                                      Orig: {formatDate(inv.first_issue_date)}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{formatDate(inv.maturity_date)}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(inv.accrued_gross_interest)}</td>
                              </tr>
                            ))}
                            <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '3px double #0f172a', background: '#f1f5f9', fontWeight: '800' }}>
                              <td colSpan="4" style={{ padding: '10px 8px', textAlign: 'right' }}>GRAND TOTAL PORTFOLIO:</td>
                              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0f172a', fontSize: '13px' }}>{formatCurrency(filteredPrincipal)}</td>
                              <td colSpan="3"></td>
                              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0f172a', fontSize: '13px' }}>{formatCurrency(filteredAccrued)}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                )}

                {sapReportConfig.reportType === 'renewed-fdr' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#0f172a', marginBottom: '24px' }}>
                    <thead>
                      <tr style={{ background: '#e2e8f0', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                        <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FDR NO</th>
                        <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FUND CATEGORY</th>
                        <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>BANK</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>PRINCIPAL</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>GROSS INT</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>AIT TAX</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>EXCISE</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>NET PROFIT</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>DEPOSIT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = renewedInvestments.filter(inv => sapReportConfig.fundCategory === 'ALL' || inv.fund_name === sapReportConfig.fundCategory);
                        let sumP = 0, sumG = 0, sumT = 0, sumE = 0, sumN = 0, sumD = 0;
                        
                        const rows = filtered.map(inv => {
                          const gross = inv.actual_gross_interest || inv.accrued_gross_interest || 0;
                          const tax = inv.actual_tax || inv.estimated_tax || 0;
                          const duty = inv.actual_excise_duty || inv.estimated_excise_duty || 0;
                          const charge = inv.actual_bank_charge || 0;
                          const net = inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' 
                            ? inv.actual_net_interest 
                            : (gross - tax - duty - charge);
                          const deposit = inv.encash_received || (inv.principal_amount + net);
                          
                          sumP += inv.principal_amount || 0;
                          sumG += gross;
                          sumT += tax;
                          sumE += duty;
                          sumN += net;
                          sumD += deposit;

                          return (
                            <tr key={`sap-${inv.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{inv.fdr_no}</td>
                              <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{inv.fund_name}</td>
                              <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{inv.bank_name}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(inv.principal_amount)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(gross)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(tax)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(duty)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(net)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(deposit)}</td>
                            </tr>
                          );
                        });

                        return (
                          <>
                            {rows}
                            <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '3px double #0f172a', background: '#f1f5f9', fontWeight: '800' }}>
                              <td colSpan="3" style={{ padding: '8px 6px', textAlign: 'right' }}>GRAND TOTAL:</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumP)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumG)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumT)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumE)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumN)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumD)}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                )}

                {sapReportConfig.reportType === 'encashed-fdr' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#0f172a', marginBottom: '24px' }}>
                    <thead>
                      <tr style={{ background: '#e2e8f0', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                        <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FDR NO</th>
                        <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FUND CATEGORY</th>
                        <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>BANK</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>PRINCIPAL</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>GROSS INT</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>AIT TAX</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>EXCISE</th>
                        <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>NET PROFIT</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>RECEIVED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = encashedInvestments.filter(inv => sapReportConfig.fundCategory === 'ALL' || inv.fund_name === sapReportConfig.fundCategory);
                        let sumP = 0, sumG = 0, sumT = 0, sumE = 0, sumN = 0, sumD = 0;
                        
                        const rows = filtered.map(inv => {
                          const gross = inv.actual_gross_interest || 0;
                          const tax = inv.actual_tax || 0;
                          const duty = inv.actual_excise_duty || 0;
                          const charge = inv.actual_bank_charge || 0;
                          const net = inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' 
                            ? inv.actual_net_interest 
                            : (gross - tax - duty - charge);
                          const deposit = inv.encash_received || (inv.principal_amount + net);
                          
                          sumP += inv.principal_amount || 0;
                          sumG += gross;
                          sumT += tax;
                          sumE += duty;
                          sumN += net;
                          sumD += deposit;

                          return (
                            <tr key={`sap-${inv.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{inv.fdr_no}</td>
                              <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{inv.fund_name}</td>
                              <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{inv.bank_name}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(inv.principal_amount)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(gross)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(tax)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(duty)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(net)}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(deposit)}</td>
                            </tr>
                          );
                        });

                        return (
                          <>
                            {rows}
                            <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '3px double #0f172a', background: '#f1f5f9', fontWeight: '800' }}>
                              <td colSpan="3" style={{ padding: '8px 6px', textAlign: 'right' }}>GRAND TOTAL:</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumP)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumG)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumT)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumE)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumN)}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(sumD)}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                )}

                {sapReportConfig.reportType === 'monthly' && monthlyData && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px', fontSize: '11px', textAlign: 'center' }}>
                      <div style={{ border: '1px solid #cbd5e1', padding: '10px', background: '#f8fafc' }}>
                        <div style={{ color: '#475569', fontWeight: 'bold' }}>Opening Balance</div>
                        <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>{formatCurrency(monthlyData.openingBalance)}</div>
                      </div>
                      <div style={{ border: '1px solid #cbd5e1', padding: '10px', background: '#f8fafc' }}>
                        <div style={{ color: '#475569', fontWeight: 'bold' }}>New Openings/Renewals</div>
                        <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>+{formatCurrency(monthlyData.newInvestmentsMonth)}</div>
                      </div>
                      <div style={{ border: '1px solid #cbd5e1', padding: '10px', background: '#f8fafc' }}>
                        <div style={{ color: '#475569', fontWeight: 'bold' }}>Gross Profit Accrued</div>
                        <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>{formatCurrency(monthlyData.monthGrossInterest)}</div>
                      </div>
                      <div style={{ border: '1px solid #cbd5e1', padding: '10px', background: '#f8fafc' }}>
                        <div style={{ color: '#475569', fontWeight: 'bold' }}>Net Monthly Profit</div>
                        <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>{formatCurrency(monthlyData.monthNetInterest)}</div>
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#0f172a', marginBottom: '24px' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                          <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FDR NO</th>
                          <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>BANK</th>
                          <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>PRINCIPAL</th>
                          <th style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>RATE</th>
                          <th style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>DAYS</th>
                          <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>MONTH GROSS INT</th>
                          <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>MONTH TAX</th>
                          <th style={{ padding: '6px', textAlign: 'right' }}>MONTH NET PROFIT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.monthlyRegister.filter(inv => sapReportConfig.fundCategory === 'ALL' || inv.fund_name === sapReportConfig.fundCategory).map(inv => (
                          <tr key={`sap-monthly-${inv.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{inv.fdr_no}</td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{inv.bank_name}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(inv.principal_amount)}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{inv.interest_rate}%</td>
                            <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{inv.days_in_month} Days</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(inv.month_gross_interest)}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(inv.month_tax)}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(inv.month_net_interest)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {sapReportConfig.reportType === 'fund-wise' && fundWiseData && (
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', textAlign: 'center', margin: '0 0 16px 0', textDecoration: 'underline' }}>
                      CRYSTAL REPORT: PBS FUND CATEGORIES & ACCOUNT CODE CONCENTRATION
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#0f172a', marginBottom: '24px' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>ACCOUNT CODE</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FUND NAME</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>ACTIVE FDRs</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>TOTAL PRINCIPAL</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>PORTFOLIO SHARE</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>ACCRUED PROFIT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fundWiseData.map(f => {
                          const share = totalPrincipal > 0 ? ((f.total_principal / totalPrincipal) * 100).toFixed(2) : '0.00';
                          return (
                            <tr key={`sap-fw-${f.id || f.acc_code}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{f.acc_code}</td>
                              <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{f.fund_name}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{f.count} FDRs</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(f.total_principal)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{share}%</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(f.total_accrued)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {fundWiseData.filter(f => f.investments && f.investments.length > 0).map(f => (
                      <div key={`sap-breakdown-${f.acc_code}`} style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontSize: '13px', background: '#f1f5f9', padding: '6px 12px', borderLeft: '3px solid #0f172a' }}>
                          Fund: {f.acc_code} - {f.fund_name} (Total: {formatCurrency(f.total_principal)})
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#334155', marginBottom: '16px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #94a3b8' }}>
                              <th style={{ padding: '4px', textAlign: 'left' }}>FDR No</th>
                              <th style={{ padding: '4px', textAlign: 'left' }}>Bank & Branch</th>
                              <th style={{ padding: '4px', textAlign: 'right' }}>Principal Amount</th>
                              <th style={{ padding: '4px', textAlign: 'center' }}>Interest Rate</th>
                              <th style={{ padding: '4px', textAlign: 'center' }}>Issue Date</th>
                              <th style={{ padding: '4px', textAlign: 'center' }}>Maturity Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {f.investments.map(inv => (
                              <tr key={`sap-inv-${inv.id}`} style={{ borderBottom: '1px dotted #cbd5e1' }}>
                                <td style={{ padding: '4px' }}><strong>{inv.fdr_no}</strong></td>
                                <td style={{ padding: '4px' }}>{inv.bank_name}</td>
                                <td style={{ padding: '4px', textAlign: 'right' }}>{formatCurrency(inv.principal_amount)}</td>
                                <td style={{ padding: '4px', textAlign: 'center' }}>{inv.interest_rate}%</td>
                                <td style={{ padding: '4px', textAlign: 'center' }}>{formatDate(inv.issue_date)}</td>
                                <td style={{ padding: '4px', textAlign: 'center' }}>{formatDate(inv.maturity_date)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {sapReportConfig.reportType === 'maturity' && (
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', textAlign: 'center', margin: '0 0 16px 0', textDecoration: 'underline' }}>
                      CRYSTAL REPORT: INVESTMENT MATURITY SCHEDULE
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#0f172a', marginBottom: '24px' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                          <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>MATURITY DATE</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>FDR CERTIFICATE NO</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>BANK & BRANCH</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>PRINCIPAL AMOUNT</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>RATE</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>EXPECTED PROCEEDS</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investments
                          .filter(inv => sapReportConfig.fundCategory === 'ALL' || inv.fund_name === sapReportConfig.fundCategory)
                          .sort((a, b) => new Date(a.maturity_date) - new Date(b.maturity_date))
                          .map(inv => (
                            <tr key={`sap-mat-${inv.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatDate(inv.maturity_date)}</td>
                              <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.fdr_no}</td>
                              <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.bank_name} ({inv.bank_branch})</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(inv.principal_amount)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{inv.interest_rate}%</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(inv.principal_amount + (inv.estimated_net_interest || 0))}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>{inv.status}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {sapReportConfig.reportType === 'bank-exposure' && (
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', textAlign: 'center', margin: '0 0 16px 0', textDecoration: 'underline' }}>
                      CRYSTAL REPORT: BANK-WISE CONCENTRATION & RISK EXPOSURE
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#0f172a', marginBottom: '24px' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>BANK INSTITUTION</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>ACTIVE FDRs</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>TOTAL INVESTED PRINCIPAL</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>PORTFOLIO SHARE</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>TOTAL ACCRUED PROFIT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(bankWiseMap).map(bName => {
                          const info = bankWiseMap[bName];
                          const share = ((info.totalAmount / totalPrincipal) * 100).toFixed(2);
                          return (
                            <tr key={`sap-bank-${bName}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{bName}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{info.count} FDRs</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{formatCurrency(info.totalAmount)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{share}%</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(info.totalAccrued)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SAP / CRYSTAL SIGNATORY BLOCK */}
                <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', textAlign: 'center' }}>
                  <div>
                    {settings.signatory_accountant_signature ? (
                      <img src={settings.signatory_accountant_signature} alt="Signature" style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                    ) : (
                      <div style={{ height: '35px' }} />
                    )}
                    <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '6px' }}>
                      {settings.signatory_accountant_name && (
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>( {settings.signatory_accountant_name} )</div>
                      )}
                      <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: settings.signatory_accountant_name ? '600' : 'bold' }}>
                        {settings.signatory_accountant || 'Officer (Accounts)'}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Prepared By</div>
                  </div>

                  <div>
                    {settings.signatory_agm_signature ? (
                      <img src={settings.signatory_agm_signature} alt="Signature" style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                    ) : (
                      <div style={{ height: '35px' }} />
                    )}
                    <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '6px' }}>
                      {settings.signatory_agm_name && (
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>( {settings.signatory_agm_name} )</div>
                      )}
                      <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: settings.signatory_agm_name ? '600' : 'bold' }}>
                        {settings.signatory_agm_finance || 'AGM (Finance)'}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Checked By</div>
                  </div>

                  <div>
                    {settings.signatory_gm_signature ? (
                      <img src={settings.signatory_gm_signature} alt="Signature" style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px', background: 'transparent' }} />
                    ) : (
                      <div style={{ height: '35px' }} />
                    )}
                    <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '6px' }}>
                      {settings.signatory_gm_name && (
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>( {settings.signatory_gm_name} )</div>
                      )}
                      <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: settings.signatory_gm_name ? '600' : 'bold' }}>
                        {settings.signatory_gm || 'General Manager'}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Approved By</div>
                  </div>
                </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REPORT: PERIODICAL FUND SUMMARY BALANCE & MOVEMENT */}
            {activeReportTab === 'period-comparison' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#10b981' }}>
                      Fiscal Year (July–June) Periodical Fund Balance & Financial Movement Statement
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Fund-wise record of opening balance, additions, encashments, gross interest, AIT tax, excise duty, bank charges, and realized net profit per Fiscal Year.
                    </p>
                  </div>

                  {/* PRINT-ONLY PERIOD SUBTITLE */}
                  <div className="print-only" style={{ width: '100%', textAlign: 'center', margin: '6px 0 10px 0', fontSize: '12px', fontWeight: '700', color: '#000000' }}>
                    Fiscal Year: <span style={{ color: '#0284c7' }}>{periodFiscalYear}</span> &nbsp;•&nbsp; Period: <span>{formatDate(periodPrevDate)}</span> to <span>{formatDate(periodCurrDate)}</span> &nbsp;•&nbsp; Accounting Basis: <span>{periodInterestMode === 'actual' ? 'Actual Posted Interest (Posted & Settled)' : 'Time-Proportionate Accrual'}</span>
                  </div>

                  {/* DATE RANGE & FISCAL YEAR FILTER CONTROLS */}
                  <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card-hover)', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Fiscal Year Preset:</label>
                      <select
                        className="form-select"
                        style={{ background: 'var(--input-bg)', border: '1.5px solid var(--input-border)', color: 'var(--input-text)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}
                        value={periodFiscalYear}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPeriodFiscalYear(val);
                          setPeriodQuickMonth('');
                          if (val === 'FY 2026-2027') { setPeriodPrevDate('2026-07-01'); setPeriodCurrDate('2027-06-30'); }
                          else if (val === 'FY 2025-2026') { setPeriodPrevDate('2025-07-01'); setPeriodCurrDate('2026-06-30'); }
                          else if (val === 'FY 2024-2025') { setPeriodPrevDate('2024-07-01'); setPeriodCurrDate('2025-06-30'); }
                          else if (val === 'FY 2023-2024') { setPeriodPrevDate('2023-07-01'); setPeriodCurrDate('2024-06-30'); }
                        }}
                      >
                        <option value="FY 2026-2027">FY 2026-2027 (Jul 2026 – Jun 2027)</option>
                        <option value="FY 2025-2026">FY 2025-2026 (Jul 2025 – Jun 2026)</option>
                        <option value="FY 2024-2025">FY 2024-2025 (Jul 2024 – Jun 2025)</option>
                        <option value="FY 2023-2024">FY 2023-2024 (Jul 2023 – Jun 2024)</option>
                        <option value="Custom">Custom Date Range</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#10b981', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>Quick Month Select:</label>
                      <select
                        className="form-select"
                        style={{ background: 'var(--input-bg)', border: '1.5px solid #10b981', color: 'var(--input-text)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}
                        value={periodQuickMonth}
                        onChange={(e) => handlePeriodQuickMonth(e.target.value)}
                      >
                        <option value="">-- Quick Month Select --</option>
                        <optgroup label="Fiscal Year Cumulative (Jul 01 to Month End)">
                          {getFiscalYearMonths(periodFiscalYear).map(m => {
                            const lastDay = new Date(m.year, m.monthNum, 0).getDate();
                            const padM = String(m.monthNum).padStart(2, '0');
                            return (
                              <option key={`cum-${m.year}-${m.monthNum}`} value={`cumulative_${m.year}_${m.monthNum}`}>
                                Up to {m.monthName} {m.year} (Jul 01 – {padM}/{lastDay})
                              </option>
                            );
                          })}
                        </optgroup>
                        <optgroup label="Single Full Month (1st to End of Month)">
                          {getFiscalYearMonths(periodFiscalYear).map(m => {
                            const lastDay = new Date(m.year, m.monthNum, 0).getDate();
                            const padM = String(m.monthNum).padStart(2, '0');
                            return (
                              <option key={`sng-${m.year}-${m.monthNum}`} value={`single_${m.year}_${m.monthNum}`}>
                                {m.monthName} {m.year} (01/{padM} – {lastDay}/{padM})
                              </option>
                            );
                          })}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Start Date:</label>
                      <input
                        type="date"
                        value={periodPrevDate}
                        onChange={(e) => {
                          setPeriodPrevDate(e.target.value);
                          setPeriodQuickMonth('');
                        }}
                        style={{ background: 'var(--input-bg)', border: '1.5px solid var(--input-border)', color: 'var(--input-text)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 'bold', marginTop: '14px' }}>TO</div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '600', display: 'block', marginBottom: '2px' }}>End Date:</label>
                      <input
                        type="date"
                        value={periodCurrDate}
                        onChange={(e) => {
                          setPeriodCurrDate(e.target.value);
                          setPeriodQuickMonth('');
                        }}
                        style={{ background: 'var(--input-bg)', border: '1.5px solid var(--input-border)', color: 'var(--input-text)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Interest Accounting Basis:</label>
                      <select
                        className="form-select"
                        style={{ background: 'var(--input-bg)', border: '1.5px solid var(--input-border)', color: 'var(--input-text)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}
                        value={periodInterestMode}
                        onChange={(e) => setPeriodInterestMode(e.target.value)}
                      >
                        <option value="actual">Actual Posted Interest (Posted &amp; Settled)</option>
                        <option value="provisional">Time-Proportionate Accrual (Provisional Days Math)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {periodLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Fiscal Year Comparison Report...</div>
                ) : periodReport ? (
                  <>
                    {/* 5-CARD STATISTICAL SUMMARY */}
                    <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
                      <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #60a5fa' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Opening Total ({formatDate(periodReport.period.previous_date)})</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                          {formatCurrency(periodReport.summary.grand_prev_total)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Principal: {formatCurrency(periodReport.summary.grand_prev_principal)}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #0284c7' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Gross Interest Earned</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                          {formatCurrency(periodReport.summary.grand_period_gross || 0)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Before Taxes & Duties
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Tax (AIT) Deducted</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                          {formatCurrency(periodReport.summary.grand_period_tax || 0)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Source Tax (10% / 15%)
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Excise & Bank Charges</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
                          {formatCurrency((periodReport.summary.grand_period_excise || 0) + (periodReport.summary.grand_period_bank_charge || 0))}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Duty: {formatCurrency(periodReport.summary.grand_period_excise || 0)} | Charge: {formatCurrency(periodReport.summary.grand_period_bank_charge || 0)}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Net Realized Profit</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                          {formatCurrency(periodReport.summary.grand_period_net_profit || 0)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          After Tax & Duty Deductions
                        </div>
                      </div>
                    </div>

                    {/* COMPARATIVE PERIOD TABLE WITH TAX, EXCISE & BANK CHARGE */}
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ACC CODE</th>
                            <th>FUND CATEGORY</th>
                            <th style={{ textAlign: 'right' }}>OPENING TOTAL</th>
                            <th style={{ textAlign: 'right' }}>ADDITIONS (+)</th>
                            <th style={{ textAlign: 'right' }}>ENCASHED (-)</th>
                            <th style={{ textAlign: 'right' }}>GROSS INT. (BDT)</th>
                            <th style={{ textAlign: 'right' }}>TAX / AIT (BDT)</th>
                            <th style={{ textAlign: 'right' }}>EXCISE DUTY (BDT)</th>
                            <th style={{ textAlign: 'right' }}>BANK CHARGES (BDT)</th>
                            <th style={{ textAlign: 'right' }}>NET PROFIT (BDT)</th>
                            <th style={{ textAlign: 'right' }}>END TOTAL BALANCE</th>
                            <th style={{ textAlign: 'right' }}>VARIANCE</th>
                            <th className="no-print" style={{ textAlign: 'center' }}>DETAILS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodReport.fundReports.map(fund => (
                            <tr key={fund.id}>
                              <td><strong>{fund.acc_code}</strong></td>
                              <td>{fund.fund_name}</td>
                              <td style={{ textAlign: 'right' }}>{formatCurrency(fund.prev_total_balance)}</td>
                              <td style={{ textAlign: 'right', color: fund.addition_principal > 0 ? '#10b981' : 'var(--text-muted)' }}>
                                {fund.addition_principal > 0 ? `+${formatCurrency(fund.addition_principal)}` : '-'}
                              </td>
                              <td style={{ textAlign: 'right', color: fund.encashed_principal > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                                {fund.encashed_principal > 0 ? `-${formatCurrency(fund.encashed_principal)}` : '-'}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(fund.period_gross_interest || 0)}</td>
                              <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(fund.period_tax || 0)}</td>
                              <td style={{ textAlign: 'right', color: '#f59e0b' }}>{formatCurrency(fund.period_excise_duty || 0)}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-main)' }}>{formatCurrency(fund.period_bank_charge || 0)}</td>
                              <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(fund.period_net_profit || 0)}</td>
                              <td style={{ textAlign: 'right', fontWeight: '800', color: '#10b981' }}>{formatCurrency(fund.curr_total_balance)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: fund.net_variance >= 0 ? '#10b981' : '#ef4444' }}>
                                {fund.net_variance >= 0 ? '+' : ''}{formatCurrency(fund.net_variance)}
                              </td>
                              <td className="no-print" style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => setSelectedDetailFund(fund)}
                                  className="btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '11px' }}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}

                          {/* GRAND TOTAL SUMMARY ROW */}
                          <tr style={{ background: 'rgba(52, 211, 153, 0.1)', fontWeight: '800', borderTop: '2px solid #34d399' }}>
                            <td colSpan="2">TOTAL FUND PORTFOLIO</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(periodReport.summary.grand_prev_total)}</td>
                            <td style={{ textAlign: 'right', color: '#10b981' }}>+{formatCurrency(periodReport.summary.grand_additions)}</td>
                            <td style={{ textAlign: 'right', color: '#ef4444' }}>-{formatCurrency(periodReport.summary.grand_encashed)}</td>
                            <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(periodReport.summary.grand_period_gross || 0)}</td>
                            <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(periodReport.summary.grand_period_tax || 0)}</td>
                            <td style={{ textAlign: 'right', color: '#f59e0b' }}>{formatCurrency(periodReport.summary.grand_period_excise || 0)}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-main)' }}>{formatCurrency(periodReport.summary.grand_period_bank_charge || 0)}</td>
                            <td style={{ textAlign: 'right', color: '#10b981', fontSize: '13px' }}>{formatCurrency(periodReport.summary.grand_period_net_profit || 0)}</td>
                            <td style={{ textAlign: 'right', fontSize: '14px', color: '#10b981' }}>{formatCurrency(periodReport.summary.grand_curr_total)}</td>
                            <td style={{ textAlign: 'right', fontSize: '13px', color: periodReport.summary.grand_net_variance >= 0 ? '#10b981' : '#ef4444' }}>
                              {periodReport.summary.grand_net_variance >= 0 ? '+' : ''}{formatCurrency(periodReport.summary.grand_net_variance)}
                            </td>
                            <td className="no-print"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}

                {/* ===== PERIODICAL FDR LIST — ACTIVE AT END OF PERIOD ===== */}
                {periodReport && !periodLoading && (() => {
                  // Flatten all curr_details across all funds into one sorted list
                  const allEndFdrs = [];
                  periodReport.fundReports.forEach(fund => {
                    (fund.curr_details || []).forEach(inv => {
                      allEndFdrs.push({ ...inv, acc_code: fund.acc_code, fund_name: fund.fund_name });
                    });
                  });
                  allEndFdrs.sort((a, b) => {
                    const accCmp = (a.acc_code || '').localeCompare(b.acc_code || '');
                    if (accCmp !== 0) return accCmp;
                    return (a.issue_date || '').localeCompare(b.issue_date || '');
                  });

                  const grandPrincipal = allEndFdrs.reduce((s, i) => s + (i.principal_at_curr ?? i.principal_amount ?? 0), 0);
                  const grandAccrued = allEndFdrs.reduce((s, i) => s + (i.accrued_at_curr || 0), 0);

                  return (
                    <div style={{ marginTop: '32px' }}>
                      {/* Section Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#34d399', margin: 0 }}>
                            Periodical FDR / Certificate List
                          </h4>
                          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                            All active investments as of end of period: <strong style={{ color: '#60a5fa' }}>{formatDate(periodCurrDate)}</strong>
                            &nbsp;—&nbsp;{allEndFdrs.length} FDR / Certificate(s)
                          </p>
                        </div>
                        <button
                          className="btn-success no-print"
                          style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => exportTableToExcel(['period-fdr-end-table'], `Periodical_FDR_List_${periodCurrDate}.xlsx`)}
                        >
                          <FileSpreadsheet size={15} /> Export Excel
                        </button>
                      </div>

                      <div className="data-table-container">
                        <table className="data-table" id="period-fdr-end-table">
                          <thead>
                            <tr>
                              <th>SL</th>
                              <th>Cert / FDR No</th>
                              <th>Type</th>
                              <th>Account No</th>
                              <th>Fund Category</th>
                              <th>Bank &amp; Branch</th>
                              <th style={{ textAlign: 'right' }}>Principal Amount</th>
                              <th style={{ textAlign: 'right' }}>Rate (%)</th>
                              <th>Issue Date</th>
                              <th>Maturity Date</th>
                              <th style={{ textAlign: 'right' }}>Accrued Interest</th>
                              <th style={{ textAlign: 'center' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allEndFdrs.map((inv, idx) => (
                              <tr key={`end-fdr-${inv.id}`}>
                                <td style={{ color: '#64748b', fontSize: '11px' }}>{idx + 1}</td>
                                <td><strong style={{ color: '#60a5fa' }}>{inv.fdr_no}</strong></td>
                                <td style={{ fontSize: '11px' }}>{inv.investment_type || 'FDR'}</td>
                                <td style={{ fontSize: '11px', color: '#94a3b8' }}>{inv.acc_code}</td>
                                <td style={{ fontSize: '12px' }}>{inv.fund_name}</td>
                                <td style={{ fontSize: '12px' }}>
                                  {inv.bank_name}{inv.bank_branch ? ` — ${inv.bank_branch}` : ''}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(inv.principal_at_curr ?? inv.principal_amount)}</td>
                                <td style={{ textAlign: 'right' }}>{inv.interest_rate}</td>
                                <td>{formatDate(inv.issue_date)}</td>
                                <td>{formatDate(inv.maturity_date)}</td>
                                <td style={{ textAlign: 'right', color: '#38bdf8', fontWeight: 'bold' }}>{formatCurrency(inv.accrued_at_curr || 0)}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="badge badge-active" style={{ fontSize: '10px' }}>Active</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'rgba(52,211,153,0.1)', fontWeight: '800', borderTop: '2px solid #34d399' }}>
                              <td colSpan="6" style={{ textAlign: 'right', paddingRight: '12px' }}>
                                GRAND TOTAL — {allEndFdrs.length} FDR / Certificates
                              </td>
                              <td style={{ textAlign: 'right', color: '#34d399' }}>{formatCurrency(grandPrincipal)}</td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td style={{ textAlign: 'right', color: '#38bdf8' }}>{formatCurrency(grandAccrued)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* ITEMIZED FUND BREAKDOWN MODAL */}
                {selectedDetailFund && (
                  <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }}>
                      <div className="modal-header">
                        <h3>FDR List — {selectedDetailFund.fund_name} ({selectedDetailFund.acc_code})</h3>
                        <button className="btn-close" onClick={() => setSelectedDetailFund(null)}>&times;</button>
                      </div>
                      <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>

                        {/* PERIOD SUMMARY MINI-CARDS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                          <div style={{ background: 'rgba(96,165,250,0.08)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #60a5fa' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Period</div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa' }}>{formatDate(periodPrevDate)} → {formatDate(periodCurrDate)}</div>
                          </div>
                          <div style={{ background: 'rgba(52,211,153,0.08)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #34d399' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>FDRs Within Period</div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>{selectedDetailFund.within_period_count || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(56,189,248,0.08)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Period Gross Interest</div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>{formatCurrency(selectedDetailFund.period_gross_interest || 0)}</div>
                          </div>
                          <div style={{ background: 'rgba(52,211,153,0.08)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #34d399' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Net Profit</div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#34d399' }}>{formatCurrency(selectedDetailFund.period_net_profit || 0)}</div>
                          </div>
                        </div>

                        {/* ===== WITHIN-PERIOD FDR LIST ===== */}
                        <h4 style={{ color: '#34d399', marginBottom: '10px', fontSize: '14px', borderBottom: '1px solid rgba(52,211,153,0.3)', paddingBottom: '6px' }}>
                          FDR List — Active Within Period ({formatDate(periodPrevDate)} to {formatDate(periodCurrDate)})
                          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>
                            ({selectedDetailFund.within_period_count || 0} FDR/Certificates)
                          </span>
                        </h4>
                        {(!selectedDetailFund.within_period_details || selectedDetailFund.within_period_details.length === 0) ? (
                          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>No investments were active during this period.</div>
                        ) : (
                          <div className="data-table-container" style={{ marginBottom: '28px' }}>
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>FDR / CERT NO</th>
                                  <th>Bank Institution</th>
                                  <th>Branch</th>
                                  <th>Issue Date</th>
                                  <th>Maturity Date</th>
                                  <th>Encash Date</th>
                                  <th>Rate</th>
                                  <th style={{ textAlign: 'right' }}>Principal (BDT)</th>
                                  <th style={{ textAlign: 'right' }}>Period Interest (BDT)</th>
                                  <th style={{ textAlign: 'center' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedDetailFund.within_period_details.map((inv, idx) => (
                                  <tr key={`wp-${inv.id}`} style={{
                                    background: inv.status === 'Encashed' ? 'rgba(248,113,113,0.05)' :
                                               inv.status === 'Renewed' ? 'rgba(251,191,36,0.05)' : 'transparent'
                                  }}>
                                    <td style={{ color: '#64748b', fontSize: '11px' }}>{idx + 1}</td>
                                    <td><strong style={{ color: '#60a5fa' }}>{inv.fdr_no}</strong></td>
                                    <td>{inv.bank_name}</td>
                                    <td style={{ fontSize: '11px', color: '#94a3b8' }}>{inv.bank_branch || '—'}</td>
                                    <td>{formatDate(inv.issue_date)}</td>
                                    <td>{formatDate(inv.maturity_date)}</td>
                                    <td style={{ color: inv.encash_date ? '#f87171' : '#64748b' }}>
                                      {inv.encash_date ? formatDate(inv.encash_date) : '—'}
                                    </td>
                                    <td>{inv.interest_rate}%</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(inv.principal_amount)}</td>
                                    <td style={{ textAlign: 'right', color: inv.period_gross_interest > 0 ? '#38bdf8' : '#64748b', fontWeight: inv.period_gross_interest > 0 ? 'bold' : 'normal' }}>
                                      {inv.period_gross_interest > 0 ? formatCurrency(inv.period_gross_interest) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className={`badge ${
                                        inv.status === 'Active' ? 'badge-active' :
                                        inv.status === 'Encashed' ? 'badge-matured' :
                                        inv.status === 'Renewed' ? 'badge-renewed' :
                                        inv.status === 'InPlaceRenewed' ? 'badge-approved' : 'badge-active'
                                      }`} style={{ fontSize: '10px' }}>
                                        {inv.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: 'rgba(52,211,153,0.1)', fontWeight: '800', borderTop: '2px solid #34d399' }}>
                                  <td colSpan="8" style={{ textAlign: 'right', paddingRight: '12px' }}>TOTAL ({selectedDetailFund.within_period_count} FDRs)</td>
                                  <td style={{ textAlign: 'right' }}>
                                    {formatCurrency(selectedDetailFund.within_period_details.reduce((s, i) => s + i.principal_amount, 0))}
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#38bdf8' }}>
                                    {formatCurrency(selectedDetailFund.within_period_details.reduce((s, i) => s + (i.period_gross_interest || 0), 0))}
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {/* ===== OPENING SNAPSHOT ===== */}
                        <h4 style={{ color: '#60a5fa', marginBottom: '8px', fontSize: '13px', borderBottom: '1px solid rgba(96,165,250,0.2)', paddingBottom: '4px' }}>
                          Opening Snapshot — Active as of {formatDate(periodPrevDate)} ({selectedDetailFund.prev_count} FDRs)
                        </h4>
                        {selectedDetailFund.prev_details.length === 0 ? (
                          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px' }}>No active investments at opening date.</div>
                        ) : (
                          <table className="data-table" style={{ marginBottom: '24px', fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th>FDR / CERT NO</th>
                                <th>Bank Institution</th>
                                <th>Issue Date</th>
                                <th>Maturity Date</th>
                                <th>Rate</th>
                                <th style={{ textAlign: 'right' }}>Principal</th>
                                <th style={{ textAlign: 'right' }}>Accrued Interest</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedDetailFund.prev_details.map(inv => (
                                <tr key={`prev-${inv.id}`}>
                                  <td><strong>{inv.fdr_no}</strong></td>
                                  <td>{inv.bank_name}</td>
                                  <td>{formatDate(inv.issue_date)}</td>
                                  <td>{formatDate(inv.maturity_date)}</td>
                                  <td>{inv.interest_rate}%</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(inv.principal_amount)}</td>
                                  <td style={{ textAlign: 'right', color: '#60a5fa' }}>{formatCurrency(inv.accrued_at_prev)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* ===== CLOSING SNAPSHOT ===== */}
                        <h4 style={{ color: '#34d399', marginBottom: '8px', fontSize: '13px', borderBottom: '1px solid rgba(52,211,153,0.2)', paddingBottom: '4px' }}>
                          Closing Snapshot — Active as of {formatDate(periodCurrDate)} ({selectedDetailFund.curr_count} FDRs)
                        </h4>
                        {selectedDetailFund.curr_details.length === 0 ? (
                          <div style={{ color: '#94a3b8', fontSize: '12px' }}>No active investments at closing date.</div>
                        ) : (
                          <table className="data-table" style={{ fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th>FDR / CERT NO</th>
                                <th>Bank Institution</th>
                                <th>Issue Date</th>
                                <th>Maturity Date</th>
                                <th>Rate</th>
                                <th style={{ textAlign: 'right' }}>Principal</th>
                                <th style={{ textAlign: 'right' }}>Accrued Interest</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedDetailFund.curr_details.map(inv => (
                                <tr key={`curr-${inv.id}`}>
                                  <td><strong>{inv.fdr_no}</strong></td>
                                  <td>{inv.bank_name}</td>
                                  <td>{formatDate(inv.issue_date)}</td>
                                  <td>{formatDate(inv.maturity_date)}</td>
                                  <td>{inv.interest_rate}%</td>
                                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(inv.principal_amount)}</td>
                                  <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 'bold' }}>{formatCurrency(inv.accrued_at_curr)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                      </div>
                      <div className="modal-footer">
                        <button className="btn-secondary" onClick={() => setSelectedDetailFund(null)}>Close</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* REPORT 6: ACCOUNTS PROVISION LEDGER */}
            {activeReportTab === 'provisions' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#34d399' }}>
                  Interest & Tax Provision Accounts Ledger Report
                </h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Posting Date</th>
                        <th>FDR Certificate No</th>
                        <th>Period Range</th>
                        <th>Gross Interest</th>
                        <th>Tax Deduction</th>
                        <th>Excise Duty</th>
                        <th>Net Interest Ledger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {provisions.map(p => (
                        <tr key={p.id}>
                          <td>{formatDate(p.provision_date)}</td>
                          <td><strong>{p.fdr_no}</strong></td>
                          <td>{formatDate(p.period_start)} to {formatDate(p.period_end)}</td>
                          <td>{formatCurrency(p.gross_interest)}</td>
                          <td>{formatCurrency(p.tax_amount)} ({p.tax_rate}%)</td>
                          <td>{formatCurrency(p.excise_duty)}</td>
                          <td><strong style={{ color: '#34d399' }}>{formatCurrency(p.net_interest)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 7: INVESTMENT FINANCIAL HISTORY REGISTER */}
            {activeReportTab === 'financial-history' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#c084fc' }}>
                      Investment Financial History Register (Principal, Interest, Tax & Excise Duty)
                    </h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                      Complete historical ledger tracking all principal changes, gross interest earned, AIT tax deductions, and excise duties over time.
                    </p>
                  </div>

                  <div className="no-print" style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Filter by FDR No, Bank, or Fund..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="form-input"
                      style={{ width: '260px' }}
                    />
                  </div>
                </div>

                {historyLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading Financial History Register...</div>
                ) : financialHistoryLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No financial history records found.</div>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Posting Date</th>
                          <th>FDR / Cert No</th>
                          <th>Event Type</th>
                          <th>Bank Institution</th>
                          <th>Acc Code & Fund</th>
                          <th style={{ textAlign: 'right' }}>Principal Amount</th>
                          <th style={{ textAlign: 'right' }}>Gross Interest</th>
                          <th style={{ textAlign: 'right' }}>Tax (AIT)</th>
                          <th style={{ textAlign: 'right' }}>Excise Duty</th>
                          <th style={{ textAlign: 'right' }}>Bank Charge</th>
                          <th style={{ textAlign: 'right' }}>Net Profit</th>
                          <th style={{ textAlign: 'right' }}>Total Balance</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialHistoryLogs.map(fh => (
                          <tr key={fh.id}>
                            <td><strong style={{ color: 'var(--text-main)' }}>{formatDate(fh.event_date)}</strong></td>
                            <td><strong style={{ color: '#60a5fa' }}>{fh.fdr_no}</strong></td>
                            <td>
                              <span className={`badge ${
                                fh.event_type === 'Creation' ? 'badge-active' :
                                fh.event_type === 'Provision' ? 'badge-approved' :
                                fh.event_type === 'Encashment' ? 'badge-matured' : 'badge-renewed'
                              }`}>
                                {fh.event_type}
                              </span>
                            </td>
                            <td>{fh.bank_name || 'N/A'}</td>
                            <td>{fh.acc_code ? `${fh.acc_code} - ${fh.fund_name}` : 'N/A'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(fh.principal_amount)}</td>
                            <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(fh.gross_interest)}</td>
                            <td style={{ textAlign: 'right', color: '#fb7185' }}>{formatCurrency(fh.tax_amount)} ({fh.tax_rate}%)</td>
                            <td style={{ textAlign: 'right', color: '#f59e0b' }}>{formatCurrency(fh.excise_duty)}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-main)' }}>{formatCurrency(fh.bank_charge || 0)}</td>
                            <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(fh.net_interest)}</td>
                            <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '800' }}>{formatCurrency(fh.total_balance)}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '11px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cleanRemarks(fh.remarks)}>
                              {cleanRemarks(fh.remarks)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* REPORT: RENEWED FDR LIST REPORT */}
            {activeReportTab === 'renewed-fdr' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: '#fbbf24' }}>
                  Renewed FDR Statement & Financial Settlement Report
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                  Detailed breakdown of renewed FDR investments with gross interest, tax, excise duty, bank charges, net profit & bank deposit settlement.
                </p>

                {renewedInvestments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No renewed FDR records found in the database.
                  </div>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>FDR / Cert No</th>
                          <th>Bank & Branch</th>
                          <th>Fund Category</th>
                          <th style={{ textAlign: 'right' }}>Principal Amount</th>
                          <th style={{ textAlign: 'right' }}>Gross Interest</th>
                          <th style={{ textAlign: 'right' }}>AIT Tax</th>
                          <th style={{ textAlign: 'right' }}>Excise Duty</th>
                          <th style={{ textAlign: 'right' }}>Bank Charge</th>
                          <th style={{ textAlign: 'right' }}>Net Profit</th>
                          <th style={{ textAlign: 'right' }}>Bank Deposit (P + Net)</th>
                          <th>Renewal Date</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renewedInvestments.map((inv, idx) => (
                          <tr key={inv.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <strong style={{ color: 'var(--text-main)' }}>{inv.fdr_no}</strong>
                              {(inv.renewal_type === 'In-Place Rollover' || inv.renewal_type === 'Renew') && (
                                <div style={{ fontSize: '10px', color: '#c084fc', fontWeight: 'bold' }}>Renew</div>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{inv.bank_name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.bank_branch}</div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '12px' }}>
                                {inv.acc_code ? `${inv.acc_code} - ` : ''}{inv.fund_name || 'General Fund'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                              {formatCurrency(inv.principal_amount)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                              {formatCurrency(inv.gross)}
                            </td>
                            <td style={{ textAlign: 'right', color: '#fb7185' }}>
                              {formatCurrency(inv.tax)}
                            </td>
                            <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                              {formatCurrency(inv.duty)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-main)' }}>
                              {formatCurrency(inv.charge)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                              {formatCurrency(inv.net)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>
                              {formatCurrency(inv.deposit)}
                            </td>
                            <td>{formatDate(inv.renewal_date)}</td>
                            <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cleanRemarks(inv.remarks)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'rgba(255,255,255,0.08)', fontWeight: 'bold' }}>
                          <td colSpan={4} style={{ textAlign: 'right', color: '#fbbf24', fontSize: '13px' }}>
                            GRAND TOTAL ({renewedInvestments.length} FDRs):
                          </td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontSize: '14px' }}>
                            {formatCurrency(renewedTotals.principal)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--primary)', fontSize: '13px' }}>
                            {formatCurrency(renewedTotals.gross)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#fb7185', fontSize: '13px' }}>
                            {formatCurrency(renewedTotals.tax)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '13px' }}>
                            {formatCurrency(renewedTotals.duty)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-main)', fontSize: '13px' }}>
                            {formatCurrency(renewedTotals.charge)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontSize: '14px' }}>
                            {formatCurrency(renewedTotals.net)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#38bdf8', fontSize: '15px' }}>
                            {formatCurrency(renewedTotals.deposit)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* REPORT: IN-PLACE ROLLOVER LIST */}
            {activeReportTab === 'inplace-rollover' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#c084fc' }}>
                      In-Place Renewed List Report
                    </h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                      All FDRs renewed in-place (same FDR number, principal rolled over). Each row is one renewal event — shows the net interest earned, taxes paid, and updated principal at renewal.
                    </p>
                  </div>

                  <div className="no-print" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Search FDR No, Bank, Fund..."
                      value={inplaceSearch}
                      onChange={(e) => setInplaceSearch(e.target.value)}
                      className="form-input"
                      style={{ width: '240px' }}
                    />
                  </div>
                </div>

                {inplaceLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading In-Place Renewed records...</div>
                ) : !inplaceRolloverData ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No data loaded yet.</div>
                ) : inplaceRolloverData.count === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <RefreshCcw size={40} style={{ color: '#334155', marginBottom: '12px' }} />
                    <div>No In-Place Renewed events found in the database.</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>In-place renewals are recorded when an FDR is renewed under the same FDR number.</div>
                  </div>
                ) : (
                  <>
                    {/* SUMMARY CARDS */}
                    <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #c084fc' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Renewal Events</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#c084fc', marginTop: '4px' }}>{inplaceRolloverData.count}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>FDR Renewals</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #34d399' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Renewed Principal</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>{formatCurrency(inplaceRolloverData.totals.principal)}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>New Principal at Renewal</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Gross Interest Earned</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>{formatCurrency(inplaceRolloverData.totals.gross)}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Before Taxes</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #f87171' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Tax (AIT) + Excise Duty</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#f87171', marginTop: '4px' }}>{formatCurrency(inplaceRolloverData.totals.tax + inplaceRolloverData.totals.excise)}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>AIT: {formatCurrency(inplaceRolloverData.totals.tax)} | Duty: {formatCurrency(inplaceRolloverData.totals.excise)}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #fbbf24' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Net Interest Reinvested</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>{formatCurrency(inplaceRolloverData.totals.net)}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Added Back to Principal</div>
                      </div>
                    </div>

                    {/* ROLLOVER TABLE */}
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>SL</th>
                            <th>FDR / Cert No</th>
                            <th>Bank &amp; Branch</th>
                            <th>Fund Category</th>
                            <th>Renewal Date</th>
                            <th>New Issue Date</th>
                            <th>New Maturity Date</th>
                            <th>Rate (%)</th>
                            <th style={{ textAlign: 'right' }}>Gross Interest Earned</th>
                            <th style={{ textAlign: 'right' }}>AIT Tax</th>
                            <th style={{ textAlign: 'right' }}>Excise Duty</th>
                            <th style={{ textAlign: 'right' }}>Net Interest</th>
                            <th style={{ textAlign: 'right' }}>Renewed Principal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inplaceRolloverData.records.map((r, idx) => (
                            <tr key={r.id}>
                              <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                              <td><strong style={{ color: '#c084fc' }}>{r.fdr_no}</strong></td>
                              <td>
                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{r.bank_name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.bank_branch}</div>
                              </td>
                              <td>
                                <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '12px' }}>
                                  {r.acc_code ? `${r.acc_code} – ` : ''}{r.fund_name || 'General Fund'}
                                </span>
                              </td>
                              <td><strong style={{ color: '#fbbf24' }}>{formatDate(r.rollover_date)}</strong></td>
                              <td style={{ color: 'var(--text-muted)' }}>{formatDate(r.new_issue_date)}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{formatDate(r.new_maturity_date)}</td>
                              <td style={{ textAlign: 'center' }}>{r.interest_rate}%</td>
                              <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(r.gross_interest)}</td>
                              <td style={{ textAlign: 'right', color: '#f87171' }}>{formatCurrency(r.tax_amount)}</td>
                              <td style={{ textAlign: 'right', color: '#f59e0b' }}>{formatCurrency(r.excise_duty)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(r.net_interest)}</td>
                              <td style={{ textAlign: 'right', fontWeight: '800', color: '#c084fc' }}>{formatCurrency(r.new_principal)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: 'rgba(192, 132, 252, 0.1)', fontWeight: 'bold', borderTop: '2px solid #7c3aed' }}>
                            <td colSpan={8} style={{ textAlign: 'right', color: '#c084fc', fontSize: '13px' }}>
                              GRAND TOTAL ({inplaceRolloverData.count} Renewal Event{inplaceRolloverData.count !== 1 ? 's' : ''}):
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--primary)', fontSize: '13px' }}>{formatCurrency(inplaceRolloverData.totals.gross)}</td>
                            <td style={{ textAlign: 'right', color: '#f87171', fontSize: '13px' }}>{formatCurrency(inplaceRolloverData.totals.tax)}</td>
                            <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '13px' }}>{formatCurrency(inplaceRolloverData.totals.excise)}</td>
                            <td style={{ textAlign: 'right', color: '#10b981', fontSize: '14px' }}>{formatCurrency(inplaceRolloverData.totals.net)}</td>
                            <td style={{ textAlign: 'right', color: '#c084fc', fontSize: '15px' }}>{formatCurrency(inplaceRolloverData.totals.principal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* REPORT: ENCASHED FDR LIST REPORT */}
            {activeReportTab === 'encashed-fdr' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: '#10b981' }}>
                  Encashed FDR Statement & Settlement Report
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Statement of encashed FDR investments with principal, gross interest earned, tax, excise duty, bank charges, net profit & bank settlement.
                </p>

                {encashedInvestments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No encashed FDR records found in the database.
                  </div>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>FDR / Cert No</th>
                          <th>Bank & Branch</th>
                          <th>Fund Category</th>
                          <th style={{ textAlign: 'right' }}>Principal Amount</th>
                          <th style={{ textAlign: 'right' }}>Gross Interest</th>
                          <th style={{ textAlign: 'right' }}>AIT Tax</th>
                          <th style={{ textAlign: 'right' }}>Excise Duty</th>
                          <th style={{ textAlign: 'right' }}>Bank Charge</th>
                          <th style={{ textAlign: 'right' }}>Net Profit</th>
                          <th style={{ textAlign: 'right' }}>Bank Deposit (P + Net)</th>
                          <th>Encashment Date</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {encashedInvestments.map((inv, idx) => {
                          const gross = inv.actual_gross_interest || 0;
                          const tax = inv.actual_tax || 0;
                          const duty = inv.actual_excise_duty || 0;
                          const charge = inv.actual_bank_charge || 0;
                          const net = inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' 
                            ? inv.actual_net_interest 
                            : (gross - tax - duty - charge);
                          const deposit = inv.encash_received || (inv.principal_amount + net);

                          return (
                            <tr key={inv.id}>
                              <td>{idx + 1}</td>
                              <td><strong style={{ color: 'var(--text-main)' }}>{inv.fdr_no}</strong></td>
                              <td>
                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{inv.bank_name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.bank_branch || inv.branch_name}</div>
                              </td>
                              <td>
                                <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '12px' }}>
                                  {inv.acc_code ? `${inv.acc_code} - ` : ''}{inv.fund_name || 'General Fund'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                                {formatCurrency(inv.principal_amount)}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                                {formatCurrency(gross)}
                              </td>
                              <td style={{ textAlign: 'right', color: '#fb7185' }}>
                                {formatCurrency(tax)}
                              </td>
                              <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                                {formatCurrency(duty)}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--text-main)' }}>
                                {formatCurrency(charge)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                                {formatCurrency(net)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>
                                {formatCurrency(deposit)}
                              </td>
                              <td>{formatDate(inv.encash_date)}</td>
                              <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cleanRemarks(inv.remarks) || 'Encashed'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'rgba(255,255,255,0.08)', fontWeight: 'bold' }}>
                          <td colSpan={4} style={{ textAlign: 'right', color: '#fbbf24', fontSize: '13px' }}>
                            GRAND TOTAL ({encashedInvestments.length} FDRs):
                          </td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontSize: '14px' }}>
                            {formatCurrency(encashedTotals.principal)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--primary)', fontSize: '13px' }}>
                            {formatCurrency(encashedTotals.gross)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#fb7185', fontSize: '13px' }}>
                            {formatCurrency(encashedTotals.tax)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '13px' }}>
                            {formatCurrency(encashedTotals.duty)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-main)', fontSize: '13px' }}>
                            {formatCurrency(encashedTotals.charge)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontSize: '14px' }}>
                            {formatCurrency(encashedTotals.net)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--primary)', fontSize: '15px' }}>
                            {formatCurrency(encashedTotals.deposit)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
            {/* BANK BRANCH WISE FDR LIST REPORT */}
            {activeReportTab === 'bank-branch-wise' && (() => {
              const bbMap = {};
              displayInvestments.forEach(inv => {
                const bName = inv.bank_name || 'Unknown Bank';
                const brName = inv.branch_name || 'Unknown Branch';
                if (!bbMap[bName]) bbMap[bName] = {};
                if (!bbMap[bName][brName]) bbMap[bName][brName] = [];
                bbMap[bName][brName].push(inv);
              });
              
              let grandTotalPrincipal = 0;
              let grandTotalGross = 0;
              let grandTotalTax = 0;
              let grandTotalNet = 0;

              return (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#0ea5e9' }}>
                    Bank & Branch Wise FDR List Report
                  </h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Bank Name</th>
                          <th>Branch Name</th>
                          <th>FDR No</th>
                          <th>Issue Date</th>
                          <th>Maturity Date</th>
                          <th style={{ textAlign: 'right' }}>Principal</th>
                          <th style={{ textAlign: 'right' }}>Rate</th>
                          <th style={{ textAlign: 'right' }}>Gross Profit</th>
                          <th style={{ textAlign: 'right' }}>Tax (AIT)</th>
                          <th style={{ textAlign: 'right' }}>Net Proceeds</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(bbMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([bankName, branches]) => {
                          return Object.entries(branches).sort((a,b)=>a[0].localeCompare(b[0])).map(([branchName, fdrs]) => {
                            let branchPrincipal = 0;
                            let branchGross = 0;
                            let branchTax = 0;
                            let branchNet = 0;

                            const fdrRows = fdrs.map((inv, idx) => {
                              const gross = inv.accrued_gross_interest || 0;
                              const tax = inv.estimated_tax || 0;
                              const net = gross - tax;
                              const netProceeds = inv.principal_amount + net;
                              
                              branchPrincipal += inv.principal_amount;
                              branchGross += gross;
                              branchTax += tax;
                              branchNet += netProceeds;
                              
                              grandTotalPrincipal += inv.principal_amount;
                              grandTotalGross += gross;
                              grandTotalTax += tax;
                              grandTotalNet += netProceeds;

                              return (
                                <tr key={inv.id}>
                                  {idx === 0 && <td rowSpan={fdrs.length + 1} style={{ verticalAlign: 'top', fontWeight: 'bold' }}>{bankName}</td>}
                                  {idx === 0 && <td rowSpan={fdrs.length + 1} style={{ verticalAlign: 'top' }}>{branchName}</td>}
                                  <td><strong>{inv.fdr_no}</strong></td>
                                  <td>{formatDate(inv.issue_date)}</td>
                                  <td>{formatDate(inv.maturity_date)}</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(inv.principal_amount)}</td>
                                  <td style={{ textAlign: 'right' }}>{inv.interest_rate}%</td>
                                  <td style={{ textAlign: 'right', color: '#60a5fa' }}>{formatCurrency(gross)}</td>
                                  <td style={{ textAlign: 'right', color: '#fb7185' }}>{formatCurrency(tax)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#34d399' }}>{formatCurrency(netProceeds)}</td>
                                </tr>
                              );
                            });

                            fdrRows.push(
                              <tr key={`subtotal-${bankName}-${branchName}`} style={{ background: 'rgba(255,255,255,0.02)', fontWeight: '600' }}>
                                <td colSpan={3} style={{ textAlign: 'right', color: '#94a3b8', fontSize: '12px' }}>Branch Subtotal:</td>
                                <td style={{ textAlign: 'right', color: '#38bdf8' }}>{formatCurrency(branchPrincipal)}</td>
                                <td></td>
                                <td style={{ textAlign: 'right', color: '#60a5fa' }}>{formatCurrency(branchGross)}</td>
                                <td style={{ textAlign: 'right', color: '#fb7185' }}>{formatCurrency(branchTax)}</td>
                                <td style={{ textAlign: 'right', color: '#34d399' }}>{formatCurrency(branchNet)}</td>
                              </tr>
                            );

                            return fdrRows;
                          });
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'rgba(255,255,255,0.08)', fontWeight: 'bold' }}>
                          <td colSpan={5} style={{ textAlign: 'right', color: '#fbbf24', fontSize: '13px' }}>GRAND TOTAL:</td>
                          <td style={{ textAlign: 'right', color: '#38bdf8', fontSize: '14px' }}>{formatCurrency(grandTotalPrincipal)}</td>
                          <td></td>
                          <td style={{ textAlign: 'right', color: '#60a5fa', fontSize: '13px' }}>{formatCurrency(grandTotalGross)}</td>
                          <td style={{ textAlign: 'right', color: '#fb7185', fontSize: '13px' }}>{formatCurrency(grandTotalTax)}</td>
                          <td style={{ textAlign: 'right', color: '#34d399', fontSize: '14px' }}>{formatCurrency(grandTotalNet)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* REPORT: ACCRUAL FINANCIAL STATEMENTS */}
            {activeReportTab === 'accrual-statements' && (
              <div>
                {/* CONTROLS HEADER */}
                <div className="no-print glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* ROW 1: ACCOUNTING BASIS SELECTOR (ACTUAL GL vs PORTFOLIO ACCRUAL) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Accounting Basis:
                      </div>
                      <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.06)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setStatementBasis('actual_gl');
                            if (finSubTab === 'cash-flow') setFinSubTab('trial-balance');
                          }}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: statementBasis === 'actual_gl' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                            color: statementBasis === 'actual_gl' ? '#ffffff' : 'var(--text-main)',
                            boxShadow: statementBasis === 'actual_gl' ? '0 2px 6px rgba(2,132,199,0.3)' : 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <BookOpen size={13} /> Actual General Ledger Basis (Posted JVs)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStatementBasis('portfolio');
                            if (finSubTab === 'trial-balance') setFinSubTab('balance-sheet');
                          }}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: statementBasis === 'portfolio' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'transparent',
                            color: statementBasis === 'portfolio' ? '#ffffff' : 'var(--text-main)',
                            boxShadow: statementBasis === 'portfolio' ? '0 2px 6px rgba(124,58,237,0.3)' : 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Layers size={13} /> Portfolio Accrual Model
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {statementBasis === 'actual_gl' ? (
                        <span>Compiled directly from posted vouchers adhering to PBS Uniform Chart of Accounts</span>
                      ) : (
                        <span>Simulated profit accruals and amortization across active FDR portfolio</span>
                      )}
                    </div>
                  </div>

                  {/* ROW 2: SUB TAB TOGGLE, FORMAT TOGGLE & DATE RANGE CONTROLS */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                    
                    {/* SUB TAB TOGGLE */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {statementBasis === 'actual_gl' ? (
                        <>
                          <button
                            onClick={() => setFinSubTab('trial-balance')}
                            className={finSubTab === 'trial-balance' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '13px', background: finSubTab === 'trial-balance' ? '#0284c7' : '' }}
                          >
                            Trial Balance (GL)
                          </button>
                          <button
                            onClick={() => setFinSubTab('income-statement')}
                            className={finSubTab === 'income-statement' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '13px', background: finSubTab === 'income-statement' ? '#10b981' : '' }}
                          >
                            Statement of Profit or Loss
                          </button>
                          <button
                            onClick={() => setFinSubTab('balance-sheet')}
                            className={finSubTab === 'balance-sheet' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '13px', background: finSubTab === 'balance-sheet' ? '#4f46e5' : '' }}
                          >
                            Statement of Financial Position
                          </button>
                          <button
                            onClick={() => setFinSubTab('notes')}
                            className={finSubTab === 'notes' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '13px', background: finSubTab === 'notes' ? '#d97706' : '' }}
                          >
                            Notes to Accounts (IAS 1)
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setFinSubTab('balance-sheet')}
                            className={finSubTab === 'balance-sheet' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '13px', background: finSubTab === 'balance-sheet' ? '#4f46e5' : '' }}
                          >
                            Statement of Financial Position (Accrual)
                          </button>
                          <button
                            onClick={() => setFinSubTab('income-statement')}
                            className={finSubTab === 'income-statement' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '13px', background: finSubTab === 'income-statement' ? '#059669' : '' }}
                          >
                            Statement of Profit or Loss (Accrual)
                          </button>
                          <button
                            onClick={() => setFinSubTab('cash-flow')}
                            className={finSubTab === 'cash-flow' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '13px', background: finSubTab === 'cash-flow' ? '#0284c7' : '' }}
                          >
                            Statement of Cash Flows (IAS 7)
                          </button>
                          <button
                            onClick={() => setFinSubTab('notes')}
                            className={finSubTab === 'notes' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '13px', background: finSubTab === 'notes' ? '#d97706' : '' }}
                          >
                            Notes to Accounts (IAS 1)
                          </button>
                        </>
                      )}
                    </div>

                    {/* FORMAT TOGGLE: IAS / IFRS STANDARD vs GRID LEDGER */}
                    <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.06)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setIasPresentationMode(true)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: iasPresentationMode ? '#0284c7' : 'transparent',
                          color: iasPresentationMode ? '#ffffff' : 'var(--text-main)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        🏛️ IAS / IFRS Format
                      </button>
                      <button
                        type="button"
                        onClick={() => setIasPresentationMode(false)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: !iasPresentationMode ? '#0284c7' : 'transparent',
                          color: !iasPresentationMode ? '#ffffff' : 'var(--text-main)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        📊 Grid Ledger
                      </button>
                    </div>

                    {/* DATE RANGE SELECTORS & ACTIONS */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {(finSubTab === 'balance-sheet' || (statementBasis === 'actual_gl' && finSubTab === 'trial-balance') || finSubTab === 'notes') ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>As of Date:</label>
                          <input
                            type="date"
                            value={finAsOfDate}
                            onChange={(e) => setFinAsOfDate(e.target.value)}
                            className="form-input"
                            style={{ width: '135px', padding: '6px 10px', fontSize: '12.5px' }}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>From:</label>
                          <input
                            type="date"
                            value={finStartDate}
                            onChange={(e) => setFinStartDate(e.target.value)}
                            className="form-input"
                            style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px' }}
                          />
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>To:</label>
                          <input
                            type="date"
                            value={finEndDate}
                            onChange={(e) => setFinEndDate(e.target.value)}
                            className="form-input"
                            style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px' }}
                          />
                        </div>
                      )}

                      <button onClick={loadFinancialStatements} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCcw size={13} /> Refresh
                      </button>
                      <button
                        onClick={() => triggerPrint('portrait')}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        title="Print Statement (Portrait A4)"
                      >
                        <Printer size={13} /> Print Statement
                      </button>
                    </div>

                  </div>
                </div>

                {finLoading || !financialStatementsData ? (
                  <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                    Loading Financial Statements...
                  </div>
                ) : (() => {
                  // Common IAS Note reference resolver
                  const getAccountNoteRef = (code, type) => {
                    if (!code) return '—';
                    const c = String(code);
                    if (c.startsWith('131')) return 'Note 3.0';
                    if (c.startsWith('136')) return 'Note 4.0';
                    if (c.startsWith('165')) return 'Note 5.0';
                    if (c.startsWith('419') || c.startsWith('4')) return 'Note 6.0';
                    if (c.startsWith('922') || c.startsWith('9')) return 'Note 7.0';
                    if (c.startsWith('235') || c.startsWith('2')) return 'Note 8.0';
                    if (c.startsWith('310') || c.startsWith('320') || c.startsWith('3')) return 'Note 9.0';
                    if (type === 'Asset') return 'Note 4.0';
                    if (type === 'Liability') return 'Note 8.0';
                    if (type === 'Equity') return 'Note 9.0';
                    if (type === 'Revenue') return 'Note 6.0';
                    if (type === 'Expense') return 'Note 7.0';
                    return '—';
                  };

                  // Dual Logo Official PBS & BREB Header
                  const renderIasHeader = (title, subtitle, isBalanced = null, balanceLabel = '') => (
                    <div style={{ marginBottom: '22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2.5px solid #0f172a', paddingBottom: '14px', marginBottom: '12px' }}>
                        {/* PBS Samity Logo (Left) */}
                        <div style={{ width: '90px', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          {settings.org_secondary_logo_url ? (
                            <img src={settings.org_secondary_logo_url} alt="PBS Logo" style={{ maxHeight: '72px', maxWidth: '85px', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ width: '60px', height: '60px', border: '1.5px dashed #94a3b8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                              PBS LOGO
                            </div>
                          )}
                        </div>

                        {/* Center Entity & Statement Details */}
                        <div style={{ flex: 1, textAlign: 'center', padding: '0 12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' }}>
                            BANGLADESH RURAL ELECTRIFICATION BOARD (BREB)
                          </div>
                          <h1 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: '3px 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            {settings.org_name || 'PALLI BIDYUT SAMITI'}
                          </h1>
                          {settings.org_address && (
                            <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '2px' }}>
                              {settings.org_address}
                            </div>
                          )}
                          <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0369a1', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {title}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>
                            {subtitle}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', fontStyle: 'italic' }}>
                            (Amounts in Bangladeshi Taka — BDT)
                          </div>
                        </div>

                        {/* BREB Emblem Logo (Right) */}
                        <div style={{ width: '90px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {settings.org_logo_url ? (
                            <img src={settings.org_logo_url} alt="BREB Logo" style={{ maxHeight: '72px', maxWidth: '85px', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ width: '60px', height: '60px', border: '1.5px dashed #94a3b8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                              BREB LOGO
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Verification Status & Reporting Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <strong>STANDARD:</strong> IAS 1 / IFRS &amp; BREB PBS Accounting Manual
                        </div>
                        {isBalanced !== null && (
                          <div>
                            {isBalanced ? (
                              <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '4px', fontWeight: '700', fontSize: '11px', border: '1px solid #86efac' }}>
                                ✔ {balanceLabel || 'Statement is Balanced'}
                              </span>
                            ) : (
                              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 10px', borderRadius: '4px', fontWeight: '700', fontSize: '11px', border: '1px solid #fca5a5' }}>
                                ✖ {balanceLabel || 'Unbalanced Statement'}
                              </span>
                            )}
                          </div>
                        )}
                        <div>
                          <strong>REPORT RUN DATE:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  );

                  // 3-Tier Official PBS Signatory Block with Uploaded PNG Signatures
                  const renderIasSignatories = () => (
                    <div style={{ marginTop: '36px', paddingTop: '14px' }}>
                      {/* IAS Footnote */}
                      <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#475569', textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginBottom: '28px' }}>
                        "The annexed notes from 1 to 9 form an integral part of these financial statements."
                      </div>

                      {/* Signatories Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', textAlign: 'center' }}>
                        {/* 1. Prepared By */}
                        <div>
                          {settings.signatory_accountant_signature ? (
                            <img src={settings.signatory_accountant_signature} alt="Signature" style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px' }} />
                          ) : (
                            <div style={{ height: '40px' }} />
                          )}
                          <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '6px' }}>
                            {settings.signatory_accountant_name && (
                              <div style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a' }}>( {settings.signatory_accountant_name} )</div>
                            )}
                            <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '600' }}>
                              {settings.signatory_accountant || 'Officer (Accounts)'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>Prepared By</div>
                            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Date: ........................</div>
                          </div>
                        </div>

                        {/* 2. Checked By */}
                        <div>
                          {settings.signatory_agm_signature ? (
                            <img src={settings.signatory_agm_signature} alt="Signature" style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px' }} />
                          ) : (
                            <div style={{ height: '40px' }} />
                          )}
                          <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '6px' }}>
                            {settings.signatory_agm_name && (
                              <div style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a' }}>( {settings.signatory_agm_name} )</div>
                            )}
                            <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '600' }}>
                              {settings.signatory_agm_finance || 'AGM (Finance)'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>Checked By</div>
                            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Date: ........................</div>
                          </div>
                        </div>

                        {/* 3. Approved By */}
                        <div>
                          {settings.signatory_gm_signature ? (
                            <img src={settings.signatory_gm_signature} alt="Signature" style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px' }} />
                          ) : (
                            <div style={{ height: '40px' }} />
                          )}
                          <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '6px' }}>
                            {settings.signatory_gm_name && (
                              <div style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a' }}>( {settings.signatory_gm_name} )</div>
                            )}
                            <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '600' }}>
                              {settings.signatory_gm || 'General Manager'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>Approved By</div>
                            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>Date: ........................</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  // DEDICATED SUB-TAB: NOTES TO THE FINANCIAL STATEMENTS (IAS 1 & BREB Manual)
                  if (finSubTab === 'notes') {
                    const activeInvs = (investments || []).filter(inv => inv.status === 'Active');
                    const bankGroups = activeInvs.reduce((acc, inv) => {
                      const bName = inv.bank_name || 'Other Scheduled Bank';
                      if (!acc[bName]) {
                        acc[bName] = { bank_name: bName, count: 0, total_principal: 0, total_weight_rate: 0, accrued_interest: 0 };
                      }
                      acc[bName].count += 1;
                      acc[bName].total_principal += (inv.principal_amount || 0);
                      acc[bName].total_weight_rate += ((inv.principal_amount || 0) * (inv.interest_rate || 0));
                      // Provisions up to date
                      const invProvs = (provisions || []).filter(p => p.investment_id === inv.id && p.provision_date <= finAsOfDate);
                      if (invProvs.length > 0) {
                        invProvs.forEach(p => acc[bName].accrued_interest += (p.gross_interest || 0));
                      }
                      return acc;
                    }, {});
                    const bankSchedule = Object.values(bankGroups).sort((a, b) => b.total_principal - a.total_principal);
                    const totalBankPrincipal = bankSchedule.reduce((s, b) => s + b.total_principal, 0);
                    const totalBankAccrued = bankSchedule.reduce((s, b) => s + b.accrued_interest, 0);

                    return (
                      <div className="printable-area" style={{ background: '#ffffff', color: '#0f172a', padding: '36px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '980px', margin: '0 auto', fontFamily: "'Nikosh', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                        {renderIasHeader('NOTES TO THE FINANCIAL STATEMENTS', `As at ${formatDate(finAsOfDate)}`)}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '12.5px', color: '#1e293b', lineHeight: '1.6' }}>
                          
                          {/* NOTE 1.0 */}
                          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                              Note 1.0: Legal Status and Nature of Operations
                            </h3>
                            <p style={{ margin: '0 0 6px 0', color: '#334155' }}>
                              <strong>1.1 Entity Profile:</strong> {settings.org_name || 'Palli Bidyut Samiti (PBS)'} is an autonomous consumer-owned utility cooperative established under the Bangladesh Rural Electrification Board (BREB) Act, 2013 (Act No. 57 of 2013). The registered office is located at {settings.org_address || 'Samiti Headquarters, Bangladesh'}.
                            </p>
                            <p style={{ margin: 0, color: '#334155' }}>
                              <strong>1.2 Nature of Investment Operations:</strong> The Samiti invests its accumulated fund capital, tariff deficit subsidies, employee pension/gratuity reserves, and operational funds in Fixed Deposit Receipts (FDR) and term instruments across scheduled government and private commercial banks strictly complying with the BREB Fund Investment Policy Guidelines.
                            </p>
                          </div>

                          {/* NOTE 2.0 */}
                          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                              Note 2.0: Summary of Significant Accounting Policies
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', color: '#334155' }}>
                              <div>
                                <strong>2.1 Basis of Preparation:</strong> Prepared under International Accounting Standards (IAS 1 - <em>Presentation of Financial Statements</em>), IFRS 9 (<em>Financial Instruments</em>), and the Uniform System of Accounts prescribed in the BREB PBS Accounting Manual.
                              </div>
                              <div>
                                <strong>2.2 Accrual Basis of Accounting:</strong> Transactions and economic events are recognized when they occur and are recorded in the accounting periods to which they relate.
                              </div>
                              <div>
                                <strong>2.3 Revenue Recognition:</strong> Interest income on FDR investments is recognized on a time-proportionate accrual basis taking into account the principal outstanding and effective contractual interest rate.
                              </div>
                              <div>
                                <strong>2.4 Statutory Deductions &amp; Taxation:</strong> Advance Income Tax (AIT) is deducted at source by depository banks under Section 102/103 of the Income Tax Act, 2023. Excise duty is levied pursuant to the annual Finance Act of Bangladesh.
                              </div>
                            </div>
                          </div>

                          {/* NOTE 3.0 */}
                          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                              Note 3.0: Cash and Cash Equivalents (Bank Settlement Accounts)
                            </h3>
                            <p style={{ margin: '0 0 8px 0', color: '#475569' }}>
                              Represents operational settlement balances maintained at commercial banks for investment placements, interest receipts, and maturity liquidation.
                            </p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>GL Account Code</th>
                                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Account Description</th>
                                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Balance as of Date (BDT)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 10px' }}><code>131.10.000</code></td>
                                  <td style={{ padding: '6px 10px' }}>Cash at Bank - FDR Settlement &amp; Liquidation Account</td>
                                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700' }}>Operational Bank Account</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* NOTE 4.0 */}
                          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                              Note 4.0: Fixed Deposit Receipts (FDR) Investments — Schedule of Bank Deposits
                            </h3>
                            <p style={{ margin: '0 0 8px 0', color: '#475569' }}>
                              Detailed schedule of term deposits maintained across scheduled commercial banks as of {formatDate(finAsOfDate)}:
                            </p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderTop: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
                                  <th style={{ padding: '7px 8px', textAlign: 'center', width: '35px' }}>SL</th>
                                  <th style={{ padding: '7px 10px', textAlign: 'left' }}>Bank Name &amp; Institution</th>
                                  <th style={{ padding: '7px 8px', textAlign: 'center', width: '70px' }}>Active FDRs</th>
                                  <th style={{ padding: '7px 10px', textAlign: 'right', width: '110px' }}>Weighted Rate</th>
                                  <th style={{ padding: '7px 12px', textAlign: 'right', width: '140px' }}>Principal Amount (BDT)</th>
                                  <th style={{ padding: '7px 10px', textAlign: 'right', width: '80px' }}>Portfolio %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bankSchedule.length === 0 ? (
                                  <tr>
                                    <td colSpan="6" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>No active FDR investments recorded</td>
                                  </tr>
                                ) : (
                                  bankSchedule.map((b, idx) => (
                                    <tr key={b.bank_name} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                                      <td style={{ padding: '6px 10px', fontWeight: '600' }}>{b.bank_name}</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{b.count}</td>
                                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#0369a1', fontWeight: '600' }}>
                                        {b.total_principal > 0 ? (b.total_weight_rate / b.total_principal).toFixed(2) + '%' : '—'}
                                      </td>
                                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700' }}>
                                        {formatCurrency(b.total_principal)}
                                      </td>
                                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#64748b' }}>
                                        {totalBankPrincipal > 0 ? ((b.total_principal / totalBankPrincipal) * 100).toFixed(1) + '%' : '0%'}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3.5px double #0f172a', fontWeight: '900' }}>
                                  <td colSpan="2" style={{ padding: '8px 10px', textAlign: 'left' }}>TOTAL SCHEDULED BANK DEPOSITS</td>
                                  <td style={{ padding: '8px 8px', textAlign: 'center' }}>{bankSchedule.reduce((s, b) => s + b.count, 0)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>—</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a' }}>Tk. {formatCurrency(totalBankPrincipal)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>100.0%</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* NOTE 5.0 */}
                          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                              Note 5.0: Advance Income Tax (AIT / Withholding Tax)
                            </h3>
                            <p style={{ margin: 0, color: '#334155' }}>
                              Income tax is deducted at source by depository banks upon interest accrual/realization under Section 102/103 of the Income Tax Act, 2023. PBS entities providing electronic Taxpayer Identification Number (e-TIN) are assessed at 10%, whereas non-TIN accounts are withheld at 20%. The cumulative tax deducted is recognized as an advance tax expense and credit is claimed during annual corporate tax assessment.
                            </p>
                          </div>

                          {/* NOTE 6.0 */}
                          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                              Note 6.0: Interest Income on FDR Investments
                            </h3>
                            <p style={{ margin: 0, color: '#334155' }}>
                              Represents gross contractual interest accrued and realized on term deposits across all PBS fund accounts. Interest is recognized on an accrual basis for active investments and settled upon maturity renewal or encashment into the settlement account.
                            </p>
                          </div>

                          {/* NOTE 7.0 */}
                          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                              Note 7.0: Excise Duty &amp; Bank Charges
                            </h3>
                            <p style={{ margin: 0, color: '#334155' }}>
                              Statutory excise duty levied annually by scheduled commercial banks on FDR investment account balances in accordance with the progressive slabs stipulated in the First Schedule of the Finance Act of Bangladesh. Bank service charges and document fees are recognized as realized.
                            </p>
                          </div>

                          {/* NOTE 8.0 & 9.0 */}
                          <div>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                              Note 8.0 &amp; 9.0: Accrued Liabilities &amp; Fund Capital Reserves
                            </h3>
                            <p style={{ margin: 0, color: '#334155' }}>
                              Accrued liabilities include provisions for taxes and statutory excise duties payable upon maturity. Fund capital reserves comprise designated fund categories (General Fund, Tariff Deficit Fund, Pension and Gratuity Fund, Employees Provident Fund, Depreciation Reserve Fund) maintained strictly in accordance with BREB financial bylaws.
                            </p>
                          </div>

                        </div>

                        {renderIasSignatories()}
                      </div>
                    );
                  }

                  // ════════════════════════════════════════════════════════════
                  // 1. ACTUAL GENERAL LEDGER STATEMENTS
                  // ════════════════════════════════════════════════════════════
                  if (statementBasis === 'actual_gl') {
                    const actualGl = financialStatementsData.actual_gl;
                    if (!actualGl || !actualGl.has_posted_entries) {
                      return (
                        <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '14px', border: '1px dashed var(--border-color)', margin: '20px 0' }}>
                          <FileText size={48} style={{ color: '#0284c7', margin: '0 auto 16px auto', display: 'block' }} />
                          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                            No Posted Journal Vouchers in the General Ledger
                          </h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
                            Actual financial statements (Trial Balance, Income Statement, and Balance Sheet) are compiled directly from posted General Ledger Journal Vouchers. To generate your statements, post the monthly settlement JV or record a manual journal entry.
                          </p>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => { setActiveReportTab('auto-jv'); setJvSubSection('auto-jv'); }}
                              className="btn btn-primary"
                              style={{ fontSize: '13px', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Send size={14} /> Open Auto JV &amp; Post to GL
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveReportTab('auto-jv'); setJvSubSection('manual-jv'); }}
                              className="btn btn-secondary"
                              style={{ fontSize: '13px', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Plus size={14} /> Post Manual Journal Entry
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatementBasis('portfolio')}
                              className="btn btn-secondary"
                              style={{ fontSize: '13px', padding: '8px 18px' }}
                            >
                              Switch to Portfolio Accrual Model
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // A. GL TRIAL BALANCE
                    if (finSubTab === 'trial-balance') {
                      const tb = actualGl.trial_balance;
                      const typeOrder = [
                        { type: 'Asset', label: 'I. ASSETS & INVESTMENTS', roman: 'I' },
                        { type: 'Liability', label: 'II. LIABILITIES & STATUTORY PROVISIONS', roman: 'II' },
                        { type: 'Equity', label: 'III. EQUITY & FUND RESERVES', roman: 'III' },
                        { type: 'Revenue', label: 'IV. REVENUE / OPERATING INCOME', roman: 'IV' },
                        { type: 'Expense', label: 'V. FINANCIAL EXPENDITURES & DEDUCTIONS', roman: 'V' }
                      ];

                      // If IAS Presentation Mode is OFF, show the Legacy Grid Ledger
                      if (!iasPresentationMode) {
                        const grouped = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].reduce((acc, type) => {
                          const rows = (tb.items || []).filter(it => it.account_type === type);
                          if (rows.length > 0) acc.push({ type, rows });
                          return acc;
                        }, []);

                        return (
                          <div className="printable-area" style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '28px', maxWidth: '960px', margin: '0 auto', color: '#0f172a' }}>
                            {renderIasHeader('GENERAL LEDGER TRIAL BALANCE (GRID VIEW)', `As at ${formatDate(finAsOfDate)}`, tb.is_balanced, tb.is_balanced ? `Balanced: Tk. ${formatCurrency(tb.grand_debit)}` : 'Unbalanced')}
                            <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
                              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #334155' }}>
                                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '800' }}>Account Code</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '800' }}>Account Title</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '800' }}>Type</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800' }}>Dr. Amount</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800' }}>Cr. Amount</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800' }}>Net Debit</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800' }}>Net Credit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {grouped.map(({ type, rows }) => (
                                    <React.Fragment key={`hdr-${type}`}>
                                      <tr style={{ background: '#f1f5f9', fontWeight: '700', color: '#334155' }}>
                                        <td colSpan="7" style={{ padding: '7px 10px' }}>▸ {type.toUpperCase()}</td>
                                      </tr>
                                      {rows.map((it, idx) => (
                                        <tr key={it.account_code} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                          <td style={{ padding: '6px 10px' }}><code>{it.account_code}</code></td>
                                          <td style={{ padding: '6px 10px', fontWeight: '600' }}>{it.account_name}</td>
                                          <td style={{ padding: '6px 10px' }}>{it.account_type}</td>
                                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>{it.total_debit > 0 ? formatCurrency(it.total_debit) : '—'}</td>
                                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>{it.total_credit > 0 ? formatCurrency(it.total_credit) : '—'}</td>
                                          <td style={{ padding: '6px 10px', textAlign: 'right', color: '#0284c7', fontWeight: '700' }}>{it.net_debit > 0 ? formatCurrency(it.net_debit) : '—'}</td>
                                          <td style={{ padding: '6px 10px', textAlign: 'right', color: '#dc2626', fontWeight: '700' }}>{it.net_credit > 0 ? formatCurrency(it.net_credit) : '—'}</td>
                                        </tr>
                                      ))}
                                    </React.Fragment>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr style={{ borderTop: '2px solid #000', fontWeight: '900', background: '#e2e8f0' }}>
                                    <td colSpan="3" style={{ padding: '10px' }}>GRAND TOTAL</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(tb.grand_debit)}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(tb.grand_credit)}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(tb.net_debit_sum)}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(tb.net_credit_sum)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            {renderIasSignatories()}
                          </div>
                        );
                      }

                      // IAS 1 STANDARD TRIAL BALANCE PRESENTATION (2 Monetary Columns Debit & Credit)
                      let runningSl = 0;
                      return (
                        <div className="printable-area" style={{ background: '#ffffff', color: '#0f172a', padding: '36px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '980px', margin: '0 auto', fontFamily: "'Nikosh', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                          {renderIasHeader('GENERAL LEDGER TRIAL BALANCE', `As at ${formatDate(finAsOfDate)}`, tb.is_balanced, tb.is_balanced ? `Balanced: Tk. ${formatCurrency(tb.grand_debit)}` : 'Unbalanced — Debit Sum ≠ Credit Sum')}

                          {/* IAS TRIAL BALANCE TABLE */}
                          <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                                  <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>SL</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'left', width: '115px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>ACCOUNT CODE</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>ACCOUNT TITLE &amp; PARTICULARS</th>
                                  <th style={{ padding: '8px 8px', textAlign: 'center', width: '75px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>NOTE</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '145px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>DEBIT (BDT)</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '145px', fontWeight: '800' }}>CREDIT (BDT)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {typeOrder.map(group => {
                                  const rows = (tb.items || []).filter(it => it.account_type === group.type);
                                  if (rows.length === 0) return null;

                                  // Calculate group debits and credits
                                  let groupDebit = 0;
                                  let groupCredit = 0;

                                  return (
                                    <React.Fragment key={group.type}>
                                      {/* Group Header Row */}
                                      <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '12px', letterSpacing: '0.04em', color: '#0f172a' }}>
                                        <td colSpan="6" style={{ padding: '8px 12px', borderTop: '1.5px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                                          {group.label}
                                        </td>
                                      </tr>

                                      {/* Item Rows */}
                                      {rows.map((it, idx) => {
                                        runningSl += 1;
                                        // Under IAS, display net debit in Debit column, net credit in Credit column
                                        const drVal = it.net_debit > 0 ? it.net_debit : (it.total_debit > 0 && it.total_credit === 0 ? it.total_debit : 0);
                                        const crVal = it.net_credit > 0 ? it.net_credit : (it.total_credit > 0 && it.total_debit === 0 ? it.total_credit : 0);
                                        groupDebit += drVal;
                                        groupCredit += crVal;
                                        const noteRef = getAccountNoteRef(it.account_code, it.account_type);

                                        return (
                                          <tr key={it.account_code} style={{ background: idx % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '11.5px' }}>
                                              {runningSl}
                                            </td>
                                            <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1' }}>
                                              <code style={{ fontWeight: '800', color: '#0369a1', fontSize: '11.5px' }}>{it.account_code}</code>
                                            </td>
                                            <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600', color: '#1e293b' }}>
                                              {it.account_name}
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                                {noteRef}
                                              </span>
                                            </td>
                                            <td style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', fontWeight: drVal > 0 ? '700' : '400', color: drVal > 0 ? '#0f172a' : '#94a3b8' }}>
                                              {drVal > 0 ? formatCurrency(drVal) : '—'}
                                            </td>
                                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: crVal > 0 ? '700' : '400', color: crVal > 0 ? '#0f172a' : '#94a3b8' }}>
                                              {crVal > 0 ? formatCurrency(crVal) : '—'}
                                            </td>
                                          </tr>
                                        );
                                      })}

                                      {/* Group Sub-total Row */}
                                      <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '12px', borderTop: '1px solid #94a3b8', borderBottom: '1px solid #cbd5e1' }}>
                                        <td colSpan="4" style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#475569', textTransform: 'uppercase' }}>
                                          Sub-Total: {group.label}
                                        </td>
                                        <td style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#0f172a' }}>
                                          {groupDebit > 0 ? formatCurrency(groupDebit) : '—'}
                                        </td>
                                        <td style={{ padding: '6px 12px', textAlign: 'right', color: '#0f172a' }}>
                                          {groupCredit > 0 ? formatCurrency(groupCredit) : '—'}
                                        </td>
                                      </tr>
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                {/* IAS Universal Grand Total with Accounting Double Underline */}
                                <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3.5px double #0f172a', fontWeight: '900', fontSize: '13px' }}>
                                  <td colSpan="4" style={{ padding: '10px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    GRAND TOTAL (TRIAL BALANCE)
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#0f172a' }}>
                                    Tk. {formatCurrency(tb.grand_debit)}
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0f172a' }}>
                                    Tk. {formatCurrency(tb.grand_credit)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {renderIasSignatories()}
                        </div>
                      );
                    }

                    // B. GL STATEMENT OF PROFIT OR LOSS (INCOME STATEMENT)
                    if (finSubTab === 'income-statement') {
                      const inc = actualGl.income_statement;
                      let plSl = 0;

                      return (
                        <div className="printable-area" style={{ background: '#ffffff', color: '#0f172a', padding: '36px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '980px', margin: '0 auto', fontFamily: "'Nikosh', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                          {renderIasHeader('STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME', `For the period from ${formatDate(finStartDate)} to ${formatDate(finEndDate)}`)}

                          <div style={{ maxWidth: '820px', margin: '0 auto', marginBottom: '24px' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                                  <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>SL</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>PARTICULARS</th>
                                  <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>NOTE</th>
                                  <th style={{ padding: '8px 14px', textAlign: 'right', width: '180px', fontWeight: '800' }}>AMOUNT (BDT)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* I. REVENUE */}
                                <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '12px', color: '#0369a1' }}>
                                  <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                                    I.&nbsp; REVENUE FROM OPERATIONS &amp; INVESTMENTS
                                  </td>
                                </tr>
                                {inc.revenues.length === 0 ? (
                                  <tr>
                                    <td colSpan="4" style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                      No revenue entries recognized in this period
                                    </td>
                                  </tr>
                                ) : (
                                  inc.revenues.map((it, idx) => {
                                    plSl += 1;
                                    return (
                                      <tr key={it.account_code} style={{ background: idx % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>{plSl}</td>
                                        <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                          {it.account_name} &nbsp;<code style={{ fontSize: '11px', color: '#0369a1' }}>({it.account_code})</code>
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                          <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                            {getAccountNoteRef(it.account_code, 'Revenue')}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                          {formatCurrency(it.net_amount)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                                <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                  <td colSpan="3" style={{ padding: '8px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#0369a1', textTransform: 'uppercase' }}>
                                    Total Revenue from Operations (A)
                                  </td>
                                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#0369a1', fontWeight: '800', fontSize: '12.5px' }}>
                                    Tk. {formatCurrency(inc.total_revenue)}
                                  </td>
                                </tr>

                                {/* II. EXPENSES */}
                                <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '12px', color: '#b91c1c' }}>
                                  <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1.5px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', paddingTop: '12px' }}>
                                    II.&nbsp; FINANCIAL EXPENDITURES &amp; STATUTORY DEDUCTIONS
                                  </td>
                                </tr>
                                {inc.expenses.length === 0 ? (
                                  <tr>
                                    <td colSpan="4" style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                      No financial expense entries recognized in this period
                                    </td>
                                  </tr>
                                ) : (
                                  inc.expenses.map((it, idx) => {
                                    plSl += 1;
                                    return (
                                      <tr key={it.account_code} style={{ background: idx % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>{plSl}</td>
                                        <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                          {it.account_name} &nbsp;<code style={{ fontSize: '11px', color: '#b91c1c' }}>({it.account_code})</code>
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                          <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                            {getAccountNoteRef(it.account_code, 'Expense')}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                          {formatCurrency(it.net_amount)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                                <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                  <td colSpan="3" style={{ padding: '8px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#b91c1c', textTransform: 'uppercase' }}>
                                    Total Financial Expenditures &amp; Deductions (B)
                                  </td>
                                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#b91c1c', fontWeight: '800', fontSize: '12.5px' }}>
                                    Tk. {formatCurrency(inc.total_expenses)}
                                  </td>
                                </tr>

                                {/* III. NET SURPLUS */}
                                <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3.5px double #0f172a', fontWeight: '900', fontSize: '13px' }}>
                                  <td colSpan="3" style={{ padding: '10px 12px', borderRight: '1px solid #cbd5e1', color: inc.net_surplus >= 0 ? '#15803d' : '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    III.&nbsp; NET SURPLUS / (DEFICIT) FOR THE PERIOD (A - B)
                                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal', textTransform: 'none', marginTop: '2px' }}>
                                      Transferred to Statement of Financial Position / Fund Equity
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 14px', textAlign: 'right', color: inc.net_surplus >= 0 ? '#15803d' : '#b91c1c', fontSize: '14px', fontWeight: '900' }}>
                                    Tk. {formatCurrency(inc.net_surplus)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {renderIasSignatories()}
                        </div>
                      );
                    }

                    // C. GL STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
                    if (finSubTab === 'balance-sheet') {
                      const bs = actualGl.balance_sheet;
                      let bsSl = 0;

                      return (
                        <div className="printable-area" style={{ background: '#ffffff', color: '#0f172a', padding: '36px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '980px', margin: '0 auto', fontFamily: "'Nikosh', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                          {renderIasHeader('STATEMENT OF FINANCIAL POSITION', `As at ${formatDate(finAsOfDate)}`, bs.is_balanced, bs.is_balanced ? `Balanced: Tk. ${formatCurrency(bs.total_assets)}` : 'Unbalanced Balance Sheet')}

                          <div style={{ maxWidth: '820px', margin: '0 auto', marginBottom: '24px' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                                  <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>SL</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>PARTICULARS</th>
                                  <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>NOTE</th>
                                  <th style={{ padding: '8px 14px', textAlign: 'right', width: '180px', fontWeight: '800' }}>AMOUNT (BDT)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* I. ASSETS */}
                                <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '12px', color: '#0369a1' }}>
                                  <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                                    I.&nbsp; ASSETS &amp; INVESTMENTS
                                  </td>
                                </tr>
                                {bs.assets.length === 0 ? (
                                  <tr>
                                    <td colSpan="4" style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                      No asset balances recorded as of date
                                    </td>
                                  </tr>
                                ) : (
                                  bs.assets.map((a, idx) => {
                                    bsSl += 1;
                                    return (
                                      <tr key={a.account_code} style={{ background: idx % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>{bsSl}</td>
                                        <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                          {a.account_name} &nbsp;<code style={{ fontSize: '11px', color: '#0369a1' }}>({a.account_code})</code>
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                          <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                            {getAccountNoteRef(a.account_code, 'Asset')}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                          {formatCurrency(a.balance)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                                <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '3.5px double #0f172a', fontWeight: '900', background: '#f8fafc' }}>
                                  <td colSpan="3" style={{ padding: '9px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#0369a1', textTransform: 'uppercase' }}>
                                    TOTAL ASSETS
                                  </td>
                                  <td style={{ padding: '9px 14px', textAlign: 'right', color: '#0369a1', fontWeight: '900', fontSize: '13.5px' }}>
                                    Tk. {formatCurrency(bs.total_assets)}
                                  </td>
                                </tr>

                                {/* II. LIABILITIES */}
                                <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '12px', color: '#b91c1c' }}>
                                  <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1.5px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', paddingTop: '14px' }}>
                                    II.&nbsp; LIABILITIES &amp; STATUTORY PROVISIONS
                                  </td>
                                </tr>
                                {bs.liabilities.length === 0 ? (
                                  <tr>
                                    <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                      Nil — No current liability balances outstanding
                                    </td>
                                  </tr>
                                ) : (
                                  bs.liabilities.map((l, idx) => {
                                    bsSl += 1;
                                    return (
                                      <tr key={l.account_code} style={{ background: idx % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>{bsSl}</td>
                                        <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                          {l.account_name} &nbsp;<code style={{ fontSize: '11px', color: '#b91c1c' }}>({l.account_code})</code>
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                          <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                            {getAccountNoteRef(l.account_code, 'Liability')}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                          {formatCurrency(l.balance)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                                <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                  <td colSpan="3" style={{ padding: '7px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#b91c1c', textTransform: 'uppercase' }}>
                                    TOTAL LIABILITIES
                                  </td>
                                  <td style={{ padding: '7px 14px', textAlign: 'right', color: '#b91c1c', fontWeight: '800' }}>
                                    Tk. {formatCurrency(bs.total_liabilities)}
                                  </td>
                                </tr>

                                {/* III. FUND CAPITAL & RESERVES */}
                                <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '12px', color: '#15803d' }}>
                                  <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1.5px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', paddingTop: '14px' }}>
                                    III.&nbsp; FUND CAPITAL &amp; RESERVES (EQUITY)
                                  </td>
                                </tr>
                                {bs.equity.map((e, idx) => {
                                  bsSl += 1;
                                  return (
                                    <tr key={e.account_code} style={{ background: idx % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>{bsSl}</td>
                                      <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                        {e.account_name} &nbsp;<code style={{ fontSize: '11px', color: '#15803d' }}>({e.account_code})</code>
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                        <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                          {getAccountNoteRef(e.account_code, 'Equity')}
                                        </span>
                                      </td>
                                      <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                        {formatCurrency(e.balance)}
                                      </td>
                                    </tr>
                                  );
                                })}
                                {/* Accumulated Surplus */}
                                <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>*</td>
                                  <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                    Accumulated Retained Surplus from Operations
                                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Net profit accumulated from realized investment settlements</div>
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 9.0</span>
                                  </td>
                                  <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                                    {formatCurrency(bs.accumulated_surplus)}
                                  </td>
                                </tr>
                                <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                  <td colSpan="3" style={{ padding: '7px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#15803d', textTransform: 'uppercase' }}>
                                    TOTAL FUND EQUITY
                                  </td>
                                  <td style={{ padding: '7px 14px', textAlign: 'right', color: '#15803d', fontWeight: '800' }}>
                                    Tk. {formatCurrency(bs.total_equity + (bs.accumulated_surplus || 0))}
                                  </td>
                                </tr>

                                {/* TOTAL LIABILITIES & EQUITY */}
                                <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3.5px double #0f172a', fontWeight: '900', fontSize: '13px' }}>
                                  <td colSpan="3" style={{ padding: '10px 12px', borderRight: '1px solid #cbd5e1', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    TOTAL LIABILITIES &amp; FUND EQUITY
                                  </td>
                                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0f172a', fontSize: '13.5px', fontWeight: '900' }}>
                                    Tk. {formatCurrency(bs.total_liabilities_and_equity)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {renderIasSignatories()}
                        </div>
                      );
                    }
                  }

                  // ════════════════════════════════════════════════════════════
                  // 2. PORTFOLIO ACCRUAL STATEMENTS (IAS PRESENTATION)
                  // ════════════════════════════════════════════════════════════
                  // A. PORTFOLIO BALANCE SHEET
                  if (finSubTab === 'balance-sheet') {
                    const bs = financialStatementsData.balance_sheet;
                    return (
                      <div className="printable-area" style={{ background: '#ffffff', color: '#0f172a', padding: '36px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '980px', margin: '0 auto', fontFamily: "'Nikosh', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                        {renderIasHeader('STATEMENT OF FINANCIAL POSITION', `Accrual Model — As at ${formatDate(bs.as_of_date)}`, true, `Total Assets: Tk. ${formatCurrency(bs.assets.total_assets)}`)}

                        <div style={{ maxWidth: '820px', margin: '0 auto', marginBottom: '28px' }}>
                          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                                <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>SL</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>PARTICULARS</th>
                                <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>NOTE</th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', width: '180px', fontWeight: '800' }}>AMOUNT (BDT)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* I. FINANCIAL ASSETS */}
                              <tr style={{ background: '#f1f5f9', fontWeight: '800', fontSize: '12px', color: '#0369a1' }}>
                                <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0' }}>
                                  I.&nbsp; FINANCIAL ASSETS (INVESTMENTS &amp; RECEIVABLES)
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>1</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  FDR &amp; Certificate Investments (Principal Placed)
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 4.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700' }}>
                                  {formatCurrency(bs.assets.fdr_principal_investments)}
                                </td>
                              </tr>
                              <tr style={{ background: '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>2</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Accrued Interest Receivable (Accrual Yield Earned)
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 6.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0369a1' }}>
                                  {formatCurrency(bs.assets.accrued_interest_receivable)}
                                </td>
                              </tr>
                              <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '3.5px double #0f172a', fontWeight: '900', background: '#f8fafc' }}>
                                <td colSpan="3" style={{ padding: '9px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#0369a1', textTransform: 'uppercase' }}>
                                  TOTAL FINANCIAL ASSETS
                                </td>
                                <td style={{ padding: '9px 14px', textAlign: 'right', color: '#0369a1', fontWeight: '900', fontSize: '13.5px' }}>
                                  Tk. {formatCurrency(bs.assets.total_assets)}
                                </td>
                              </tr>

                              {/* II. LIABILITIES */}
                              <tr style={{ background: '#f1f5f9', fontWeight: '800', fontSize: '12px', color: '#b91c1c' }}>
                                <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1.5px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', paddingTop: '14px' }}>
                                  II.&nbsp; LIABILITIES &amp; STATUTORY PROVISIONS
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>3</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Advance Income Tax (AIT) Provision Payable
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 5.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                                  {formatCurrency(bs.liabilities.accrued_tax_payable)}
                                </td>
                              </tr>
                              <tr style={{ background: '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>4</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Accrued Excise Duty Payable
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 7.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                                  {formatCurrency(bs.liabilities.accrued_excise_duty_payable)}
                                </td>
                              </tr>
                              <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                <td colSpan="3" style={{ padding: '7px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#b91c1c', textTransform: 'uppercase' }}>
                                  TOTAL ACCRUED LIABILITIES
                                </td>
                                <td style={{ padding: '7px 14px', textAlign: 'right', color: '#b91c1c', fontWeight: '800' }}>
                                  Tk. {formatCurrency(bs.liabilities.total_liabilities)}
                                </td>
                              </tr>

                              {/* III. FUND CAPITAL & RESERVES */}
                              <tr style={{ background: '#f1f5f9', fontWeight: '800', fontSize: '12px', color: '#15803d' }}>
                                <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1.5px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', paddingTop: '14px' }}>
                                  III.&nbsp; FUND CAPITAL &amp; RESERVES (NET EQUITY)
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>5</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Accumulated Fund Capital
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 9.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700' }}>
                                  {formatCurrency(bs.fund_equity.accumulated_fund_capital)}
                                </td>
                              </tr>
                              <tr style={{ background: '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>6</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Net Accrued Interest Surplus
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 9.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                                  {formatCurrency(bs.fund_equity.net_accrued_surplus)}
                                </td>
                              </tr>
                              <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                <td colSpan="3" style={{ padding: '7px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#15803d', textTransform: 'uppercase' }}>
                                  TOTAL NET FUND EQUITY
                                </td>
                                <td style={{ padding: '7px 14px', textAlign: 'right', color: '#15803d', fontWeight: '800' }}>
                                  Tk. {formatCurrency(bs.fund_equity.total_net_fund_equity)}
                                </td>
                              </tr>

                              {/* TOTAL LIABILITIES & EQUITY */}
                              <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3.5px double #0f172a', fontWeight: '900', fontSize: '13px' }}>
                                <td colSpan="3" style={{ padding: '10px 12px', borderRight: '1px solid #cbd5e1', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  TOTAL LIABILITIES &amp; FUND EQUITY
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0f172a', fontSize: '13.5px', fontWeight: '900' }}>
                                  Tk. {formatCurrency(bs.assets.total_assets)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* ITEMIZED FUND BREAKDOWN */}
                        <div style={{ marginTop: '24px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Itemized Fund Category Accrual Balance Schedule
                          </h4>
                          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', borderTop: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
                                <th style={{ padding: '6px', textAlign: 'center', width: '35px' }}>SL</th>
                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Fund Category</th>
                                <th style={{ padding: '6px', textAlign: 'center', width: '60px' }}>FDRs</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Principal (Asset)</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Accrued Interest</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total Assets</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total Liab</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Net Fund Equity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bs.fund_breakdown.map((f, idx) => (
                                <tr key={f.acc_code} style={{ background: idx % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                  <td style={{ padding: '5px 8px', fontWeight: '600' }}>
                                    <code>{f.acc_code}</code> – {f.fund_name}
                                  </td>
                                  <td style={{ padding: '5px', textAlign: 'center' }}>{f.fdr_count}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{formatCurrency(f.principal_asset)}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0369a1' }}>{formatCurrency(f.accrued_interest_asset)}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(f.total_assets)}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#b91c1c' }}>{formatCurrency(f.total_liabilities)}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#15803d', fontWeight: '700' }}>{formatCurrency(f.net_fund_equity)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3.5px double #0f172a', fontWeight: '900' }}>
                                <td colSpan="3" style={{ padding: '7px 8px', textAlign: 'right' }}>GRAND TOTAL:</td>
                                <td style={{ padding: '7px 8px', textAlign: 'right' }}>{formatCurrency(bs.assets.fdr_principal_investments)}</td>
                                <td style={{ padding: '7px 8px', textAlign: 'right', color: '#0369a1' }}>{formatCurrency(bs.assets.accrued_interest_receivable)}</td>
                                <td style={{ padding: '7px 8px', textAlign: 'right' }}>{formatCurrency(bs.assets.total_assets)}</td>
                                <td style={{ padding: '7px 8px', textAlign: 'right', color: '#b91c1c' }}>{formatCurrency(bs.liabilities.total_liabilities)}</td>
                                <td style={{ padding: '7px 8px', textAlign: 'right', color: '#15803d' }}>Tk. {formatCurrency(bs.fund_equity.total_net_fund_equity)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {renderIasSignatories()}
                      </div>
                    );
                  }

                  // B. PORTFOLIO INCOME STATEMENT
                  if (finSubTab === 'income-statement') {
                    const inc = financialStatementsData.income_statement;
                    return (
                      <div className="printable-area" style={{ background: '#ffffff', color: '#0f172a', padding: '36px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '980px', margin: '0 auto', fontFamily: "'Nikosh', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                        {renderIasHeader('STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME', `Accrual Basis — Period: ${formatDate(inc.period_start)} to ${formatDate(inc.period_end)}`)}

                        <div style={{ maxWidth: '820px', margin: '0 auto', marginBottom: '24px' }}>
                          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                                <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>SL</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>FINANCIAL PARTICULARS</th>
                                <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>NOTE</th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', width: '180px', fontWeight: '800' }}>AMOUNT (BDT)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* REVENUE */}
                              <tr style={{ background: '#f1f5f9', fontWeight: '800', fontSize: '12px', color: '#0369a1' }}>
                                <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0' }}>
                                  I.&nbsp; FINANCIAL REVENUE (ACCRUAL BASIS)
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>1</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Accrued Gross Interest Income Earned on Term Investments
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 6.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0369a1' }}>
                                  {formatCurrency(inc.revenue.accrued_gross_interest_income)}
                                </td>
                              </tr>
                              <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                <td colSpan="3" style={{ padding: '8px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#0369a1', textTransform: 'uppercase' }}>
                                  Total Financial Revenue (A)
                                </td>
                                <td style={{ padding: '8px 14px', textAlign: 'right', color: '#0369a1', fontWeight: '800', fontSize: '12.5px' }}>
                                  Tk. {formatCurrency(inc.revenue.total_revenue)}
                                </td>
                              </tr>

                              {/* EXPENSES */}
                              <tr style={{ background: '#f1f5f9', fontWeight: '800', fontSize: '12px', color: '#b91c1c' }}>
                                <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1.5px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', paddingTop: '14px' }}>
                                  II.&nbsp; FINANCIAL EXPENDITURES &amp; STATUTORY DEDUCTIONS
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>2</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Advance Income Tax (AIT Deduction Expense)
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 5.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                                  {formatCurrency(inc.expenses.advance_income_tax_expense)}
                                </td>
                              </tr>
                              <tr style={{ background: '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>3</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Excise Duty Expense
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 7.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                                  {formatCurrency(inc.expenses.excise_duty_expense)}
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>4</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Bank Service Charges &amp; Realized Fees
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 7.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                                  {formatCurrency(inc.expenses.bank_charges_expense)}
                                </td>
                              </tr>
                              <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                <td colSpan="3" style={{ padding: '8px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#b91c1c', textTransform: 'uppercase' }}>
                                  Total Financial Expenditures &amp; Deductions (B)
                                </td>
                                <td style={{ padding: '8px 14px', textAlign: 'right', color: '#b91c1c', fontWeight: '800', fontSize: '12.5px' }}>
                                  Tk. {formatCurrency(inc.expenses.total_expenses)}
                                </td>
                              </tr>

                              {/* NET SURPLUS */}
                              <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3.5px double #0f172a', fontWeight: '900', fontSize: '13px' }}>
                                <td colSpan="3" style={{ padding: '10px 12px', borderRight: '1px solid #cbd5e1', color: inc.net_accrued_income >= 0 ? '#15803d' : '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  III.&nbsp; NET ACCRUED SURPLUS / (DEFICIT) FOR PERIOD (A - B)
                                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal', textTransform: 'none', marginTop: '2px' }}>
                                    Transferred to Statement of Financial Position / Fund Equity
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: inc.net_accrued_income >= 0 ? '#15803d' : '#b91c1c', fontSize: '14px', fontWeight: '900' }}>
                                  Tk. {formatCurrency(inc.net_accrued_income)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {renderIasSignatories()}
                      </div>
                    );
                  }

                  // C. PORTFOLIO CASH FLOW STATEMENT (IAS 7)
                  if (finSubTab === 'cash-flow') {
                    const cf = financialStatementsData.cash_flow_statement;
                    return (
                      <div className="printable-area" style={{ background: '#ffffff', color: '#0f172a', padding: '36px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '980px', margin: '0 auto', fontFamily: "'Nikosh', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                        {renderIasHeader('STATEMENT OF CASH FLOWS', `Period: ${formatDate(cf.period_start)} to ${formatDate(cf.period_end)}`)}

                        <div style={{ maxWidth: '820px', margin: '0 auto', marginBottom: '24px' }}>
                          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                                <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>SL</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>CASH FLOW PARTICULARS</th>
                                <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px', fontWeight: '800', borderRight: '1px solid #cbd5e1' }}>NOTE</th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', width: '180px', fontWeight: '800' }}>AMOUNT (BDT)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* CASH INFLOWS */}
                              <tr style={{ background: '#f1f5f9', fontWeight: '800', fontSize: '12px', color: '#15803d' }}>
                                <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0' }}>
                                  A.&nbsp; CASH INFLOWS FROM REALIZED REVENUE &amp; SETTLEMENTS
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>1</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Realized FDR Principal Encashments &amp; Collections
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 4.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700' }}>
                                  {formatCurrency(cf.cash_inflows.realized_principal_collections)}
                                </td>
                              </tr>
                              <tr style={{ background: '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>2</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Realized Net Interest Deposited in Bank Settlement Account
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 6.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                                  {formatCurrency(cf.cash_inflows.realized_net_interest_received)}
                                </td>
                              </tr>
                              <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                <td colSpan="3" style={{ padding: '8px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#15803d', textTransform: 'uppercase' }}>
                                  Total Cash Inflows (A)
                                </td>
                                <td style={{ padding: '8px 14px', textAlign: 'right', color: '#15803d', fontWeight: '800', fontSize: '12.5px' }}>
                                  Tk. {formatCurrency(cf.cash_inflows.total_cash_inflows)}
                                </td>
                              </tr>

                              {/* CASH OUTFLOWS */}
                              <tr style={{ background: '#f1f5f9', fontWeight: '800', fontSize: '12px', color: '#b91c1c' }}>
                                <td colSpan="4" style={{ padding: '8px 12px', borderTop: '1.5px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', paddingTop: '14px' }}>
                                  B.&nbsp; CASH OUTFLOWS (INVESTMENT OUTLAYS &amp; STATUTORY PAYMENTS)
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>3</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  New FDR &amp; Certificate Principal Outlays Placed
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 4.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700' }}>
                                  {formatCurrency(cf.cash_outflows.new_fdr_principal_outlays)}
                                </td>
                              </tr>
                              <tr style={{ background: '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>4</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Realized Advance Income Tax (AIT) Paid at Source
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 5.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                                  {formatCurrency(cf.cash_outflows.realized_tax_paid)}
                                </td>
                              </tr>
                              <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>5</td>
                                <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                                  Realized Excise Duties &amp; Bank Service Charges Paid
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Note 7.0</span>
                                </td>
                                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                                  {formatCurrency(cf.cash_outflows.realized_excise_bank_charges)}
                                </td>
                              </tr>
                              <tr style={{ borderTop: '1px solid #94a3b8', borderBottom: '1.5px solid #cbd5e1', fontWeight: '800', background: '#f8fafc' }}>
                                <td colSpan="3" style={{ padding: '8px 12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', color: '#b91c1c', textTransform: 'uppercase' }}>
                                  Total Cash Outflows (B)
                                </td>
                                <td style={{ padding: '8px 14px', textAlign: 'right', color: '#b91c1c', fontWeight: '800', fontSize: '12.5px' }}>
                                  Tk. {formatCurrency(cf.cash_outflows.total_cash_outflows)}
                                </td>
                              </tr>

                              {/* NET CASH POSITION */}
                              <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3.5px double #0f172a', fontWeight: '900', fontSize: '13px' }}>
                                <td colSpan="3" style={{ padding: '10px 12px', borderRight: '1px solid #cbd5e1', color: cf.net_cash_position >= 0 ? '#0284c7' : '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  NET INCREASE / (DECREASE) IN CASH POSITION (A - B)
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: cf.net_cash_position >= 0 ? '#0284c7' : '#b91c1c', fontSize: '14px', fontWeight: '900' }}>
                                  Tk. {formatCurrency(cf.net_cash_position)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {renderIasSignatories()}
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            )}

          </>
        )}
      </div>

    </div>
  );
}
