const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const outputDir = path.join(root, 'Portable_App');
const zipFile = path.join(root, 'Fund_Management_System_Portable.zip');

console.log('==================================================================================');
console.log('===       GAZIPUR PALLI BIDYUT SAMITY-2 | FUND MANAGEMENT SYSTEM              ===');
console.log('===       Generating 100% Standalone Portable Application Package            ===');
console.log('==================================================================================\n');

// 1. Build Vite frontend
console.log('[1/10] Building Vite production bundle...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
} catch (err) {
  console.error('Vite build failed:', err.message);
  process.exit(1);
}

// 2. Prepare output directory
console.log('[2/10] Preparing output directory...');
const portableDb = path.join(outputDir, 'data', 'Fund_vault_v7.sqlite3');
const rootDb = path.join(root, 'data', 'Fund_vault_v7.sqlite3');
if (fs.existsSync(portableDb) && fs.existsSync(rootDb)) {
  try {
    const pStat = fs.statSync(portableDb);
    const rStat = fs.statSync(rootDb);
    if (pStat.mtime > rStat.mtime) {
      fs.copyFileSync(portableDb, rootDb);
      console.log('       Synced newer database from Portable_App to root data folder.');
    }
  } catch (syncErr) {
    console.warn('       Note on DB sync:', syncErr.message);
  }
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copy recursively function
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

// 3. Copy Node.exe runtime
console.log('[3/10] Embedding Node.exe runtime...');
const nodeExec = process.execPath;
if (fs.existsSync(nodeExec)) {
  fs.copyFileSync(nodeExec, path.join(outputDir, 'node.exe'));
  console.log(`       Embedded node.exe from ${nodeExec}`);
} else {
  console.warn('       Could not find node.exe to embed');
}

// 4. Copy dist folder
console.log('[4/10] Copying dist (frontend build)...');
copyRecursiveSync(path.join(root, 'dist'), path.join(outputDir, 'dist'));

// 5. Secure Backend Source Code (Compile into Protected V8 Bytecode .jsc)
console.log('[5/10] Securing & compiling backend into protected V8 Bytecode (.jsc)...');
const targetServerDir = path.join(outputDir, 'server');
fs.mkdirSync(targetServerDir, { recursive: true });

let bytenode = null;
try {
  bytenode = require('bytenode');
} catch (e) {
  console.warn('       bytenode not loaded, falling back to standard copy');
}

if (bytenode) {
  const serverFiles = ['server.js', 'database.js', 'auth.js'];
  for (const file of serverFiles) {
    const srcPath = path.join(root, 'server', file);
    const destJsc = path.join(targetServerDir, file.replace(/\.js$/, '.jsc'));
    if (fs.existsSync(srcPath)) {
      try {
        bytenode.compileFile({
          filename: srcPath,
          output: destJsc
        });
        console.log(`       [SECURE] Compiled ${file} -> ${path.basename(destJsc)} (V8 Binary Bytecode)`);
      } catch (compileErr) {
        console.warn(`       Warning: Could not compile ${file} to bytecode:`, compileErr.message);
        fs.copyFileSync(srcPath, path.join(targetServerDir, file));
      }
    }
  }

  // Create secured entry loader that executes compiled bytecode without exposing source code
  const secureLoader = `// GAZIPUR PALLI BIDYUT SAMITY-2 | FUND MANAGEMENT SYSTEM
// PROTECTED SECURE RUNTIME - V8 BYTECODE RUNTIME LOADER
// ALL PROPRIETARY SOURCE CODE, DATABASE QUERIES & BUSINESS LOGIC ARE COMPILED IN V8 BINARY BYTECODE
require('bytenode');
require('./server.jsc');
`;
  fs.writeFileSync(path.join(targetServerDir, 'server.js'), secureLoader);
  console.log('       [SECURE] Created encrypted production loader: server.js -> server.jsc');
} else {
  copyRecursiveSync(path.join(root, 'server'), targetServerDir);
}

// 6. Copy data folder (database)
console.log('[6/10] Copying database data directory...');
copyRecursiveSync(path.join(root, 'data'), path.join(outputDir, 'data'));

// 7. Copy node_modules & verify native SQLite binding
console.log('[7/10] Copying node_modules & verifying SQLite native binaries...');
copyRecursiveSync(path.join(root, 'node_modules'), path.join(outputDir, 'node_modules'));

// Ensure better-sqlite3 release binary directory exists in portable folder
const sqliteReleaseDir = path.join(outputDir, 'node_modules', 'better-sqlite3', 'build', 'Release');
if (!fs.existsSync(sqliteReleaseDir)) {
  fs.mkdirSync(sqliteReleaseDir, { recursive: true });
}
const prebuildNode = path.join(outputDir, 'node_modules', 'better-sqlite3', 'prebuilds', 'win32-x64.node');
const releaseNode = path.join(sqliteReleaseDir, 'better_sqlite3.node');
if (fs.existsSync(prebuildNode) && !fs.existsSync(releaseNode)) {
  fs.copyFileSync(prebuildNode, releaseNode);
  console.log('       Configured fallback native SQLite binary at build/Release/better_sqlite3.node');
}

// 8. Copy package.json
console.log('[8/10] Copying package.json...');
if (fs.existsSync(path.join(root, 'package.json'))) {
  fs.copyFileSync(path.join(root, 'package.json'), path.join(outputDir, 'package.json'));
}

// 9. Compile Native C# Executable Launcher (Fund Management.exe)
console.log('[9/10] Compiling Fund Management.exe standalone launcher...');
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const csFile = path.join(root, 'launcher.cs');
const targetExeInPortable = path.join(outputDir, 'Fund Management.exe');
const targetExeInRoot = path.join(root, 'Fund Management.exe');

if (fs.existsSync(cscPath) && fs.existsSync(csFile)) {
  try {
    execSync(`"${cscPath}" /target:winexe /out:"${targetExeInPortable}" /r:System.Windows.Forms.dll "${csFile}"`, { stdio: 'pipe' });
    fs.copyFileSync(targetExeInPortable, targetExeInRoot);
    console.log('       Successfully compiled native launcher: Fund Management.exe');
  } catch (err) {
    console.warn('       Could not compile launcher.cs:', err.message);
  }
}

// Generate Launch.bat alternative
const launchBatContent = `@echo off
cd /d "%~dp0"
title "Gazipur PBS-2 | Fund Management System by Ariful Islam"
color 0A
cls

echo ==================================================================================
echo                      GAZIPUR PALLI BIDYUT SAMITY-2
echo            FDR, SAVINGS CERTIFICATE ^& FUND MANAGEMENT SYSTEM
echo ==================================================================================
echo:
echo    Developer   : Ariful Islam
echo    Designation : AGM (Finance ^& Accounts), Gazipur PBS-2
echo    Contact Cell: 01737530731
echo:
echo ==================================================================================
echo    Starting Express Engine ^& Database Server...
echo ==================================================================================
echo:

if not exist "%~dp0server\\server.js" goto NO_SERVER

SET "NODE_CMD=node"
if exist "%~dp0node.exe" SET "NODE_CMD=%~dp0node.exe"

start "" /B "%NODE_CMD%" server/server.js

ping 127.0.0.1 -n 3 >nul 2>&1

start "" http://localhost:5000

echo:
echo ==================================================================================
echo    System is running at: http://localhost:5000
echo    Close this window or run Stop_Server.bat to stop the server.
echo ==================================================================================
echo:

pause
exit /b 0

:NO_SERVER
color 0C
echo [ERROR] server\\server.js not found!
echo:
echo Please make sure you have EXTRACTED all files from the ZIP archive
echo before running Launch.bat.
echo:
echo Right-click the ZIP file -^> "Extract All..." -^> Open Launch.bat from extracted folder.
echo ==================================================================================
pause
exit /b 1
`;
fs.writeFileSync(path.join(outputDir, 'Launch.bat'), launchBatContent);
fs.writeFileSync(path.join(root, 'Launch.bat'), launchBatContent);

// Generate Run_Hidden.vbs launcher
const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "Launch.bat", 0, False
`;
fs.writeFileSync(path.join(outputDir, 'Run_Hidden.vbs'), vbsContent);

// Generate Stop_Server.bat
const stopBatContent = `@echo off
title "Gazipur PBS-2 | Stop Fund Management Server"
color 0C
cls

echo ==================================================================================
echo                      GAZIPUR PALLI BIDYUT SAMITY-2
echo                      STOPPING FUND MANAGEMENT SERVER
echo ==================================================================================
echo:

powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

echo:
echo System server background processes have been stopped successfully.
echo You can safely close this window now.
echo ==================================================================================
echo:
pause
exit /b 0
`;
fs.writeFileSync(path.join(outputDir, 'Stop_Server.bat'), stopBatContent);
fs.writeFileSync(path.join(root, 'Stop_Server.bat'), stopBatContent);

// 10. Create ZIP package
console.log('[10/10] Archiving into Fund_Management_System_Portable.zip...');
if (fs.existsSync(zipFile)) {
  try { fs.unlinkSync(zipFile); } catch (e) {}
}
try {
  execSync(`powershell -Command "Compress-Archive -Path '${outputDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit' });
  console.log(`       ZIP created successfully at: ${zipFile}`);
} catch (err) {
  console.warn('       Could not create ZIP archive via PowerShell:', err.message);
}

console.log('\n==================================================================================');
console.log('=== Portable Package Generation Completed Successfully!                        ===');
console.log('==================================================================================');
console.log(`Portable Directory: ${outputDir}`);
console.log(`Portable ZIP File : ${zipFile}\n`);
