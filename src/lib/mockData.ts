
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand, Monitor, AssociatedMonitorConfig, SMTPSettings, MonitorExecutionLog } from '@/types';

export let mockComputers: Computer[] = [
  { id: 'comp-1', name: 'Workstation-01', status: 'Online', os: 'Windows 11 Pro', ipAddress: '192.168.1.101', lastSeen: new Date().toISOString(), cpuUsage: 25, ramUsage: 60, diskUsage: 40, groupIds: ['group-1'] },
  { id: 'comp-2', name: 'Server-Main', status: 'Online', os: 'Windows Server 2022', ipAddress: '192.168.1.10', lastSeen: new Date().toISOString(), cpuUsage: 10, ramUsage: 30, diskUsage: 20, groupIds: ['group-2'] },
  { id: 'comp-3', name: 'Laptop-Dev', status: 'Offline', os: 'Windows 10 Pro', ipAddress: '192.168.1.102', lastSeen: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), groupIds: ['group-1', 'group-3'] },
  { id: 'comp-4', name: 'Kiosk-Display', status: 'Error', os: 'Windows 10 IoT', ipAddress: '192.168.1.103', lastSeen: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), cpuUsage: 90, ramUsage: 95, diskUsage: 70 },
  { id: 'comp-5', name: 'Finance-PC', status: 'Online', os: 'Windows 11 Pro', ipAddress: '192.168.1.104', lastSeen: new Date().toISOString(), cpuUsage: 15, ramUsage: 45, diskUsage: 55, groupIds: ['group-2'] },
];

export let mockMonitors: Monitor[] = [
  {
    id: 'mon-1',
    name: 'New Admin Account Check',
    description: 'Checks if an unexpected admin account (e.g., "SuperAdmin") exists.',
    scriptType: 'PowerShell',
    scriptContent: 'if (Get-LocalUser -Name "SuperAdmin" -ErrorAction SilentlyContinue) { Write-Output "ALERT: New administrator account SuperAdmin found." } else { Write-Output "OK: No unexpected admin accounts." }',
    defaultIntervalValue: 1,
    defaultIntervalUnit: 'hours',
    sendEmailOnAlert: true,
    remediationProcedureId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mon-2',
    name: 'Low Disk Space (C: Drive)',
    description: 'Checks if free space on C: drive is below 10%.',
    scriptType: 'PowerShell',
    scriptContent: '$disk = Get-PSDrive C; $percentFree = ($disk.Free / ($disk.Used + $disk.Free)) * 100; if ($percentFree -lt 10) { Write-Output "ALERT: Low disk space on C: ($([math]::Round($percentFree, 2))% free)." } else { Write-Output "OK: Disk space C: ($([math]::Round($percentFree, 2))% free)." }',
    defaultIntervalValue: 30,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    remediationProcedureId: 'proc-1', // Example: Auto run disk cleanup
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mon-3',
    name: 'SQL Server Service Check',
    description: 'Checks if the MSSQLSERVER service is running.',
    scriptType: 'PowerShell',
    scriptContent: '$service = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue; if ($null -eq $service -or $service.Status -ne "Running") { Write-Output "ALERT: SQL Server (MSSQLSERVER) service is not running or not found. Status: $($service.Status)" } else { Write-Output "OK: SQL Server (MSSQLSERVER) is running." }',
    defaultIntervalValue: 5,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    remediationProcedureId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mon-4',
    name: 'Recent Server Restart Check',
    description: 'Checks if the server has restarted in the last 15 minutes.',
    scriptType: 'PowerShell',
    scriptContent: '$uptime = (Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime; if ($uptime.TotalMinutes -lt 15) { Write-Output "ALERT: Server restarted recently (uptime: $($uptime.ToString("hh\\:mm\\:ss")))." } else { Write-Output "OK: Server uptime normal ( $($uptime.ToString("d\\.\\.hh\\:mm\\:ss")) )." }',
    defaultIntervalValue: 15,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: false,
    remediationProcedureId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mon-perf-cpu',
    name: 'CPU Usage Monitor',
    description: 'Alerts if CPU usage is consistently above 95%.',
    scriptType: 'PowerShell',
    scriptContent: '$cpuUsage = (Get-Counter \'\\Processor(_Total)\\% Processor Time\' -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue; if ($cpuUsage -gt 95) { Write-Output "ALERT: CPU usage at $([math]::Round($cpuUsage, 0))%." } else { Write-Output "OK: CPU usage at $([math]::Round($cpuUsage, 0))%." }',
    defaultIntervalValue: 5,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    remediationProcedureId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mon-perf-ram',
    name: 'RAM Usage Monitor',
    description: 'Alerts if RAM usage is consistently above 95%.',
    scriptType: 'PowerShell',
    scriptContent: '$memory = Get-CimInstance Win32_OperatingSystem; $ramUsagePercent = (1 - ($memory.FreePhysicalMemory / $memory.TotalVisibleMemorySize)) * 100; if ($ramUsagePercent -gt 95) { Write-Output "ALERT: RAM usage at $([math]::Round($ramUsagePercent, 0))%." } else { Write-Output "OK: RAM usage at $([math]::Round($ramUsagePercent, 0))%." }',
    defaultIntervalValue: 5,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    remediationProcedureId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mon-perf-network',
    name: 'Network Usage Monitor',
    description: 'Alerts if network activity is consistently very high (simulated).',
    scriptType: 'PowerShell',
    scriptContent: '# This is a simplified check. Real network utilization monitoring is complex.\n$networkActivityScore = Get-Random -Minimum 0 -Maximum 100; # Simulated score\nif ($networkActivityScore -gt 95) { Write-Output "ALERT: High network activity detected (Simulated Score: $networkActivityScore)." } else { Write-Output "OK: Network activity normal (Simulated Score: $networkActivityScore)." }',
    defaultIntervalValue: 5,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    remediationProcedureId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export let mockComputerGroups: ComputerGroup[] = [
  { 
    id: 'group-1', 
    name: 'Development Team', 
    description: 'Computers used by the development team.', 
    computerIds: ['comp-1', 'comp-3'],
    associatedProcedures: [
      { procedureId: 'proc-1', runOnNewMember: true, schedule: { type: 'disabled' } }
    ],
    associatedMonitors: [
      { monitorId: 'mon-2', schedule: { type: 'interval', intervalValue: 45, intervalUnit: 'minutes' } },
      { monitorId: 'mon-perf-cpu', schedule: { type: 'interval', intervalValue: 5, intervalUnit: 'minutes' } }
    ]
  },
  { id: 'group-2', name: 'Servers', description: 'All production and staging servers.', computerIds: ['comp-2', 'comp-5'], 
    associatedProcedures: [
      { procedureId: 'proc-2', runOnNewMember: false, schedule: { type: 'interval', intervalValue: 2, intervalUnit: 'hours' } }
    ],
    associatedMonitors: [
      { monitorId: 'mon-3', schedule: { type: 'interval', intervalValue: 3, intervalUnit: 'minutes' } },
      { monitorId: 'mon-4', schedule: { type: 'interval', intervalValue: 10, intervalUnit: 'minutes' } },
      { monitorId: 'mon-perf-ram', schedule: { type: 'interval', intervalValue: 5, intervalUnit: 'minutes' } },
      { monitorId: 'mon-perf-network', schedule: { type: 'interval', intervalValue: 5, intervalUnit: 'minutes' } }
    ]
  },
  { id: 'group-3', name: 'Remote Workers', description: 'Laptops for remote employees.', computerIds: ['comp-3'], associatedProcedures: [], associatedMonitors: [] },
];

export let mockProcedures: Procedure[] = [
  {
    id: 'proc-1',
    name: 'Disk Cleanup',
    description: 'Runs standard disk cleanup utility.',
    scriptType: 'CMD',
    scriptContent: 'cleanmgr /sagerun:1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
  },
  {
    id: 'proc-2',
    name: 'Install Basic Software',
    description: 'Installs common software using PowerShell.',
    scriptType: 'PowerShell',
    scriptContent: 'winget install -e --id VideoLAN.VLC\nwinget install -e --id 7zip.7zip',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
  },
  {
    id: 'proc-3',
    name: 'Check Python Version',
    description: 'Verifies the installed Python version.',
    scriptType: 'Python',
    scriptContent: 'import sys\nprint(sys.version)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
  },
];

export let mockProcedureExecutions: ProcedureExecution[] = [
    {
        id: 'exec-1',
        procedureId: 'proc-1',
        computerId: 'comp-1',
        computerName: 'Workstation-01',
        status: 'Success',
        startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
        endTime: new Date(Date.now() - 3500 * 1000).toISOString(),
        logs: 'Starting disk cleanup...\nDisk cleanup successful.\nRemoved 1.2GB of temp files.',
        output: 'Success',
    },
    {
        id: 'exec-2',
        procedureId: 'proc-2',
        computerId: 'comp-2',
        computerName: 'Server-Main',
        status: 'Failed',
        startTime: new Date(Date.now() - 7200 * 1000).toISOString(),
        endTime: new Date(Date.now() - 7000 * 1000).toISOString(),
        logs: 'Starting software installation...\nFailed to install VideoLAN.VLC. Error code: 1603',
        output: 'Error: 1603',
    },
];

export let mockCustomCommands: CustomCommand[] = [];

export let smtpSettings: SMTPSettings | null = {
    server: 'smtp.example.com',
    port: 587,
    username: 'user@example.com',
    password: 'password123',
    secure: true,
    fromEmail: 'noreply@example.com',
    defaultToEmail: 'admin@example.com'
};

export let mockMonitorExecutionLogs: MonitorExecutionLog[] = [
  { 
    id: 'monlog-1', 
    monitorId: 'mon-3', 
    computerId: 'comp-2', 
    computerName: 'Server-Main', 
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(), 
    status: 'OK', 
    message: 'OK: SQL Server (MSSQLSERVER) is running.',
    notified: false
  },
  { 
    id: 'monlog-2', 
    monitorId: 'mon-3', 
    computerId: 'comp-2', 
    computerName: 'Server-Main', 
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(), 
    status: 'ALERT', 
    message: 'ALERT: SQL Server (MSSQLSERVER) service is not running. Status: Stopped',
    notified: true
  },
];


export const scriptTypes: ScriptType[] = ['CMD', 'Regedit', 'PowerShell', 'Python'];

// Monitor Functions
export function addMonitor(monitor: Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>): Monitor {
  const newMonitor: Monitor = {
    ...monitor,
    id: `mon-${Date.now()}`,
    remediationProcedureId: monitor.remediationProcedureId || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockMonitors.push(newMonitor);
  return newMonitor;
}

export function updateMonitor(updatedMonitor: Monitor): Monitor | null {
  const index = mockMonitors.findIndex(m => m.id === updatedMonitor.id);
  if (index !== -1) {
    mockMonitors[index] = { ...mockMonitors[index], ...updatedMonitor, updatedAt: new Date().toISOString() };
    return mockMonitors[index];
  }
  return null;
}

export function deleteMonitor(monitorId: string): boolean {
  const initialLength = mockMonitors.length;
  mockMonitors = mockMonitors.filter(m => m.id !== monitorId);
  // Also remove from group associations
  mockComputerGroups.forEach(group => {
    if (group.associatedMonitors) {
      group.associatedMonitors = group.associatedMonitors.filter(am => am.monitorId !== monitorId);
    }
  });
  return mockMonitors.length < initialLength;
}

export function getMonitorById(monitorId: string): Monitor | undefined {
  return mockMonitors.find(m => m.id === monitorId);
}

// SMTP Settings Functions
export function getSmtpSettings(): SMTPSettings | null {
  return smtpSettings;
}

export function saveSmtpSettings(settings: SMTPSettings): void {
  smtpSettings = settings;
}


// Helper functions to manage mock data
export function addComputer(computer: Omit<Computer, 'id' | 'lastSeen' | 'groupIds' | 'cpuUsage' | 'ramUsage' | 'diskUsage'>): Computer {
  const newComputer: Computer = {
    ...computer,
    id: `comp-${Date.now()}`,
    lastSeen: new Date().toISOString(),
    groupIds: [],
    // cpuUsage, ramUsage, diskUsage will be undefined by default
  };
  mockComputers.push(newComputer);
  return newComputer;
}

export function addProcedureExecution(execution: ProcedureExecution) {
  mockProcedureExecutions.unshift(execution);
}

export function updateComputerGroup(updatedGroup: ComputerGroup) {
  const index = mockComputerGroups.findIndex(g => g.id === updatedGroup.id);
  if (index !== -1) {
    mockComputerGroups[index] = { ...mockComputerGroups[index], ...updatedGroup };
  } else {
     mockComputerGroups.push(updatedGroup); // Should ideally not happen for update
  }
}

export function addComputerGroup(newGroup: ComputerGroup) {
    const existingIndex = mockComputerGroups.findIndex(g => g.id === newGroup.id);
    if (existingIndex === -1) {
        mockComputerGroups.push(newGroup);
    } else {
        mockComputerGroups[existingIndex] = newGroup; 
    }
}

export function addCustomCommand(command: CustomCommand) {
  mockCustomCommands.unshift(command);
}

export function updateCustomCommand(commandToUpdate: Partial<CustomCommand> & { id: string }) {
  mockCustomCommands = mockCustomCommands.map(cmd => 
    cmd.id === commandToUpdate.id ? { ...cmd, ...commandToUpdate } : cmd
  );
}


export function getComputerGroupById(groupId: string): ComputerGroup | undefined {
    return mockComputerGroups.find(g => g.id === groupId);
}
export function getProcedureById(procedureId: string): Procedure | undefined {
    return mockProcedures.find(p => p.id === procedureId);
}
export function getComputerById(computerId: string): Computer | undefined {
    return mockComputers.find(c => c.id === computerId);
}

// Monitor Execution Log Functions
export function addMonitorExecutionLog(log: MonitorExecutionLog) {
  mockMonitorExecutionLogs.unshift(log); // Add to the beginning for recent first
  // Optional: Trim logs if they exceed a certain number for mock data management
  // if (mockMonitorExecutionLogs.length > 100) {
  //   mockMonitorExecutionLogs = mockMonitorExecutionLogs.slice(0, 100);
  // }
}

// Function to simulate computer metric updates
export function updateMockComputerMetrics(): void {
  mockComputers.forEach(computer => {
    if (computer.status === 'Online') {
      computer.lastSeen = new Date().toISOString();

      // Simulate CPU usage fluctuation (e.g., +/- 5% from current or default 30%)
      let currentCpu = computer.cpuUsage === undefined ? 30 : computer.cpuUsage;
      currentCpu += Math.floor(Math.random() * 11) - 5; // Fluctuate by -5 to +5
      computer.cpuUsage = Math.max(5, Math.min(95, currentCpu)); // Keep within 5-95 range

      // Simulate RAM usage fluctuation
      let currentRam = computer.ramUsage === undefined ? 50 : computer.ramUsage;
      currentRam += Math.floor(Math.random() * 11) - 5;
      computer.ramUsage = Math.max(10, Math.min(90, currentRam));

      // Simulate Disk usage (less fluctuation)
      let currentDisk = computer.diskUsage === undefined ? 40 : computer.diskUsage;
      currentDisk += Math.floor(Math.random() * 3) - 1; // Fluctuate by -1 to +1
      computer.diskUsage = Math.max(10, Math.min(90, currentDisk));
    }
    // For Offline or Error computers, metrics (cpuUsage, ramUsage, diskUsage) are not updated
    // and should remain undefined to be displayed as "N/A".
  });
}
