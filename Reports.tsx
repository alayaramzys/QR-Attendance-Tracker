import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter, BarChart3, TrendingUp, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { AttendanceChart } from '../components/dashboard/AttendanceChart';
import { Student, AttendanceRecord, ExportOptions } from '../types';
import { db } from '../lib/database';
import { excelService } from '../lib/excel-export';
import { generateChartData, calculateAttendanceStats } from '../lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, dateRange, selectedClass]);

  const loadData = async () => {
    try {
      const [studentsData, recordsData] = await Promise.all([
        db.findAll('students'),
        db.findAll('attendanceRecords'),
      ]);

      setStudents(studentsData);
      setAttendanceRecords(recordsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      return recordDate >= startDate && recordDate <= endDate;
    });

    if (selectedClass) {
      const classStudents = students.filter(s => s.class === selectedClass);
      const classStudentIds = classStudents.map(s => s.id);
      filtered = filtered.filter(record => classStudentIds.includes(record.studentId));
    }

    setFilteredRecords(filtered);
  };

  const handleExport = async () => {
    try {
      const exportOptions: ExportOptions = {
        dateRange: {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end),
        },
        students: selectedStudents.length > 0 ? selectedStudents : undefined,
        classes: selectedClass ? [selectedClass] : undefined,
        includePhotos: false,
        format: 'excel',
      };

      await excelService.exportAttendanceReport(students, filteredRecords, exportOptions);
      toast.success('Report exported successfully');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = calculateAttendanceStats(filteredRecords);
  const chartData = generateChartData(filteredRecords, 30);
  const classes = [...new Set(students.map(s => s.class))];

  // Calculate class-wise statistics
  const classStats = classes.map(className => {
    const classStudents = students.filter(s => s.class === className);
    const classRecords = filteredRecords.filter(record => 
      classStudents.some(s => s.id === record.studentId)
    );
    const classAttendanceStats = calculateAttendanceStats(classRecords);
    
    return {
      class: className,
      ...classAttendanceStats,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">Analyze attendance patterns and generate reports</p>
        </div>
        <Button
          onClick={() => setShowExportModal(true)}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex space-x-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div className="flex space-x-2 mt-2">
              <Button size="sm" variant="secondary" onClick={() => setQuickDateRange(7)}>
                Last 7 days
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setQuickDateRange(30)}>
                Last 30 days
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Classes</option>
              {classes.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={filterRecords}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.attendanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredRecords.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Date Range</p>
              <p className="text-sm font-semibold text-gray-900">
                {format(new Date(dateRange.start), 'MMM dd')} - {format(new Date(dateRange.end), 'MMM dd')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance Chart */}
      <AttendanceChart data={chartData} />

      {/* Class-wise Statistics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Class-wise Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Late Today
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classStats.map((classStat) => (
                <tr key={classStat.class}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {classStat.class}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {classStat.totalStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      classStat.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                      classStat.attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {classStat.attendanceRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {classStat.presentToday}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {classStat.absentToday}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {classStat.lateToday}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Attendance Report"
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Students (Optional)
                </label>
                <select
                  multiple
                  value={selectedStudents}
                  onChange={(e) => setSelectedStudents(Array.from(e.target.selectedOptions, option => option.value))}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  size={5}
                >
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.studentId})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple students. Leave empty to include all students.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Export Summary</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Date Range: {format(new Date(dateRange.start), 'MMM dd, yyyy')} - {format(new Date(dateRange.end), 'MMM dd, yyyy')}</li>
              <li>• Students: {selectedStudents.length > 0 ? `${selectedStudents.length} selected` : 'All students'}</li>
              <li>• Class: {selectedClass || 'All classes'}</li>
              <li>• Format: Excel (.xls)</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} leftIcon={<Download className="h-4 w-4" />}>
              Export Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};