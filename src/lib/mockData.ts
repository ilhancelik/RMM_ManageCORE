
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand, Monitor, AssociatedMonitorConfig, SMTPSettings, MonitorExecutionLog, ScheduleConfig } from '@/types';

export const scriptTypes: ScriptType[] = ['CMD', 'PowerShell', 'Python'];

// --- Mock Data Arrays ---
export let mockComputers: Computer[] = [
  { id: 'comp-1', name: 'Workstation-Dev-01', status: 'Online', os: 'Windows 11 Pro', ipAddress: '192.168.1.101', lastSeen: new Date(Date.now() - 3600000).toISOString(), cpuUsage: 25, ramUsage: 60, diskUsage: 75, groupIds: ['group-1'] },
  { id: 'comp-2', name: 'Server-Prod-Main', status: 'Online', os: 'Windows Server 2022', ipAddress: '10.0.0.5', lastSeen: new Date(Date.now() - 600000).toISOString(), cpuUsage: 10, ramUsage: 30, diskUsage: 40, groupIds: ['group-2'] },
  { id: 'comp-3', name: 'Laptop-Sales-03', status: 'Offline', os: 'Windows 10 Home', ipAddress: '192.168.1.153', lastSeen: new Date(Date.now() - 86400000 * 2).toISOString(), groupIds: ['group-1', 'group-3'] },
  { id: 'comp-4', name: 'Kiosk-Lobby', status: 'Error', os: 'Windows 10 IoT', ipAddress: '192.168.2.20', lastSeen: new Date(Date.now() - 7200000).toISOString(), cpuUsage: 90, ramUsage: 85, diskUsage: 95, groupIds: [] },
  { id: 'comp-5', name: 'VM-Test-Environment', status: 'Online', os: 'Windows Server 2019', ipAddress: '10.0.1.15', lastSeen: new Date().toISOString(), cpuUsage: 5, ramUsage: 15, diskUsage: 20, groupIds: ['group-2'] },
];

export let mockProcedures: Procedure[] = [
  { id: 'proc-1', name: 'Disk Cleanup', description: 'Runs a standard disk cleanup utility.', scriptType: 'CMD', scriptContent: 'cleanmgr /sagerun:1', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'proc-2', name: 'Restart Print Spooler', description: 'Restarts the print spooler service.', scriptType: 'PowerShell', scriptContent: 'Restart-Service -Name Spooler -Force', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'proc-3', name: 'Apply Security Registry Fix', description: 'Applies a common security registry fix via CMD.', scriptType: 'CMD', scriptContent: 'REG ADD "HKLM\\Software\\MyCorp\\Security" /v "SecureSetting" /t REG_DWORD /d 1 /f', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()},
];

const defaultProcedureSchedule: ScheduleConfig = { type: 'disabled' };
const defaultMonitorSchedule: ScheduleConfig = { type: 'interval', intervalValue: 15, intervalUnit: 'minutes' };

export let mockComputerGroups: ComputerGroup[] = [
  { id: 'group-1', name: 'Development Machines', description: 'All computers used by the development team.', computerIds: ['comp-1', 'comp-3'], associatedProcedures: [{ procedureId: 'proc-1', runOnNewMember: true, schedule: { type: 'interval', intervalValue: 24, intervalUnit: 'hours'} }], associatedMonitors: [{monitorId: 'mon-1', schedule: defaultMonitorSchedule}] },
  { id: 'group-2', name: 'Production Servers', description: 'Critical production servers.', computerIds: ['comp-2', 'comp-5'], associatedProcedures: [{ procedureId: 'proc-2', runOnNewMember: false, schedule: defaultProcedureSchedule }], associatedMonitors: [] },
  { id: 'group-3', name: 'Sales Laptops', description: 'Laptops for the sales department.', computerIds: ['comp-3'], associatedProcedures: [], associatedMonitors: [] },
];

export let mockProcedureExecutions: ProcedureExecution[] = [
  { id: 'exec-1', procedureId: 'proc-1', computerId: 'comp-1', computerName: 'Workstation-Dev-01', status: 'Success', startTime: new Date(Date.now() - 3600000 * 2).toISOString(), endTime: new Date(Date.now() - 3600000 * 2 + 60000).toISOString(), logs: 'Disk cleanup initiated...\nDisk cleanup completed successfully.', output: '1.2GB freed.' },
  { id: 'exec-2', procedureId: 'proc-2', computerId: 'comp-2', computerName: 'Server-Prod-Main', status: 'Failed', startTime: new Date(Date.now() - 7200000).toISOString(), endTime: new Date(Date.now() - 7200000 + 30000).toISOString(), logs: 'Restarting Spooler...\nError: Access Denied.', output: 'Failed with exit code 5' },
  { id: 'exec-3', procedureId: 'proc-1', computerId: 'comp-5', computerName: 'VM-Test-Environment', status: 'Running', startTime: new Date().toISOString(), logs: 'Disk cleanup initiated...', output: '' },
];

export let mockMonitors: Monitor[] = [
  { id: 'mon-1', name: 'CPU Usage Monitor', description: 'Alerts if CPU usage is high.', scriptType: 'PowerShell', scriptContent: 'if ((Get-Counter "\\Processor(_Total)\\% Processor Time").CounterSamples[0].CookedValue -gt 80) { "ALERT: CPU Usage High" } else { "OK: CPU Usage Normal" }', defaultIntervalValue: 5, defaultIntervalUnit: 'minutes', sendEmailOnAlert: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'mon-2', name: 'Disk Space Monitor (C:)', description: 'Checks free disk space on C:. Alerts if < 10% free.', scriptType: 'PowerShell', scriptContent: '$disk = Get-PSDrive C; if (($disk.Free / $disk.Size) * 100 -lt 10) { "ALERT: Low Disk Space on C:" } else { "OK: Disk space sufficient on C:" }', defaultIntervalValue: 1, defaultIntervalUnit: 'hours', sendEmailOnAlert: false, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date().toISOString() },
  { 
    id: 'mon-3', 
    name: 'Print Spooler Service Monitor', 
    description: 'Checks if the Print Spooler service is running.', 
    scriptType: 'PowerShell', 
    scriptContent: '$serviceName = "Spooler"\nif ((Get-Service -Name $serviceName -ErrorAction SilentlyContinue).Status -eq "Running") { \n    "OK: Service $serviceName is running." \n} else { \n    "ALERT: Service $serviceName is NOT running." \n}', 
    defaultIntervalValue: 15, 
    defaultIntervalUnit: 'minutes', 
    sendEmailOnAlert: true, 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'mon-4', 
    name: 'Google DNS Ping Monitor', 
    description: 'Pings Google DNS (8.8.8.8) to check external connectivity.', 
    scriptType: 'CMD', 
    scriptContent: 'ping -n 1 8.8.8.8 | find "TTL=" > nul\nif errorlevel 1 (\n    echo ALERT: 8.8.8.8 is NOT reachable.\n) else (\n    echo OK: 8.8.8.8 is reachable.\n)', 
    defaultIntervalValue: 30, 
    defaultIntervalUnit: 'minutes', 
    sendEmailOnAlert: false, 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'mon-5', 
    name: 'Pending Reboot Check', 
    description: 'Checks if the system has a pending reboot state.', 
    scriptType: 'PowerShell', 
    scriptContent: '$RebootRequired = $false\n# Component-Based Servicing kontrolü\nif (Test-Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Component Based Servicing\\RebootPending") { $RebootRequired = $true }\n# Windows Update kontrolü\nif (Test-Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update\\RebootRequired") { $RebootRequired = $true }\n\nif ($RebootRequired) { \n    "ALERT: System requires a reboot." \n} else { \n    "OK: No pending reboot found." \n}', 
    defaultIntervalValue: 4, 
    defaultIntervalUnit: 'hours', 
    sendEmailOnAlert: true, 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
];


export let mockMonitorExecutionLogs: MonitorExecutionLog[] = [
  { id: 'log-1', monitorId: 'mon-1', computerId: 'comp-1', computerName: 'Workstation-Dev-01', timestamp: new Date(Date.now() - 60000 * 5).toISOString(), status: 'OK', message: 'OK: CPU Usage Normal', notified: false },
  { id: 'log-2', monitorId: 'mon-1', computerId: 'comp-2', computerName: 'Server-Prod-Main', timestamp: new Date(Date.now() - 60000 * 10).toISOString(), status: 'ALERT', message: 'ALERT: CPU Usage High - 92%', notified: true },
  { id: 'log-3', monitorId: 'mon-2', computerId: 'comp-1', computerName: 'Workstation-Dev-01', timestamp: new Date(Date.now() - 60000 * 15).toISOString(), status: 'OK', message: 'OK: Disk space sufficient', notified: false },
];

export let mockCustomCommands: CustomCommand[] = [
  { id: 'cmd-1', targetId: 'comp-1', targetType: 'computer', command: 'ipconfig /all', scriptType: 'CMD', status: 'Success', output: 'Windows IP Configuration...', executedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'cmd-2', targetId: 'group-1', targetType: 'group', command: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5', scriptType: 'PowerShell', status: 'Sent', executedAt: new Date().toISOString() },
];

export let mockSmtpSettings: SMTPSettings = {
  server: 'smtp.example.com',
  port: 587,
  username: 'user@example.com',
  password: 'password123',
  secure: true,
  fromEmail: 'noreply@example.com',
  defaultToEmail: 'admin@example.com',
};

// --- Helper Functions for Mock Data ---

// Computers
export const getComputers = (): Computer[] => {
  // Simulate some dynamic behavior for usage stats for online computers
  return mockComputers.map(c => {
    if (c.status === 'Online') {
      return {
        ...c,
        cpuUsage: Math.floor(Math.random() * 70) + 5, // 5-75%
        ramUsage: Math.floor(Math.random() * 60) + 20, // 20-80%
        diskUsage: c.diskUsage || (Math.floor(Math.random() * 50) + 10), // 10-60%
        lastSeen: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString() // Update lastSeen slightly for online ones
      };
    }
    return c;
  }).sort((a, b) => a.name.localeCompare(b.name));
};
export const getComputerById = (id: string): Computer | undefined => {
    const computer = mockComputers.find(c => c.id === id);
    if (computer && computer.status === 'Online') {
      return {
        ...computer,
        cpuUsage: Math.floor(Math.random() * 70) + 5,
        ramUsage: Math.floor(Math.random() * 60) + 20,
      };
    }
    return computer;
};
export const addComputer = (computerData: Omit<Computer, 'id' | 'lastSeen' | 'groupIds' | 'cpuUsage' | 'ramUsage' | 'diskUsage'>): Computer => {
  const newComputer: Computer = {
    ...computerData,
    id: `comp-${Date.now()}`,
    lastSeen: new Date().toISOString(),
    groupIds: [],
  };
  mockComputers = [...mockComputers, newComputer];
  return newComputer;
};
export const updateComputer = (id: string, updates: Partial<Computer>): Computer | undefined => {
  let updatedComputer: Computer | undefined;
  mockComputers = mockComputers.map(c => {
    if (c.id === id) {
      updatedComputer = { ...c, ...updates }; // Removed updatedAt as it's not in type
      return updatedComputer;
    }
    return c;
  });
  return updatedComputer;
}
export const deleteComputer = (id: string): boolean => {
    const initialLength = mockComputers.length;
    mockComputers = mockComputers.filter(c => c.id !== id);
    mockComputerGroups = mockComputerGroups.map(g => ({
        ...g,
        computerIds: g.computerIds.filter(compId => compId !== id)
    }));
    mockProcedureExecutions = mockProcedureExecutions.filter(exec => exec.computerId !== id);
    mockMonitorExecutionLogs = mockMonitorExecutionLogs.filter(log => log.computerId !== id);
    mockCustomCommands = mockCustomCommands.filter(cmd => cmd.targetType === 'computer' && cmd.targetId !==id);

    return mockComputers.length < initialLength;
}


// Groups
export const getGroups = (): ComputerGroup[] => mockComputerGroups.sort((a,b) => a.name.localeCompare(b.name));
export const getGroupById = (id: string): ComputerGroup | undefined => mockComputerGroups.find(g => g.id === id);
export const addComputerGroup = (groupData: Omit<ComputerGroup, 'id'>): ComputerGroup => {
  const newGroup: ComputerGroup = {
    ...groupData,
    id: `group-${Date.now()}`,
    associatedProcedures: groupData.associatedProcedures || [],
    associatedMonitors: groupData.associatedMonitors || [],
  };
  mockComputerGroups = [...mockComputerGroups, newGroup];
  newGroup.computerIds.forEach(compId => {
    const comp = getComputerById(compId);
    if (comp && !comp.groupIds?.includes(newGroup.id)) {
      updateComputer(compId, { groupIds: [...(comp.groupIds || []), newGroup.id] });
    }
  });
  return newGroup;
};
export const updateComputerGroup = (id: string, updates: Partial<Omit<ComputerGroup, 'id'>>): ComputerGroup | undefined => {
  let updatedGroup: ComputerGroup | undefined;
  const oldGroup = getGroupById(id);

  mockComputerGroups = mockComputerGroups.map(g => {
    if (g.id === id) {
      updatedGroup = { ...g, ...updates };
      return updatedGroup;
    }
    return g;
  });

  if (oldGroup && updatedGroup) {
    const oldComputerIds = new Set(oldGroup.computerIds);
    const newComputerIds = new Set(updatedGroup.computerIds);

    oldGroup.computerIds.forEach(compId => {
      if (!newComputerIds.has(compId)) {
        const comp = getComputerById(compId);
        if (comp) {
          updateComputer(compId, { groupIds: comp.groupIds?.filter(gid => gid !== id) });
        }
      }
    });
    updatedGroup.computerIds.forEach(compId => {
      if (!oldComputerIds.has(compId)) {
        const comp = getComputerById(compId);
        if (comp && !comp.groupIds?.includes(id)) {
          updateComputer(compId, { groupIds: [...(comp.groupIds || []), id] });
        }
      }
    });
  }
  return updatedGroup;
};
export const deleteComputerGroup = (id: string): boolean => {
  const initialLength = mockComputerGroups.length;
  mockComputerGroups = mockComputerGroups.filter(g => g.id !== id);
  mockComputers = mockComputers.map(c => ({
    ...c,
    groupIds: c.groupIds?.filter(gid => gid !== id)
  }));
  return mockComputerGroups.length < initialLength;
};

// Procedures
export const getProcedures = (): Procedure[] => mockProcedures.sort((a,b) => a.name.localeCompare(b.name));
export const getProcedureById = (id: string): Procedure | undefined => mockProcedures.find(p => p.id === id);
export const addProcedure = (procData: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>): Procedure => {
  const newProcedure: Procedure = {
    ...procData,
    id: `proc-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockProcedures = [...mockProcedures, newProcedure];
  return newProcedure;
};
export const updateProcedureInMock = (id: string, updates: Partial<Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>>): Procedure | undefined => {
  let updatedProcedure: Procedure | undefined;
  mockProcedures = mockProcedures.map(p => {
    if (p.id === id) {
      updatedProcedure = { ...p, ...updates, updatedAt: new Date().toISOString() };
      return updatedProcedure;
    }
    return p;
  });
  return updatedProcedure;
};
export const deleteProcedureFromMock = (id: string): boolean => {
  const initialLength = mockProcedures.length;
  mockProcedures = mockProcedures.filter(p => p.id !== id);
  mockComputerGroups = mockComputerGroups.map(g => ({
    ...g,
    associatedProcedures: g.associatedProcedures?.filter(ap => ap.procedureId !== id)
  }));
  mockProcedureExecutions = mockProcedureExecutions.filter(exec => exec.procedureId !== id);
  return mockProcedures.length < initialLength;
};

// Procedure Executions
export const getExecutions = (filters?: { procedureId?: string; computerId?: string }): ProcedureExecution[] => {
  let results = mockProcedureExecutions;
  if (filters?.procedureId) {
    results = results.filter(e => e.procedureId === filters.procedureId);
  }
  if (filters?.computerId) {
    results = results.filter(e => e.computerId === filters.computerId);
  }
  return results.sort((a,b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
};

export const getProcedureExecutionsForProcedure = (procedureId: string): ProcedureExecution[] => {
  return mockProcedureExecutions
    .filter(e => e.procedureId === procedureId)
    .sort((a,b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
}

export const addProcedureExecution = (executionData: Omit<ProcedureExecution, 'id' | 'computerName'>): ProcedureExecution => {
  const computer = getComputerById(executionData.computerId);
  const newExecution: ProcedureExecution = {
    ...executionData,
    id: `exec-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    computerName: computer?.name || executionData.computerId,
    startTime: executionData.startTime || new Date().toISOString(),
    status: executionData.status || 'Pending',
  };
  mockProcedureExecutions = [newExecution, ...mockProcedureExecutions];

  if (newExecution.status === 'Pending') {
    setTimeout(() => {
        const finalStatus = Math.random() > 0.3 ? 'Success' : 'Failed';
        newExecution.status = finalStatus;
        newExecution.endTime = new Date().toISOString();
        newExecution.logs += `\nExecution finished with status: ${finalStatus}`;
        newExecution.output = finalStatus === 'Success' ? 'Mock output: Operation completed.' : 'Mock output: Operation failed.';
        mockProcedureExecutions = mockProcedureExecutions.map(e => e.id === newExecution.id ? newExecution : e);
    }, 1500 + Math.random() * 2500);
  }
  return newExecution;
};
export const executeMockProcedure = (procedureId: string, computerIds: string[]): ProcedureExecution[] => {
    const executions: ProcedureExecution[] = [];
    computerIds.forEach(compId => {
        const computer = getComputerById(compId);
        if (computer && computer.status === 'Online') {
            const proc = getProcedureById(procedureId);
            if (proc) {
                const exec = addProcedureExecution({
                    procedureId,
                    computerId: compId,
                    status: 'Pending',
                    logs: `Executing "${proc.name}" on "${computer.name}"...`,
                    startTime: new Date().toISOString(),
                });
                executions.push(exec);
            }
        }
    });
    return executions;
}


// Monitors
export const getMonitors = (): Monitor[] => mockMonitors.sort((a,b) => a.name.localeCompare(b.name));
export const getMonitorById = (id: string): Monitor | undefined => mockMonitors.find(m => m.id === id);
export const addMonitorToMock = (monitorData: Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>): Monitor => {
  const newMonitor: Monitor = {
    ...monitorData,
    id: `mon-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockMonitors = [...mockMonitors, newMonitor];
  return newMonitor;
};
export const updateMonitorInMock = (id: string, updates: Partial<Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>>): Monitor | undefined => {
  let updatedMonitor: Monitor | undefined;
  mockMonitors = mockMonitors.map(m => {
    if (m.id === id) {
      updatedMonitor = { ...m, ...updates, updatedAt: new Date().toISOString() };
      return updatedMonitor;
    }
    return m;
  });
  return updatedMonitor;
};
export const deleteMonitorFromMock = (id: string): boolean => {
  const initialLength = mockMonitors.length;
  mockMonitors = mockMonitors.filter(m => m.id !== id);
  mockComputerGroups = mockComputerGroups.map(g => ({
    ...g,
    associatedMonitors: g.associatedMonitors?.filter(am => am.monitorId !== id)
  }));
  mockMonitorExecutionLogs = mockMonitorExecutionLogs.filter(log => log.monitorId !== id);
  return mockMonitors.length < initialLength;
};

// Monitor Execution Logs
export const getMonitorLogs = (): MonitorExecutionLog[] => mockMonitorExecutionLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
export const addMonitorLog = (logData: Omit<MonitorExecutionLog, 'id' | 'computerName'>): MonitorExecutionLog => {
  const computer = getComputerById(logData.computerId);
  const newLog: MonitorExecutionLog = {
    ...logData,
    id: `mlog-${Date.now()}`,
    computerName: computer?.name || logData.computerId,
    timestamp: new Date().toISOString(),
    notified: logData.status === 'ALERT' ? mockSmtpSettings.fromEmail && mockSmtpSettings.defaultToEmail : false,
  };
  mockMonitorExecutionLogs = [newLog, ...mockMonitorExecutionLogs];
  if (mockMonitorExecutionLogs.length > 200) { 
    mockMonitorExecutionLogs = mockMonitorExecutionLogs.slice(0, 200);
  }
  return newLog;
};

// Custom Commands
export const getCommandHistory = (): CustomCommand[] => {
  // Simulate some commands finishing
  mockCustomCommands.forEach(cmd => {
    if (cmd.status === 'Sent' && Math.random() < 0.2) { // 20% chance to "complete"
      cmd.status = Math.random() < 0.7 ? 'Success' : 'Failed';
      cmd.output = cmd.status === 'Success' ? `Mock Success: ${cmd.command}` : `Mock Fail: ${cmd.command}`;
    }
  });
  return mockCustomCommands.sort((a,b) => new Date(b.executedAt || 0).getTime() - new Date(a.executedAt || 0).getTime());
}
export const addCustomCommand = (commandData: Omit<CustomCommand, 'id' | 'executedAt' | 'status' | 'output'> & { targetId: string; targetType: 'computer' | 'group'} ): CustomCommand | CustomCommand[] => {
  const baseCommand: Omit<CustomCommand, 'id' | 'computerId'> = {
    ...commandData,
    executedAt: new Date().toISOString(),
    status: 'Sent',
  };

  if (commandData.targetType === 'group') {
    const group = getGroupById(commandData.targetId);
    if (!group) throw new Error('Group not found');
    
    const commandsSent: CustomCommand[] = [];
    group.computerIds.forEach(compId => {
        const computer = getComputerById(compId);
        if (computer && computer.status === 'Online') {
            const newCommand: CustomCommand = {
                ...baseCommand,
                id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                computerId: compId, 
                targetId: group.id, 
                targetType: 'group'
            };
            mockCustomCommands = [newCommand, ...mockCustomCommands];
            commandsSent.push(newCommand);
        }
    });
     if (commandsSent.length === 0 && group.computerIds.length > 0) {
        // This case means group had members, but none were online.
        // We might still want to log a "Sent" command to the group itself, without specific computerId.
         const groupSendCommand: CustomCommand = {
            ...baseCommand,
            id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            computerId: group.id, // Use group ID as placeholder if no online members
            targetId: group.id,
            targetType: 'group',
            status: 'Sent', // Still "Sent" to group, but individual executions might not happen
            output: "Command sent to group, but no online members found to execute immediately."
        };
        mockCustomCommands = [groupSendCommand, ...mockCustomCommands];
        return [groupSendCommand]; // Return the group-level command
    }
    return commandsSent;

  } else { 
    const computer = getComputerById(commandData.targetId);
    if (!computer) throw new Error('Computer not found');
    if (computer.status !== 'Online') throw new Error('Computer is offline. Command cannot be sent.');

    const newCommand: CustomCommand = {
        ...baseCommand,
        id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        computerId: commandData.targetId, 
        targetId: commandData.targetId,
        targetType: 'computer'
    };
    mockCustomCommands = [newCommand, ...mockCustomCommands];
    return newCommand;
  }
};

// SMTP Settings
export const getSmtpSettings = (): SMTPSettings => mockSmtpSettings;
export const saveSmtpSettings = (settings: SMTPSettings): SMTPSettings => {
  mockSmtpSettings = { ...settings };
  return mockSmtpSettings;
};

export const triggerAutomatedProceduresForNewMember = (computerId: string, groupId: string) => {
    const group = getGroupById(groupId);
    const computer = getComputerById(computerId);
    if (group && computer && group.associatedProcedures) {
        group.associatedProcedures.forEach(assocProc => {
            if (assocProc.runOnNewMember) {
                const procedure = getProcedureById(assocProc.procedureId);
                if (procedure && computer.status === 'Online') {
                    console.log(`AUTOMOCK: Triggering procedure "${procedure.name}" for new member "${computer.name}" in group "${group.name}"`);
                    addProcedureExecution({
                        procedureId: procedure.id,
                        computerId: computer.id,
                        status: 'Pending',
                        logs: `Automatically triggered: "${procedure.name}" for new member "${computer.name}" in group "${group.name}".`,
                        startTime: new Date().toISOString(),
                    });
                } else if (procedure && computer.status !== 'Online') {
                     console.log(`AUTOMOCK: Skipped procedure "${procedure.name}" for new offline member "${computer.name}" in group "${group.name}"`);
                }
            }
        });
    }
};
// Simulate some monitor logs being added periodically
const simulateMonitorChecks = () => {
  mockComputers.forEach(computer => {
    if (computer.status !== 'Online') return;

    mockComputerGroups.forEach(group => {
      if (group.computerIds.includes(computer.id) && group.associatedMonitors) {
        group.associatedMonitors.forEach(assocMon => {
          const monitor = getMonitorById(assocMon.monitorId);
          if (monitor && assocMon.schedule?.type === 'interval') {
            // Basic simulation: ~20% chance of alert, 10% chance of error
            const rand = Math.random();
            let status: MonitorExecutionLog['status'] = 'OK';
            let message = `Mock OK: ${monitor.name} check passed for ${computer.name}.`;
            if (rand < 0.05) { // 5% Error
              status = 'Error';
              message = `Mock Error: ${monitor.name} script failed on ${computer.name}.`;
            } else if (rand < 0.15) { // 10% Alert (5% to 15%)
              status = 'ALERT';
              message = `Mock ALERT: ${monitor.name} detected issue on ${computer.name}.`;
            }
            addMonitorLog({
              monitorId: monitor.id,
              computerId: computer.id,
              status,
              message,
              notified: status === 'ALERT' ? mockSmtpSettings.fromEmail && mockSmtpSettings.defaultToEmail : false,
            });
          }
        });
      }
    });
  });
};

// Start a simple interval to simulate monitor checks - for demo purposes only
if (typeof window !== 'undefined') { // Ensure this runs only in browser-like environment for mock
    // setInterval(simulateMonitorChecks, 30000); // Check every 30 seconds
}


    