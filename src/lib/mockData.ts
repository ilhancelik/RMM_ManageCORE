
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand, Monitor, AssociatedMonitorConfig, SMTPSettings, MonitorExecutionLog } from '@/types';

export let mockProcedureExecutions: ProcedureExecution[] = [
    {
        id: 'exec-1',
        procedureId: 'proc-1', // This ID will reference API-managed procedures
        computerId: 'comp-1', 
        computerName: 'Workstation-01', 
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

// SMTP settings are now managed by the API.
// export let smtpSettings: SMTPSettings | null = {
//     server: 'smtp.example.com',
//     port: 587,
//     username: 'user@example.com',
//     password: 'password123',
//     secure: true,
//     fromEmail: 'noreply@example.com',
//     defaultToEmail: 'admin@example.com'
// };

export let mockMonitorExecutionLogs: MonitorExecutionLog[] = [
  { 
    id: 'monlog-1', 
    monitorId: 'mon-1', 
    computerId: 'comp-2', 
    computerName: 'Server-Main', 
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(), 
    status: 'OK', 
    message: 'OK: SQL Server (MSSQLSERVER) is running.',
    notified: false
  },
  { 
    id: 'monlog-2', 
    monitorId: 'mon-1', 
    computerId: 'comp-2', 
    computerName: 'Server-Main', 
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(), 
    status: 'ALERT', 
    message: 'ALERT: SQL Server (MSSQLSERVER) service is not running. Status: Stopped',
    notified: true
  },
];

export const scriptTypes: ScriptType[] = ['CMD', 'Regedit', 'PowerShell', 'Python'];


// SMTP Settings Functions are now managed by API client.
// export function getSmtpSettings(): SMTPSettings | null {
//   return smtpSettings;
// }
// 
// export function saveSmtpSettings(settings: SMTPSettings): void {
//   smtpSettings = settings;
// }

// Helper functions to manage mock data (those not yet migrated to API)
export function addProcedureExecution(execution: ProcedureExecution) {
  mockProcedureExecutions.unshift(execution); 
}

export function addCustomCommand(command: CustomCommand) {
  mockCustomCommands.unshift(command);
}

export function updateCustomCommand(commandToUpdate: Partial<CustomCommand> & { id: string }) {
  mockCustomCommands = mockCustomCommands.map(cmd => 
    cmd.id === commandToUpdate.id ? { ...cmd, ...commandToUpdate } : cmd
  );
}

// Monitor Execution Log Functions
export function addMonitorExecutionLog(log: MonitorExecutionLog) {
  mockMonitorExecutionLogs.unshift(log);
}
