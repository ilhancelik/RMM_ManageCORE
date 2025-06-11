
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand, Monitor, AssociatedMonitorConfig, SMTPSettings, MonitorExecutionLog } from '@/types';
import { fetchProcedures } from './apiClient'; // Added for getProcedureNameFromApi

// Computer data is managed by the API.

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
    // remediationProcedureId: 'proc-1', // This ID will now reference API-managed procedures
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mon-perf-network',
    name: 'Network Usage Monitor',
    description: 'Alerts if network activity is consistently very high (simulated).',
    scriptType: 'PowerShell',
    scriptContent: '# This is a simplified check. Real network utilization monitoring is complex.\\n$networkActivityScore = Get-Random -Minimum 0 -Maximum 100; # Simulated score\\nif ($networkActivityScore -gt 95) { Write-Output "ALERT: High network activity detected (Simulated Score: $networkActivityScore)." } else { Write-Output "OK: Network activity normal (Simulated Score: $networkActivityScore)." }',
    defaultIntervalValue: 5,
    defaultIntervalUnit: 'minutes',
    sendEmailOnAlert: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Group data is managed by the API.

// Procedure data is now managed by the API.
// export let mockProcedures: Procedure[] = [ ... ];

export let mockProcedureExecutions: ProcedureExecution[] = [
    {
        id: 'exec-1',
        procedureId: 'proc-1', // This ID will reference API-managed procedures
        computerId: 'comp-1', 
        computerName: 'Workstation-01', // Name could be fetched or stored if API doesn't provide
        status: 'Success',
        startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
        endTime: new Date(Date.now() - 3500 * 1000).toISOString(),
        logs: 'Starting disk cleanup...\\nDisk cleanup successful.\\nRemoved 1.2GB of temp files.',
        output: 'Success',
    },
    {
        id: 'exec-2',
        procedureId: 'proc-2', // This ID will reference API-managed procedures
        computerId: 'comp-2',
        computerName: 'Server-Main',
        status: 'Failed',
        startTime: new Date(Date.now() - 7200 * 1000).toISOString(),
        endTime: new Date(Date.now() - 7000 * 1000).toISOString(),
        logs: 'Starting software installation...\\nFailed to install VideoLAN.VLC. Error code: 1603',
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
    // remediationProcedureId: monitor.remediationProcedureId || '',
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
  // ComputerGroups are now API managed, so this direct manipulation might be out of sync.
  // Consider how associated monitors are handled when a monitor is deleted if groups are API managed.
  // mockComputerGroups.forEach(group => {
  //   if (group.associatedMonitors) {
  //     group.associatedMonitors = group.associatedMonitors.filter(am => am.monitorId !== monitorId);
  //   }
  // });
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
export function addProcedureExecution(execution: ProcedureExecution) {
  mockProcedureExecutions.unshift(execution); // Still used for simulated executions
}

export function addCustomCommand(command: CustomCommand) {
  mockCustomCommands.unshift(command);
}

export function updateCustomCommand(commandToUpdate: Partial<CustomCommand> & { id: string }) {
  mockCustomCommands = mockCustomCommands.map(cmd => 
    cmd.id === commandToUpdate.id ? { ...cmd, ...commandToUpdate } : cmd
  );
}

// getComputerById, getGroupById, getProcedureById are now handled by apiClient.ts
// The following might still be used by parts of the UI that haven't been fully migrated
// or for components that need quick access to names from IDs for mock data.
// These should be phased out or adapted as more modules move to API.

// export function getProcedureById(procedureId: string): Procedure | undefined {
//   // This would now ideally fetch from API if needed globally,
//   // or components should manage their own data fetching.
//   // For now, it's removed as procedures list page fetches its own.
//   return undefined;
// }

// Monitor Execution Log Functions
export function addMonitorExecutionLog(log: MonitorExecutionLog) {
  mockMonitorExecutionLogs.unshift(log);
}
