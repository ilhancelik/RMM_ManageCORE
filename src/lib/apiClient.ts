
import type { Computer, Procedure, ComputerGroup, CustomCommand, Monitor, SMTPSettings, ProcedureExecution, ScriptType, MonitorExecutionLog } from '@/types';
import axios from 'axios';

// This apiClient is no longer used for core data operations as we've reverted to mockData.
// It's kept here for potential future re-integration or for non-core API calls if any.
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api', // This URL is now irrelevant for mock data
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleError = (error: unknown, context: string) => {
  // This error handler would have been for actual API calls.
  // For mock data, errors are typically handled differently or are less common.
  console.error(`Mock Data Simulating API Error (${context}):`, error);
  if (axios.isAxiosError(error)) {
    // ... (original error handling logic for Axios, largely irrelevant now)
    throw new Error(`Simulated API Error (${context}): ${error.message}`);
  } else {
    throw new Error(`An unexpected error occurred (${context}): ${String(error)}`);
  }
};

// All functions that made API calls are removed.
// Pages will now import directly from '@/lib/mockData.ts'

export default apiClient; // Exporting the instance, though it won't be used for core CRUD.
