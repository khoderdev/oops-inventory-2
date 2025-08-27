import { useState, useCallback } from 'react';
import { attendanceApi } from '../api/attendance.api';
import { AttendanceRecord, AttendanceStatus } from '../types/attendance';

export function useAttendance(employeeId: string) {
  console.log('🔍 useAttendance: Called with employeeId:', employeeId, 'type:', typeof employeeId);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);

  const checkIn = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const record = await attendanceApi.checkIn(employeeId, code);
      setCurrentRecord(record.data);
      setStatus({ isCheckedIn: true, lastCheckIn: record.data.checkIn });
      return record.data;
    } catch (err: any) {
      // Extract error message from API response
      let errorMessage = 'Failed to check in';
      if (err.response?.data) {
        const responseData = err.response.data;
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const checkOut = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const record = await attendanceApi.checkOut(employeeId, code);
      setCurrentRecord(record.data);
      setStatus({ isCheckedIn: false });
      return record.data;
    } catch (err: any) {
      // Extract error message from API response
      let errorMessage = 'Failed to check out';
      if (err.response?.data) {
        const responseData = err.response.data;
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const getStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const apiResponse = await attendanceApi.getStatus(employeeId);

      const newStatus = { isCheckedIn: apiResponse.data.data.isCheckedIn, lastCheckIn: apiResponse.data.data.lastCheckIn };
      setStatus(newStatus);

      return apiResponse.data;
    } catch (err: any) {
      // Extract error message from API response
      let errorMessage = 'Failed to get status';
      if (err.response?.data) {
        const responseData = err.response.data;
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  return {
    checkIn,
    checkOut,
    getStatus,
    status,
    currentRecord,
    isLoading,
    error,
  };
}