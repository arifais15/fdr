import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCcw, 
  CheckCircle, 
  Wallet,
  FileSpreadsheet,
  Building2,
  Calendar,
  Percent,
  ShieldCheck,
  History,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  Download,
  BookOpen,
  RotateCcw,
  TrendingUp,
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail
} from 'lucide-react';
import Modal from '../components/Modal';
import FDRBankStatement from '../components/FDRBankStatement';
import { formatCurrency, formatDate, cleanRemarks } from '../utils/formatters';
import { calculateMaturityDate, calculateInterestDetails, getTaxRate } from '../utils/financial';
import { api } from '../utils/api';
import { exportTableToExcel } from '../utils/exportHelper';
import { downloadFdrTemplate, parseExcelFile } from '../utils/excelHelper';

export default function Investments({ showToast, onRefreshStats }) {
  const [investments, setInvestments] = useState([]);
  const [banks, setBanks] = useState([]);
  const [fundCategories, setFundCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [filterBank, setFilterBank] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterFund, setFilterFund] = useState('');

  // Pagination & Sorting state (default show 5 per page; options: 5, 10, 50, 100, All)
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('issue_date');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  const [inplaceRolloverList, setInplaceRolloverList] = useState(null);
  const [showKpiCards, setShowKpiCards] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isEncashModalOpen, setIsEncashModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  // Bank Statement
  const [statementInv, setStatementInv] = useState(null);

  const [selectedInv, setSelectedInv] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form state for New/Edit Investment
  const [formData, setFormData] = useState({
    investment_type: 'FDR',
    fdr_no: '',
    account_no: '',
    bank_id: '',
    branch_name: '',
    acc_code: '',
    fund_name: '',
    principal_amount: '',
    interest_rate: '',
    issue_date: new Date().toISOString().split('T')[0],
    tenure_months: '12',
    maturity_date: '',
    compounding_frequency: 'At Maturity',
    tax_rate: 10,
    sanction_ref: '',
    remarks: ''
  });

  // Helper: auto-detect AIT tax rate (10% CPF/GPF/Gratuity, 20% TIN provided, 30% no TIN)
  const getAutoTaxRate = (accCode = '', fundName = '', tinProvided = true) => {
    return getTaxRate(tinProvided, fundName, accCode, settings);
  };

  // Renewal Form state
  const [renewForm, setRenewForm] = useState({
    new_fdr_no: '',
    new_principal: '',
    new_rate: '',
    new_issue_date: new Date().toISOString().split('T')[0],
    new_tenure_months: '12',
    new_maturity_date: ''
  });

  // Encashment Form state
  const [encashForm, setEncashForm] = useState({
    encash_date: new Date().toISOString().split('T')[0],
    total_received: '',
    remarks: ''
  });

  const [customTypes, setCustomTypes] = useState([]);

  // Bulk Upload State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setImportFileName(file.name);
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        showToast('The uploaded Excel file contains no data rows.', 'error');
        setImportRows([]);
      } else {
        setImportRows(rows);
        showToast(`Successfully parsed ${rows.length} records from ${file.name}`, 'info');
      }
    } catch (err) {
      showToast('Failed to parse Excel file: ' + err.message, 'error');
    }
  };

  const handleBulkSubmit = async () => {
    if (importRows.length === 0) return;
    try {
      setImporting(true);
      const res = await api.bulkCreateInvestments(importRows);
      showToast(res.message, 'success');
      setIsImportModalOpen(false);
      setImportRows([]);
      setImportFileName('');
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast('Bulk import failed: ' + err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  // Derived: unique branch list for selected bank (or all banks)
  const branchOptions = React.useMemo(() => {
    const source = filterBank
      ? banks.filter(b => String(b.id) === String(filterBank))
      : banks;
    const unique = [...new Set(source.map(b => b.branch_name).filter(Boolean))];
    return unique.sort();
  }, [banks, filterBank]);

  // Derived: KPI stats for top summary cards
  const portfolioStats = React.useMemo(() => {
    if (filterStatus === 'InPlaceRenewed') {
      const count = inplaceRolloverList?.count || 0;
      const opening = inplaceRolloverList?.totals?.opening_principal !== undefined
        ? inplaceRolloverList.totals.opening_principal
        : ((inplaceRolloverList?.totals?.principal || 0) - (inplaceRolloverList?.totals?.net || 0));
      const net = inplaceRolloverList?.totals?.net || 0;
      return {
        totalPrincipal: opening,
        totalNetInterest: net,
        count: count,
        activeCount: count
      };
    }

    const count = investments.length;
    const totalPrincipal = investments.reduce((sum, inv) => {
      const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
      const r = inv.latest_rollover;
      return sum + (isRollover ? (r.principal_amount - r.net_interest) : (inv.principal_amount || 0));
    }, 0);

    const totalAccruedNet = investments.reduce((sum, inv) => {
      const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
      const r = inv.latest_rollover;
      const gross = isRollover ? r.gross_interest : (inv.actual_gross_interest || inv.accrued_gross_interest || 0);
      const tax = isRollover ? r.tax_amount : (inv.actual_tax || inv.estimated_tax || 0);
      const duty = isRollover ? r.excise_duty : (inv.actual_excise_duty || inv.estimated_excise_duty || 0);
      const net = isRollover ? r.net_interest : (inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' ? inv.actual_net_interest : (gross - tax - duty));
      return sum + (net || 0);
    }, 0);

    const activeCount = investments.filter(inv => inv.status === 'Active').length;

    return {
      totalPrincipal,
      totalNetInterest: totalAccruedNet,
      count,
      activeCount
    };
  }, [investments, filterStatus, inplaceRolloverList]);

  // Derived: status tab badge counts
  const statusCounts = React.useMemo(() => {
    return {
      Active: investments.filter(i => i.status === 'Active').length,
      Renewed: investments.filter(i => i.status === 'Renewed').length,
      InPlaceRenewed: inplaceRolloverList?.count || 0,
      Encashed: investments.filter(i => i.status === 'Encashed').length,
      All: investments.length
    };
  }, [investments, inplaceRolloverList]);

  // Sort toggle handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.35, marginLeft: '5px', verticalAlign: 'middle' }} />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={12} color="var(--primary)" style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
      : <ArrowDown size={12} color="var(--primary)" style={{ marginLeft: '5px', verticalAlign: 'middle' }} />;
  };

  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Sorted investments
  const sortedInvestments = React.useMemo(() => {
    if (!investments || investments.length === 0) return [];
    const copy = [...investments];
    copy.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      if (
        sortField === 'principal_amount' || 
        sortField === 'interest_rate' || 
        sortField === 'accrued_gross_interest' || 
        sortField === 'tenure_months'
      ) {
        const numA = Number(String(valA).replace(/[^0-9.-]+/g, '')) || 0;
        const numB = Number(String(valB).replace(/[^0-9.-]+/g, '')) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (sortField.toLowerCase().includes('date')) {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
    return copy;
  }, [investments, sortField, sortOrder]);

  // Sorted in-place rollover records
  const sortedRolloverRecords = React.useMemo(() => {
    if (!inplaceRolloverList?.records || inplaceRolloverList.records.length === 0) return [];
    const copy = [...inplaceRolloverList.records];
    copy.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'opening_principal') {
        valA = a.opening_principal !== undefined ? a.opening_principal : ((a.new_principal || 0) - (a.net_interest || 0));
        valB = b.opening_principal !== undefined ? b.opening_principal : ((b.new_principal || 0) - (b.net_interest || 0));
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      if (
        sortField === 'opening_principal' ||
        sortField === 'new_principal' || 
        sortField === 'gross_interest' || 
        sortField === 'tax_amount' || 
        sortField === 'excise_duty' || 
        sortField === 'net_interest' || 
        sortField === 'interest_rate'
      ) {
        const numA = Number(String(valA).replace(/[^0-9.-]+/g, '')) || 0;
        const numB = Number(String(valB).replace(/[^0-9.-]+/g, '')) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (sortField.toLowerCase().includes('date')) {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
    return copy;
  }, [inplaceRolloverList, sortField, sortOrder]);

  const currentTotal = filterStatus === 'InPlaceRenewed'
    ? (sortedRolloverRecords.length)
    : (sortedInvestments.length);

  const numPageSize = pageSize === 'All' ? currentTotal : Number(pageSize);
  const totalPages = pageSize === 'All' || currentTotal === 0 ? 1 : Math.max(1, Math.ceil(currentTotal / numPageSize));

  const paginatedInvestments = React.useMemo(() => {
    if (pageSize === 'All') return sortedInvestments;
    const start = (currentPage - 1) * numPageSize;
    return sortedInvestments.slice(start, start + numPageSize);
  }, [sortedInvestments, currentPage, pageSize, numPageSize]);

  const paginatedRollovers = React.useMemo(() => {
    if (pageSize === 'All') return sortedRolloverRecords;
    const start = (currentPage - 1) * numPageSize;
    return sortedRolloverRecords.slice(start, start + numPageSize);
  }, [sortedRolloverRecords, currentPage, pageSize, numPageSize]);

  const startRecord = currentTotal === 0 ? 0 : pageSize === 'All' ? 1 : (currentPage - 1) * numPageSize + 1;
  const endRecord = pageSize === 'All' ? currentTotal : Math.min(currentPage * numPageSize, currentTotal);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus, filterBank, filterBranch, filterFund, search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    loadData();
  }, [filterType, filterStatus, filterBank, filterBranch, filterFund, search]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (filterStatus === 'InPlaceRenewed') {
        // Dedicated In-Place Rollover list from financial history
        const params = {};
        if (search) params.search = search;
        if (filterFund) params.acc_code = filterFund;
        if (filterBank) params.bank_id = filterBank;
        const [rolloverData, bankData, fundData, settingsData] = await Promise.all([
          api.getInPlaceRolloverList(params),
          api.getBanks(),
          api.getFundCategories(),
          api.getSettings()
        ]);
        setInplaceRolloverList(rolloverData);
        setInvestments([]);
        setBanks(bankData);
        setFundCategories(fundData);
        setSettings(settingsData || {});
        if (settingsData && settingsData.custom_investment_types) {
          try { setCustomTypes(JSON.parse(settingsData.custom_investment_types)); } catch (e) { setCustomTypes([]); }
        }
        return;
      }

      setInplaceRolloverList(null);
      const [invData, bankData, fundData, settingsData] = await Promise.all([
        api.getInvestments({ type: filterType, status: filterStatus, bank_id: filterBank, branch: filterBranch, acc_code: filterFund, search }),
        api.getBanks(),
        api.getFundCategories(),
        api.getSettings()
      ]);
      setInvestments(invData);
      setBanks(bankData);
      setFundCategories(fundData);
      setSettings(settingsData || {});
      if (settingsData && settingsData.custom_investment_types) {
        try {
          setCustomTypes(JSON.parse(settingsData.custom_investment_types));
        } catch (e) {
          setCustomTypes([]);
        }
      }
      if (bankData.length > 0 && !formData.bank_id) {
        setFormData(prev => ({ ...prev, bank_id: bankData[0].id, branch_name: bankData[0].branch_name }));
      }
      if (fundData.length > 0 && !formData.acc_code) {
        setFormData(prev => ({ ...prev, acc_code: fundData[0].acc_code, fund_name: fundData[0].fund_name }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUndoRollover = async (investmentId, historyId, fdrNo) => {
    const result = await Swal.fire({
      title: 'Undo In-Place Rollover?',
      html: `Are you sure you want to <b>UNDO</b> the In-Place Rollover for <b>FDR #${fdrNo}</b>?<br/><br/><span style="font-size:12px;color:#94a3b8">This will restore the previous principal amount, issue/maturity dates, and delete the rollover entry from financial history.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Undo Rollover!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#c084fc',
      cancelButtonColor: '#475569',
      background: '#0f172a',
      color: '#f8fafc'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const res = await api.undoInplaceRollover(investmentId, historyId);
      Swal.fire({
        title: 'Undone Successfully!',
        text: res.message || 'In-Place Rollover undone successfully.',
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#3b82f6'
      });
      loadData();
    } catch (err) {
      Swal.fire({
        title: 'Failed to Undo Rollover',
        text: err.message,
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      });
      setLoading(false);
    }
  };

  const handleUndoEncashment = async (inv) => {
    const result = await Swal.fire({
      title: 'Undo FDR Encashment?',
      html: `Are you sure you want to <b>UNDO</b> the encashment of <b>FDR #${inv.fdr_no}</b>?<br/><br/><span style="font-size:12px;color:#94a3b8">This will restore the investment status back to <b>Active</b>, remove settlement calculations, and delete the encashment entry from financial history.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Undo Encashment!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      background: '#0f172a',
      color: '#f8fafc'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const res = await api.undoEncashment(inv.id);
      Swal.fire({
        title: 'Encashment Undone!',
        text: res.message || 'Encashment undone successfully.',
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#3b82f6'
      });
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      Swal.fire({
        title: 'Failed to Undo Encashment',
        text: err.message,
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomType = async () => {
    const { value: typeName } = await Swal.fire({
      title: 'Add Custom Investment Type',
      input: 'text',
      inputLabel: 'Investment Type Name (e.g. Treasury Bond, SND, Special Deposit)',
      inputPlaceholder: 'Enter type name...',
      showCancelButton: true,
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#475569',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Please enter a valid type name!';
        }
      }
    });

    if (!typeName) return;
    
    const trimmed = typeName.trim();
    const safeTypes = Array.isArray(customTypes) ? customTypes : [];
    const defaultTypes = ['FDR', 'Fixed Deposit Receipt (FDR)', 'Savings Certificate', 'National Savings Certificate'];
    if (safeTypes.includes(trimmed) || defaultTypes.includes(trimmed)) {
      showToast('This investment type already exists.', 'error');
      return;
    }
    
    const updatedTypes = [...safeTypes, trimmed];
    try {
      await api.updateSettings({ custom_investment_types: JSON.stringify(updatedTypes) });
      setCustomTypes(updatedTypes);
      setFormData(prev => ({ ...prev, investment_type: trimmed }));
      showToast('Custom investment type added successfully', 'success');
    } catch (err) {
      showToast('Failed to add custom investment type: ' + err.message, 'error');
    }
  };

  const handleDeleteCustomType = async () => {
    const defaultTypes = ['FDR', 'Savings Certificate'];
    if (defaultTypes.includes(formData.investment_type)) {
      showToast('Cannot delete default system investment types (FDR, Savings Certificate).', 'error');
      return;
    }
    
    const safeTypes = Array.isArray(customTypes) ? customTypes : [];
    if (!safeTypes.includes(formData.investment_type)) {
      showToast('Please select a custom investment type to delete.', 'info');
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Custom Investment Type?',
      text: `Are you sure you want to delete "${formData.investment_type}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      background: '#0f172a',
      color: '#f8fafc'
    });

    if (!result.isConfirmed) return;
    
    const updatedTypes = safeTypes.filter(t => t !== formData.investment_type);
    try {
      await api.updateSettings({ custom_investment_types: JSON.stringify(updatedTypes) });
      setCustomTypes(updatedTypes);
      setFormData(prev => ({ ...prev, investment_type: 'FDR' }));
      showToast('Custom investment type deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete custom type: ' + err.message, 'error');
    }
  };

  // Live calculation preview
  const maturityPreview = formData.maturity_date || calculateMaturityDate(formData.issue_date, formData.tenure_months);
  const financialPreview = calculateInterestDetails(
    formData.principal_amount,
    formData.interest_rate,
    formData.issue_date,
    maturityPreview,
    formData.tin_provided !== undefined ? formData.tin_provided : 1,
    formData.issue_date,
    settings,
    formData.fund_name,
    formData.acc_code
  );

  const handleOpenAddModal = (editItem = null) => {
    if (editItem) {
      setSelectedInv(editItem);
      const autoRate = getAutoTaxRate(editItem.acc_code, editItem.fund_name);
      setFormData({
        investment_type: editItem.investment_type,
        fdr_no: editItem.fdr_no,
        account_no: editItem.account_no || '',
        bank_id: editItem.bank_id,
        branch_name: editItem.branch_name || '',
        acc_code: editItem.acc_code || (fundCategories.length > 0 ? fundCategories[0].acc_code : ''),
        fund_name: editItem.fund_name || (fundCategories.length > 0 ? fundCategories[0].fund_name : ''),
        principal_amount: editItem.principal_amount,
        interest_rate: editItem.interest_rate,
        issue_date: editItem.issue_date,
        tenure_months: editItem.tenure_months,
        maturity_date: editItem.maturity_date || calculateMaturityDate(editItem.issue_date, editItem.tenure_months),
        compounding_frequency: editItem.compounding_frequency || 'At Maturity',
        tax_rate: editItem.tax_rate || autoRate,
        status: editItem.status || 'Active',
        sanction_ref: editItem.sanction_ref || '',
        remarks: editItem.remarks || ''
      });
    } else {
      setSelectedInv(null);
      const firstFund = fundCategories.length > 0 ? fundCategories[0] : {};
      const initialIssueDate = new Date().toISOString().split('T')[0];
      const initialTenure = '12';
      const initialMaturity = calculateMaturityDate(initialIssueDate, initialTenure);
      setFormData({
        investment_type: 'FDR',
        fdr_no: `FDR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        account_no: '',
        bank_id: banks.length > 0 ? banks[0].id : '',
        branch_name: banks.length > 0 ? banks[0].branch_name : '',
        acc_code: firstFund.acc_code || '',
        fund_name: firstFund.fund_name || '',
        principal_amount: '',
        interest_rate: '',
        issue_date: initialIssueDate,
        tenure_months: initialTenure,
        maturity_date: initialMaturity,
        compounding_frequency: 'At Maturity',
        tax_rate: getAutoTaxRate(firstFund.acc_code, firstFund.fund_name),
        status: 'Active',
        sanction_ref: '',
        remarks: ''
      });
    }
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const finalMaturity = formData.maturity_date || maturityPreview;
      const payload = {
        ...formData,
        principal_amount: parseFloat(formData.principal_amount),
        interest_rate: parseFloat(formData.interest_rate),
        tenure_months: parseInt(formData.tenure_months),
        maturity_date: finalMaturity
      };

      if (selectedInv) {
        await api.updateInvestment(selectedInv.id, payload);
        showToast('Investment updated successfully', 'success');
      } else {
        await api.createInvestment(payload);
        showToast('New Investment created successfully', 'success');
      }

      setIsAddModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenRenewModal = (inv) => {
    setSelectedInv(inv);
    const calculatedMat = calculateMaturityDate(inv.maturity_date, inv.tenure_months);
    const gross = inv.accrued_gross_interest || 0;
    const tax = inv.estimated_tax || 0;
    const duty = inv.estimated_excise_duty || 0;
    const net = Math.max(0, gross - tax - duty);

    setRenewForm({
      renewal_mode: 'inplace',
      old_actual_gross_interest: gross,
      old_actual_tax: tax,
      old_actual_excise_duty: duty,
      old_actual_net_interest: net,
      new_fdr_no: inv.fdr_no,
      new_principal: inv.principal_amount + net,
      new_rate: inv.interest_rate,
      new_issue_date: inv.maturity_date,
      new_tenure_months: inv.tenure_months,
      new_maturity_date: calculatedMat,
      remarks: 'In-place rollover with principal + net interest addition'
    });
    setIsRenewModalOpen(true);
  };

  const handleRenewFieldChange = (field, val) => {
    const numVal = parseFloat(val) || 0;
    const newForm = { ...renewForm, [field]: val };

    if (
      field === 'old_actual_gross_interest' ||
      field === 'old_actual_tax' ||
      field === 'old_actual_excise_duty' ||
      field === 'old_actual_bank_charge'
    ) {
      const g  = field === 'old_actual_gross_interest' ? numVal : (parseFloat(newForm.old_actual_gross_interest) || 0);
      const t  = field === 'old_actual_tax'            ? numVal : (parseFloat(newForm.old_actual_tax)            || 0);
      const d  = field === 'old_actual_excise_duty'    ? numVal : (parseFloat(newForm.old_actual_excise_duty)    || 0);
      const bc = field === 'old_actual_bank_charge'    ? numVal : (parseFloat(newForm.old_actual_bank_charge)    || 0);
      const net = Math.max(0, g - t - d - bc);
      newForm.old_actual_net_interest = net;
      if (newForm.renewal_mode === 'inplace' && selectedInv) {
        newForm.new_principal = selectedInv.principal_amount + net;
      }
    }
    setRenewForm(newForm);
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.renewInvestment(selectedInv.id, renewForm);
      showToast('Investment renewed successfully!', 'success');
      setIsRenewModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenEncashModal = (inv) => {
    setSelectedInv(inv);
    const gross = inv.accrued_gross_interest || 0;
    const tax = inv.estimated_tax || 0;
    const duty = inv.estimated_excise_duty || 0;
    const net = Math.max(0, gross - tax - duty);
    const estTotal = inv.principal_amount + net;

    setEncashForm({
      encash_date: new Date().toISOString().split('T')[0],
      actual_gross_interest: gross,
      actual_tax: tax,
      actual_excise_duty: duty,
      actual_bank_charge: 0,
      actual_net_interest: net,
      total_received: estTotal,
      interest_deposit_mode: 'full',   // 'full' = Principal + Net received together; 'bank_deposit' = only Principal received, Net deposited separately
      deposit_bank_name: inv.bank_name || '',
      deposit_date: new Date().toISOString().split('T')[0],
      deposit_remarks_type: 'right',
      deposit_remarks_custom: '',
      remarks: 'Settled on maturity'
    });
    setIsEncashModalOpen(true);
  };

  const handleEncashFieldChange = (field, val) => {
    const numVal = parseFloat(val) || 0;
    const newForm = { ...encashForm, [field]: val };

    if (
      field === 'actual_gross_interest' ||
      field === 'actual_tax' ||
      field === 'actual_excise_duty' ||
      field === 'actual_bank_charge'
    ) {
      const g  = field === 'actual_gross_interest' ? numVal : (parseFloat(newForm.actual_gross_interest) || 0);
      const t  = field === 'actual_tax'             ? numVal : (parseFloat(newForm.actual_tax)            || 0);
      const d  = field === 'actual_excise_duty'     ? numVal : (parseFloat(newForm.actual_excise_duty)    || 0);
      const bc = field === 'actual_bank_charge'     ? numVal : (parseFloat(newForm.actual_bank_charge)    || 0);
      const net = Math.max(0, g - t - d - bc);
      const tot = (selectedInv ? selectedInv.principal_amount : 0) + net;
      newForm.actual_net_interest = net;
      if (newForm.interest_deposit_mode !== 'bank_deposit') {
        newForm.total_received = tot;
      } else {
        // Only principal received when interest deposited separately
        newForm.total_received = selectedInv ? selectedInv.principal_amount : 0;
      }
    } else if (field === 'actual_net_interest') {
      if (newForm.interest_deposit_mode !== 'bank_deposit') {
        newForm.total_received = (selectedInv ? selectedInv.principal_amount : 0) + numVal;
      }
    }
    setEncashForm(newForm);
  };

  const handleEncashSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.encashInvestment(selectedInv.id, encashForm);
      showToast('Investment encashed successfully', 'success');
      setIsEncashModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteInvestment = async (inv) => {
    if (!inv) return;

    const result = await Swal.fire({
      title: 'Delete Investment Record',
      html: `
        <div style="text-align: center; margin-bottom: 14px;">
          <div style="font-size: 15px; margin-bottom: 8px; line-height: 1.5; color: var(--text-main);">
            Are you sure you want to delete investment <b>#${inv.fdr_no}</b>?
          </div>
          <div style="font-size: 12px; color: #ef4444; font-weight: 600; padding: 6px 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; display: inline-block;">
            This action is permanent and cannot be undone.
          </div>
        </div>
        <div style="text-align: left; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
          Enter System / Admin Password to authorize:
        </div>
      `,
      input: 'password',
      inputPlaceholder: 'Enter password...',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off',
        autocomplete: 'current-password',
        required: 'true'
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Verify & Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async (password) => {
        if (!password || !password.trim()) {
          Swal.showValidationMessage('Password is required to delete this record');
          return false;
        }
        try {
          const res = await api.deleteInvestment(inv.id, password.trim());
          return res;
        } catch (err) {
          Swal.showValidationMessage(err.message || 'Invalid password! Deletion unauthorized.');
          return false;
        }
      }
    });

    if (result.isConfirmed) {
      await Swal.fire({
        title: 'Deleted!',
        text: `Investment #${inv.fdr_no} has been deleted successfully.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      loadData();
      if (onRefreshStats) onRefreshStats();
    }
  };

  const handleSendEmailNotice = async (inv) => {
    const bankName = inv.bank_name || 'Bank';
    const branchName = inv.bank_branch || inv.branch_name || '';
    const bankEmail = inv.bank_email || '';
    const userEmail = settings.alert_email_address || settings.smtp_sender_email || 'gazi2agmfin@gmail.com';

    const result = await Swal.fire({
      title: 'Send FDR Notice via Email',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <div style="margin-bottom: 12px; padding: 12px; background: rgba(56, 189, 248, 0.1); border-left: 4px solid #0284c7; border-radius: 6px;">
            <strong>FDR No:</strong> <code style="font-size: 14px; font-weight: bold; color: #0284c7;">${inv.fdr_no}</code><br/>
            <strong>Bank & Branch:</strong> ${bankName} (${branchName})<br/>
            <strong>Principal:</strong> BDT ${Number(inv.principal_amount || 0).toLocaleString('en-IN')}<br/>
            <strong>Maturity Date:</strong> <span style="color: #ef4444; font-weight: bold;">${inv.maturity_date}</span>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="font-weight: 700; display: block; margin-bottom: 4px; color: var(--text-main);">
              Destination Bank Branch Email:
            </label>
            <input 
              id="swal-bank-email" 
              class="swal2-input" 
              style="margin: 0; width: 100%; box-sizing: border-box; font-size: 13px;" 
              placeholder="e.g. branch@bank.org.bd" 
              value="${bankEmail}" 
            />
            ${!bankEmail ? '<div style="color: #f59e0b; font-size: 11px; margin-top: 3px;">⚠️ No email found in Bank Directory for this branch. Please enter an email or update Bank Directory.</div>' : ''}
          </div>

          <div>
            <label style="font-weight: 700; display: block; margin-bottom: 4px; color: var(--text-main);">
              Carbon Copy (CC) to PBS User:
            </label>
            <input 
              id="swal-user-email" 
              class="swal2-input" 
              style="margin: 0; width: 100%; box-sizing: border-box; font-size: 13px;" 
              value="${userEmail}" 
            />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '📧 Send Email Notice Now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const destBankEmail = (document.getElementById('swal-bank-email')?.value || '').trim();
        const destUserEmail = (document.getElementById('swal-user-email')?.value || '').trim();
        if (!destBankEmail && !destUserEmail) {
          Swal.showValidationMessage('Please provide at least one recipient email address.');
          return false;
        }
        try {
          const res = await api.sendFdrEmailNotice(inv.id, {
            custom_to: destBankEmail,
            custom_cc: destUserEmail
          });
          return res;
        } catch (err) {
          Swal.showValidationMessage(err.message || 'Failed to dispatch email notice.');
          return false;
        }
      }
    });

    if (result.isConfirmed && result.value) {
      Swal.fire({
        icon: 'success',
        title: 'FDR Notice Dispatched!',
        text: result.value.message || 'Notice successfully sent to Bank and CC to User.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleViewDetails = async (inv) => {
    try {
      const detailed = await api.getInvestment(inv.id);
      setSelectedInv(detailed);
      setIsViewModalOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleViewHistory = async (inv) => {
    try {
      setSelectedInv(inv);
      setHistoryLoading(true);
      setIsHistoryModalOpen(true);
      const data = await api.getInvestmentHistory(inv.id);
      setHistoryData(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* COMPACT KPI METRIC SUMMARY STRIP & TOGGLE */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '6px 12px', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(14, 148, 117, 0.08) 0%, var(--bg-card) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>Portfolio Principal:</span>
            <strong style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '800' }}>{formatCurrency(portfolioStats.totalPrincipal)}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>Est. Net Profit:</span>
            <strong style={{ color: '#059669', fontSize: '14px', fontWeight: '800' }}>{formatCurrency(portfolioStats.totalNetInterest)}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>Size:</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '13.5px', fontWeight: '800' }}>{portfolioStats.count}</strong>
            <span style={{ color: '#059669', fontSize: '11.5px', fontWeight: '700' }}>({portfolioStats.activeCount} Active)</span>
          </div>
          <span className="badge badge-active" style={{ fontSize: '11px', padding: '2px 8px', fontWeight: '700' }}>
            {filterStatus === '' ? 'All Records' : filterStatus === 'InPlaceRenewed' ? 'In-Place Renewed' : `${filterStatus} List`}
          </span>
        </div>

        <button 
          type="button" 
          onClick={() => setShowKpiCards(prev => !prev)}
          className="btn-secondary"
          style={{ padding: '2px 8px', fontSize: '11px', height: '24px', borderRadius: '6px' }}
          title={showKpiCards ? "Hide detailed KPI cards" : "Show detailed KPI cards"}
        >
          {showKpiCards ? 'Hide Cards ▲' : 'Detailed Cards ▼'}
        </button>
      </div>

      {/* EXPANDABLE KPI METRIC CARDS (COLLAPSED BY DEFAULT TO SAVE VERTICAL SPACE) */}
      {showKpiCards && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
          <div className="glass-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex' }}>
              <Wallet size={18} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Principal
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
                {formatCurrency(portfolioStats.totalPrincipal)}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Estimated Net Profit
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#10b981' }}>
                {formatCurrency(portfolioStats.totalNetInterest)}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex' }}>
              <Briefcase size={18} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Portfolio Size
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
                {portfolioStats.count} <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>Records</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex' }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active View Filter
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                {filterStatus === '' ? 'All Records' : filterStatus === 'InPlaceRenewed' ? 'In-Place Renewed' : `${filterStatus} List`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT ACTION BAR & FILTERS */}
      <div className="glass-panel" style={{ padding: '8px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* ROW 1: Search & Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Input with quick clear */}
          <div style={{ position: 'relative', minWidth: '220px', maxWidth: '380px', flex: 1 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search FDR No, Account, Bank, Branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '30px', paddingRight: search ? '30px' : '10px', width: '100%', height: '32px', fontSize: '12px' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Action Buttons Group */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={downloadFdrTemplate} 
              className="btn-secondary" 
              title="Download pre-formatted Excel template for bulk import"
              style={{ fontSize: '11.5px', padding: '5px 10px', borderRadius: '6px', height: '32px' }}
            >
              <Download size={13} />
              <span>Excel Template</span>
            </button>

            <button 
              type="button"
              onClick={() => setIsImportModalOpen(true)} 
              className="btn-secondary" 
              style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)', fontSize: '11.5px', padding: '5px 10px', borderRadius: '6px', height: '32px' }}
            >
              <Upload size={13} />
              <span>Upload FDR Excel</span>
            </button>

            <button 
              onClick={() => handleOpenAddModal(null)} 
              className="btn-primary" 
              style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', height: '32px' }}
            >
              <Plus size={15} />
              <span>New FDR / Certificate</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Filter Toolbar */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          alignItems: 'center', 
          paddingTop: '6px', 
          borderTop: '1px solid var(--border-color)' 
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: '800', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Filter size={13} color="#0284c7" />
            <span>Filters:</span>
          </div>

          {/* Filter 1: Investment Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 120px', minWidth: '110px', maxWidth: '170px' }}>
            <select
              className="form-select filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: '100%', height: '30px', fontSize: '11.5px', padding: '3px 8px' }}
            >
              <option value="">All Types (FDR &amp; Certs)</option>
              <option value="FDR">FDR Only</option>
              <option value="Savings Certificate">Savings Certificate</option>
              {customTypes.map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Filter 2: Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 110px', minWidth: '100px', maxWidth: '140px' }}>
            <select
              className="form-select filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', height: '30px', fontSize: '11.5px', padding: '3px 8px' }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Matured">Matured</option>
              <option value="Renewed">Renewed</option>
              <option value="Encashed">Encashed</option>
            </select>
          </div>

          {/* Filter 3: Bank */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 140px', minWidth: '130px', maxWidth: '200px' }}>
            <select
              className="form-select filter-select"
              value={filterBank}
              onChange={(e) => {
                setFilterBank(e.target.value);
                setFilterBranch('');
              }}
              style={{ width: '100%', height: '30px', fontSize: '11.5px', padding: '3px 8px' }}
            >
              <option value="">All Banks</option>
              {banks.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Filter 4: Branch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 130px', minWidth: '120px', maxWidth: '170px' }}>
            <select
              className="form-select filter-select"
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              disabled={branchOptions.length === 0}
              title={filterBank ? 'Filter by branch of selected bank' : 'Filter by branch (across all banks)'}
              style={{ width: '100%', height: '30px', fontSize: '11.5px', padding: '3px 8px' }}
            >
              <option value="">All Branches</option>
              {branchOptions.map(br => (
                <option key={br} value={br}>{br}</option>
              ))}
            </select>
          </div>

          {/* Filter 5: Fund Category */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 160px', minWidth: '150px', maxWidth: '220px' }}>
            <select
              className="form-select filter-select"
              value={filterFund}
              onChange={(e) => setFilterFund(e.target.value)}
              style={{ width: '100%', height: '30px', fontSize: '11.5px', padding: '3px 8px' }}
            >
              <option value="">All Fund Categories</option>
              {fundCategories.map(fc => (
                <option key={fc.id} value={fc.acc_code}>{fc.acc_code} - {fc.fund_name}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {(search || filterType || (filterStatus && filterStatus !== 'Active') || filterBank || filterBranch || filterFund) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterType('');
                setFilterStatus('Active');
                setFilterBank('');
                setFilterBranch('');
                setFilterFund('');
              }}
              className="btn-secondary"
              style={{ 
                height: '30px', 
                padding: '3px 10px', 
                fontSize: '11.5px', 
                borderRadius: '6px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)'
              }}
              title="Reset all filters to default"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* INVESTMENTS REGISTER DATA TABLE CONTAINER */}
      <div className="glass-panel" style={{ padding: '8px 12px', borderRadius: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Investment Register ({filterStatus === 'InPlaceRenewed' ? (inplaceRolloverList?.count ?? 0) : investments.length})
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: '700' }}>
              ({filterStatus === 'InPlaceRenewed' ? 'In-Place Renewed' : filterStatus || 'All'})
            </span>
          </div>

          {/* QUICK STATUS TABS & EXPORT */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setFilterStatus('Active')}
              className={filterStatus === 'Active' ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '700',
                background: filterStatus === 'Active' ? undefined : '#ffffff',
                color: filterStatus === 'Active' ? undefined : '#0f172a',
                border: filterStatus === 'Active' ? undefined : '1.5px solid #cbd5e1'
              }}
            >
              <span>Active</span>
              {filterStatus !== 'InPlaceRenewed' && (
                <span style={{ fontSize: '10.5px', padding: '0 6px', borderRadius: '8px', fontWeight: '800', background: filterStatus === 'Active' ? 'rgba(255,255,255,0.3)' : '#e2e8f0', color: filterStatus === 'Active' ? '#ffffff' : '#0f172a' }}>
                  {statusCounts.Active}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterStatus('Renewed')}
              className={filterStatus === 'Renewed' ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '700',
                background: filterStatus === 'Renewed' ? undefined : '#ffffff',
                color: filterStatus === 'Renewed' ? undefined : '#0f172a',
                border: filterStatus === 'Renewed' ? undefined : '1.5px solid #cbd5e1'
              }}
            >
              <span>Renewed</span>
              {filterStatus !== 'InPlaceRenewed' && (
                <span style={{ fontSize: '10.5px', padding: '0 6px', borderRadius: '8px', fontWeight: '800', background: filterStatus === 'Renewed' ? 'rgba(255,255,255,0.3)' : '#e2e8f0', color: filterStatus === 'Renewed' ? '#ffffff' : '#0f172a' }}>
                  {statusCounts.Renewed}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterStatus('InPlaceRenewed')}
              className={filterStatus === 'InPlaceRenewed' ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '700',
                background: filterStatus === 'InPlaceRenewed' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#ffffff',
                color: filterStatus === 'InPlaceRenewed' ? '#ffffff' : '#0f172a',
                border: filterStatus === 'InPlaceRenewed' ? undefined : '1.5px solid #cbd5e1'
              }}
            >
              <RefreshCcw size={12} />
              <span>In-Place</span>
              <span style={{ fontSize: '10.5px', padding: '0 6px', borderRadius: '8px', fontWeight: '800', background: filterStatus === 'InPlaceRenewed' ? 'rgba(255,255,255,0.3)' : '#e2e8f0', color: filterStatus === 'InPlaceRenewed' ? '#ffffff' : '#0f172a' }}>
                {statusCounts.InPlaceRenewed}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('Encashed')}
              className={filterStatus === 'Encashed' ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '700',
                background: filterStatus === 'Encashed' ? undefined : '#ffffff',
                color: filterStatus === 'Encashed' ? undefined : '#0f172a',
                border: filterStatus === 'Encashed' ? undefined : '1.5px solid #cbd5e1'
              }}
            >
              <span>Encashed</span>
              {filterStatus !== 'InPlaceRenewed' && (
                <span style={{ fontSize: '10.5px', padding: '0 6px', borderRadius: '8px', fontWeight: '800', background: filterStatus === 'Encashed' ? 'rgba(255,255,255,0.3)' : '#e2e8f0', color: filterStatus === 'Encashed' ? '#ffffff' : '#0f172a' }}>
                  {statusCounts.Encashed}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterStatus('')}
              className={filterStatus === '' ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '700',
                background: filterStatus === '' ? undefined : '#ffffff',
                color: filterStatus === '' ? undefined : '#0f172a',
                border: filterStatus === '' ? undefined : '1.5px solid #cbd5e1'
              }}
            >
              <span>All</span>
              <span style={{ fontSize: '10.5px', padding: '0 6px', borderRadius: '8px', fontWeight: '800', background: filterStatus === '' ? 'rgba(255,255,255,0.3)' : '#e2e8f0', color: filterStatus === '' ? '#ffffff' : '#0f172a' }}>
                {statusCounts.All}
              </span>
            </button>
            <button
              onClick={() => exportTableToExcel('investments-table-all', 'Investment_Register.xlsx')}
              className="btn-success"
              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}
              title="Export all matching records to Excel"
            >
              <FileSpreadsheet size={14} />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* PAGINATION & SORT CONTROLS BAR */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '5px 12px',
          background: 'var(--bg-card)',
          borderRadius: '7px',
          marginBottom: '6px',
          border: '1.5px solid var(--border-color)'
        }}>
          {/* Left: Per-Page Selector & Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            
            {/* Per-Page Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>Show:</span>
              <select
                className="form-select filter-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ height: '32px', padding: '3px 8px', fontSize: '12px', minWidth: '70px', fontWeight: '700', color: 'var(--text-main)', border: '1.5px solid #94a3b8' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="All">All</option>
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>per page</span>
            </div>

            <div style={{ width: '1px', height: '18px', background: 'var(--border-color)' }} />

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpDown size={13} color="var(--primary)" /> Sort By:
              </span>
              <select
                className="form-select filter-select"
                value={`${sortField}_${sortOrder}`}
                onChange={(e) => {
                  const parts = e.target.value.split('_');
                  const order = parts.pop();
                  const field = parts.join('_');
                  setSortField(field);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
                style={{ height: '32px', padding: '3px 10px', fontSize: '12px', minWidth: '190px', fontWeight: '600', color: 'var(--text-main)', border: '1.5px solid #94a3b8' }}
              >
                <option value="issue_date_desc">Issue Date (Newest First)</option>
                <option value="issue_date_asc">Issue Date (Oldest First)</option>
                <option value="maturity_date_asc">Maturity Date (Earliest First)</option>
                <option value="maturity_date_desc">Maturity Date (Latest First)</option>
                <option value="principal_amount_desc">Principal (Highest First)</option>
                <option value="principal_amount_asc">Principal (Lowest First)</option>
                <option value="interest_rate_desc">Interest Rate (Highest First)</option>
                <option value="interest_rate_asc">Interest Rate (Lowest First)</option>
                <option value="fdr_no_asc">FDR / Cert No (A → Z)</option>
                <option value="fdr_no_desc">FDR / Cert No (Z → A)</option>
                <option value="bank_name_asc">Bank Name (A → Z)</option>
                <option value="bank_name_desc">Bank Name (Z → A)</option>
                <option value="acc_code_asc">Fund Category (A → Z)</option>
                <option value="status_asc">Status (A → Z)</option>
              </select>
            </div>
          </div>

          {/* Right: Record Counter Info */}
          <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>
            Showing <strong style={{ color: 'var(--text-main)', fontWeight: '800' }}>{startRecord}</strong> to <strong style={{ color: 'var(--text-main)', fontWeight: '800' }}>{endRecord}</strong> of <strong style={{ color: 'var(--text-main)', fontWeight: '800' }}>{currentTotal}</strong> records
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            <RefreshCcw size={24} className="spin-animation" style={{ marginBottom: '10px', color: 'var(--primary)' }} />
            <div>Loading investment records...</div>
          </div>
        ) : filterStatus === 'InPlaceRenewed' ? (
          // ── IN-PLACE ROLLOVER TABLE ──
          !inplaceRolloverList || inplaceRolloverList.count === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <RefreshCcw size={28} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                No In-Place Renewed Events Found
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: 0 }}>
                In-place renewals appear automatically when an FDR is renewed under the same FDR number with principal rollover.
              </p>
            </div>
          ) : (
            <div className="data-table-container">
              <table id="investments-table" className="data-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th onClick={() => handleSort('fdr_no')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by FDR No">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>FDR / Cert No</span>
                        {renderSortIcon('fdr_no')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('acc_code')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Fund Category">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Fund Category</span>
                        {renderSortIcon('acc_code')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('bank_name')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Bank & Branch">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Bank &amp; Branch</span>
                        {renderSortIcon('bank_name')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('rollover_date')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Renewal Date">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Renewal Date</span>
                        {renderSortIcon('rollover_date')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('new_issue_date')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Issue Date">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>New Issue Date</span>
                        {renderSortIcon('new_issue_date')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('new_maturity_date')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Maturity Date">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>New Maturity</span>
                        {renderSortIcon('new_maturity_date')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('interest_rate')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Rate">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Rate (%)</span>
                        {renderSortIcon('interest_rate')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('opening_principal')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} title="Sort by Opening Principal">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <span>Opening Principal</span>
                        {renderSortIcon('opening_principal')}
                      </div>
                    </th>
                    <th style={{ textAlign: 'right' }}>Gross Interest</th>
                    <th style={{ textAlign: 'right' }}>AIT Tax</th>
                    <th style={{ textAlign: 'right' }}>Excise Duty</th>
                    <th style={{ textAlign: 'right' }}>Net Interest</th>
                    <th onClick={() => handleSort('new_principal')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} title="Sort by New Principal">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <span>New Principal</span>
                        {renderSortIcon('new_principal')}
                      </div>
                    </th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRollovers.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-main)', fontWeight: '600' }}>{startRecord + idx}</td>
                      <td><strong style={{ color: '#7c3aed', fontWeight: '800' }}>{r.fdr_no}</strong></td>
                      <td>
                        <div style={{ fontWeight: '800', color: '#0369a1', fontSize: '12.5px' }}>{r.acc_code || '—'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: '600' }}>{r.fund_name || 'General Fund'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '12.5px' }}>{r.bank_name}</div>
                        <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '600' }}>{r.bank_branch}</div>
                      </td>
                      <td><strong style={{ color: '#c2410c', fontWeight: '800' }}>{formatDate(r.rollover_date)}</strong></td>
                      <td style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: '600' }}>{formatDate(r.new_issue_date)}</td>
                      <td style={{ color: '#c2410c', fontSize: '12px', fontWeight: '800' }}>{formatDate(r.new_maturity_date)}</td>
                      <td><span style={{ fontWeight: '800', color: '#1d4ed8' }}>{r.interest_rate}%</span></td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-main)', fontSize: '13.5px' }}>
                        {formatCurrency(
                          r.opening_principal !== undefined
                            ? r.opening_principal
                            : Math.round(((r.new_principal || 0) - (r.net_interest || 0)) * 100) / 100
                        )}
                      </td>
                      <td style={{ textAlign: 'right', color: '#0369a1', fontWeight: '700' }}>{formatCurrency(r.gross_interest)}</td>
                      <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: '700' }}>{formatCurrency(r.tax_amount)}</td>
                      <td style={{ textAlign: 'right', color: '#d97706', fontWeight: '700' }}>{formatCurrency(r.excise_duty)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#059669' }}>{formatCurrency(r.net_interest)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#7c3aed', fontSize: '15px' }}>{formatCurrency(r.new_principal)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              const fakeInv = { id: r.investment_id, fdr_no: r.fdr_no, bank_name: r.bank_name };
                              handleViewHistory(fakeInv);
                            }}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', background: '#f3e8ff', color: '#7c3aed', border: '1.5px solid #c084fc', borderRadius: '7px' }}
                            title="Full Lifetime History Timeline"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#ede9fe', fontWeight: 'bold', borderTop: '2px solid #7c3aed' }}>
                    <td colSpan={8} style={{ textAlign: 'right', color: '#6d28d9', fontSize: '13.5px', fontWeight: '800' }}>
                      GRAND TOTAL ({inplaceRolloverList.count} event{inplaceRolloverList.count !== 1 ? 's' : ''}):
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--text-main)', fontSize: '14px' }}>
                      {formatCurrency(
                        inplaceRolloverList.totals?.opening_principal !== undefined
                          ? inplaceRolloverList.totals.opening_principal
                          : ((inplaceRolloverList.totals?.principal || 0) - (inplaceRolloverList.totals?.net || 0))
                      )}
                    </td>
                    <td style={{ textAlign: 'right', color: '#0369a1', fontWeight: '800' }}>{formatCurrency(inplaceRolloverList.totals.gross)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: '800' }}>{formatCurrency(inplaceRolloverList.totals.tax)}</td>
                    <td style={{ textAlign: 'right', color: '#d97706', fontWeight: '800' }}>{formatCurrency(inplaceRolloverList.totals.excise)}</td>
                    <td style={{ textAlign: 'right', color: '#059669', fontWeight: '800' }}>{formatCurrency(inplaceRolloverList.totals.net)}</td>
                    <td style={{ textAlign: 'right', color: '#6d28d9', fontSize: '15px', fontWeight: '900' }}>{formatCurrency(inplaceRolloverList.totals.principal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ) : filterStatus === 'Renewed' ? (
          // ── SPECIALIZED RENEWED LIST TABLE (FULL FINANCIAL BREAKDOWN) ──
          investments.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <RefreshCcw size={28} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                No Renewed Investment Records Found
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: 0 }}>
                Renewed investments appear here when an FDR or certificate reaches maturity and is renewed.
              </p>
            </div>
          ) : (
            <div className="data-table-container">
              <table id="investments-table" className="data-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th onClick={() => handleSort('fdr_no')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by FDR No">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>FDR / Cert No</span>
                        {renderSortIcon('fdr_no')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('bank_name')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Bank & Branch">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Bank &amp; Branch</span>
                        {renderSortIcon('bank_name')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('acc_code')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Fund Category">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Fund Category</span>
                        {renderSortIcon('acc_code')}
                      </div>
                    </th>
                    <th>Renewal Type</th>
                    <th onClick={() => handleSort('issue_date')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Opening Date">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Opening Date</span>
                        {renderSortIcon('issue_date')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('maturity_date')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Renewal Date">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Renewal Date</span>
                        {renderSortIcon('maturity_date')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('principal_amount')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} title="Sort by Opening Principal">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <span>Opening Principal</span>
                        {renderSortIcon('principal_amount')}
                      </div>
                    </th>
                    <th style={{ textAlign: 'right' }}>Gross Interest</th>
                    <th style={{ textAlign: 'right' }}>AIT Tax</th>
                    <th style={{ textAlign: 'right' }}>Excise Duty</th>
                    <th style={{ textAlign: 'right' }}>Net Profit</th>
                    <th style={{ textAlign: 'right' }}>New Principal</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvestments.map((inv, idx) => {
                    const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                    const r = inv.latest_rollover;

                    const openingPrincipal = isRollover
                      ? Math.round((r.principal_amount - r.net_interest) * 100) / 100
                      : inv.principal_amount;
                    const gross = isRollover ? r.gross_interest : (inv.actual_gross_interest || inv.accrued_gross_interest || 0);
                    const tax = isRollover ? r.tax_amount : (inv.actual_tax || inv.estimated_tax || 0);
                    const duty = isRollover ? r.excise_duty : (inv.actual_excise_duty || inv.estimated_excise_duty || 0);
                    const net = isRollover ? r.net_interest : (inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' ? inv.actual_net_interest : (gross - tax - duty));
                    const newPrincipal = isRollover ? r.principal_amount : (inv.encash_received || (inv.principal_amount + net));
                    const openingDate = inv.first_issue_date || inv.issue_date;
                    const renewalDate = isRollover ? r.event_date : (inv.encash_date || inv.maturity_date);

                    return (
                      <tr key={inv.id}>
                        <td style={{ color: 'var(--text-main)', fontWeight: '600' }}>{startRecord + idx}</td>
                        <td>
                          <strong style={{ color: 'var(--text-main)', fontWeight: '800' }}>{inv.fdr_no}</strong>
                          {inv.account_no && <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: '600' }}>A/C: {inv.account_no}</div>}
                        </td>
                        <td>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '12.5px' }}>{inv.bank_name}</div>
                          <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '600' }}>{inv.bank_branch || inv.branch_name}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '800', color: '#0369a1', fontSize: '12.5px' }}>
                            {inv.acc_code ? inv.acc_code : '—'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: '600' }}>
                            {inv.fund_name ? inv.fund_name : 'General Fund'}
                          </div>
                        </td>
                        <td>
                          {isRollover ? (
                            <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', border: '1.5px solid #a78bfa', fontWeight: '800' }}>Renew</span>
                          ) : (
                            <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1.5px solid #f59e0b', fontWeight: '800' }}>
                              Standard Renewal
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: '600' }}>{formatDate(openingDate)}</td>
                        <td><strong style={{ color: '#c2410c', fontWeight: '800' }}>{formatDate(renewalDate)}</strong></td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>
                          {formatCurrency(openingPrincipal)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#0369a1', fontWeight: '700' }}>
                          {formatCurrency(gross)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: '700' }}>
                          {formatCurrency(tax)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#d97706', fontWeight: '700' }}>
                          {formatCurrency(duty)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                          {formatCurrency(net)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#7c3aed', fontSize: '15px' }}>
                          {formatCurrency(newPrincipal)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => setStatementInv(inv)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px', background: '#e0f2fe', color: '#0369a1', border: '1.5px solid #7dd3fc', borderRadius: '7px' }}
                              title="FDR Bank Statement — Debit/Credit/Balance Ledger"
                            >
                              <BookOpen size={14} />
                            </button>
                            <button 
                              onClick={() => handleViewHistory(inv)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}
                              title="Full Lifetime History Timeline"
                            >
                              <History size={14} />
                            </button>
                            {isRollover && (
                              <button
                                onClick={() => handleUndoRollover(inv.id, r.id, inv.fdr_no)}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                                title="Undo In-Place Rollover — Restore previous principal & terms"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(124,58,237,0.1)', fontWeight: 'bold', borderTop: '2px solid #7c3aed' }}>
                    <td colSpan={7} style={{ textAlign: 'right', color: '#fbbf24', fontSize: '13px' }}>
                      GRAND TOTAL ({investments.length} Renewed FDR{investments.length !== 1 ? 's' : ''}):
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-main)' }}>
                      {formatCurrency(investments.reduce((sum, inv) => {
                        const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                        const r = inv.latest_rollover;
                        return sum + (isRollover ? (r.principal_amount - r.net_interest) : inv.principal_amount);
                      }, 0))}
                    </td>
                    <td style={{ textAlign: 'right', color: '#38bdf8' }}>
                      {formatCurrency(investments.reduce((sum, inv) => {
                        const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                        const r = inv.latest_rollover;
                        return sum + (isRollover ? r.gross_interest : (inv.actual_gross_interest || inv.accrued_gross_interest || 0));
                      }, 0))}
                    </td>
                    <td style={{ textAlign: 'right', color: '#f87171' }}>
                      {formatCurrency(investments.reduce((sum, inv) => {
                        const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                        const r = inv.latest_rollover;
                        return sum + (isRollover ? r.tax_amount : (inv.actual_tax || inv.estimated_tax || 0));
                      }, 0))}
                    </td>
                    <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                      {formatCurrency(investments.reduce((sum, inv) => {
                        const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                        const r = inv.latest_rollover;
                        return sum + (isRollover ? r.excise_duty : (inv.actual_excise_duty || inv.estimated_excise_duty || 0));
                      }, 0))}
                    </td>
                    <td style={{ textAlign: 'right', color: '#34d399' }}>
                      {formatCurrency(investments.reduce((sum, inv) => {
                        const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                        const r = inv.latest_rollover;
                        const gross = isRollover ? r.gross_interest : (inv.actual_gross_interest || inv.accrued_gross_interest || 0);
                        const tax = isRollover ? r.tax_amount : (inv.actual_tax || inv.estimated_tax || 0);
                        const duty = isRollover ? r.excise_duty : (inv.actual_excise_duty || inv.estimated_excise_duty || 0);
                        return sum + (isRollover ? r.net_interest : (inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' ? inv.actual_net_interest : (gross - tax - duty)));
                      }, 0))}
                    </td>
                    <td style={{ textAlign: 'right', color: '#c084fc', fontSize: '14px' }}>
                      {formatCurrency(investments.reduce((sum, inv) => {
                        const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                        const r = inv.latest_rollover;
                        const gross = isRollover ? r.gross_interest : (inv.actual_gross_interest || inv.accrued_gross_interest || 0);
                        const tax = isRollover ? r.tax_amount : (inv.actual_tax || inv.estimated_tax || 0);
                        const duty = isRollover ? r.excise_duty : (inv.actual_excise_duty || inv.estimated_excise_duty || 0);
                        const net = isRollover ? r.net_interest : (inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' ? inv.actual_net_interest : (gross - tax - duty));
                        return sum + (isRollover ? r.principal_amount : (inv.encash_received || (inv.principal_amount + net)));
                      }, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ) : investments.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Wallet size={28} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              No Investment Records Found
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 0 20px 0' }}>
              {search || filterType || filterStatus || filterBank || filterFund
                ? 'No investment records match your active search and filter options. Try clearing or adjusting your search.'
                : 'Start tracking your Fixed Deposit Receipts (FDR) and Savings Certificates by adding your first investment.'}
            </p>
            <button onClick={() => handleOpenAddModal(null)} className="btn-primary" style={{ padding: '9px 16px', borderRadius: '8px', fontSize: '13px' }}>
              <Plus size={16} />
              <span>Add New FDR / Certificate</span>
            </button>
          </div>
        ) : (
          <div className="data-table-container">
            <table id="investments-table" className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('fdr_no')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by FDR No">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Cert / FDR No</span>
                      {renderSortIcon('fdr_no')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('investment_type')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Type">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Type</span>
                      {renderSortIcon('investment_type')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('acc_code')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Fund Category">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Fund Category</span>
                      {renderSortIcon('acc_code')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('bank_name')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Bank & Branch">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Bank &amp; Branch</span>
                      {renderSortIcon('bank_name')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('principal_amount')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Principal Amount">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Principal Amount</span>
                      {renderSortIcon('principal_amount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('interest_rate')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Rate">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Rate (%)</span>
                      {renderSortIcon('interest_rate')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('issue_date')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Issue Date">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Issue Date</span>
                      {renderSortIcon('issue_date')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('maturity_date')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Maturity Date">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Maturity Date</span>
                      {renderSortIcon('maturity_date')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('accrued_gross_interest')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Accrued Interest">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Accrued Interest</span>
                      {renderSortIcon('accrued_gross_interest')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by Status">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvestments.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <strong 
                        style={{ color: '#0284c7', cursor: 'pointer', fontWeight: '800' }}
                        onClick={() => handleViewDetails(inv)}
                        title="Click to view full ledger details"
                      >
                        {inv.fdr_no}
                      </strong>
                      {inv.account_no && <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: '600' }}>A/C: {inv.account_no}</div>}
                    </td>
                    <td>
                      <span className={`badge ${inv.investment_type === 'FDR' ? 'badge-renewed' : 'badge-active'}`} style={{ fontWeight: '700' }}>
                        {inv.investment_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: '#0369a1', fontSize: '12.5px' }}>
                        {inv.acc_code ? inv.acc_code : '—'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: '600' }}>
                        {inv.fund_name ? inv.fund_name : 'General Fund'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '12.5px' }}>{inv.bank_name}</div>
                      <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '600' }}>{inv.bank_branch || inv.branch_name}</div>
                    </td>
                    <td><strong style={{ color: '#059669', fontSize: '15px', fontWeight: '800' }}>{formatCurrency(inv.principal_amount)}</strong></td>
                    <td><span style={{ fontWeight: '800', color: '#1d4ed8', fontSize: '13px' }}>{inv.interest_rate}%</span></td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{formatDate(inv.issue_date)}</div>
                      {inv.first_issue_date && inv.first_issue_date !== inv.issue_date && new Date(inv.first_issue_date) < new Date(inv.issue_date) && (
                        <div style={{ fontSize: '10.5px', color: '#b45309', marginTop: '2px', fontWeight: '800' }}>
                          Orig: {formatDate(inv.first_issue_date)}
                        </div>
                      )}
                    </td>
                    <td><span style={{ color: '#c2410c', fontWeight: '800', fontSize: '13px' }}>{formatDate(inv.maturity_date)}</span></td>
                    <td><strong style={{ color: 'var(--text-main)', fontWeight: '700' }}>{formatCurrency(inv.accrued_gross_interest)}</strong></td>
                    <td>
                      {inv.is_inplace_rollover && inv.status === 'Active' ? (
                        <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', border: '1.5px solid #a78bfa', fontWeight: '800' }}>
                          In-Place Renewed
                        </span>
                      ) : (
                        <span className={`badge badge-${(inv.status || 'Active').toLowerCase()}`} style={{ fontWeight: '800' }}>
                          {inv.status || 'Active'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleSendEmailNotice(inv)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #86efac', borderRadius: '7px' }}
                          title="Send FDR Maturity Notice to Bank & User Email"
                        >
                          <Mail size={14} />
                        </button>
                        <button
                          onClick={() => setStatementInv(inv)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', background: '#e0f2fe', color: '#0369a1', border: '1.5px solid #7dd3fc', borderRadius: '7px' }}
                          title="FDR Bank Statement — Debit/Credit/Balance Ledger"
                        >
                          <BookOpen size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenAddModal(inv)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', background: '#f8fafc', color: '#0f172a', border: '1.5px solid #cbd5e1', borderRadius: '7px' }}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        {inv.status === 'Active' && (
                          <>
                            <button 
                              onClick={() => handleOpenRenewModal(inv)}
                              className="btn-amber"
                              style={{ padding: '6px 10px', fontSize: '12px', background: '#fef3c7', color: '#92400e', border: '1.5px solid #fcd34d', borderRadius: '7px' }}
                              title="Renew FDR"
                            >
                              <RefreshCcw size={14} />
                            </button>
                            <button 
                              onClick={() => handleOpenEncashModal(inv)}
                              className="btn-success"
                              style={{ padding: '6px 10px', fontSize: '12px', background: '#dcfce7', color: '#15803d', border: '1.5px solid #86efac', borderRadius: '7px' }}
                              title="Encash FDR"
                            >
                              <CheckCircle size={14} />
                            </button>
                          </>
                        )}
                        {inv.status === 'Encashed' && (
                          <button
                            onClick={() => handleUndoEncashment(inv)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            title="Undo Encashment — Revert Status back to Active"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteInvestment(inv)}
                          className="btn-danger"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Delete Investment Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!loading && currentTotal > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}>
            {/* Left: Summary */}
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: 'var(--text-main)' }}>{startRecord}</strong>–<strong style={{ color: 'var(--text-main)' }}>{endRecord}</strong> of <strong style={{ color: 'var(--text-main)' }}>{currentTotal}</strong> items
              {pageSize !== 'All' && totalPages > 1 && (
                <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                  (Page <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> of <strong style={{ color: 'var(--text-main)' }}>{totalPages}</strong>)
                </span>
              )}
            </div>

            {/* Right: Page Navigation Buttons */}
            {pageSize !== 'All' && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: currentPage === 1 ? 0.45 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                {/* Numbered Page Buttons with Ellipsis */}
                {getPageNumbers(currentPage, totalPages).map((p, i) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${i}`} style={{ padding: '0 6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === currentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={isCurrent ? 'btn-primary' : 'btn-secondary'}
                      style={{
                        height: '34px',
                        minWidth: '34px',
                        padding: '0 8px',
                        fontSize: '12px',
                        fontWeight: isCurrent ? '700' : '500',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary"
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: currentPage === totalPages ? 0.45 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* HIDDEN FULL DATASET FOR EXCEL EXPORT (Exports all filtered rows regardless of pagination) */}
        <div style={{ display: 'none' }} aria-hidden="true">
          {filterStatus === 'InPlaceRenewed' ? (
            <table id="investments-table-all">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>FDR / Cert No</th>
                  <th>Fund Category</th>
                  <th>Bank &amp; Branch</th>
                  <th>Renewal Date</th>
                  <th>New Issue Date</th>
                  <th>New Maturity</th>
                  <th>Rate (%)</th>
                  <th>Gross Interest</th>
                  <th>AIT Tax</th>
                  <th>Excise Duty</th>
                  <th>Net Interest</th>
                  <th>New Principal</th>
                </tr>
              </thead>
              <tbody>
                {sortedRolloverRecords.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td>{r.fdr_no}</td>
                    <td>{r.acc_code ? `${r.acc_code} - ${r.fund_name || ''}` : ''}</td>
                    <td>{r.bank_name} - {r.bank_branch}</td>
                    <td>{formatDate(r.rollover_date)}</td>
                    <td>{formatDate(r.new_issue_date)}</td>
                    <td>{formatDate(r.new_maturity_date)}</td>
                    <td>{r.interest_rate}%</td>
                    <td>{r.gross_interest}</td>
                    <td>{r.tax_amount}</td>
                    <td>{r.excise_duty}</td>
                    <td>{r.net_interest}</td>
                    <td>{r.new_principal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filterStatus === 'Renewed' ? (
            <table id="investments-table-all">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>FDR / Cert No</th>
                  <th>Bank &amp; Branch</th>
                  <th>Fund Category</th>
                  <th>Renewal Type</th>
                  <th>Opening Date</th>
                  <th>Renewal Date</th>
                  <th>Opening Principal</th>
                  <th>Gross Interest</th>
                  <th>AIT Tax</th>
                  <th>Excise Duty</th>
                  <th>Net Profit</th>
                  <th>New Principal</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvestments.map((inv, idx) => {
                  const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                  const r = inv.latest_rollover;
                  const openingPrincipal = isRollover
                    ? Math.round((r.principal_amount - r.net_interest) * 100) / 100
                    : inv.principal_amount;
                  const gross = isRollover ? r.gross_interest : (inv.actual_gross_interest || inv.accrued_gross_interest || 0);
                  const tax = isRollover ? r.tax_amount : (inv.actual_tax || inv.estimated_tax || 0);
                  const duty = isRollover ? r.excise_duty : (inv.actual_excise_duty || inv.estimated_excise_duty || 0);
                  const net = isRollover ? r.net_interest : (inv.actual_net_interest !== undefined && inv.actual_net_interest !== null && inv.actual_net_interest !== '' ? inv.actual_net_interest : (gross - tax - duty));
                  const newPrincipal = isRollover ? r.principal_amount : (inv.encash_received || (inv.principal_amount + net));
                  const openingDate = inv.first_issue_date || inv.issue_date;
                  const renewalDate = isRollover ? r.event_date : (inv.encash_date || inv.maturity_date);
                  return (
                    <tr key={inv.id}>
                      <td>{idx + 1}</td>
                      <td>{inv.fdr_no}</td>
                      <td>{inv.bank_name} - {inv.bank_branch || inv.branch_name}</td>
                      <td>{inv.acc_code ? `${inv.acc_code} - ${inv.fund_name || ''}` : ''}</td>
                      <td>{isRollover ? 'In-Place Renewed' : 'Standard Renewal'}</td>
                      <td>{formatDate(openingDate)}</td>
                      <td>{formatDate(renewalDate)}</td>
                      <td>{openingPrincipal}</td>
                      <td>{gross}</td>
                      <td>{tax}</td>
                      <td>{duty}</td>
                      <td>{net}</td>
                      <td>{newPrincipal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table id="investments-table-all">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Cert / FDR No</th>
                  <th>Type</th>
                  <th>Account No</th>
                  <th>Fund Category</th>
                  <th>Bank &amp; Branch</th>
                  <th>Principal Amount</th>
                  <th>Rate (%)</th>
                  <th>Issue Date</th>
                  <th>Maturity Date</th>
                  <th>Accrued Interest</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvestments.map((inv, idx) => (
                  <tr key={inv.id}>
                    <td>{idx + 1}</td>
                    <td>{inv.fdr_no}</td>
                    <td>{inv.investment_type}</td>
                    <td>{inv.account_no || ''}</td>
                    <td>{inv.acc_code ? `${inv.acc_code} - ${inv.fund_name || ''}` : ''}</td>
                    <td>{inv.bank_name} - {inv.bank_branch || inv.branch_name}</td>
                    <td>{inv.principal_amount}</td>
                    <td>{inv.interest_rate}%</td>
                    <td>{formatDate(inv.issue_date)}</td>
                    <td>{formatDate(inv.maturity_date)}</td>
                    <td>{inv.accrued_gross_interest || 0}</td>
                    <td>{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT INVESTMENT */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={selectedInv ? `Edit Investment: ${selectedInv.fdr_no}` : 'Record New Investment Proposal / FDR'}
        maxWidth="1120px"
      >
        <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div className="compact-form-grid">
            
            {/* 1. Investment Type */}
            <div className="form-group form-group-sm">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Investment Type *</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button" 
                    onClick={handleAddCustomType} 
                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px' }} 
                    title="Add New Type"
                  >
                    <Plus size={12} /> Add
                  </button>
                  <button 
                    type="button" 
                    onClick={handleDeleteCustomType} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px' }} 
                    title="Delete Type"
                  >
                    <Trash2 size={12} /> Del
                  </button>
                </div>
              </label>
              <select
                className="form-select"
                value={formData.investment_type}
                onChange={(e) => setFormData({ ...formData, investment_type: e.target.value })}
                required
              >
                <option value="FDR">Fixed Deposit Receipt (FDR)</option>
                <option value="Savings Certificate">National Savings Certificate</option>
                {customTypes.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* 2. FDR / Cert No */}
            <div className="form-group form-group-sm">
              <label className="form-label">FDR / Certificate No *</label>
              <input
                type="text"
                className="form-input"
                value={formData.fdr_no}
                onChange={(e) => setFormData({ ...formData, fdr_no: e.target.value })}
                required
              />
            </div>

            {/* 3. Fund Category */}
            <div className="form-group form-group-sm">
              <label className="form-label">Fund Category & Account Code *</label>
              <select
                className="form-select"
                value={formData.acc_code}
                onChange={(e) => {
                  const fc = fundCategories.find(f => f.acc_code === e.target.value);
                  const newFundName = fc ? fc.fund_name : '';
                  const autoTax = getAutoTaxRate(e.target.value, newFundName);
                  setFormData({ ...formData, acc_code: e.target.value, fund_name: newFundName, tax_rate: autoTax });
                }}
                required
              >
                <option value="">Select Fund Account Code</option>
                {fundCategories.map(fc => (
                  <option key={fc.id} value={fc.acc_code}>
                    {fc.acc_code} - {fc.fund_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Bank Institution */}
            <div className="form-group form-group-sm">
              <label className="form-label">Bank Institution *</label>
              <select
                className="form-select"
                value={formData.bank_id}
                onChange={(e) => {
                  const b = banks.find(bk => bk.id === parseInt(e.target.value));
                  setFormData({ ...formData, bank_id: e.target.value, branch_name: b ? b.branch_name : '' });
                }}
                required
              >
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.branch_name})</option>
                ))}
              </select>
            </div>

            {/* 5. Branch Name */}
            <div className="form-group form-group-sm">
              <label className="form-label">Branch Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
              />
            </div>

            {/* 6. Account No */}
            <div className="form-group form-group-sm">
              <label className="form-label">Account No (If Any)</label>
              <input
                type="text"
                className="form-input"
                value={formData.account_no}
                onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
              />
            </div>

            {/* 7. Sanction Ref */}
            <div className="form-group form-group-sm">
              <label className="form-label">Sanction / Approval Ref</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SAN-2026/089"
                value={formData.sanction_ref}
                onChange={(e) => setFormData({ ...formData, sanction_ref: e.target.value })}
              />
            </div>

            {/* 8. Principal Amount */}
            <div className="form-group form-group-sm">
              <label className="form-label">Principal Amount (BDT) *</label>
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="10000000"
                value={formData.principal_amount}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                style={{ MozAppearance: 'textfield', fontWeight: '700' }}
                onWheel={(e) => e.target.blur()}
                required
              />
            </div>

            {/* 9. Interest Rate */}
            <div className="form-group form-group-sm">
              <label className="form-label">Interest Rate (% p.a.) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="10.5"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                style={{
                  MozAppearance: 'textfield',
                  fontWeight: '700',
                  borderColor: parseFloat(formData.interest_rate) > 100 ? '#ef4444' : ''
                }}
                onWheel={(e) => e.target.blur()}
                required
              />
            </div>

            {/* 10. Issue / Start Date */}
            <div className="form-group form-group-sm">
              <label className="form-label">Issue / Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.issue_date}
                onChange={(e) => {
                  const newIssue = e.target.value;
                  const newMat = calculateMaturityDate(newIssue, formData.tenure_months);
                  setFormData({
                    ...formData,
                    issue_date: newIssue,
                    maturity_date: newMat || formData.maturity_date
                  });
                }}
                required
              />
            </div>

            {/* 11. Tenure (Months) */}
            <div className="form-group form-group-sm">
              <label className="form-label">Tenure (Months) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="12"
                value={formData.tenure_months}
                onChange={(e) => {
                  const newTenure = e.target.value;
                  const newMat = calculateMaturityDate(formData.issue_date, newTenure);
                  setFormData({
                    ...formData,
                    tenure_months: newTenure,
                    maturity_date: newMat || formData.maturity_date
                  });
                }}
                style={{ MozAppearance: 'textfield' }}
                onWheel={(e) => e.target.blur()}
                required
              />
            </div>

            {/* 12. Maturity Date (Manual or Auto-calculated) */}
            <div className="form-group form-group-sm">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Maturity Date *</span>
                <button
                  type="button"
                  onClick={() => {
                    const autoMat = calculateMaturityDate(formData.issue_date, formData.tenure_months);
                    if (autoMat) {
                      setFormData({ ...formData, maturity_date: autoMat });
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '10.5px',
                    fontWeight: '700'
                  }}
                  title="Auto calculate maturity date from Issue Date and Tenure"
                >
                  ⚡ Auto
                </button>
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.maturity_date || ''}
                onChange={(e) => {
                  const newMat = e.target.value;
                  let updatedTenure = formData.tenure_months;
                  if (formData.issue_date && newMat) {
                    const d1 = new Date(formData.issue_date);
                    const d2 = new Date(newMat);
                    const diffMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                    if (diffMonths > 0) {
                      updatedTenure = String(diffMonths);
                    }
                  }
                  setFormData({
                    ...formData,
                    maturity_date: newMat,
                    tenure_months: updatedTenure
                  });
                }}
                style={{ fontWeight: '700', color: 'var(--text-main)' }}
                required
              />
            </div>

            {/* 13. Compounding Frequency */}
            <div className="form-group form-group-sm">
              <label className="form-label">Compounding Frequency</label>
              <select
                className="form-select"
                value={formData.compounding_frequency}
                onChange={(e) => setFormData({ ...formData, compounding_frequency: e.target.value })}
              >
                <option value="At Maturity">At Maturity (Simple Interest)</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {/* 14. AIT Tax Rate */}
            <div className="form-group form-group-sm">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>AIT Tax Rate (%)</span>
                <span style={{
                  fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px',
                  background: formData.tax_rate <= 10 ? 'rgba(52,211,153,0.15)' : formData.tax_rate <= 20 ? 'rgba(59,130,246,0.15)' : 'rgba(251,191,36,0.15)',
                  color: formData.tax_rate <= 10 ? '#34d399' : formData.tax_rate <= 20 ? '#60a5fa' : '#fbbf24',
                  border: `1px solid ${formData.tax_rate <= 10 ? 'rgba(52,211,153,0.3)' : formData.tax_rate <= 20 ? 'rgba(59,130,246,0.3)' : 'rgba(251,191,36,0.3)'}`
                }}>
                  {formData.tax_rate <= 10 ? '10% CPF' : formData.tax_rate <= 20 ? '20% TIN' : '30% No TIN'}
                </span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                className="form-input"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                style={{ MozAppearance: 'textfield', fontWeight: '700' }}
                onWheel={(e) => e.target.blur()}
              />
            </div>

            {/* 15. Investment Status */}
            <div className="form-group form-group-sm">
              <label className="form-label">Investment Status</label>
              <select
                className="form-select"
                value={formData.status || 'Active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ fontWeight: '600' }}
              >
                <option value="Active">Active</option>
                <option value="Matured">Matured</option>
                <option value="Renewed">Renewed</option>
                <option value="Encashed">Encashed</option>
              </select>
            </div>

            {/* 16. Remarks / Description */}
            <div className="form-group form-group-sm">
              <label className="form-label">Remarks / Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional notes or sanction details"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>

          </div>

          {/* COMPACT FOOTER BAR: FINANCIAL PREVIEW + ACTION BUTTONS */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '10px',
            padding: '8px 14px',
            marginTop: '4px',
            gap: '12px'
          }}>
            {/* Calculation Preview Strip */}
            {formData.principal_amount > 0 && formData.interest_rate > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Maturity:</span> <strong style={{ color: '#fbbf24' }}>{formatDate(maturityPreview)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Gross Interest:</span> <strong style={{ color: '#34d399' }}>{formatCurrency(financialPreview.grossInterest)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Tax ({financialPreview.taxRate}%):</span> <strong style={{ color: '#fb7185' }}>{formatCurrency(financialPreview.taxAmount)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Excise Duty:</span> <strong style={{ color: '#fb7185' }}>{formatCurrency(financialPreview.exciseDuty)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Net Maturity:</span> <strong style={{ color: '#34d399', fontSize: '13px' }}>{formatCurrency(financialPreview.netMaturityAmount)}</strong></div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Enter Principal Amount and Interest Rate to view live maturity calculations.
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }}>
                {selectedInv ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </div>

        </form>
      </Modal>

      {/* MODAL: VIEW DETAILS */}
      {selectedInv && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Investment Ledger: ${selectedInv.fdr_no}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px' }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Bank:</span> <strong style={{ color: 'var(--text-main)' }}>{selectedInv.bank_name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Branch:</span> <strong style={{ color: 'var(--text-main)' }}>{selectedInv.bank_branch || selectedInv.branch_name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Principal:</span> <strong style={{ color: '#34d399' }}>{formatCurrency(selectedInv.principal_amount)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Interest Rate:</span> <strong style={{ color: '#60a5fa' }}>{selectedInv.interest_rate}% p.a.</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Issue Date:</span> <span style={{ color: 'var(--text-main)' }}>{formatDate(selectedInv.issue_date)}</span></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Maturity Date:</span> <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formatDate(selectedInv.maturity_date)}</span></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Compounding:</span> <span style={{ color: 'var(--text-main)' }}>{selectedInv.compounding_frequency}</span></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>AIT Tax Rate:</span> <span style={{ color: 'var(--text-main)' }}>{getTaxRate(1, selectedInv.fund_name, selectedInv.acc_code, settings)}% Tax Applied</span></div>
            </div>

            {/* Interest Calculations Ledger */}
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#34d399', marginBottom: '8px' }}>
                Accrued Earnings & Deductions Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Gross Accrued Interest</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{formatCurrency(selectedInv.accrued_gross_interest)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Est. Tax Provision</div>
                  <div style={{ fontWeight: '700', color: '#fb7185' }}>{formatCurrency(selectedInv.estimated_tax)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Est. Excise Duty</div>
                  <div style={{ fontWeight: '700', color: '#fb7185' }}>{formatCurrency(selectedInv.estimated_excise_duty)}</div>
                </div>
              </div>
            </div>

            {/* Provisions History Table */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                Posted Provisions History ({selectedInv.provisions ? selectedInv.provisions.length : 0})
              </h4>
              {(!selectedInv.provisions || selectedInv.provisions.length === 0) ? (
                <div style={{ fontSize: '12px', color: '#64748b' }}>No periodic provisions posted yet for this investment.</div>
              ) : (
                <table className="data-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Provision Date</th>
                      <th>Period</th>
                      <th>Gross Interest</th>
                      <th>Tax Amount</th>
                      <th>Net Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInv.provisions.map(p => (
                      <tr key={p.id}>
                        <td>{formatDate(p.provision_date)}</td>
                        <td>{formatDate(p.period_start)} to {formatDate(p.period_end)}</td>
                        <td>{formatCurrency(p.gross_interest)}</td>
                        <td>{formatCurrency(p.tax_amount)}</td>
                        <td><strong style={{ color: '#34d399' }}>{formatCurrency(p.net_interest)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleViewHistory(selectedInv);
                }}
                className="btn-secondary"
                style={{ padding: '7px 14px', fontSize: '12px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <History size={14} />
                <span>View Full Lifetime History Timeline</span>
              </button>
              <button type="button" onClick={() => setIsViewModalOpen(false)} className="btn-primary" style={{ padding: '7px 18px', fontSize: '12px' }}>
                Close
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* MODAL: FDR LIFETIME HISTORY TIMELINE & FINANCIAL LEDGER */}
      {selectedInv && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Full Lifetime History & Financial Ledger: #${selectedInv.fdr_no}`}
          maxWidth="900px"
        >
          {historyLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Fetching FDR history & financial ledger...</div>
          ) : !historyData ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No history events found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* FDR Overview Card */}
              <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#c084fc' }}>{historyData.investment.fdr_no}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {historyData.investment.bank_name} ({historyData.investment.bank_branch}) | Fund: {historyData.investment.fund_name || 'N/A'} ({historyData.investment.acc_code || 'N/A'})
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#34d399' }}>{formatCurrency(historyData.investment.principal_amount)}</div>
                    <div style={{ fontSize: '12px', color: '#60a5fa' }}>{historyData.investment.interest_rate}% p.a.</div>
                  </div>
                </div>
              </div>

              {/* FINANCIAL HISTORY LEDGER TABLE */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Financial Ledger History (Principal, Interest, Tax & Excise Duty)</span>
                </h4>
                {(!historyData.financialHistory || historyData.financialHistory.length === 0) ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No financial snapshot history recorded.</div>
                ) : (
                  <div className="data-table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Event</th>
                          <th>Principal Amount</th>
                          <th>Gross Interest</th>
                          <th>Tax (AIT)</th>
                          <th>Excise Duty</th>
                          <th>Net Profit</th>
                          <th>Total Balance</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.financialHistory.map((item, idx) => (
                          <tr key={idx}>
                            <td>{formatDate(item.snapshot_date)}</td>
                            <td><span className="badge badge-active">{item.event_type}</span></td>
                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(item.principal_amount)}</td>
                            <td style={{ color: '#10b981' }}>{formatCurrency(item.gross_interest_earned)}</td>
                            <td style={{ color: '#ef4444' }}>{formatCurrency(item.tax_amount)}</td>
                            <td style={{ color: '#f59e0b' }}>{formatCurrency(item.excise_duty)}</td>
                            <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{formatCurrency(item.net_interest_earned)}</td>
                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(item.total_balance_snapshot)}</td>
                            <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Chronological Activity Timeline */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>
                  Chronological Event Timeline
                </h4>
                <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                  {historyData.timeline.map((event, idx) => (
                    <div key={idx} style={{ position: 'relative', marginBottom: '16px' }}>
                      
                      {/* Timeline Bullet */}
                      <div style={{
                        position: 'absolute',
                        left: '-31px',
                        top: '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: event.type === 'CREATION' ? '#3b82f6' : event.type === 'PROVISION' ? '#10b981' : event.type === 'LETTER' ? '#f59e0b' : '#ef4444',
                        border: '3px solid #0f172a'
                      }} />

                      <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{event.title}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(event.date)}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                          {event.description}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </Modal>
      )}

      {/* MODAL: RENEW INVESTMENT */}
      {selectedInv && (
        <Modal
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
          title={`Renew FDR Investment: #${selectedInv.fdr_no}`}
        >
          <form onSubmit={handleRenewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* RENEWAL MODE SELECTION */}
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <label className="form-label" style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '12px' }}>
                Select Renewal & Reinvestment Method:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', borderRadius: '8px',
                  background: renewForm.renewal_mode === 'inplace' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${renewForm.renewal_mode === 'inplace' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="renewal_mode"
                    value="inplace"
                    checked={renewForm.renewal_mode === 'inplace'}
                    onChange={() => {
                      const net = parseFloat(renewForm.old_actual_net_interest) || 0;
                      setRenewForm({
                        ...renewForm,
                        renewal_mode: 'inplace',
                        new_fdr_no: selectedInv.fdr_no,
                        new_principal: selectedInv.principal_amount + net
                      });
                    }}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '12px', color: 'var(--text-main)', display: 'block' }}>In-Place Rollover (Same FDR)</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3', display: 'block', marginTop: '2px' }}>
                      Keep same FDR active without closing. Auto-add Net Profit to Principal & extend tenure.
                    </span>
                  </div>
                </label>

                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', borderRadius: '8px',
                  background: renewForm.renewal_mode === 'new_fdr' ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-card-hover)',
                  border: `1px solid ${renewForm.renewal_mode === 'new_fdr' ? '#38bdf8' : 'var(--border-color)'}`,
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="renewal_mode"
                    value="new_fdr"
                    checked={renewForm.renewal_mode === 'new_fdr'}
                    onChange={() => {
                      setRenewForm({
                        ...renewForm,
                        renewal_mode: 'new_fdr',
                        new_fdr_no: `${selectedInv.fdr_no}-R`,
                        new_principal: selectedInv.principal_amount
                      });
                    }}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '12px', color: 'var(--text-main)', display: 'block' }}>Create New FDR Instrument</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3', display: 'block', marginTop: '2px' }}>
                      Close old FDR as 'Renewed' and create a new separate FDR certificate record.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* SECTION 1: OLD FDR SETTLEMENT DETAILS */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#f59e0b', margin: '0 0 10px 0' }}>
                1. Old FDR Final Settlement (Bank Certificate / Advice)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Actual Gross Interest (BDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={renewForm.old_actual_gross_interest}
                    onChange={(e) => handleRenewFieldChange('old_actual_gross_interest', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Actual AIT Tax Deducted (BDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={renewForm.old_actual_tax}
                    onChange={(e) => handleRenewFieldChange('old_actual_tax', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Actual Excise Duty (BDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={renewForm.old_actual_excise_duty}
                    onChange={(e) => handleRenewFieldChange('old_actual_excise_duty', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Actual Bank Charge (BDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="0"
                    value={renewForm.old_actual_bank_charge}
                    onChange={(e) => handleRenewFieldChange('old_actual_bank_charge', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Actual Net Interest Realized (BDT)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  style={{ color: '#34d399', fontWeight: 'bold' }}
                  value={renewForm.old_actual_net_interest}
                  onChange={(e) => handleRenewFieldChange('old_actual_net_interest', e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 2: NEW FDR REINVESTMENT */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', margin: '0 0 10px 0' }}>
                2. New Reinvested FDR Details
              </h4>

              {/* INTEREST TREATMENT MODE */}
              <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                  Net Interest Disposal / Treatment Method:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const net = parseFloat(renewForm.old_actual_net_interest) || 0;
                      setRenewForm({
                        ...renewForm,
                        interest_deposit_mode: 'reinvest',
                        new_principal: (selectedInv ? selectedInv.principal_amount : 0) + net
                      });
                    }}
                    style={{
                      padding: '8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                      background: renewForm.interest_deposit_mode === 'reinvest' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${renewForm.interest_deposit_mode === 'reinvest' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                      color: renewForm.interest_deposit_mode === 'reinvest' ? '#38bdf8' : '#94a3b8'
                    }}
                  >
                    Add Net Interest to Principal
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRenewForm({
                        ...renewForm,
                        interest_deposit_mode: 'bank_deposit',
                        new_principal: selectedInv ? selectedInv.principal_amount : 0
                      });
                    }}
                    style={{
                      padding: '8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                      background: renewForm.interest_deposit_mode === 'bank_deposit' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${renewForm.interest_deposit_mode === 'bank_deposit' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                      color: renewForm.interest_deposit_mode === 'bank_deposit' ? '#34d399' : '#94a3b8'
                    }}
                  >
                    Deposit Net Interest to Bank (Only Principal Renewed)
                  </button>
                </div>
              </div>

              {/* NET INTEREST BANK DEPOSIT PANEL (When Only Principal Renewed) */}
              {renewForm.interest_deposit_mode === 'bank_deposit' && (
                <div style={{ background: 'rgba(52, 211, 153, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', marginBottom: '12px' }}>
                  <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Net Interest Bank Deposit Details
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Bank Name (Deposit Account)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Sonali Bank, Corporate Branch"
                        value={renewForm.deposit_bank_name}
                        onChange={(e) => setRenewForm({ ...renewForm, deposit_bank_name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Deposit Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={renewForm.deposit_date}
                        onChange={(e) => setRenewForm({ ...renewForm, deposit_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Interest Realization Status (Remarks)</label>
                      <select
                        className="form-select"
                        style={{ fontSize: '11px' }}
                        value={renewForm.deposit_remarks_type}
                        onChange={(e) => setRenewForm({ ...renewForm, deposit_remarks_type: e.target.value })}
                      >
                        <option value="right">Right Amount Realized (Right)</option>
                        <option value="short">Short Realization (Short)</option>
                        <option value="excess">Excess Realization (Excess)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Additional Deposit Remarks</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Voucher / Advice Ref #123"
                        value={renewForm.deposit_remarks_custom}
                        onChange={(e) => setRenewForm({ ...renewForm, deposit_remarks_custom: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">New FDR Certificate Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={renewForm.new_fdr_no}
                  onChange={(e) => setRenewForm({ ...renewForm, new_fdr_no: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>New Principal Amount (BDT)</label>
                  {renewForm.interest_deposit_mode !== 'reinvest' && (
                    <button
                      type="button"
                      onClick={() => {
                        const newP = selectedInv.principal_amount + (parseFloat(renewForm.old_actual_net_interest) || 0);
                        setRenewForm({ ...renewForm, interest_deposit_mode: 'reinvest', new_principal: newP });
                      }}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      + Add Net Interest to Principal
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={renewForm.new_principal}
                  onChange={(e) => setRenewForm({ ...renewForm, new_principal: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Renewal Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={renewForm.new_rate}
                  onChange={(e) => setRenewForm({ ...renewForm, new_rate: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Renewal Issue Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={renewForm.new_issue_date}
                    onChange={(e) => {
                      const mat = calculateMaturityDate(e.target.value, renewForm.new_tenure_months);
                      setRenewForm({ ...renewForm, new_issue_date: e.target.value, new_maturity_date: mat });
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Renewal Tenure (Months)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={renewForm.new_tenure_months}
                    onChange={(e) => {
                      const mat = calculateMaturityDate(renewForm.new_issue_date, e.target.value);
                      setRenewForm({ ...renewForm, new_tenure_months: e.target.value, new_maturity_date: mat });
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Renewal Maturity Date</span>
                    <button
                      type="button"
                      onClick={() => {
                        const autoMat = calculateMaturityDate(renewForm.new_issue_date, renewForm.new_tenure_months);
                        if (autoMat) {
                          setRenewForm({ ...renewForm, new_maturity_date: autoMat });
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: '10.5px', fontWeight: '700' }}
                      title="Auto calculate maturity date from Issue Date and Tenure"
                    >
                      ⚡ Auto
                    </button>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={renewForm.new_maturity_date || ''}
                    onChange={(e) => setRenewForm({ ...renewForm, new_maturity_date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button type="button" onClick={() => setIsRenewModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Process FDR Renewal
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ENCASH INVESTMENT */}
      {selectedInv && (
        <Modal
          isOpen={isEncashModalOpen}
          onClose={() => setIsEncashModalOpen(false)}
          title={`Encash & Settle FDR: #${selectedInv.fdr_no}`}
        >
          <form onSubmit={handleEncashSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Settlement / Encashment Date</label>
              <input
                type="date"
                className="form-input"
                value={encashForm.encash_date}
                onChange={(e) => setEncashForm({ ...encashForm, encash_date: e.target.value })}
                required
              />
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #34d399' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', margin: '0 0 10px 0' }}>
                Bank Settlement Actual Breakdown (Per Advice / Certificate)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Actual Gross Interest (BDT)</label>
                  <input
                    type="number" step="any" className="form-input"
                    value={encashForm.actual_gross_interest}
                    onChange={(e) => handleEncashFieldChange('actual_gross_interest', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Actual AIT Tax Deducted (BDT)</label>
                  <input
                    type="number" step="any" className="form-input"
                    value={encashForm.actual_tax}
                    onChange={(e) => handleEncashFieldChange('actual_tax', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Actual Excise Duty (BDT)</label>
                  <input
                    type="number" step="any" className="form-input"
                    value={encashForm.actual_excise_duty}
                    onChange={(e) => handleEncashFieldChange('actual_excise_duty', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Actual Bank Charge (BDT)</label>
                  <input
                    type="number" step="any" className="form-input"
                    placeholder="0"
                    value={encashForm.actual_bank_charge}
                    onChange={(e) => handleEncashFieldChange('actual_bank_charge', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Actual Net Profit (BDT)</label>
                <input
                  type="number" step="any" className="form-input"
                  style={{ color: '#34d399', fontWeight: 'bold' }}
                  value={encashForm.actual_net_interest}
                  onChange={(e) => handleEncashFieldChange('actual_net_interest', e.target.value)}
                />
              </div>
            </div>

            {/* NET INTEREST TREATMENT MODE */}
            <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '6px' }}>
              <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                Net Profit Realization Method:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEncashForm(f => ({
                    ...f,
                    interest_deposit_mode: 'full',
                    total_received: (selectedInv ? selectedInv.principal_amount : 0) + (parseFloat(f.actual_net_interest) || 0)
                  }))}
                  style={{
                    padding: '8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                    background: encashForm.interest_deposit_mode === 'full' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${encashForm.interest_deposit_mode === 'full' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                    color: encashForm.interest_deposit_mode === 'full' ? '#34d399' : '#94a3b8'
                  }}
                >
                  Principal + Net Interest Received Together
                </button>

                <button
                  type="button"
                  onClick={() => setEncashForm(f => ({
                    ...f,
                    interest_deposit_mode: 'bank_deposit',
                    total_received: selectedInv ? selectedInv.principal_amount : 0
                  }))}
                  style={{
                    padding: '8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                    background: encashForm.interest_deposit_mode === 'bank_deposit' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${encashForm.interest_deposit_mode === 'bank_deposit' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                    color: encashForm.interest_deposit_mode === 'bank_deposit' ? '#fbbf24' : '#94a3b8'
                  }}
                >
                  Only Principal Received — Net Interest Deposited to Bank
                </button>
              </div>
            </div>

            {/* BANK DEPOSIT DETAILS PANEL */}
            {(encashForm.interest_deposit_mode === 'bank_deposit' || encashForm.interest_deposit_mode === 'full') && (
              <div style={{
                background: encashForm.interest_deposit_mode === 'full' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${encashForm.interest_deposit_mode === 'full' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
              }}>
                <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: encashForm.interest_deposit_mode === 'full' ? '#34d399' : '#fbbf24', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Net Interest Bank Deposit Details
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Bank Name (Deposit Account)</label>
                    <input
                      type="text" className="form-input"
                      placeholder="e.g. Sonali Bank, Corporate Branch"
                      value={encashForm.deposit_bank_name}
                      onChange={(e) => setEncashForm({ ...encashForm, deposit_bank_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Deposit Date</label>
                    <input
                      type="date" className="form-input"
                      value={encashForm.deposit_date}
                      onChange={(e) => setEncashForm({ ...encashForm, deposit_date: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Interest Realization Status</label>
                    <select
                      className="form-select"
                      style={{ fontSize: '11px' }}
                      value={encashForm.deposit_remarks_type}
                      onChange={(e) => setEncashForm({ ...encashForm, deposit_remarks_type: e.target.value })}
                    >
                      <option value="right">Right Amount Realized (Right)</option>
                      <option value="short">Short Realization (Short)</option>
                      <option value="excess">Excess Realization (Excess)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Additional Remarks</label>
                    <input
                      type="text" className="form-input"
                      placeholder="e.g. Voucher / Advice Ref #123"
                      value={encashForm.deposit_remarks_custom}
                      onChange={(e) => setEncashForm({ ...encashForm, deposit_remarks_custom: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Total Amount Received (Principal{encashForm.interest_deposit_mode === 'bank_deposit' ? ' Only' : ' + Net Profit'})</label>
              <input
                type="number" step="any" className="form-input"
                style={{ fontSize: '15px', fontWeight: '800', color: encashForm.interest_deposit_mode === 'bank_deposit' ? '#fbbf24' : '#34d399' }}
                value={encashForm.total_received}
                onChange={(e) => setEncashForm({ ...encashForm, total_received: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Remarks / Bank Advice & Voucher Ref</label>
              <textarea
                className="form-textarea" rows={2}
                value={encashForm.remarks}
                onChange={(e) => setEncashForm({ ...encashForm, remarks: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setIsEncashModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Confirm Settlement
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: BULK UPLOAD FDR EXCEL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportRows([]);
          setImportFileName('');
        }}
        title="Bulk Upload FDR / Investment Records from Excel"
        maxWidth="850px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Instructions Box */}
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ color: '#60a5fa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileSpreadsheet size={18} />
                <span>Bulk Import Guidelines & Pre-formatted Excel Template</span>
              </strong>
              <button
                type="button"
                onClick={downloadFdrTemplate}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-card-hover)', color: 'var(--primary)', border: '1px solid var(--border-color)' }}
              >
                <Download size={14} />
                <span>Download Sample Template (.xlsx)</span>
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
              Select an Excel file containing FDR records. Headers supported: <code>FDR No</code>, <code>Bank Name</code>, <code>Branch Name</code>, <code>Principal Amount</code>, <code>Interest Rate %</code>, <code>Issue Date</code>, <code>Tenure (Months)</code>, <code>Account Code</code>, <code>Fund Name</code>.
            </p>
          </div>

          {/* File Picker */}
          <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'var(--bg-card-hover)' }}>
            <Upload size={32} color="var(--primary)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
              {importFileName ? importFileName : 'Choose Excel File (.xlsx, .xls, .csv)'}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: '16px' }}>
              Click below to pick the file from your computer
            </p>
            
            <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} />
              <span>{importFileName ? 'Change File' : 'Browse File...'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Data Preview Table */}
          {importRows.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>
                  Parsed Preview ({importRows.length} Rows Ready)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Duplicate FDR numbers will be safely skipped automatically
                </span>
              </div>

              <div className="data-table-container" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>FDR No</th>
                      <th>Bank Name</th>
                      <th>Branch</th>
                      <th>Principal</th>
                      <th>Rate %</th>
                      <th>Issue Date</th>
                      <th>Account Code</th>
                      <th>Fund Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{row.fdr_no || row['FDR No'] || row['FDR / Certificate No'] || '—'}</strong></td>
                        <td>{row.bank_name || row['Bank Name'] || '—'}</td>
                        <td>{row.branch_name || row['Branch Name'] || 'Main Branch'}</td>
                        <td><span style={{ color: '#34d399', fontWeight: 'bold' }}>{row.principal_amount || row['Principal Amount'] || '0'}</span></td>
                        <td><span style={{ color: '#60a5fa' }}>{row.interest_rate || row['Interest Rate %'] || '0'}%</span></td>
                        <td>{row.issue_date || row['Issue Date'] || row['Issue Date (YYYY-MM-DD)'] || '—'}</td>
                        <td><span style={{ color: '#38bdf8' }}>{row.acc_code || row['Account Code'] || '—'}</span></td>
                        <td>{row.fund_name || row['Fund Name'] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importRows.length > 50 && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
                  Showing first 50 of {importRows.length} rows. All {importRows.length} rows will be processed.
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportRows([]);
                setImportFileName('');
              }}
              className="btn-secondary"
              disabled={importing}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleBulkSubmit}
              className="btn-primary"
              disabled={importRows.length === 0 || importing}
            >
              {importing ? 'Importing Records...' : `Confirm & Import ${importRows.length} Records`}
            </button>
          </div>

        </div>
      </Modal>

      {/* FULL-SCREEN: FDR BANK STATEMENT */}
      {statementInv && (
        <FDRBankStatement
          invId={statementInv.id}
          invFdrNo={statementInv.fdr_no}
          settings={settings}
          onClose={() => setStatementInv(null)}
        />
      )}

    </div>
  );
}
