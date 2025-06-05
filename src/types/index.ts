
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

export interface ComputerGroup {
  id: string;
  name: string;
  description: string;
  computerIds: string[];
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
    id: string;
    computerId: string;
    command: string;
    scriptType: ScriptType;
    status: 'Pending' | 'Sent' | 'Success' | 'Failed';
    output?: string;
    executedAt?: string; // ISO date string
}
