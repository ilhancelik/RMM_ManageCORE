
import type { Computer, ComputerGroup, Procedure, ProcedureExecution, ScriptType, AssociatedProcedureConfig, CustomCommand } from '@/types';

export let mockComputers: Computer[] = [
  { id: 'comp-1', name: 'Workstation-01', status: 'Online', os: 'Windows 11 Pro', ipAddress: '192.168.1.101', lastSeen: new Date().toISOString(), cpuUsage: 25, ramUsage: 60, diskUsage: 40, groupIds: ['group-1'] },
  { id: 'comp-2', name: 'Server-Main', status: 'Online', os: 'Windows Server 2022', ipAddress: '192.168.1.10', lastSeen: new Date().toISOString(), cpuUsage: 10, ramUsage: 30, diskUsage: 20, groupIds: ['group-2'] },
  { id: 'comp-3', name: 'Laptop-Dev', status: 'Offline', os: 'Windows 10 Pro', ipAddress: '192.168.1.102', lastSeen: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), groupIds: ['group-1', 'group-3'] },
  { id: 'comp-4', name: 'Kiosk-Display', status: 'Error', os: 'Windows 10 IoT', ipAddress: '192.168.1.103', lastSeen: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), cpuUsage: 90, ramUsage: 95, diskUsage: 70 },
  { id: 'comp-5', name: 'Finance-PC', status: 'Online', os: 'Windows 11 Pro', ipAddress: '192.168.1.104', lastSeen: new Date().toISOString(), cpuUsage: 15, ramUsage: 45, diskUsage: 55, groupIds: ['group-2'] },
];

export let mockComputerGroups: ComputerGroup[] = [
  { 
    id: 'group-1', 
    name: 'Development Team', 
    description: 'Computers used by the development team.', 
    computerIds: ['comp-1', 'comp-3'],
    associatedProcedures: [
      { procedureId: 'proc-1', runOnNewMember: true }
    ]
  },
  { id: 'group-2', name: 'Servers', description: 'All production and staging servers.', computerIds: ['comp-2', 'comp-5'], associatedProcedures: [] },
  { id: 'group-3', name: 'Remote Workers', description: 'Laptops for remote employees.', computerIds: ['comp-3'], associatedProcedures: [] },
];

export let mockProcedures: Procedure[] = [
  {
    id: 'proc-1',
    name: 'Disk Cleanup',
    description: 'Runs standard disk cleanup utility.',
    scriptType: 'CMD',
    scriptContent: 'cleanmgr /sagerun:1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proc-2',
    name: 'Install Basic Software',
    description: 'Installs common software using PowerShell.',
    scriptType: 'PowerShell',
    scriptContent: 'winget install -e --id VideoLAN.VLC\nwinget install -e --id 7zip.7zip',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proc-3',
    name: 'Check Python Version',
    description: 'Verifies the installed Python version.',
    scriptType: 'Python',
    scriptContent: 'import sys\nprint(sys.version)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export let mockProcedureExecutions: ProcedureExecution[] = [
    {
        id: 'exec-1',
        procedureId: 'proc-1',
        computerId: 'comp-1',
        computerName: 'Workstation-01',
        status: 'Success',
        startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
        endTime: new Date(Date.now() - 3500 * 1000).toISOString(),
        logs: 'Starting disk cleanup...\nDisk cleanup successful.\nRemoved 1.2GB of temp files.',
        output: 'Success',
    },
    {
        id: 'exec-2',
        procedureId: 'proc-2',
        computerId: 'comp-2',
        computerName: 'Server-Main',
        status: 'Failed',
        startTime: new Date(Date.now() - 7200 * 1000).toISOString(),
        endTime: new Date(Date.now() - 7000 * 1000).toISOString(),
        logs: 'Starting software installation...\nFailed to install VideoLAN.VLC. Error code: 1603',
        output: 'Error: 1603',
    },
];

export let mockCustomCommands: CustomCommand[] = [];


export const scriptTypes: ScriptType[] = ['CMD', 'Regedit', 'PowerShell', 'Python'];

// Helper functions to manage mock data
export function addProcedureExecution(execution: ProcedureExecution) {
  mockProcedureExecutions.unshift(execution);
}

export function updateComputerGroup(updatedGroup: ComputerGroup) {
  const index = mockComputerGroups.findIndex(g => g.id === updatedGroup.id);
  if (index !== -1) {
    mockComputerGroups[index] = { ...mockComputerGroups[index], ...updatedGroup };
  } else {
     mockComputerGroups.push(updatedGroup); // Should ideally not happen for update
  }
  // console.log("Updated mockComputerGroups:", mockComputerGroups);
}

export function addComputerGroup(newGroup: ComputerGroup) {
    const existingIndex = mockComputerGroups.findIndex(g => g.id === newGroup.id);
    if (existingIndex === -1) {
        mockComputerGroups.push(newGroup);
    } else {
        // Handle if group with same ID already exists, e.g., update or error
        mockComputerGroups[existingIndex] = newGroup; 
    }
}

export function addCustomCommand(command: CustomCommand) {
  mockCustomCommands.unshift(command);
}

export function updateCustomCommand(commandToUpdate: Partial<CustomCommand> & { id: string }) {
  mockCustomCommands = mockCustomCommands.map(cmd => 
    cmd.id === commandToUpdate.id ? { ...cmd, ...commandToUpdate } : cmd
  );
}


export function getComputerGroupById(groupId: string): ComputerGroup | undefined {
    return mockComputerGroups.find(g => g.id === groupId);
}
export function getProcedureById(procedureId: string): Procedure | undefined {
    return mockProcedures.find(p => p.id === procedureId);
}
export function getComputerById(computerId: string): Computer | undefined {
    return mockComputers.find(c => c.id === computerId);
}
