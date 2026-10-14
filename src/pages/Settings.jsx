import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  UserCheck, 
  Building2, 
  Image as ImageIcon, 
  Save, 
  CheckCircle2, 
  Upload,
  FileText,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Layers,
  Mail,
  AlertTriangle,
  Send,
  Bell,
  Volume2,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { api } from '../utils/api';

export default function Settings({ showToast, onRefreshStats }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    org_name: 'Gazipur Palli Bidyut Samity-2',
    org_address: 'Rajendrapur, Gazipur-1729',
    org_phone: '+8801776097416',
    org_email: 'gazipbs2@gmail.com',
    org_logo_url: '',
    org_secondary_logo_url: '',
    signatory_accountant_name: 'Accounts Officer',
    signatory_accountant: 'Officer (Accounts)',
    signatory_accountant_signature: '',
    signatory_agm_name: 'Md. Ariful Islam',
    signatory_agm_finance: 'AGM (Finance & Accounts)',
    signatory_agm_signature: '',
    signatory_gm_name: 'Md. Rabiul Haque',
    signatory_gm: 'General Manager',
    signatory_gm_signature: '',
    tax_rate_cpf: '10',
    tax_rate_tin: '20',
    tax_rate_no_tin: '30',
    memo_ref_prefix: '27.12.6400.506.04.044',
    excise_tier1_limit: '400000',
    excise_tier1_tax: '0',
    excise_tier2_limit: '5000000',
    excise_tier2_tax: '500',
    excise_tier3_limit: '10000000',
    excise_tier3_tax: '3000',
    excise_tier4_limit: '50000000',
    excise_tier4_tax: '5000',
    excise_tier5_tax: '10000',
    alert_email_address: 'gazipbs2@gmail.com',
    alert_email_enabled: 'true',
    alert_days_before: '7,3,1,0',
    telegram_alerts_enabled: 'false',
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_alert_days: '7,3,1,0',
    desktop_alerts_enabled: 'true',
    smtp_sender_email: 'gazipbs2@gmail.com',
    smtp_app_password: '',
    smtp_send_to_bank_email: 'true'
  });

  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [runningCheckNow, setRunningCheckNow] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Banks List for email directory status
  const [banksList, setBanksList] = useState([]);

  // Fund Categories State & Modal
  const [fundCategories, setFundCategories] = useState([]);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [fundForm, setFundForm] = useState({ acc_code: '', fund_name: '', description: '' });
  const [deleteTargetFundId, setDeleteTargetFundId] = useState(null);

  // General Accounts Chart of Accounts (COA) State
  const [coaList, setCoaList] = useState([]);
  const [coaLoading, setCoaLoading] = useState(false);
  const [coaCategoryFilter, setCoaCategoryFilter] = useState('ALL');
  const [coaSearch, setCoaSearch] = useState('');
  const [isCoaModalOpen, setIsCoaModalOpen] = useState(false);
  const [editingCoa, setEditingCoa] = useState(null);
  const [coaForm, setCoaForm] = useState({
    account_code: '',
    account_name: '',
    account_type: 'Asset',
    sub_category: '',
    fund_name: 'General',
    description: ''
  });
  const [deleteTargetCoa, setDeleteTargetCoa] = useState(null);

  // Custom Investment Types State
  const [customTypes, setCustomTypes] = useState([]);

  useEffect(() => {
    loadSettings();
    loadFundCategories();
    loadCOA();
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const data = await api.getBanks();
      setBanksList(data || []);
    } catch (e) {
      console.error('Failed to load banks for settings:', e);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && data.org_name) {
        setSettings(prev => ({ ...prev, ...data }));
      }
      if (data && data.custom_investment_types) {
        try {
          setCustomTypes(JSON.parse(data.custom_investment_types));
        } catch (e) {
          setCustomTypes([]);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
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
    const defaultTypes = ['FDR', 'Fixed Deposit Receipt (FDR)', 'Savings Certificate', 'National Savings Certificate'];
    if (customTypes.includes(trimmed) || defaultTypes.includes(trimmed)) {
      showToast('This investment type already exists.', 'error');
      return;
    }
    
    const updatedTypes = [...customTypes, trimmed];
    try {
      await api.updateSettings({ custom_investment_types: JSON.stringify(updatedTypes) });
      setCustomTypes(updatedTypes);
      showToast('Custom investment type added successfully', 'success');
    } catch (err) {
      showToast('Failed to add custom type: ' + err.message, 'error');
    }
  };

  const handleDeleteCustomType = async (typeToDelete) => {
    const result = await Swal.fire({
      title: 'Delete Custom Investment Type?',
      text: `Are you sure you want to delete "${typeToDelete}"?`,
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
    
    const updatedTypes = customTypes.filter(t => t !== typeToDelete);
    try {
      await api.updateSettings({ custom_investment_types: JSON.stringify(updatedTypes) });
      setCustomTypes(updatedTypes);
      showToast('Custom investment type deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete custom type: ' + err.message, 'error');
    }
  };

  const loadFundCategories = async () => {
    try {
      const funds = await api.getFundCategories();
      setFundCategories(funds);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenFundModal = () => {
    setSelectedFund(null);
    setFundForm({ acc_code: '', fund_name: '', description: '' });
    setIsFundModalOpen(true);
  };

  const handleEditFund = (fc) => {
    setSelectedFund(fc);
    setFundForm({ acc_code: fc.acc_code, fund_name: fc.fund_name, description: fc.description || '' });
    setIsFundModalOpen(true);
  };

  const handleSaveFund = async (e) => {
    e.preventDefault();
    try {
      if (selectedFund) {
        await api.updateFundCategory(selectedFund.id, fundForm);
        showToast('Fund Account Code updated', 'success');
      } else {
        await api.createFundCategory(fundForm);
        showToast('New Fund Account Code created', 'success');
      }
      setIsFundModalOpen(false);
      loadFundCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteFund = (id) => {
    setDeleteTargetFundId(id);
  };

  const handleConfirmDeleteFund = async () => {
    if (!deleteTargetFundId) return;
    try {
      await api.deleteFundCategory(deleteTargetFundId);
      showToast('Fund Category deleted', 'info');
      setDeleteTargetFundId(null);
      loadFundCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ── CHART OF ACCOUNTS (COA) HANDLERS ──
  const loadCOA = async () => {
    try {
      setCoaLoading(true);
      const data = await api.getCOA();
      setCoaList(data || []);
    } catch (err) {
      showToast('Failed to load Chart of Accounts: ' + err.message, 'error');
    } finally {
      setCoaLoading(false);
    }
  };

  const handleOpenCoaModal = (acc = null) => {
    if (acc) {
      setEditingCoa(acc);
      setCoaForm({
        account_code: acc.account_code || '',
        account_name: acc.account_name || '',
        account_type: acc.account_type || 'Asset',
        sub_category: acc.sub_category || '',
        fund_name: acc.fund_name || 'General',
        description: acc.description || ''
      });
    } else {
      setEditingCoa(null);
      setCoaForm({
        account_code: '',
        account_name: '',
        account_type: 'Asset',
        sub_category: '',
        fund_name: 'General',
        description: ''
      });
    }
    setIsCoaModalOpen(true);
  };

  const handleSaveCoa = async (e) => {
    e.preventDefault();
    try {
      if (editingCoa) {
        await api.updateCOAAccount(editingCoa.id, coaForm);
        showToast(`Account ${coaForm.account_code} updated successfully!`, 'success');
      } else {
        await api.createCOAAccount(coaForm);
        showToast(`New Account ${coaForm.account_code} created successfully!`, 'success');
      }
      setIsCoaModalOpen(false);
      loadCOA();
      loadFundCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCoa = (acc) => {
    setDeleteTargetCoa(acc);
  };

  const handleConfirmDeleteCoa = async () => {
    if (!deleteTargetCoa) return;
    try {
      await api.deleteCOAAccount(deleteTargetCoa.id);
      showToast(`Account ${deleteTargetCoa.account_code} deleted successfully`, 'info');
      setDeleteTargetCoa(null);
      loadCOA();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.login(null, passwordInput);
      if (res.success) {
        setIsAuthenticated(true);
        showToast('Admin password authenticated!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Invalid admin password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e, fieldKey, fieldLabel) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3000000) {
        showToast(`${fieldLabel} file must be under 3MB`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [fieldKey]: reader.result }));
        showToast(`${fieldLabel} uploaded and saved as PNG/Base64 in database`, 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const payloadSettings = { ...settings };
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          showToast('New passwords do not match', 'error');
          setLoading(false);
          return;
        }
        payloadSettings.system_password = newPassword;
      }

      await api.updateSettings({
        settings: payloadSettings,
        current_password: passwordInput
      });

      showToast('System signatories, PBS logo & organization settings saved to database!', 'success');
      if (onRefreshStats) onRefreshStats();
      if (newPassword) {
        setPasswordInput(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetWord, setResetWord] = useState('');

  const handleFactoryReset = async () => {
    if (resetWord !== 'RESET') {
      showToast('Type the word RESET exactly to confirm', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await api.factoryReset(passwordInput);
      if (res.success) {
        showToast('Database has been completely factory reset. All investments and records cleared.', 'success');
        setShowResetConfirm(false);
        setResetWord('');
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      showToast(err.message || 'Factory reset failed. Check admin password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestTelegram = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Telegram Details',
        text: 'Please enter both Telegram Bot Token and Chat ID in Settings before testing.'
      });
      return;
    }
    setTestingTelegram(true);
    try {
      const res = await api.sendTestTelegram({
        telegram_bot_token: settings.telegram_bot_token,
        telegram_chat_id: settings.telegram_chat_id
      });
      Swal.fire({
        icon: 'success',
        title: 'Telegram Alert Sent!',
        text: res.message || 'Check your Telegram app for the verification alert.'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Telegram Delivery Failed',
        text: err.message || 'Could not deliver Telegram alert. Check bot token, chat ID, or internet connection.'
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!settings.smtp_app_password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Gmail App Password',
        text: 'Please enter your 16-digit Gmail App Password in Settings before testing.'
      });
      return;
    }
    setTestingEmail(true);
    try {
      const res = await api.sendTestEmail({
        smtp_sender_email: settings.smtp_sender_email || settings.org_email,
        smtp_app_password: settings.smtp_app_password,
        alert_email_address: settings.alert_email_address || settings.org_email
      });
      Swal.fire({
        icon: 'success',
        title: 'Email Alert Sent!',
        text: res.message || 'Check your email inbox for the test alert.'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Email Delivery Failed',
        text: err.message
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleRunCheckNow = async () => {
    setRunningCheckNow(true);
    try {
      const res = await api.checkNotificationsNow();
      if (res.sent > 0) {
        Swal.fire({
          icon: 'success',
          title: 'Maturity Scan Completed',
          html: `<p>Dispatched <b>${res.sent}</b> alert(s):</p><ul style="text-align:left; font-size: 13px;">${(res.results || []).map(r => `<li>${r}</li>`).join('')}</ul>`
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Scan Completed',
          text: res.message || 'No FDRs due for notification right now (all alerts already up-to-date).'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Scan Failed',
        text: err.message
      });
    } finally {
      setRunningCheckNow(false);
    }
  };

  const handleTestDesktopNotification = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('🚨 Gazipur PBS-2 | Test Desktop Alert', {
            body: 'Offline workstation alerts are operational! Real-time FDR maturity alarms will appear here in Windows Action Center.',
            icon: '/favicon.ico'
          });
          showToast('Desktop notification dispatched to Windows Action Center!', 'success');
        } else {
          Swal.fire('Notification Blocked', 'Please allow notifications in your browser permissions.', 'warning');
        }
      });
    } else {
      Swal.fire('Not Supported', 'HTML5 notifications are not supported in this browser.', 'error');
    }
  };

  const handleTestAudioChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
      showToast('Offline sound chime played successfully!', 'success');
    } catch (e) {
      showToast('Audio playback failed: ' + e.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER BAR */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
              System Signatories, Signatures & PBS Organization Configuration
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Configure default signatory names, upload PNG signature images directly from PC, set PBS logo, and update header details
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isAuthenticated ? 'badge-active' : 'badge-pending'}`}>
              {isAuthenticated ? 'System Setup Open' : 'Protected Settings'}
            </span>
          </div>
        </div>
      </div>

      {/* SETTINGS EDIT FORM */}
      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SECTION 1: DEFAULT SIGNATORIES & SIGNATURE PNG UPLOADS */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#34d399', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} />
              <span>Default Signatory Names & PNG Signature Uploads</span>
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Upload signature image files (PNG/JPG) directly from PC to save them into the system database. These will automatically appear on official bank letters and proposal note sheets.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              
              {/* SIGNATORY 1: OFFICER (ACCOUNTS) */}
              <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                <h5 style={{ color: '#38bdf8', marginBottom: '12px', fontWeight: 'bold' }}>1. Prepared By / Officer (Accounts)</h5>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Official Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Md. Ariful Islam"
                    value={settings.signatory_accountant_name || ''}
                    onChange={(e) => setSettings({ ...settings, signatory_accountant_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.signatory_accountant || ''}
                    onChange={(e) => setSettings({ ...settings, signatory_accountant: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload PNG Signature File</label>
                  <label className="btn-secondary" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <Upload size={14} />
                    <span>Upload Signature PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signatory_accountant_signature', 'Officer (Accounts) Signature')}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {settings.signatory_accountant_signature && (
                    <div style={{ marginTop: '8px', background: '#fff', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <img src={settings.signatory_accountant_signature} alt="Officer (Accounts) Signature Preview" style={{ maxHeight: '40px' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* SIGNATORY 2: AGM (FINANCE) */}
              <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                <h5 style={{ color: '#34d399', marginBottom: '12px', fontWeight: 'bold' }}>2. Checked / Recommended By (AGM Finance)</h5>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Official Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Md. Ariful Islam"
                    value={settings.signatory_agm_name || ''}
                    onChange={(e) => setSettings({ ...settings, signatory_agm_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.signatory_agm_finance || ''}
                    onChange={(e) => setSettings({ ...settings, signatory_agm_finance: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload PNG Signature File</label>
                  <label className="btn-secondary" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <Upload size={14} />
                    <span>Upload AGM Signature PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signatory_agm_signature', 'AGM Finance Signature')}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {settings.signatory_agm_signature && (
                    <div style={{ marginTop: '8px', background: '#fff', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <img src={settings.signatory_agm_signature} alt="AGM Signature Preview" style={{ maxHeight: '40px' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* SIGNATORY 3: GENERAL MANAGER */}
              <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                <h5 style={{ color: '#fbbf24', marginBottom: '12px', fontWeight: 'bold' }}>3. Approved By (General Manager)</h5>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Official Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Md. Rabiul Haque"
                    value={settings.signatory_gm_name || ''}
                    onChange={(e) => setSettings({ ...settings, signatory_gm_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.signatory_gm || ''}
                    onChange={(e) => setSettings({ ...settings, signatory_gm: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload PNG Signature File</label>
                  <label className="btn-secondary" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <Upload size={14} />
                    <span>Upload GM Signature PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signatory_gm_signature', 'GM Signature')}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {settings.signatory_gm_signature && (
                    <div style={{ marginTop: '8px', background: '#fff', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <img src={settings.signatory_gm_signature} alt="GM Signature Preview" style={{ maxHeight: '40px' }} />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: PBS ORGANIZATION & LOGO UPLOAD */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#60a5fa', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} />
              <span>PBS Organization Header & Official Logo Upload</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Palli Bidyut Samity Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.org_name}
                  onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">PBS Office Address *</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.org_address}
                  onChange={(e) => setSettings({ ...settings, org_address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.org_phone}
                  onChange={(e) => setSettings({ ...settings, org_phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={settings.org_email}
                  onChange={(e) => setSettings({ ...settings, org_email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Office Memo / Ref No Prefix</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                    (Used automatically in Bank Letters — e.g. <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>27.12.6400.506.04.044</code>)
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 27.12.6400.506.04.044"
                  value={settings.memo_ref_prefix || ''}
                  onChange={(e) => setSettings({ ...settings, memo_ref_prefix: e.target.value })}
                />
              </div>
            </div>

            {/* EMAIL & PC MATURITY ALARM NOTIFICATION SETTINGS */}
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '16px', marginTop: '16px', marginBottom: '20px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#fca5a5', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>FDR Maturity Alarm & Email Alert Configuration</span>
              </h5>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Sender Email (প্রেরক ইমেইল)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. gazipbs2@gmail.com"
                    value={settings.smtp_sender_email || settings.org_email || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_sender_email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gmail App Password (গোপন পাসওয়ার্ড)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="16-digit Gmail App Password"
                    value={settings.smtp_app_password || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_app_password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Email (প্রাপক ইমেইল)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. agmfinance@gmail.com"
                    value={settings.alert_email_address || ''}
                    onChange={(e) => setSettings({ ...settings, alert_email_address: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <div className="form-group" style={{ marginBottom: 0, width: '220px' }}>
                  <label className="form-label">Alert Trigger Time</label>
                  <select
                    className="form-select"
                    value={settings.alert_days_before || '1'}
                    onChange={(e) => setSettings({ ...settings, alert_days_before: e.target.value })}
                  >
                    <option value="1">১ দিন পূর্বে (1 Day Before)</option>
                    <option value="2">২ দিন পূর্বে (2 Days Before)</option>
                    <option value="3">৩ দিন পূর্বে (3 Days Before)</option>
                    <option value="7">৭ দিন পূর্বে (7 Days Before)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      showToast('Sending test email alert...', 'info');
                      const res = await api.sendTestEmail(settings);
                      if (res.success) {
                        showToast('Test Email sent successfully to ' + (settings.alert_email_address || settings.org_email), 'success');
                      }
                    } catch (err) {
                      showToast('Failed to send email: ' + err.message, 'error');
                    }
                  }}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Mail size={14} />
                  <span>Send Test Email Alert</span>
                </button>
              </div>
            </div>

            {/* DUAL LOGO UPLOAD DIRECT FROM PC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">PBS Samity Logo (Primary Logo - Top Left Side)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="PNG Base64 or Image URL"
                    value={settings.org_secondary_logo_url || ''}
                    onChange={(e) => setSettings({ ...settings, org_secondary_logo_url: e.target.value })}
                    style={{ flex: 1 }}
                  />

                  <label className="btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', padding: '8px 12px' }}>
                    <Upload size={14} />
                    <span>PBS Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'org_secondary_logo_url', 'PBS Samity Logo')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {settings.org_secondary_logo_url && (
                  <div style={{ marginTop: '8px', background: '#fff', padding: '8px', borderRadius: '6px', display: 'inline-block' }}>
                    <img src={settings.org_secondary_logo_url} alt="PBS Logo Preview" style={{ maxHeight: '45px' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Other / BREB Emblem Logo (Secondary Logo - Top Right Side)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="PNG Base64 or Image URL"
                    value={settings.org_logo_url || ''}
                    onChange={(e) => setSettings({ ...settings, org_logo_url: e.target.value })}
                    style={{ flex: 1 }}
                  />

                  <label className="btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', padding: '8px 12px' }}>
                    <Upload size={14} />
                    <span>BREB Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'org_logo_url', 'Other / BREB Logo')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {settings.org_logo_url && (
                  <div style={{ marginTop: '8px', background: '#fff', padding: '8px', borderRadius: '6px', display: 'inline-block' }}>
                    <img src={settings.org_logo_url} alt="BREB Logo Preview" style={{ maxHeight: '45px' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2.5: GENERAL ACCOUNTS CHART OF ACCOUNTS (COA) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <BookOpen size={22} />
                  <span>General Accounts Chart of Accounts (COA) Directory</span>
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
                  PBS / BREB Uniform System of Accounts (e.g. 131.10.000 Cash at Bank, 165.20.000 AIT Tax, 922 Bank Charges, 236.10.000 Tax Provision)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => handleOpenCoaModal()} 
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> + Add Account Code (COA)
                </button>
              </div>
            </div>

            {/* FILTER PILLS & SEARCH */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { id: 'ALL', label: 'All Accounts', count: coaList.length, color: '#64748b' },
                  { id: 'Asset', label: 'Assets', count: coaList.filter(a => a.account_type === 'Asset').length, color: '#34d399' },
                  { id: 'Liability', label: 'Liabilities', count: coaList.filter(a => a.account_type === 'Liability').length, color: '#f87171' },
                  { id: 'Equity', label: 'Equity / Fund', count: coaList.filter(a => a.account_type === 'Equity').length, color: '#c084fc' },
                  { id: 'Revenue', label: 'Revenue / Income', count: coaList.filter(a => a.account_type === 'Revenue').length, color: '#38bdf8' },
                  { id: 'Expense', label: 'Expenses', count: coaList.filter(a => a.account_type === 'Expense').length, color: '#fbbf24' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCoaCategoryFilter(tab.id)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: coaCategoryFilter === tab.id ? '700' : '500',
                      borderRadius: '20px',
                      border: `1px solid ${coaCategoryFilter === tab.id ? tab.color : 'rgba(255,255,255,0.1)'}`,
                      background: coaCategoryFilter === tab.id ? `${tab.color}25` : 'rgba(255,255,255,0.03)',
                      color: coaCategoryFilter === tab.id ? tab.color : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '1px 6px', 
                      borderRadius: '10px', 
                      background: coaCategoryFilter === tab.id ? tab.color : 'rgba(255,255,255,0.1)',
                      color: coaCategoryFilter === tab.id ? '#040914' : '#94a3b8',
                      fontWeight: '800'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search code or account name..."
                  value={coaSearch}
                  onChange={(e) => setCoaSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* COA TABLE */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Classification</th>
                    <th>Sub-Category</th>
                    <th>Linked Fund / Tag</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coaLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Loading Chart of Accounts...
                      </td>
                    </tr>
                  ) : coaList
                    .filter(acc => {
                      if (coaCategoryFilter !== 'ALL' && acc.account_type !== coaCategoryFilter) return false;
                      if (coaSearch) {
                        const s = coaSearch.toLowerCase();
                        return (
                          (acc.account_code || '').toLowerCase().includes(s) ||
                          (acc.account_name || '').toLowerCase().includes(s) ||
                          (acc.fund_name || '').toLowerCase().includes(s)
                        );
                      }
                      return true;
                    })
                    .map(acc => {
                      const badgeBg = {
                        Asset: 'rgba(52, 211, 153, 0.15)',
                        Liability: 'rgba(248, 113, 113, 0.15)',
                        Equity: 'rgba(192, 132, 252, 0.15)',
                        Revenue: 'rgba(56, 189, 248, 0.15)',
                        Expense: 'rgba(251, 191, 36, 0.15)'
                      }[acc.account_type] || 'rgba(255,255,255,0.1)';

                      const badgeColor = {
                        Asset: '#34d399',
                        Liability: '#f87171',
                        Equity: '#c084fc',
                        Revenue: '#38bdf8',
                        Expense: '#fbbf24'
                      }[acc.account_type] || '#94a3b8';

                      return (
                        <tr key={acc.id}>
                          <td>
                            <strong style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '13px' }}>
                              {acc.account_code}
                            </strong>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--text-main)' }}>{acc.account_name}</strong>
                          </td>
                          <td>
                            <span style={{ 
                              background: badgeBg, 
                              color: badgeColor, 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              fontWeight: '700',
                              border: `1px solid ${badgeColor}33`
                            }}>
                              {acc.account_type}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{acc.sub_category || '—'}</td>
                          <td>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>
                              {acc.fund_name || 'General'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '240px' }}>
                            {acc.description || '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenCoaModal(acc)}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Edit this account"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoa(acc)}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Delete account"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: FUND CATEGORIES & ACCOUNT CODES */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} />
                  <span>PBS Fund Categories & Account Codes Directory</span>
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  Manage account codes (e.g., 129.25.100 - প্রভিডেন্ট, 129.35.000 - গ্রাচ্যুইটি, 129.60.101 - বেনাভোলেন্ট) for investment tagging
                </p>
              </div>
              <button 
                type="button" 
                onClick={handleOpenFundModal} 
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                + Add Fund Account Code
              </button>
            </div>

            <div className="data-table-container" style={{ marginTop: '12px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Code (acc_code)</th>
                    <th>Fund Name (Bengali / English)</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fundCategories.map(fc => (
                    <tr key={fc.id}>
                      <td><strong style={{ color: '#38bdf8' }}>{fc.acc_code}</strong></td>
                      <td><strong style={{ color: 'var(--text-main)' }}>{fc.fund_name}</strong></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{fc.description || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleEditFund(fc)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', marginRight: '6px' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFund(fc.id)}
                          className="btn-danger"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3.5: CUSTOM INVESTMENT TYPES DIRECTORY */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} />
                  <span>Custom Investment Types Directory</span>
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  Manage dynamic investment categories (Default system types: FDR, Savings Certificate)
                </p>
              </div>
              <button 
                type="button" 
                onClick={handleAddCustomType} 
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                + Add Investment Type
              </button>
            </div>

            <div className="data-table-container" style={{ marginTop: '12px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type Name</th>
                    <th>Type Classification</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Fixed Deposit Receipt (FDR)</strong></td>
                    <td><span className="badge badge-info">System Default</span></td>
                    <td style={{ textAlign: 'right', color: '#64748b', fontSize: '12px' }}>Protected</td>
                  </tr>
                  <tr>
                    <td><strong>National Savings Certificate</strong></td>
                    <td><span className="badge badge-info">System Default</span></td>
                    <td style={{ textAlign: 'right', color: '#64748b', fontSize: '12px' }}>Protected</td>
                  </tr>
                  {customTypes.map((type, idx) => (
                    <tr key={idx}>
                      <td><strong style={{ color: '#38bdf8' }}>{type}</strong></td>
                      <td><span className="badge badge-active">Custom User Type</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomType(type)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: TAX & EXCISE DUTY SLAB SETTINGS */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} />
                  <span>Provision Tax Rates & Excise Duty Slabs</span>
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  Update current Tax (AIT) rates and Excise Duty slabs. Previous provisions will remain unaffected (historical preservation).
                </p>
              </div>
            </div>

            <h5 style={{ color: 'var(--text-main)', marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Advance Income Tax (AIT) Rates</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Tax Rate (CPF / GPF / Gratuity) %</label>
                <input type="number" className="form-input" value={settings.tax_rate_cpf || '10'} onChange={(e) => setSettings({ ...settings, tax_rate_cpf: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Rate (TIN Provided) %</label>
                <input type="number" className="form-input" value={settings.tax_rate_tin || '20'} onChange={(e) => setSettings({ ...settings, tax_rate_tin: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Rate (TIN Not Provided) %</label>
                <input type="number" className="form-input" value={settings.tax_rate_no_tin || '30'} onChange={(e) => setSettings({ ...settings, tax_rate_no_tin: e.target.value })} />
              </div>
            </div>

            <h5 style={{ color: 'var(--text-main)', marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Excise Duty Slab Rates (Principal Amount)</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>Tier 1 Limit:</span>
                <input type="number" className="form-input" value={settings.excise_tier1_limit || ''} onChange={(e) => setSettings({ ...settings, excise_tier1_limit: e.target.value })} style={{ flex: 1 }} />
                <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Fee:</span>
                <input type="number" className="form-input" value={settings.excise_tier1_fee || ''} onChange={(e) => setSettings({ ...settings, excise_tier1_fee: e.target.value })} style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>Tier 2 Limit:</span>
                <input type="number" className="form-input" value={settings.excise_tier2_limit || ''} onChange={(e) => setSettings({ ...settings, excise_tier2_limit: e.target.value })} style={{ flex: 1 }} />
                <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Fee:</span>
                <input type="number" className="form-input" value={settings.excise_tier2_fee || ''} onChange={(e) => setSettings({ ...settings, excise_tier2_fee: e.target.value })} style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>Tier 3 Limit:</span>
                <input type="number" className="form-input" value={settings.excise_tier3_limit || ''} onChange={(e) => setSettings({ ...settings, excise_tier3_limit: e.target.value })} style={{ flex: 1 }} />
                <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Fee:</span>
                <input type="number" className="form-input" value={settings.excise_tier3_fee || ''} onChange={(e) => setSettings({ ...settings, excise_tier3_fee: e.target.value })} style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>Tier 4 Limit:</span>
                <input type="number" className="form-input" value={settings.excise_tier4_limit || ''} onChange={(e) => setSettings({ ...settings, excise_tier4_limit: e.target.value })} style={{ flex: 1 }} />
                <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Fee:</span>
                <input type="number" className="form-input" value={settings.excise_tier4_fee || ''} onChange={(e) => setSettings({ ...settings, excise_tier4_fee: e.target.value })} style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>Tier 5 Limit:</span>
                <input type="number" className="form-input" value={settings.excise_tier5_limit || ''} onChange={(e) => setSettings({ ...settings, excise_tier5_limit: e.target.value })} style={{ flex: 1 }} />
                <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Fee:</span>
                <input type="number" className="form-input" value={settings.excise_tier5_fee || ''} onChange={(e) => setSettings({ ...settings, excise_tier5_fee: e.target.value })} style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>Tier 6 Limit:</span>
                <input type="number" className="form-input" value={settings.excise_tier6_limit || ''} onChange={(e) => setSettings({ ...settings, excise_tier6_limit: e.target.value })} style={{ flex: 1 }} />
                <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Fee:</span>
                <input type="number" className="form-input" value={settings.excise_tier6_fee || ''} onChange={(e) => setSettings({ ...settings, excise_tier6_fee: e.target.value })} style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>Tier 7 Limit:</span>
                <input type="number" className="form-input" value={settings.excise_tier7_limit || ''} onChange={(e) => setSettings({ ...settings, excise_tier7_limit: e.target.value })} style={{ flex: 1 }} />
                <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Fee:</span>
                <input type="number" className="form-input" value={settings.excise_tier7_fee || ''} onChange={(e) => setSettings({ ...settings, excise_tier7_fee: e.target.value })} style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>Above Limit:</span>
                <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: '12px' }}>(Remaining max bracket)</span>
                <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Fee:</span>
                <input type="number" className="form-input" value={settings.excise_tier8_fee || ''} onChange={(e) => setSettings({ ...settings, excise_tier8_fee: e.target.value })} style={{ width: '100px' }} />
              </div>
            </div>
          </div>

          {/* SECTION 5: FREE INSTANT MESSAGE & NOTIFICATION CENTER (ZERO API COST) */}
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(56, 189, 248, 0.35)', background: 'rgba(15, 23, 42, 0.45)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={20} color="#38bdf8" />
                  <span>Free Instant Message & Notification Settings (Zero API Cost)</span>
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                  Configure 100% free Telegram push alerts, Gmail SMTP email notices, and offline Windows workstation alarms.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunCheckNow}
                disabled={runningCheckNow}
                className="btn-secondary"
                title="Scan database and trigger pending alerts immediately"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  background: 'rgba(56, 189, 248, 0.1)'
                }}
              >
                <RefreshCw size={14} className={runningCheckNow ? 'spin' : ''} />
                <span>{runningCheckNow ? 'Scanning FDRs...' : 'Scan & Send Due Alerts Now'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '16px' }}>
              
              {/* CARD 1: TELEGRAM BOT NOTIFICATIONS */}
              <div className="glass-panel" style={{ padding: '18px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '6px', borderRadius: '8px' }}>
                      <Send size={18} color="#38bdf8" />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                        Telegram Bot Push Alerts
                      </h5>
                      <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: '700' }}>
                        100% Free Forever • Unlimited
                      </span>
                    </div>
                  </div>

                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={settings.telegram_alerts_enabled === 'true'}
                      onChange={(e) => setSettings({ ...settings, telegram_alerts_enabled: e.target.checked ? 'true' : 'false' })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      background: settings.telegram_alerts_enabled === 'true' ? '#34d399' : '#475569',
                      borderRadius: '22px', transition: '0.2s'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', left: settings.telegram_alerts_enabled === 'true' ? '21px' : '3px', bottom: '3px',
                        background: '#fff', borderRadius: '50%', transition: '0.2s'
                      }} />
                    </span>
                  </label>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                  Delivers instant push notifications directly to your smartphone or office group on Telegram. Create a bot in 1 minute with <strong>@BotFather</strong>.
                </p>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Telegram Bot Token:
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="e.g. 7123456789:AAHq_xyz..."
                    value={settings.telegram_bot_token || ''}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                  />
                  <small style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Get free token by texting <code>/newbot</code> to <strong>@BotFather</strong> on Telegram.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Target Chat ID or Group ID:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 123456789 or -100123456789"
                    value={settings.telegram_chat_id || ''}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                  />
                  <small style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Your personal or group Chat ID (find it with <strong>@userinfobot</strong> on Telegram).
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Maturity Alert Thresholds (Days Before):
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="7,3,1,0"
                    value={settings.telegram_alert_days || '7,3,1,0'}
                    onChange={(e) => setSettings({ ...settings, telegram_alert_days: e.target.value })}
                  />
                  <small style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Comma-separated days before maturity (e.g. <code>7,3,1,0</code>: alerts at 7 days, 3 days, 1 day, and on maturity day).
                  </small>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestTelegram}
                  disabled={testingTelegram}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12.5px', fontWeight: '700', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{testingTelegram ? 'Sending Test Message...' : 'Send Test Telegram Alert'}</span>
                </button>
              </div>

              {/* CARD 2: GMAIL / SMTP EMAIL ALERTS */}
              <div className="glass-panel" style={{ padding: '18px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(251, 191, 36, 0.15)', padding: '6px', borderRadius: '8px' }}>
                      <Mail size={18} color="#fbbf24" />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                        Gmail / SMTP Email Notices
                      </h5>
                      <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: '700' }}>
                        Free 500 emails/day • Official
                      </span>
                    </div>
                  </div>

                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={settings.alert_email_enabled === 'true'}
                      onChange={(e) => setSettings({ ...settings, alert_email_enabled: e.target.checked ? 'true' : 'false' })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      background: settings.alert_email_enabled === 'true' ? '#34d399' : '#475569',
                      borderRadius: '22px', transition: '0.2s'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', left: settings.alert_email_enabled === 'true' ? '21px' : '3px', bottom: '3px',
                        background: '#fff', borderRadius: '50%', transition: '0.2s'
                      }} />
                    </span>
                  </label>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                  Sends official HTML notices FDR-wise directly to the respective Bank's branch email (from Bank Directory) with a carbon copy (CC) to your recipient email.
                </p>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Sender Gmail Address:
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. gazipbs2@gmail.com"
                    value={settings.smtp_sender_email || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_sender_email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Gmail 16-Digit App Password:
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="16-character App Password"
                    value={settings.smtp_app_password || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_app_password: e.target.value })}
                  />
                  <small style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Generate at <code>myaccount.google.com/apppasswords</code> (Zero cost).
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Alert Recipient Email(s) [PBS Officer CC]:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. gazipbs2@gmail.com, arif@pbs.org"
                    value={settings.alert_email_address || ''}
                    onChange={(e) => setSettings({ ...settings, alert_email_address: e.target.value })}
                  />
                </div>

                {/* FDR-Wise Bank Email Dispatch Switch & Status */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  marginBottom: '14px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.smtp_send_to_bank_email !== 'false'}
                      onChange={(e) => setSettings({ ...settings, smtp_send_to_bank_email: e.target.checked ? 'true' : 'false' })}
                      style={{ marginTop: '2px', accentColor: '#38bdf8' }}
                    />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-main)' }}>
                        FDR-Wise Bank Email Routing + User CC
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
                        Each maturing FDR notice will be automatically addressed to that specific Bank Branch's email (from Bank Directory) and CC'd to your recipient email.
                      </div>
                    </div>
                  </label>

                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                      🏦 Bank Branches with Email: {banksList.filter(b => b.email && b.email.trim()).length} of {banksList.length}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: '600' }}>
                      ✓ Auto-Matched by FDR Bank
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testingEmail}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12.5px', fontWeight: '700', gap: '6px' }}
                >
                  <Mail size={14} />
                  <span>{testingEmail ? 'Sending Test Email...' : 'Send Test Email Notice'}</span>
                </button>
              </div>

              {/* CARD 3: OFFLINE WINDOWS & AUDIO ALERTS */}
              <div className="glass-panel" style={{ padding: '18px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '6px', borderRadius: '8px' }}>
                      <Volume2 size={18} color="#34d399" />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                        Offline Workstation Alerts
                      </h5>
                      <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: '700' }}>
                        100% Offline • Zero Internet Needed
                      </span>
                    </div>
                  </div>

                  <span className="badge badge-active" style={{ fontSize: '10px' }}>Active</span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                  Synthesizes local audio beeps and native Windows Action Center notifications. Operates completely disconnected from the internet.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleTestAudioChime}
                    className="btn-secondary"
                    style={{ justifyContent: 'center', fontSize: '12px', fontWeight: '600', gap: '6px' }}
                  >
                    <Volume2 size={14} color="#34d399" />
                    <span>Test Local Sound Chime</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestDesktopNotification}
                    className="btn-secondary"
                    style={{ justifyContent: 'center', fontSize: '12px', fontWeight: '600', gap: '6px' }}
                  >
                    <Bell size={14} color="#38bdf8" />
                    <span>Test Windows Desktop Banner</span>
                  </button>

                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      💡 <strong>WhatsApp 1-Click Notice:</strong> In addition, you can send pre-formatted FDR renewal/encashment notices directly to Bank Managers via WhatsApp Web with zero API fees.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 6: SYSTEM PASSWORD CHANGE */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} />
              <span>Change System User Password</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">New Admin Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Leave blank to keep current"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }} disabled={loading}>
              <Save size={18} />
              <span>Save System Settings & Signatories</span>
            </button>
          </div>
          
          {/* SECTION 6: DANGER ZONE (FACTORY RESET) */}
          <div className="glass-panel" style={{ padding: '24px', marginTop: '40px', borderLeft: '4px solid #ef4444', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.05)' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              <span>Danger Zone: Database Factory Reset</span>
            </h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Warning: This will permanently delete all investments, provisions, financial histories, bank letters and proposals. Only system settings and bank lists will be retained. This action <strong style={{ color: '#f87171' }}>CANNOT be undone</strong>.
            </p>

            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => { setShowResetConfirm(true); setResetWord(''); }}
                className="btn-danger"
                style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                disabled={loading}
              >
                <Trash2 size={16} />
                <span>Factory Reset Database (Clear All Data)</span>
              </button>
            ) : (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: '#fca5a5', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} />
                  <span>Type the word <code style={{ background: 'rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: '4px', color: '#fff' }}>RESET</code> in the box below to confirm permanent deletion:</span>
                </p>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type RESET here to confirm"
                  value={resetWord}
                  onChange={(e) => setResetWord(e.target.value)}
                  style={{ maxWidth: '280px', letterSpacing: '2px', fontWeight: '700', textTransform: 'uppercase', color: '#f87171' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleFactoryReset}
                    className="btn-danger"
                    style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                    disabled={loading || resetWord !== 'RESET'}
                  >
                    <Trash2 size={14} />
                    <span>{loading ? 'Resetting...' : 'Confirm & Delete All Data'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowResetConfirm(false); setResetWord(''); }}
                    className="btn-secondary"
                    style={{ padding: '9px 18px', fontSize: '13px' }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </form>

      {/* MODAL: ADD / EDIT FUND CATEGORY */}
      <Modal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        title={selectedFund ? `Edit Fund: ${selectedFund.acc_code}` : 'Add New Fund Account Code'}
        maxWidth="500px"
      >
        <form onSubmit={handleSaveFund} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Account Code (acc_code) *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 129.25.100"
              value={fundForm.acc_code}
              onChange={(e) => setFundForm({ ...fundForm, acc_code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fund Name (Fund_BName) *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. প্রভিডেন্ট"
              value={fundForm.fund_name}
              onChange={(e) => setFundForm({ ...fundForm, fund_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Remarks</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Provident Fund Account"
              value={fundForm.description}
              onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsFundModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedFund ? 'Save Changes' : 'Create Fund Code'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DELETE FUND CONFIRMATION */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetFundId}
        onClose={() => setDeleteTargetFundId(null)}
        onConfirm={handleConfirmDeleteFund}
        title="Delete Fund Account Code"
        message="Are you sure you want to delete this fund account code? Existing investments tagged with this code will remain safe."
      />

      {/* MODAL: ADD / EDIT CHART OF ACCOUNTS (COA) */}
      <Modal
        isOpen={isCoaModalOpen}
        onClose={() => setIsCoaModalOpen(false)}
        title={editingCoa ? `Edit Account: ${editingCoa.account_code}` : 'Add New Account to Chart of Accounts'}
        maxWidth="550px"
      >
        <form onSubmit={handleSaveCoa} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Account Code * (e.g. 131.10.000 or 922)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 131.10.000"
                value={coaForm.account_code}
                onChange={(e) => setCoaForm({ ...coaForm, account_code: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Classification / Type *</label>
              <select
                className="form-select"
                value={coaForm.account_type}
                onChange={(e) => setCoaForm({ ...coaForm, account_type: e.target.value })}
                required
              >
                <option value="Asset">Asset (Debit balance)</option>
                <option value="Liability">Liability (Credit balance)</option>
                <option value="Equity">Equity / Fund Capital (Credit balance)</option>
                <option value="Revenue">Revenue / Income (Credit balance)</option>
                <option value="Expense">Expense / Deductions (Debit balance)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cash at Bank - Settlement Account"
              value={coaForm.account_name}
              onChange={(e) => setCoaForm({ ...coaForm, account_name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Sub-Category</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Current Asset, Investment, Reserve"
                value={coaForm.sub_category}
                onChange={(e) => setCoaForm({ ...coaForm, sub_category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Linked PBS Fund</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. General, প্রভিডেন্ট, গ্রাচ্যুইটি"
                value={coaForm.fund_name}
                onChange={(e) => setCoaForm({ ...coaForm, fund_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Remarks</label>
            <textarea
              className="form-input"
              placeholder="Description of account purpose, PBS accounting guidelines..."
              rows={3}
              value={coaForm.description}
              onChange={(e) => setCoaForm({ ...coaForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsCoaModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingCoa ? 'Update Account' : 'Save Account Code'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DELETE COA CONFIRMATION */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetCoa}
        onClose={() => setDeleteTargetCoa(null)}
        onConfirm={handleConfirmDeleteCoa}
        title="Delete Account from Chart of Accounts"
        message={`Are you sure you want to delete account ${deleteTargetCoa?.account_code} - ${deleteTargetCoa?.account_name}?`}
      />

    </div>
  );
}
