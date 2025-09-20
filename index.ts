// 🧑‍🎓 Represents a student enrolled in the system
export interface Student {
  readonly id: string;              // Internal unique ID
  studentId: string;                // External student code (e.g., STU001)
  firstName: string;
  lastName: string;
  email: string;
  class: string;                    // Class name (e.g., "10A")
  photo?: string;                   // Optional profile photo URL or base64
  createdAt: Date;
  updatedAt: Date;
}

// 📅 Represents a student's attendance for a given session
export interface AttendanceRecord {
  readonly id: string;
  studentId: string;                // Link to Student.studentId
  date: Date;                       // Date of the attendance
  status: AttendanceStatus;
  method: AttendanceMethod;
  sessionId?: string;              // Optional link to a class session
  notes?: string;                  // Optional note (e.g., reason for absence)
  createdAt: Date;
}

// 🕒 Represents a scheduled class session with QR integration
export interface ClassSession {
  readonly id: string;
  name: string;                     // Session name (e.g., "Math - Chapter 3")
  class: string;                    // Target class (e.g., "10A")
  date: Date;
  startTime: string;               // Format: "HH:mm"
  endTime: string;
  qrCode?: string;                 // Optional generated QR code for the session
  isActive: boolean;
  createdAt: Date;
}

// 👤 Represents a system user (admin, teacher, etc.)
export interface User {
  readonly id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

// 🏷️ Enumerations

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceMethod = 'manual' | 'qr_code' | 'bulk';
export type UserRole = 'admin' | 'teacher' | 'viewer';

// 📊 Aggregated attendance statistics for dashboard
export interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;         // 0 to 100 (percentage)
}

// 📈 Chart data per day for attendance graphs
export interface ChartData {
  date: string;                   // Format: YYYY-MM-DD
  present: number;
  absent: number;
  late: number;
  excused: number;
}

// 📁 Export configuration for Excel/CSV
export interface ExportOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  students?: string[];            // Optional list of student IDs
  classes?: string[];             // Optional list of class names
  includePhotos: boolean;         // Export student photos in sheet
  format: 'excel' | 'csv';
}
