import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import Proposals from './pages/Proposals';
import BankLetters from './pages/BankLetters';
import Provisions from './pages/Provisions';
import Banks from './pages/Banks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import UserManual from './pages/UserManual';
import MaturityAlarmModal from './components/MaturityAlarmModal';
import LoginScreen from './components/LoginScreen';

import { api, setAuthToken } from './utils/api';
import { getTranslation } from './utils/translations';

import { Lock, ShieldCheck, User, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navData, setNavData] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    // Migrate old 'sylhet-gray' → 'default'
    if (saved === 'sylhet-gray') return 'default';
    return saved || 'default';
  });
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'en';
  });

  useEffect(() => {
    if (theme === 'default') {
      // Remove data-theme attr so :root CSS variables apply
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'default')    return 'azure-mist';   // Light → Sky Blue
      if (prev === 'azure-mist') return 'dark';          // Blue → Dark Night
      if (prev === 'dark')       return 'black-gold';    // Dark → Gold
      return 'default';                                  // Gold → Green (default)
    });
  };

  const toggleLang = () => {
    setLang(prev => (prev === 'en' ? 'bn' : 'en'));
  };

  // Global Login State (Persisted in sessionStorage so page refresh retains login session)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => ({
    userid: sessionStorage.getItem('authUserid') || '',
    role: sessionStorage.getItem('authRole') || ''
  }));
  const [loginUserid, setLoginUserid] = useState(() => {
    return localStorage.getItem('loginUserid') || 'arif';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboardStats();
    }
  }, [isLoggedIn, activeTab]);

  // Listen for 401 Unauthorized events from API calls
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsLoggedIn(false);
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('authUserid');
      sessionStorage.removeItem('authRole');
      setCurrentUser({ userid: '', role: '' });
      setAuthToken('');
      showToast('Session expired or unauthorized. Please log in.', 'error');
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  // Auto Logout Idle Timer (10 Minutes) — Throttled & Passive to prevent input lag/stutter
  useEffect(() => {
    if (!isLoggedIn) return;

    let lastActivityTime = Date.now();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime > 15000) { // Only update timestamp at most once every 15 seconds
        lastActivityTime = now;
      }
    };

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivityTime > 10 * 60 * 1000) {
        handleLogout();
        showToast('You have been logged out due to inactivity.', 'info');
      }
    }, 15000); // Check every 15 seconds

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      clearInterval(intervalId);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    if (sessionStorage.getItem('authToken')) {
      api.logout().catch(err => console.error('Failed to record logout:', err));
    }
    setAuthToken('');
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('authUserid');
    sessionStorage.removeItem('authRole');
    setCurrentUser({ userid: '', role: '' });
    setLoginPassword('');
  };

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      showToast('Failed to connect to backend server: ' + err.message, 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleGlobalLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoginError('');
    try {
      setLoginLoading(true);
      const res = await api.login(loginUserid, loginPassword);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setIsLoggedIn(true);
        const user = { userid: res.userid || loginUserid, role: res.role || 'viewer' };
        setCurrentUser(user);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('authUserid', user.userid);
        sessionStorage.setItem('authRole', user.role);
        localStorage.setItem('loginUserid', loginUserid);
        showToast('Login successful! Welcome to PBS-2 Fund Vault.', 'success');
      }
    } catch (err) {
      const msg = err.message || 'Invalid User ID or Password';
      setLoginError(msg);
      showToast(msg, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleNavigate = (tab, extraData = null) => {
    setActiveTab(tab);
    setNavData(extraData);
  };

  const getHeaderInfo = () => {
    return {
      title: getTranslation(lang, `header_${activeTab}_title`),
      subtitle: getTranslation(lang, `header_${activeTab}_sub`)
    };
  };

  const headerInfo = getHeaderInfo();

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen
          loginUserid={loginUserid}
          setLoginUserid={(val) => {
            setLoginUserid(val);
            if (loginError) setLoginError('');
          }}
          loginPassword={loginPassword}
          setLoginPassword={(val) => {
            setLoginPassword(val);
            if (loginError) setLoginError('');
          }}
          handleGlobalLogin={handleGlobalLogin}
          loginLoading={loginLoading}
          loginError={loginError}
          showToast={showToast}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab}
        role={currentUser.role}
        navData={navData} 
        setActiveTab={(tab, extraData) => handleNavigate(tab, extraData)} 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        lang={lang}
      />

      <main 
        className="main-content" 
        style={{ 
          marginLeft: isSidebarCollapsed ? '0' : 'var(--sidebar-width, 240px)', 
          paddingBottom: '36px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}
      >
        <Header 
          title={headerInfo.title} 
          subtitle={headerInfo.subtitle} 
          onRefresh={loadDashboardStats} 
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          theme={theme}
          onToggleTheme={toggleTheme}
          lang={lang}
          onToggleLang={toggleLang}
        />

        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            loading={statsLoading} 
            onNavigate={handleNavigate} 
          />
        )}

        {activeTab === 'investments' && (
          <Investments 
            showToast={showToast} 
            onRefreshStats={loadDashboardStats} 
          />
        )}

        {activeTab === 'proposals' && (
          <Proposals 
            showToast={showToast} 
            initialData={navData}
            onNavigate={handleNavigate} 
            onRefreshStats={loadDashboardStats}
          />
        )}

        {activeTab === 'letters' && (
          <BankLetters 
            showToast={showToast} 
            initialData={navData}
            onRefreshStats={loadDashboardStats}
          />
        )}

        {activeTab === 'provisions' && (
          <Provisions 
            showToast={showToast} 
            onRefreshStats={loadDashboardStats} 
          />
        )}

        {activeTab === 'banks' && (
          <Banks showToast={showToast} onRefreshStats={loadDashboardStats} />
        )}

        {activeTab === 'reports' && (
          <Reports showToast={showToast} initialData={navData} />
        )}

        {activeTab === 'settings' && (
          <Settings showToast={showToast} onRefreshStats={loadDashboardStats} role={currentUser.role} />
        )}

        {activeTab === 'manual' && (
          <UserManual />
        )}

        {activeTab === 'audit' && currentUser.role === 'admin' && (
          <AuditLogs showToast={showToast} />
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />
        <MaturityAlarmModal stats={stats} onNavigate={handleNavigate} />
      </main>

      {/* FROZEN NARROW BOTTOM FOOTER BAR */}
      <footer 
        className="no-print" 
        style={{
          position: 'fixed',
          bottom: 0,
          left: isSidebarCollapsed ? '0' : 'var(--sidebar-width, 240px)',
          right: 0,
          height: '24px',
          background: 'var(--primary-gradient)',
          borderTop: '1px solid rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99,
          fontSize: '11px',
          color: 'rgba(255,255,255,0.9)',
          padding: '0 16px',
          boxShadow: '0 -2px 12px rgba(14, 116, 100, 0.25)',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <span>
          <strong style={{ color: '#ffffff' }}>Developer:</strong>{' '}
          Ariful Islam, AGM Finance, Gazipur PBS-2 &nbsp;·&nbsp; Cell: 01737530731
        </span>
      </footer>
    </div>
  );
}
