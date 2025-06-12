
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand, Monitor, AssociatedMonitorConfig, SMTPSettings, MonitorExecutionLog, ScheduleConfig } from '@/types';

export const scriptTypes: ScriptType[] = ['CMD', 'Regedit', 'PowerShell', 'Python'];

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
  { id: 'proc-3', name: 'Apply Security Registry Fix', description: 'Applies a common security registry fix.', scriptType: 'Regedit', scriptContent: 'REG ADD "HKLM\\Software\\MyCorp\\Security" /v "SecureSetting" /t REG_DWORD /d 1 /f', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()},
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
  { id: 'mon-1', name: 'CPU Usage Monitor', description: 'Alerts if CPU usage is high.', scriptType: 'PowerShell', scriptContent: 'if ((Get-Counter "\\Processor(_Total)\\% Processor Time").CounterSamples[0].CookedValue -gt 80) { "ALERT: CPU Usage High" } else { "OK: CPU Usage Normal" }', defaultIntervalValue: 5, defaultIntervalUnit: 'minutes', sendEmailOnAlert: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mon-2', name: 'Disk Space Monitor', description: 'Checks free disk space.', scriptType: 'PowerShell', scriptContent: '$disk = Get-PSDrive C; if (($disk.Free / $disk.Size) * 100 -lt 10) { "ALERT: Low Disk Space on C:" } else { "OK: Disk space sufficient" }', defaultIntervalValue: 1, defaultIntervalUnit: 'hours', sendEmailOnAlert: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
export const getComputers = (): Computer[] => mockComputers;
export const getComputerById = (id: string): Computer | undefined => mockComputers.find(c => c.id === id);
export const addComputer = (computerData: Omit<Computer, 'id' | 'lastSeen' | 'groupIds' | 'cpuUsage' | 'ramUsage' | 'diskUsage'>): Computer => {
  const newComputer: Computer = {
    ...computerData,
    id: `comp-${Date.now()}`,
    lastSeen: new Date().toISOString(),
    groupIds: [], // Initially no groups
  };
  mockComputers = [...mockComputers, newComputer];
  return newComputer;
};
export const updateComputer = (id: string, updates: Partial<Computer>): Computer | undefined => {
  let updatedComputer: Computer | undefined;
  mockComputers = mockComputers.map(c => {
    if (c.id === id) {
      updatedComputer = { ...c, ...updates, updatedAt: new Date().toISOString() };
      return updatedComputer;
    }
    return c;
  });
  return updatedComputer;
}
export const deleteComputer = (id: string): boolean => {
    const initialLength = mockComputers.length;
    mockComputers = mockComputers.filter(c => c.id !== id);
    // Also remove from groups
    mockComputerGroups = mockComputerGroups.map(g => ({
        ...g,
        computerIds: g.computerIds.filter(compId => compId !== id)
    }));
    return mockComputers.length < initialLength;
}


// Groups
export const getGroups = (): ComputerGroup[] => mockComputerGroups;
export const getGroupById = (id: string): ComputerGroup | undefined => mockComputerGroups.find(g => g.id === id);
export const addComputerGroup = (groupData: Omit<ComputerGroup, 'id'>): ComputerGroup => {
  const newGroup: ComputerGroup = {
    ...groupData,
    id: `group-${Date.now()}`,
    associatedProcedures: groupData.associatedProcedures || [],
    associatedMonitors: groupData.associatedMonitors || [],
  };
  mockComputerGroups = [...mockComputerGroups, newGroup];
  // Update computers with this new group if they are part of it
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
    // Update computer group memberships
    const oldComputerIds = new Set(oldGroup.computerIds);
    const newComputerIds = new Set(updatedGroup.computerIds);

    // Removed from group
    oldGroup.computerIds.forEach(compId => {
      if (!newComputerIds.has(compId)) {
        const comp = getComputerById(compId);
        if (comp) {
          updateComputer(compId, { groupIds: comp.groupIds?.filter(gid => gid !== id) });
        }
      }
    });
    // Added to group
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
  // Remove this group from all computers
  mockComputers = mockComputers.map(c => ({
    ...c,
    groupIds: c.groupIds?.filter(gid => gid !== id)
  }));
  return mockComputerGroups.length < initialLength;
};

// Procedures
export const getProcedures = (): Procedure[] => mockProcedures;
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
  // Also remove from group associations
  mockComputerGroups = mockComputerGroups.map(g => ({
    ...g,
    associatedProcedures: g.associatedProcedures?.filter(ap => ap.procedureId !== id)
  }));
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

  // Simulate execution completion for some
  if (newExecution.status === 'Pending') {
    setTimeout(() => {
        const finalStatus = Math.random() > 0.3 ? 'Success' : 'Failed';
        newExecution.status = finalStatus;
        newExecution.endTime = new Date().toISOString();
        newExecution.logs += `\nExecution finished with status: ${finalStatus}`;
        newExecution.output = finalStatus === 'Success' ? 'Mock output: Operation completed.' : 'Mock output: Operation failed.';
        mockProcedureExecutions = mockProcedureExecutions.map(e => e.id === newExecution.id ? newExecution : e);
    }, 3000 + Math.random() * 3000);
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
export const getMonitors = (): Monitor[] => mockMonitors;
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
  // Also remove from group associations
  mockComputerGroups = mockComputerGroups.map(g => ({
    ...g,
    associatedMonitors: g.associatedMonitors?.filter(am => am.monitorId !== id)
  }));
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
    notified: logData.status === 'ALERT' ? Math.random() > 0.5 : false, // Simulate notification
  };
  mockMonitorExecutionLogs = [newLog, ...mockMonitorExecutionLogs];
  if (mockMonitorExecutionLogs.length > 100) { // Keep logs manageable
    mockMonitorExecutionLogs.pop();
  }
  return newLog;
};

// Custom Commands
export const getCommandHistory = (): CustomCommand[] => mockCustomCommands.sort((a,b) => new Date(b.executedAt || 0).getTime() - new Date(a.executedAt || 0).getTime());
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
                computerId: compId, // For group commands, computerId indicates the member
                targetId: group.id, // targetId remains the group id
                targetType: 'group'
            };
            mockCustomCommands = [newCommand, ...mockCustomCommands];
            commandsSent.push(newCommand);
            // Simulate command execution
            setTimeout(() => {
                newCommand.status = Math.random() > 0.3 ? 'Success' : 'Failed';
                newCommand.output = `Mock output for ${newCommand.command} on ${computer.name}`;
                mockCustomCommands = mockCustomCommands.map(c => c.id === newCommand.id ? newCommand : c);
            }, 2000 + Math.random() * 2000);
        }
    });
    return commandsSent;

  } else { // targetType === 'computer'
    const computer = getComputerById(commandData.targetId);
    if (!computer) throw new Error('Computer not found');
    if (computer.status !== 'Online') throw new Error('Computer is offline');

    const newCommand: CustomCommand = {
        ...baseCommand,
        id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        computerId: commandData.targetId, // For single computer, computerId and targetId are same
        targetId: commandData.targetId,
        targetType: 'computer'
    };
    mockCustomCommands = [newCommand, ...mockCustomCommands];
    // Simulate command execution
    setTimeout(() => {
        newCommand.status = Math.random() > 0.3 ? 'Success' : 'Failed';
        newCommand.output = `Mock output for ${newCommand.command}`;
        mockCustomCommands = mockCustomCommands.map(c => c.id === newCommand.id ? newCommand : c);
    }, 2000 + Math.random() * 2000);
    return newCommand;
  }
};

// SMTP Settings
export const getSmtpSettings = (): SMTPSettings => mockSmtpSettings;
export const saveSmtpSettings = (settings: SMTPSettings): SMTPSettings => {
  mockSmtpSettings = { ...settings };
  return mockSmtpSettings;
};

// Helper to simulate triggering procedures when a computer is added to a group
export const triggerAutomatedProceduresForNewMember = (computerId: string, groupId: string) => {
    const group = getGroupById(groupId);
    const computer = getComputerById(computerId);
    if (group && computer && group.associatedProcedures) {
        group.associatedProcedures.forEach(assocProc => {
            if (assocProc.runOnNewMember) {
                const procedure = getProcedureById(assocProc.procedureId);
                if (procedure) {
                    console.log(`AUTOMOCK: Triggering procedure "${procedure.name}" for new member "${computer.name}" in group "${group.name}"`);
                    addProcedureExecution({
                        procedureId: procedure.id,
                        computerId: computer.id,
                        status: 'Pending',
                        logs: `Automatically triggered: "${procedure.name}" for new member "${computer.name}" in group "${group.name}".`,
                        startTime: new Date().toISOString(),
                    });
                }
            }
        });
    }
};
