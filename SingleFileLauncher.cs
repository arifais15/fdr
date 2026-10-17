using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace GazipurPBS2.FundManagement
{
    static class Program
    {
        private const string AppTitle = "Gazipur PBS-2 | Fund Management System";
        private const string MutexName = "Global\\GazipurPBS2_FundManagement_SingleInstance_Mutex";
        private const string AppUrl = "http://localhost:5000";
        private const int ServerPort = 5000;

        private static Mutex appMutex;
        private static Process serverProcess;
        private static NotifyIcon trayIcon;
        private static string activeDataPath;
        private static string runtimeDir;

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            bool isNewInstance;
            appMutex = new Mutex(true, MutexName, out isNewInstance);

            if (!isNewInstance)
            {
                // App is already running, open browser and exit second instance
                OpenBrowser(AppUrl);
                return;
            }

            try
            {
                InitializeEnvironment();
                StartOrConnectServer();
                SetupTrayIcon();
                OpenBrowser(AppUrl);

                // Handle system shutdown or logoff cleanly
                SystemEvents.SessionEnding += (s, e) => ShutdownApp();
                Application.ApplicationExit += (s, e) => ShutdownApp();

                Application.Run();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Startup encountered an issue:\n\n" + ex.Message + "\n\nDetails: " + ex.StackTrace,
                    AppTitle + " - Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
            finally
            {
                if (appMutex != null)
                {
                    appMutex.ReleaseMutex();
                    appMutex.Dispose();
                }
            }
        }

        private static void InitializeEnvironment()
        {
            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string appRoot = Path.Combine(localAppData, "GazipurPBS2_FundManagement");

            // 1. Determine persistent data directory
            // If there is a 'data' folder beside the .exe, prioritize it (Portable USB drive mode)
            string localDataDir = Path.Combine(exeDir, "data");
            if (Directory.Exists(localDataDir))
            {
                activeDataPath = localDataDir;
            }
            else
            {
                activeDataPath = Path.Combine(appRoot, "data");
                if (!Directory.Exists(activeDataPath))
                {
                    Directory.CreateDirectory(activeDataPath);
                }
            }

            // 2. Prepare runtime directory
            runtimeDir = Path.Combine(appRoot, "runtime");
            string versionFile = Path.Combine(runtimeDir, "build_version.txt");
            string currentAssemblyTime = File.GetLastWriteTimeUtc(Assembly.GetExecutingAssembly().Location).Ticks.ToString();

            bool needsExtraction = !Directory.Exists(runtimeDir) ||
                                  !File.Exists(Path.Combine(runtimeDir, "node.exe")) ||
                                  !File.Exists(versionFile) ||
                                  File.ReadAllText(versionFile).Trim() != currentAssemblyTime;

            if (needsExtraction)
            {
                ExtractPayload(runtimeDir, versionFile, currentAssemblyTime);
            }

            // 3. Ensure database template is seeded if not present
            string targetDb = Path.Combine(activeDataPath, "Fund_vault_v7.sqlite3");
            string templateDb = Path.Combine(runtimeDir, "seed_data", "Fund_vault_v7.sqlite3");
            if (!File.Exists(targetDb) && File.Exists(templateDb))
            {
                try
                {
                    File.Copy(templateDb, targetDb, false);
                }
                catch { }
            }
        }

        private static void ExtractPayload(string targetDir, string versionFile, string versionStamp)
        {
            if (Directory.Exists(targetDir))
            {
                try
                {
                    // Kill any leftover node.exe inside runtime directory
                    KillProcessesInDirectory(targetDir);
                    Thread.Sleep(500);
                }
                catch { }
            }

            Directory.CreateDirectory(targetDir);

            var assembly = Assembly.GetExecutingAssembly();
            using (Stream resourceStream = assembly.GetManifestResourceStream("AppPayload"))
            {
                if (resourceStream == null)
                {
                    throw new InvalidOperationException("Embedded AppPayload resource was not found inside the executable.");
                }

                using (ZipArchive archive = new ZipArchive(resourceStream, ZipArchiveMode.Read))
                {
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        string destinationPath = Path.GetFullPath(Path.Combine(targetDir, entry.FullName));
                        if (!destinationPath.StartsWith(targetDir, StringComparison.OrdinalIgnoreCase))
                        {
                            continue; // Prevent zip slip
                        }

                        if (string.IsNullOrEmpty(entry.Name))
                        {
                            Directory.CreateDirectory(destinationPath);
                        }
                        else
                        {
                            Directory.CreateDirectory(Path.GetDirectoryName(destinationPath));
                            try
                            {
                                entry.ExtractToFile(destinationPath, true);
                            }
                            catch (IOException)
                            {
                                // If file is locked, skip if already exists
                                if (!File.Exists(destinationPath)) throw;
                            }
                        }
                    }
                }
            }

            try
            {
                File.WriteAllText(versionFile, versionStamp);
            }
            catch { }
        }

        private static void StartOrConnectServer()
        {
            if (IsServerResponsive(AppUrl + "/api/settings"))
            {
                return;
            }

            string nodeExe = Path.Combine(runtimeDir, "node.exe");
            string serverJs = Path.Combine(runtimeDir, "server", "server.js");

            if (!File.Exists(nodeExe))
            {
                throw new FileNotFoundException("Embedded node.exe runtime was not found at: " + nodeExe);
            }

            if (!File.Exists(serverJs))
            {
                throw new FileNotFoundException("Server script was not found at: " + serverJs);
            }

            string dbPath = Path.Combine(activeDataPath, "Fund_vault_v7.sqlite3");

            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = nodeExe,
                Arguments = "\"server/server.js\"",
                WorkingDirectory = runtimeDir,
                CreateNoWindow = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden
            };

            psi.EnvironmentVariables["DB_PATH"] = dbPath;
            psi.EnvironmentVariables["PORT"] = ServerPort.ToString();
            psi.EnvironmentVariables["NODE_ENV"] = "production";

            serverProcess = Process.Start(psi);

            // Wait for server to become responsive (up to 12 seconds)
            int retries = 24;
            while (retries-- > 0)
            {
                Thread.Sleep(500);
                if (IsServerResponsive(AppUrl + "/api/settings"))
                {
                    break;
                }
            }
        }

        private static bool IsServerResponsive(string testUrl)
        {
            try
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(testUrl);
                request.Method = "GET";
                request.Timeout = 1200;
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    return true;
                }
            }
            catch (WebException wex)
            {
                // Even 401 or 403 or 404 indicates the Express HTTP server is active and listening!
                if (wex.Response != null)
                {
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        private static void SetupTrayIcon()
        {
            trayIcon = new NotifyIcon();
            trayIcon.Icon = SystemIcons.Application;
            trayIcon.Text = "Gazipur PBS-2 | Fund Management System";
            trayIcon.Visible = true;

            ContextMenu menu = new ContextMenu();

            MenuItem openDashboard = new MenuItem("🌐 Open Fund Management", (s, e) => OpenBrowser(AppUrl));
            openDashboard.DefaultItem = true;
            menu.MenuItems.Add(openDashboard);

            menu.MenuItems.Add("-");

            menu.MenuItems.Add("📁 Open Data & Backup Folder", (s, e) =>
            {
                try
                {
                    if (Directory.Exists(activeDataPath))
                    {
                        Process.Start("explorer.exe", activeDataPath);
                    }
                }
                catch { }
            });

            menu.MenuItems.Add("🔄 Restart Server", (s, e) =>
            {
                try
                {
                    StopServerProcess();
                    Thread.Sleep(1000);
                    StartOrConnectServer();
                    trayIcon.ShowBalloonTip(2000, AppTitle, "Server restarted successfully at " + AppUrl, ToolTipIcon.Info);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Could not restart server: " + ex.Message, AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            });

            menu.MenuItems.Add("-");

            menu.MenuItems.Add("❌ Stop Server & Exit", (s, e) =>
            {
                ShutdownApp();
                Application.Exit();
            });

            trayIcon.ContextMenu = menu;
            trayIcon.DoubleClick += (s, e) => OpenBrowser(AppUrl);

            trayIcon.ShowBalloonTip(
                2500,
                "Gazipur PBS-2 Fund Management",
                "System is running at " + AppUrl + "\nRight-click this tray icon anytime to manage.",
                ToolTipIcon.Info
            );
        }

        private static void OpenBrowser(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Unable to open browser: " + ex.Message, AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void StopServerProcess()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                    serverProcess.WaitForExit(2000);
                }
            }
            catch { }

            try
            {
                if (!string.IsNullOrEmpty(runtimeDir))
                {
                    KillProcessesInDirectory(runtimeDir);
                }
            }
            catch { }
        }

        private static void KillProcessesInDirectory(string dirPath)
        {
            try
            {
                Process[] procs = Process.GetProcessesByName("node");
                foreach (Process p in procs)
                {
                    try
                    {
                        if (p.MainModule != null && p.MainModule.FileName.StartsWith(dirPath, StringComparison.OrdinalIgnoreCase))
                        {
                            p.Kill();
                            p.WaitForExit(1000);
                        }
                    }
                    catch { }
                }
            }
            catch { }
        }

        private static void ShutdownApp()
        {
            try
            {
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                    trayIcon = null;
                }
                StopServerProcess();
            }
            catch { }
        }
    }
}
