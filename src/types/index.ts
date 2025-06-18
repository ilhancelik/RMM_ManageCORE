
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

export type ScheduleType = 'disabled' | 'runOnce' | 'daily' | 'weekly' | 'monthly' | 'customInterval';
export type CustomIntervalUnit = 'minutes' | 'hours';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday to Saturday

export interface ScheduleConfig {
  type: ScheduleType;
  time?: string; // HH:MM, for runOnce, daily, weekly, monthly
  dayOfWeek?: DayOfWeek; // For weekly
  dayOfMonth?: number; // 1-31, for monthly
  intervalValue?: number; // For customInterval
  intervalUnit?: CustomIntervalUnit; // For customInterval
}

export interface AssociatedProcedureConfig {
  procedureId: string;
  runOnNewMember: boolean;
  schedule: ScheduleConfig;
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

export interface WindowsUpdateScopeOptions {
  includeOsUpdates?: boolean;
  includeMicrosoftProductUpdates?: boolean;
  includeFeatureUpdates?: boolean;
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  scriptType: ScriptType;
  scriptContent: string;
  runAsUser?: boolean;
  procedureSystemType: ProcedureSystemType;
  windowsUpdateScopeOptions?: WindowsUpdateScopeOptions;
  softwareUpdateMode?: 'all' | 'specific';
  specificSoftwareToUpdate?: string;
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
  defaultIntervalUnit: CustomIntervalUnit; 
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

export type LicenseTerm = 'Lifetime' | 'Annual' | 'Monthly' | 'Other';

export const licenseTerms: LicenseTerm[] = ['Lifetime', 'Annual', 'Monthly', 'Other'];

export interface License { // This is for 3rd party software licenses
  id: string;
  productName: string;
  quantity: number;
  websitePanelAddress?: string;
  licenseTerm: LicenseTerm;
  purchaseDate?: string | null;
  enableExpiryDate: boolean;
  expiryDate?: string | null;
  sendExpiryNotification?: boolean;
  notificationDaysBefore?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemLicenseInfo {
  licenseKey?: string;
  licensedPcCount: number;
  expiryDate?: string | null; // ISO date string
  status: 'Valid' | 'Expired' | 'ExceededLimit' | 'NotActivated';
  // Potentially add customerName, purchaseDate, etc. for a real system
}
    
