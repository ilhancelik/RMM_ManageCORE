
import type { Computer, Procedure, ComputerGroup, CustomCommand, Monitor, SMTPSettings, AssociatedProcedureConfig, AssociatedMonitorConfig, ProcedureExecution, ScriptType, MonitorExecutionLog } from '@/types';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleError = (error: unknown, context: string) => {
  console.error(`API Error (${context}):`, error);
  if (axios.isAxiosError(error)) {
    if (error.response) {
      throw new Error(`API Error (${context}): ${error.response.status} ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      let message = `API Error (${context}): No response received from server. `;
      message += `Is the API running at ${apiClient.defaults.baseURL}? `;
      message += `Please also check your browser's console for CORS errors if the API is on a different domain. Ensure the server at ${apiClient.defaults.baseURL} is configured to accept requests from this application's origin.`;
      throw new Error(message);
    } else {
      throw new Error(`API Error (${context}): ${error.message}`);
    }
  } else {
    throw new Error(`An unexpected error occurred (${context}): ${String(error)}`);
  }
};

// Computer related API calls
export const fetchComputers = async (): Promise<Computer[]> => {
  try {
    const response = await apiClient.get<Computer[]>('/computers');
    return response.data;
  } catch (error) {
    handleError(error, 'fetching computers');
    return [];
  }
};

export const fetchComputerById = async (id: string): Promise<Computer | null> => {
  try {
    const response = await apiClient.get<Computer>(`/computers/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, `fetching computer ${id}`);
    return null;
  }
};

export const addComputerToApi = async (computerData: Omit<Computer, 'id' | 'lastSeen' | 'groupIds' | 'cpuUsage' | 'ramUsage' | 'diskUsage'>): Promise<Computer> => {
  try {
    const response = await apiClient.post<Computer>('/computers', computerData);
    return response.data;
  } catch (error) {
    handleError(error, 'adding computer');
    throw error;
  }
};

// Group related API calls
export const fetchGroups = async (): Promise<ComputerGroup[]> => {
  try {
    const response = await apiClient.get<ComputerGroup[]>('/groups');
    return response.data;
  } catch (error) {
    handleError(error, 'fetching groups');
    return [];
  }
};

export const fetchGroupById = async (id: string): Promise<ComputerGroup | null> => {
  try {
    const response = await apiClient.get<ComputerGroup>(`/groups/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, `fetching group ${id}`);
    return null;
  }
};

export const createGroup = async (groupData: Omit<ComputerGroup, 'id'>): Promise<ComputerGroup> => {
  try {
    const response = await apiClient.post<ComputerGroup>('/groups', groupData);
    return response.data;
  } catch (error) {
    handleError(error, 'creating group');
    throw error;
  }
};

export const updateGroup = async (id: string, groupData: Partial<Omit<ComputerGroup, 'id'>>): Promise<ComputerGroup> => {
  try {
    const response = await apiClient.put<ComputerGroup>(`/groups/${id}`, groupData);
    return response.data;
  } catch (error) {
    handleError(error, `updating group ${id}`);
    throw error;
  }
};

export const deleteGroup = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/groups/${id}`);
  } catch (error) {
    handleError(error, `deleting group ${id}`);
    throw error;
  }
};

export const fetchAllComputers = async (): Promise<Computer[]> => {
  try {
    const response = await apiClient.get<Computer[]>('/computers');
    return response.data;
  } catch (error) {
    handleError(error, 'fetching all computers');
    return [];
  }
};


// Procedure related API calls
export const fetchProcedures = async (): Promise<Procedure[]> => {
  try {
    const response = await apiClient.get<Procedure[]>('/procedures');
    return response.data;
  } catch (error) {
    handleError(error, 'fetching procedures');
    return [];
  }
};

export const fetchProcedureById = async (id: string): Promise<Procedure | null> => {
  try {
    const response = await apiClient.get<Procedure>(`/procedures/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, `fetching procedure ${id}`);
    return null;
  }
};

export const createProcedure = async (procedureData: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Procedure> => {
  try {
    const response = await apiClient.post<Procedure>('/procedures', procedureData);
    return response.data;
  } catch (error) {
    handleError(error, 'creating procedure');
    throw error;
  }
};

export const updateProcedure = async (id: string, procedureData: Partial<Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Procedure> => {
  try {
    const response = await apiClient.put<Procedure>(`/procedures/${id}`, procedureData);
    return response.data;
  } catch (error) {
    handleError(error, `updating procedure ${id}`);
    throw error;
  }
};

export const deleteProcedure = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/procedures/${id}`);
  } catch (error) {
    handleError(error, `deleting procedure ${id}`);
    throw error;
  }
};

// Monitor related API calls
export const fetchMonitors = async (): Promise<Monitor[]> => {
  try {
    const response = await apiClient.get<Monitor[]>('/monitors');
    return response.data;
  } catch (error) {
    handleError(error, 'fetching monitors');
    return [];
  }
};

export const fetchMonitorById = async (id: string): Promise<Monitor | null> => {
  try {
    const response = await apiClient.get<Monitor>(`/monitors/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, `fetching monitor ${id}`);
    return null;
  }
};

export const createMonitor = async (monitorData: Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Monitor> => {
  try {
    const response = await apiClient.post<Monitor>('/monitors', monitorData);
    return response.data;
  } catch (error) {
    handleError(error, 'creating monitor');
    throw error;
  }
};

export const updateMonitorApi = async (id: string, monitorData: Partial<Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Monitor> => {
  try {
    const response = await apiClient.put<Monitor>(`/monitors/${id}`, monitorData);
    return response.data;
  } catch (error) {
    handleError(error, `updating monitor ${id}`);
    throw error;
  }
};

export const deleteMonitorFromApi = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/monitors/${id}`);
  } catch (error) {
    handleError(error, `deleting monitor ${id}`);
    throw error;
  }
};

// Settings (SMTP) related API calls
export const fetchSmtpSettings = async (): Promise<SMTPSettings | null> => {
  try {
    const response = await apiClient.get<SMTPSettings>('/settings/smtp');
    return response.data || null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
      return null; 
    }
    handleError(error, 'fetching SMTP settings');
    throw error;
  }
};

export const saveSmtpSettingsToApi = async (settings: SMTPSettings): Promise<SMTPSettings> => {
  try {
    const response = await apiClient.put<SMTPSettings>('/settings/smtp', settings);
    return response.data;
  } catch (error) {
    handleError(error, 'saving SMTP settings');
    throw error;
  }
};

// Custom Command related API calls
interface SendCommandPayload {
  targetId: string;
  targetType: 'computer' | 'group';
  command: string;
  scriptType: ScriptType;
}
export const sendCustomCommand = async (commandData: SendCommandPayload): Promise<CustomCommand | CustomCommand[]> => {
  try {
    const response = await apiClient.post<CustomCommand | CustomCommand[]>('/commands', commandData);
    return response.data;
  } catch (error) {
    handleError(error, 'sending custom command');
    throw error;
  }
};

export const fetchCommandHistory = async (): Promise<CustomCommand[]> => {
  try {
    const response = await apiClient.get<CustomCommand[]>('/commands');
    return response.data;
  } catch (error) {
    handleError(error, 'fetching command history');
    return [];
  }
};

// Procedure Execution related API calls
export const executeProcedure = async (procedureId: string, computerIds: string[]): Promise<ProcedureExecution[] | void> => {
  try {
    const response = await apiClient.post<ProcedureExecution[] | void>(`/procedures/${procedureId}/execute`, { computerIds });
    return response.data;
  } catch (error) {
    handleError(error, `executing procedure ${procedureId}`);
    throw error;
  }
};

export const fetchExecutions = async (params?: { procedureId?: string; computerId?: string }): Promise<ProcedureExecution[]> => {
  try {
    const response = await apiClient.get<ProcedureExecution[]>('/executions', { params });
    return response.data.sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
  } catch (error) {
    const contextParts = [];
    if (params?.procedureId) contextParts.push(`procedure ${params.procedureId}`);
    if (params?.computerId) contextParts.push(`computer ${params.computerId}`);
    const context = contextParts.length > 0 ? `for ${contextParts.join(' and ')}` : 'all';
    handleError(error, `fetching executions ${context}`);
    return [];
  }
};

// Monitor Execution Log related API calls
export const fetchMonitorLogs = async (): Promise<MonitorExecutionLog[]> => {
  try {
    const response = await apiClient.get<MonitorExecutionLog[]>('/monitor-logs');
    // Optionally sort or filter client-side if API doesn't, e.g., by timestamp
    return response.data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    handleError(error, 'fetching monitor logs');
    return [];
  }
};


export default apiClient;
