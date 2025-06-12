

export interface Computer {
  id: string;
  name: string;
  status: 'Online' | 'Offline' | 'Error';
  os: string;
  ipAddress: string;
  lastSeen: string; // ISO date string
  cpuUsage?: number; // Percentage
  ramUsage?: number; // Percentage
  diskUsage?: number; // Percentage
  groupIds?: string[];
}

export interface ScheduleConfig {
  type: 'disabled' | 'interval';
  intervalValue?: number;
  intervalUnit?: 'minutes' | 'hours' | 'days';
}

export interface AssociatedProcedureConfig {
  procedureId: string;
  runOnNewMember: boolean;
  schedule?: ScheduleConfig;
  // Order is implicit by its position in the array.
}

export interface AssociatedMonitorConfig {
  monitorId: string;
  schedule: ScheduleConfig; // Group-specific schedule for the monitor
  // sendEmailOnAlert is a property of the Monitor itself, not overridden per group for now.
}

export interface ComputerGroup {
  id: string;
  name: string;
  description: string;
  computerIds: string[];
  associatedProcedures?: AssociatedProcedureConfig[];
  associatedMonitors?: AssociatedMonitorConfig[];
}

export type ScriptType = 'CMD' | 'PowerShell' | 'Python';

export interface Procedure {
  id: string;
  name: string;
  description: string;
  scriptType: ScriptType;
  scriptContent: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ProcedureExecution {
  id: string;
  procedureId: string;
  computerId: string;
  computerName?: string; // For display convenience
  status: 'Pending' | 'Running' | 'Success' | 'Failed' | 'Cancelled';
  startTime?: string; // ISO date string
  endTime?: string; // ISO date string
  logs: string;
  output?: string;
}

export interface CustomCommand {
    id:string;
    computerId: string; // Will also be used for group if targetType is 'group'
    targetType?: 'computer' | 'group'; // To distinguish target
    targetId: string; // computerId or groupId
    command: string;
    scriptType: ScriptType;
    status: 'Pending' | 'Sent' | 'Success' | 'Failed';
    output?: string;
    executedAt?: string; // ISO date string
}

export interface Monitor {
  id: string;
  name: string;
  description: string;
  scriptType: ScriptType;
  scriptContent: string; // Script that outputs OK or ALERT (or specific values)
  defaultIntervalValue: number; // e.g., 5
  defaultIntervalUnit: 'minutes' | 'hours' | 'days'; // e.g., 'minutes'
  sendEmailOnAlert: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface MonitorExecutionLog {
  id: string;
  monitorId: string;
  computerId: string; // The computer this log pertains to (if group-associated)
  computerName?: string;
  timestamp: string; // ISO date string
  status: 'OK' | 'ALERT' | 'Error' | 'Running'; // Error if script fails, Running during check
  message: string; // Output from the script or status message
  notified?: boolean; // True if an email alert was sent (simulated)
}

export interface SMTPSettings {
  server: string;
  port: number;
  username?: string; // Optional
  password?: string; // Optional
  secure: boolean; // TLS/SSL
  fromEmail: string; // Email address to send from
  defaultToEmail: string; // Default recipient for alerts
}

export interface AiSettings {
  scriptGenerationEnabled: boolean;
  // apiKey?: string; // For future use if needed
  // defaultModel?: string; // For future use if needed
}
