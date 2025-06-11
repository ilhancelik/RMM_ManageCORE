
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand, Monitor, AssociatedMonitorConfig, SMTPSettings, MonitorExecutionLog } from '@/types';

// mockProcedureExecutions is now managed by API.
// export let mockProcedureExecutions: ProcedureExecution[] = [
//     {
//         id: 'exec-1',
//         procedureId: 'proc-1', 
//         computerId: 'comp-1', 
//         computerName: 'Workstation-01', 
//         status: 'Success',
//         startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
//         endTime: new Date(Date.now() - 3500 * 1000).toISOString(),
//         logs: 'Starting disk cleanup...\\nDisk cleanup successful.\\nRemoved 1.2GB of temp files.',
//         output: 'Success',
//     },
//     {
//         id: 'exec-2',
//         procedureId: 'proc-2', 
//         computerId: 'comp-2',
//         computerName: 'Server-Main',
//         status: 'Failed',
//         startTime: new Date(Date.now() - 7200 * 1000).toISOString(),
//         endTime: new Date(Date.now() - 7000 * 1000).toISOString(),
//         logs: 'Starting software installation...\\nFailed to install VideoLAN.VLC. Error code: 1603',
//         output: 'Error: 1603',
//     },
// ];


export let mockMonitorExecutionLogs: MonitorExecutionLog[] = [
  { 
    id: 'monlog-1', 
    monitorId: 'mon-1', // This ID will reference API-managed monitors
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


// Helper functions to manage mock data (those not yet migrated to API)
// addProcedureExecution is now managed by API.
// export function addProcedureExecution(execution: ProcedureExecution) {
//   mockProcedureExecutions.unshift(execution); 
// }


// Monitor Execution Log Functions
export function addMonitorExecutionLog(log: MonitorExecutionLog) {
  mockMonitorExecutionLogs.unshift(log);
}

// mockComputers, mockComputerGroups, mockProcedures, mockMonitors, smtpSettings,
// and their related helper functions (addComputerGroup, getProcedureById, etc.)
// have been removed as they are now fetched from/managed by the API.
// Custom commands mock data and functions were removed in a previous step.
