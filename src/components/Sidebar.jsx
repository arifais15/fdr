import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Landmark, 
  FileText, 
  FileCheck, 
  Calculator, 
  Building2, 
  BarChart3, 
  ShieldAlert, 
  Award,
  Settings,
  LogOut,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  Calendar,
  Percent,
  RefreshCcw,
  CheckCircle,
  ShieldCheck,
  Search,
  X,
  FileSpreadsheet
} from 'lucide-react';

import { getTranslation } from '../utils/translations';

export default function Sidebar({ activeTab, navData, setActiveTab, onLogout, isCollapsed, onToggleCollapse, lang = 'en', role }) {
  const t = (key) => getTranslation(lang, key);

  const [isReportsExpanded, setIsReportsExpanded] = useState(() => {
    return activeTab === 'reports';
  });

  const [reportSearchQuery, setReportSearchQuery] = useState('');

  const reportCategories = [
    {
      id: 'portfolio-cat',
      titleKey: 'report_cat_portfolio',
      shortKey: 'report_cat_short_portfolio',
      defaultTitle: 'Portfolio & Registers',
      icon: Landmark,
      items: [
        { id: 'portfolio', labelKey: 'report_nav_portfolio', defaultLabel: 'Portfolio Register', icon: Landmark },
        { id: 'fy-fdr-register', labelKey: 'report_nav_fy_fdr_register', defaultLabel: 'FY FDR Register (Annexure A)', icon: FileSpreadsheet },
        { id: 'govt-fdr', labelKey: 'report_nav_govt_fdr', defaultLabel: 'Govt. Bank FDR List', icon: Landmark },
        { id: 'private-fdr', labelKey: 'report_nav_private_fdr', defaultLabel: 'Private Bank FDR List', icon: Building2 },
        { id: 'monthly', labelKey: 'report_nav_monthly', defaultLabel: 'Monthly Report', icon: Calendar },
        { id: 'maturity', labelKey: 'report_nav_maturity', defaultLabel: 'Maturity Schedule', icon: Calendar },
      ]
    },
    {
      id: 'exposure-cat',
      titleKey: 'report_cat_exposure',
      shortKey: 'report_cat_short_exposure',
      defaultTitle: 'Exposure & Matrix',
      icon: BarChart3,
      items: [
        { id: 'bank-exposure', labelKey: 'report_nav_bank_exposure', defaultLabel: 'Bank Exposure', icon: BarChart3 },
        { id: 'fund-wise', labelKey: 'report_nav_fund_wise', defaultLabel: 'Fund Concentration', icon: FileText },
        { id: 'sector-matrix', labelKey: 'report_nav_sector_matrix', defaultLabel: 'Bank & Fund Matrix', icon: Landmark },
        { id: 'bank-branch-wise', labelKey: 'report_nav_bank_branch', defaultLabel: 'Bank & Branch Breakdown', icon: Building2 },
      ]
    },
    {
      id: 'statements-cat',
      titleKey: 'report_cat_statements',
      shortKey: 'report_cat_short_statements',
      defaultTitle: 'Statements & Accruals',
      icon: Percent,
      items: [
        { id: 'accrual-statements', labelKey: 'report_nav_accrual_statements', defaultLabel: 'Financial Statements', icon: Landmark },
        { id: 'period-comparison', labelKey: 'report_nav_period_comparison', defaultLabel: 'Period Movement', icon: Calendar },
        { id: 'provisions', labelKey: 'report_nav_provisions', defaultLabel: 'Provision Ledger', icon: Percent },
        { id: 'auto-jv', labelKey: 'report_nav_auto_jv', defaultLabel: 'Auto Journal Voucher (JV)', icon: FileText },
      ]
    }
  ];

  const currentReportTab = activeTab === 'reports' ? (navData?.reportTab || 'portfolio') : null;

  const [selectedCategoryTab, setSelectedCategoryTab] = useState(() => {
    const target = navData?.reportTab || 'portfolio';
    const catIdx = reportCategories.findIndex(cat => cat.items.some(it => it.id === target));
    return catIdx !== -1 ? catIdx : 0;
  });

  // Auto-expand reports section and synchronize category tab when active tab is reports
  useEffect(() => {
    if (activeTab === 'reports') {
      setIsReportsExpanded(true);
      const target = navData?.reportTab || 'portfolio';
      const catIdx = reportCategories.findIndex(cat => cat.items.some(it => it.id === target));
      if (catIdx !== -1 && selectedCategoryTab !== 'all') {
        setSelectedCategoryTab(catIdx);
      }
    }
  }, [activeTab, navData?.reportTab]);

  // Flattened reports for live search
  const allReportItems = useMemo(() => {
    return reportCategories.flatMap((cat, catIdx) => 
      cat.items.map(item => ({
        ...item,
        catIdx,
        categoryTitle: t(cat.titleKey)
      }))
    );
  }, [lang]);

  const searchResults = useMemo(() => {
    if (!reportSearchQuery.trim()) return null;
    const q = reportSearchQuery.trim().toLowerCase();
    return allReportItems.filter(item => {
      const label = t(item.labelKey).toLowerCase();
      const def = item.defaultLabel.toLowerCase();
      const cat = item.categoryTitle.toLowerCase();
      return label.includes(q) || def.includes(q) || cat.includes(q);
    });
  }, [reportSearchQuery, allReportItems, lang]);

  const mainMenuItems = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'investments', label: t('nav_investments'), icon: Landmark },
    { id: 'proposals', label: t('nav_proposals'), icon: FileCheck },
    { id: 'letters', label: t('nav_letters'), icon: FileText },
    { id: 'provisions', label: t('nav_provisions'), icon: Calculator },
    { id: 'banks', label: t('nav_banks'), icon: Building2 },
    { id: 'reports', label: t('nav_reports'), icon: BarChart3, isReportContainer: true },
    { id: 'settings', label: t('nav_settings'), icon: Settings },
    { id: 'manual', label: t('nav_manual'), icon: HelpCircle },
    { id: 'audit', label: t('nav_audit'), icon: ShieldAlert }
  ].filter(item => !['settings', 'audit'].includes(item.id) || role === 'admin');

  return (
    <>
      {/* FLOATING SIDEBAR TOGGLE (ONLY VISIBLE WHEN SIDEBAR IS COLLAPSED) */}
      {isCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Open Sidebar"
          className="no-print"
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 200,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--primary)',
            borderRadius: '8px',
            padding: '7px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      <div 
        className="sidebar no-print"
        style={{
          transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '14px 14px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(14, 148, 117, 0.12) 0%, transparent 100%)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'var(--primary-gradient)',
              padding: '8px',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(14, 116, 100, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <Award size={19} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>
                {t('app_title')}
              </h2>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--primary)', marginTop: '1px', letterSpacing: '0.02em' }}>
                FDR Management System
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            style={{
              background: 'rgba(14, 116, 100, 0.08)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.background = 'rgba(14, 116, 100, 0.14)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'rgba(14, 116, 100, 0.08)';
            }}
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Navigation Links */}
        <div 
          className="sidebar-nav-container"
          style={{ 
            padding: '12px 8px 30px 8px', 
            flex: '1 1 0%', 
            minHeight: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '3px', 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isMainActive = activeTab === item.id;

            if (item.isReportContainer) {
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Reports Top Menu Button */}
                  <button
                    onClick={() => {
                      if (activeTab !== 'reports') {
                        setActiveTab('reports', navData);
                        setIsReportsExpanded(true);
                      } else {
                        setIsReportsExpanded(prev => !prev);
                      }
                    }}
                    title={`Navigate to ${item.label}`}
                    className={`nav-item-btn ${isMainActive ? 'active' : ''}`}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isMainActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(14, 116, 100, 0.08)',
                        border: `1px solid ${isMainActive ? 'rgba(255, 255, 255, 0.35)' : 'rgba(14, 116, 100, 0.18)'}`,
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}>
                        <Icon size={15} color={isMainActive ? '#ffffff' : 'currentColor'} />
                      </div>
                      <span style={{ letterSpacing: '-0.01em' }}>{item.label}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'rgba(14, 148, 117, 0.16)',
                        color: '#0e9475',
                        border: '1px solid rgba(14, 148, 117, 0.30)'
                      }}>
                        {reportCategories.reduce((acc, cat) => acc + cat.items.length, 0)}
                      </span>
                      {isReportsExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                    </div>
                  </button>

                  {/* Expandable Report Nav Menu Sub-Items (Clean Tray Presentation) */}
                  {isReportsExpanded && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.16)',
                      borderRadius: '10px',
                      padding: '8px 6px',
                      border: '1px solid rgba(14, 148, 117, 0.22)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginTop: '2px',
                      marginBottom: '6px'
                    }}>
                      {/* 1. Quick Report Search Bar */}
                      <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                          type="text"
                          value={reportSearchQuery}
                          onChange={(e) => setReportSearchQuery(e.target.value)}
                          placeholder={t('report_search_placeholder')}
                          style={{
                            width: '100%',
                            padding: '5px 22px 5px 24px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: 'rgba(0, 0, 0, 0.25)',
                            color: 'var(--input-text, #ffffff)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--primary)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--border-color)';
                          }}
                        />
                        {reportSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setReportSearchQuery('')}
                            style={{
                              position: 'absolute',
                              right: '6px',
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
                            title="Clear"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>

                      {/* 2. Category Switcher Tabs (Hidden when searching) */}
                      {!reportSearchQuery.trim() && (
                        <div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '3px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            padding: '2.5px',
                            borderRadius: '7px',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            {reportCategories.map((cat, idx) => {
                              const isTabActive = selectedCategoryTab === idx;
                              const CatIcon = cat.icon;
                              const shortLabel = t(cat.shortKey);
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setSelectedCategoryTab(idx)}
                                  style={{
                                    background: isTabActive ? 'var(--primary-gradient)' : 'transparent',
                                    color: isTabActive ? '#ffffff' : 'var(--text-muted)',
                                    border: isTabActive ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                                    borderRadius: '5px',
                                    padding: '5px 2px',
                                    fontSize: '10.5px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isTabActive ? '0 2px 6px rgba(14, 116, 100, 0.3)' : 'none'
                                  }}
                                  title={`${t(cat.titleKey)} (${cat.items.length})`}
                                >
                                  <CatIcon size={11} color={isTabActive ? '#ffffff' : 'currentColor'} />
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {shortLabel}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* View mode toggle: Tab mode vs All 13 */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', padding: '0 3px' }}>
                            <span style={{ fontSize: '9.5px', fontWeight: '700', color: 'var(--text-muted)' }}>
                              {selectedCategoryTab === 'all' 
                                ? (lang === 'bn' ? 'সকল ১৩টি রিপোর্ট' : 'All 13 Reports') 
                                : `${t(reportCategories[selectedCategoryTab]?.titleKey)} (${reportCategories[selectedCategoryTab]?.items.length})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedCategoryTab(prev => prev === 'all' ? 0 : 'all')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: selectedCategoryTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                                fontSize: '9.5px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                padding: '1px 3px',
                                textDecoration: 'underline'
                              }}
                            >
                              {selectedCategoryTab === 'all'
                                ? (lang === 'bn' ? 'ট্যাব ভিউ' : 'Tab View')
                                : (lang === 'bn' ? 'সকল দেখুন' : 'Show All')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                        {/* Live Search Mode */}
                        {reportSearchQuery.trim() ? (
                          searchResults.length === 0 ? (
                            <div style={{ padding: '12px 6px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>
                              {lang === 'bn' ? 'কোনো রিপোর্ট পাওয়া যায়নি' : 'No matching reports'}
                            </div>
                          ) : (
                            searchResults.map(item => {
                              const SubIcon = item.icon;
                              const isSubActive = activeTab === 'reports' && (currentReportTab === item.id);
                              const subLabel = t(item.labelKey);

                              return (
                                <button
                                  key={item.id}
                                  onClick={() => setActiveTab('reports', { reportTab: item.id })}
                                  className={`nav-item-btn ${isSubActive ? 'active' : ''}`}
                                  style={{
                                    padding: '6px 8px',
                                    fontSize: '12px',
                                    borderRadius: '7px',
                                    border: isSubActive ? '1px solid rgba(14, 148, 117, 0.45)' : '1px solid transparent',
                                    borderLeft: isSubActive ? '3.5px solid var(--primary)' : '1px solid transparent',
                                    background: isSubActive ? 'rgba(14, 148, 117, 0.20)' : 'transparent',
                                    color: isSubActive ? 'var(--primary)' : 'var(--text-main)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '6px',
                                    width: '100%',
                                    textAlign: 'left'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
                                    <SubIcon size={13} color={isSubActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                                    <span style={{ fontWeight: isSubActive ? '800' : '600', fontSize: '12px', lineHeight: '1.25' }}>
                                      {subLabel}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: '3px', flexShrink: 0 }}>
                                    {item.categoryTitle.split(' ')[0]}
                                  </span>
                                </button>
                              );
                            })
                          )
                        ) : selectedCategoryTab === 'all' ? (
                          /* Categorized All 13 View */
                          reportCategories.map((cat) => (
                            <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px' }}>
                              <div style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                color: 'var(--primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                padding: '3px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>{t(cat.titleKey)}</span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>({cat.items.length})</span>
                              </div>
                              {cat.items.map(subItem => {
                                const SubIcon = subItem.icon;
                                const isSubActive = activeTab === 'reports' && (currentReportTab === subItem.id);
                                const subLabel = t(subItem.labelKey);

                                return (
                                  <button
                                    key={subItem.id}
                                    onClick={() => setActiveTab('reports', { reportTab: subItem.id })}
                                    className={`nav-item-btn ${isSubActive ? 'active' : ''}`}
                                    style={{
                                      padding: '6px 8px',
                                      fontSize: '12px',
                                      borderRadius: '7px',
                                      border: isSubActive ? '1px solid rgba(14, 148, 117, 0.45)' : '1px solid transparent',
                                      borderLeft: isSubActive ? '3.5px solid var(--primary)' : '1px solid transparent',
                                      background: isSubActive ? 'rgba(14, 148, 117, 0.20)' : 'transparent',
                                      color: isSubActive ? 'var(--primary)' : 'var(--text-main)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '6px',
                                      width: '100%',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
                                      <SubIcon size={13} color={isSubActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                                      <span style={{ fontWeight: isSubActive ? '800' : '600', fontSize: '12px', lineHeight: '1.25' }}>
                                        {subLabel}
                                      </span>
                                    </div>
                                    {isSubActive && (
                                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)', flexShrink: 0 }} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ))
                        ) : (
                          /* Compact Single Category Tab View (4-5 items, zero scroll) */
                          reportCategories[selectedCategoryTab]?.items.map(subItem => {
                            const SubIcon = subItem.icon;
                            const isSubActive = activeTab === 'reports' && (currentReportTab === subItem.id);
                            const subLabel = t(subItem.labelKey);

                            return (
                              <button
                                key={subItem.id}
                                onClick={() => setActiveTab('reports', { reportTab: subItem.id })}
                                className={`nav-item-btn ${isSubActive ? 'active' : ''}`}
                                style={{
                                  padding: '7px 9px',
                                  fontSize: '12.5px',
                                  borderRadius: '7px',
                                  border: isSubActive ? '1px solid rgba(14, 148, 117, 0.45)' : '1px solid transparent',
                                  borderLeft: isSubActive ? '3.5px solid var(--primary)' : '1px solid transparent',
                                  background: isSubActive 
                                    ? 'linear-gradient(90deg, rgba(14, 148, 117, 0.22) 0%, rgba(14, 148, 117, 0.08) 100%)' 
                                    : 'transparent',
                                  color: isSubActive ? 'var(--primary)' : 'var(--text-main)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  width: '100%',
                                  textAlign: 'left',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isSubActive ? 'rgba(14, 148, 117, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid ${isSubActive ? 'rgba(14, 148, 117, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                                    flexShrink: 0
                                  }}>
                                    <SubIcon size={12} color={isSubActive ? 'var(--primary)' : 'var(--text-muted)'} />
                                  </div>
                                  <span style={{
                                    fontWeight: isSubActive ? '800' : '600',
                                    color: isSubActive ? 'var(--primary)' : 'var(--text-main)',
                                    fontSize: '12.5px',
                                    lineHeight: '1.3'
                                  }}>
                                    {subLabel}
                                  </span>
                                </div>
                                {isSubActive && (
                                  <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    boxShadow: '0 0 8px var(--primary)',
                                    flexShrink: 0
                                  }} />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={`Navigate to ${item.label}`}
                className={`nav-item-btn ${isMainActive ? 'active' : ''}`}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: isMainActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(14, 116, 100, 0.08)',
                  border: `1px solid ${isMainActive ? 'rgba(255, 255, 255, 0.35)' : 'rgba(14, 116, 100, 0.18)'}`,
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}>
                  <Icon size={15} color={isMainActive ? 'var(--primary)' : 'currentColor'} />
                </div>
                <span style={{ flex: 1, letterSpacing: '-0.01em' }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="sidebar-footer" style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-sidebar-footer)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          flexShrink: 0
        }}>
          <button
            onClick={onLogout}
            className="logout-btn"
            title="Click to securely log out of the Fund Management application"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              marginBottom: 0,
              borderRadius: '9px',
              border: '1px solid var(--logout-btn-border)',
              background: 'var(--logout-btn-bg)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: 'var(--logout-btn-text)',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              transition: 'all 0.22s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.28)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--logout-btn-bg)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <LogOut size={14} />
            {t('secure_logout')}
          </button>

        </div>
      </div>
    </>
  );
}
