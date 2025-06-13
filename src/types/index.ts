
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
}

export interface AssociatedMonitorConfig {
  monitorId: string;
  schedule: ScheduleConfig;
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
  runAsUser?: boolean; // Added for procedure execution context
  createdAt: string;
  updatedAt: string;
}

export interface ProcedureExecution {
  id: string;
  procedureId: string;
  computerId: string;
  computerName?: string;
  status: 'Pending' | 'Running' | 'Success' | 'Failed' | 'Cancelled';
  startTime?: string;
  endTime?: string;
  logs: string;
  output?: string;
  runAsUser?: boolean; // To log how it was executed
}

export interface CustomCommand {
    id:string;
    computerId: string; // The specific computer a group command ran on, or the target computer.
    targetType?: 'computer' | 'group';
    targetId: string; // ID of the computer or group
    command: string;
    scriptType: ScriptType;
    runAsUser?: boolean;
    status: 'Pending' | 'Sent' | 'Success' | 'Failed';
    output?: string;
    executedAt?: string;
}

export interface Monitor {
  id: string;
  name: string;
  description: string;
  scriptType: ScriptType;
  scriptContent: string;
  defaultIntervalValue: number;
  defaultIntervalUnit: 'minutes' | 'hours' | 'days';
  sendEmailOnAlert: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonitorExecutionLog {
  id: string;
  monitorId: string;
  computerId: string;
  computerName?: string;
  timestamp: string;
  status: 'OK' | 'ALERT' | 'Error' | 'Running';
  message: string;
  notified?: boolean;
}

export interface SMTPSettings {
  server: string;
  port: number;
  username?: string;
  password?: string;
  secure: boolean;
  fromEmail: string;
  defaultToEmail: string;
}

export interface AiProviderConfig {
  id: string;
  name: string;
  providerType: 'googleAI'; // For now, only Google AI, can be expanded later
  apiKey?: string; // Optional, if not provided, Genkit might use env vars
  isEnabled: boolean;
  isDefault: boolean;
}

export interface AiSettings {
  globalGenerationEnabled: boolean;
  providerConfigs: AiProviderConfig[];
}
