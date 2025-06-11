import type { Computer, Procedure, ComputerGroup, CustomCommand, Monitor, SMTPSettings } from '@/types';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api', // Fallback for local dev if .env is not set up
  headers: {
    'Content-Type': 'application/json',
    // Authorization: `Bearer YOUR_API_TOKEN` // Uncomment and replace if your API requires auth
  },
});

// Generic error handler
const handleError = (error: unknown, context: string) => {
  console.error(`API Error (${context}):`, error);
  if (axios.isAxiosError(error)) {
    // Handle Axios-specific errors (e.g., network error, 4xx, 5xx)
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(`API Error (${context}): ${error.response.status} ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(`API Error (${context}): No response received from server. Is the API running at ${apiClient.defaults.baseURL}?`);
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`API Error (${context}): ${error.message}`);
    }
  } else {
    // Handle non-Axios errors
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
    return []; // Return empty array or re-throw, based on how you want to handle in UI
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
    throw error; // Re-throw to be caught by the form submission handler
  }
};

// Add other API functions as needed for Procedures, Groups, Commands, Monitors, Settings etc.
// Example:
// export const fetchProcedures = async (): Promise<Procedure[]> => {
//   const response = await apiClient.get<Procedure[]>('/procedures');
//   return response.data;
// };

// export const runProcedureOnComputers = async (procedureId: string, computerIds: string[]): Promise<any> => {
//   try {
//     const response = await apiClient.post('/procedures/run', { procedureId, computerIds });
//     return response.data;
//   } catch (error) {
//     handleError(error, 'running procedure');
//     throw error;
//   }
// };


export default apiClient;
