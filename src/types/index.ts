
export interface Computer {
  id: string;
  name: string;
  status: 'Online' | 'Offline' | 'Error';
  os: string;
  ipAddress: string; // LAN IP
  lastSeen: string; // ISO date string
  cpuUsage?: number; // Percentage
  ramUsage?: number; // Percentage
  diskUsage?: number; // Percentage
  groupIds?: string[];
  model?: string;
  processor?: string;
  ramSize?: string; // e.g., "16 GB RAM"
  storage?: string; // e.g., "Micron 2450 NVMe 1024GB"
  graphicsCard?: string;
  serialNumber?: string;
  publicIpAddress?: string;
  macAddressLan?: string;
  macAddressWifi?: string;
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
export type ProcedureSystemType = 'CustomScript' | 'WindowsUpdate' | 'SoftwareUpdate';


export interface Procedure {
  id: string;
  name: string;
  description: string;
  scriptType: ScriptType; 
  scriptContent: string;
  runAsUser?: boolean;
  procedureSystemType?: ProcedureSystemType; 
  createdAt: string;
  updatedAt: string;
  // Fields specific to SoftwareUpdate procedures
  softwareUpdateMode?: 'all' | 'specific'; // 'all' or 'specific'
  specificSoftwareToUpdate?: string; // Comma-separated list of package IDs/names
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
  runAsUser?: boolean;
}

export interface CustomCommand {
    id:string;
    computerId: string; 
    targetType?: 'computer' | 'group';
    targetId: string; 
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
  providerType: 'googleAI'; 
  apiKey?: string; 
  isEnabled: boolean;
  isDefault: boolean;
}

export interface AiSettings {
  globalGenerationEnabled: boolean;
  providerConfigs: AiProviderConfig[];
}

// License Management Types
export type LicenseTerm = 'Lifetime' | 'Annual' | 'Monthly' | 'Other';

export const licenseTerms: LicenseTerm[] = ['Lifetime', 'Annual', 'Monthly', 'Other'];

export interface License {
  id: string;
  productName: string;
  quantity: number;
  websitePanelAddress?: string;
  licenseTerm: LicenseTerm;
  purchaseDate?: string | null; // ISO Date
  enableExpiryDate: boolean;
  expiryDate?: string | null; // ISO Date, null if enableExpiryDate is false or not set
  sendExpiryNotification?: boolean;
  notificationDaysBefore?: number; // e.g., 1-30 days
  notes?: string;
  isActive: boolean; 
  createdAt: string;
  updatedAt: string;
}
    
