import { useState } from 'react';
import { attendanceApi } from '../api/attendance.api';
import { AttendanceRecord, AttendanceStatus, AttendanceSummary } from '../types/attendance';

export function useAttendance(employeeId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);

  const checkIn = async (code: string) => {
    try {
      setIsLoading(true);
      const record = await attendanceApi.checkIn(employeeId, code);
      setCurrentRecord(record.data);
      setStatus({ isClockedIn: true, lastCheckIn: record.data.checkIn });
      return record.data;
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkOut = async (code: string) => {
    try {
      setIsLoading(true);
      const record = await attendanceApi.checkOut(employeeId, code);
      setCurrentRecord(record.data);
      setStatus({ isClockedIn: false });
      return record.data;
    } catch (err: any) {
      setError(err.message || 'Failed to check out');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = async () => {
    try {
      setIsLoading(true);
      const status = await attendanceApi.getStatus(employeeId);
      setStatus(status.data);
      return status.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

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

// Usage example in a component:
/*
function AttendanceButton() {
  const { checkIn, checkOut, status, isLoading } = useAttendance('employee123');
  
  const handleClick = async () => {
    try {
      if (status?.isClockedIn) {
        await checkOut('CODE123');
      } else {
        await checkIn('CODE123');
      }
    } catch (err) {
      console.error('Attendance action failed:', err);
    }
  };

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Processing...' : status?.isClockedIn ? 'Check Out' : 'Check In'}
    </button>
  );
}
*/
