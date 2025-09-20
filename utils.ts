import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { AttendanceRecord, AttendanceStats, ChartData } from '../types';

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  } else if (isYesterday(dateObj)) {
    return 'Yesterday';
  } else {
    return format(dateObj, 'MMM dd, yyyy');
  }
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'h:mm aa');
}

export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  const todayRecords = records.filter(record => 
    isToday(new Date(record.date))
  );

  const uniqueStudents = new Set(records.map(r => r.studentId));
  const totalStudents = uniqueStudents.size;
  
  const presentToday = todayRecords.filter(r => r.status === 'present').length;
  const absentToday = todayRecords.filter(r => r.status === 'absent').length;
  const lateToday = todayRecords.filter(r => r.status === 'late').length;
  
  const totalAttendance = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const attendanceRate = records.length > 0 ? (totalAttendance / records.length) * 100 : 0;

  return {
    totalStudents,
    presentToday,
    absentToday,
    lateToday,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
  };
}

export function generateChartData(records: AttendanceRecord[], days: number = 7): ChartData[] {
  const chartData: ChartData[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayRecords = records.filter(record => 
      format(new Date(record.date), 'yyyy-MM-dd') === dateStr
    );
    
    chartData.push({
      date: format(date, 'MMM dd'),
      present: dayRecords.filter(r => r.status === 'present').length,
      absent: dayRecords.filter(r => r.status === 'absent').length,
      late: dayRecords.filter(r => r.status === 'late').length,
      excused: dayRecords.filter(r => r.status === 'excused').length,
    });
  }
  
  return chartData;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'present':
      return 'bg-success-100 text-success-800 border-success-200';
    case 'absent':
      return 'bg-error-100 text-error-800 border-error-200';
    case 'late':
      return 'bg-warning-100 text-warning-800 border-warning-200';
    case 'excused':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'present':
      return '✓';
    case 'absent':
      return '✗';
    case 'late':
      return '⏰';
    case 'excused':
      return '📝';
    default:
      return '?';
  }
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateStudentId(studentId: string): boolean {
  return studentId.length >= 3 && /^[A-Z0-9]+$/i.test(studentId);
}