
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

export interface ComputerGroup {
  id: string;
  name: string;
  description: string;
  computerIds: string[];
  associatedProcedures?: AssociatedProcedureConfig[];
}

export type ScriptType = 'CMD' | 'Regedit' | 'PowerShell' | 'Python';

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
