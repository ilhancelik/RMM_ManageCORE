
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand, Monitor, AssociatedMonitorConfig, SMTPSettings, MonitorExecutionLog } from '@/types';

// All mock data related to computers, groups, procedures, monitors, smtp settings, custom commands,
// procedure executions, and monitor execution logs have been removed as these are now managed by the API.

export const scriptTypes: ScriptType[] = ['CMD', 'Regedit', 'PowerShell', 'Python'];

// Helper functions previously here for managing mock data are no longer needed
// as all dynamic data is intended to be fetched from/managed by the API.
