const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'Fund_vault_v7.sqlite3');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Existing tables:', tables.map(t => t.name));

if (tables.some(t => t.name === 'investments')) db.exec('DELETE FROM investments;');
if (tables.some(t => t.name === 'investment_proposals')) db.exec('DELETE FROM investment_proposals;');
if (tables.some(t => t.name === 'bank_letters')) db.exec('DELETE FROM bank_letters;');
if (tables.some(t => t.name === 'interest_provisions')) db.exec('DELETE FROM interest_provisions;');

console.log('Successfully cleared dummy investment records.');
console.log('Investments count:', db.prepare('SELECT COUNT(*) as count FROM investments').get().count);
