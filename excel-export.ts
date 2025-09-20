import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Student, AttendanceRecord, ExportOptions } from '../types';

interface ScannedStudent {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  class: string;
  email?: string;
  scannedAt: Date;
  status: 'present' | 'absent';
}

class ExcelExportService {
  async exportAttendanceReport(
    students: Student[],
    attendanceRecords: AttendanceRecord[],
    options: ExportOptions
  ): Promise<void> {
    try {
      console.log('Starting export with data:', {
        studentsCount: students.length,
        recordsCount: attendanceRecords.length,
        options
      });

      const workbook = XLSX.utils.book_new();

      // Filter data based on options
      const filteredStudents = options.students?.length 
        ? students.filter(s => options.students!.includes(s.id))
        : students;

      const filteredRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        const inDateRange = recordDate >= options.dateRange.start && recordDate <= options.dateRange.end;
        const studentIncluded = !options.students?.length || options.students.includes(record.studentId);
        return inDateRange && studentIncluded;
      });

      console.log('Filtered data:', {
        filteredStudents: filteredStudents.length,
        filteredRecords: filteredRecords.length
      });

      // Create summary sheet
      const summaryData = this.createSummarySheet(filteredStudents, filteredRecords);
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Create detailed attendance sheet
      const detailedData = this.createDetailedSheet(filteredStudents, filteredRecords);
      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Attendance');

      // Create student roster sheet
      const rosterData = this.createRosterSheet(filteredStudents);
      const rosterSheet = XLSX.utils.json_to_sheet(rosterData);
      XLSX.utils.book_append_sheet(workbook, rosterSheet, 'Student Roster');

      // Apply styling and formatting
      this.applyExcelFormatting(workbook);

      // Generate filename with .xls extension for secure data
      const startDate = format(options.dateRange.start, 'yyyy-MM-dd');
      const endDate = format(options.dateRange.end, 'yyyy-MM-dd');
      const filename = `Attendance_Report_${startDate}_to_${endDate}.xls`;

      console.log('Writing secure XLS file:', filename);

      // Write and download file in XLS format for data security
      XLSX.writeFile(workbook, filename, { 
        bookType: 'xls',
        compression: true,
        Props: {
          Title: 'Attendance Report',
          Subject: 'Student Attendance Data',
          Author: 'Attendance Management System',
          CreatedDate: new Date()
        }
      });
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error in exportAttendanceReport:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportScannedAttendance(scannedStudents: ScannedStudent[]): Promise<void> {
    try {
      console.log('Exporting scanned attendance data:', scannedStudents.length, 'students');

      const workbook = XLSX.utils.book_new();

      // Create attendance data with enhanced security
      const attendanceData = scannedStudents.map(student => ({
        'Date': format(student.scannedAt, 'yyyy-MM-dd'),
        'Time': format(student.scannedAt, 'HH:mm:ss'),
        'Student ID': student.studentId,
        'First Name': student.firstName,
        'Last Name': student.lastName,
        'Full Name': `${student.firstName} ${student.lastName}`,
        'Class': student.class,
        'Email': student.email || '',
        'Status': student.status.charAt(0).toUpperCase() + student.status.slice(1),
        'Scan Method': 'External Badge QR',
        'Recorded At': format(student.scannedAt, 'yyyy-MM-dd HH:mm:ss'),
        'Session Type': 'External Badge Scan',
      }));

      const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Scanned Attendance');

      // Create summary data
      const presentCount = scannedStudents.filter(s => s.status === 'present').length;
      const absentCount = scannedStudents.filter(s => s.status === 'absent').length;
      const totalCount = scannedStudents.length;
      const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0.0';

      const summaryData = [
        { 'Metric': 'Total Students Scanned', 'Value': totalCount },
        { 'Metric': 'Present', 'Value': presentCount },
        { 'Metric': 'Absent', 'Value': absentCount },
        { 'Metric': 'Attendance Rate (%)', 'Value': attendanceRate },
        { 'Metric': 'Scan Date', 'Value': format(new Date(), 'yyyy-MM-dd') },
        { 'Metric': 'Scan Time', 'Value': format(new Date(), 'HH:mm:ss') },
        { 'Metric': 'Export Method', 'Value': 'External Badge Scanner' },
        { 'Metric': 'File Format', 'Value': 'Secure XLS' },
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Create class breakdown
      const classCounts = scannedStudents.reduce((acc, student) => {
        acc[student.class] = (acc[student.class] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const classData = Object.entries(classCounts).map(([className, count]) => ({
        'Class': className,
        'Total Students': count,
        'Present': scannedStudents.filter(s => s.class === className && s.status === 'present').length,
        'Absent': scannedStudents.filter(s => s.class === className && s.status === 'absent').length,
      }));

      const classSheet = XLSX.utils.json_to_sheet(classData);
      XLSX.utils.book_append_sheet(workbook, classSheet, 'Class Breakdown');

      // Apply formatting
      this.applyExcelFormatting(workbook);

      // Generate secure filename
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `External_Badge_Attendance_${timestamp}.xls`;

      console.log('Writing secure scanned attendance file:', filename);
      
      // Write secure XLS file
      XLSX.writeFile(workbook, filename, { 
        bookType: 'xls',
        compression: true,
        Props: {
          Title: 'External Badge Attendance',
          Subject: 'Scanned Student Attendance Data',
          Author: 'Attendance Management System',
          CreatedDate: new Date()
        }
      });
      
      console.log('Scanned attendance export completed successfully');
    } catch (error) {
      console.error('Error exporting scanned attendance:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createSummarySheet(students: Student[], records: AttendanceRecord[]) {
    console.log('Creating summary sheet for', students.length, 'students');
    
    return students.map(student => {
      const studentRecords = records.filter(r => r.studentId === student.id);
      const totalDays = studentRecords.length;
      const presentDays = studentRecords.filter(r => r.status === 'present').length;
      const lateDays = studentRecords.filter(r => r.status === 'late').length;
      const absentDays = studentRecords.filter(r => r.status === 'absent').length;
      const excusedDays = studentRecords.filter(r => r.status === 'excused').length;
      const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(1) : '0.0';

      return {
        'Student ID': student.studentId,
        'First Name': student.firstName,
        'Last Name': student.lastName,
        'Class': student.class,
        'Email': student.email,
        'Total Days': totalDays,
        'Present': presentDays,
        'Late': lateDays,
        'Absent': absentDays,
        'Excused': excusedDays,
        'Attendance Rate (%)': attendanceRate,
        'Created Date': format(new Date(student.createdAt), 'yyyy-MM-dd'),
      };
    });
  }

  private createDetailedSheet(students: Student[], records: AttendanceRecord[]) {
    console.log('Creating detailed sheet for', records.length, 'records');
    
    const studentMap = new Map(students.map(s => [s.id, s]));
    
    return records.map(record => {
      const student = studentMap.get(record.studentId);
      return {
        'Date': format(new Date(record.date), 'yyyy-MM-dd'),
        'Student ID': student?.studentId || 'Unknown',
        'First Name': student?.firstName || 'Unknown',
        'Last Name': student?.lastName || 'Unknown',
        'Class': student?.class || 'Unknown',
        'Email': student?.email || 'Unknown',
        'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
        'Method': record.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        'Notes': record.notes || '',
        'Session ID': record.sessionId || '',
        'Recorded At': format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      };
    });
  }

  private createRosterSheet(students: Student[]) {
    console.log('Creating roster sheet for', students.length, 'students');
    
    return students.map(student => ({
      'Student ID': student.studentId,
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Email': student.email,
      'Class': student.class,
      'Created Date': format(new Date(student.createdAt), 'yyyy-MM-dd'),
      'Updated Date': format(new Date(student.updatedAt), 'yyyy-MM-dd'),
    }));
  }

  private applyExcelFormatting(workbook: XLSX.WorkBook) {
    // Add conditional formatting for attendance status
    Object.keys(workbook.Sheets).forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      
      // Set column widths
      sheet['!cols'] = Array(range.e.c + 1).fill({ width: 15 });
      
      // Set header row formatting
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (sheet[cellRef]) {
          sheet[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: '3B82F6' } },
          };
        }
      }
    });
  }

  async exportStudentTemplate(): Promise<void> {
    try {
      const templateData = [
        {
          'Student ID': 'STU001',
          'First Name': 'John',
          'Last Name': 'Doe',
          'Email': 'john.doe@school.edu',
          'Class': 'Grade 10A',
        },
        {
          'Student ID': 'STU002',
          'First Name': 'Jane',
          'Last Name': 'Smith',
          'Email': 'jane.smith@school.edu',
          'Class': 'Grade 10B',
        },
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths for better readability
      worksheet['!cols'] = [
        { width: 15 }, // Student ID
        { width: 15 }, // First Name
        { width: 15 }, // Last Name
        { width: 25 }, // Email
        { width: 15 }, // Class
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Template');
      
      // Export as secure XLS format
      XLSX.writeFile(workbook, 'Student_Import_Template.xls', { 
        bookType: 'xls',
        Props: {
          Title: 'Student Import Template',
          Subject: 'Template for importing student data',
          Author: 'Attendance Management System'
        }
      });
      
      console.log('Student template exported successfully as secure XLS');
    } catch (error) {
      console.error('Error exporting student template:', error);
      throw new Error('Failed to export student template');
    }
  }

  async importStudentsFromExcel(file: File): Promise<Student[]> {
    return new Promise((resolve, reject) => {
      console.log('Starting import from file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          console.log('File read successfully, data length:', data.length);
          
          const workbook = XLSX.read(data, { type: 'array' });
          console.log('Workbook sheets:', workbook.SheetNames);
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log('Raw JSON data:', jsonData);

          if (jsonData.length === 0) {
            reject(new Error('The file appears to be empty or has no data'));
            return;
          }

          const students: Student[] = jsonData.map((row: any, index: number) => {
            console.log(`Processing row ${index + 1}:`, row);
            
            // Handle different possible column names (case-insensitive)
            const getColumnValue = (row: any, possibleNames: string[]): string => {
              for (const name of possibleNames) {
                if (row[name] !== undefined && row[name] !== null) {
                  return String(row[name]).trim();
                }
                // Try case-insensitive match
                const keys = Object.keys(row);
                const matchedKey = keys.find(key => 
                  key.toLowerCase() === name.toLowerCase()
                );
                if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                  return String(row[matchedKey]).trim();
                }
              }
              return '';
            };

            const studentId = getColumnValue(row, ['Student ID', 'StudentID', 'ID', 'student_id', 'id']);
            const firstName = getColumnValue(row, ['First Name', 'FirstName', 'first_name', 'fname']);
            const lastName = getColumnValue(row, ['Last Name', 'LastName', 'last_name', 'lname']);
            const email = getColumnValue(row, ['Email', 'email', 'Email Address', 'email_address']);
            const className = getColumnValue(row, ['Class', 'class', 'Grade', 'grade', 'Class Name']);

            const student: Student = {
              id: crypto.randomUUID(),
              studentId,
              firstName,
              lastName,
              email,
              class: className,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            console.log(`Created student object:`, student);
            return student;
          });

          // Filter out completely empty rows
          const validStudents = students.filter(student => 
            student.studentId || student.firstName || student.lastName || student.email || student.class
          );

          console.log(`Filtered students: ${validStudents.length} out of ${students.length}`);

          if (validStudents.length === 0) {
            reject(new Error('No valid student data found in the file. Please check the column headers and data format.'));
            return;
          }

          // Validate required fields
          const studentsWithMissingFields = validStudents.filter(s => 
            !s.firstName || !s.lastName || !s.studentId || !s.email || !s.class
          );

          if (studentsWithMissingFields.length > 0) {
            console.warn(`${studentsWithMissingFields.length} students have missing required fields`);
          }

          console.log('Import completed successfully, returning', validStudents.length, 'students');
          resolve(validStudents);
        } catch (error) {
          console.error('Error parsing file:', error);
          reject(new Error(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure it's a valid Excel or CSV file with the correct format.`));
        }
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Error reading file. Please try again.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}

export const excelService = new ExcelExportService();