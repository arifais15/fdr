const API_BASE = '/api';

export function getAuthToken() {
  return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
}

export function setAuthToken(token) {
  if (token) {
    sessionStorage.setItem('authToken', token);
  } else {
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authToken');
  }
}

async function fetchJSON(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (res.status === 401 && !url.includes('/auth/login')) {
    setAuthToken('');
    sessionStorage.setItem('isLoggedIn', 'false');
    window.dispatchEvent(new CustomEvent('unauthorized'));
    const errorData = await res.json().catch(() => ({ error: 'Unauthorized' }));
    throw new Error(errorData.error || 'Authentication required. Please log in.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || 'Server error');
  }
  return res.json();
}

export const api = {
  getDashboardStats: () => fetchJSON('/dashboard/stats'),
  
  getInvestments: (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      const val = params[key];
      if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).toUpperCase() !== 'ALL') {
        cleanParams[key] = val;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return fetchJSON(`/investments${query ? `?${query}` : ''}`);
  },
  getInvestment: (id) => fetchJSON(`/investments/${id}`),
  getInvestmentHistory: (id) => fetchJSON(`/investments/${id}/history`),
  getInvestmentFinancialHistory: (id) => fetchJSON(`/investments/${id}/financial-history`),
  getFdrBankStatement: (id) => fetchJSON(`/investments/${id}/bank-statement`),
  getFinancialHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON(`/financial-history${query ? `?${query}` : ''}`);
  },
  createInvestment: (data) => fetchJSON('/investments', { method: 'POST', body: JSON.stringify(data) }),
  bulkCreateInvestments: (data) => fetchJSON('/investments/bulk', { method: 'POST', body: JSON.stringify({ investments: data }) }),
  updateInvestment: (id, data) => fetchJSON(`/investments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvestment: (id, password) => fetchJSON(`/investments/${id}`, {
    method: 'DELETE',
    headers: password ? { 'x-admin-password': encodeURIComponent(password) } : {},
    body: JSON.stringify({ password })
  }),
  encashInvestment: (id, data) => fetchJSON(`/investments/${id}/encash`, { method: 'POST', body: JSON.stringify(data) }),
  undoEncashment: (id) => fetchJSON(`/investments/${id}/undo-encash`, { method: 'POST' }),
  renewInvestment: (id, data) => fetchJSON(`/investments/${id}/renew`, { method: 'POST', body: JSON.stringify(data) }),

  getBanks: () => fetchJSON('/banks'),
  createBank: (data) => fetchJSON('/banks', { method: 'POST', body: JSON.stringify(data) }),
  bulkCreateBanks: (data) => fetchJSON('/banks/bulk', { method: 'POST', body: JSON.stringify({ banks: data }) }),
  updateBank: (id, data) => fetchJSON(`/banks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBank: (id) => fetchJSON(`/banks/${id}`, { method: 'DELETE' }),

  getProposals: () => fetchJSON('/proposals'),
  createProposal: (data) => fetchJSON('/proposals', { method: 'POST', body: JSON.stringify(data) }),
  updateProposal: (id, data) => fetchJSON(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProposal: (id) => fetchJSON(`/proposals/${id}`, { method: 'DELETE' }),

  getLetters: () => fetchJSON('/letters'),
  createLetter: (data) => fetchJSON('/letters', { method: 'POST', body: JSON.stringify(data) }),
  deleteLetter: (id) => fetchJSON(`/letters/${id}`, { method: 'DELETE' }),

  getProvisions: () => fetchJSON('/provisions'),
  createProvision: (data) => fetchJSON('/provisions', { method: 'POST', body: JSON.stringify(data) }),
  updateProvision: (id, data) => fetchJSON(`/provisions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  batchPostProvisions: (data) => fetchJSON('/provisions/batch-post', { method: 'POST', body: JSON.stringify(data) }),
  deleteProvision: (id) => fetchJSON(`/provisions/${id}`, { method: 'DELETE' }),

  getMonthlyReport: (year, month) => fetchJSON(`/reports/monthly?year=${year}&month=${month}`),
  getFundWiseReport: (year, month) => {
    let url = '/reports/fund-wise';
    if (year && month) url += `?year=${year}&month=${month}`;
    return fetchJSON(url);
  },
  getSectorFundMatrixReport: () => fetchJSON('/reports/sector-fund-matrix'),
  getPeriodComparisonReport: (prevDate = '', currDate = '', interestMode = 'actual') => fetchJSON(`/reports/period-comparison?previous_date=${prevDate}&current_date=${currDate}&interest_mode=${interestMode}`),
  getFyFdrRegister: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON(`/reports/fy-fdr-register${query ? `?${query}` : ''}`);
  },
  getFinancialStatements: (asOfDate = '', startDate = '', endDate = '') => fetchJSON(`/reports/financial-statements?as_of_date=${asOfDate}&start_date=${startDate}&end_date=${endDate}`),
  getInPlaceRolloverList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON(`/reports/inplace-rollover-list${query ? `?${query}` : ''}`);
  },
  undoInplaceRollover: (investmentId, historyId) => fetchJSON(`/investments/${investmentId}/undo-inplace-rollover`, { method: 'POST', body: JSON.stringify({ history_id: historyId }) }),
  getFundCategories: () => fetchJSON('/fund-categories'),
  createFundCategory: (data) => fetchJSON('/fund-categories', { method: 'POST', body: JSON.stringify(data) }),
  updateFundCategory: (id, data) => fetchJSON(`/fund-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFundCategory: (id) => fetchJSON(`/fund-categories/${id}`, { method: 'DELETE' }),

  // Chart of Accounts (COA)
  getCOA: (params = {}) => {
    const clean = {};
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'ALL') {
        clean[k] = params[k];
      }
    });
    const qs = new URLSearchParams(clean).toString();
    return fetchJSON(`/coa${qs ? `?${qs}` : ''}`);
  },
  createCOAAccount: (data) => fetchJSON('/coa', { method: 'POST', body: JSON.stringify(data) }),
  updateCOAAccount: (id, data) => fetchJSON(`/coa/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCOAAccount: (id) => fetchJSON(`/coa/${id}`, { method: 'DELETE' }),

  // Journal Vouchers (General Ledger)
  getJournalVouchers: (params = {}) => {
    const clean = {};
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'ALL') {
        clean[k] = params[k];
      }
    });
    const qs = new URLSearchParams(clean).toString();
    return fetchJSON(`/journal-vouchers${qs ? `?${qs}` : ''}`);
  },
  getJournalVoucher: (id) => fetchJSON(`/journal-vouchers/${id}`),
  postJournalVoucher: (data) => fetchJSON('/journal-vouchers', { method: 'POST', body: JSON.stringify(data) }),
  autoPostJournalVoucher: (data) => fetchJSON('/journal-vouchers/auto-post', { method: 'POST', body: JSON.stringify(data) }),
  checkJVMonthPosted: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchJSON(`/journal-vouchers/check-posted${qs ? `?${qs}` : ''}`);
  },
  deleteJournalVoucher: (id) => fetchJSON(`/journal-vouchers/${id}`, { method: 'DELETE' }),

  getSettings: () => fetchJSON('/settings'),
  updateSettings: (data) => fetchJSON('/settings', { method: 'POST', body: JSON.stringify(data) }),
  login: (userid, password) => fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify({ userid, password }) }),
  changeAdminPassword: (currentPassword, newPassword) => fetchJSON('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  }),
  logout: () => fetchJSON('/auth/logout', { method: 'POST' }),
  getUsers: () => fetchJSON('/users'),
  createUser: (data) => fetchJSON('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => fetchJSON(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendTestEmail: (data) => fetchJSON('/settings/send-test-email', { method: 'POST', body: JSON.stringify(data) }),
  sendTestTelegram: (data) => fetchJSON('/settings/send-test-telegram', { method: 'POST', body: JSON.stringify(data) }),
  checkNotificationsNow: () => fetchJSON('/notifications/check-now', { method: 'POST' }),
  sendFdrEmailNotice: (id, data = {}) => fetchJSON(`/investments/${id}/send-notice-email`, { method: 'POST', body: JSON.stringify(data) }),
  sendBankLetterEmail: (id, data = {}) => fetchJSON(`/letters/${id}/send-email`, { method: 'POST', body: JSON.stringify(data) }),
  factoryReset: (password) => fetchJSON('/settings/factory-reset', { method: 'POST', body: JSON.stringify({ password }) }),
  getAuditLogs: () => fetchJSON('/audit-logs')
};
