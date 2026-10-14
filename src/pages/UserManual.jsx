import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Landmark, 
  FileText, 
  Calculator, 
  BarChart3, 
  Settings, 
  Printer, 
  Search,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';

export default function UserManual() {
  const [activeManualTab, setActiveManualTab] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'getting-started', title: '1. Overview & System Security', icon: BookOpen, tooltip: 'Learn software overview, offline database, session timeout, and security features' },
    { id: 'investments', title: '2. Investment Register, Edit & Renewal', icon: Landmark, tooltip: 'Manage FDRs, Savings Certificates, clean record editing, renewals, encashment, and statements' },
    { id: 'excel-import', title: '3. Excel Bulk Import & Export', icon: FileSpreadsheet, tooltip: 'Download Excel templates and bulk import FDRs or Bank directories seamlessly' },
    { id: 'proposals-letters', title: '4. Proposals & Bank Letters', icon: FileText, tooltip: 'Generate board memos, encashment letters, renewal letters, and tax certificate requests' },
    { id: 'provisions', title: '5. Interest & Tax Provisioning', icon: Calculator, tooltip: 'Calculate monthly gross profit, 10%/15% AIT tax deductions, and excise duty provisions' },
    { id: 'journal-entries', title: '6. Journal Entries & General Ledger', icon: FileCheck, tooltip: 'Automated Monthly Settlement JV, Manual Journal Entries, and General Ledger Register' },
    { id: 'financial-reports', title: '7. Accrual Financial Statements', icon: BarChart3, tooltip: 'Balance Sheet, Income Statement (P&L), Cash Flows, and Bank Sector Classification Matrix' },
    { id: 'period-closing', title: '8. Monthly Closing & FY Statements', icon: Layers, tooltip: 'Monthly ledger audits and fiscal year (July–June) fund balance movement statements' },
    { id: 'settings', title: '9. Signatories & System Setup', icon: Settings, tooltip: 'Configure official signatories, digital PNG signatures, PBS logos, email alerts, and audit logs' }
  ];

  const filteredSections = searchQuery.trim() 
    ? sections.filter(sec => sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || sec.id.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections;

  const currentDateStr = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="user-manual-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SCREEN-ONLY: HEADER BANNER */}
      <div 
        className="glass-panel no-print" 
        style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', borderLeft: '4px solid #38bdf8' }}
        title="Official User Manual & Operational Guidelines Banner"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HelpCircle size={26} color="#38bdf8" />
              <span>User Manual & Operational Guidelines</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px', margin: 0 }}>
              Complete, step-by-step operational manual for Gazipur PBS-2 Fund Management, FDR register, Excel bulk import, interest accruals, tax certificates, and fiscal period closing.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', width: '240px' }} title="Search within manual guidelines">
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search manual (e.g. Excel, AIT)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '13px', height: '38px', borderRadius: '8px' }}
                title="Type keywords like Excel, FDR, Tax, Encashment, or Signatory to filter topics"
              />
            </div>

            <button 
              onClick={() => window.print()} 
              className="btn-secondary no-print"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
              title="Click to print or save a PDF version of this complete operational manual"
            >
              <Printer size={16} />
              <span>Print Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* SCREEN-ONLY: NAVIGATION TABS */}
      <div 
        className="glass-panel no-print" 
        style={{ padding: '12px 16px', display: 'flex', gap: '10px', overflowX: 'auto' }}
        title="Navigation tabs to switch between different operational guide chapters"
      >
        {filteredSections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeManualTab === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveManualTab(sec.id)}
              title={sec.tooltip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: isActive ? '1px solid #2563eb' : '1px solid var(--border-color)',
                background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'var(--bg-card-hover)',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                fontWeight: isActive ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#ffffff' : 'var(--primary)'} />
              <span>{sec.title}</span>
            </button>
          );
        })}
      </div>

      {/* SCREEN INTERACTIVE VIEW: MANUAL CONTENT PANEL */}
      <div className="glass-panel no-print" style={{ padding: '32px', minHeight: '500px' }}>
        
        {/* 1. OVERVIEW & SYSTEM SECURITY */}
        {(activeManualTab === 'getting-started' || searchQuery) && (
          <div style={{ marginBottom: searchQuery ? '40px' : '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} />
              <span>1. Overview & System Security (পদ্ধতি পরিচিতি ও সেশন সুরক্ষা)</span>
            </h3>
            
            <div style={{ lineHeight: '1.7', color: 'var(--text-main)', fontSize: '14px' }}>
              <p>
                গাজীপুর পল্লী বিদ্যুৎ সমিতি-২ এর <strong>Fund Management Software</strong> হল বিআরইবি/পবিস নির্দেশিকা ও ইনকাম ট্যাক্স অর্ডিন্যান্স অনুযায়ী সর্বজনীন প্রভিডেন্ট ফান্ড (CPF), গ্রাচ্যুইটি ফান্ড, বেনাভোলেন্ট ফান্ড এবং বিবিধ ফান্ডের বিনিয়োগ সংরক্ষণ ও আর্থিক হিসাব মেলবন্ধনের জন্য একটি স্বয়ংসম্পূর্ণ অফলাইন সিস্টেম।
              </p>

              <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #38bdf8', margin: '20px 0' }}>
                <h4 style={{ color: '#0284c7', margin: '0 0 10px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} />
                  <span>System Access & Credentials (প্রবেশাধিকার নিয়মাবলি)</span>
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><strong>Application Login:</strong> ব্যবহারকারী নির্ধারিত অ্যাকাউন্ট পাসওয়ার্ড দিয়ে লগইন করে দৈনিক কাজ সম্পন্ন করবেন।</li>
                  <li><strong>System Admin Control:</strong> সিগনেটরি নাম, পদবী, ডিজিটাল স্বাক্ষর, পবিস সেটিং ও ব্যাকআপ নেয়ার জন্য অনুমোদিত নিরাপত্তা কোড দিন।</li>
                  <li><strong>Password-Protected Record Deletion:</strong> কোনো FDR রেকর্ড বা আর্থিক তথ্য অসাবধানতাবশত মুছে ফেলা রোধে ডিলিট করার সময় সিস্টেম এডমিন পাসওয়ার্ড বাধ্যতামূলকভাবে প্রম্পট করা হয়।</li>
                </ul>
              </div>

              <h4 style={{ color: 'var(--text-main)', marginTop: '24px' }}>গোপনীয়তা ও সেশন সুরক্ষা (Security Features):</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Session Persistence:</strong> ব্রাউজার রিফ্রেশ করলে লগইন সেশন বজায় থাকে, কাজ ব্যাহত হয় না।</li>
                <li><strong>Auto Idle Timeout:</strong> ১০ মিনিট কোনো কার্যক্রম না থাকলে নিরাপত্তার স্বার্থে স্বয়ংক্রিয়ভাবে লক হয়ে যায়।</li>
                <li><strong>Offline SQLite Engine:</strong> কোন ইন্টারনেট সংযোগের প্রয়োজন নেই; ডেটাবেজ <code>Fund_vault_v7.sqlite3</code> স্থানীয় পিসিতে সংরক্ষিত।</li>
                <li><strong>PC Maturity Alarms:</strong> অ্যাপ চালু থাকলে বা পিসি রিস্টার্টের সাথে সাথে আগামী ১-৭ দিনের মধ্যে মেয়াদী ফান্ডের অ্যালার্ম চেইম বেজে উঠবে।</li>
              </ul>
            </div>
          </div>
        )}

        {/* 2. INVESTMENT REGISTER & RENEWAL */}
        {(activeManualTab === 'investments' || searchQuery) && (
          <div style={{ marginBottom: searchQuery ? '40px' : '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={20} />
              <span>2. Investment Register, Edit & Renewal (বিনিয়োগ সংরক্ষণ, সম্পাদন ও নবায়ন)</span>
            </h3>

            <div style={{ lineHeight: '1.7', color: 'var(--text-main)', fontSize: '14px' }}>
              <h4 style={{ color: '#0284c7' }}>ক) নতুন FDR বা সঞ্চয়পত্র এন্ট্রি পদ্ধতি:</h4>
              <ol style={{ paddingLeft: '20px' }}>
                <li>মেনু থেকে <strong>Investments Register</strong> এ প্রবেশ করুন।</li>
                <li>উপরে ডানপাশের <strong>+ New FDR / Certificate</strong> বাটনে চাপ দিন (বা <code>title</code> কন্ট্রোলটিপ দেখুন)।</li>
                <li><strong>Investment Type:</strong> FDR, National Savings Certificate বা প্রসংগভিত্তিক কাস্টম টাইপ নির্বাচন করুন।</li>
                <li><strong>Fund Category:</strong> সংশ্লিষ্ট ফান্ডের হিসাব কোড (যেমন: <code>129.25.100</code> - প্রভিডেন্ট ফান্ড) সিলেক্ট করুন।</li>
                <li>ব্যাংকের নাম, শাখা, FDR নম্বর, মূলধন (Principal BDT), সুদের হার (%) এবং খোলার তারিখ প্রদান করুন।</li>
                <li><strong>Save Investment</strong> এ ক্লিক করলে অটোমেটিক মেয়াদপূর্তির তারিখ ও সম্ভাব্য প্রফিট হিসাব হয়ে যাবে।</li>
              </ol>

              <h4 style={{ color: '#10b981', marginTop: '24px' }}>খ) ভুল এন্ট্রি সংশোধন (Clean Record Correction via Edit):</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Edit FDR:</strong> ভুলবশত ইস্যু তারিখ, খোলার তারিখ, মূলধন, সুদের হার বা হিসাব নম্বর ভুল এন্ট্রি হলে সারির <strong>Edit</strong> বাটনে ক্লিক করে সংশোধন করুন।</li>
                <li><strong>নো-স্পুরিয়াস হিস্ট্রি নিশ্চয়তা:</strong> এডিট বাটনের মাধ্যমে সংশোধনে কোন অপ্রয়োজনীয় বা বিভ্রান্তিকর লেনদেন ইতিহাস তৈরি হয় না; শুধুমাত্র মূল রেকর্ডটি শুদ্ধভাবে আপডেট হয় এবং প্রথম ইস্যু তারিখ (First Issue Date) ও আদি তৈরি লগ স্বয়ংক্রিয়ভাবে সমন্বিত থাকে।</li>
              </ul>

              <h4 style={{ color: '#6366f1', marginTop: '24px' }}>গ) FDR লেজার ও ব্যাংক স্টেটমেন্ট (Investment Ledger & Bank Statement):</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>FDR নম্বর লেজার লিংক:</strong> টেবিলে যেকোনো <strong>FDR নম্বরে</strong> ক্লিক করলে সাথে সাথে ওই FDR এর সমস্ত ইতিহাস ও ট্রানজেকশন খতিয়ান পপআপে প্রদর্শিত হবে।</li>
                <li><strong>FDR Bank Statement (নীল বই আইকন):</strong> একশন কলামে থাকা নীল বই আইকনে ক্লিক করলে ওই FDR এর খোলার তারিখ থেকে শুরু করে সকল নবায়ন, মূলধন বৃদ্ধি/হ্রাস ও ডেবিট-ক্রেডিট রানিং ব্যালেন্স সম্বলিত পূর্ণাঙ্গ ব্যাংক স্টেটমেন্ট দেখা ও প্রিন্ট করা যায়।</li>
              </ul>

              <h4 style={{ color: '#d97706', marginTop: '24px' }}>ঘ) FDR নবায়ন (Renew) ও এনক্যাশমেন্ট (Encashment):</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Renew Investment:</strong> মেয়াদ উত্তীর্ণ FDR এর পাশে <strong>Renew</strong> বাটনে ক্লিক করে নতুন মেয়াদ, সুদের হার ও নতুন FDR নম্বর দিন।</li>
                <li><strong>Encash Investment:</strong> ব্যাংক থেকে আসল ও নিট মুনাফা জমা হওয়ার পর <strong>Encash</strong> চেপে চূড়ান্ত পরিশোধিত টাকা লিপিবদ্ধ করুন।</li>
                <li><strong>নিরাপদ ডিলিট:</strong> <strong>Delete</strong> বাটনে ক্লিক করলে এডমিন পাসওয়ার্ড ভেরিফিকেশন পপআপ প্রদর্শিত হবে। সঠিক পাসওয়ার্ড ছাড়া রেকর্ড মুছে যাবে না।</li>
              </ul>
            </div>
          </div>
        )}

        {/* 3. EXCEL BULK IMPORT & EXPORT */}
        {(activeManualTab === 'excel-import' || searchQuery) && (
          <div style={{ marginBottom: searchQuery ? '40px' : '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} />
              <span>3. Excel Bulk Data Import & Export (এক্সেলে তথ্য আপলোড ও ডাউনলোড)</span>
            </h3>

            <div style={{ lineHeight: '1.7', color: 'var(--text-main)', fontSize: '14px' }}>
              <p>
                হাজার হাজার FDR এবং ব্যাংক ডিরেক্টরির তথ্য সহজে ব্যবস্থাপনা করতে সিস্টেমে এক ক্লিকে Excel Template ডাউনলোড ও Excel Bulk Upload সুবিধা রয়েছে।
              </p>

              <h4 style={{ color: '#10b981', marginTop: '16px' }}>ক) FDR এক্সেল বাল্ক আপলোড নির্দেশিকা:</h4>
              <ol style={{ paddingLeft: '20px' }}>
                <li>Investments Register পেজে <strong>Download Excel Template</strong> বাটনে ক্লিক করে pre-formatted <code>FDR_Bulk_Import_Template.xlsx</code> ফাইল ডাউনলোড করুন।</li>
                <li>নির্ধারিত হেডার যেমন <code>FDR No</code>, <code>Account No</code>, <code>Bank Name</code>, <code>Branch Name</code>, <code>Principal Amount</code>, <code>Interest Rate %</code>, <code>Issue Date (YYYY-MM-DD)</code> ইত্যাদি ঠিক রেখে তথ্য পূরণ করুন।</li>
                <li><strong>Upload FDR Excel</strong> বাটনে ক্লিক করে ফাইলটি সিলেক্ট করলে অ্যাপ সেটি পার্স করে ছক আকারে প্রিভিউ দেখাবে।</li>
                <li><strong>Confirm & Import</strong> চাপলে সমস্ত ডেটা ডেটাবেজে transactional বা প্রক্রিয়াগতভাবে সংরক্ষিত হবে। ডুপ্লিকেট FDR অটোমেটিক স্কিপ হবে।</li>
              </ol>

              <h4 style={{ color: '#d97706', marginTop: '20px' }}>খ) ব্যাংক তালিকা এক্সেলে আপলোড:</h4>
              <ol style={{ paddingLeft: '20px' }}>
                <li>Bank List পেজ থেকে <code>Bank_List_Import_Template.xlsx</code> ডাউনলোড করুন।</li>
                <li>ব্যাংকের নাম, শাখা, ব্যাংকের খাত (Government/Private), রাউটিং নম্বর, যোগাযোগের নম্বর ও ইমেইল দিয়ে আপলোড শেষ করুন।</li>
              </ol>
            </div>
          </div>
        )}

        {/* 4. PROPOSALS & BANK LETTERS */}
        {(activeManualTab === 'proposals-letters' || searchQuery) && (
          <div style={{ marginBottom: searchQuery ? '40px' : '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#d97706', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} />
              <span>4. Proposal Memos & Bank Letters (প্রস্তাবনা ও অফিশিয়াল ব্যাংক চিঠি)</span>
            </h3>

            <div style={{ lineHeight: '1.7', color: 'var(--text-main)', fontSize: '14px' }}>
              <h4 style={{ color: '#0284c7' }}>ক) বোর্ড ও ম্যানেজমেন্ট প্রস্তাবনা নোটশীট:</h4>
              <p>
                মেয়াদোত্তীর্ণ FDR সমূহের পুনঃবিনিয়োগ বা সর্বোচ্চ মুনাফায় ব্যাংক নির্বাচনের জন্য <strong>Investment Proposals</strong> মেনু ব্যবহার করে অফিশিয়াল নোটশীট তৈরি ও প্রিন্ট করুন।
              </p>

              <h4 style={{ color: '#10b981', marginTop: '20px' }}>খ) মেয়াদোত্তীর্ণ তালিকা ও সারিতে পত্রের ধরণ নির্ধারণ (Matured FDRs & Per-Row Letter Types):</h4>
              <p>
                <strong>Matured FDR List</strong> এ মাস ও বছর নির্বাচনের সাথে সাথে সংশ্লিষ্ট মাসে মেয়াদপূর্ণ সমস্ত FDR টেবিল আকারে প্রদর্শিত হয়। প্রতিটি সারিতে নির্দিষ্ট পত্রের ধরণ নির্ধারণ করা যায়:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Renewal: Compound (মূলধন+মুনাফা পুনঃবিনিয়োগ):</strong> আসল এবং অর্জিত নিট মুনাফা একত্রে চক্রবৃদ্ধি আকারে পুনঃবিনিয়োগের অফিশিয়াল ব্যাংক পত্র।</li>
                <li><strong>Renewal: Profit to Bank A/C (আসল নবায়ন, মুনাফা একাউন্টে জমা):</strong> মূলধন সমপরিমাণ নবায়ন এবং অর্জিত মুনাফা সমিতির ব্যাংক চলতি হিসাবে জমা করার পত্র।</li>
                <li><strong>Renewal: Profit Pay Order (আসল নবায়ন, মুনাফার পে-অর্ডার):</strong> মূলধন নবায়ন এবং মুনাফার অংশ পে-অর্ডার আকারে সমিতির অনুকূলে প্রেরণের নির্দেশনা।</li>
                <li><strong>Renewal: Standard (সাধারণ নবায়ন):</strong> ব্যাংকের স্ট্যান্ডার্ড শর্তাবলীতে সাধারণ পুনঃবিনিয়োগ পত্র।</li>
                <li><strong>Encashment (চূড়ান্ত নগদায়ন):</strong> মূলধন ও মুনাফাসহ সম্পূর্ণ অর্থ সমিতির মূল ব্যাংক একাউন্টে ট্রান্সফার করার চিঠি।</li>
                <li><strong>Interest & Tax Certificate Request:</strong> অর্থ বছরের ব্যাংক সুদ, উৎস কর (AIT) ও আবগারি শুল্ক প্রত্যয়নপত্রের আবেদন।</li>
              </ul>

              <h4 style={{ color: '#6366f1', marginTop: '20px' }}>গ) মাল্টি-টাইপ ব্যাচ প্রিন্ট ও লাইভ প্রিভিউ (Multi-Type Batch Print & Live Preview):</h4>
              <ol style={{ paddingLeft: '20px' }}>
                <li>টেবিলের বিভিন্ন সারিতে প্রয়োজন অনুযায়ী বিভিন্ন পত্রের ধরণ (যেমন: কিছু Renewal, কিছু Encashment) সিলেক্ট করুন।</li>
                <li>যেকোনো সারিতে ক্লিক করলে পাশে তাৎক্ষণিক সেই চিঠির লাইভ প্রিভিউ দৃশ্যমান হবে।</li>
                <li><strong>Print Command:</strong> একক পত্র প্রিন্টের জন্য সংশ্লিষ্ট সারির <strong>Print Letter</strong> বাটন চাপুন, অথবা সকল পত্র একসাথে প্রিন্ট করতে উপরের <strong>Print Selected / Print All</strong> চাপুন। সিস্টেম প্রতিটি FDR কে তার নির্ধারিত সুনির্দিষ্ট চিঠি ফরম্যাটে নির্ভুলভাবে প্রিন্ট করবে।</li>
              </ol>

              <h4 style={{ color: '#d97706', marginTop: '20px' }}>ঘ) লেটার বডি টেমপ্লেট কাস্টমাইজেশন (Letter Body Templates Customization):</h4>
              <p>
                প্রতিটি পত্র ধরণের মূল বক্তব্য ও শর্তাবলী স্থায়ীভাবে কাস্টমাইজ করার জন্য কমান্ড বার অথবা প্রিভিউ কার্ডের <strong>Letter Body Templates</strong> বাটনে চাপ দিন। এখানে প্রতিটি পত্র ধরণের জন্য প্যারাগ্রাফ টেক্সট, সংযুক্তি (Enclosures) ও অনুলিপি (Copy to) লিখে সংরক্ষণ করা যায়, যা ভবিষ্যতে সকল চিঠিতে স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে।
              </p>
            </div>
          </div>
        )}

        {/* 5. INTEREST & TAX PROVISIONS */}
        {(activeManualTab === 'provisions' || searchQuery) && (
          <div style={{ marginBottom: searchQuery ? '40px' : '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#e11d48', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={20} />
              <span>5. Monthly Interest & Tax Provisioning (সুদ ও কর সঞ্চিতি হিসাব)</span>
            </h3>

            <div style={{ lineHeight: '1.7', color: 'var(--text-main)', fontSize: '14px' }}>
              <p>
                মাসিক ভিত্তিতে সমস্ত কার্যকর FDR এর অর্জিত আনুপাতিক গ্রস মুনাফা, ১০%/১৫% উৎসে কর (AIT) এবং আবগারি শুল্ক (Excise Duty) হিসাব করে প্রোভিশন রেজিস্টারে পোস্টিং দেওয়া হয়।
              </p>
              
              <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', marginTop: '16px' }}>
                <h4 style={{ color: '#e11d48', margin: '0 0 10px 0' }}>সুদ ও কর কর্তন বিধি (National Tax Rates):</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><strong>CPF & Gratuity Fund:</strong> আয়কর আইন অনুযায়ী ১০% উৎসে কর কর্তন প্রযোজ্য (TIN থাকলে)।</li>
                  <li><strong>অন্যান্য ফান্ড (Donation / Reserve):</strong> আয়কর আইন অনুযায়ী ১৫% থেকে ২০% পর্যন্ত উৎসে কর।</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 6. JOURNAL ENTRIES & GENERAL LEDGER */}
        {(activeManualTab === 'journal-entries' || searchQuery) && (
          <div style={{ marginBottom: searchQuery ? '40px' : '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#059669', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={20} />
              <span>6. Journal Entries & General Ledger (জার্নাল ভাউচার এন্ট্রি ও সাধারণ খতিয়ান)</span>
            </h3>

            <div style={{ lineHeight: '1.8', color: 'var(--text-main)', fontSize: '14px' }}>
              <p>
                বিআরইবি নির্দেশিত ইউনিফর্ম চার্ট অব একাউন্টস (Uniform Chart of Accounts - COA) অনুযায়ী মাসিক আনুপাতিক সুদ, উৎসে কর সঞ্চিতি, প্রকৃত নগদায়ন লাভ এবং ব্যাংক জমার স্বয়ংক্রিয় ও ম্যানুয়াল জার্নাল ভাউচার প্রস্তুত ও সাধারণ খতিয়ানে পোস্টিং করার ব্যবস্থা রয়েছে।
              </p>

              {/* SECTION A: AUTOMATED MONTHLY JV */}
              <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderLeft: '4px solid #059669', padding: '18px', borderRadius: '10px', margin: '20px 0' }}>
                <h4 style={{ color: '#059669', margin: '0 0 10px 0', fontSize: '15px' }}>
                  ক) অটোমেটেড মাসিক জার্নাল ভাউচার (Automated Monthly Settlement JV):
                </h4>
                <p style={{ margin: '0 0 12px 0' }}>
                  <strong>Reports & Analytics</strong> → <strong>Journal Voucher</strong> মেনুতে গেলে প্রতি মাসের জন্য স্বয়ংক্রিয় সমন্বিত ভাউচার প্রস্তুত থাকে। এটিতে দুটি প্রধান অংশ থাকে:
                </p>

                <h5 style={{ color: 'var(--text-main)', fontSize: '13.5px', fontWeight: '700', marginBottom: '6px' }}>
                  ১. মাসিক আনুপাতিক সঞ্চিতি হিসাব (Provisional Accrual Entries):
                </h5>
                <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                  <li><strong>হিসাব কোড <code>143.10.000</code> (Accrued Interest Receivable):</strong> ডেবিট (Dr.) — চলতি মাসে কার্যকর সমস্ত FDR এর অর্জিত মোট আনুপাতিক সুদ।</li>
                  <li><strong>হিসাব কোড <code>419.10.000</code> (Interest Income on FDR Investments):</strong> ক্রেডিট (Cr.) — অর্জিত মুনাফার আর্থিক রাজস্ব স্বীকৃতি।</li>
                  <li><strong>হিসাব কোড <code>165.20.000</code> (Advance Income Tax - AIT Paid at Source):</strong> ডেবিট (Dr.) — ১০%/১৫% উৎসে করের প্রদেয় সঞ্চিতি।</li>
                  <li><strong>হিসাব কোড <code>236.10.000</code> (Provision for Income Tax Liabilities):</strong> ক্রেডিট (Cr.) — আয়কর সঞ্চিতির দায়ের সৃষ্টি।</li>
                  <li><strong>হিসাব কোড <code>922</code> (Bank Excise Duty & Charges):</strong> ডেবিট (Dr.) — কর্তনযোগ্য আবগারি শুল্ক।</li>
                  <li><strong>হিসাব কোড <code>131.10.000</code> (Cash at Bank - Settlement Account):</strong> ক্রেডিট (Cr.) — শুল্ক বাবদ ব্যাংক জমার হ্রাস।</li>
                </ul>

                <h5 style={{ color: 'var(--text-main)', fontSize: '13.5px', fontWeight: '700', marginBottom: '6px' }}>
                  ২. প্রকৃত নগদায়ন ও মুনাফা নিষ্পত্তি এন্ট্রি (Actual Realized Settlement Entries):
                </h5>
                <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                  <li><strong>মুনাফাসহ FDR নবায়ন হলে (Rollover with Net Interest):</strong> নিট মুনাফা আসলের সাথে যুক্ত হয়ে ফান্ডের মূলধন বাড়ে। এন্ট্রি: <code>136.10.000</code> FDR Principal Investment Account <strong>ডেবিট (Dr.)</strong>।</li>
                  <li><strong>FDR চূড়ান্ত নগদায়ন হলে (Encashment Settlement):</strong> আসল ও নিট মুনাফা ব্যাংক চলতি হিসাবে জমা হয়। এন্ট্রি: <code>131.10.000</code> Cash at Bank <strong>ডেবিট (Dr.)</strong>; এবং <code>136.10.000</code> FDR Principal <strong>ক্রেডিট (Cr.)</strong>।</li>
                  <li><strong>উৎস কর ও ব্যাংক চার্জ সমন্বয়:</strong> <code>165.20.000</code> (AIT) <strong>Dr.</strong>, <code>922</code> (Charges) <strong>Dr.</strong>, এবং <code>419.10.000</code> (Interest Income) <strong>Cr.</strong>।</li>
                </ul>

                <h5 style={{ color: 'var(--text-main)', fontSize: '13.5px', fontWeight: '700', marginBottom: '6px' }}>
                  ৩. খতিয়ানে পোস্টিং (One-Click Post to General Ledger):
                </h5>
                <p style={{ margin: 0 }}>
                  উপরে ডানপাশে <strong>Post to General Ledger</strong> বাটনে ক্লিক করলে সিস্টেম স্বয়ংক্রিয়ভাবে ভাউচার নম্বর (যেমন: <code>JV/PBS/2026/09</code>) তৈরি করে সাধারণ খতিয়ানে পোস্ট করে। পোস্ট হওয়ার পর স্ট্যাটাস <em>"Posted to General Ledger"</em> প্রদর্শন করে এবং ডুপ্লিকেট রোধে বোতামটি লক থাকে।
                </p>
              </div>

              {/* SECTION B: MANUAL JV ENTRY */}
              <h4 style={{ color: '#0284c7', marginTop: '24px' }}>খ) ম্যানুয়াল জার্নাল ভাউচার এন্ট্রি (Manual JV Entry):</h4>
              <p>
                অফিসিয়াল ব্যাংক সুদ সার্টিফিকেট প্রাপ্তির পর সমন্বয়, প্রারম্ভিক জের সংশোধন বা কাস্টম অ্যাকাউন্টিং লেনদেন পোস্টিং করার জন্য ম্যানুয়াল জার্নাল এন্ট্রি ব্যবহার করুন:
              </p>
              <ol style={{ paddingLeft: '20px' }}>
                <li><strong>Journal Voucher</strong> পেজে <strong>Post New JV (Manual Entry)</strong> ট্যাবে চাপ দিন।</li>
                <li>ভাউচার নম্বর (যেমন: <code>JV-MAN-2026-001</code>), তারিখ ও লেনদেনের সুনির্দিষ্ট বিবরণ (Narration) লিখুন।</li>
                <li><strong>+ Add Entry Row</strong> চাপলে নতুন ডেবিট/ক্রেডিট লাইন যুক্ত হবে।</li>
                <li>চার্ট অব অ্যাকাউন্টস থেকে হিসাব কোড ও নাম সিলেক্ট করুন এবং ডেবিট বা ক্রেডিট টাকার পরিমাণ দিন।</li>
                <li><strong>লাইভ ব্যালেন্স চেক:</strong> স্ক্রিনের নিচে মোট ডেবিট ও মোট ক্রেডিট স্বয়ংক্রিয়ভাবে যোগ হবে। উভয় পাশ সমান হলে সবুজ <em>"Balanced (Debit = Credit)"</em> সংকেত আসবে।</li>
                <li><strong>Save & Post JV</strong> চাপলে ভাউচারটি চূড়ান্তভাবে সাধারণ খতিয়ানে সংরক্ষিত হবে।</li>
              </ol>

              {/* SECTION C: JV REGISTER & BOOK */}
              <h4 style={{ color: '#d97706', marginTop: '24px' }}>গ) জার্নাল ভাউচার বই ও খতিয়ান রেজিস্টার (JV Register & Book):</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Master Chronological Book:</strong> <em>View JV Book</em> ট্যাবে সমস্ত অটোমেটেড ও ম্যানুয়াল ভাউচারের কালানুক্রমিক তালিকা সংরক্ষিত থাকে।</li>
                <li><strong>Voucher Details:</strong> যেকোনো ভাউচারের পাশে <em>View Details</em> চাপলে সংশ্লিষ্ট সমস্ত ডেবিট-ক্রেডিট হিসাব, অ্যাকাউন্ট কোড ও খাতভিত্তিক বিভাজন দৃশ্যমান হয়।</li>
                <li><strong>Safe Reversal / Deletion:</strong> ভুল ভাউচার মুছে ফেললে স্বয়ংক্রিয়ভাবে সাধারণ খতিয়ান ও আর্থিক বিবরণীর পূর্বাবস্থা ফিরিয়ে আনা হয়।</li>
              </ul>
            </div>
          </div>
        )}

        {/* 7. ACCRUAL FINANCIAL STATEMENTS & REPORTS */}
        {(activeManualTab === 'financial-reports' || searchQuery) && (
          <div style={{ marginBottom: searchQuery ? '40px' : '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#7c3aed', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} />
              <span>7. Accrual Financial Statements & Reports (আর্থিক বিবরণী ও ব্যাংক বিশ্লেষণ প্রতিবেদন)</span>
            </h3>

            <div style={{ lineHeight: '1.8', color: 'var(--text-main)', fontSize: '14px' }}>
              <p>
                আন্তর্জাতিক হিসাবমান (BAS/IAS) ও বাংলাদেশ পল্লী বিদ্যুতায়ন বোর্ডের নির্দেশিকা অনুযায়ী সাধারণ খতিয়ানের ডেবিট-ক্রেডিট পোস্টিংয়ের ভিত্তিতে সম্পূর্ণ সমন্বিত আর্থিক বিবরণী স্বয়ংক্রিয়ভাবে তৈরি হয়।
              </p>

              {/* SUBSECTION 1: BALANCE SHEET */}
              <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderLeft: '4px solid #7c3aed', padding: '18px', borderRadius: '10px', margin: '20px 0' }}>
                <h4 style={{ color: '#7c3aed', margin: '0 0 10px 0', fontSize: '15px' }}>
                  ক) আর্থিক অবস্থার বিবরণী / ব্যালেন্স শিট (Statement of Financial Position / Balance Sheet):
                </h4>
                <p style={{ margin: '0 0 8px 0' }}>
                  নির্দিষ্ট তারিখের ফান্ডের সমস্ত সম্পদ, দায় ও তহবিল উদ্বৃত্তের সমন্বিত খতিয়ান:
                </p>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li><strong>Current Assets (চলতি সম্পদ):</strong>
                    <ul style={{ marginTop: '4px' }}>
                      <li><code>131.10.000</code> Cash at Bank (নিষ্পত্তি ব্যাংক জমা হিসাব)</li>
                      <li><code>143.10.000</code> Accrued Interest Receivable (অর্জিত প্রাপ্য মুনাফা)</li>
                      <li><code>165.20.000</code> Advance Income Tax (AIT) Paid at Source (উৎস কর পরিশোধ)</li>
                    </ul>
                  </li>
                  <li style={{ marginTop: '6px' }}><strong>Non-Current Assets / Investments (দীর্ঘমেয়াদী বিনিয়োগ):</strong>
                    <ul style={{ marginTop: '4px' }}>
                      <li><code>129.25.100</code> সর্বজনীন প্রভিডেন্ট ফান্ড (CPF) মেয়াদী বিনিয়োগ</li>
                      <li><code>129.35.000</code> কর্মকর্তা/কর্মচারী গ্রাচ্যুইটি ফান্ড মেয়াদী বিনিয়োগ</li>
                      <li><code>129.60.101</code> পবিস বেনাভোলেন্ট ফান্ড ও বিবিধ বিনিয়োগ</li>
                      <li><code>129.40.000</code> ঠিকাদার ও গ্রাহক নিরাপত্তা জামানত বিনিয়োগ</li>
                    </ul>
                  </li>
                  <li style={{ marginTop: '6px' }}><strong>Current Liabilities (চলতি দায়):</strong>
                    <ul style={{ marginTop: '4px' }}>
                      <li><code>236.10.000</code> Provision for Income Tax Liabilities (আয়কর সঞ্চিতি দায়)</li>
                      <li>ব্যাংক চার্জ ও অন্যান্য প্রদেয় হিসাব</li>
                    </ul>
                  </li>
                  <li style={{ marginTop: '6px' }}><strong>Fund Equity & Reserves (তহবিল উদ্বৃত্ত):</strong> ফান্ডের মূল তহবিল স্থিতি এবং চলতি অর্থ বছরের সঞ্চিত উদ্বৃত্ত (Net Surplus)।</li>
                  <li style={{ marginTop: '6px' }}><strong>Audit Balance Verification:</strong> মোট সম্পদ (Total Assets) = মোট দায় ও তহবিল ইকুইটি (Total Liabilities + Equity) সম্পূর্ণ মিলে যাবে।</li>
                </ul>
              </div>

              {/* SUBSECTION 2: INCOME STATEMENT */}
              <h4 style={{ color: '#0284c7', marginTop: '24px' }}>খ) সমন্বিত আয় বিবরণী (Statement of Comprehensive Income / P&L):</h4>
              <p>
                নির্দিষ্ট অর্থ বছর বা মাসের আর্থিক কার্যক্রম ও অর্জিত নিট মুনাফার প্রতিবেদন:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Financial Revenue (আর্থিক রাজস্ব আয়):</strong> হিসাব কোড <code>419.10.000</code> — সমস্ত ব্যাংক ও আর্থিক প্রতিষ্ঠান থেকে মেয়াদী FDR ও সঞ্চয়পত্র থেকে অর্জিত গ্রস সুদ আয়।</li>
                <li><strong>Financial Expenses (আর্থিক পরিচালন ব্যয়):</strong>
                  <ul style={{ marginTop: '4px' }}>
                    <li>হিসাব কোড <code>922</code> — ব্যাংক আবগারি শুল্ক (Excise Duty) ও অ্যাকাউন্ট সার্ভিস চার্জ।</li>
                    <li>হিসাব কোড <code>236.10.000</code> — সংবিধিবদ্ধ আয়কর সঞ্চিতি ব্যয় (১০% বা ১৫%)।</li>
                  </ul>
                </li>
                <li><strong>Net Operating Surplus (ফান্ডের নিট উদ্বৃত্ত):</strong> মোট অর্জিত আয় থেকে শুল্ক ও কর বাদ দেওয়ার পর প্রকৃত অর্জিত নিট মুনাফা, যা ব্যালেন্স শিটের ফান্ডের সাধারণ স্থিতিতে যোগ হয়।</li>
              </ul>

              {/* SUBSECTION 3: CASH FLOWS */}
              <h4 style={{ color: '#10b981', marginTop: '24px' }}>গ) নগদ প্রবাহ বিবরণী (Statement of Cash Flows — Direct Method):</h4>
              <p>
                ফান্ডের প্রকৃত নগদ প্রাপ্তি ও পরিশোধের নিখুঁত রিকনসিলিয়েশন:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Operating Cash Flows:</strong> ব্যাংক থেকে নগদে গৃহীত নিট মুনাফা (+) বনাম উৎসে কর ও ব্যাংক চার্জ বাবদ কর্তিত অর্থ (-)।</li>
                <li><strong>Investing Cash Flows:</strong> নতুন FDR খোলার কারণে ব্যাংক তহবিল হ্রাস (-) বনাম মেয়াদোত্তীর্ণ FDR চূড়ান্ত নগদায়ন আসল টাকা ব্যাংক হিসাবে জমা (+)।</li>
                <li><strong>Ending Cash Balance:</strong> প্রারম্ভিক ব্যাংক জমার সাথে নিট নগদ প্রবাহ যোগ হয়ে সমাপনী ব্যাংক স্থিতির সাথে শতভাগ মিলে যায়।</li>
              </ul>

              {/* SUBSECTION 4: BANK & FUND MATRIX */}
              <h4 style={{ color: '#d97706', marginTop: '24px' }}>ঘ) ব্যাংক খাত ও ফান্ড ক্লাসিফিকেশন ম্যাট্রিক্স (Bank Sector & Fund Classification Matrix):</h4>
              <p>
                <strong>Bank & Fund Matrix</strong> ট্যাবে সরকারি ব্যাংক (Government Bank) বনাম বেসরকারি ব্যাংক (Private Commercial Bank) এ ফান্ডের আনুপাতিক বিন্যাস এক নজরে নিরীক্ষণ করা যায়:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>সরকারি ও বেসরকারি ব্যাংকের পোর্টফোলিও পার্সেন্টেজ রেশিও কার্ড (যেমন: ১০০% সরকারি ব্যাংক এক্সপোজার)।</li>
                <li>প্রতিটি ব্যাংকের বিপরীতে CPF (<code>129.25.100</code>), Gratuity (<code>129.35.000</code>), Benevolent (<code>129.60.101</code>), Security Deposit (<code>129.40.000</code>) এবং অন্যান্য ফান্ডের ক্রস-টেবুলেশন গ্রিড ছক।</li>
                <li>ব্যাংক ভিত্তিক মোট বিনিয়োগকৃত আসল এবং মোট অর্জিত মুনাফা।</li>
              </ul>
            </div>
          </div>
        )}

        {/* 8. PERIOD CLOSING & FINANCIAL STATEMENTS */}
        {(activeManualTab === 'period-closing' || searchQuery) && (
          <div style={{ marginBottom: searchQuery ? '40px' : '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} />
              <span>8. Monthly Period Closing & Fiscal Year Statements (মাসিক ও অর্থ বছর ক্লোজিং)</span>
            </h3>

            <div style={{ lineHeight: '1.8', color: 'var(--text-main)', fontSize: '14px' }}>
              <h4 style={{ color: '#0284c7' }}>ক) মাসিক পিরিয়ড ক্লোজিং ও ফান্ড মেলবন্ধন (Monthly Closing):</h4>
              <p>
                <strong>Reports & Analytics</strong> → <strong>Monthly Report</strong> এ যান। এখানে নির্দিষ্ট মাসের সচল FDR সংখ্যা, প্রাথমিক মূলধন balance, নতুন জমা, অর্জিত গ্রস প্রফিট ও নিট মুনাফার সমন্বিত রিপোর্ট লেজার খতিয়ান অনুযায়ী অডিট করুন।
              </p>

              <h4 style={{ color: '#10b981', marginTop: '20px' }}>খ) অর্থ বছর ক্লোজিং স্টেটমেন্ট (Fiscal Year July–June Closing Statement):</h4>
              <p>
                <strong>Period Balance & Movement</strong> ট্যাবে গিয়ে প্রেসেট নির্বাচন করুন (যেমন: <code>FY 2025-2026</code>)। জুলাই ১ থেকে জুন ৩০ পর্যন্ত প্রাথমিক স্থিতিসমূহ, সংযোজন (+), নগদায়ন (-), অর্জিত মোট সুদ, প্রদেয় উৎসে কর, আবগারি শুল্ক ও শেষ ব্যালেন্সের অডিটযোগ্য ক্লোজিং স্টেটমেন্ট ডাউনলোড বা প্রিন্ট করুন।
              </p>

              <h4 style={{ color: '#d97706', marginTop: '20px' }}>গ) পয়েন্ট-ইন-টাইম ঐতিহাসিক নির্ভুলতা (Point-in-Time Historical Accuracy):</h4>
              <p>
                আপনি অতীতে যেকোনো নির্দিষ্ট তারিখ (যেমন: ৩০ সেপ্টেম্বর ২০২৫) নির্বাচন করলে ওই সময়ে বিদ্যমান আসল মূলধন, ওই সময়ের সুদের হার, তৎকালীন ইস্যু ও মেয়াদ তারিখ অপরিবর্তিতভাবে দেখতে পাবেন (পরবর্তী নবায়নের তথ্য দ্বারা প্রতিস্থাপিত হবে না)।
              </p>
            </div>
          </div>
        )}

        {/* 9. SIGNATORIES & SYSTEM SETUP */}
        {(activeManualTab === 'settings' || searchQuery) && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} />
              <span>9. Signatories & Administration Setup (স্বাক্ষরকারী, ডিজিটাল স্বাক্ষর, logo ও প্রশাসনিক সেটিং)</span>
            </h3>

            <div style={{ lineHeight: '1.8', color: 'var(--text-main)', fontSize: '14px' }}>
              <ol style={{ paddingLeft: '20px' }}>
                <li><strong>System Settings</strong> এ প্রবেশ করে <strong>Admin Password</strong> দিয়ে আনলক করুন।</li>
                <li><strong>Default Signatories:</strong> Accounts Officer / Accountant, AGM (Finance & Accounts), এবং General Manager-এর নাম, পদবী ও অফিসিয়াল পরিচিতি সেট করুন।</li>
                <li><strong>Digital Signature Upload:</strong> আপনার কম্পিউটার থেকে PNG/JPG স্বাক্ষর ছবি সরাসরি আপলোড করুন। এই স্বাক্ষরগুলো দ্রুত প্রিন্ট লেটার, নোটশীট ও প্রস্তাবনা ডকুমেন্টে স্বয়ংক্রিয়ভাবে দৃশ্যমান হবে।</li>
                <li><strong>Organization Header:</strong> PBS/অফিসের নাম, ঠিকানা, ফোন, ই-মেইল, মেমো রেফারেন্স প্রিফিক্স, লোগো ও সেকেন্ডারি লোগো ফাইল সেট করুন।</li>
                <li><strong>Application Security & Audit:</strong> ডিলিট, ইমপোর্ট, JV পোস্টিং, ফান্ড আপডেট ও সিস্টেম সেটিংয়ের সব পরিবর্তনের অডিট ট্রেইল ব্যবহারকারী, সময় এবং কার্যক্রমসহ লিপিবদ্ধ থাকে।</li>
                <li><strong>Office Configuration:</strong> ব্যাংক তালিকা, কম্পনেট পোর্টফোলিও কনফিগারেশন, অভ্যন্তরীণ আইডি প্রিফিক্স, প্রজ্ঞাপন ও ফান্ড-ভিত্তিক রেজিস্ট্রেশন সেটিংস আপডেট করুন।</li>
              </ol>
            </div>
          </div>
        )}

      </div>

      {/* PRINT-ONLY COMPLETE MULTI-PAGE MANUAL DOCUMENT */}
      <div className="print-only printable-area" style={{ padding: '20px 24px' }}>
        
        {/* OFFICIAL PRINT HEADER */}
        <div className="manual-print-header">
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
            গাজীপুর পল্লী বিদ্যুৎ সমিতি-২
          </h1>
          <p style={{ fontSize: '11px', margin: '0 0 6px 0', color: '#334155' }}>
            রাজেন্দ্রপুর, গাজীপুর | ফোন: ০১৭৬৯-৪০০০২০, ইমেইল: gzpbs2@yahoo.com
          </p>
          <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px 0', margin: '8px 0' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
              ফান্ড ম্যানেজমেন্ট সফটওয়্যার — পরিচালন নীতি ও ব্যবহারকারী নির্দেশিকা
            </h2>
            <p style={{ fontSize: '11px', margin: '2px 0 0 0', fontStyle: 'italic' }}>
              Fund Management System — Operational Manual & Security Guidelines
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginTop: '6px' }}>
            <span>নথি: Official User Manual</span>
            <span>সংস্করণ: v7.2 (অফলাইন সংস্করণ)</span>
            <span>মুদ্রণ তারিখ: {currentDateStr}</span>
          </div>
        </div>

        {/* CHAPTER 1 */}
        <div className="manual-print-chapter">
          <h3>1. Overview & System Security (পদ্ধতি পরিচিতি ও সেশন সুরক্ষা)</h3>
          <p>
            গাজীপুর পল্লী বিদ্যুৎ সমিতি-২ এর <strong>Fund Management Software</strong> হল বিআরইবি/পবিস নির্দেশিকা ও ইনকাম ট্যাক্স অর্ডিন্যান্স অনুযায়ী সর্বজনীন প্রভিডেন্ট ফান্ড (CPF), গ্রাচ্যুইটি ফান্ড, বেনাভোলেন্ট ফান্ড এবং বিবিধ ফান্ডের বিনিয়োগ সংরক্ষণ ও আর্থিক হিসাব মেলবন্ধনের জন্য একটি স্বয়ংসম্পূর্ণ অফলাইন সিস্টেম।
          </p>

          <div className="manual-callout-box">
            <h4 style={{ margin: '0 0 6px 0' }}>System Access & Credentials (প্রবেশাধিকার নিয়মাবলি):</h4>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              <li><strong>Application Login:</strong> ব্যবহারকারী নির্ধারিত অ্যাকাউন্ট পাসওয়ার্ড দিয়ে লগইন করে দৈনিক কাজ সম্পন্ন করবেন।</li>
              <li><strong>System Admin Control:</strong> সিগনেটরি নাম, পদবী, ডিজিটাল স্বাক্ষর, পবিস সেটিং ও ব্যাকআপ নেয়ার জন্য অনুমোদিত নিরাপত্তা কোড দিন।</li>
              <li><strong>Password-Protected Deletion:</strong> অসাবধানতাবশত তথ্য মুছে ফেলা রোধে যেকোনো FDR রেকর্ড বা আর্থিক ডেটা ডিলিট করার সময় এডমিন পাসওয়ার্ড বাধ্যতামূলকভাবে দিতে হবে।</li>
            </ul>
          </div>

          <h4>গোপনীয়তা ও সেশন সুরক্ষা (Security Features):</h4>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>Session Persistence:</strong> ব্রাউজার রিফ্রেশ করলে লগইন সেশন বজায় থাকে, কাজ ব্যাহত হয় না।</li>
            <li><strong>Auto Idle Timeout:</strong> ১০ মিনিট কোনো কার্যক্রম না থাকলে নিরাপত্তার স্বার্থে স্বয়ংক্রিয়ভাবে লক হয়ে যায়।</li>
            <li><strong>Offline SQLite Engine:</strong> কোন ইন্টারনেট সংযোগের প্রয়োজন নেই; ডেটাবেজ <code>Fund_vault_v7.sqlite3</code> স্থানীয় পিসিতে সংরক্ষিত।</li>
            <li><strong>PC Maturity Alarms:</strong> অ্যাপ চালু থাকলে বা পিসি রিস্টার্টের সাথে সাথে আগামী ১-৭ দিনের মধ্যে মেয়াদী ফান্ডের অ্যালার্ম চেইম বেজে উঠবে।</li>
          </ul>
        </div>

        {/* CHAPTER 2 */}
        <div className="manual-print-chapter">
          <h3>2. Investment Register, Edit & Renewal (বিনিয়োগ সংরক্ষণ, সম্পাদন ও নবায়ন)</h3>
          
          <h4>ক) নতুন FDR বা সঞ্চয়পত্র এন্ট্রি পদ্ধতি:</h4>
          <ol style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li>মেনু থেকে <strong>Investments Register</strong> এ প্রবেশ করুন।</li>
            <li>উপরে ডানপাশের <strong>+ New FDR / Certificate</strong> বাটনে চাপ দিন (বা title কন্ট্রোলটিপ দেখুন)।</li>
            <li><strong>Investment Type:</strong> FDR, National Savings Certificate বা প্রসংগভিত্তিক কাস্টম টাইপ নির্বাচন করুন।</li>
            <li><strong>Fund Category:</strong> সংশ্লিষ্ট ফান্ডের হিসাব কোড (যেমন: 129.25.100 - প্রভিডেন্ট ফান্ড) সিলেক্ট করুন।</li>
            <li>ব্যাংকের নাম, শাখা, FDR নম্বর, মূলধন (Principal BDT), সুদের হার (%) এবং খোলার তারিখ প্রদান করুন।</li>
            <li><strong>Save Investment</strong> এ ক্লিক করলে অটোমেটিক মেয়াদপূর্তির তারিখ ও সম্ভাব্য প্রফিট হিসাব হয়ে যাবে।</li>
          </ol>

          <h4>খ) ভুল এন্ট্রি সংশোধন (Clean Record Correction via Edit):</h4>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>Edit FDR:</strong> ভুলবশত ইস্যু তারিখ, খোলার তারিখ, মূলধন, সুদের হার বা হিসাব নম্বর ভুল এন্ট্রি হলে সারির <strong>Edit</strong> বাটনে ক্লিক করে সংশোধন করুন।</li>
            <li><strong>নো-স্পুরিয়াস হিস্ট্রি নিশ্চয়তা:</strong> এডিট বাটনে সংশোধনে কোনো অপ্রয়োজনীয় বা ভুল লেনদেন ইতিহাস সৃষ্টি হয় না; শুধুমাত্র মূল রেকর্ডটি শুদ্ধভাবে আপডেট হয় এবং প্রথম ইস্যু তারিখ (First Issue Date) ও প্রাথমিক এন্ট্রি লগ সমন্বিত থাকে।</li>
          </ul>

          <h4>গ) FDR লেজার ও ব্যাংক স্টেটমেন্ট (Investment Ledger & Bank Statement):</h4>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>FDR নম্বর লেজার লিংক:</strong> টেবিলে যেকোনো <strong>FDR নম্বরে</strong> ক্লিক করলে ওই FDR এর সকল ইতিহাস ও ট্রানজেকশন খতিয়ান পপআপে প্রদর্শিত হয়।</li>
            <li><strong>FDR Bank Statement (নীল বই আইকন):</strong> একশন কলামের নীল বই আইকনে ক্লিক করলে ওই FDR এর খোলার তারিখ থেকে শুরু করে সকল নবায়ন, মূলধন পরিবর্তন ও ডেবিট-ক্রেডিট রানিং ব্যালেন্স সম্বলিত পূর্ণাঙ্গ ব্যাংক স্টেটমেন্ট দেখা ও প্রিন্ট করা যায়।</li>
          </ul>

          <h4>ঘ) FDR নবায়ন (Renew) ও এনক্যাশমেন্ট (Encashment):</h4>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>Renew Investment:</strong> মেয়াদ উত্তীর্ণ FDR এর পাশে <strong>Renew</strong> বাটনে ক্লিক করে নতুন মেয়াদ, সুদের হার ও নতুন FDR নম্বর দিন।</li>
            <li><strong>Encash Investment:</strong> ব্যাংক থেকে আসল ও নিট মুনাফা জমা হওয়ার পর <strong>Encash</strong> চেপে চূড়ান্ত পরিশোধিত টাকা লিপিবদ্ধ করুন।</li>
            <li><strong>পাসওয়ার্ড সুরক্ষা:</strong> <strong>Delete</strong> বাটনে চাপ দিলে এডমিন পাসওয়ার্ড প্রম্পট প্রদর্শিত হবে এবং সঠিক পাসওয়ার্ড দিলেই কেবল রেকর্ড মুছে যাবে।</li>
          </ul>
        </div>

        {/* CHAPTER 3 */}
        <div className="manual-print-chapter">
          <h3>3. Excel Bulk Data Import & Export (এক্সেলে তথ্য আপলোড ও ডাউনলোড)</h3>
          <p>
            হাজার হাজার FDR এবং ব্যাংক ডিরেক্টরির তথ্য সহজে ব্যবস্থাপনা করতে সিস্টেমে এক ক্লিকে Excel Template ডাউনলোড ও Excel Bulk Upload সুবিধা রয়েছে।
          </p>

          <h4>ক) FDR এক্সেল বাল্ক আপলোড নির্দেশিকা:</h4>
          <ol style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li>Investments Register পেজে <strong>Download Excel Template</strong> বাটনে ক্লিক করে pre-formatted <code>FDR_Bulk_Import_Template.xlsx</code> ফাইল ডাউনলোড করুন।</li>
            <li>নির্ধারিত হেডার যেমন <code>FDR No</code>, <code>Account No</code>, <code>Bank Name</code>, <code>Branch Name</code>, <code>Principal Amount</code>, <code>Interest Rate %</code>, <code>Issue Date (YYYY-MM-DD)</code> ইত্যাদি ঠিক রেখে তথ্য পূরণ করুন।</li>
            <li><strong>Upload FDR Excel</strong> বাটনে ক্লিক করে ফাইলটি সিলেক্ট করলে অ্যাপ সেটি পার্স করে ছক আকারে প্রিভিউ দেখাবে।</li>
            <li><strong>Confirm & Import</strong> চাপলে সমস্ত ডেটা ডেটাবেজে transactional বা প্রক্রিয়াগতভাবে সংরক্ষিত হবে। ডুপ্লিকেট FDR অটোমেটিক স্কিপ হবে।</li>
          </ol>

          <h4>খ) ব্যাংক তালিকা এক্সেলে আপলোড:</h4>
          <ol style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li>Bank List পেজ থেকে <code>Bank_List_Import_Template.xlsx</code> ডাউনলোড করুন।</li>
            <li>ব্যাংকের নাম, শাখা, ব্যাংকের খাত (Government/Private), রাউটিং নম্বর, যোগাযোগের নম্বর ও ইমেইল দিয়ে আপলোড শেষ করুন।</li>
          </ol>
        </div>

        {/* CHAPTER 4 */}
        <div className="manual-print-chapter">
          <h3>4. Proposal Memos & Bank Letters (প্রস্তাবনা ও অফিশিয়াল ব্যাংক চিঠি)</h3>
          
          <h4>ক) বোর্ড ও ম্যানেজমেন্ট প্রস্তাবনা নোটশীট:</h4>
          <p>
            মেয়াদোত্তীর্ণ FDR সমূহের পুনঃবিনিয়োগ বা সর্বোচ্চ মুনাফায় ব্যাংক নির্বাচনের জন্য <strong>Investment Proposals</strong> মেনু ব্যবহার করে অফিশিয়াল নোটশীট তৈরি ও প্রিন্ট করুন।
          </p>

          <h4>খ) মেয়াদোত্তীর্ণ তালিকা ও সারিতে পত্রের ধরণ নির্ধারণ (Matured FDRs & Per-Row Letter Types):</h4>
          <p>
            <strong>Matured FDR List</strong> এ মাস ও বছর নির্বাচনের সাথে সাথে সংশ্লিষ্ট মাসে মেয়াদপূর্ণ সমস্ত FDR টেবিল আকারে প্রদর্শিত হয়। টেবিলেই প্রতিটি সারিতে নির্দিষ্ট পত্রের ধরণ নির্ধারণ করা যায়:
          </p>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>Renewal: Compound (মূলধন+মুনাফা পুনঃবিনিয়োগ):</strong> আসল ও অর্জিত নিট মুনাফা যোগ করে একত্রে চক্রবৃদ্ধি নবায়নের অফিশিয়াল চিঠি।</li>
            <li><strong>Renewal: Profit to Bank A/C (আসল নবায়ন, মুনাফা ব্যাংক হিসাবে জমা):</strong> মূলধন সমপরিমাণ নবায়ন এবং অর্জিত মুনাফা সমিতির ব্যাংক চলতি হিসাবে জমার নির্দেশনা।</li>
            <li><strong>Renewal: Profit Pay Order (আসল নবায়ন, মুনাফার পে-অর্ডার ইস্যু):</strong> মূলধন নবায়ন এবং মুনাফার অংশ পে-অর্ডার আকারে সমিতির অনুকূলে প্রেরণের পত্র।</li>
            <li><strong>Renewal: Standard (সাধারণ নবায়ন):</strong> ব্যাংকের সাধারণ শর্তাবলীতে প্রচলিত পুনঃবিনিয়োগ পত্র।</li>
            <li><strong>Encashment (চূড়ান্ত নগদায়ন):</strong> মূলধন ও মুনাফাসহ সম্পূর্ণ অর্থ সমিতির মূল ব্যাংক একাউন্টে ট্রান্সফার করার পত্র।</li>
            <li><strong>Interest & Tax Certificate Request:</strong> অর্থ বছরের ব্যাংক সুদ, উৎস কর (AIT) ও আবগারি শুল্ক প্রত্যয়নপত্রের আবেদন।</li>
          </ul>

          <h4>গ) মাল্টি-টাইপ ব্যাচ প্রিন্ট ও লাইভ লেটার প্রিভিউ:</h4>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li>টেবিলের বিভিন্ন সারিতে প্রয়োজন অনুযায়ী বিভিন্ন পত্রের ধরণ (যেমন: কিছু Renewal, কিছু Encashment) সিলেক্ট করে এক ক্লিকে প্রিন্ট করলে প্রতিটি FDR তার নির্ধারিত নির্দিষ্ট ফরম্যাটের অফিশিয়াল চিঠিসহ প্রিন্ট হবে।</li>
            <li>টেবিলে যেকোনো সারিতে ক্লিক করলে পাশে তাৎক্ষণিক সেই ধরণের চিঠির পূর্ণাঙ্গ লাইভ প্রিভিউ দৃশ্যমান হবে।</li>
          </ul>

          <h4>ঘ) লেটার বডি টেমপ্লেট কাস্টমাইজেশন (Letter Body Templates Customization):</h4>
          <p>
            কমান্ড বার অথবা প্রিভিউ কার্ডের <strong>Letter Body Templates</strong> বাটনে চাপ দিয়ে প্রতিটি পত্র ধরণের মূল বক্তব্য (Paragraphs), সংযুক্তি (Enclosures) ও অনুলিপি (Copy to) স্থায়ীভাবে সংরক্ষণ করা যায়।
          </p>
        </div>

        {/* CHAPTER 5 */}
        <div className="manual-print-chapter">
          <h3>5. Monthly Interest & Tax Provisioning (সুদ ও কর সঞ্চিতি হিসাব)</h3>
          <p>
            মাসিক ভিত্তিতে সমস্ত কার্যকর FDR এর অর্জিত আনুপাতিক গ্রস মুনাফা, ১০%/১৫% উৎসে কর (AIT) এবং আবগারি শুল্ক (Excise Duty) হিসাব করে প্রোভিশন রেজিস্টারে পোস্টিং দেওয়া হয়।
          </p>
          
          <div className="manual-callout-box">
            <h4 style={{ margin: '0 0 6px 0' }}>সুদ ও কর কর্তন বিধি (National Tax Rates):</h4>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              <li><strong>CPF & Gratuity Fund:</strong> আয়কর আইন অনুযায়ী ১০% উৎসে কর কর্তন প্রযোজ্য (TIN থাকলে)।</li>
              <li><strong>অন্যান্য ফান্ড (Donation / Reserve):</strong> আয়কর আইন অনুযায়ী ১৫% থেকে ২০% পর্যন্ত উৎসে কর।</li>
            </ul>
          </div>
        </div>

        {/* CHAPTER 6: JOURNAL ENTRIES & GENERAL LEDGER */}
        <div className="manual-print-chapter">
          <h3>6. Journal Entries & General Ledger (জার্নাল ভাউচার এন্ট্রি ও সাধারণ খতিয়ান)</h3>
          <p>
            বিআরইবি নির্দেশিত ইউনিফর্ম চার্ট অব একাউন্টস (Uniform COA) অনুযায়ী সমস্ত মাসিক আনুপাতিক সুদ, কর সঞ্চিতি, প্রকৃত মুনাফা নিষ্পত্তি ও ব্যাংক জমার সমন্বিত জার্নাল ভাউচার স্বয়ংক্রিয়ভাবে প্রস্তুত ও পোস্টিং হয়।
          </p>

          <h4>ক) অটোমেটেড মাসিক জার্নাল ভাউচার (Automated Monthly Settlement JV):</h4>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>প্রাপ্য সুদ সঞ্চিতি:</strong> হিসাব কোড <code>143.10.000</code> Accrued Interest Receivable <strong>Dr.</strong> এবং <code>419.10.000</code> Interest Income <strong>Cr.</strong>।</li>
            <li><strong>উৎসে কর সঞ্চিতি:</strong> হিসাব কোড <code>165.20.000</code> Advance Income Tax (AIT) <strong>Dr.</strong> এবং <code>236.10.000</code> Provision for Tax Liabilities <strong>Cr.</strong>।</li>
            <li><strong>ব্যাংক চার্জ ও আবগারি শুল্ক:</strong> হিসাব কোড <code>922</code> Bank Charges <strong>Dr.</strong> এবং <code>131.10.000</code> Cash at Bank <strong>Cr.</strong>।</li>
            <li><strong>মুনাফাসহ FDR নবায়ন হলে:</strong> <code>136.10.000</code> FDR Principal Investment <strong>Dr.</strong> (পুনঃবিনিয়োগকৃত নিট মুনাফা)।</li>
            <li><strong>FDR নগদায়ন হলে:</strong> <code>131.10.000</code> Cash at Bank <strong>Dr.</strong> এবং <code>136.10.000</code> FDR Principal <strong>Cr.</strong>।</li>
            <li><strong>পোস্টিং প্রক্রিয়া:</strong> "Post to General Ledger" চাপলে স্বয়ংক্রিয় ভাউচার নম্বরে খতিয়ানে পোস্টিং সম্পন্ন হয়।</li>
          </ul>

          <h4>খ) ম্যানুয়াল জার্নাল ভাউচার (Manual JV Entry):</h4>
          <p>
            বিশেষ সমন্বয় বা ব্যাংক প্রত্যয়নপত্র সমন্বয়ের জন্য ভাউচার নম্বর, তারিখ, বিবরণী ও চার্ট অব একাউন্টস থেকে ডেবিট-ক্রেডিট হিসাব লাইন যুক্ত করে সমতা নিশ্চিতপূর্বক পোস্ট করার সুবিধা।
          </p>
        </div>

        {/* CHAPTER 7: ACCRUAL FINANCIAL STATEMENTS */}
        <div className="manual-print-chapter">
          <h3>7. Accrual Financial Statements & Reports (আর্থিক বিবরণী ও ব্যাংক বিশ্লেষণ প্রতিবেদন)</h3>
          <p>
            আন্তর্জাতিক হিসাবমান (BAS/IAS) ও বিআরইবি নীতি অনুযায়ী সাধারণ খতিয়ান থেকে সমন্বিত আর্থিক বিবরণী প্রস্তুত হয়:
          </p>

          <h4>ক) আর্থিক অবস্থার বিবরণী (Statement of Financial Position / Balance Sheet):</h4>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>চলতি সম্পদ (Current Assets):</strong> ব্যাংক জমা হিসাব (131.10.000), প্রাপ্য অর্জিত মুনাফা (143.10.000), উৎসে কর পরিশোধ (165.20.000)।</li>
            <li><strong>বিনিয়োগ সম্পদ (Investments):</strong> সর্বজনীন প্রভিডেন্ট ফান্ড (129.25.100), গ্রাচ্যুইটি ফান্ড (129.35.000), বেনাভোলেন্ট ফান্ড (129.60.101), নিরাপত্তা জামানত (129.40.000)।</li>
            <li><strong>চলতি দায় ও তহবিল ইকুইটি:</strong> কর দায় সঞ্চিতি (236.10.000), ব্যাংক চার্জ প্রদেয় এবং ফান্ডের প্রারম্ভিক জের ও চলতি বছরের নিট উদ্বৃত্ত (Net Surplus)।</li>
            <li><strong>সমতা যাচাই:</strong> মোট সম্পদ = মোট দায় ও তহবিল ইকুইটি।</li>
          </ul>

          <h4>খ) আয় বিবরণী ও নগদ প্রবাহ (Income Statement & Cash Flows):</h4>
          <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>Income Statement:</strong> FDR অর্জিত গ্রস সুদ আয় (419.10.000) বিয়োগ আবগারি শুল্ক (922) ও আয়কর সঞ্চিতি ব্যয় (236.10.000) = ফান্ডের নিট পরিচালন উদ্বৃত্ত।</li>
            <li><strong>Cash Flow Statement:</strong> পরিচালন নগদ প্রবাহ (প্রকৃত মুনাফা আদায় ও কর পরিশোধ) এবং বিনিয়োগ নগদ প্রবাহ (নতুন মেয়াদী জমা ও নগদায়ন আদায়)।</li>
            <li><strong>Bank & Fund Matrix:</strong> সরকারি বনাম বেসরকারি বাণিজ্যিক ব্যাংকে ফান্ডভিত্তিক পোর্টফোলিও পার্সেন্টেজ ও ক্রস-টেবুলেশন ছক।</li>
          </ul>
        </div>

        {/* CHAPTER 8: PERIOD CLOSING */}
        <div className="manual-print-chapter">
          <h3>8. Monthly Period Closing & Fiscal Year Statements (মাসিক ও অর্থ বছর ক্লোজিং)</h3>
          <p>
            প্রতি মাসের সমন্বিত রিপোর্ট এবং ১ জুলাই থেকে ৩০ জুন অর্থ বছরের ক্লোজিং স্টেটমেন্ট (Opening Balance, Additions, Encashed, Gross Interest, AIT, Net Balance) অডিটযোগ্য ফরম্যাটে তৈরি হয়।
          </p>
        </div>

        {/* CHAPTER 9: SIGNATORIES */}
        <div className="manual-print-chapter">
          <h3>9. Signatories & Administration Setup (স্বাক্ষরকারী, ডিজিটাল স্বাক্ষর, logo ও প্রশাসনিক সেটিং)</h3>
          <ol style={{ paddingLeft: '18px', margin: '6px 0' }}>
            <li><strong>System Settings</strong> এ প্রবেশ করে <strong>Admin Password</strong> দিয়ে আনলক করুন।</li>
            <li>প্রস্তুতকারী (Accounts Officer / Accountant), সুপারিশকারী (AGM Finance), এবং অনুমোদনকারী (General Manager)-এর নাম, পদবী ও অফিসিয়াল পরিচিতি সেট করুন।</li>
            <li>ডিজিটাল PNG/JPG স্বাক্ষর আপলোড করলে প্রিন্ট লেটার, নোটশীট, প্রস্তাবনা ও রিপোর্টে স্বয়ংক্রিয়ভাবে স্বাক্ষর অংশে প্রদর্শিত হবে।</li>
            <li>অফিস/পবিসের নাম, ঠিকানা, ফোন, ই-মেইল, লোগো, সেকেন্ডারি লোগো, মেমো রেফারেন্স প্রিফিক্স এবং ফান্ড/ব্যাংক কনফিগারেশন সঠিকভাবে ঠিক করুন।</li>
            <li>সিস্টেমের সমস্ত এন্ট্রি, আপডেট, ডিলিট, ইমপোর্ট, JV পোস্টিং ও সেটিংস পরিবর্তনের সম্পূর্ণ অডিট ট্রেইল সংগ্রহ করে রাখা হয়।</li>
          </ol>
        </div>

        {/* DOCUMENT FOOTER IN PRINT */}
        <div style={{ borderTop: '1px solid #000', paddingTop: '8px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#475569' }}>
          <span>আরিফুল ইসলাম,এজিএম অর্থ- ফান্ড ম্যানেজমেন্ট সফটওয়্যার — সর্বস্বত্ব সংরক্ষিত</span>
          <span> Official Manual v7.2</span>
        </div>

      </div>
    </div>
  );
}
