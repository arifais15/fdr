import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Phone, Mail, MapPin, Upload, Download, FileSpreadsheet, Search, X, Table, LayoutGrid, Filter } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { api } from '../utils/api';
import { downloadBankTemplate, parseExcelFile } from '../utils/excelHelper';

export default function Banks({ showToast }) {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('table'); // 'table' (datasheet) or 'cards'
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [deleteTargetBank, setDeleteTargetBank] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  // Bulk Upload State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    branch_name: '',
    bank_type: 'Government Bank',
    routing_no: '',
    address: '',
    contact_person: '',
    phone: '',
    email: ''
  });

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
        showToast(`Parsed ${rows.length} bank rows from ${file.name}`, 'info');
      }
    } catch (err) {
      showToast('Failed to parse Excel file: ' + err.message, 'error');
    }
  };

  const handleBulkSubmit = async () => {
    if (importRows.length === 0) return;
    try {
      setImporting(true);
      const res = await api.bulkCreateBanks(importRows);
      showToast(res.message, 'success');
      setIsImportModalOpen(false);
      setImportRows([]);
      setImportFileName('');
      loadBanks();
    } catch (err) {
      showToast('Bulk bank import failed: ' + err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const data = await api.getBanks();
      setBanks(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (bank = null) => {
    if (bank) {
      setSelectedBank(bank);
      setFormData({
        name: bank.name,
        branch_name: bank.branch_name,
        bank_type: bank.bank_type || 'Government Bank',
        routing_no: bank.routing_no || '',
        address: bank.address || '',
        contact_person: bank.contact_person || '',
        phone: bank.phone || '',
        email: bank.email || ''
      });
    } else {
      setSelectedBank(null);
      setFormData({
        name: '',
        branch_name: '',
        bank_type: 'Government Bank',
        routing_no: '',
        address: '',
        contact_person: '',
        phone: '',
        email: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedBank) {
        await api.updateBank(selectedBank.id, formData);
        showToast('Bank updated successfully', 'success');
      } else {
        await api.createBank(formData);
        showToast('New Bank institution added', 'success');
      }
      setIsModalOpen(false);
      loadBanks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetBank) return;
    try {
      setDeleting(true);
      await api.deleteBank(deleteTargetBank.id);
      showToast('Bank deleted successfully', 'info');
      setDeleteTargetBank(null);
      loadBanks();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filteredBanks = banks.filter(b => {
    if (sectorFilter !== 'ALL' && b.bank_type !== sectorFilter) return false;
    if (q) {
      return (
        (b.name || '').toLowerCase().includes(q) ||
        (b.branch_name || '').toLowerCase().includes(q) ||
        (b.bank_type || '').toLowerCase().includes(q) ||
        (b.routing_no || '').toLowerCase().includes(q) ||
        (b.contact_person || '').toLowerCase().includes(q) ||
        (b.phone || '').toLowerCase().includes(q) ||
        (b.email || '').toLowerCase().includes(q) ||
        (b.address || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* HEADER BAR */}
      <div className="glass-panel" style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Bank Directory
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              ({filteredBanks.length} of {banks.length} banks)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={downloadBankTemplate}
              className="btn-secondary"
              title="Download pre-formatted Excel template for bank list import"
              style={{ fontSize: '11.5px', padding: '5px 10px' }}
            >
              <Download size={13} />
              <span>Template</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="btn-secondary"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.3)', fontSize: '11.5px', padding: '5px 10px' }}
            >
              <Upload size={13} />
              <span>Upload Excel</span>
            </button>

            <button onClick={() => handleOpenModal(null)} className="btn-primary" style={{ padding: '5px 12px', fontSize: '11.5px' }}>
              <Plus size={15} />
              <span>Add Bank</span>
            </button>
          </div>
        </div>

        {/* SEARCH & CONTROLS BAR */}
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '260px' }}>
            <div style={{ position: 'relative', flex: '1', maxWidth: '380px' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search banks by name, branch, routing no, contact, phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '28px', paddingRight: search ? '28px' : '8px', fontSize: '12px', height: '30px' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0' }}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              className="form-select"
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              style={{ fontSize: '12px', height: '30px', padding: '2px 8px', maxWidth: '170px' }}
            >
              <option value="ALL">All Sectors</option>
              <option value="Government Bank">Government Bank</option>
              <option value="Private Bank">Private Commercial Bank</option>
            </select>
          </div>

          {/* VIEW MODE TOGGLE: DATASHEET TABLE VS CARDS */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                borderRadius: '4px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Datasheet Table View"
            >
              <Table size={13} />
              <span>Datasheet Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                borderRadius: '4px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Card Grid View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* DATA VIEW (TABLE OR CARDS) */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading bank list...</div>
      ) : filteredBanks.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Search size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>No banks found</div>
          <div style={{ fontSize: '13px' }}>
            {search || sectorFilter !== 'ALL'
              ? 'No results matching your filters — try adjusting keywords or filters.'
              : 'No bank records yet. Click "Add Bank" to get started.'}
          </div>
          {(search || sectorFilter !== 'ALL') && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setSearch(''); setSectorFilter('ALL'); }}
              style={{ marginTop: '12px', fontSize: '13px' }}
            >
              <X size={13} /> Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="data-table-container glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table" id="banks-datasheet-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                <th style={{ minWidth: '180px' }}>Bank & Institution</th>
                <th style={{ minWidth: '140px' }}>Branch Name</th>
                <th style={{ minWidth: '130px' }}>Sector / Type</th>
                <th style={{ minWidth: '110px' }}>Routing No</th>
                <th style={{ minWidth: '160px' }}>Manager / Contact</th>
                <th style={{ minWidth: '130px' }}>Phone</th>
                <th style={{ minWidth: '160px' }}>Email</th>
                <th style={{ minWidth: '180px' }}>Address</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((b, idx) => (
                <tr key={b.id || idx}>
                  <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: 'rgba(59,130,246,0.12)', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={15} color="#3b82f6" />
                      </div>
                      <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        {b.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#0284c7' }}>
                      {b.branch_name || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${b.bank_type === 'Private Bank' ? 'badge-renewed' : 'badge-active'}`} style={{ fontSize: '10.5px' }}>
                      {b.bank_type || 'Government Bank'}
                    </span>
                  </td>
                  <td>
                    {b.routing_no ? (
                      <code style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '12px', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                        {b.routing_no}
                      </code>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {b.contact_person ? (
                      <span style={{ fontWeight: '500' }}>{b.contact_person}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {b.phone ? (
                      <a
                        href={`tel:${b.phone}`}
                        title={`Call ${b.phone}`}
                        style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                      >
                        <Phone size={12} color="#10b981" />
                        <span>{b.phone}</span>
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {b.email ? (
                      <a
                        href={`mailto:${b.email}`}
                        title={`Email ${b.email}`}
                        style={{ textDecoration: 'none', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                      >
                        <Mail size={12} color="#3b82f6" />
                        <span>{b.email}</span>
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {b.address ? (
                      <span
                        title={b.address}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-muted)' }}
                      >
                        <MapPin size={12} style={{ flexShrink: 0 }} />
                        <span>{b.address}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenModal(b)}
                        className="btn-secondary"
                        style={{ padding: '4px 6px' }}
                        title="Edit Bank"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTargetBank(b)}
                        className="btn-danger"
                        style={{ padding: '4px 6px' }}
                        title="Delete Bank"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ fontWeight: '800', padding: '8px 12px' }}>
                  TOTAL: {filteredBanks.length} {filteredBanks.length === 1 ? 'BANK' : 'BANKS'}
                  {filteredBanks.length !== banks.length && ` (FILTERED FROM ${banks.length})`}
                </td>
                <td colSpan={7} style={{ textAlign: 'right', fontWeight: '700', fontSize: '11.5px', color: 'var(--text-muted)', padding: '8px 12px' }}>
                  Government: {filteredBanks.filter(b => (b.bank_type || 'Government Bank').toLowerCase().includes('govt') || (b.bank_type || '').toLowerCase().includes('government')).length} | 
                  Private: {filteredBanks.filter(b => (b.bank_type || '').toLowerCase().includes('private')).length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredBanks.map(b => (
            <div key={b.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(59,130,246,0.15)', padding: '12px', borderRadius: '12px' }}>
                    <Building2 size={24} color="#60a5fa" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{b.name}</h4>
                      <span className={`badge ${b.bank_type === 'Private Bank' ? 'badge-renewed' : 'badge-active'}`} style={{ fontSize: '10px' }}>
                        {b.bank_type || 'Government Bank'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{b.branch_name}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleOpenModal(b)} className="btn-secondary" style={{ padding: '6px' }}>
                    <Edit size={14} />
                  </button>
                  <button onClick={() => setDeleteTargetBank(b)} className="btn-danger" style={{ padding: '6px' }} title="Delete Bank">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {b.routing_no && (
                  <div><strong>Routing No:</strong> {b.routing_no}</div>
                )}
                {b.contact_person && (
                  <div><strong>Manager / Contact:</strong> {b.contact_person}</div>
                )}
                {b.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} color="var(--text-muted)" />
                    <span>{b.phone}</span>
                  </div>
                )}
                {b.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={13} color="var(--text-muted)" />
                    <span>{b.email}</span>
                  </div>
                )}
                {b.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <MapPin size={13} />
                    <span>{b.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD / EDIT BANK */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBank ? `Edit Bank: ${selectedBank.name}` : 'Add New Bank Branch'}
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Bank Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sonali Bank PLC"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Sector *</label>
              <select
                className="form-select"
                value={formData.bank_type}
                onChange={(e) => setFormData({ ...formData, bank_type: e.target.value })}
                required
              >
                <option value="Government Bank">Government Bank</option>
                <option value="Private Bank">Private Commercial Bank</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Branch Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Motijheel Corporate Branch"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Routing Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 200270001"
                value={formData.routing_no}
                onChange={(e) => setFormData({ ...formData, routing_no: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Contact Person / Manager</label>
              <input
                type="text"
                className="form-input"
                placeholder="Name & Designation"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 01711-000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. manager@bank.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Branch Postal Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedBank ? 'Save Changes' : 'Add Bank Branch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: BULK UPLOAD BANK EXCEL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportRows([]);
          setImportFileName('');
        }}
        title="Bulk Upload Bank List from Excel"
        maxWidth="800px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Guidelines Box */}
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ color: '#60a5fa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={18} />
                <span>Bank List Excel Template & Guidelines</span>
              </strong>
              <button
                type="button"
                onClick={downloadBankTemplate}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-card-hover)', color: 'var(--primary)', border: '1px solid var(--border-color)' }}
              >
                <Download size={14} />
                <span>Download Bank Template (.xlsx)</span>
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
              Select an Excel file containing bank branches. Headers supported: <code>Bank Name</code>, <code>Branch Name</code>, <code>Bank Type</code> (Government Bank / Private Bank), <code>Routing No</code>, <code>Address</code>, <code>Contact Person</code>, <code>Phone</code>, <code>Email</code>.
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
                  Parsed Preview ({importRows.length} Banks Ready)
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Existing Bank Name + Branch Name combinations will be automatically skipped
                </span>
              </div>

              <div className="data-table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Bank Name</th>
                      <th>Branch Name</th>
                      <th>Bank Type</th>
                      <th>Routing No</th>
                      <th>Phone</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{row['Bank Name'] || row.name || '—'}</strong></td>
                        <td><span style={{ color: '#38bdf8' }}>{row['Branch Name'] || row.branch_name || '—'}</span></td>
                        <td>
                          <span className={`badge ${(row['Bank Type'] || row.bank_type) === 'Private Bank' ? 'badge-renewed' : 'badge-active'}`}>
                            {row['Bank Type'] || row.bank_type || 'Government Bank'}
                          </span>
                        </td>
                        <td>{row['Routing No'] || row.routing_no || '—'}</td>
                        <td>{row['Phone'] || row.phone || '—'}</td>
                        <td>{row['Email'] || row.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              {importing ? 'Importing Banks...' : `Confirm & Import ${importRows.length} Banks`}
            </button>
          </div>

        </div>
      </Modal>

      {/* MODAL: DELETE CONFIRMATION */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetBank}
        onClose={() => setDeleteTargetBank(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Bank Record"
        message={deleteTargetBank ? `Are you sure you want to delete ${deleteTargetBank.name} (${deleteTargetBank.branch_name})? This action cannot be undone.` : ''}
        loading={deleting}
      />

    </div>
  );
}
