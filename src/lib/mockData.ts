
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand, Monitor, AssociatedMonitorConfig, SMTPSettings, MonitorExecutionLog, ScheduleConfig, AiSettings, AiProviderConfig, License, LicenseTerm, ProcedureSystemType, WindowsUpdateScope } from '@/types';
import { toast } from '@/hooks/use-toast'; // Import toast for notifications

export const scriptTypes: ScriptType[] = ['CMD', 'PowerShell', 'Python'];
export const licenseTermsList: LicenseTerm[] = ['Lifetime', 'Annual', 'Monthly', 'Other'];

const windowsUpdateScriptContent = `
# Script to check, download, and install Windows Updates without rebooting.
# This targets software updates, including Microsoft products and feature updates based on scope.

function Write-Log {
    param ([string]\$Message)
    Write-Host "LOG: \$(\$Message)"
}

Write-Log "Starting Windows Update procedure..."
# The actual search criteria might need to be adjusted in a real system based on the selected scope (all, microsoftProducts, osFeatureUpdates)
# For this mock, the script is generic but the intent is logged.
# Example for "All": "IsInstalled=0 and Type='Software' and IsHidden=0 and BrowseOnly=0"
# Example for "OS/Feature Updates": "IsInstalled=0 and Type='Software' and CategoryIDs contains '...GUID for OS...' or UpdateClassificationTitle = 'Upgrades'"
# Example for "Microsoft Products": "IsInstalled=0 and Type='Software' and CategoryIDs contains '...GUID for MS Products...'"

try {
    Write-Log "Creating Update Session and Searcher..."
    \$updateSession = New-Object -ComObject Microsoft.Update.Session
    \$updateSearcher = \$updateSession.CreateUpdateSearcher()

    # This search criteria is broad and typically covers OS, Feature, and MS Product updates.
    # In a real scenario, this query might be dynamically adjusted based on the procedure's windowsUpdateScope.
    \$searchCriteria = "IsInstalled=0 and Type='Software' and IsHidden=0 and BrowseOnly=0"
    Write-Log "Searching for available updates using criteria: \$searchCriteria (Scope intent will refine this in a real agent)"
    \$searchResult = \$updateSearcher.Search(\$searchCriteria)

    if (\$searchResult.Updates.Count -eq 0) {
        Write-Log "No new software updates found matching the criteria."
        Write-Host "OUTPUT: No new software updates found."
        exit 0
    }

    Write-Log "\$(\$searchResult.Updates.Count) update(s) found."
    foreach (\$update in \$searchResult.Updates) {
        Write-Log "  - \$(\$update.Title)"
    }

    \$updatesToDownload = New-Object -ComObject Microsoft.Update.UpdateColl
    \$updatesToInstall = New-Object -ComObject Microsoft.Update.UpdateColl

    foreach (\$update in \$searchResult.Updates) {
        if (-not \$update.IsDownloaded) {
            \$updatesToDownload.Add(\$update) | Out-Null
        }
        \$updatesToInstall.Add(\$update) | Out-Null
    }

    if (\$updatesToDownload.Count -gt 0) {
        Write-Log "Downloading \$(\$updatesToDownload.Count) update(s)..."
        \$downloader = \$updateSession.CreateUpdateDownloader()
        \$downloader.Updates = \$updatesToDownload
        \$downloadResult = \$downloader.Download()

        if (\$downloadResult.ResultCode -ne 2) { # 2 means Succeeded
            Write-Log "Download failed. ResultCode: \$(\$downloadResult.ResultCode)"
            Write-Host "ERROR: Update download failed with code \$(\$downloadResult.ResultCode)"
            exit 1
        }
        Write-Log "Download completed successfully."
    } else {
        Write-Log "All applicable updates are already downloaded."
    }

    if (\$updatesToInstall.Count -gt 0) {
        Write-Log "Installing \$(\$updatesToInstall.Count) update(s)..."
        \$installer = \$updateSession.CreateUpdateInstaller()
        \$installer.Updates = \$updatesToInstall
        \$installationResult = \$installer.Install()

        if (\$installationResult.ResultCode -eq 2) { # 2 means Succeeded
            Write-Log "Installation successful."
            Write-Host "OUTPUT: Updates installed successfully."

            if (\$installationResult.RebootRequired) {
                Write-Log "Reboot is required, but this script will not restart the system."
            } else {
                Write-Log "No reboot required after installation."
            }
        } elseif (\$installationResult.ResultCode -eq 3) { # Succeeded with errors
             Write-Log "Installation succeeded with errors. ResultCode: \$(\$installationResult.ResultCode)"
             Write-Host "OUTPUT: Updates installed with some errors. ResultCode: \$(\$installationResult.ResultCode)"
             if (\$installationResult.RebootRequired) {
                Write-Log "Reboot is required, but this script will not restart the system."
             }
        } else { # Other failure codes
            Write-Log "Installation failed. ResultCode: \$(\$installationResult.ResultCode)"
            Write-Host "ERROR: Update installation failed with code \$(\$installationResult.ResultCode)"
            exit 1
        }
    } else {
        Write-Log "No updates to install (either none found or already installed)."
        Write-Host "OUTPUT: No new updates were available to install."
    }

    Write-Log "Windows Update procedure finished."

} catch {
    Write-Log "An error occurred: \$(\$_.Exception.Message)"
    Write-Host "ERROR: \$(\$_.Exception.Message)"
    exit 1
}
`;

const softwareUpdateWingetScriptContentAll = `
# Script to update all applications using winget.
# This script attempts to run winget to upgrade all packages.
# Note: Winget's behavior when run as SYSTEM can vary for user-installed vs. machine-installed apps.

function Write-Log {
    param ([string]\$Message)
    Write-Host "LOG: \$(\$Message)"
}

Write-Log "Starting Application Update procedure (winget - Update All)..."

\$wingetPath = Get-Command winget -ErrorAction SilentlyContinue
if (-not \$wingetPath) {
    Write-Log "winget command not found. Please ensure App Installer (winget) is installed and in PATH."
    Write-Host "ERROR: winget command not found. Cannot proceed with updates."
    exit 1 
}
Write-Log "winget found at: \$(\$wingetPath.Source)"

Write-Log "Attempting to upgrade all applications using 'winget upgrade --all --silent --accept-source-agreements --accept-package-agreements'..."
\$upgradeOutput = ""
\$upgradeErrors = ""

try {
    \$processInfo = New-Object System.Diagnostics.ProcessStartInfo
    \$processInfo.FileName = "winget"
    \$processInfo.Arguments = "upgrade --all --silent --accept-source-agreements --accept-package-agreements"
    \$processInfo.RedirectStandardOutput = \$true
    \$processInfo.RedirectStandardError = \$true
    \$processInfo.UseShellExecute = \$false
    \$processInfo.CreateNoWindow = \$true
    
    \$process = New-Object System.Diagnostics.Process
    \$process.StartInfo = \$processInfo
    
    \$process.Start() | Out-Null
    
    \$upgradeOutput = \$process.StandardOutput.ReadToEnd()
    \$upgradeErrors = \$process.StandardError.ReadToEnd()
    
    \$process.WaitForExit()
    
    \$exitCode = \$process.ExitCode
    Write-Log "Winget process exit code: \$(\$exitCode)"
    
    if (\$upgradeOutput) {
        Write-Log "Winget Standard Output:"
        \$upgradeOutput.Split([System.Environment]::NewLine) | ForEach-Object { Write-Log "  \$_" }
    }
    if (\$upgradeErrors) {
        Write-Log "Winget Standard Error:"
        \$upgradeErrors.Split([System.Environment]::NewLine) | ForEach-Object { Write-Log "  \$_" }
    }

    if (\$exitCode -eq 0 -or \$exitCode -eq -1978334889 -or \$upgradeOutput -match "No applicable update found" -or \$upgradeOutput -match "No installed package found matching input criteria.") {
        Write-Log "Application updates completed or no updates were found/needed."
        if (\$upgradeOutput -match "No applicable update found" -or \$upgradeOutput -match "No installed package found matching input criteria." -or \$exitCode -eq -1978334889) {
            Write-Host "OUTPUT: No application updates were found or needed."
        } else {
            Write-Host "OUTPUT: Application updates attempted. Review logs for details. Summary: \$(\$upgradeOutput.Split([System.Environment]::NewLine) | Select-Object -First 5 -Last 5 | Out-String)"
        }
    } else {
        Write-Log "Winget upgrade process failed or completed with errors. Exit Code: \$(\$exitCode)."
        Write-Host "ERROR: Winget upgrade failed or had issues. Exit Code: \$(\$exitCode). Errors: \$(\$upgradeErrors) Output: \$(\$upgradeOutput)"
        exit 1 
    }

} catch {
    Write-Log "An error occurred while trying to run winget: \$(\$_.Exception.Message)"
    Write-Log "Stack Trace: \$(\$_.ScriptStackTrace)"
    if(\$upgradeOutput) { Write-Log "Partial Output: \$(\$upgradeOutput)" }
    if(\$upgradeErrors) { Write-Log "Partial Error: \$(\$upgradeErrors)" }
    Write-Host "ERROR: Script error during winget execution: \$(\$_.Exception.Message)"
    exit 1
}

Write-Log "Application Update procedure (winget - Update All) finished."
`;

const softwareUpdateWingetScriptSpecific = (packageList: string) => `
# Script to update specific applications using winget.
# Package list: ${packageList || "NONE SPECIFIED"}

function Write-Log {
    param ([string]\$Message)
    Write-Host "LOG: \$(\$Message)"
}

Write-Log "Starting Application Update procedure (winget - Specific Packages)..."
Write-Log "Target packages: ${packageList || "NONE SPECIFIED"}"

if (-not ("${packageList}").Trim()) {
    Write-Log "No specific packages were provided to update."
    Write-Host "OUTPUT: No specific packages were specified for update."
    exit 0
}

\$wingetPath = Get-Command winget -ErrorAction SilentlyContinue
if (-not \$wingetPath) {
    Write-Log "winget command not found."
    Write-Host "ERROR: winget command not found."
    exit 1
}
Write-Log "winget found at: \$(\$wingetPath.Source)"

\$packages = "${packageList}".Split(',') | ForEach-Object { \$\_.Trim() }
\$overallSuccess = \$true
\$allOutputs = @()
\$allErrors = @()

foreach (\$pkgId in \$packages) {
    if (-not \$pkgId) { continue }
    Write-Log "Attempting to upgrade package: \$(\$pkgId)"
    \$upgradeOutput = ""
    \$upgradeErrors = ""
    \$exitCode = 1 # Default to error

    try {
        \$processInfoArgs = "upgrade --id \$(\$pkgId) --silent --accept-source-agreements --accept-package-agreements"
        Write-Log "Executing: winget \$(\$processInfoArgs)"

        # Using a temporary file for output redirection as it's more robust with Start-Process
        \$outputFile = New-TemporaryFile
        \$errorFile = New-TemporaryFile
        
        \$process = Start-Process winget -ArgumentList \$processInfoArgs -PassThru -Wait -RedirectStandardOutput \$outputFile.FullName -RedirectStandardError \$errorFile.FullName -WindowStyle Hidden
        \$exitCode = \$process.ExitCode
        \$upgradeOutput = Get-Content \$outputFile.FullName -Raw
        \$upgradeErrors = Get-Content \$errorFile.FullName -Raw
        Remove-Item \$outputFile.FullName, \$errorFile.FullName -Force -ErrorAction SilentlyContinue
        
        Write-Log "Package '\$(\$pkgId)' upgrade attempt. Exit Code: \$(\$exitCode)"
        if (\$upgradeOutput) { Write-Log "Output for \$(\$pkgId): \$(\$upgradeOutput)" }
        if (\$upgradeErrors) { Write-Log "Error for \$(\$pkgId): \$(\$upgradeErrors)" }

        if (\$exitCode -ne 0 -and \$exitCode -ne -1978334889) { # -1978334889 is often "no update found"
            \$overallSuccess = \$false
        }
         \$allOutputs += "--- \$(\$pkgId) Output (Exit Code: \$(\$exitCode)) ---\`n\$(\$upgradeOutput)"
         \$allErrors += "--- \$(\$pkgId) Errors ---\`n\$(\$upgradeErrors)"

    } catch {
        Write-Log "Error processing package \$(\$pkgId): \$(\$_.Exception.Message)"
        \$allErrors += "--- \$(\$pkgId) Script Error ---\`n\$(\$_.Exception.Message)"
        \$overallSuccess = \$false
    }
}

if (\$overallSuccess) {
    Write-Log "All specified application updates completed successfully or no updates were needed for them."
    Write-Host "OUTPUT: Specified application updates attempted. Review logs. Summary:\`n\$(\$allOutputs -join "\`\`n")"
} else {
    Write-Log "One or more specified application updates failed or had issues."
    Write-Host "ERROR: One or more specified application updates failed. Review logs. Summary:\`n\$(\$allOutputs -join "\`\`n\`\`n")\`nErrors:\`n\$(\$allErrors -join "\`\`n\`\`n")"
    # exit 1 # Decide if partial success is an overall failure for the RMM
}

Write-Log "Application Update procedure (winget - Specific Packages) finished."
`;


export let mockComputers: Computer[] = [
  {
    id: 'comp-1', name: 'Workstation-Dev-01', status: 'Online', os: 'Windows 11 Pro', ipAddress: '192.168.1.101',
    lastSeen: new Date(Date.now() - 3600000).toISOString(), cpuUsage: 25, ramUsage: 60, diskUsage: 75, groupIds: ['group-1'],
    model: 'Dell XPS 15', processor: 'Intel Core i7-11800H @ 2.30GHz, 8C/16T', ramSize: '32 GB RAM', storage: '1TB NVMe SSD',
    graphicsCard: 'NVIDIA GeForce RTX 3050 Ti', serialNumber: 'DEVXPS15001', publicIpAddress: '88.99.170.10',
    macAddressLan: '00:1A:2B:3C:4D:5E', macAddressWifi: '00:1A:2B:3C:4D:5F',
  },
  {
    id: 'comp-2', name: 'Server-Prod-Main', status: 'Online', os: 'Windows Server 2022', ipAddress: '10.0.0.5',
    lastSeen: new Date(Date.now() - 600000).toISOString(), cpuUsage: 10, ramUsage: 30, diskUsage: 40, groupIds: ['group-2'],
    model: 'HP ProLiant DL380 Gen10', processor: 'Intel Xeon Silver 4210 @ 2.20GHz, 10C/20T', ramSize: '64 GB ECC RAM', storage: '2x 4TB SAS RAID 1',
    graphicsCard: 'Matrox G200eH2', serialNumber: 'PRODSERV002', publicIpAddress: '212.58.244.70',
    macAddressLan: 'A0:B1:C2:D3:E4:F0', macAddressWifi: undefined,
  },
  {
    id: 'comp-3', name: 'Laptop-Sales-03', status: 'Offline', os: 'Windows 10 Home', ipAddress: '192.168.1.153',
    lastSeen: new Date(Date.now() - 86400000 * 2).toISOString(), groupIds: ['group-1', 'group-3'],
    model: 'Lenovo ThinkPad X1 Carbon', processor: 'Intel Core i5-10210U @ 1.60GHz, 4C/8T', ramSize: '16 GB RAM', storage: '512GB NVMe SSD',
    graphicsCard: 'Intel UHD Graphics', serialNumber: 'SALESLAP003', publicIpAddress: '90.100.180.20',
    macAddressLan: '11:22:33:AA:BB:CC', macAddressWifi: '11:22:33:AA:BB:CD',
  },
  {
    id: 'comp-4', name: 'Kiosk-Lobby', status: 'Error', os: 'Windows 10 IoT', ipAddress: '192.168.2.20',
    lastSeen: new Date(Date.now() - 7200000).toISOString(), cpuUsage: 90, ramUsage: 85, diskUsage: 95, groupIds: [],
    model: 'Advantech Kiosk TPC-1551T', processor: 'Intel Celeron J1900 @ 2.00GHz, 4C/4T', ramSize: '4 GB RAM', storage: '128GB SSD',
    graphicsCard: 'Intel HD Graphics', serialNumber: 'KIOSKLOBBY004', publicIpAddress: '91.101.190.30',
    macAddressLan: 'DD:EE:FF:77:88:99', macAddressWifi: 'DD:EE:FF:77:88:9A',
  },
  {
    id: 'comp-5', name: 'VM-Test-Environment', status: 'Online', os: 'Windows Server 2019', ipAddress: '10.0.1.15',
    lastSeen: new Date().toISOString(), cpuUsage: 5, ramUsage: 15, diskUsage: 20, groupIds: ['group-2'],
    model: 'VMware Virtual Platform', processor: 'Virtual CPU @ 2.50GHz, 2C/4T', ramSize: '8 GB RAM', storage: '250GB Virtual Disk',
    graphicsCard: 'VMware SVGA II Adapter', serialNumber: 'VMTESTENV005', publicIpAddress: '212.58.244.75',
    macAddressLan: '00:0C:29:1A:2B:3C', macAddressWifi: undefined,
  },
];

export let mockProcedures: Procedure[] = [
  { id: 'proc-1', name: 'Disk Cleanup', description: 'Runs a standard disk cleanup utility.', scriptType: 'CMD', scriptContent: 'cleanmgr /sagerun:1', runAsUser: false, procedureSystemType: 'CustomScript', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'proc-2', name: 'Restart Print Spooler', description: 'Restarts the print spooler service.', scriptType: 'PowerShell', scriptContent: 'Restart-Service -Name Spooler -Force', runAsUser: false, procedureSystemType: 'CustomScript', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'proc-3', name: 'Apply Security Registry Fix (CMD)', description: 'Applies a common security registry fix via CMD.', scriptType: 'CMD', scriptContent: 'REG ADD "HKLM\\\\Software\\\\MyCorp\\\\Security" /v "SecureSetting" /t REG_DWORD /d 1 /f', runAsUser: false, procedureSystemType: 'CustomScript', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()},
  {
    id: 'proc-4',
    name: 'Manage Windows Updates',
    description: 'Installs all available Windows updates, including Microsoft products and feature updates. This procedure does not force a system reboot.',
    scriptType: 'PowerShell',
    scriptContent: windowsUpdateScriptContent,
    runAsUser: false, 
    procedureSystemType: 'WindowsUpdate',
    windowsUpdateScope: 'all', // Default scope
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

const defaultProcedureSchedule: ScheduleConfig = { type: 'disabled' };
const defaultMonitorSchedule: ScheduleConfig = { type: 'interval', intervalValue: 15, intervalUnit: 'minutes' };

export let mockComputerGroups: ComputerGroup[] = [
  { id: 'group-1', name: 'Development Machines', description: 'All computers used by the development team.', computerIds: ['comp-1', 'comp-3'], associatedProcedures: [{ procedureId: 'proc-1', runOnNewMember: true, schedule: { type: 'interval', intervalValue: 24, intervalUnit: 'hours'} }], associatedMonitors: [{monitorId: 'mon-1', schedule: defaultMonitorSchedule}] },
  { id: 'group-2', name: 'Production Servers', description: 'Critical production servers.', computerIds: ['comp-2', 'comp-5'], associatedProcedures: [{ procedureId: 'proc-2', runOnNewMember: false, schedule: defaultProcedureSchedule }, { procedureId: 'proc-4', runOnNewMember: false, schedule: {type: 'interval', intervalValue: 7, intervalUnit: 'days'}}], associatedMonitors: [] },
  { id: 'group-3', name: 'Sales Laptops', description: 'Laptops for the sales department.', computerIds: ['comp-3'], associatedProcedures: [], associatedMonitors: [] },
];

export let mockProcedureExecutions: ProcedureExecution[] = [
  { id: 'exec-1', procedureId: 'proc-1', computerId: 'comp-1', computerName: 'Workstation-Dev-01', status: 'Success', startTime: new Date(Date.now() - 3600000 * 2).toISOString(), endTime: new Date(Date.now() - 3600000 * 2 + 60000).toISOString(), logs: 'Disk cleanup initiated (as SYSTEM)...', output: '1.2GB freed.', runAsUser: false },
  { id: 'exec-2', procedureId: 'proc-2', computerId: 'comp-2', computerName: 'Server-Prod-Main', status: 'Failed', startTime: new Date(Date.now() - 7200000).toISOString(), endTime: new Date(Date.now() - 7200000 + 30000).toISOString(), logs: 'Restarting Spooler (as SYSTEM)...\\nError: Access Denied.', output: 'Failed with exit code 5', runAsUser: false },
  { id: 'exec-3', procedureId: 'proc-1', computerId: 'comp-5', computerName: 'VM-Test-Environment', status: 'Running', startTime: new Date().toISOString(), logs: 'Disk cleanup initiated (as SYSTEM)...', output: '', runAsUser: false },
  { id: 'exec-4', procedureId: 'proc-4', computerId: 'comp-2', computerName: 'Server-Prod-Main', status: 'Success', startTime: new Date(Date.now() - 86400000).toISOString(), endTime: new Date(Date.now() - 86400000 + 1200000).toISOString(), logs: 'Windows Update (Scope: All) initiated (as SYSTEM)... Search found 3 updates. Downloading... Installing... Success. Reboot required: No.', output: '3 updates installed successfully.', runAsUser: false },
];

export let mockMonitors: Monitor[] = [
  { id: 'mon-1', name: 'CPU Usage Monitor', description: 'Alerts if CPU usage is high.', scriptType: 'PowerShell', scriptContent: 'if ((Get-Counter "\\\\Processor(_Total)\\\\% Processor Time").CounterSamples[0].CookedValue -gt 80) { "ALERT: CPU Usage High" } else { "OK: CPU Usage Normal" }', defaultIntervalValue: 5, defaultIntervalUnit: 'minutes', sendEmailOnAlert: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'mon-2', name: 'Disk Space Monitor (C:)', description: 'Checks free disk space on C:. Alerts if < 10% free.', scriptType: 'PowerShell', scriptContent: '\\$disk = Get-PSDrive C; if ((\\$disk.Free / \$disk.Size) * 100 -lt 10) { "ALERT: Low Disk Space on C:" } else { "OK: Disk space sufficient on C:" }', defaultIntervalValue: 1, defaultIntervalUnit: 'hours', sendEmailOnAlert: false, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date().toISOString() },
  {
    id: 'mon-3',
    name: 'Print Spooler Service Monitor',
    description: 'Checks if the Print Spooler service is running.',
    scriptType: 'PowerShell',
    scriptContent: '\\$serviceName = "Spooler"\nif ((Get-Service -Name \\$serviceName -ErrorAction SilentlyContinue).Status -eq "Running") { \n    "OK: Service \\$serviceName is running." \n} else { \n    "ALERT: Service \\$serviceName is NOT running." \n}',
    defaultIntervalValue: 15,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mon-4',
    name: 'Google DNS Ping Monitor',
    description: 'Pings Google DNS (8.8.8.8) to check external connectivity.',
    scriptType: 'CMD',
    scriptContent: 'ping -n 1 8.8.8.8 | find "TTL=" > nul\\nif errorlevel 1 (\\n    echo ALERT: 8.8.8.8 is NOT reachable.\\n) else (\\n    echo OK: 8.8.8.8 is reachable.\\n)',
    defaultIntervalValue: 30,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mon-5',
    name: 'Pending Reboot Check',
    description: 'Checks if the system has a pending reboot state.',
    scriptType: 'PowerShell',
    scriptContent: '\\$RebootRequired = \\$false\n# Component-Based Servicing kontrolü\nif (Test-Path "HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Component Based Servicing\\\\RebootPending") { \\$RebootRequired = \\$true }\n# Windows Update kontrolü\nif (Test-Path "HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\WindowsUpdate\\\\Auto Update\\\\RebootRequired") { \\$RebootRequired = \\$true }\n\nif (\\$RebootRequired) { \n    "ALERT: System requires a reboot." \n} else { \n    "OK: No pending reboot found." \n}',
    defaultIntervalValue: 4,
    defaultIntervalUnit: 'hours',
    sendEmailOnAlert: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
   {
    id: 'mon-6',
    name: 'Uygulama Kurulum/Kaldırma İzleyicisi',
    description: "Yeni uygulama kurulumlarını veya kaldırılmalarını tespit eder ve uyarı gönderir. (Simüle edilmiş)",
    scriptType: 'PowerShell',
    scriptContent: '# BU SCRIPT SİMÜLASYON AMAÇLIDIR.\\n# Gerçek dünyada uygulama kurulum/kaldırma tespiti karmaşıktır ve\\n# sistem olay günlüklerinin veya diğer gelişmiş tekniklerin izlenmesini gerektirir.\\n\\n\\$detectionChance = Get-Random -Minimum 1 -Maximum 100\\n\\$installedApps = @("Microsoft Office Pro", "Adobe Photoshop", "Google Chrome", "Mozilla Firefox", "VLC Player", "7-Zip Archiver", "Notepad++ Editor")\\n\\$appName = \\$installedApps[(Get-Random -Maximum \\$installedApps.Count)]\\n\\$action = @("kuruldu", "kaldırıldı")[(Get-Random -Maximum 2)]\\n\\nif (\\$detectionChance -le 15) { # %15 ihtimalle bir şey "tespit et"\\n    "ALERT: Simüle edilmiş tespit - \'\$appName\' uygulaması yakın zamanda \\$action."\\n} else {\\n    "OK: Yeni uygulama kurulumu veya kaldırılması tespit edilmedi (simüle edilmiş)."\\n}',
    defaultIntervalValue: 60,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mon-7',
    name: 'Başarısız RDP Giriş Denemeleri İzleyicisi',
    description: "Kısa bir süre içinde belirli bir eşiği aşan başarısız RDP (Uzak Masaüstü Bağlantısı) giriş denemelerini (Olay ID 4625) izler. Eşik ve zaman aralığı script içinde ayarlanabilir. Not: Bu monitör için Group Policy'de 'Oturum Açma Olaylarını Denetle' (Başarılı ve Başarısız) ayarının (Bilgisayar Yapılandırması -> Windows Ayarları -> Güvenlik Ayarları -> Gelişmiş Denetim İlkesi Yapılandırması -> Oturum Açma/Kapatma) etkinleştirilmiş olması gerekir.",
    scriptType: 'PowerShell',
    scriptContent: 'param(\\n    [int]\\$AttemptThreshold = 5,  # Kaç denemeden sonra uyarı verilsin\\n    [int]\\$TimeWindowMinutes = 10 # Son kaç dakika içindeki denemeler sayılsın\\n)\\n\\n\\$startTime = (Get-Date).AddMinutes(-\\$TimeWindowMinutes)\\n\\ntry {\\n    # LogonType 10 for RemoteInteractive (RDP)\\n    # EventData\\\'dan LogonType\\\'ı filtrelemek Get-WinEvent\\\'in FilterHashtable\\\'ında doğrudan zor olabilir,\\n    # bu yüzden sonuçları aldıktan sonra filtreliyoruz.\\n    \\$failedLogons = Get-WinEvent -FilterHashtable @{\\n        LogName = \\\'Security\\\';\\n        ID = 4625; # Başarısız Oturum Açma\\n        StartTime = \\$startTime\\n    } -ErrorAction SilentlyContinue | Where-Object { \$\_.Properties[8].Value -eq 10 } # Properties[8] genellikle LogonType\\\'dır 4625 için\\n\\n    if (\\$failedLogons.Count -ge \\$AttemptThreshold) {\\n        "ALERT: Son \\$TimeWindowMinutes dakika içinde \$(\\$failedLogons.Count) adet başarısız RDP giriş denemesi tespit edildi (Eşik: \\$AttemptThreshold). Olası kaba kuvvet saldırısı."\\n    } else {\\n        "OK: Son \\$TimeWindowMinutes dakika içinde \$(\\$failedLogons.Count) adet başarısız RDP giriş denemesi (Eşik: \\$AttemptThreshold)."\\n    }\\n} catch {\\n    "ERROR: Olay günlükleri sorgulanamadı. İzinleri ve günlük kullanılabilirliğini kontrol edin. Hata: \$(\$_.Exception.Message)"\\n}',
    defaultIntervalValue: 15,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export let mockMonitorExecutionLogs: MonitorExecutionLog[] = [
  { id: 'log-1', monitorId: 'mon-1', computerId: 'comp-1', computerName: 'Workstation-Dev-01', timestamp: new Date(Date.now() - 60000 * 5).toISOString(), status: 'OK', message: 'OK: CPU Usage Normal', notified: false },
  { id: 'log-2', monitorId: 'mon-1', computerId: 'comp-2', computerName: 'Server-Prod-Main', timestamp: new Date(Date.now() - 60000 * 10).toISOString(), status: 'ALERT', message: 'ALERT: CPU Usage High - 92%', notified: true },
  { id: 'log-3', monitorId: 'mon-2', computerId: 'comp-1', computerName: 'Workstation-Dev-01', timestamp: new Date(Date.now() - 60000 * 15).toISOString(), status: 'OK', message: 'OK: Disk space sufficient', notified: false },
];

export let mockCustomCommands: CustomCommand[] = [
  { id: 'cmd-1', targetId: 'comp-1', targetType: 'computer', command: 'ipconfig /all', scriptType: 'CMD', runAsUser: false, status: 'Success', output: 'Windows IP Configuration...', executedAt: new Date(Date.now() - 3600000).toISOString(), computerId: 'comp-1' },
  { id: 'cmd-2', targetId: 'group-1', targetType: 'group', command: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5', scriptType: 'PowerShell', runAsUser: false, status: 'Sent', executedAt: new Date().toISOString(), computerId: 'group-1' },
];

export let mockSmtpSettings: SMTPSettings = {
  server: 'smtp.example.com',
  port: 587,
  username: 'user@example.com',
  password: 'password123',
  secure: true,
  fromEmail: 'noreply@example.com',
  defaultToEmail: 'admin@example.com',
};

export let mockAiSettings: AiSettings = {
  globalGenerationEnabled: true,
  providerConfigs: [
    {
      id: 'default-google-ai',
      name: 'Default Google AI',
      providerType: 'googleAI',
      apiKey: '',
      isEnabled: true,
      isDefault: true,
    }
  ],
};

const thirtyDaysFromNow = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const sixtyDaysFromNow = () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
const ninetyDaysAgo = () => new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
const fiveDaysFromNow = () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

export let mockLicenses: License[] = [
  { id: 'lic-1', productName: 'Microsoft Office 2021 Pro', quantity: 50, licenseTerm: 'Lifetime', enableExpiryDate: false, expiryDate: null, isActive: true, purchaseDate: ninetyDaysAgo(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), websitePanelAddress: 'https://office.com/setup', sendExpiryNotification: false, notificationDaysBefore: 30 },
  { id: 'lic-2', productName: 'Adobe Photoshop CC', quantity: 10, licenseTerm: 'Annual', enableExpiryDate: true, expiryDate: thirtyDaysFromNow(), isActive: true, purchaseDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: "Auto-renewal active via procurement.", sendExpiryNotification: true, notificationDaysBefore: 30 },
  { id: 'lic-3', productName: 'JetBrains IntelliJ IDEA Ultimate', quantity: 5, licenseTerm: 'Annual', enableExpiryDate: true, expiryDate: sixtyDaysFromNow(), isActive: true, purchaseDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), websitePanelAddress: 'https://account.jetbrains.com', sendExpiryNotification: true, notificationDaysBefore: 15 },
  { id: 'lic-4', productName: 'WinRAR Archiver', quantity: 100, licenseTerm: 'Lifetime', enableExpiryDate: false, expiryDate: null, isActive: false, purchaseDate: new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: "Company wide old license, replaced by 7-Zip.", sendExpiryNotification: false, notificationDaysBefore: 30 },
  { id: 'lic-5', productName: 'Zoom Pro Monthly', quantity: 20, licenseTerm: 'Monthly', enableExpiryDate: true, expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), isActive: true, purchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sendExpiryNotification: true, notificationDaysBefore: 7 },
  { id: 'lic-6', productName: 'Acme VPN Client', quantity: 25, licenseTerm: 'Annual', enableExpiryDate: true, expiryDate: fiveDaysFromNow(), isActive: true, purchaseDate: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: "Test for near expiry.", sendExpiryNotification: true, notificationDaysBefore: 3 },
];


// --- Helper Functions for Mock Data ---

export const getComputers = (): Computer[] => {
  return mockComputers.map(c => {
    if (c.status === 'Online') {
      return {
        ...c,
        cpuUsage: c.cpuUsage !== undefined ? c.cpuUsage : Math.floor(Math.random() * 70) + 5,
        ramUsage: c.ramUsage !== undefined ? c.ramUsage : Math.floor(Math.random() * 60) + 20,
        diskUsage: c.diskUsage || (Math.floor(Math.random() * 50) + 10),
        lastSeen: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString()
      };
    }
    return c;
  }).sort((a, b) => a.name.localeCompare(b.name));
};
export const getComputerById = (id: string): Computer | undefined => {
    const computer = mockComputers.find(c => c.id === id);
    if (computer) {
      const onlineUpdate = computer.status === 'Online' ? {
        cpuUsage: computer.cpuUsage !== undefined ? computer.cpuUsage : Math.floor(Math.random() * 70) + 5,
        ramUsage: computer.ramUsage !== undefined ? computer.ramUsage : Math.floor(Math.random() * 60) + 20,
        lastSeen: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString()
      } : {};
      return { ...computer, ...onlineUpdate };
    }
    return undefined;
};
export const addComputer = (computerData: Omit<Computer, 'id' | 'lastSeen' | 'groupIds'>): Computer => {
  const newComputer: Computer = {
    ...computerData,
    id: `comp-${Date.now()}`,
    lastSeen: new Date().toISOString(),
    groupIds: [],
  };
  mockComputers = [...mockComputers, newComputer];
  return newComputer;
};
export const updateComputer = (id: string, updates: Partial<Computer>): Computer | undefined => {
  let updatedComputer: Computer | undefined;
  mockComputers = mockComputers.map(c => {
    if (c.id === id) {
      updatedComputer = { ...c, ...updates, updatedAt: new Date().toISOString() } as unknown as Computer; // Assuming Computer type has updatedAt
      return updatedComputer;
    }
    return c;
  });
  return updatedComputer;
}
export const deleteComputer = (id: string): boolean => {
    const initialLength = mockComputers.length;
    mockComputers = mockComputers.filter(c => c.id !== id);
    mockComputerGroups = mockComputerGroups.map(g => ({
        ...g,
        computerIds: g.computerIds.filter(compId => compId !== id)
    }));
    mockProcedureExecutions = mockProcedureExecutions.filter(exec => exec.computerId !== id);
    mockMonitorExecutionLogs = mockMonitorExecutionLogs.filter(log => log.computerId !== id);
    mockCustomCommands = mockCustomCommands.filter(cmd => cmd.targetType === 'computer' && cmd.targetId !==id);
    return mockComputers.length < initialLength;
}

export const getGroups = (): ComputerGroup[] => mockComputerGroups.sort((a,b) => a.name.localeCompare(b.name));
export const getGroupById = (id: string): ComputerGroup | undefined => mockComputerGroups.find(g => g.id === id);

export const addComputerGroup = (groupData: Omit<ComputerGroup, 'id'>): ComputerGroup => {
  const newGroup: ComputerGroup = {
    ...groupData,
    id: `group-${Date.now()}`,
    associatedProcedures: groupData.associatedProcedures || [],
    associatedMonitors: groupData.associatedMonitors || [],
  };
  mockComputerGroups = [...mockComputerGroups, newGroup];
  newGroup.computerIds.forEach(compId => {
    const comp = getComputerById(compId);
    if (comp && !comp.groupIds?.includes(newGroup.id)) {
      updateComputer(compId, { groupIds: [...(comp.groupIds || []), newGroup.id] });
    }
    triggerAutomatedProceduresForNewMember(compId, newGroup.id);
  });
  return newGroup;
};

export const updateComputerGroup = (id: string, updates: Partial<Omit<ComputerGroup, 'id'>>): ComputerGroup | undefined => {
  let updatedGroup: ComputerGroup | undefined;
  const oldGroupIndex = mockComputerGroups.findIndex(g => g.id === id);
  if (oldGroupIndex === -1) return undefined;

  const oldGroup = { ...mockComputerGroups[oldGroupIndex] };

  updatedGroup = { ...oldGroup, ...updates };
  mockComputerGroups[oldGroupIndex] = updatedGroup;

  const oldComputerIdsSet = new Set(oldGroup.computerIds);
  const newComputerIdsSet = new Set(updatedGroup.computerIds);

  oldGroup.computerIds.forEach(compId => {
    if (!newComputerIdsSet.has(compId)) {
      const comp = getComputerById(compId);
      if (comp) {
        updateComputer(compId, { groupIds: (comp.groupIds || []).filter(gid => gid !== id) });
      }
    }
  });

  updatedGroup.computerIds.forEach(compId => {
    if (!oldComputerIdsSet.has(compId)) {
      const comp = getComputerById(compId);
      if (comp && !(comp.groupIds || []).includes(id)) {
        updateComputer(compId, { groupIds: [...(comp.groupIds || []), id] });
      }
      if (comp && !oldGroup.computerIds.includes(compId)) {
        triggerAutomatedProceduresForNewMember(compId, updatedGroup!.id);
      }
    }
  });
  return updatedGroup;
};

export const deleteComputerGroup = (id: string): boolean => {
  const initialLength = mockComputerGroups.length;
  mockComputerGroups = mockComputerGroups.filter(g => g.id !== id);
  mockComputers = mockComputers.map(c => ({
    ...c,
    groupIds: c.groupIds?.filter(gid => gid !== id)
  }));
  return mockComputerGroups.length < initialLength;
};

export const getProcedures = (): Procedure[] => mockProcedures.sort((a,b) => a.name.localeCompare(b.name));
export const getProcedureById = (id: string): Procedure | undefined => mockProcedures.find(p => p.id === id);

export const addProcedure = (
  procData: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'> & { procedureSystemType: ProcedureSystemType }
): Procedure => {
  let finalScriptContent = procData.scriptContent;
  let finalScriptType: ScriptType = procData.scriptType || 'PowerShell'; 
  let finalRunAsUser = procData.runAsUser || false;
  let finalSoftwareUpdateMode = procData.softwareUpdateMode;
  let finalSpecificSoftware = procData.specificSoftwareToUpdate;
  let finalWindowsUpdateScope = procData.windowsUpdateScope;

  if (procData.procedureSystemType === 'WindowsUpdate') {
    finalScriptContent = windowsUpdateScriptContent; // Standard script for all Windows Update scopes in mock
    finalScriptType = 'PowerShell';
    finalRunAsUser = false;
    finalWindowsUpdateScope = procData.windowsUpdateScope || 'all'; // Default to 'all' if not specified
  } else if (procData.procedureSystemType === 'SoftwareUpdate') {
    finalScriptType = 'PowerShell';
    finalRunAsUser = false;
    finalSoftwareUpdateMode = procData.softwareUpdateMode || 'all'; 
    finalSpecificSoftware = procData.specificSoftwareToUpdate || '';
    if (finalSoftwareUpdateMode === 'all') {
      finalScriptContent = softwareUpdateWingetScriptContentAll;
      finalSpecificSoftware = ''; 
    } else {
      finalScriptContent = softwareUpdateWingetScriptSpecific(finalSpecificSoftware);
    }
  } else { // CustomScript
     finalScriptType = procData.scriptType; 
     finalScriptContent = procData.scriptContent;
     finalRunAsUser = procData.runAsUser || false;
  }

  const newProcedure: Procedure = {
    name: procData.name,
    description: procData.description,
    scriptType: finalScriptType,
    scriptContent: finalScriptContent,
    runAsUser: finalRunAsUser,
    procedureSystemType: procData.procedureSystemType,
    windowsUpdateScope: finalWindowsUpdateScope,
    softwareUpdateMode: finalSoftwareUpdateMode,
    specificSoftwareToUpdate: finalSpecificSoftware,
    id: `proc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockProcedures = [...mockProcedures, newProcedure];
  return newProcedure;
};

export const updateProcedureInMock = (id: string, updates: Partial<Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>>): Procedure | undefined => {
  let updatedProcedure: Procedure | undefined;
  mockProcedures = mockProcedures.map(p => {
    if (p.id === id) {
      let newSoftwareUpdateMode = updates.softwareUpdateMode ?? p.softwareUpdateMode;
      let newSpecificSoftware = updates.specificSoftwareToUpdate ?? p.specificSoftwareToUpdate;
      let newScriptContent = updates.scriptContent ?? p.scriptContent;
      let newWindowsUpdateScope = updates.windowsUpdateScope ?? p.windowsUpdateScope;

      if (p.procedureSystemType === 'WindowsUpdate') {
         updatedProcedure = { 
           ...p, 
           name: updates.name || p.name,
           description: updates.description || p.description,
           windowsUpdateScope: newWindowsUpdateScope || 'all', // Ensure scope is set
           // scriptContent remains windowsUpdateScriptContent for mock simplicity
           updatedAt: new Date().toISOString() 
         };
      } else if (p.procedureSystemType === 'SoftwareUpdate') {
          newSoftwareUpdateMode = updates.softwareUpdateMode || p.softwareUpdateMode || 'all';
          newSpecificSoftware = updates.specificSoftwareToUpdate || p.specificSoftwareToUpdate || '';
          if (newSoftwareUpdateMode === 'all') {
              newScriptContent = softwareUpdateWingetScriptContentAll;
              newSpecificSoftware = '';
          } else {
              newScriptContent = softwareUpdateWingetScriptSpecific(newSpecificSoftware);
          }
          updatedProcedure = {
            ...p,
            name: updates.name || p.name,
            description: updates.description || p.description,
            softwareUpdateMode: newSoftwareUpdateMode,
            specificSoftwareToUpdate: newSpecificSoftware,
            scriptContent: newScriptContent, 
            updatedAt: new Date().toISOString()
          };
      } else { // CustomScript
         updatedProcedure = { 
           ...p, 
           ...updates, 
           runAsUser: updates.runAsUser ?? p.runAsUser ?? false, 
           updatedAt: new Date().toISOString() 
         };
      }
      return updatedProcedure;
    }
    return p;
  });
  return updatedProcedure;
};

export const deleteProcedureFromMock = (id: string): boolean => {
  const initialLength = mockProcedures.length;
  mockProcedures = mockProcedures.filter(p => p.id !== id);
  mockComputerGroups = mockComputerGroups.map(g => ({
    ...g,
    associatedProcedures: g.associatedProcedures?.filter(ap => ap.procedureId !== id)
  }));
  mockProcedureExecutions = mockProcedureExecutions.filter(exec => exec.procedureId !== id);
  return mockProcedures.length < initialLength;
};

export const getExecutions = (filters?: { procedureId?: string; computerId?: string }): ProcedureExecution[] => {
  let results = mockProcedureExecutions;
  if (filters?.procedureId) {
    results = results.filter(e => e.procedureId === filters.procedureId);
  }
  if (filters?.computerId) {
    results = results.filter(e => e.computerId === filters.computerId);
  }
  return results.sort((a,b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
};

export const getProcedureExecutionsForProcedure = (procedureId: string): ProcedureExecution[] => {
  return mockProcedureExecutions
    .filter(e => e.procedureId === procedureId)
    .sort((a,b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
}

export const addProcedureExecution = (executionData: Omit<ProcedureExecution, 'id' | 'computerName'>): ProcedureExecution => {
  const computer = getComputerById(executionData.computerId);
  const procedure = getProcedureById(executionData.procedureId);
  const runContext = executionData.runAsUser ?? procedure?.runAsUser ?? false;
  
  let logs = `Executing "${procedure?.name || 'Unknown Procedure'}" on "${computer?.name || executionData.computerId}" (as ${runContext ? 'User' : 'SYSTEM'}).`;
  if (procedure?.procedureSystemType === 'WindowsUpdate') {
    logs += `\nWindows Update Scope: ${procedure.windowsUpdateScope || 'all'}.`;
  } else if (procedure?.procedureSystemType === 'SoftwareUpdate') {
    logs += `\nSoftware Update Mode: ${procedure.softwareUpdateMode || 'all'}.`;
    if (procedure.softwareUpdateMode === 'specific') {
      logs += `\nTargeted software: ${procedure.specificSoftwareToUpdate || "None specified"}.`;
    }
  } else {
     logs += `\nCustom Script: ${procedure?.scriptContent.substring(0, 50)}...`;
  }
  logs += `\n${executionData.logs || ''}`;


  const newExecution: ProcedureExecution = {
    ...executionData,
    id: `exec-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    computerName: computer?.name || executionData.computerId,
    startTime: executionData.startTime || new Date().toISOString(),
    status: executionData.status || 'Pending',
    runAsUser: runContext,
    logs: logs,
  };
  mockProcedureExecutions = [newExecution, ...mockProcedureExecutions];

  if (newExecution.status === 'Pending') {
    setTimeout(() => {
        const finalStatus = Math.random() > 0.3 ? 'Success' : 'Failed';
        newExecution.status = finalStatus;
        newExecution.endTime = new Date().toISOString();
        newExecution.logs += `\nExecution finished with status: ${finalStatus}`;
        
        let mockOutput = finalStatus === 'Success' ? 'Mock output: Operation completed successfully.' : 'Mock output: Operation failed.';
        if (procedure?.procedureSystemType === 'WindowsUpdate') {
            mockOutput = finalStatus === 'Success' ? `Mock output: Windows Updates (Scope: ${procedure.windowsUpdateScope || 'all'}) installed.` : `Mock output: Windows Update (Scope: ${procedure.windowsUpdateScope || 'all'}) failed.`;
        } else if (procedure?.procedureSystemType === 'SoftwareUpdate') {
            if (procedure.softwareUpdateMode === 'specific') {
                 mockOutput = finalStatus === 'Success' ? `Mock output: Specified software update process completed for: ${procedure.specificSoftwareToUpdate || "N/A"}` : 'Mock output: Specified software update process failed.';
            } else {
                 mockOutput = finalStatus === 'Success' ? `Mock output: All applicable software updated via winget.` : 'Mock output: Winget update all process failed.';
            }
        }
        newExecution.output = mockOutput;
        mockProcedureExecutions = mockProcedureExecutions.map(e => e.id === newExecution.id ? newExecution : e);
    }, 1500 + Math.random() * 2500);
  }
  return newExecution;
};
export const executeMockProcedure = (procedureId: string, computerIds: string[]): ProcedureExecution[] => {
    const executions: ProcedureExecution[] = [];
    const proc = getProcedureById(procedureId);
    if (!proc) return executions;

    computerIds.forEach(compId => {
        const computer = getComputerById(compId);
        if (computer && computer.status === 'Online') {
            const exec = addProcedureExecution({
                procedureId,
                computerId: compId,
                status: 'Pending',
                logs: ``, // Initial log message will be constructed in addProcedureExecution
                startTime: new Date().toISOString(),
                runAsUser: proc.runAsUser
            });
            executions.push(exec);
        }
    });
    return executions;
}

export const getMonitors = (): Monitor[] => mockMonitors.sort((a,b) => a.name.localeCompare(b.name));
export const getMonitorById = (id: string): Monitor | undefined => mockMonitors.find(m => m.id === id);
export const addMonitorToMock = (monitorData: Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>): Monitor => {
  const newMonitor: Monitor = {
    ...monitorData,
    id: `mon-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockMonitors = [...mockMonitors, newMonitor];
  return newMonitor;
};
export const updateMonitorInMock = (id: string, updates: Partial<Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>>): Monitor | undefined => {
  let updatedMonitor: Monitor | undefined;
  mockMonitors = mockMonitors.map(m => {
    if (m.id === id) {
      updatedMonitor = { ...m, ...updates, updatedAt: new Date().toISOString() };
      return updatedMonitor;
    }
    return m;
  });
  return updatedMonitor;
};
export const deleteMonitorFromMock = (id: string): boolean => {
  const initialLength = mockMonitors.length;
  mockMonitors = mockMonitors.filter(m => m.id !== id);
  mockComputerGroups = mockComputerGroups.map(g => ({
    ...g,
    associatedMonitors: g.associatedMonitors?.filter(am => am.monitorId !== id)
  }));
  mockMonitorExecutionLogs = mockMonitorExecutionLogs.filter(log => log.monitorId !== id);
  return mockMonitors.length < initialLength;
};

export const getMonitorLogs = (): MonitorExecutionLog[] => mockMonitorExecutionLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
export const addMonitorLog = (logData: Omit<MonitorExecutionLog, 'id' | 'computerName'>): MonitorExecutionLog => {
  const computer = getComputerById(logData.computerId);
  const newLog: MonitorExecutionLog = {
    ...logData,
    id: `mlog-${Date.now()}`,
    computerName: computer?.name || logData.computerId,
    timestamp: new Date().toISOString(),
    notified: logData.status === 'ALERT' ? mockSmtpSettings.fromEmail && mockSmtpSettings.defaultToEmail : false,
  };
  mockMonitorExecutionLogs = [newLog, ...mockMonitorExecutionLogs];
  if (mockMonitorExecutionLogs.length > 200) {
    mockMonitorExecutionLogs = mockMonitorExecutionLogs.slice(0, 200);
  }
  return newLog;
};

export const getCommandHistory = (): CustomCommand[] => {
  mockCustomCommands.forEach(cmd => {
    if (cmd.status === 'Sent' && Math.random() < 0.2) {
      cmd.status = Math.random() < 0.7 ? 'Success' : 'Failed';
      cmd.output = cmd.status === 'Success' ? `Mock Success: ${cmd.command}` : `Mock Fail: ${cmd.command}`;
    }
  });
  return mockCustomCommands.sort((a,b) => new Date(b.executedAt || 0).getTime() - new Date(a.executedAt || 0).getTime());
}

export const addCustomCommand = (commandData: Omit<CustomCommand, 'id' | 'executedAt' | 'status' | 'output'> & { targetId: string; targetType: 'computer' | 'group'} ): CustomCommand | CustomCommand[] => {
  const baseCommand: Omit<CustomCommand, 'id' | 'computerId'> = {
    ...commandData,
    executedAt: new Date().toISOString(),
    status: 'Sent',
    runAsUser: commandData.runAsUser || false,
  };

  if (commandData.targetType === 'group') {
    const group = getGroupById(commandData.targetId);
    if (!group) throw new Error('Group not found');

    const commandsSent: CustomCommand[] = [];
    group.computerIds.forEach(compId => {
        const computer = getComputerById(compId);
        if (computer && computer.status === 'Online') {
            const newCommand: CustomCommand = {
                ...baseCommand,
                id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                computerId: compId,
                targetId: group.id,
                targetType: 'group'
            };
            mockCustomCommands = [newCommand, ...mockCustomCommands];
            commandsSent.push(newCommand);
        }
    });
     if (commandsSent.length === 0 && group.computerIds.length > 0) {
         const groupSendCommand: CustomCommand = {
            ...baseCommand,
            id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            computerId: group.id, 
            targetId: group.id,
            targetType: 'group',
            status: 'Sent',
            output: "Command sent to group, but no online members found to execute immediately."
        };
        mockCustomCommands = [groupSendCommand, ...mockCustomCommands];
        return [groupSendCommand];
    }
    return commandsSent;

  } else {
    const computer = getComputerById(commandData.targetId);
    if (!computer) throw new Error('Computer not found');
    if (computer.status !== 'Online') throw new Error('Computer is offline. Command cannot be sent.');

    const newCommand: CustomCommand = {
        ...baseCommand,
        id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        computerId: commandData.targetId,
        targetId: commandData.targetId,
        targetType: 'computer'
    };
    mockCustomCommands = [newCommand, ...mockCustomCommands];
    return newCommand;
  }
};

export const getSmtpSettings = (): SMTPSettings => mockSmtpSettings;
export const saveSmtpSettings = (settings: SMTPSettings): SMTPSettings => {
  mockSmtpSettings = { ...settings };
  return mockSmtpSettings;
};

export const getAiSettings = (): AiSettings => {
  if (!mockAiSettings.providerConfigs) {
    mockAiSettings.providerConfigs = [];
  }
  const hasDefault = mockAiSettings.providerConfigs.some(p => p.isDefault && p.isEnabled);
  if (!hasDefault) {
    const firstEnabled = mockAiSettings.providerConfigs.find(p => p.isEnabled);
    if (firstEnabled) {
      firstEnabled.isDefault = true;
    }
  }
  return mockAiSettings;
};

export const saveAiSettings = (settings: AiSettings): AiSettings => {
  let newProviderConfigs = [...(settings.providerConfigs || [])];
  let defaultProviderId: string | null = null;

  let explicitlySetDefaultExists = false;
  newProviderConfigs.forEach(p => {
    if (p.isDefault) {
      if (!explicitlySetDefaultExists) { 
        defaultProviderId = p.id;
        p.isEnabled = true; 
        explicitlySetDefaultExists = true;
      } else {
        p.isDefault = false; 
      }
    }
  });

  if (!defaultProviderId) {
    const firstEnabledProvider = newProviderConfigs.find(p => p.isEnabled);
    if (firstEnabledProvider) {
      firstEnabledProvider.isDefault = true;
      defaultProviderId = firstEnabledProvider.id;
      firstEnabledProvider.isEnabled = true; 
    }
  }

   if (!defaultProviderId && newProviderConfigs.length > 0) {
    newProviderConfigs[0].isDefault = true;
    newProviderConfigs[0].isEnabled = true;
    defaultProviderId = newProviderConfigs[0].id;
  }

  if (defaultProviderId) {
    newProviderConfigs = newProviderConfigs.map(p => ({
      ...p,
      isDefault: p.id === defaultProviderId,
      isEnabled: p.id === defaultProviderId ? true : p.isEnabled, 
    }));
  }


  mockAiSettings = {
    ...settings,
    providerConfigs: newProviderConfigs,
  };
  return mockAiSettings;
};


export const triggerAutomatedProceduresForNewMember = (computerId: string, groupId: string) => {
    const group = getGroupById(groupId);
    const computer = getComputerById(computerId);
    if (group && computer && group.associatedProcedures) {
        group.associatedProcedures.forEach(assocProc => {
            if (assocProc.runOnNewMember) {
                const procedure = getProcedureById(assocProc.procedureId);
                if (procedure && computer.status === 'Online') {
                    console.log(`AUTOMOCK: Triggering procedure "${procedure.name}" for new member "${computer.name}" in group "${group.name}" (as ${procedure.runAsUser ? 'User' : 'SYSTEM'})`);
                    addProcedureExecution({
                        procedureId: procedure.id,
                        computerId: computer.id,
                        status: 'Pending',
                        logs: `Automatically triggered: "${procedure.name}" for new member "${computer.name}" in group "${group.name}".`,
                        startTime: new Date().toISOString(),
                        runAsUser: procedure.runAsUser
                    });
                } else if (procedure && computer.status !== 'Online') {
                     console.log(`AUTOMOCK: Skipped procedure "${procedure.name}" for new offline member "${computer.name}" in group "${group.name}"`);
                }
            }
        });
    }
};

// --- License Management Mock Data & Functions ---
let notifiedLicenseIdsThisSession: Set<string> = new Set();

export const getLicenses = (): License[] => {
  const today = new Date();

  mockLicenses.forEach(lic => {
    if (lic.isActive && lic.enableExpiryDate && lic.expiryDate && lic.sendExpiryNotification && lic.notificationDaysBefore) {
      const expiryDate = new Date(lic.expiryDate);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= lic.notificationDaysBefore) {
        if (!notifiedLicenseIdsThisSession.has(lic.id)) {
          if (mockSmtpSettings.defaultToEmail) { 
            toast({
              title: "License Expiry Alert",
              description: `License "${lic.productName}" will expire in ${diffDays} day(s) (on ${expiryDate.toLocaleDateString()}). An email simulation to ${mockSmtpSettings.defaultToEmail} would occur. (Configured for ${lic.notificationDaysBefore} days before for this license).`,
              variant: "default", 
              duration: 10000, 
            });
          }
          notifiedLicenseIdsThisSession.add(lic.id); 
        }
      }
    }
  });
  return mockLicenses.sort((a, b) => a.productName.localeCompare(b.productName));
};


export const getLicenseById = (id: string): License | undefined => {
  return mockLicenses.find(lic => lic.id === id);
};

export const addLicenseToMock = (licenseData: Omit<License, 'id' | 'createdAt' | 'updatedAt'>): License => {
  const newLicense: License = {
    ...licenseData,
    id: `lic-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sendExpiryNotification: licenseData.sendExpiryNotification ?? false,
    notificationDaysBefore: licenseData.notificationDaysBefore ?? 30,
  };
  mockLicenses = [...mockLicenses, newLicense];
  notifiedLicenseIdsThisSession.clear(); 
  return newLicense;
};

export const updateLicenseInMock = (id: string, updates: Partial<Omit<License, 'id' | 'createdAt' | 'updatedAt'>>): License | undefined => {
  let updatedLicense: License | undefined;
  mockLicenses = mockLicenses.map(lic => {
    if (lic.id === id) {
      updatedLicense = {
        ...lic,
        ...updates,
        updatedAt: new Date().toISOString(),
        sendExpiryNotification: updates.sendExpiryNotification ?? lic.sendExpiryNotification,
        notificationDaysBefore: updates.notificationDaysBefore ?? lic.notificationDaysBefore,
      };
      return updatedLicense;
    }
    return lic;
  });
  notifiedLicenseIdsThisSession.clear(); 
  return updatedLicense;
};

export const deleteLicenseFromMock = (id: string): boolean => {
  const initialLength = mockLicenses.length;
  mockLicenses = mockLicenses.filter(lic => lic.id !== id);
  notifiedLicenseIdsThisSession.delete(id); 
  return mockLicenses.length < initialLength;
};

function simulateMonitorChecks() {
    // console.log("Simulating monitor checks for online computers...");
}

if (typeof window !== 'undefined') {
    // setInterval(simulateMonitorChecks, 30000); 
}

mockProcedures = mockProcedures.map(p => ({ 
    ...p, 
    runAsUser: p.runAsUser || false,
    procedureSystemType: p.procedureSystemType || 'CustomScript' 
}));

const proc4Index = mockProcedures.findIndex(p => p.id === 'proc-4');
if (proc4Index !== -1) {
    mockProcedures[proc4Index].procedureSystemType = 'WindowsUpdate';
    mockProcedures[proc4Index].windowsUpdateScope = mockProcedures[proc4Index].windowsUpdateScope || 'all';
    mockProcedures[proc4Index].scriptContent = windowsUpdateScriptContent; 
    mockProcedures[proc4Index].scriptType = 'PowerShell';
    mockProcedures[proc4Index].runAsUser = false;
    mockProcedures[proc4Index].description = mockProcedures[proc4Index].description || 'Installs Windows updates. Does not force a system reboot.';
}


mockCustomCommands = mockCustomCommands.map(c => ({...c, runAsUser: c.runAsUser || false }));
mockProcedureExecutions = mockProcedureExecutions.map(e => ({...e, runAsUser: e.runAsUser || false }));

    
