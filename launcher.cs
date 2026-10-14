using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace FundManagementLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string serverJs = Path.Combine(baseDir, "server", "server.js");
                string nodeExe = Path.Combine(baseDir, "node.exe");

                if (!File.Exists(serverJs) && File.Exists(Path.Combine(baseDir, "Portable_App", "server", "server.js")))
                {
                    baseDir = Path.Combine(baseDir, "Portable_App");
                    serverJs = Path.Combine(baseDir, "server", "server.js");
                    nodeExe = Path.Combine(baseDir, "node.exe");
                }
                else if (File.Exists(serverJs) && !File.Exists(nodeExe) && File.Exists(Path.Combine(baseDir, "Portable_App", "node.exe")))
                {
                    nodeExe = Path.Combine(baseDir, "Portable_App", "node.exe");
                }

                if (!File.Exists(serverJs))
                {
                    MessageBox.Show(
                        "server\\server.js not found!\n\nPlease make sure you have EXTRACTED all files from the ZIP archive before running Fund Management.exe.\n\nRight-click ZIP file -> 'Extract All...' -> Open Fund Management.exe from the extracted folder.",
                        "Gazipur PBS-2 | Fund Management System",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                string nodeCmd = "node";
                if (File.Exists(nodeExe))
                {
                    nodeCmd = nodeExe;
                }

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = nodeCmd,
                    Arguments = "\"server/server.js\"",
                    WorkingDirectory = baseDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                Process.Start(psi);

                System.Threading.Thread.Sleep(1500);

                Process.Start(new ProcessStartInfo
                {
                    FileName = "http://localhost:5000",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error launching Fund Management System:\n" + ex.Message,
                    "Gazipur PBS-2 | Startup Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}
