const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const tempPayloadDir = path.join(root, 'temp_payload');
const payloadZip = path.join(root, 'payload.zip');
const outputExe = path.join(root, 'Fund Management.exe');
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';

console.log('==================================================================================');
console.log('===       GAZIPUR PALLI BIDYUT SAMITY-2 | FUND MANAGEMENT SYSTEM              ===');
console.log('===          Building 100% Standalone Single-File Executable (.exe)            ===');
console.log('==================================================================================\n');

// 1. Build Vite frontend
console.log('[1/7] Compiling Vite production client bundle...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Clean and create temp payload folder
console.log('[2/7] Preparing payload staging directory...');
if (fs.existsSync(tempPayloadDir)) {
  fs.rmSync(tempPayloadDir, { recursive: true, force: true });
}
fs.mkdirSync(tempPayloadDir, { recursive: true });

function copyRecursiveSync(src, dest, excludeNames = []) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      if (excludeNames.includes(item)) continue;
      copyRecursiveSync(path.join(src, item), path.join(dest, item), excludeNames);
    }
  } else {
    try {
      fs.copyFileSync(src, dest);
    } catch (e) {
      // If locked, continue
    }
  }
}

// 3. Copy Node.exe runtime
console.log('[3/7] Staging Node.exe runtime...');
let nodeSource = path.join(root, 'Portable_App', 'node.exe');
if (!fs.existsSync(nodeSource)) {
  nodeSource = process.execPath;
}
fs.copyFileSync(nodeSource, path.join(tempPayloadDir, 'node.exe'));

// 4. Copy dist frontend
console.log('[4/7] Staging frontend distribution bundle...');
copyRecursiveSync(path.join(root, 'dist'), path.join(tempPayloadDir, 'dist'));

// 5. Secure Backend Source Code with V8 Bytecode
console.log('[5/7] Securing & compiling backend server into V8 Bytecode...');
const targetServerDir = path.join(tempPayloadDir, 'server');
fs.mkdirSync(targetServerDir, { recursive: true });

let bytenode = null;
try {
  bytenode = require('bytenode');
} catch (e) {
  console.warn('Note: bytenode not loaded, copying standard JS');
}

if (bytenode) {
  const serverFiles = ['server.js', 'database.js', 'auth.js'];
  for (const file of serverFiles) {
    const srcPath = path.join(root, 'server', file);
    const destJsc = path.join(targetServerDir, file.replace(/\.js$/, '.jsc'));
    if (fs.existsSync(srcPath)) {
      try {
        bytenode.compileFile({ filename: srcPath, output: destJsc });
      } catch (err) {
        fs.copyFileSync(srcPath, path.join(targetServerDir, file));
      }
    }
  }

  const secureLoader = `// GAZIPUR PALLI BIDYUT SAMITY-2 | FUND MANAGEMENT SYSTEM
// PROTECTED SECURE RUNTIME - V8 BYTECODE RUNTIME LOADER
require('bytenode');
require('./server.jsc');
`;
  fs.writeFileSync(path.join(targetServerDir, 'server.js'), secureLoader);
} else {
  copyRecursiveSync(path.join(root, 'server'), targetServerDir);
}

// Staging production node_modules (excluding large dev frontend dependencies)
console.log('       Staging production backend node_modules...');
const devExclusions = [
  '@rolldown',
  '.vite',
  'lightningcss',
  'lightningcss-win32-x64-msvc',
  'lucide-react',
  'recharts',
  'react',
  'react-dom',
  '@reduxjs',
  'concurrently',
  'nodemon'
];

copyRecursiveSync(
  path.join(root, 'node_modules'),
  path.join(tempPayloadDir, 'node_modules'),
  devExclusions
);

// Ensure better-sqlite3 release binary exists
const sqliteReleaseDir = path.join(tempPayloadDir, 'node_modules', 'better-sqlite3', 'build', 'Release');
fs.mkdirSync(sqliteReleaseDir, { recursive: true });
const prebuildNode = path.join(tempPayloadDir, 'node_modules', 'better-sqlite3', 'prebuilds', 'win32-x64.node');
const releaseNode = path.join(sqliteReleaseDir, 'better_sqlite3.node');
if (fs.existsSync(prebuildNode) && !fs.existsSync(releaseNode)) {
  fs.copyFileSync(prebuildNode, releaseNode);
}

// Stage seed database template
console.log('       Staging default database template...');
const seedDir = path.join(tempPayloadDir, 'seed_data');
fs.mkdirSync(seedDir, { recursive: true });
const activeDb = path.join(root, 'data', 'Fund_vault_v7.sqlite3');
if (fs.existsSync(activeDb)) {
  try {
    fs.copyFileSync(activeDb, path.join(seedDir, 'Fund_vault_v7.sqlite3'));
  } catch (err) {
    console.warn('Could not copy live DB, relying on initialization script:', err.message);
  }
}

// 6. Zip payload
console.log('[6/7] Compressing runtime payload into optimized archive...');
if (fs.existsSync(payloadZip)) {
  fs.unlinkSync(payloadZip);
}
execSync(`powershell -Command "Compress-Archive -Path '${tempPayloadDir}\\*' -DestinationPath '${payloadZip}' -CompressionLevel Optimal -Force"`, { stdio: 'inherit' });

const zipStats = fs.statSync(payloadZip);
console.log(`       Compressed payload size: ${(zipStats.size / (1024 * 1024)).toFixed(2)} MB`);

// 7. Compile Single-File Executable via native Windows CSC
console.log('[7/7] Compiling Single-File Native Windows Executable: Fund Management.exe...');
const csFile = path.join(root, 'SingleFileLauncher.cs');

const cscCmd = `"${cscPath}" /target:winexe /out:"${outputExe}" /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /resource:"${payloadZip}",AppPayload "${csFile}"`;

try {
  execSync(cscCmd, { stdio: 'inherit' });
} catch (cscErr) {
  console.error('CSC Compilation failed:', cscErr.message);
  process.exit(1);
}

// Clean up temporary files
console.log('       Cleaning temporary payload staging files...');
try {
  fs.rmSync(tempPayloadDir, { recursive: true, force: true });
  fs.unlinkSync(payloadZip);
} catch (cleanupErr) {
  // Ignored
}

const exeStats = fs.statSync(outputExe);
console.log('\n==================================================================================');
console.log('=== SUCCESS! Single-File Offline Executable Generated:                         ===');
console.log(`=== File: ${outputExe} (${(exeStats.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log('==================================================================================');
console.log('Features for Offline Users:');
console.log('  1. Zero Installation: Users only need to double-click "Fund Management.exe".');
console.log('  2. Self-Contained: Node runtime, bytecode backend, and frontend are all inside.');
console.log('  3. Data Protected: Automatically keeps SQLite data in %LOCALAPPDATA% (or "data" folder beside it).');
console.log('  4. System Tray: Background server controls & 1-click "Open Data & Backup Folder".\n');
