const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'Fund_vault_v7.sqlite3');
const oldDbPath = path.join(dataDir, 'investments.db');

// If legacy investments.db exists and new Fund_vault_v7.sqlite3 does not, migrate it
if (fs.existsSync(oldDbPath) && !fs.existsSync(dbPath)) {
  try {
    fs.copyFileSync(oldDbPath, dbPath);
    console.log('Migrated data from investments.db to Fund_vault_v7.sqlite3');
  } catch (err) {
    console.error('Error copying old database:', err);
  }
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- Banks Table
    CREATE TABLE IF NOT EXISTS banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      routing_no TEXT,
      address TEXT,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Investments Table (FDR & Savings Certificates)
    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investment_type TEXT NOT NULL, -- 'FDR' or 'Savings Certificate'
      fdr_no TEXT NOT NULL,          -- FDR Receipt No or Certificate No
      account_no TEXT,
      bank_id INTEGER NOT NULL,
      branch_name TEXT,
      principal_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,   -- Annual Rate %
      issue_date TEXT NOT NULL,      -- YYYY-MM-DD
      tenure_months INTEGER NOT NULL,
      maturity_date TEXT NOT NULL,   -- YYYY-MM-DD
      compounding_frequency TEXT DEFAULT 'At Maturity', -- Monthly, Quarterly, Half-Yearly, Yearly, At Maturity
      tin_provided INTEGER DEFAULT 1, -- 1 for Yes (10%), 0 for No (15%)
      status TEXT DEFAULT 'Active',  -- Active, Matured, Renewed, Encashed
      sanction_ref TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
    );

    -- Interest Provisions Table
    CREATE TABLE IF NOT EXISTS interest_provisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investment_id INTEGER NOT NULL,
      provision_date TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      gross_interest REAL NOT NULL,
      tax_rate REAL NOT NULL,
      tax_amount REAL NOT NULL,
      excise_duty REAL NOT NULL,
      net_interest REAL NOT NULL,
      status TEXT DEFAULT 'Provisioned', -- Provisioned, Realized, Adjusted
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
    );

    -- Investment Proposals Table
    CREATE TABLE IF NOT EXISTS investment_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_type TEXT NOT NULL, -- 'New' or 'Renewal'
      proposal_no TEXT UNIQUE NOT NULL,
      investment_id INTEGER,       -- NULL for New, ID for Renewal
      target_bank_id INTEGER NOT NULL,
      proposal_amount REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      proposed_rate REAL NOT NULL,
      rate_comparison_json TEXT,  -- JSON string comparing bank offers
      justification TEXT,
      status TEXT DEFAULT 'Pending Approval', -- Draft, Pending Approval, Approved, Rejected
      prepared_by TEXT DEFAULT 'Accounts Officer',
      approved_by TEXT,
      approval_date TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (target_bank_id) REFERENCES banks(id) ON DELETE SET NULL,
      FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE SET NULL
    );

    -- Bank Letters Table
    CREATE TABLE IF NOT EXISTS bank_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      letter_type TEXT NOT NULL, -- 'Opening/Purchase', 'Renewal', 'Encashment', 'Tax Certificate Request'
      ref_no TEXT UNIQUE NOT NULL,
      letter_date TEXT NOT NULL,
      bank_id INTEGER NOT NULL,
      investment_id INTEGER,
      proposal_id INTEGER,
      recipient_designation TEXT DEFAULT 'The Manager',
      subject TEXT NOT NULL,
      body_content TEXT NOT NULL,
      special_instructions TEXT,
      status TEXT DEFAULT 'Issued', -- Draft, Issued, Acknowledged
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
      FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE SET NULL,
      FOREIGN KEY (proposal_id) REFERENCES investment_proposals(id) ON DELETE SET NULL
    );

    -- Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT NOT NULL,
      performed_by TEXT DEFAULT 'System User',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Fund Categories & Account Codes Table
    CREATE TABLE IF NOT EXISTS fund_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      acc_code TEXT UNIQUE NOT NULL,
      fund_name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Financial History Table (Tracking Principal, Interest, Tax, Excise Duty over time)
    CREATE TABLE IF NOT EXISTS investment_financial_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investment_id INTEGER NOT NULL,
      fdr_no TEXT NOT NULL,
      event_type TEXT NOT NULL, -- 'Creation', 'Provision', 'Renewal', 'Encashment', 'Update'
      event_date TEXT NOT NULL,
      principal_amount REAL NOT NULL DEFAULT 0,
      gross_interest REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      excise_duty REAL DEFAULT 0,
      net_interest REAL DEFAULT 0,
      total_balance REAL DEFAULT 0,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
    );

    -- System Settings Table (Signatories, PBS Logo, Address, Password)
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- General Accounts Chart of Accounts (COA) Table
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_code TEXT UNIQUE NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL, -- 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
      sub_category TEXT,
      fund_name TEXT,
      is_system INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Journal Vouchers Table (General Ledger Voucher Book)
    CREATE TABLE IF NOT EXISTS journal_vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_no TEXT UNIQUE NOT NULL,
      voucher_date TEXT NOT NULL,
      voucher_type TEXT NOT NULL, -- 'Auto JV - Actual Realized', 'Auto JV - Provisional Accrual', 'Manual JV', 'Opening Balance', 'Adjustment'
      period_month INTEGER,
      period_year INTEGER,
      narration TEXT NOT NULL,
      total_debit REAL NOT NULL,
      total_credit REAL NOT NULL,
      status TEXT DEFAULT 'Posted', -- 'Posted', 'Draft', 'Void'
      posted_by TEXT DEFAULT 'AGM (Finance)',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Journal Voucher Line Items Table
    CREATE TABLE IF NOT EXISTS journal_voucher_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL,
      account_code TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      fund_name TEXT,
      description TEXT,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      FOREIGN KEY (voucher_id) REFERENCES journal_vouchers(id) ON DELETE CASCADE
    );
  `);

  // Migrate investments table if missing acc_code / fund_name
  try {
    const tableInfo = db.prepare("PRAGMA table_info(investments)").all();
    const hasAccCode = tableInfo.some(col => col.name === 'acc_code');
    if (!hasAccCode) {
      db.exec("ALTER TABLE investments ADD COLUMN acc_code TEXT");
      db.exec("ALTER TABLE investments ADD COLUMN fund_name TEXT");
    }

    // Add actual settlement columns if missing
    const hasActualTax = tableInfo.some(col => col.name === 'actual_tax');
    if (!hasActualTax) {
      db.exec("ALTER TABLE investments ADD COLUMN actual_gross_interest REAL DEFAULT 0");
      db.exec("ALTER TABLE investments ADD COLUMN actual_tax REAL DEFAULT 0");
      db.exec("ALTER TABLE investments ADD COLUMN actual_excise_duty REAL DEFAULT 0");
      db.exec("ALTER TABLE investments ADD COLUMN actual_net_interest REAL DEFAULT 0");
      db.exec("ALTER TABLE investments ADD COLUMN encash_received REAL DEFAULT 0");
      db.exec("ALTER TABLE investments ADD COLUMN encash_date TEXT");
    }

    const hasActualBankCharge = tableInfo.some(col => col.name === 'actual_bank_charge');
    if (!hasActualBankCharge) {
      db.exec("ALTER TABLE investments ADD COLUMN actual_bank_charge REAL DEFAULT 0");
    }

    const hasFirstIssueDate = tableInfo.some(col => col.name === 'first_issue_date');
    if (!hasFirstIssueDate) {
      db.exec("ALTER TABLE investments ADD COLUMN first_issue_date TEXT");
      db.exec("UPDATE investments SET first_issue_date = issue_date");
    }

    // Auto-update null status or null acc_code for existing records
    db.prepare("UPDATE investments SET status = 'Active' WHERE status IS NULL OR status = ''").run();
    db.prepare("UPDATE investments SET acc_code = '129.25.100', fund_name = 'প্রভিডেন্ট' WHERE (acc_code IS NULL OR acc_code = '') AND id = 1").run();
    db.prepare("UPDATE investments SET acc_code = '129.35.000', fund_name = 'গ্রাচ্যুইটি' WHERE (acc_code IS NULL OR acc_code = '') AND id = 2").run();
    db.prepare("UPDATE investments SET acc_code = '129.60.101', fund_name = 'বেনাভোলেন্ট' WHERE (acc_code IS NULL OR acc_code = '') AND id = 3").run();
    db.prepare("UPDATE investments SET acc_code = '129.40.000', fund_name = 'কর্মচারী নিরাপত্তা' WHERE (acc_code IS NULL OR acc_code = '') AND id = 4").run();
    db.prepare("UPDATE investments SET acc_code = '126.10.000', fund_name = 'রিপ্লেসমেন্ট রিজার্ভ' WHERE (acc_code IS NULL OR acc_code = '') AND id = 5").run();
    db.prepare("UPDATE investments SET acc_code = '136', fund_name = 'অস্থায়ী ফান্ড' WHERE (acc_code IS NULL OR acc_code = '') AND id >= 6").run();
  } catch (err) {
    console.error('Migration error:', err);
  }

  // Migrate financial history table if missing bank_charge
  try {
    const fhInfo = db.prepare("PRAGMA table_info(investment_financial_history)").all();
    const hasBankCharge = fhInfo.some(col => col.name === 'bank_charge');
    if (!hasBankCharge) {
      db.exec("ALTER TABLE investment_financial_history ADD COLUMN bank_charge REAL DEFAULT 0");
    }
  } catch (err) {
    console.error('Financial history migration error:', err);
  }

  // Migrate interest provisions table if missing bank_charge
  try {
    const provInfo = db.prepare("PRAGMA table_info(interest_provisions)").all();
    const hasBankChargeProv = provInfo.some(col => col.name === 'bank_charge');
    if (!hasBankChargeProv) {
      db.exec("ALTER TABLE interest_provisions ADD COLUMN bank_charge REAL DEFAULT 0");
    }
  } catch (err) {
    console.error('Provisions migration error:', err);
  }

  // Migrate banks table if missing bank_type
  try {
    const bankInfo = db.prepare("PRAGMA table_info(banks)").all();
    const hasBankType = bankInfo.some(col => col.name === 'bank_type');
    if (!hasBankType) {
      db.exec("ALTER TABLE banks ADD COLUMN bank_type TEXT DEFAULT 'Government Bank'");
    }
  } catch (err) {
    console.error('Bank migration error:', err);
  }

  // Migrate / Populate initial financial history for existing investments if missing
  try {
    const historyCount = db.prepare("SELECT COUNT(*) as count FROM investment_financial_history").get().count;
    if (historyCount === 0) {
      const allInvs = db.prepare("SELECT * FROM investments").all();
      const insertHistory = db.prepare(`
        INSERT INTO investment_financial_history (
          investment_id, fdr_no, event_type, event_date, principal_amount,
          gross_interest, tax_rate, tax_amount, excise_duty, net_interest,
          total_balance, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      allInvs.forEach(inv => {
        // Initial creation record
        insertHistory.run(
          inv.id,
          inv.fdr_no,
          'Creation',
          inv.issue_date,
          inv.principal_amount,
          0,
          inv.tin_provided ? 10 : 15,
          0,
          0,
          0,
          inv.principal_amount,
          `Investment opened (${inv.investment_type} @ ${inv.interest_rate}%)`
        );

        // Populate posted interest provisions if any exist
        const invProvisions = db.prepare("SELECT * FROM interest_provisions WHERE investment_id = ?").all(inv.id);
        invProvisions.forEach(p => {
          insertHistory.run(
            inv.id,
            inv.fdr_no,
            'Provision',
            p.provision_date,
            inv.principal_amount,
            p.gross_interest,
            p.tax_rate,
            p.tax_amount,
            p.excise_duty,
            p.net_interest,
            inv.principal_amount + p.net_interest,
            `Interest provision for period ${p.period_start} to ${p.period_end}`
          );
        });
      });
    }
  } catch (err) {
    console.error('Financial history migration error:', err);
  }

  seedInitialData();
}

function seedInitialData() {
  const bankCount = db.prepare('SELECT COUNT(*) as count FROM banks').get().count;
  if (bankCount === 0) {
    const insertBank = db.prepare(`
      INSERT INTO banks (name, branch_name, routing_no, address, contact_person, phone, email, bank_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const banks = [
      ['Sonali Bank PLC', 'Principal Branch, Dhaka', '200270001', 'Motijheel C/A, Dhaka-1000', 'Md. Rafiqul Islam (Manager)', '01711-000001', 'principal@sonalibank.com.bd', 'Government Bank'],
      ['Agrani Bank PLC', 'Dhaka Corporate Branch', '010270002', 'Dilkusha C/A, Dhaka-1000', 'Sultana Razia (AVP)', '01819-000002', 'corporate@agranibank.org.bd', 'Government Bank'],
      ['Janata Bank PLC', 'Local Office Branch', '110270003', 'Motijheel C/A, Dhaka', 'Anwar Hossain (VP)', '01912-000003', 'localoffice@janatabank.org.bd', 'Government Bank'],
      ['Pubali Bank PLC', 'Gulshan Branch', '170270004', 'Gulshan-2, Dhaka', 'Farhana Chowdhury (SVP)', '01715-000004', 'gulshan@pubalibankbd.com', 'Private Bank'],
      ['National Savings Directorate', 'Dhaka Bureau', '000000000', 'Press Club, Dhaka', 'Assistant Director', '02-9550000', 'info@nsd.gov.bd', 'Government Bank']
    ];

    banks.forEach(b => insertBank.run(...b));

    // Seed Audit Log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, details, performed_by)
      VALUES ('SEED', 'database', 0, 'Database initialized with bank directory', 'System Admin')
    `).run();
  }

  const { hashPassword, isHashed } = require('./auth');

  // Seed default settings if not exists and ensure passwords are hashed
  const upsertSetting = db.prepare(`
    INSERT INTO system_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const userIdRow = db.prepare("SELECT value FROM system_settings WHERE key = 'system_userid'").get();
  if (!userIdRow) {
    upsertSetting.run('system_userid', 'arif');
  }

  const loginPwdRow = db.prepare("SELECT value FROM system_settings WHERE key = 'system_login_password'").get();
  if (!loginPwdRow) {
    upsertSetting.run('system_login_password', hashPassword('a123456'));
  } else if (!isHashed(loginPwdRow.value)) {
    upsertSetting.run('system_login_password', hashPassword(loginPwdRow.value));
  }

  const adminPwdRow = db.prepare("SELECT value FROM system_settings WHERE key = 'system_password'").get();
  if (!adminPwdRow) {
    upsertSetting.run('system_password', hashPassword('adminarif'));
  } else if (!isHashed(adminPwdRow.value)) {
    upsertSetting.run('system_password', hashPassword(adminPwdRow.value));
  }

  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get().count;
  if (settingsCount <= 3) {
    upsertSetting.run('org_name', 'Gazipur Palli Bidyut Samity-2');
    upsertSetting.run('org_address', 'Head Office,Rajendrapur, Gazipur');
    upsertSetting.run('org_phone', '01769402677');
    upsertSetting.run('org_email', 'gazipbs2@gmail.com');
    upsertSetting.run('org_logo_url', '');
    upsertSetting.run('signatory_accountant', 'Accountant');
    upsertSetting.run('signatory_agm_finance', 'AGM (Finance)');
    upsertSetting.run('signatory_gm', 'General Manager');
  }

  // Seed default PBS Fund Categories & Account Codes
  const fundCount = db.prepare('SELECT COUNT(*) as count FROM fund_categories').get().count;
  if (fundCount === 0) {
    const insertFund = db.prepare('INSERT INTO fund_categories (acc_code, fund_name, description) VALUES (?, ?, ?)');
    const defaultFunds = [
      ['129.60.101', 'বেনাভোলেন্ট', 'Benevolent Fund'],
      ['129.40.000', 'কর্মচারী নিরাপত্তা', 'Employee Security Fund'],
      ['129.35.000', 'গ্রাচ্যুইটি', 'Gratuity Fund'],
      ['129.15.000', 'মেম্বারশিপ ফান্ড', 'Membership Fund'],
      ['121.20.000', 'ডোনেশন রিজার্ভ ফান্ড', 'Donation Reserve Fund'],
      ['129.25.100', 'প্রভিডেন্ট', 'Provident Fund'],
      ['126.10.000', 'রিপ্লেসমেন্ট রিজার্ভ ফান্ড', 'Replacement Reserve Fund'],
      ['129.55.000', 'ওয়ার্কম্যান কম্পেনসেশন ফান্ড', 'Workman Compensation Fund'],
      ['129.90.100', 'মিটাররেন্ট ফান্ড', 'Meter Rent Fund'],
      ['136', 'অস্থায়ী ফান্ড', 'Temporary / General Fund']
    ];
    defaultFunds.forEach(f => insertFund.run(...f));
  }

  // Seed default PBS Chart of Accounts (COA)
  try {
    const coaCount = db.prepare('SELECT COUNT(*) as count FROM chart_of_accounts').get().count;
    if (coaCount === 0) {
      const insertCoa = db.prepare(`
        INSERT INTO chart_of_accounts (account_code, account_name, account_type, sub_category, fund_name, is_system, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const defaultCoa = [
        // ── ASSETS (100–199) ──
        ['131.10.000', 'Cash at Bank - Settlement Account', 'Asset', 'Current Asset', 'General', 1, 'Main bank current/STD settlement account for FDR deposits and proceeds'],
        ['136.10.000', 'General FDR Principal Investment Account', 'Asset', 'Investment', 'অস্থায়ী ফান্ড', 1, 'General & temporary short-term FDR principal investment portfolio'],
        ['121.20.000', 'Donation Reserve Fund Investment Account', 'Asset', 'Investment', 'ডোনেশন রিজার্ভ', 1, 'Donation Reserve Fund FDR Investments'],
        ['126.10.000', 'Replacement Reserve Fund Investment Account', 'Asset', 'Investment', 'রিপ্লেসমেন্ট রিজার্ভ ফান্ড', 1, 'Replacement Reserve Fund FDR Investments'],
        ['129.15.000', 'Membership Fund Investment Account', 'Asset', 'Investment', 'মেম্বারশিপ ফান্ড', 1, 'Membership Fund FDR Investments'],
        ['129.25.100', 'Employees Contributory Provident Fund (CPF) Investment', 'Asset', 'Investment', 'প্রভিডেন্ট', 1, 'Employees Provident Fund FDR Investments'],
        ['129.35.000', 'Gratuity Fund Investment Account', 'Asset', 'Investment', 'গ্রাচ্যুইটি', 1, 'Employees Gratuity Fund FDR Investments'],
        ['129.40.000', 'Employee Security Fund Investment Account', 'Asset', 'Investment', 'কর্মচারী নিরাপত্তা', 1, 'Employee Security Fund FDR Investments'],
        ['129.55.000', 'Workman Compensation Fund Investment Account', 'Asset', 'Investment', 'ওয়ার্কম্যান কম্পেনসেশন ফান্ড', 1, 'Workman Compensation Fund FDR Investments'],
        ['129.60.101', 'Benevolent Fund Investment Account', 'Asset', 'Investment', 'বেনাভোলেন্ট', 1, 'Benevolent Fund FDR Investments'],
        ['129.90.100', 'Meter Rent Fund Investment Account', 'Asset', 'Investment', 'মিটাররেন্ট ফান্ড', 1, 'Meter Rent Fund FDR Investments'],
        ['143.10.000', 'Accrued Interest Receivable (FDR Investments)', 'Asset', 'Accrual Asset', 'General', 1, 'Accrued gross interest earned but not yet matured/received'],
        ['165.20.000', 'Advance Income Tax (AIT) Paid at Source', 'Asset', 'Statutory Tax Asset', 'General', 1, 'Advance Income Tax deducted at source by banks on FDR profit settlements'],

        // ── LIABILITIES (200–299) ──
        ['236.10.000', 'Provision for Income Tax Liabilities', 'Liability', 'Current Liability', 'General', 1, 'Provision accrued for statutory Advance Income Tax (AIT) liabilities'],
        ['236.20.000', 'Accrued Bank Charges & Excise Duty Payable', 'Liability', 'Current Liability', 'General', 1, 'Accrued liability for government excise duty and bank fees'],

        // ── EQUITY / FUND CAPITAL & RESERVES (200–299) ──
        ['215.10.000', 'Retained Margins / Net Accumulated Surplus', 'Equity', 'Fund Reserve', 'General', 1, 'Net surplus margin accumulated from financial investments and operations'],
        ['253.10.000', 'Accumulated Fund Capital & Reserves', 'Equity', 'Fund Capital', 'General', 1, 'Capital and accumulated equity allocated to PBS statutory funds'],

        // ── REVENUES / FINANCIAL INCOME (400–499) ──
        ['419.10.000', 'Interest Income on FDR Investments (Realized Revenue)', 'Revenue', 'Operating Revenue', 'General', 1, 'Gross interest revenue realized upon maturity, renewal, or encashment of FDRs'],
        ['419.20.000', 'Accrued Interest Income on Investments', 'Revenue', 'Operating Revenue', 'General', 1, 'Provisional monthly gross interest profit revenue recognized'],

        // ── EXPENSES / STATUTORY DEDUCTIONS (900–999 / 400–499) ──
        ['922', 'Bank Excise Duty & Service Charges', 'Expense', 'Financial Expense', 'General', 1, 'Statutory excise duty and bank processing fees charged on FDRs'],
        ['936.00.000', 'Income Tax / AIT Expense', 'Expense', 'Statutory Expense', 'General', 1, 'Income tax expense recognized against investment profits']
      ];

      defaultCoa.forEach(c => insertCoa.run(...c));
      console.log(`[Database Seed] Successfully initialized ${defaultCoa.length} PBS Chart of Accounts.`);
    }

    // Migration: Update 926 to 922 and 426.20.000 to 936.00.000 if present
    try {
      db.prepare("UPDATE chart_of_accounts SET account_code = '922' WHERE account_code = '926'").run();
      db.prepare("UPDATE journal_voucher_items SET account_code = '922' WHERE account_code = '926'").run();
      db.prepare("UPDATE chart_of_accounts SET account_code = '936.00.000' WHERE account_code = '426.20.000'").run();
      db.prepare("UPDATE journal_voucher_items SET account_code = '936.00.000' WHERE account_code = '426.20.000'").run();
    } catch (migErr) {
      // Ignored if already updated
    }
  } catch (err) {
    console.error('COA seeding error:', err.message);
  }

  // Auto-sync & clean up orphaned provision entries in investment_financial_history
  try {
    const activeProvisions = db.prepare('SELECT * FROM interest_provisions').all();
    const historyProvisions = db.prepare("SELECT * FROM investment_financial_history WHERE event_type LIKE '%Provision%'").all();
    const matchedHistoryIds = new Set();

    for (const prov of activeProvisions) {
      const match = historyProvisions.find(h =>
        !matchedHistoryIds.has(h.id) &&
        h.investment_id === prov.investment_id &&
        Math.abs((h.gross_interest || 0) - (prov.gross_interest || 0)) < 1 &&
        Math.abs((h.net_interest || 0) - (prov.net_interest || 0)) < 1
      );
      if (match) {
        matchedHistoryIds.add(match.id);
      }
    }

    const orphanedIds = historyProvisions.map(h => h.id).filter(id => !matchedHistoryIds.has(id));
    if (orphanedIds.length > 0) {
      db.prepare(`DELETE FROM investment_financial_history WHERE id IN (${orphanedIds.join(',')})`).run();
      console.log(`[Database Sync] Cleaned up ${orphanedIds.length} orphaned provision entries in financial history.`);
    }
  } catch (err) {
    console.error('Provision financial history sync error:', err.message);
  }

  // Cleanup any legacy 'Update' events in financial history so edits never make unwanted history
  try {
    db.prepare("DELETE FROM investment_financial_history WHERE event_type = 'Update'").run();

    // Fix any investments where first_issue_date > issue_date (which was caused by editing mistyped issue dates)
    db.prepare("UPDATE investments SET first_issue_date = issue_date WHERE first_issue_date IS NOT NULL AND issue_date IS NOT NULL AND first_issue_date > issue_date").run();

    // Sync creation events in financial history with investment issue_date for un-renewed investments
    db.exec(`
      UPDATE investment_financial_history
      SET event_date = (SELECT issue_date FROM investments WHERE investments.id = investment_financial_history.investment_id),
          principal_amount = (SELECT principal_amount FROM investments WHERE investments.id = investment_financial_history.investment_id),
          fdr_no = (SELECT fdr_no FROM investments WHERE investments.id = investment_financial_history.investment_id)
      WHERE event_type = 'Creation'
        AND investment_id IN (
          SELECT id FROM investments 
          WHERE id NOT IN (SELECT DISTINCT investment_id FROM investment_financial_history WHERE event_type IN ('In-Place Rollover', 'Renewal (New Created)'))
            AND (remarks IS NULL OR remarks NOT LIKE '%Renewed from previous FDR%')
        );
    `);
  } catch (syncErr) {
    console.error('Investment financial history sync error:', syncErr.message);
  }
}

initDatabase();

module.exports = db;
