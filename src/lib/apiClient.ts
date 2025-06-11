
import type { Computer, Procedure, ComputerGroup, CustomCommand, Monitor, SMTPSettings } from '@/types';
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

// TODO: Add other API functions as needed for Commands, Monitors, Settings etc.

export default apiClient;
