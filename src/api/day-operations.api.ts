import axios from 'axios';

// Use the same base URL as other API calls
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
import { DayOperationsFormData } from '@/components/DayOperationsModal/DayOperationsModal';

export const dayOperationsAPI = {
  openDay: async (formData: DayOperationsFormData) => {
    return axios.post(`${API_BASE_URL}/day-operations/open`, formData);
  },
  
  closeDay: async (formData: DayOperationsFormData) => {
    return axios.post(`${API_BASE_URL}/day-operations/close`, formData);
  },
  
  getCurrentDayStatus: async () => {
    return axios.get(`${API_BASE_URL}/day-operations/status`);
  }
};
